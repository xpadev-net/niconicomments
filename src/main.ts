import convert2formattedComment from "./inputParser";
import typeGuard from "@/typeGuard";
import {
  defaultConfig,
  defaultOptions,
  config,
  options,
  setConfig,
  setOptions,
} from "@/definition/config";
import {
  arrayPush,
  changeCALayer,
  getPosX,
  getPosY,
  hex2rgb,
  isFlashComment,
  parseFont,
} from "@/util";
import { HTML5Comment } from "@/comments/HTML5Comment";
import { FlashComment } from "@/comments/FlashComment";

let isDebug = false;

class NiconiComments {
  public enableLegacyPiP: boolean;
  public showCollision: boolean;
  public showFPS: boolean;
  public showCommentCount: boolean;
  public video: HTMLVideoElement | undefined;
  private data: IComment[];
  private lastVpos: number;
  private readonly canvas: HTMLCanvasElement;
  private readonly collision: collision;
  private readonly context: CanvasRenderingContext2D;
  private readonly timeline: { [key: number]: number[] };

  /**
   * NiconiComments Constructor
   * @param {HTMLCanvasElement} canvas - 描画対象のキャンバス
   * @param {[]} data - 描画用のコメント
   * @param initOptions
   */
  constructor(
    canvas: HTMLCanvasElement,
    data: (rawApiResponse | formattedComment)[],
    initOptions: InitOptions = {}
  ) {
    const constructorStart = performance.now();
    if (!typeGuard.config.initOptions(initOptions))
      throw new Error(
        "Please see document: https://xpadev-net.github.io/niconicomments/#p_options"
      );
    setOptions(Object.assign(defaultOptions, initOptions));
    setConfig(Object.assign(defaultConfig, options.config));
    isDebug = options.debug;

    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Fail to get CanvasRenderingContext2D");
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
    this.data = [];
    this.lastVpos = -1;
    this.preRendering(parsedData);
    logger(`constructor complete: ${performance.now() - constructorStart}ms`);
  }

  /**
   * 事前に当たり判定を考慮してコメントの描画場所を決定する
   * @param {any[]} rawData
   * ※読み込み時めちゃくちゃ重くなるので途中で絶対にカクついてほしくないという場合以外は非推奨
   */
  preRendering(rawData: formattedComment[]) {
    const preRenderingStart = performance.now();
    if (options.keepCA) {
      rawData = changeCALayer(rawData);
    }
    const parsedData: IComment[] = this.getCommentPos(
      rawData.reduce((pv, val) => {
        if (isFlashComment(val)) {
          pv.push(new FlashComment(val, this.context));
        } else {
          pv.push(new HTML5Comment(val, this.context));
        }
        return pv;
      }, [] as IComment[])
    );
    this.data = this.sortComment(parsedData);
    logger(`preRendering complete: ${performance.now() - preRenderingStart}ms`);
  }

  /**
   * 計算された描画サイズをもとに各コメントの配置位置を決定する
   */
  getCommentPos(data: IComment[]): IComment[] {
    const getCommentPosStart = performance.now();
    data.forEach((comment, index) => {
      if (comment.invisible) return;
      if (comment.loc === "naka") {
        let posY = 0;
        const beforeVpos =
          Math.round(-288 / ((1632 + comment.width) / (comment.long + 125))) -
          100;
        if (config.canvasHeight < comment.height) {
          posY = (comment.height - config.canvasHeight) / -2;
        } else {
          let isBreak = false,
            isChanged = true,
            count = 0;
          while (isChanged && count < 10) {
            isChanged = false;
            count++;
            for (let j = beforeVpos; j < comment.long + 125; j++) {
              const vpos = comment.vpos + j;
              const left_pos = getPosX(
                comment.width,
                j,
                comment.long,
                comment.flash
              );
              if (
                left_pos + comment.width >= config.collisionRange.right &&
                left_pos <= config.collisionRange.right
              ) {
                const result = getPosY(
                  posY,
                  comment,
                  this.collision.right[vpos],
                  data
                );
                posY = result.currentPos;
                isChanged = result.isChanged;
                isBreak = result.isBreak;
                if (isBreak) break;
              }
              if (
                left_pos + comment.width >= config.collisionRange.left &&
                left_pos <= config.collisionRange.left
              ) {
                const result = getPosY(
                  posY,
                  comment,
                  this.collision.left[vpos],
                  data
                );
                posY = result.currentPos;
                isChanged = result.isChanged;
                isBreak = result.isBreak;
                if (isBreak) break;
              }
            }
            if (isBreak) {
              break;
            }
          }
        }
        for (let j = beforeVpos; j < comment.long + 125; j++) {
          const vpos = comment.vpos + j;
          const left_pos = getPosX(
            comment.width,
            j,
            comment.long,
            comment.flash
          );
          arrayPush(this.timeline, vpos, index);
          if (left_pos + comment.width >= config.collisionRange.right) {
            arrayPush(this.collision.right, vpos, index);
          }
          if (left_pos <= config.collisionRange.left) {
            arrayPush(this.collision.left, vpos, index);
          }
        }
        comment.posY = posY;
      } else {
        let posY = 0,
          isChanged = true,
          count = 0,
          collision: collisionItem;
        if (comment.loc === "ue") {
          collision = this.collision.ue;
        } else {
          collision = this.collision.shita;
        }
        while (isChanged && count < 10) {
          isChanged = false;
          count++;
          for (let j = 0; j < comment.long; j++) {
            const result = getPosY(
              posY,
              comment,
              collision[comment.vpos + j],
              data
            );
            posY = result.currentPos;
            isChanged = result.isChanged;
            if (result.isBreak) break;
          }
        }
        for (let j = 0; j < comment.long; j++) {
          const vpos = comment.vpos + j;
          arrayPush(this.timeline, vpos, index);
          if (j > comment.long - 20) continue;
          if (comment.loc === "ue") {
            arrayPush(this.collision.ue, vpos, index);
          } else {
            arrayPush(this.collision.shita, vpos, index);
          }
        }
        comment.posY = posY;
      }
    });
    logger(
      `getCommentPos complete: ${performance.now() - getCommentPosStart}ms`
    );
    return data;
  }

  /**
   * 投稿者コメントを前に移動
   */
  sortComment(parsedData: IComment[]) {
    const sortCommentStart = performance.now();
    for (const vpos of Object.keys(this.timeline)) {
      const item = this.timeline[Number(vpos)];
      if (!item) continue;
      const owner = [],
        user = [];
      for (const index of item) {
        if (parsedData[index]?.owner) {
          owner.push(index);
        } else {
          user.push(index);
        }
      }
      this.timeline[Number(vpos)] = user.concat(owner);
    }
    logger(`parseData complete: ${performance.now() - sortCommentStart}ms`);
    return parsedData;
  }

  /**
   * キャンバスを描画する
   * @param vpos - 動画の現在位置の100倍 ニコニコから吐き出されるコメントの位置情報は主にこれ
   * @param forceRendering
   */
  drawCanvas(vpos: number, forceRendering = false) {
    const drawCanvasStart = performance.now();
    if (this.lastVpos === vpos && !forceRendering) return;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.lastVpos = vpos;
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
    const timelineRange = this.timeline[vpos];
    if (timelineRange) {
      for (const index of timelineRange) {
        const comment = this.data[index];
        if (!comment || comment.invisible) {
          continue;
        }
        comment.draw(vpos, this.showCollision, isDebug);
      }
    }
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
    if (this.showCommentCount) {
      this.context.font = parseFont("defont", 60);
      this.context.fillStyle = "#00FF00";
      this.context.strokeStyle = `rgba(${hex2rgb(
        config.contextStrokeColor
      ).join(",")},${config.contextStrokeOpacity})`;
      if (timelineRange) {
        this.context.strokeText(`Count:${timelineRange.length}`, 100, 200);
        this.context.fillText(`Count:${timelineRange.length}`, 100, 200);
      } else {
        this.context.strokeText("Count:0", 100, 200);
        this.context.fillText("Count:0", 100, 200);
      }
    }
    logger(`drawCanvas complete: ${performance.now() - drawCanvasStart}ms`);
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
