import { safeParse } from "valibot";

import type {
  Collision,
  CommentEventHandlerMap,
  FormattedComment,
  FrameActiveState,
  IComment,
  InputFormat,
  IPluginList,
  IRenderer,
  Options,
  Position,
  Timeline,
} from "@/@types/";
import { ZFormattedComment } from "@/@types/";
import { FlashComment } from "@/comments/";
import type { CommentInstanceContext } from "@/contexts/";
import { createNicoScripts, ImageCacheContext } from "@/contexts/";
import { defaultConfig, defaultOptions } from "@/definition/config";
import { initConfig } from "@/definition/initConfig";
import { InvalidOptionError } from "@/errors/";
import { EventHandler } from "@/eventHandler";
import convert2formattedComment from "@/inputParser";
import { createRenderer } from "@/renderer";
import typeGuard from "@/typeGuard";
import {
  arrayEqual,
  buildAtButtonComment,
  changeCALayer,
  getConfig,
  hex2rgb,
  isBanActive,
  isFlashComment,
  isReverseActive,
  parseFont,
  processFixedComment,
  processMovableComment,
} from "@/utils";
import { getLazyCommentLookahead } from "@/utils/comment";
import { createCommentInstance } from "@/utils/plugins";
import { RangeCacheContext } from "@/utils/rangeCache";

import * as internal from "./internal";

const EMPTY_TIMELINE = Object.freeze([]) as readonly IComment[];
const BAN_FRAME_POSITION_RESOLUTION_BUDGET = 256;
const TIMELINE_COMMENT_SORT = (a: IComment, b: IComment) =>
  Number(a.owner) - Number(b.owner) || a.index - b.index;
const isFiniteVpos = (vpos: number) => Number.isFinite(vpos);
const isFinitePosition = (pos: Position) =>
  Number.isFinite(pos.x) && Number.isFinite(pos.y);
const rejectInvalidCommentPosition = (comment: IComment) => {
  comment.comment.invisible = true;
  try {
    comment.invisible = true;
  } catch (_e) {
    // Built-in comments expose invisible as a getter over comment.invisible.
  }
  comment.posY = 0;
};

const toIntegerOrInfinity = (value: number) => {
  if (Number.isNaN(value) || value === 0) return 0;
  if (!Number.isFinite(value)) return value;
  return Math.trunc(value);
};

const getSliceBounds = (length: number, start: number, end?: number) => {
  let startIndex = toIntegerOrInfinity(start);
  let endIndex = end === undefined ? length : toIntegerOrInfinity(end);

  if (startIndex === -Infinity) {
    startIndex = 0;
  } else if (startIndex < 0) {
    startIndex = Math.max(length + startIndex, 0);
  } else {
    startIndex = Math.min(startIndex, length);
  }

  if (endIndex === -Infinity) {
    endIndex = 0;
  } else if (endIndex < 0) {
    endIndex = Math.max(length + endIndex, 0);
  } else {
    endIndex = Math.min(endIndex, length);
  }

  if (endIndex < startIndex) {
    endIndex = startIndex;
  }

  return { startIndex, endIndex };
};

const hasNakaComment = (items: readonly IComment[]) => {
  let hasNaka = false;
  for (const item of items) {
    if (item.loc === "naka") {
      hasNaka = true;
      break;
    }
  }
  return hasNaka;
};

const areCommentsSortedByVpos = (
  items: readonly IComment[],
  previous?: IComment,
) => {
  let previousComment = previous;
  for (const item of items) {
    if (!item) continue;
    if (previousComment && previousComment.vpos > item.vpos) {
      return false;
    }
    previousComment = item;
  }
  return true;
};

const rendererHasVideoSurface = (renderer: IRenderer) =>
  "video" in renderer &&
  (renderer as IRenderer & { readonly video?: unknown }).video != null;

const getRendererClear = (renderer: IRenderer) =>
  (renderer as IRenderer & { clear?: () => void }).clear;

const removeUndefinedConfigValues = (
  config: NonNullable<Options["config"]>,
): NonNullable<Options["config"]> =>
  Object.fromEntries(
    Object.entries(config).filter(([, value]) => value !== undefined),
  ) as NonNullable<Options["config"]>;

type DrawCanvasProfile = {
  triggerHandler: number;
  drawVideo: number;
  drawPlugins: number;
  drawCollision: number;
  drawComments: number;
  drawFPS: number;
  drawCommentCount: number;
  flush: number;
  total: number;
};

class NiconiComments {
  public enableLegacyPiP: boolean;
  public showCollision: boolean;
  public showFPS: boolean;
  public showCommentCount: boolean;
  private lastVpos: number;
  private lastEventVpos: number;
  private lastCursor?: Position;
  private lastFrameBanActive: boolean;
  private frameDirty: boolean;
  private get lastVposInt() {
    return Math.floor(this.lastVpos);
  }
  private _cachedSplit: {
    vpos: number;
    hasNaka: boolean;
  } | null = null;
  private lazyCommentOrderSortedByVpos: boolean;
  private nextUnprocessedCommentIndex: number;
  private commentArrayIndexMap: WeakMap<IComment, number>;
  private processedCommentIndex: number;
  private comments: IComment[];
  private destroyed = false;
  private readonly renderer: IRenderer;
  private readonly collision: Collision;
  private readonly timeline: Timeline;
  private readonly ctx: CommentInstanceContext;
  private readonly eventHandler: EventHandler;
  private plugins: IPluginList = [];
  static typeGuard = typeGuard;
  static default = NiconiComments;
  static readonly BAN_FRAME_POSITION_RESOLUTION_BUDGET =
    BAN_FRAME_POSITION_RESOLUTION_BUDGET;
  static FlashComment = {
    condition: isFlashComment,
    class: FlashComment,
  };
  static internal = internal;

  /**
   * NiconiComments Constructor
   * @param renderer 描画対象のキャンバス
   * @param data 描画用のコメント
   * @param initOptions 初期化オプション
   */
  constructor(
    _renderer: IRenderer | HTMLCanvasElement,
    data: InputFormat,
    initOptions: Options = {},
  ) {
    const constructorStart = performance.now();
    initConfig();
    if (!typeGuard.config.initOptions(initOptions))
      throw new InvalidOptionError();

    const options = Object.assign({}, defaultOptions, initOptions);
    const config = Object.assign(
      {},
      defaultConfig,
      removeUndefinedConfigValues(options.config ?? {}),
    );

    const nicoScripts = createNicoScripts();
    const imageCache = new ImageCacheContext();
    const rangeCache = new RangeCacheContext();

    this.ctx = { config, options, nicoScripts, imageCache, rangeCache };
    this.eventHandler = new EventHandler();

    let renderer = _renderer;
    if (renderer instanceof HTMLCanvasElement) {
      renderer = createRenderer(renderer, options.video);
    } else if (options.video) {
      console.warn(
        "options.video is ignored because renderer is not HTMLCanvasElement",
      );
    }

    this.renderer = renderer;
    this._log(`renderer: ${renderer.rendererName}`);
    this.renderer.setLineWidth(getConfig(config.contextLineWidth, false));
    const rendererSize = this.renderer.getSize();
    this.renderer.setScale(
      rendererSize.width / config.canvasWidth,
      rendererSize.height / config.canvasHeight,
    );

    let formatType = options.format;

    //Deprecated Warning
    if (options.formatted) {
      console.warn(
        "Deprecated: options.formatted is no longer recommended. Please use options.format. https://xpadev-net.github.io/niconicomments/#p_format",
      );
    }
    if (formatType === "default") {
      formatType = options.formatted ? "formatted" : "legacy";
    }

    if (options.useLegacy) {
      console.warn(
        "Deprecated: options.useLegacy is no longer recommended. Please use options.mode. https://xpadev-net.github.io/niconicomments/#p_mode",
      );
    }
    if (options.mode === "default" && options.useLegacy) {
      options.mode = "html5";
    }

    const parsedData = convert2formattedComment(data, formatType);
    this.showCollision = options.showCollision;
    this.showFPS = options.showFPS;
    this.showCommentCount = options.showCommentCount;
    this.enableLegacyPiP = options.enableLegacyPiP;

    this.timeline = {};
    this.collision = {
      ue: {},
      shita: {},
      left: {},
      right: {},
    };
    this.lastVpos = -1;
    this.lastEventVpos = -1;
    this.lastFrameBanActive = false;
    this.frameDirty = true;
    this.lazyCommentOrderSortedByVpos = true;
    this.nextUnprocessedCommentIndex = 0;
    this.commentArrayIndexMap = new WeakMap();
    this.processedCommentIndex = -1;

    this.comments = this.preRendering(parsedData);
    this._rebuildCommentArrayIndex(this.comments);
    if (!this.ctx.options.lazy || !this.lazyCommentOrderSortedByVpos) {
      this._advanceNextUnprocessedCommentIndex();
    }

    this._log(
      `constructor complete: ${performance.now() - constructorStart}ms`,
    );
  }

  public destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const comment of this.comments) {
      try {
        comment.destroy?.();
      } catch (e) {
        console.error("Failed to destroy comment", e);
      }
    }
    this.comments = [];
    this.commentArrayIndexMap = new WeakMap();
    this._clearTimeline();
    this._clearCollision();
    this.ctx.rangeCache.reset();
    for (const plugin of this.plugins) {
      try {
        plugin.instance.destroy?.();
      } catch (e) {
        console.error("Failed to destroy plugin", e);
      }
      try {
        plugin.canvas.destroy();
      } catch (e) {
        console.error("Failed to destroy plugin canvas", e);
      }
    }
    this.plugins = [];
    this.ctx.imageCache.reset();
    this.renderer.destroy();
  }

  private _clearTimeline() {
    for (const key of Object.keys(this.timeline)) {
      delete this.timeline[Number(key)];
    }
  }

  private _clearCollision() {
    for (const collision of [
      this.collision.ue,
      this.collision.shita,
      this.collision.left,
      this.collision.right,
    ]) {
      for (const key of Object.keys(collision)) {
        delete collision[Number(key)];
      }
    }
  }

  private _rebuildCommentArrayIndex(comments: IComment[]) {
    this.commentArrayIndexMap = new WeakMap();
    for (let i = 0, n = comments.length; i < n; i++) {
      const comment = comments[i];
      if (!comment) continue;
      this.commentArrayIndexMap.set(comment, i);
    }
  }

  private _advanceNextUnprocessedCommentIndex(
    comments = this.comments,
    scanBudget?: number,
  ) {
    const scanEndIndex =
      scanBudget === undefined
        ? comments.length
        : Math.min(
            comments.length,
            this.nextUnprocessedCommentIndex + scanBudget,
          );
    while (this.nextUnprocessedCommentIndex < scanEndIndex) {
      const comment = comments[this.nextUnprocessedCommentIndex];
      if (comment && !isFiniteVpos(comment.vpos)) {
        rejectInvalidCommentPosition(comment);
        this.nextUnprocessedCommentIndex++;
        continue;
      }
      if (comment && !comment.invisible && comment.posY < 0) {
        break;
      }
      this.nextUnprocessedCommentIndex++;
    }
    return this.nextUnprocessedCommentIndex;
  }

  /**
   * 事前に当たり判定を考慮してコメントの描画場所を決定する
   * @param _rawData コメントデータ
   * @returns コメントのインスタンス配列
   */
  private preRendering(_rawData: FormattedComment[]) {
    let rawData = _rawData;
    const preRenderingStart = performance.now();
    if (this.ctx.options.keepCA) {
      rawData = changeCALayer(rawData, this.ctx.config);
    }
    let instances = rawData.reduce<IComment[]>((pv, val, index) => {
      pv.push(createCommentInstance(val, this.renderer, index, this.ctx));
      return pv;
    }, []);

    const plugins: IPluginList = [];
    for (const plugin of this.ctx.config.plugins) {
      try {
        const canvas = this.renderer.getCanvas();
        const pluginInstance = new plugin(canvas, instances);
        plugins.push({
          canvas,
          instance: pluginInstance,
        });
        if (pluginInstance.transformComments) {
          instances = pluginInstance.transformComments(instances);
        }
      } catch (_e) {
        console.error("Failed to init plugin");
      }
    }

    this.plugins = plugins;
    this.lazyCommentOrderSortedByVpos = areCommentsSortedByVpos(instances);
    if (!this.ctx.options.lazy || !this.lazyCommentOrderSortedByVpos) {
      // Non-lazy rendering and lazy fallback both need final plugin output.
      this.getCommentPos(instances, instances.length);
      this.sortTimelineComment();
    }
    this._log(
      `preRendering complete: ${performance.now() - preRenderingStart}ms`,
    );
    return instances;
  }

  /**
   * 計算された描画サイズをもとに各コメントの配置位置を決定する
   * @param data コメントデータ
   * @param end 終了インデックス
   */
  private getCommentPos(
    data: IComment[],
    end: number,
    touchedTimeline?: Set<number>,
    advanceBudget?: number,
  ) {
    const getCommentPosStart = performance.now();
    const startIndex = this.processedCommentIndex + 1;
    if (startIndex >= end) return;
    for (let i = startIndex; i < end; i++) {
      const comment = data[i];
      if (!comment) continue;
      this.processedCommentIndex = i;
      if (comment.invisible || comment.posY > -1) continue;
      if (comment.loc === "naka") {
        processMovableComment(
          comment,
          this.collision,
          this.timeline,
          false,
          this.ctx.config,
          touchedTimeline,
        );
      } else {
        processFixedComment(
          comment,
          this.collision[comment.loc],
          this.timeline,
          false,
          this.ctx.config,
          touchedTimeline,
        );
      }
    }
    this.nextUnprocessedCommentIndex = Math.max(
      this.nextUnprocessedCommentIndex,
      this.processedCommentIndex + 1,
    );
    this._advanceNextUnprocessedCommentIndex(data, advanceBudget);
    this._log(
      `getCommentPos complete: ${performance.now() - getCommentPosStart}ms`,
    );
  }

  private resolveLazyCommentWindow(vpos: number, resolutionBudget?: number) {
    if (!this.ctx.options.lazy) return false;
    const scanStartIndex = this.nextUnprocessedCommentIndex;
    const scanEndIndex =
      resolutionBudget === undefined
        ? this.comments.length
        : Math.min(this.comments.length, scanStartIndex + resolutionBudget);
    const startIndex = this._advanceNextUnprocessedCommentIndex(
      this.comments,
      resolutionBudget,
    );
    if (startIndex >= scanEndIndex) return false;
    const resolveUntil =
      vpos + getLazyCommentLookahead(this.ctx.config.canvasWidth);
    let endIndex = startIndex - 1;
    for (let i = startIndex; i < scanEndIndex; i++) {
      const comment = this.comments[i];
      if (comment && !isFiniteVpos(comment.vpos)) {
        rejectInvalidCommentPosition(comment);
        continue;
      }
      if (!comment || comment.invisible || comment.posY > -1) {
        continue;
      }
      if (comment.vpos <= resolveUntil) {
        endIndex = i;
      } else if (this.lazyCommentOrderSortedByVpos) {
        break;
      }
    }
    if (endIndex < startIndex) {
      return false;
    }
    const touchedTimeline = new Set<number>();
    this.getCommentPos(
      this.comments,
      Math.min(endIndex + 1, scanEndIndex),
      touchedTimeline,
      resolutionBudget === undefined ? undefined : 0,
    );
    this.sortTimelineComment(touchedTimeline);
    return true;
  }

  /**
   * 投稿者コメントを前に移動
   */
  private sortTimelineComment(vposes?: Iterable<number | string>) {
    const sortCommentStart = performance.now();
    const targetVposes = vposes ?? Object.keys(this.timeline);
    for (const vpos of targetVposes) {
      const item = this.timeline[Number(vpos)];
      if (!item) continue;
      item.sort(TIMELINE_COMMENT_SORT);
    }
    this._log(`parseData complete: ${performance.now() - sortCommentStart}ms`);
  }

  /**
   * 動的にコメント追加する
   * ※すでに存在するコメントの位置はvposに関係なく更新されません
   * @param rawComments コメントデータ
   */
  public addComments(...rawComments: FormattedComment[]) {
    const validComments = rawComments.reduce<FormattedComment[]>((pv, val) => {
      const parsedComment = safeParse(ZFormattedComment, val);
      if (parsedComment.success) pv.push(parsedComment.output);
      return pv;
    }, []);
    if (validComments.length === 0) return;
    this.ctx.rangeCache.reset();
    const touchedTimeline = new Set<number>();
    const comments = validComments.reduce<IComment[]>((pv, val, index) => {
      pv.push(
        createCommentInstance(
          val,
          this.renderer,
          this.comments.length + index,
          this.ctx,
        ),
      );
      return pv;
    }, []);
    for (const plugin of this.plugins) {
      try {
        plugin.instance.addComments?.(comments);
      } catch (e) {
        console.error("Failed to add comments", e);
      }
    }
    for (const comment of comments) {
      if (comment.invisible) continue;
      if (comment.loc === "naka") {
        processMovableComment(
          comment,
          this.collision,
          this.timeline,
          false,
          this.ctx.config,
          touchedTimeline,
        );
      } else {
        processFixedComment(
          comment,
          this.collision[comment.loc],
          this.timeline,
          false,
          this.ctx.config,
          touchedTimeline,
        );
      }
    }
    this.comments.push(...comments);
    this.nextUnprocessedCommentIndex = Math.min(
      this.nextUnprocessedCommentIndex,
      this.comments.length - comments.length,
    );
    const baseOffset = this.comments.length - comments.length;
    for (let i = 0, n = comments.length; i < n; i++) {
      const comment = comments[i];
      if (!comment) continue;
      this.commentArrayIndexMap.set(comment, baseOffset + i);
    }
    if (!this.ctx.options.lazy) {
      const prePushTail = baseOffset - 1;
      if (this.processedCommentIndex < prePushTail) {
        this.getCommentPos(this.comments, prePushTail + 1, touchedTimeline);
      }
      this.processedCommentIndex = Math.max(
        this.processedCommentIndex,
        this.comments.length - 1,
      );
    }
    this._advanceNextUnprocessedCommentIndex();
    this.sortTimelineComment(touchedTimeline);
    this._cachedSplit = null;
  }

  /**
   * キャンバスを描画する
   * @param vpos 動画の現在位置の100倍 ニコニコから吐き出されるコメントの位置情報は主にこれ
   * @param forceRendering キャッシュを使用せずに再描画を強制するか
   * @param cursor カーソルの位置
   * @returns 再描画されたか
   */
  public drawCanvas(
    vpos: number,
    forceRendering = false,
    cursor?: Position,
  ): boolean {
    if (!isFiniteVpos(vpos)) return false;
    const profile: DrawCanvasProfile | undefined = this.ctx.options.debug
      ? {
          triggerHandler: 0,
          drawVideo: 0,
          drawPlugins: 0,
          drawCollision: 0,
          drawComments: 0,
          drawFPS: 0,
          drawCommentCount: 0,
          flush: 0,
          total: 0,
        }
      : undefined;
    const setProfile = <K extends keyof DrawCanvasProfile>(
      key: K,
      start: number,
    ) => {
      if (profile) {
        profile[key] = performance.now() - start;
      }
    };

    const vposInt = Math.floor(vpos);
    const drawCanvasStart = performance.now();
    const requiresVideoRedraw = rendererHasVideoSurface(this.renderer);
    const rendererNeedsRedraw = this.renderer.needsRedraw?.() ?? false;
    const cursorChanged =
      (cursor === undefined) !== (this.lastCursor === undefined) ||
      (cursor !== undefined &&
        this.lastCursor !== undefined &&
        (cursor.x !== this.lastCursor.x || cursor.y !== this.lastCursor.y));
    this.lastCursor =
      cursor === undefined ? undefined : { x: cursor.x, y: cursor.y };
    const requiresDynamicFrameRedraw =
      requiresVideoRedraw ||
      rendererNeedsRedraw ||
      this.frameDirty ||
      this.plugins.length > 0 ||
      this.showCollision ||
      this.showFPS ||
      this.showCommentCount ||
      cursorChanged;
    if (
      this.lastVpos === vpos &&
      !forceRendering &&
      !requiresDynamicFrameRedraw
    ) {
      return false;
    }
    const triggerHandlerStart = profile ? performance.now() : 0;
    this.eventHandler.trigger(
      vposInt,
      this.lastEventVpos,
      this.ctx.nicoScripts,
    );
    this.lastEventVpos = vposInt;
    setProfile("triggerHandler", triggerHandlerStart);
    const frameBanActive = isBanActive(
      vpos,
      this.ctx.nicoScripts,
      this.ctx.rangeCache,
    );
    this.resolveLazyCommentWindow(
      vposInt,
      frameBanActive ? BAN_FRAME_POSITION_RESOLUTION_BUDGET : undefined,
    );
    const timelineRange = this.timeline[vposInt] ?? EMPTY_TIMELINE;
    const lastTimelineRange = this.timeline[this.lastVposInt] ?? EMPTY_TIMELINE;
    const currentHasNaka = hasNakaComment(timelineRange);
    const lastHasNaka =
      this._cachedSplit?.vpos === this.lastVposInt
        ? this._cachedSplit.hasNaka
        : hasNakaComment(lastTimelineRange);
    this._cachedSplit = { vpos: vposInt, hasNaka: currentHasNaka };
    if (
      !forceRendering &&
      !requiresDynamicFrameRedraw &&
      !currentHasNaka &&
      !lastHasNaka &&
      frameBanActive === this.lastFrameBanActive
    ) {
      if (arrayEqual(timelineRange, lastTimelineRange)) return false;
    }
    this.frameDirty = true;
    this.renderer.clearRect(
      0,
      0,
      this.ctx.config.canvasWidth,
      this.ctx.config.canvasHeight,
    );

    const drawVideoStart = profile ? performance.now() : 0;
    this._drawVideo();
    setProfile("drawVideo", drawVideoStart);

    const drawPluginsStart = profile ? performance.now() : 0;
    for (const plugin of this.plugins) {
      try {
        const isUpdated = plugin.instance.draw?.(vpos);
        if (isUpdated !== false) {
          this.renderer.invalidateImage(plugin.canvas);
        }
        this.renderer.drawImage(plugin.canvas, 0, 0);
      } catch (e) {
        console.error("Failed to draw comments", e);
      }
    }
    setProfile("drawPlugins", drawPluginsStart);

    const drawCollisionStart = profile ? performance.now() : 0;
    this._drawCollision(vposInt);
    setProfile("drawCollision", drawCollisionStart);

    const drawCommentsStart = profile ? performance.now() : 0;
    const drawnCount = this._drawComments(
      timelineRange,
      vpos,
      cursor,
      frameBanActive,
    );
    setProfile("drawComments", drawCommentsStart);

    const drawFPSStart = profile ? performance.now() : 0;
    this._drawFPS(drawCanvasStart);
    setProfile("drawFPS", drawFPSStart);

    const drawCommentCountStart = profile ? performance.now() : 0;
    this._drawCommentCount(drawnCount);
    setProfile("drawCommentCount", drawCommentCountStart);

    const flushStart = profile ? performance.now() : 0;
    this.renderer.flush();
    setProfile("flush", flushStart);
    this.lastVpos = vpos;
    this.lastFrameBanActive = frameBanActive;
    this.frameDirty = false;

    if (profile) {
      profile.total = performance.now() - drawCanvasStart;
      this._log(
        `drawCanvas profile: trigger=${profile.triggerHandler.toFixed(2)}ms, video=${profile.drawVideo.toFixed(2)}ms, plugins=${profile.drawPlugins.toFixed(2)}ms, collision=${profile.drawCollision.toFixed(2)}ms, comments=${profile.drawComments.toFixed(2)}ms, fps=${profile.drawFPS.toFixed(2)}ms, count=${profile.drawCommentCount.toFixed(2)}ms, flush=${profile.flush.toFixed(2)}ms, total=${profile.total.toFixed(2)}ms`,
      );
    } else {
      this._log(
        `drawCanvas complete: ${performance.now() - drawCanvasStart}ms`,
      );
    }
    return true;
  }

  /**
   * 背景動画が設定されている場合に描画する
   */
  private _drawVideo() {
    this.renderer.drawVideo(this.enableLegacyPiP);
  }

  /**
   * コメントを描画する
   * @param timelineRange 指定されたvposに存在するコメント
   * @param vpos vpos
   * @param cursor カーソルの位置
   * @returns 描画したコメント数
   */
  private _drawComments(
    timelineRange: readonly IComment[],
    vpos: number,
    cursor?: Position,
    frameBanActive?: boolean,
  ): number {
    const { config, nicoScripts, rangeCache } = this.ctx;
    const banActive =
      frameBanActive ?? isBanActive(vpos, nicoScripts, rangeCache);
    if (banActive) return 0;

    let startIndex = 0;
    let endIndex = timelineRange.length;
    if (config.commentLimit !== undefined) {
      if (config.commentLimit === 0) {
        endIndex = 0;
      } else if (config.hideCommentOrder === "asc") {
        ({ startIndex, endIndex } = getSliceBounds(
          timelineRange.length,
          -config.commentLimit,
        ));
      } else {
        ({ startIndex, endIndex } = getSliceBounds(
          timelineRange.length,
          0,
          config.commentLimit,
        ));
      }
    }
    const frameActiveState: FrameActiveState = {
      banActive,
      reverseActiveOwner: isReverseActive(vpos, true, nicoScripts, rangeCache),
      reverseActiveViewer: isReverseActive(
        vpos,
        false,
        nicoScripts,
        rangeCache,
      ),
    };
    let maxCommentOffset = -1;
    let requiresFullScan = false;
    for (let i = startIndex; i < endIndex; i++) {
      const comment = timelineRange[i];
      if (!comment || comment.invisible) continue;
      const commentOffset = this.commentArrayIndexMap.get(comment);
      if (commentOffset === undefined) {
        requiresFullScan = true;
        break;
      }
      if (maxCommentOffset < commentOffset) {
        maxCommentOffset = commentOffset;
      }
    }
    if (
      requiresFullScan &&
      this.processedCommentIndex < this.comments.length - 1
    ) {
      this.getCommentPos(this.comments, this.comments.length);
    } else if (requiresFullScan) {
      this._log(
        "_drawComments: requiresFullScan with no unprocessed comments — possible plugin side-effect",
      );
    } else if (
      maxCommentOffset >= 0 &&
      this.processedCommentIndex < maxCommentOffset
    ) {
      this.getCommentPos(this.comments, maxCommentOffset + 1);
    }
    const guardUnregisteredUnresolved = requiresFullScan;
    let drawnCount = 0;
    for (let i = startIndex; i < endIndex; i++) {
      const comment = timelineRange[i];
      if (!comment || comment.invisible) {
        continue;
      }
      if (guardUnregisteredUnresolved) {
        const commentOffset = this.commentArrayIndexMap.get(comment);
        if (commentOffset === undefined && comment.posY < 0) {
          this._log(
            "_drawComments: skip unresolved unregistered comment (possible plugin-injected entry)",
          );
          continue;
        }
      }
      try {
        comment.draw(vpos, this.showCollision, cursor, frameActiveState);
        drawnCount += 1;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        this._log(
          `_drawComments: failed to draw comment index=${comment.index}: ${message}`,
        );
      }
    }
    return drawnCount;
  }

  /**
   * 当たり判定を描画する
   * @param vpos vpos
   */
  private _drawCollision(vpos: number) {
    const { config } = this.ctx;
    if (this.showCollision) {
      this.renderer.save();
      const leftCollision = this.collision.left[vpos];
      const rightCollision = this.collision.right[vpos];
      this.renderer.setFillStyle("red");
      if (leftCollision) {
        for (const comment of leftCollision) {
          this.renderer.fillRect(
            config.collisionRange.left,
            comment.posY,
            getConfig(config.contextLineWidth, comment.flash),
            comment.height,
          );
        }
      }
      if (rightCollision) {
        for (const comment of rightCollision) {
          this.renderer.fillRect(
            config.collisionRange.right,
            comment.posY,
            getConfig(config.contextLineWidth, comment.flash) * -1,
            comment.height,
          );
        }
      }
      this.renderer.restore();
    }
  }

  /**
   * FPSを描画する
   * @param drawCanvasStart 処理を開始した時間(ms)
   */
  private _drawFPS(drawCanvasStart: number) {
    const { config } = this.ctx;
    if (this.showFPS) {
      this.renderer.save();
      this.renderer.setFont(parseFont("defont", 60, config));
      this.renderer.setFillStyle("#00FF00");
      this.renderer.setStrokeStyle(
        `rgba(${hex2rgb(config.contextStrokeColor).join(",")},${
          config.contextStrokeOpacity
        })`,
      );
      const drawTime = Math.floor(performance.now() - drawCanvasStart);
      const fps = Math.floor(1000 / (drawTime === 0 ? 1 : drawTime));
      this.renderer.strokeText(`FPS:${fps}(${drawTime}ms)`, 100, 100);
      this.renderer.fillText(`FPS:${fps}(${drawTime}ms)`, 100, 100);
      this.renderer.restore();
    }
  }

  /**
   * 描画されたコメント数を描画する
   * @param count コメント描画数
   */
  private _drawCommentCount(count?: number | undefined) {
    const { config } = this.ctx;
    if (this.showCommentCount) {
      this.renderer.save();
      this.renderer.setFont(parseFont("defont", 60, config));
      this.renderer.setFillStyle("#00FF00");
      this.renderer.setStrokeStyle(
        `rgba(${hex2rgb(config.contextStrokeColor).join(",")},${
          config.contextStrokeOpacity
        })`,
      );
      this.renderer.strokeText(`Count:${count ?? 0}`, 100, 200);
      this.renderer.fillText(`Count:${count ?? 0}`, 100, 200);
      this.renderer.restore();
    }
  }

  /**
   * イベントハンドラを追加
   * @template K
   * @param eventName イベント名
   * @param handler イベントハンドラ
   */
  public addEventListener<K extends keyof CommentEventHandlerMap>(
    eventName: K,
    handler: CommentEventHandlerMap[K],
  ) {
    this.eventHandler.register(eventName, handler);
  }

  /**
   * イベントハンドラを削除
   * @template K
   * @param eventName イベント名
   * @param handler イベントハンドラ
   */
  public removeEventListener<K extends keyof CommentEventHandlerMap>(
    eventName: K,
    handler: CommentEventHandlerMap[K],
  ) {
    this.eventHandler.remove(eventName, handler);
  }

  /**
   * キャンバスを消去する
   */
  public clear() {
    const clear = getRendererClear(this.renderer);
    if (clear) {
      clear.call(this.renderer);
    } else {
      const size = this.renderer.getSize();
      this.renderer.clearRect(0, 0, size.width, size.height);
    }
    this.renderer.flush();
  }

  /**
   * \@ボタンの呼び出し用
   * @param vpos 再生位置
   * @param pos カーソルの位置
   */
  public click(vpos: number, pos: Position) {
    if (!isFiniteVpos(vpos) || !isFinitePosition(pos)) return;
    const _comments = this.timeline[Math.floor(vpos)];
    if (!_comments) return;
    for (let i = _comments.length - 1; i >= 0; i--) {
      const comment = _comments[i];
      if (!comment) continue;
      if (comment.isHovered(pos)) {
        const newComment = buildAtButtonComment(comment.comment, vpos);
        if (!newComment) continue;
        this.addComments(newComment);
      }
    }
  }

  private _log(msg: string) {
    if (this.ctx.options.debug) console.debug(msg);
  }
}

export default NiconiComments;
export type * from "@/@types";
