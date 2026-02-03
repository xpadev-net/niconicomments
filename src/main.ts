import type {
  Collision,
  CommentEventHandlerMap,
  FormattedComment,
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
import { CanvasRenderer } from "@/renderer";
import typeGuard from "@/typeGuard";
import {
  arrayEqual,
  buildAtButtonComment,
  changeCALayer,
  getConfig,
  hex2rgb,
  isFlashComment,
  parseFont,
  processFixedComment,
  processMovableComment,
} from "@/utils";
import { createCommentInstance } from "@/utils/plugins";

import * as internal from "./internal";

class NiconiComments {
  public enableLegacyPiP: boolean;
  public showCollision: boolean;
  public showFPS: boolean;
  public showCommentCount: boolean;
  private lastVpos: number;
  private get lastVposInt() {
    return Math.floor(this.lastVpos);
  }
  private processedCommentIndex: number;
  private comments: IComment[];
  private readonly renderer: IRenderer;
  private readonly collision: Collision;
  private readonly timeline: Timeline;
  private readonly timelineInserted: WeakSet<IComment>;
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
    const constructorStart = performance.now();
    initConfig();
    if (!typeGuard.config.initOptions(initOptions))
      throw new InvalidOptionError();
    setOptions(Object.assign(defaultOptions, initOptions));
    setConfig(Object.assign(defaultConfig, options.config));
    setIsDebug(options.debug);
    resetImageCache();
    resetNicoScripts();
    let renderer = _renderer;
    if (renderer instanceof HTMLCanvasElement) {
      renderer = new CanvasRenderer(renderer, options.video);
    } else if (options.video) {
      console.warn(
        "options.video is ignored because renderer is not HTMLCanvasElement",
      );
    }

    this.renderer = renderer;
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
      ue: [],
      shita: [],
      left: [],
      right: [],
    };
    this.timelineInserted = new WeakSet();
    this.lastVpos = -1;
    this.processedCommentIndex = -1;

    this.comments = this.preRendering(parsedData);

    logger(`constructor complete: ${performance.now() - constructorStart}ms`);
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
    if (this.processedCommentIndex + 1 >= end) return;
    for (const comment of data.slice(this.processedCommentIndex + 1, end)) {
      if (comment.invisible || (comment.posY > -1 && !lazy)) continue;
      if (comment.loc === "naka") {
        processMovableComment(
          comment,
          this.collision,
          this.timeline,
          this.timelineInserted,
          lazy,
        );
      } else {
        processFixedComment(
          comment,
          this.collision[comment.loc],
          this.timeline,
          this.timelineInserted,
          lazy,
        );
      }
      this.processedCommentIndex = comment.index;
    }
    if (lazy) {
      this.processedCommentIndex = 0;
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
      const owner: IComment[] = [];
      const user: IComment[] = [];
      for (const comment of item) {
        if (comment?.owner) {
          owner.push(comment);
        } else {
          user.push(comment);
        }
      }
      this.timeline[Number(vpos)] = user.concat(owner);
    }
    logger(`parseData complete: ${performance.now() - sortCommentStart}ms`);
  }

  /**
   * 動的にコメント追加する
   * ※すでに存在するコメントの位置はvposに関係なく更新されません
   * @param rawComments コメントデータ
   */
  public addComments(...rawComments: FormattedComment[]) {
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
        processMovableComment(
          comment,
          this.collision,
          this.timeline,
          this.timelineInserted,
        );
      } else {
        processFixedComment(
          comment,
          this.collision[comment.loc],
          this.timeline,
          this.timelineInserted,
        );
      }
    }
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
    const vposInt = Math.floor(vpos);
    const drawCanvasStart = performance.now();
    if (this.lastVpos === vpos && !forceRendering) return false;
    triggerHandler(vposInt, this.lastVposInt);
    const timelineRange = this.timeline[vposInt];
    const splitTimeline = (items: IComment[] | undefined) => {
      const fixed: IComment[] = [];
      let hasNaka = false;
      if (items) {
        for (const item of items) {
          if (item.loc === "naka") {
            hasNaka = true;
          } else {
            fixed.push(item);
          }
        }
      }
      return { fixed, hasNaka };
    };
    const currentSplit = splitTimeline(timelineRange);
    const lastSplit = splitTimeline(this.timeline[this.lastVposInt]);
    if (
      !forceRendering &&
      plugins.length === 0 &&
      !currentSplit.hasNaka &&
      !lastSplit.hasNaka
    ) {
      const current = currentSplit.fixed;
      const last = lastSplit.fixed;
      if (arrayEqual(current, last)) return false;
    }
    this.renderer.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
    this.lastVpos = vpos;
    this._drawVideo();
    for (const plugin of plugins) {
      try {
        plugin.instance.draw?.(vpos);
        this.renderer.drawImage(plugin.canvas, 0, 0);
      } catch (e) {
        console.error("Failed to draw comments", e);
      }
    }
    this._drawCollision(vposInt);
    this._drawComments(timelineRange, vpos, cursor);
    this._drawFPS(drawCanvasStart);
    this._drawCommentCount(timelineRange?.length);
    logger(`drawCanvas complete: ${performance.now() - drawCanvasStart}ms`);
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
   */
  private _drawComments(
    timelineRange: IComment[] | undefined,
    vpos: number,
    cursor?: Position,
  ) {
    if (timelineRange) {
      const targetComment = (() => {
        if (config.commentLimit === undefined) {
          return timelineRange;
        }
        if (config.hideCommentOrder === "asc") {
          return timelineRange.slice(-config.commentLimit);
        }
        return timelineRange.slice(0, config.commentLimit);
      })();
      for (const comment of targetComment) {
        if (comment.invisible) {
          continue;
        }
        this.getCommentPos(this.comments, comment.index + 1);
        comment.draw(vpos, this.showCollision, cursor);
      }
    }
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
    const comments = [..._comments].reverse();
    for (const comment of comments) {
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
