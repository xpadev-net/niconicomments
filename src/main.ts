import type {
  Canvas,
  Collision,
  CommentEventHandlerMap,
  Context2D,
  FormattedComment,
  IComment,
  InputFormat,
  IPluginList,
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
import typeGuard from "@/typeGuard";
import {
  ArrayEqual,
  buildAtButtonComment,
  changeCALayer,
  getConfig,
  hex2rgb,
  isFlashComment,
  parseFont,
  processFixedComment,
  processMovableComment,
} from "@/utils";
import { generateCanvas, getContext } from "@/utils/canvas";
import { createCommentInstance } from "@/utils/plugins";

import * as internal from "./internal";

class NiconiComments {
  public enableLegacyPiP: boolean;
  public showCollision: boolean;
  public showFPS: boolean;
  public showCommentCount: boolean;
  public video: HTMLVideoElement | undefined;
  private lastVpos: number;
  private readonly canvas: Canvas;
  private readonly collision: Collision;
  private readonly context: Context2D;
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
   * @param canvas 描画対象のキャンバス
   * @param data 描画用のコメント
   * @param initOptions 初期化オプション
   */
  constructor(canvas: Canvas, data: InputFormat, initOptions: Options = {}) {
    const constructorStart = performance.now();
    initConfig();
    if (!typeGuard.config.initOptions(initOptions))
      throw new InvalidOptionError();
    setOptions(Object.assign(defaultOptions, initOptions));
    setConfig(Object.assign(defaultConfig, options.config));
    setIsDebug(options.debug);
    resetImageCache();
    resetNicoScripts();
    this.canvas = canvas;
    this.context = getContext(canvas);
    this.context.textAlign = "start";
    this.context.textBaseline = "alphabetic";
    this.context.lineWidth = getConfig(config.contextLineWidth, false);
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
    this.video = options.video ?? undefined;
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
    this.lastVpos = -1;
    this.preRendering(parsedData);

    logger(`constructor complete: ${performance.now() - constructorStart}ms`);
  }

  /**
   * 事前に当たり判定を考慮してコメントの描画場所を決定する
   * @param rawData コメントデータ
   */
  private preRendering(rawData: FormattedComment[]) {
    const preRenderingStart = performance.now();
    if (options.keepCA) {
      rawData = changeCALayer(rawData);
    }
    let instances = rawData.reduce<IComment[]>((pv, val) => {
      pv.push(createCommentInstance(val, this.context));
      return pv;
    }, []);
    this.getCommentPos(instances);
    this.sortComment();

    const plugins: IPluginList = [];
    for (const plugin of config.plugins) {
      try {
        const canvas = generateCanvas();
        const pluginInstance = new plugin(canvas, instances);
        plugins.push({
          canvas,
          instance: pluginInstance,
        });
        if (pluginInstance.transformComments) {
          instances = pluginInstance.transformComments(instances);
        }
      } catch (e) {
        console.error("Failed to init plugin");
      }
    }

    setPlugins(plugins);
    logger(`preRendering complete: ${performance.now() - preRenderingStart}ms`);
  }

  /**
   * 計算された描画サイズをもとに各コメントの配置位置を決定する
   * @param data コメントデータ
   */
  private getCommentPos(data: IComment[]) {
    const getCommentPosStart = performance.now();
    for (const comment of data) {
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
    logger(
      `getCommentPos complete: ${performance.now() - getCommentPosStart}ms`,
    );
  }

  /**
   * 投稿者コメントを前に移動
   */
  private sortComment() {
    const sortCommentStart = performance.now();
    for (const vpos of Object.keys(this.timeline)) {
      const item = this.timeline[Number(vpos)];
      if (!item) continue;
      const owner: IComment[] = [],
        user: IComment[] = [];
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
    const comments = rawComments.reduce<IComment[]>((pv, val) => {
      pv.push(createCommentInstance(val, this.context));
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
    const drawCanvasStart = performance.now();
    if (this.lastVpos === vpos && !forceRendering) return false;
    triggerHandler(vpos, this.lastVpos);
    const timelineRange = this.timeline[vpos];
    if (
      !forceRendering &&
      plugins.length === 0 &&
      timelineRange?.filter((item) => item.loc === "naka").length === 0 &&
      this.timeline[this.lastVpos]?.filter((item) => item.loc === "naka")
        ?.length === 0
    ) {
      const current = timelineRange.filter((item) => item.loc !== "naka"),
        last =
          this.timeline[this.lastVpos]?.filter((item) => item.loc !== "naka") ??
          [];
      if (ArrayEqual(current, last)) return false;
    }
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.lastVpos = vpos;
    this._drawVideo();
    for (const plugin of plugins) {
      try {
        plugin.instance.draw?.(vpos);
        this.context.drawImage(plugin.canvas, 0, 0);
      } catch (e) {
        console.error(`Failed to draw comments`);
      }
    }
    this._drawCollision(vpos);
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
    if (this.video) {
      let scale;
      const height = this.canvas.height / this.video.videoHeight,
        width = this.canvas.width / this.video.videoWidth;
      if (this.enableLegacyPiP ? height > width : height < width) {
        scale = width;
      } else {
        scale = height;
      }
      const offsetX = (this.canvas.width - this.video.videoWidth * scale) * 0.5,
        offsetY = (this.canvas.height - this.video.videoHeight * scale) * 0.5;
      this.context.drawImage(
        this.video,
        offsetX,
        offsetY,
        this.video.videoWidth * scale,
        this.video.videoHeight * scale,
      );
    }
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
      this.context.save();
      const leftCollision = this.collision.left[vpos],
        rightCollision = this.collision.right[vpos];
      this.context.fillStyle = "red";
      if (leftCollision) {
        for (const comment of leftCollision) {
          this.context.fillRect(
            config.collisionRange.left,
            comment.posY,
            getConfig(config.contextLineWidth, comment.flash),
            comment.height,
          );
        }
      }
      if (rightCollision) {
        for (const comment of rightCollision) {
          this.context.fillRect(
            config.collisionRange.right,
            comment.posY,
            getConfig(config.contextLineWidth, comment.flash) * -1,
            comment.height,
          );
        }
      }
      this.context.restore();
    }
  }

  /**
   * FPSを描画する
   * @param drawCanvasStart 処理を開始した時間(ms)
   */
  private _drawFPS(drawCanvasStart: number) {
    if (this.showFPS) {
      this.context.save();
      this.context.font = parseFont("defont", 60);
      this.context.fillStyle = "#00FF00";
      this.context.strokeStyle = `rgba(${hex2rgb(
        config.contextStrokeColor,
      ).join(",")},${config.contextStrokeOpacity})`;
      const drawTime = Math.floor(performance.now() - drawCanvasStart);
      const fps = Math.floor(1000 / (drawTime === 0 ? 1 : drawTime));
      this.context.strokeText(`FPS:${fps}(${drawTime}ms)`, 100, 100);
      this.context.fillText(`FPS:${fps}(${drawTime}ms)`, 100, 100);
      this.context.restore();
    }
  }

  /**
   * 描画されたコメント数を描画する
   * @param count コメント描画数
   */
  private _drawCommentCount(count?: number | undefined) {
    if (this.showCommentCount) {
      this.context.save();
      this.context.font = parseFont("defont", 60);
      this.context.fillStyle = "#00FF00";
      this.context.strokeStyle = `rgba(${hex2rgb(
        config.contextStrokeColor,
      ).join(",")},${config.contextStrokeOpacity})`;
      this.context.strokeText(`Count:${count ?? 0}`, 100, 200);
      this.context.fillText(`Count:${count ?? 0}`, 100, 200);
      this.context.restore();
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
    this.context.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
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
        console.log(newComment);
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
