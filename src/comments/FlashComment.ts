import {
  createError,
  getConfig,
  getFlashFontIndex,
  getFlashFontName,
  getPosX,
  getStrokeColor,
  nativeSort,
  parseCommandAndNicoScript,
  parseFont,
} from "@/util";
import { config, options } from "@/definition/config";
import { nicoScripts } from "@/contexts/nicoscript";
import { imageCache } from "@/contexts/cache";
import type { IComment } from "@/@types/IComment";
import type {
  commentContentItem,
  commentMeasuredContentItem,
  formattedCommentWithFont,
  formattedCommentWithSize,
  measureTextInput,
  measureTextResult,
} from "@/@types/types";
import type { formattedComment } from "@/@types/format.formatted";

class FlashComment implements IComment {
  private readonly context: CanvasRenderingContext2D;
  public readonly comment: formattedCommentWithSize;
  private readonly _globalScale: number;
  private scale: number;
  private scaleX: number;
  public posY: number;
  public image?: HTMLCanvasElement | null;
  constructor(comment: formattedComment, context: CanvasRenderingContext2D) {
    this.context = context;
    this.scale = 1;
    this.scaleX = 1;
    this._globalScale = getConfig(config.commentScale, true);
    this.posY = 0;
    comment.content = comment.content.replace(/\t/g, "\u2003\u2003");
    this.comment = this.getCommentSize(this.parseCommandAndNicoscript(comment));
  }

  get invisible() {
    return this.comment.invisible;
  }
  get loc() {
    return this.comment.loc;
  }
  get long() {
    return this.comment.long;
  }
  get vpos() {
    return this.comment.vpos;
  }
  get width() {
    return this.comment.width;
  }
  get height() {
    return this.comment.height;
  }
  get flash() {
    return false;
  }
  get layer() {
    return this.comment.layer;
  }
  get owner() {
    return this.comment.owner;
  }
  get mail() {
    return this.comment.mail;
  }
  get lineCount() {
    return this.comment.lineCount;
  }

  /**
   * コメントに含まれるニコスクリプトを処理する
   * @param comment
   */
  parseCommandAndNicoscript(
    comment: formattedComment
  ): formattedCommentWithFont {
    const data = parseCommandAndNicoScript(comment);
    const content: commentContentItem[] = [];
    const parts = (comment.content.match(/\n|[^\n]+/g) || []).map((val) =>
      Array.from(val.match(/[ -~｡-ﾟ]+|[^ -~｡-ﾟ]+/g) || [])
    );
    for (const line of parts) {
      const lineContent: commentContentItem[] = [];
      for (const part of line) {
        if (part.match(/[ -~｡-ﾟ]+/g) !== null) {
          lineContent.push({ content: part });
          continue;
        }
        const index = getFlashFontIndex(part);
        if (index.length === 0) {
          lineContent.push({ content: part });
        } else if (index.length === 1 && index[0]) {
          lineContent.push({
            content: part,
            font: getFlashFontName(index[0].font),
          });
        } else {
          index.sort(nativeSort((val) => val.index));
          if (config.flashMode === "xp") {
            let offset = 0;
            for (let i = 1; i < index.length; i++) {
              const currentVal = index[i],
                lastVal = index[i - 1];
              if (currentVal === undefined || lastVal === undefined) continue;
              lineContent.push({
                content: part.slice(offset, currentVal.index),
                font: getFlashFontName(lastVal.font),
              });
              offset = currentVal.index;
            }
            const val = index[index.length - 1];
            if (val)
              lineContent.push({
                content: part.slice(offset),
                font: getFlashFontName(val.font),
              });
          } else {
            const firstVal = index[0],
              secondVal = index[1];
            if (!firstVal || !secondVal) {
              lineContent.push({ content: part });
              continue;
            }
            if (firstVal.font !== "gothic") {
              lineContent.push({
                content: part,
                font: getFlashFontName(firstVal.font),
              });
            } else {
              lineContent.push({
                content: part.slice(0, secondVal.index),
                font: getFlashFontName(firstVal.font),
              });
              lineContent.push({
                content: part.slice(secondVal.index),
                font: getFlashFontName(secondVal.font),
              });
            }
          }
        }
      }
      const firstContent = lineContent[0];
      if (firstContent && firstContent.font) {
        content.push(
          ...lineContent.map((val) => {
            if (!val.font) {
              val.font = firstContent.font;
            }
            return val;
          })
        );
      } else {
        content.push(...lineContent);
      }
    }
    const val = content[0];
    if (val && val.font) {
      data.font = val.font;
    }
    const lineCount = content.reduce((pv, val) => {
      return pv + (val.content.match(/\n/g)?.length || 0);
    }, 1);
    const lineOffset =
      (comment.content.match(new RegExp(config.flashScriptChar.super, "g"))
        ?.length || 0) *
        -1 *
        config.scriptCharOffset +
      (comment.content.match(new RegExp(config.flashScriptChar.sub, "g"))
        ?.length || 0) *
        config.scriptCharOffset;
    return {
      ...data,
      content,
      lineCount,
      lineOffset,
    } as formattedCommentWithFont;
  }

  /**
   * context.measureTextの複数行対応版
   * 画面外にはみ出すコメントの縮小も行う
   * @param comment - 独自フォーマットのコメントデータ
   * @returns {{resized: boolean, width: number, width: number, fontSize: number, width_min: number, height: number, lineHeight: number}} - 描画サイズとリサイズの情報
   */
  measureText(comment: measureTextInput): measureTextResult {
    const configLineHeight = getConfig(config.lineHeight, true),
      configFontSize = getConfig(config.fontSize, true);
    const lineCount = comment.lineCount;
    if (!comment.lineHeight)
      comment.lineHeight = configLineHeight[comment.size].default;
    if (!comment.resized && !comment.ender) {
      if (
        (comment.size === "big" && lineCount > 2) ||
        (comment.size === "medium" && lineCount > 4) ||
        (comment.size === "small" && lineCount > 6)
      ) {
        comment.fontSize = configFontSize[comment.size].resized;
        comment.lineHeight = configLineHeight[comment.size].resized;
        comment.resized = true;
        comment.resizedY = true;
        this.context.font = parseFont(comment.font, comment.fontSize);
      }
    }
    const width_arr = [],
      spacedWidth_arr = [];
    let currentWidth = 0,
      spacedWidth = 0;
    for (const item of comment.content) {
      const lines = item.content.split("\n");
      const widths = [];

      this.context.font = parseFont(
        item.font || comment.font,
        comment.fontSize
      );
      for (let i = 0; i < lines.length; i++) {
        const value = lines[i];
        if (value === undefined) continue;
        const measure = this.context.measureText(value);
        currentWidth += measure.width;
        spacedWidth +=
          measure.width + Math.max(value.length - 1, 0) * config.letterSpacing;
        widths.push(measure.width);
        if (i < lines.length - 1) {
          width_arr.push(currentWidth);
          spacedWidth_arr.push(spacedWidth);
          spacedWidth = 0;
          currentWidth = 0;
        }
      }
      width_arr.push(currentWidth);
      spacedWidth_arr.push(spacedWidth);
      item.width = widths;
    }
    const leadLine = (function () {
      let max = 0,
        index = -1;
      for (let i = 0, l = spacedWidth_arr.length; i < l; i++) {
        const val = spacedWidth_arr[i];
        if (val && max < val) {
          max = val;
          index = i;
        }
      }
      return { max, index };
    })();
    const width = leadLine.max;
    this.scaleX = leadLine.max / (width_arr[leadLine.index] || 1);
    const width_max = width * this.scale;
    const height =
      (comment.fontSize * comment.lineHeight * lineCount +
        config.commentYPaddingTop[comment.resizedY ? "resized" : "default"]) *
      this.scale;
    if (comment.loc !== "naka") {
      const widthLimit = getConfig(config.commentStageSize, true)[
        comment.full ? "fullWidth" : "width"
      ];
      if (width_max > widthLimit && !comment.resizedX) {
        comment.fontSize = configFontSize[comment.size].default;
        comment.lineHeight = configLineHeight[comment.size].default;
        this.scale = widthLimit / width_max;
        comment.resizedX = true;
        comment.resized = true;
        return this.measureText(comment);
      }
    }
    return {
      width: width_max,
      charSize: 0,
      height: height,
      resized: !!comment.resized,
      fontSize: comment.fontSize,
      lineHeight: comment.lineHeight,
      content: comment.content as commentMeasuredContentItem[],
      resizedX: !!comment.resizedX,
      resizedY: !!comment.resizedY,
    };
  }

  /**
   * コメントの描画サイズを計算する
   */
  getCommentSize(
    parsedData: formattedCommentWithFont
  ): formattedCommentWithSize {
    this.context.font = parseFont(parsedData.font, parsedData.fontSize);
    const size = parsedData as formattedCommentWithSize;
    if (parsedData.invisible) {
      size.height = 0;
      size.width = 0;
      size.lineHeight = 0;
      size.fontSize = 0;
      size.content = [];
      size.resized = false;
      size.resizedX = false;
      size.resizedY = false;
      size.charSize = 0;
      return size;
    }
    const measure = this.measureText(parsedData);
    if (options.scale !== 1 && size.layer === -1) {
      measure.height *= options.scale;
      measure.width *= options.scale;
    }
    size.height = measure.height * this._globalScale;
    size.width = measure.width * this._globalScale;
    size.lineHeight = measure.lineHeight;
    size.fontSize = measure.fontSize;
    size.content = measure.content;
    size.resized = measure.resized;
    size.resizedX = measure.resizedX;
    size.resizedY = measure.resizedY;
    size.charSize = measure.charSize;
    return size;
  }

  draw(vpos: number, showCollision: boolean, debug: boolean) {
    let reverse = false;
    for (const range of nicoScripts.reverse) {
      if (
        (range.target === "コメ" && this.comment.owner) ||
        (range.target === "投コメ" && !this.comment.owner)
      )
        break;
      if (range.start < vpos && vpos < range.end) {
        reverse = true;
      }
    }
    for (const range of nicoScripts.ban) {
      if (range.start < vpos && vpos < range.end) return;
    }
    let posX = (config.canvasWidth - this.comment.width) / 2,
      posY = this.posY;
    if (this.comment.loc === "naka") {
      if (reverse) {
        posX =
          config.canvasWidth +
          this.comment.width -
          getPosX(
            this.comment.width,
            vpos - this.comment.vpos,
            this.comment.long
          );
      } else {
        posX = getPosX(
          this.comment.width,
          vpos - this.comment.vpos,
          this.comment.long
        );
      }
      if (posX > config.canvasWidth || posX + this.comment.width < 0) {
        return;
      }
    } else if (this.comment.loc === "shita") {
      posY = config.canvasHeight - this.posY - this.comment.height;
    }
    if (this.image === undefined) {
      this.image = this.getTextImage();
    }
    if (this.image) {
      if (this.comment._live) {
        this.context.globalAlpha = config.contextFillLiveOpacity;
      } else {
        this.context.globalAlpha = 1;
      }
      this.context.drawImage(this.image, posX, posY);
    }
    if (this.comment.wakuColor) {
      this.context.strokeStyle = this.comment.wakuColor;
      this.context.strokeRect(
        posX,
        posY,
        this.comment.width,
        this.comment.height
      );
    }
    if (showCollision) {
      this.context.strokeStyle = "rgba(255,0,255,1)";
      this.context.strokeRect(
        posX,
        posY,
        this.comment.width,
        this.comment.height
      );
      for (let i = 0; i < this.comment.lineCount; i++) {
        const linePosY =
          ((i + 1) * (this.comment.fontSize * this.comment.lineHeight) +
            config.commentYPaddingTop[
              this.comment.resizedY ? "resized" : "default"
            ]) *
          this.scale;
        this.context.strokeStyle = `rgba(255,255,0,0.25)`;
        this.context.strokeRect(
          posX,
          posY + linePosY * this._globalScale,
          this.comment.width,
          this.comment.fontSize *
            this.comment.lineHeight *
            -1 *
            this._globalScale *
            this.scale *
            (this.comment.layer === -1 ? options.scale : 1)
        );
      }
    }
    if (debug) {
      const font = this.context.font;
      const fillStyle = this.context.fillStyle;
      this.context.font = parseFont("defont", 30);
      this.context.fillStyle = "#ff00ff";
      this.context.fillText(this.comment.mail.join(","), posX, posY + 30);
      this.context.font = font;
      this.context.fillStyle = fillStyle;
    }
  }

  /**
   * drawTextで毎回fill/strokeすると重いので画像化して再利用できるようにする
   */
  getTextImage(): HTMLCanvasElement | null {
    if (
      this.comment.invisible ||
      (this.comment.lineCount === 1 && this.comment.width === 0) ||
      this.comment.height - (this.comment.charSize - this.comment.lineHeight) <=
        0
    )
      return null;
    const cacheKey =
        JSON.stringify(this.comment.content) +
        "@@FLASH@@" +
        [...this.comment.mail].sort().join(","),
      cache = imageCache[cacheKey];
    if (cache) {
      this.image = cache.image;
      window.setTimeout(() => {
        delete this.image;
      }, this.comment.long * 10 + config.cacheAge);
      clearTimeout(cache.timeout);
      cache.timeout = window.setTimeout(() => {
        delete imageCache[cacheKey];
      }, this.comment.long * 10 + config.cacheAge);
      return cache.image;
    }
    const image = document.createElement("canvas");
    image.width = this.comment.width;
    image.height = this.comment.height;
    const context = image.getContext("2d");
    if (!context) throw createError("Fail to get CanvasRenderingContext2D");
    context.strokeStyle = getStrokeColor(this.comment);
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
    context.lineWidth = 4;
    context.font = parseFont(this.comment.font, this.comment.fontSize);
    context.scale(
      this._globalScale *
        this.scale *
        (this.comment.layer === -1 ? options.scale : 1) *
        this.scaleX,
      this._globalScale *
        this.scale *
        (this.comment.layer === -1 ? options.scale : 1)
    );
    context.fillStyle = this.comment.color;
    const lineOffset = this.comment.lineOffset;
    let lastFont = this.comment.font,
      leftOffset = 0,
      lineCount = 0;
    for (const item of this.comment.content) {
      if (lastFont !== (item.font || this.comment.font)) {
        lastFont = item.font || this.comment.font;
        context.font = parseFont(lastFont, this.comment.fontSize);
      }
      const lines = item.content.split("\n");
      for (let j = 0; j < lines.length; j++) {
        const line = lines[j];
        if (line === undefined) continue;
        const posY =
          (lineOffset + lineCount + 1) *
            (this.comment.fontSize * this.comment.lineHeight) +
          config.commentYPaddingTop[
            this.comment.resizedY ? "resized" : "default"
          ] +
          this.comment.fontSize *
            this.comment.lineHeight *
            config.commentYOffset[this.comment.size][
              this.comment.resizedY ? "resized" : "default"
            ];
        context.strokeText(line, leftOffset, posY);
        context.fillText(line, leftOffset, posY);
        if (j < lines.length - 1) {
          leftOffset = 0;
          lineCount += 1;
        } else {
          leftOffset += item.width[j] || 0;
        }
      }
    }

    this.image = image;
    window.setTimeout(() => {
      delete this.image;
    }, this.comment.long * 10 + config.cacheAge);
    imageCache[cacheKey] = {
      timeout: window.setTimeout(() => {
        delete imageCache[cacheKey];
      }, this.comment.long * 10 + config.cacheAge),
      image,
    };

    return image;
  }
}

export { FlashComment };
