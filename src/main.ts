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
import { FlashComment } from "@/comments/";
import {
  plugins,
  resetImageCache,
  resetNicoScripts,
  setPlugins,
} from "@/contexts/";
import { isDebug, setIsDebug } from "@/contexts/debug";
import {
  config,
  defaultConfig,
  defaultOptions,
  options,
  setConfig,
  setOptions,
} from "@/definition/config";
import { initConfig } from "@/definition/initConfig";
import { InvalidOptionError } from "@/errors/";
import { registerHandler, removeHandler, triggerHandler } from "@/eventHandler";
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
  resetRangePointers,
} from "@/utils";
import { createCommentInstance } from "@/utils/plugins";

import * as internal from "./internal";

const EMPTY_TIMELINE = Object.freeze([]) as readonly IComment[];

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

let activeInstanceCount = 0;

class NiconiComments {
  public enableLegacyPiP: boolean;
  public showCollision: boolean;
  public showFPS: boolean;
  public showCommentCount: boolean;
  private lastVpos: number;
  private get lastVposInt() {
    return Math.floor(this.lastVpos);
  }
  private _cachedSplit: {
    vpos: number;
    hasNaka: boolean;
  } | null = null;
  private commentArrayIndexMap: WeakMap<IComment, number>;
  private processedCommentIndex: number;
  private comments: IComment[];
  private readonly renderer: IRenderer;
  private readonly collision: Collision;
  private readonly timeline: Timeline;
  static typeGuard = typeGuard;
  static default = NiconiComments;
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
    if (activeInstanceCount > 0) {
      console.warn(
        "Multiple NiconiComments instances detected in one runtime. Module-scoped nicoscript/active-state caches are shared and may affect each other.",
      );
    }
    activeInstanceCount += 1;
    const constructorStart = performance.now();
    initConfig();
    if (!typeGuard.config.initOptions(initOptions))
      throw new InvalidOptionError();
    setOptions(Object.assign({}, defaultOptions, initOptions));
    setConfig(Object.assign({}, defaultConfig, options.config));
    setIsDebug(options.debug);
    resetImageCache();
    resetNicoScripts();
    resetRangePointers();
    let renderer = _renderer;
    if (renderer instanceof HTMLCanvasElement) {
      renderer = createRenderer(renderer, options.video);
    } else if (options.video) {
      console.warn(
        "options.video is ignored because renderer is not HTMLCanvasElement",
      );
    }

    this.renderer = renderer;
    logger(`renderer: ${renderer.rendererName}`);
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
    this.commentArrayIndexMap = new WeakMap();
    this.processedCommentIndex = -1;

    this.comments = this.preRendering(parsedData);
    this._rebuildCommentArrayIndex(this.comments);

    logger(`constructor complete: ${performance.now() - constructorStart}ms`);
  }

  public destroy() {
    if (activeInstanceCount > 0) {
      activeInstanceCount -= 1;
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

  /**
   * 事前に当たり判定を考慮してコメントの描画場所を決定する
   * @param _rawData コメントデータ
   * @returns コメントのインスタンス配列
   */
  private preRendering(_rawData: FormattedComment[]) {
    let rawData = _rawData;
    const preRenderingStart = performance.now();
    if (options.keepCA) {
      rawData = changeCALayer(rawData);
    }
    let instances = rawData.reduce<IComment[]>((pv, val, index) => {
      pv.push(createCommentInstance(val, this.renderer, index));
      return pv;
    }, []);
    this.getCommentPos(instances, instances.length, options.lazy);
    this.sortTimelineComment();

    const plugins: IPluginList = [];
    for (const plugin of config.plugins) {
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

    setPlugins(plugins);
    logger(`preRendering complete: ${performance.now() - preRenderingStart}ms`);
    return instances;
  }

  /**
   * 計算された描画サイズをもとに各コメントの配置位置を決定する
   * @param data コメントデータ
   * @param end 終了インデックス
   * @param lazy 遅延処理を行うか
   */
  private getCommentPos(data: IComment[], end: number, lazy = false) {
    const getCommentPosStart = performance.now();
    const startIndex = this.processedCommentIndex + 1;
    if (startIndex >= end) return;
    for (let i = startIndex; i < end; i++) {
      const comment = data[i];
      if (!comment) continue;
      this.processedCommentIndex = i;
      if (comment.invisible || (comment.posY > -1 && !lazy)) continue;
      if (comment.loc === "naka") {
        processMovableComment(comment, this.collision, this.timeline, lazy);
      } else {
        processFixedComment(
          comment,
          this.collision[comment.loc],
          this.timeline,
          lazy,
        );
      }
    }
    if (lazy) {
      this.processedCommentIndex = -1;
    }
    logger(
      `getCommentPos complete: ${performance.now() - getCommentPosStart}ms`,
    );
  }

  /**
   * 投稿者コメントを前に移動
   */
  private sortTimelineComment() {
    const sortCommentStart = performance.now();
    for (const vpos of Object.keys(this.timeline)) {
      const item = this.timeline[Number(vpos)];
      if (!item) continue;
      item.sort(
        (a, b) => Number(a.owner) - Number(b.owner) || a.index - b.index,
      );
    }
    logger(`parseData complete: ${performance.now() - sortCommentStart}ms`);
  }

  /**
   * 動的にコメント追加する
   * ※すでに存在するコメントの位置はvposに関係なく更新されません
   * @param rawComments コメントデータ
   */
  public addComments(...rawComments: FormattedComment[]) {
    resetRangePointers();
    const comments = rawComments.reduce<IComment[]>((pv, val, index) => {
      pv.push(
        createCommentInstance(val, this.renderer, this.comments.length + index),
      );
      return pv;
    }, []);
    for (const plugin of plugins) {
      try {
        plugin.instance.addComments?.(comments);
      } catch (e) {
        console.error("Failed to add comments", e);
      }
    }
    for (const comment of comments) {
      if (comment.invisible) continue;
      if (comment.loc === "naka") {
        processMovableComment(comment, this.collision, this.timeline);
      } else {
        processFixedComment(
          comment,
          this.collision[comment.loc],
          this.timeline,
        );
      }
    }
    this.comments.push(...comments);
    const baseOffset = this.comments.length - comments.length;
    for (let i = 0, n = comments.length; i < n; i++) {
      const comment = comments[i];
      if (!comment) continue;
      this.commentArrayIndexMap.set(comment, baseOffset + i);
    }
    if (!options.lazy) {
      this.processedCommentIndex = this.comments.length - 1;
      // Non-lazy mode eagerly resolves all positions here, so skipping
      // already-known indices avoids unnecessary rescans in draw path.
    } else {
      // Lazy mode may still contain historical comments with unresolved posY.
      // Advancing to the tail here can skip those unresolved entries forever.
      // Keep processedCommentIndex unchanged so draw-time resolution can catch up.
    }
    this.sortTimelineComment();
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
    const profile: DrawCanvasProfile | undefined = isDebug
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
    if (this.lastVpos === vpos && !forceRendering) return false;
    const triggerHandlerStart = profile ? performance.now() : 0;
    triggerHandler(vposInt, this.lastVposInt);
    setProfile("triggerHandler", triggerHandlerStart);
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
      plugins.length === 0 &&
      !currentHasNaka &&
      !lastHasNaka
    ) {
      if (arrayEqual(timelineRange, lastTimelineRange)) return false;
    }
    this.renderer.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
    this.lastVpos = vpos;

    const drawVideoStart = profile ? performance.now() : 0;
    this._drawVideo();
    setProfile("drawVideo", drawVideoStart);

    const drawPluginsStart = profile ? performance.now() : 0;
    for (const plugin of plugins) {
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
    const drawnCount = this._drawComments(timelineRange, vpos, cursor);
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

    if (profile) {
      profile.total = performance.now() - drawCanvasStart;
      logger(
        `drawCanvas profile: trigger=${profile.triggerHandler.toFixed(2)}ms, video=${profile.drawVideo.toFixed(2)}ms, plugins=${profile.drawPlugins.toFixed(2)}ms, collision=${profile.drawCollision.toFixed(2)}ms, comments=${profile.drawComments.toFixed(2)}ms, fps=${profile.drawFPS.toFixed(2)}ms, count=${profile.drawCommentCount.toFixed(2)}ms, flush=${profile.flush.toFixed(2)}ms, total=${profile.total.toFixed(2)}ms`,
      );
    } else {
      logger(`drawCanvas complete: ${performance.now() - drawCanvasStart}ms`);
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
  ): number {
    let startIndex = 0;
    let endIndex = timelineRange.length;
    if (config.commentLimit !== undefined) {
      if (config.hideCommentOrder === "asc") {
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
      logger(
        "_drawComments: requiresFullScan with no unprocessed comments — possible plugin side-effect",
      );
    } else if (
      maxCommentOffset >= 0 &&
      this.processedCommentIndex < maxCommentOffset
    ) {
      this.getCommentPos(this.comments, maxCommentOffset + 1);
    }
    const vposInt = Math.floor(vpos);
    const frameActiveState: FrameActiveState = {
      banActive: isBanActive(vposInt),
      reverseActiveOwner: isReverseActive(vposInt, true),
      reverseActiveViewer: isReverseActive(vposInt, false),
    };
    let drawnCount = 0;
    for (let i = startIndex; i < endIndex; i++) {
      const comment = timelineRange[i];
      if (!comment || comment.invisible) {
        continue;
      }
      comment.draw(vpos, this.showCollision, cursor, frameActiveState);
      if (!frameActiveState.banActive) {
        drawnCount += 1;
      }
    }
    return drawnCount;
  }

  /**
   * 当たり判定を描画する
   * @param vpos vpos
   */
  private _drawCollision(vpos: number) {
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
    if (this.showFPS) {
      this.renderer.save();
      this.renderer.setFont(parseFont("defont", 60));
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
    if (this.showCommentCount) {
      this.renderer.save();
      this.renderer.setFont(parseFont("defont", 60));
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
    registerHandler(eventName, handler);
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
    removeHandler(eventName, handler);
  }

  /**
   * キャンバスを消去する
   */
  public clear() {
    const size = this.renderer.getSize();
    this.renderer.clearRect(0, 0, size.width, size.height);
  }

  /**
   * \@ボタンの呼び出し用
   * @param vpos 再生位置
   * @param pos カーソルの位置
   */
  public click(vpos: number, pos: Position) {
    const _comments = this.timeline[vpos];
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
}

const logger = (msg: string) => {
  if (isDebug) console.debug(msg);
};

export default NiconiComments;
export type * from "@/@types";
