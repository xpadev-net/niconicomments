import type {
  collision,
  collisionItem,
  collisionPos,
  CommentEventHandlerMap,
  formattedComment,
  IComment,
  inputFormat,
  Options,
  Timeline,
} from "@/@types/";
import { FlashComment } from "@/comments/";
import {
  plugins,
  resetImageCache,
  resetNicoScripts,
  setPlugins,
} from "@/contexts/";
import {
  config,
  defaultConfig,
  defaultOptions,
  options,
  setConfig,
  setOptions,
} from "@/definition/config";
import { initConfig } from "@/definition/initConfig";
import { CanvasRenderingContext2DError, InvalidOptionError } from "@/errors/";
import { registerHandler, removeHandler, triggerHandler } from "@/eventHandler";
import convert2formattedComment from "@/inputParser";
import typeGuard from "@/typeGuard";
import {
  ArrayEqual,
  changeCALayer,
  hex2rgb,
  isFlashComment,
  parseFont,
  processFixedComment,
  processMovableComment,
} from "@/utils";
import { createCommentInstance } from "@/utils/plugins";

import * as internal from "./internal";

let isDebug = false;

class NiconiComments {
  public enableLegacyPiP: boolean;
  public showCollision: boolean;
  public showFPS: boolean;
  public showCommentCount: boolean;
  public video: HTMLVideoElement | undefined;
  private lastVpos: number;
  private readonly canvas: HTMLCanvasElement;
  private readonly collision: collision;
  private readonly context: CanvasRenderingContext2D;
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
   * @param {HTMLCanvasElement} canvas - 描画対象のキャンバス
   * @param {[]} data - 描画用のコメント
   * @param initOptions
   */
  constructor(
    canvas: HTMLCanvasElement,
    data: inputFormat,
    initOptions: Options = {}
  ) {
    const constructorStart = performance.now();
    initConfig();
    if (!typeGuard.config.initOptions(initOptions))
      throw new InvalidOptionError();
    setOptions(Object.assign(defaultOptions, initOptions));
    setConfig(Object.assign(defaultConfig, options.config));
    isDebug = options.debug;
    resetImageCache();
    resetNicoScripts();
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new CanvasRenderingContext2DError();
    this.context = context;
    this.context.strokeStyle = `rgba(${hex2rgb(config.contextStrokeColor).join(
      ","
    )},${config.contextStrokeOpacity})`;
    this.context.textAlign = "start";
    this.context.textBaseline = "alphabetic";
    this.context.lineWidth = config.contextLineWidth;
    let formatType = options.format;

    //Deprecated Warning
    if (options.formatted) {
      console.warn(
        "Deprecated: options.formatted is no longer recommended. Please use options.format. https://xpadev-net.github.io/niconicomments/#p_format"
      );
    }
    if (formatType === "default") {
      formatType = options.formatted ? "formatted" : "legacy";
    }

    if (options.useLegacy) {
      console.warn(
        "Deprecated: options.useLegacy is no longer recommended. Please use options.mode. https://xpadev-net.github.io/niconicomments/#p_mode"
      );
    }
    if (options.mode === "default" && options.useLegacy) {
      options.mode = "html5";
    }

    const parsedData = convert2formattedComment(data, formatType);
    setPlugins(config.plugins.map((val) => new val(canvas, parsedData)));
    this.video = options.video || undefined;
    this.showCollision = options.showCollision;
    this.showFPS = options.showFPS;
    this.showCommentCount = options.showCommentCount;
    this.enableLegacyPiP = options.enableLegacyPiP;

    this.timeline = {};
    this.collision = (
      ["ue", "shita", "right", "left"] as collisionPos[]
    ).reduce((pv, value) => {
      pv[value] = [] as collisionItem;
      return pv;
    }, {} as collision);
    this.lastVpos = -1;
    this.preRendering(parsedData);

    logger(`constructor complete: ${performance.now() - constructorStart}ms`);
  }

  /**
   * 事前に当たり判定を考慮してコメントの描画場所を決定する
   * @param {any[]} rawData
   */
  private preRendering(rawData: formattedComment[]) {
    const preRenderingStart = performance.now();
    if (options.keepCA) {
      rawData = changeCALayer(rawData);
    }
    this.getCommentPos(
      rawData.reduce((pv, val) => {
        pv.push(createCommentInstance(val, this.context));
        return pv;
      }, [] as IComment[])
    );
    this.sortComment();
    logger(`preRendering complete: ${performance.now() - preRenderingStart}ms`);
  }

  /**
   * 計算された描画サイズをもとに各コメントの配置位置を決定する
   */
  private getCommentPos(data: IComment[]): IComment[] {
    const getCommentPosStart = performance.now();
    for (const comment of data) {
      if (comment.invisible) continue;
      if (comment.loc === "naka") {
        processMovableComment(comment, this.collision, this.timeline);
      } else {
        processFixedComment(
          comment,
          this.collision[comment.loc],
          this.timeline
        );
      }
    }
    logger(
      `getCommentPos complete: ${performance.now() - getCommentPosStart}ms`
    );
    return data;
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
   * 動的にコメント追加
   */
  public addComments(...rawComments: formattedComment[]) {
    for (const plugin of plugins) {
      plugin.addComments(rawComments);
    }
    const comments = rawComments.reduce((pv, val) => {
      pv.push(createCommentInstance(val, this.context));
      return pv;
    }, [] as IComment[]);
    for (const comment of comments) {
      if (comment.invisible) continue;
      if (comment.loc === "naka") {
        processMovableComment(comment, this.collision, this.timeline);
      } else {
        processFixedComment(
          comment,
          this.collision[comment.loc],
          this.timeline
        );
      }
    }
  }

  /**
   * キャンバスを描画する
   * @param vpos - 動画の現在位置の100倍 ニコニコから吐き出されるコメントの位置情報は主にこれ
   * @param forceRendering
   * @return isChanged - 再描画されたか
   */
  public drawCanvas(vpos: number, forceRendering = false): boolean {
    const drawCanvasStart = performance.now();
    if (this.lastVpos === vpos && !forceRendering) return false;
    triggerHandler(vpos, this.lastVpos);
    const timelineRange = this.timeline[vpos];
    if (
      !forceRendering &&
      timelineRange?.filter((item) => item.loc === "naka").length === 0 &&
      this.timeline[this.lastVpos]?.filter((item) => item.loc === "naka")
        ?.length === 0
    ) {
      const current = timelineRange.filter((item) => item.loc !== "naka"),
        last =
          this.timeline[this.lastVpos]?.filter((item) => item.loc !== "naka") ||
          [];
      if (ArrayEqual(current, last)) return false;
    }
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.lastVpos = vpos;
    this._drawVideo();
    this._drawCollision(vpos);
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
        comment.draw(vpos, this.showCollision, isDebug);
      }
    }
    for (const plugin of plugins) {
      plugin.draw(vpos);
    }
    this._drawFPS(drawCanvasStart);
    this._drawCommentCount(timelineRange?.length);
    logger(`drawCanvas complete: ${performance.now() - drawCanvasStart}ms`);
    return true;
  }

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
        this.video.videoHeight * scale
      );
    }
  }

  private _drawCollision(vpos: number) {
    if (this.showCollision) {
      const leftCollision = this.collision.left[vpos],
        rightCollision = this.collision.right[vpos];
      this.context.fillStyle = "red";
      if (leftCollision) {
        for (const comment of leftCollision) {
          this.context.fillRect(
            config.collisionRange.left,
            comment.posY,
            config.contextLineWidth,
            comment.height
          );
        }
      }
      if (rightCollision) {
        for (const comment of rightCollision) {
          this.context.fillRect(
            config.collisionRange.right,
            comment.posY,
            config.contextLineWidth * -1,
            comment.height
          );
        }
      }
    }
  }

  private _drawFPS(drawCanvasStart: number) {
    if (this.showFPS) {
      this.context.font = parseFont("defont", 60);
      this.context.fillStyle = "#00FF00";
      this.context.strokeStyle = `rgba(${hex2rgb(
        config.contextStrokeColor
      ).join(",")},${config.contextStrokeOpacity})`;
      const drawTime = Math.floor(performance.now() - drawCanvasStart);
      const fps = Math.floor(1000 / (drawTime === 0 ? 1 : drawTime));
      this.context.strokeText(`FPS:${fps}(${drawTime}ms)`, 100, 100);
      this.context.fillText(`FPS:${fps}(${drawTime}ms)`, 100, 100);
    }
  }

  private _drawCommentCount(count?: number | undefined) {
    if (this.showCommentCount) {
      this.context.font = parseFont("defont", 60);
      this.context.fillStyle = "#00FF00";
      this.context.strokeStyle = `rgba(${hex2rgb(
        config.contextStrokeColor
      ).join(",")},${config.contextStrokeOpacity})`;
      this.context.strokeText(`Count:${count || 0}`, 100, 200);
      this.context.fillText(`Count:${count || 0}`, 100, 200);
    }
  }

  public addEventListener<K extends keyof CommentEventHandlerMap>(
    eventName: K,
    handler: CommentEventHandlerMap[K]
  ) {
    registerHandler(eventName, handler);
  }

  public removeEventListener<K extends keyof CommentEventHandlerMap>(
    eventName: K,
    handler: CommentEventHandlerMap[K]
  ) {
    removeHandler(eventName, handler);
  }

  /**
   * キャンバスを消去する
   */
  public clear() {
    this.context.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
  }
}

const logger = (msg: string) => {
  if (isDebug) console.debug(msg);
};

export default NiconiComments;
