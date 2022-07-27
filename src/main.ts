import convert2formattedComment from "./inputParser";
import typeGuard from "@/typeGuard";

let isDebug = false;

class NiconiComments {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private readonly commentYPaddingTop: number;
  private readonly commentYMarginBottom: number;
  private readonly fontSize: T_fontSize;
  private readonly lineHeight: T_fontSize;
  private readonly doubleResizeMaxWidth: T_doubleResizeMaxWidth;
  public video: HTMLVideoElement | null;
  public showCollision: boolean;
  public showFPS: boolean;
  public showCommentCount: boolean;
  public enableLegacyPiP: boolean;
  private keepCA: boolean;
  private data: parsedComment[];
  private timeline: { [key: number]: number[] };
  private nicoScripts: nicoScript;
  private collision: collision;
  private lastVpos: number;
  private useLegacy: boolean;
  private fpsCount: number;
  private fps: number;

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
    const defaultOptions: Options = {
      drawAllImageOnLoad: false,
      format: "default",
      formatted: false,
      debug: false,
      enableLegacyPiP: false,
      keepCA: false,
      showCollision: false,
      showCommentCount: false,
      showFPS: false,
      useLegacy: false,
      video: null,
    };
    const options: Options = Object.assign(defaultOptions, initOptions);
    isDebug = options.debug;
    const constructorStart = performance.now();

    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Fail to get CanvasRenderingContext2D");
    this.context = context;
    this.context.strokeStyle = "rgba(0,0,0,0.7)";
    this.context.textAlign = "start";
    this.context.textBaseline = "alphabetic";
    this.context.lineWidth = 4;
    this.commentYPaddingTop = 0.08;
    this.commentYMarginBottom = 0.24;
    this.fontSize = {
      small: {
        default: 47,
        resized: 26.1,
      },
      medium: {
        default: 74,
        resized: 38.7,
      },
      big: {
        default: 110,
        resized: 61,
      },
    };
    this.lineHeight = {
      small: {
        default: 1,
        resized: 1,
      },
      medium: {
        default: 1,
        resized: 1,
      },
      big: {
        default: 1.03,
        resized: 1.01,
      },
    };
    this.doubleResizeMaxWidth = {
      full: {
        legacy: 3020,
        default: 3550,
      },
      normal: {
        legacy: 2540,
        default: 2650,
      },
    };
    let formatType = options.format;

    //Deprecated Warning
    if (options.formatted) {
      console.warn(
        "Deprecated: options.formatted is no longer recommended. Please use options.format"
      );
    }
    if (formatType === "default") {
      formatType = options.formatted ? "formatted" : "legacy";
    }

    const parsedData = convert2formattedComment(data, formatType);
    this.video = options.video ? options.video : null;
    this.showCollision = options.showCollision;
    this.showFPS = options.showFPS;
    this.showCommentCount = options.showCommentCount;
    this.enableLegacyPiP = options.enableLegacyPiP;
    this.keepCA = options.keepCA;

    this.timeline = {};
    this.nicoScripts = { reverse: [], default: [], replace: [], ban: [] };
    this.collision = (
      ["ue", "shita", "right", "left"] as collisionPosList[]
    ).reduce((pv, value) => {
      pv[value] = [] as posCollision;
      return pv;
    }, {} as collision);
    this.data = [];
    this.lastVpos = -1;
    this.useLegacy = options.useLegacy;
    this.preRendering(parsedData, options.drawAllImageOnLoad);
    this.fpsCount = 0;
    this.fps = 0;
    window.setInterval(() => {
      this.fps = this.fpsCount * 2;
      this.fpsCount = 0;
    }, 500);
    logger(`constructor complete: ${performance.now() - constructorStart}ms`);
  }

  /**
   * 事前に当たり判定を考慮してコメントの描画場所を決定する
   * @param {any[]} rawData
   * @param {boolean} drawAll - 読み込み時にすべてのコメント画像を生成する
   * ※読み込み時めちゃくちゃ重くなるので途中で絶対にカクついてほしくないという場合以外は非推奨
   */
  preRendering(rawData: formattedComment[], drawAll: boolean) {
    const preRenderingStart = performance.now();
    if (this.keepCA) {
      rawData = changeCALayer(rawData);
    }
    const parsedData: parsedComment[] = this.getCommentPos(
      this.getCommentSize(this.getFont(rawData)) as parsedComment[]
    );
    this.data = this.sortComment(parsedData);
    if (drawAll) {
      parsedData.forEach((_, key) => this.getTextImage(Number(key), true));
    }
    logger(`preRendering complete: ${performance.now() - preRenderingStart}ms`);
  }

  /**
   * コマンドをもとに各コメントに適用するフォントを決定する
   */
  getFont(parsedData: formattedComment[]): formattedCommentWithFont[] {
    const getFontStart = performance.now();
    const result: formattedCommentWithFont[] = [];
    for (const value of parsedData) {
      value.content = value.content.replace(/\t/g, "\u2003\u2003");
      result.push(this.parseCommandAndNicoscript(value));
    }
    logger(`getFont complete: ${performance.now() - getFontStart}ms`);
    return result;
  }

  /**
   * コメントの描画サイズを計算する
   */
  getCommentSize(
    parsedData: formattedCommentWithFont[]
  ): formattedCommentWithSize[] {
    const getCommentSizeStart = performance.now();
    const groupedData = groupBy(parsedData);
    const result: formattedCommentWithSize[] = [];

    for (const font of Object.keys(groupedData) as commentFont[]) {
      for (const fontSize of Object.keys(groupedData[font])) {
        const value = groupedData[font][fontSize];
        if (!value) continue;
        this.context.font = parseFont(font, fontSize, this.useLegacy);
        for (const comment of value) {
          if (comment.invisible) {
            continue;
          }
          const measure = this.measureText(comment);
          const size = parsedData[comment.index] as formattedCommentWithSize;
          size.height = measure.height;
          size.width = measure.width;
          size.width_max = measure.width_max;
          size.width_min = measure.width_min;
          size.lineHeight = measure.lineHeight;
          if (measure.resized) {
            size.fontSize = measure.fontSize;
            this.context.font = parseFont(font, fontSize, this.useLegacy);
          }
          result[comment.index] = size;
        }
      }
    }
    logger(
      `getCommentSize complete: ${performance.now() - getCommentSizeStart}ms`
    );
    return result;
  }

  /**
   * 計算された描画サイズをもとに各コメントの配置位置を決定する
   */
  getCommentPos(data: parsedComment[]) {
    const getCommentPosStart = performance.now();
    data.forEach((comment, index) => {
      if (comment.invisible) return;
      for (let j = 0; j < (comment.long * 4) / 3 + 100; j++) {
        if (!this.timeline[comment.vpos + j]) {
          this.timeline[comment.vpos + j] = [];
        }
        if (!this.collision.right[comment.vpos + j]) {
          this.collision.right[comment.vpos + j] = [];
        }
        if (!this.collision.left[comment.vpos + j]) {
          this.collision.left[comment.vpos + j] = [];
        }
        if (!this.collision.ue[comment.vpos + j]) {
          this.collision.ue[comment.vpos + j] = [];
        }
        if (!this.collision.shita[comment.vpos + j]) {
          this.collision.shita[comment.vpos + j] = [];
        }
      }
      if (comment.loc === "naka") {
        let posY = 0,
          isBreak = false,
          isChanged = true,
          count = 0;
        const beforeVpos =
          Math.round(
            -240 / ((1680 + comment.width_max) / (comment.long + 125))
          ) - 100;
        if (1080 < comment.height) {
          posY = (comment.height - 1080) / -2;
        } else {
          while (isChanged && count < 10) {
            isChanged = false;
            count++;
            for (let j = beforeVpos; j < comment.long; j++) {
              const vpos = comment.vpos + j;
              const left_pos =
                1680 - ((1680 + comment.width_max) / (comment.long + 125)) * j;
              if (left_pos + comment.width_max >= 1880) {
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
              if (left_pos <= 40) {
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
          const left_pos =
            1680 - ((1680 + comment.width_max) / (comment.long + 125)) * j;
          arrayPush(this.timeline, vpos, index);
          if (left_pos + comment.width_max >= 1880) {
            arrayPush(this.collision.right, vpos, index);
          }
          if (left_pos <= 40) {
            arrayPush(this.collision.left, vpos, index);
          }
        }
        comment.posY = posY;
      } else {
        let posY = 0,
          isChanged = true,
          count = 0,
          collision: posCollision;
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
  sortComment(parsedData: parsedComment[]) {
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
      this.timeline[Number(vpos)] = owner.concat(user);
    }
    logger(`parseData complete: ${performance.now() - sortCommentStart}ms`);
    return parsedData;
  }

  /**
   * context.measureTextの複数行対応版
   * 画面外にはみ出すコメントの縮小も行う
   * @param comment - 独自フォーマットのコメントデータ
   * @returns {{resized: boolean, width: number, width_max: number, fontSize: number, width_min: number, height: number, lineHeight: number}} - 描画サイズとリサイズの情報
   */
  measureText(comment: {
    content: string;
    resized?: boolean;
    ender: boolean;
    size: commentSize;
    fontSize: number;
    resizedY?: boolean;
    resizedX?: boolean;
    font: commentFont;
    loc: commentLoc;
    full: boolean;
    lineHeight?: number;
  }): measureTextResult {
    const width_arr = [],
      lines = comment.content.split("\n");
    if (!comment.lineHeight)
      comment.lineHeight = this.lineHeight[comment.size].default;
    if (!comment.resized && !comment.ender) {
      if (comment.size === "big" && lines.length > 2) {
        comment.fontSize = this.fontSize.big.resized;
        comment.lineHeight = this.lineHeight.big.resized;
        comment.resized = true;
        comment.resizedY = true;
        this.context.font = parseFont(
          comment.font,
          comment.fontSize,
          this.useLegacy
        );
      } else if (comment.size === "medium" && lines.length > 4) {
        comment.fontSize = this.fontSize.medium.resized;
        comment.lineHeight = this.lineHeight.medium.resized;
        comment.resized = true;
        comment.resizedY = true;
        this.context.font = parseFont(
          comment.font,
          comment.fontSize,
          this.useLegacy
        );
      } else if (comment.size === "small" && lines.length > 6) {
        comment.fontSize = this.fontSize.small.resized;
        comment.lineHeight = this.lineHeight.small.resized;
        comment.resized = true;
        comment.resizedY = true;
        this.context.font = parseFont(
          comment.font,
          comment.fontSize,
          this.useLegacy
        );
      }
    }
    for (let i = 0; i < lines.length; i++) {
      const measure = this.context.measureText(lines[i] as string);
      width_arr.push(measure.width);
    }
    const width = width_arr.reduce((p, c) => p + c, 0) / width_arr.length,
      width_max = Math.max(...width_arr),
      width_min = Math.min(...width_arr),
      height =
        comment.fontSize *
          comment.lineHeight *
          (1 + this.commentYPaddingTop) *
          lines.length +
        this.commentYMarginBottom * comment.fontSize;
    if (comment.loc !== "naka" && !comment.resizedY) {
      if (comment.full && width_max > 1930) {
        comment.fontSize -= 2;
        comment.resized = true;
        comment.resizedX = true;
        this.context.font = parseFont(
          comment.font,
          comment.fontSize,
          this.useLegacy
        );
        return this.measureText(comment);
      } else if (!comment.full && width_max > 1440) {
        comment.fontSize -= 1;
        comment.resized = true;
        comment.resizedX = true;
        this.context.font = parseFont(
          comment.font,
          comment.fontSize,
          this.useLegacy
        );
        return this.measureText(comment);
      }
    } else if (
      comment.loc !== "naka" &&
      comment.resizedY &&
      ((comment.full && width_max > 2120) ||
        (!comment.full && width_max > 1440)) &&
      !comment.resizedX
    ) {
      comment.fontSize = this.fontSize[comment.size].default;
      comment.lineHeight = this.lineHeight[comment.size].default * 1.05;
      comment.resized = true;
      comment.resizedX = true;
      this.context.font = parseFont(
        comment.font,
        comment.fontSize,
        this.useLegacy
      );
      return this.measureText(comment);
    } else if (comment.loc !== "naka" && comment.resizedY && comment.resizedX) {
      if (
        comment.full &&
        width_max >
          this.doubleResizeMaxWidth.full[this.useLegacy ? "legacy" : "default"]
      ) {
        comment.fontSize -= 1;
        this.context.font = parseFont(
          comment.font,
          comment.fontSize,
          this.useLegacy
        );
        return this.measureText(comment);
      } else if (
        !comment.full &&
        width_max >
          this.doubleResizeMaxWidth.normal[
            this.useLegacy ? "legacy" : "default"
          ]
      ) {
        comment.fontSize -= 1;
        this.context.font = parseFont(
          comment.font,
          comment.fontSize,
          this.useLegacy
        );
        return this.measureText(comment);
      }
    }

    return {
      width: width,
      width_max: width_max,
      width_min: width_min,
      height: height,
      resized: !!comment.resized,
      fontSize: comment.fontSize,
      lineHeight: comment.lineHeight,
    };
  }

  /**
   * コマンドをもとに所定の位置に事前に生成したコメントを表示する
   * @param comment - 独自フォーマットのコメントデータ
   * @param {number} vpos - 動画の現在位置の100倍 ニコニコから吐き出されるコメントの位置情報は主にこれ
   */
  drawText(comment: parsedComment, vpos: number) {
    let reverse = false;
    for (const range of this.nicoScripts.reverse) {
      if (
        (range.target === "コメ" && comment.owner) ||
        (range.target === "投コメ" && !comment.owner)
      )
        break;
      if (range.start < vpos && vpos < range.end) {
        reverse = true;
      }
    }
    for (const range of this.nicoScripts.ban) {
      if (range.start < vpos && vpos < range.end) return;
    }
    let posX = (1920 - comment.width_max) / 2,
      posY = comment.posY;
    if (comment.loc === "naka") {
      if (reverse) {
        posX =
          240 +
          ((1680 + comment.width_max) / (comment.long + 125)) *
            (vpos - comment.vpos + 100) -
          comment.width_max;
      } else {
        posX =
          1680 -
          ((1680 + comment.width_max) / (comment.long + 125)) *
            (vpos - comment.vpos + 100);
      }
    } else if (comment.loc === "shita") {
      posY = 1080 - comment.posY - comment.height;
    }
    if (comment.image && comment.image !== true) {
      this.context.drawImage(comment.image, posX, posY);
    }
    if (this.showCollision) {
      this.context.strokeStyle = "rgba(0,255,255,1)";
      this.context.strokeRect(posX, posY, comment.width_max, comment.height);
      const lines = comment.content.split("\n");
      lines.forEach((_, index) => {
        const linePosY =
          (Number(index) + 1) *
          (comment.fontSize * comment.lineHeight) *
          (1 + this.commentYPaddingTop);
        this.context.strokeStyle = "rgba(255,255,0,0.5)";
        this.context.strokeRect(
          posX,
          posY + linePosY,
          comment.width_max,
          comment.fontSize * comment.lineHeight * -1
        );
      });
    }
  }

  /**
   * drawTextで毎回fill/strokeすると重いので画像化して再利用できるようにする
   * @param {number} i - コメントデータのインデックス
   * @param preRendering
   */
  getTextImage(i: number, preRendering = false) {
    const value = this.data[i];
    if (!value || value.invisible) return;
    const image = document.createElement("canvas");
    image.width = value.width_max;
    image.height = value.height;
    const context = image.getContext("2d");
    if (!context) throw new Error("Fail to get CanvasRenderingContext2D");
    context.strokeStyle = "rgba(0,0,0,0.7)";
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
    context.lineWidth = 4;
    context.font = parseFont(value.font, value.fontSize, this.useLegacy);
    if (value._live) {
      const rgb = hex2rgb(value.color);
      context.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5)`;
    } else {
      context.fillStyle = value.color;
    }
    if (value.color === "#000000") {
      context.strokeStyle = "rgba(255,255,255,0.7)";
    }
    const lines = value.content.split("\n");
    lines.forEach((line, index) => {
      const posY =
        (Number(index) + 1) *
        (value.fontSize * value.lineHeight) *
        (1 + this.commentYPaddingTop);
      context.strokeText(line, 0, posY);
      context.fillText(line, 0, posY);
    });
    value.image = image;
    if (preRendering) return;
    setTimeout(() => {
      if (value.image) delete value.image;
    }, 5000);
  }

  /**
   * コメントに含まれるコマンドを解釈する
   * @param comment- 独自フォーマットのコメントデータ
   * @returns {{loc: string|null, size: string|null, color: string|null, fontSize: number|null, ender: boolean, font: string|null, full: boolean, _live: boolean, invisible: boolean, long:number|null}}
   */
  parseCommand(comment: formattedComment): parsedCommand {
    const metadata = comment.mail;
    let loc: commentLoc | null = null,
      size: commentSize | null = null,
      fontSize: number | null = null,
      color: string | null = null,
      font: commentFont | null = null,
      full = false,
      ender = false,
      _live = false,
      invisible = false,
      long: number | null = null;
    for (let command of metadata) {
      command = command.toLowerCase();
      const match = command.match(/^@([0-9.]+)/);
      if (match && match[1]) {
        long = Number(match[1]);
      }
      if (loc === null) {
        switch (command) {
          case "ue":
            loc = "ue";
            break;
          case "shita":
            loc = "shita";
            break;
        }
      }
      if (size === null) {
        switch (command) {
          case "big":
            size = "big";
            fontSize = this.fontSize.big.default;
            break;
          case "small":
            size = "small";
            fontSize = this.fontSize.small.default;
            break;
        }
      }
      if (color === null) {
        const match = command.match(/#[0-9a-z]{3,6}/);
        switch (command) {
          case "white":
            color = "#FFFFFF";
            break;
          case "red":
            color = "#FF0000";
            break;
          case "pink":
            color = "#FF8080";
            break;
          case "orange":
            color = "#FFC000";
            break;
          case "yellow":
            color = "#FFFF00";
            break;
          case "green":
            color = "#00FF00";
            break;
          case "cyan":
            color = "#00FFFF";
            break;
          case "blue":
            color = "#0000FF";
            break;
          case "purple":
            color = "#C000FF";
            break;
          case "black":
            color = "#000000";
            break;
          case "white2":
          case "niconicowhite":
            color = "#CCCC99";
            break;
          case "red2":
          case "truered":
            color = "#CC0033";
            break;
          case "pink2":
            color = "#FF33CC";
            break;
          case "orange2":
          case "passionorange":
            color = "#FF6600";
            break;
          case "yellow2":
          case "madyellow":
            color = "#999900";
            break;
          case "green2":
          case "elementalgreen":
            color = "#00CC66";
            break;
          case "cyan2":
            color = "#00CCCC";
            break;
          case "blue2":
          case "marineblue":
            color = "#3399FF";
            break;
          case "purple2":
          case "nobleviolet":
            color = "#6633CC";
            break;
          case "black2":
            color = "#666666";
            break;
          default:
            if (match && match[0] && comment.premium) {
              color = match[0].toUpperCase();
            }
            break;
        }
      }
      if (font === null) {
        switch (command) {
          case "gothic":
            font = "gothic";
            break;
          case "mincho":
            font = "mincho";
            break;
        }
      }
      switch (command) {
        case "full":
          full = true;
          break;
        case "ender":
          ender = true;
          break;
        case "_live":
          _live = true;
          break;
        case "invisible":
          invisible = true;
          break;
      }
    }
    return {
      loc,
      size,
      fontSize,
      color,
      font,
      full,
      ender,
      _live,
      invisible,
      long,
    };
  }

  parseCommandAndNicoscript(
    comment: formattedComment
  ): formattedCommentWithFont {
    const data = this.parseCommand(comment),
      nicoscript = comment.content.match(
        /^@(デフォルト|置換|逆|コメント禁止|シーク禁止|ジャンプ)/
      );

    if (nicoscript) {
      const reverse = comment.content.match(/^@逆 ?(全|コメ|投コメ)?/);
      const content = comment.content.split(""),
        result = [];
      let quote = "",
        last_i = "",
        string = "";
      switch (nicoscript[1]) {
        case "デフォルト":
          this.nicoScripts.default.unshift({
            start: comment.vpos,
            long: data.long === null ? null : Math.floor(data.long * 100),
            color: data.color,
            size: data.size,
            font: data.font,
            loc: data.loc,
          });
          break;
        case "逆":
          if (
            !reverse ||
            !reverse[1] ||
            !typeGuard.nicoScript.range.target(reverse[1])
          )
            break;
          if (data.long === null) {
            data.long = 30;
          }
          this.nicoScripts.reverse.unshift({
            start: comment.vpos,
            end: comment.vpos + data.long * 100,
            target: reverse[1],
          });
          break;
        case "コメント禁止":
          if (data.long === null) {
            data.long = 30;
          }
          this.nicoScripts.ban.unshift({
            start: comment.vpos,
            end: comment.vpos + data.long * 100,
          });
          break;
        case "置換":
          for (const i of content.slice(4)) {
            if (i.match(/["'「]/) && quote === "") {
              quote = i;
            } else if (i.match(/["']/) && quote === i && last_i !== "\\") {
              result.push(replaceAll(string, "\\n", "\n"));
              quote = "";
              string = "";
            } else if (i.match(/」/) && quote === "「") {
              result.push(string);
              quote = "";
              string = "";
            } else if (quote === "" && i.match(/\s+/)) {
              if (string) {
                result.push(string);
                string = "";
              }
            } else {
              string += i;
            }

            last_i = i;
          }
          result.push(string);
          if (
            !result[0] ||
            !typeGuard.nicoScript.replace.range(result[2]) ||
            !typeGuard.nicoScript.replace.target(result[3]) ||
            !typeGuard.nicoScript.replace.condition(result[4])
          )
            break;
          this.nicoScripts.replace.unshift({
            start: comment.vpos,
            long: data.long === null ? null : Math.floor(data.long * 100),
            keyword: result[0],
            replace: result[1] || "",
            range: result[2] || "単",
            target: result[3] || "コメ",
            condition: result[4] || "部分一致",
            color: data.color,
            size: data.size,
            font: data.font,
            loc: data.loc,
          });
          break;
      }
      data.invisible = true;
    }
    let color = undefined,
      size = undefined,
      font = undefined,
      loc = undefined;
    for (let i = 0; i < this.nicoScripts.default.length; i++) {
      const item = this.nicoScripts.default[i];
      if (!item) continue;
      if (item.long !== null && item.start + item.long < comment.vpos) {
        this.nicoScripts.default = this.nicoScripts.default.splice(
          Number(i),
          1
        );
        continue;
      }
      if (item.loc) {
        loc = item.loc;
      }
      if (item.color) {
        color = item.color;
      }
      if (item.size) {
        size = item.size;
      }
      if (item.font) {
        font = item.font;
      }
      if (loc && color && size && font) break;
    }
    for (let i = 0; i < this.nicoScripts.replace.length; i++) {
      const item = this.nicoScripts.replace[i];
      if (!item) continue;
      if (item.long !== null && item.start + item.long < comment.vpos) {
        this.nicoScripts.default = this.nicoScripts.default.splice(
          Number(i),
          1
        );
        continue;
      }
      if (
        (item.target === "コメ" && comment.owner) ||
        (item.target === "投コメ" && !comment.owner) ||
        (item.target === "含まない" && comment.owner)
      )
        continue;
      if (
        (item.condition === "完全一致" && comment.content === item.keyword) ||
        (item.condition === "部分一致" &&
          comment.content.indexOf(item.keyword) !== -1)
      ) {
        if (item.range === "単") {
          comment.content = replaceAll(
            comment.content,
            item.keyword,
            item.replace
          );
        } else {
          comment.content = item.replace;
        }
        if (item.loc) {
          loc = item.loc;
        }
        if (item.color) {
          color = item.color;
        }
        if (item.size) {
          size = item.size;
        }
        if (item.font) {
          font = item.font;
        }
      }
    }
    if (!data.loc) {
      data.loc = loc || "naka";
    }
    if (!data.color) {
      data.color = color || "#FFFFFF";
    }
    if (!data.size) {
      data.size = size || "medium";
      data.fontSize = this.fontSize[data.size].default;
    }
    if (!data.font) {
      data.font = font || "defont";
    }
    if (!data.long) {
      data.long = 300;
    } else {
      data.long = Math.floor(Number(data.long) * 100);
    }
    return { ...comment, ...data } as formattedCommentWithFont;
  }

  /**
   * キャンバスを描画する
   * @param vpos - 動画の現在位置の100倍 ニコニコから吐き出されるコメントの位置情報は主にこれ
   */
  drawCanvas(vpos: number) {
    const drawCanvasStart = performance.now();
    if (this.lastVpos === vpos) return;
    this.lastVpos = vpos;
    this.fpsCount++;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
        if (comment.image === undefined) {
          this.getTextImage(index);
        }
        try {
          this.drawText(comment, vpos);
        } catch (e) {
          comment.image = false;
        }
      }
    }
    if (this.showFPS) {
      this.context.font = parseFont("defont", 60, this.useLegacy);
      this.context.fillStyle = "#00FF00";
      this.context.strokeStyle = "rgba(0,0,0,0.7)";
      this.context.strokeText(`FPS:${this.fps}`, 100, 100);
      this.context.fillText(`FPS:${this.fps}`, 100, 100);
    }
    if (this.showCommentCount) {
      this.context.font = parseFont("defont", 60, this.useLegacy);
      this.context.fillStyle = "#00FF00";
      this.context.strokeStyle = "rgba(0,0,0,0.7)";
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
  clear() {
    this.context.clearRect(0, 0, 1920, 1080);
  }
}

/**
 * 配列をフォントとサイズでグループ化する
 * @param {{}} array
 * @returns {{}}
 */
const groupBy = (array: formattedCommentWithFont[]): groupedComments => {
  const data = (["defont", "gothic", "mincho"] as commentFont[]).reduce(
    (pv, font) => {
      pv[font] = {};
      return pv;
    },
    {} as groupedComments
  );
  array.forEach((item, index) => {
    const value = data[item.font][item.fontSize] || [];
    value.push({ ...item, index });
    if (value.length === 1) {
      data[item.font][item.fontSize] = value;
    }
  });
  return data;
};
/**
 *
 */
const getPosY = (
  currentPos: number,
  targetComment: parsedComment,
  collision: number[] | undefined,
  data: parsedComment[]
): { currentPos: number; isChanged: boolean; isBreak: boolean } => {
  let isChanged = false,
    isBreak = false;
  if (!collision) return { currentPos, isChanged, isBreak };
  for (const index of collision) {
    const collisionItem = data[index];
    if (!collisionItem) continue;
    if (
      currentPos < collisionItem.posY + collisionItem.height &&
      currentPos + targetComment.height > collisionItem.posY &&
      collisionItem.owner === targetComment.owner &&
      collisionItem.layer === targetComment.layer
    ) {
      if (collisionItem.posY + collisionItem.height > currentPos) {
        currentPos = collisionItem.posY + collisionItem.height;
        isChanged = true;
      }
      if (currentPos + targetComment.height > 1080) {
        if (1080 < targetComment.height) {
          currentPos = (targetComment.height - 1080) / -2;
        } else {
          currentPos = Math.floor(
            Math.random() * (1080 - targetComment.height)
          );
        }
        isBreak = true;
        break;
      }
    }
  }
  return { currentPos, isChanged, isBreak };
};
/**
 * フォント名とサイズをもとにcontextで使えるフォントを生成する
 * @param {string} font
 * @param {string|number} size
 * @param {boolean} useLegacy
 * @returns {string}
 */
const parseFont = (
  font: commentFont,
  size: string | number,
  useLegacy: boolean
): string => {
  switch (font) {
    case "gothic":
      return `normal 400 ${size}px "游ゴシック体", "游ゴシック", "Yu Gothic", YuGothic, yugothic, YuGo-Medium`;
    case "mincho":
      return `normal 400 ${size}px "游明朝体", "游明朝", "Yu Mincho", YuMincho, yumincho, YuMin-Medium`;
    default:
      if (useLegacy) {
        return `normal 600 ${size}px Arial, "ＭＳ Ｐゴシック", "MS PGothic", MSPGothic, MS-PGothic`;
      } else {
        return `normal 600 ${size}px sans-serif, Arial, "ＭＳ Ｐゴシック", "MS PGothic", MSPGothic, MS-PGothic`;
      }
  }
};
/**
 * phpのarray_push的なあれ
 * @param array
 * @param {string|number} key
 * @param push
 */
const arrayPush = (
  array: { [key: number]: number[] },
  key: string | number,
  push: number
) => {
  if (!array) {
    array = {};
  }
  if (!array[Number(key)]) {
    array[Number(key)] = [];
  }
  array[Number(key)]?.push(push);
};
/**
 * Hexからrgbに変換する(_live用)
 * @param {string} hex
 * @return {array} RGB
 */
const hex2rgb = (hex: string) => {
  if (hex.slice(0, 1) === "#") hex = hex.slice(1);
  if (hex.length === 3)
    hex =
      hex.slice(0, 1) +
      hex.slice(0, 1) +
      hex.slice(1, 2) +
      hex.slice(1, 2) +
      hex.slice(2, 3) +
      hex.slice(2, 3);

  return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(function (
    str
  ) {
    return parseInt(str, 16);
  });
};
/**
 * replaceAll
 */
const replaceAll = (string: string, target: string, replace: string) => {
  let count = 0;
  while (string.indexOf(target) !== -1 && count < 100) {
    string = string.replace(target, replace);
    count++;
  }
  return string;
};

const logger = (msg: string) => {
  if (isDebug) console.debug(msg);
};

const changeCALayer = (rawData: formattedComment[]): formattedComment[] => {
  const userList: { [key: number]: number } = {};
  const data: formattedComment[] = [],
    index: { [key: string]: formattedComment } = {};
  for (const value of rawData) {
    if (value.user_id === undefined || value.user_id === -1) continue;
    if (userList[value.user_id] === undefined) userList[value.user_id] = 0;
    if (
      value.mail.indexOf("ca") > -1 ||
      value.mail.indexOf("patissier") > -1 ||
      value.mail.indexOf("ender") > -1 ||
      value.mail.indexOf("full") > -1
    ) {
      userList[value.user_id] += 5;
    }
    if ((value.content.match(/\r\n|\n|\r/g) || []).length > 2) {
      userList[value.user_id] +=
        (value.content.match(/\r\n|\n|\r/g) || []).length / 2;
    }
    const key = `${value.content}@@${Array.from(
        new Set((JSON.parse(JSON.stringify(value.mail)) as string[]).sort())
      )
        .filter((e) => !e.match(/@[\d.]+|184|device:.+|patissier|ca/))
        .join("")}`,
      lastComment = index[key];
    if (lastComment !== undefined) {
      if (
        value.vpos - lastComment.vpos > 100 ||
        Math.abs(value.date - lastComment.date) < 3600
      ) {
        data.push(value);
        index[key] = value;
      }
    } else {
      data.push(value);
      index[key] = value;
    }
  }
  for (const value of data) {
    if (userList[value.user_id] || 0 >= 10) value.layer = value.user_id;
  }
  return data;
};

export default NiconiComments;
