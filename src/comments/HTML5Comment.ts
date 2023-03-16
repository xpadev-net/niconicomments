import {
  createError,
  getConfig,
  getPosX,
  getStrokeColor,
  parseCommandAndNicoScript,
  parseFont,
} from "@/util";
import { config, options } from "@/definition/config";
import { nicoScripts } from "@/contexts/nicoscript";
import {
  getCharSize,
  getFontSizeAndScale,
  getLineHeight,
  measure,
} from "@/nico";
import { imageCache } from "@/contexts/cache";
import type { IComment } from "@/@types/IComment";
import type {
  commentContentItem,
  commentMeasuredContentItem,
  formattedCommentWithFont,
  formattedCommentWithSize,
  measureInput,
  measureTextInput,
  measureTextResult,
} from "@/@types/types";
import type { formattedComment } from "@/@types/format.formatted";

class HTML5Comment implements IComment {
  private readonly context: CanvasRenderingContext2D;
  public readonly comment: formattedCommentWithSize;
  public posY: number;
  public image?: HTMLCanvasElement | null;
  constructor(comment: formattedComment, context: CanvasRenderingContext2D) {
    this.context = context;
    comment.content = comment.content.replace(/\t/g, "\u2003\u2003");
    this.comment = this.getCommentSize(this.parseCommandAndNicoscript(comment));
    this.posY = 0;
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
    content.push({ content: comment.content });
    const lineCount = content.reduce((pv, val) => {
      return pv + (val.content.match(/\n/g)?.length || 0);
    }, 1);
    const lineOffset = 0;
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
    const widthLimit = getConfig(config.commentStageSize, false)[
        comment.full ? "fullWidth" : "width"
      ],
      scale = getConfig(config.commentScale, false);
    const configFontSize = getConfig(config.fontSize, false),
      lineHeight = getLineHeight(comment.size, false),
      charSize = getCharSize(comment.size, false);
    const lineCount = comment.lineCount;
    if (!comment.lineHeight) comment.lineHeight = lineHeight;
    if (!comment.charSize) comment.charSize = charSize;
    comment.fontSize = comment.charSize * 0.8;
    let width, height, itemWidth;
    this.context.font = parseFont(comment.font, comment.fontSize);
    if (
      !comment.resized &&
      !comment.ender &&
      ((comment.size === "big" && lineCount > 2) ||
        (comment.size === "medium" && lineCount > 4) ||
        (comment.size === "small" && lineCount > 6))
    ) {
      comment.fontSize = configFontSize[comment.size].resized;
      const lineHeight = getLineHeight(comment.size, false, true);
      comment.charSize = comment.charSize * (lineHeight / comment.lineHeight);
      comment.lineHeight = lineHeight;
      comment.resized = true;
      comment.resizedY = true;
      const measureResult = measure(comment as measureInput, this.context);
      height = measureResult.height;
      width = measureResult.width;
      itemWidth = measureResult.itemWidth;
    } else {
      const measureResult = measure(comment as measureInput, this.context);
      height = measureResult.height;
      width = measureResult.width;
      itemWidth = measureResult.itemWidth;
    }
    if (comment.loc !== "naka" && width > widthLimit) {
      const scale = widthLimit / width;
      comment.resizedX = true;
      let _comment = { ...comment };
      _comment.charSize = (_comment.charSize || 0) * scale;
      _comment.lineHeight = (_comment.lineHeight || 0) * scale;
      _comment.fontSize = _comment.charSize * 0.8;
      let result = measure(_comment as measureInput, this.context);
      if (result.width > widthLimit) {
        while (result.width >= widthLimit) {
          const originalCharSize = _comment.charSize;
          _comment.charSize -= 1;
          _comment.lineHeight *= _comment.charSize / originalCharSize;
          _comment.fontSize = _comment.charSize * 0.8;
          result = measure(_comment as measureInput, this.context);
        }
      } else {
        let lastComment = { ..._comment };
        while (result.width < widthLimit) {
          lastComment = { ..._comment };
          const originalCharSize = _comment.charSize;
          _comment.charSize += 1;
          _comment.lineHeight *= _comment.charSize / originalCharSize;
          _comment.fontSize = _comment.charSize * 0.8;
          result = measure(_comment as measureInput, this.context);
        }
        _comment = lastComment;
      }
      if (comment.resizedY) {
        const scale = (_comment.charSize || 0) / comment.charSize;
        comment.charSize = scale * charSize;
        comment.lineHeight = scale * lineHeight;
      } else {
        comment.charSize = _comment.charSize;
        comment.lineHeight = _comment.lineHeight;
      }
      comment.fontSize = (comment.charSize || 0) * 0.8;
      result = measure(comment as measureInput, this.context);
      width = result.width;
      height = result.height;
      itemWidth = result.itemWidth;
    }

    for (let i = 0; i < comment.content.length; i++) {
      const item = comment.content[i];
      if (!item || !itemWidth) continue;
      item.width = itemWidth[i];
    }
    comment.fontSize = (comment.charSize || 0) * 0.8;
    const charScale = getFontSizeAndScale(comment.charSize || 0);
    if (charScale.scale < 1) height *= 1.01;
    return {
      width: width * scale,
      height: height * scale,
      resized: !!comment.resized,
      fontSize: comment.fontSize,
      lineHeight: comment.lineHeight || 0,
      content: comment.content as commentMeasuredContentItem[],
      resizedX: !!comment.resizedX,
      resizedY: !!comment.resizedY,
      charSize: comment.charSize || 0,
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
      measure.fontSize *= options.scale;
    }
    size.height = measure.height;
    size.width = measure.width;
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
      const scale = getConfig(config.commentScale, false);
      this.context.strokeStyle = "rgba(0,255,255,1)";
      this.context.strokeRect(
        posX,
        posY,
        this.comment.width,
        this.comment.height
      );
      for (let i = 0; i < this.comment.lineCount; i++) {
        const linePosY =
          (this.comment.lineHeight * (i + 1) +
            (this.comment.charSize - this.comment.lineHeight) / 2 +
            this.comment.lineHeight * -0.16 +
            (config.fonts[this.comment.font as unknown as HTML5Fonts]?.offset ||
              0)) *
          scale;
        this.context.strokeStyle = "rgba(255,255,0,0.5)";
        this.context.strokeRect(
          posX,
          posY + linePosY,
          this.comment.width,
          this.comment.fontSize * -1 * scale
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
        "@@HTML5@@" +
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
    if (this.image) return this.image;
    const image = document.createElement("canvas");
    image.width = this.comment.width + 2 * 2 * this.comment.charSize;
    image.height =
      this.comment.height - (this.comment.charSize - this.comment.lineHeight);
    const context = image.getContext("2d");
    if (!context) throw createError("Fail to get CanvasRenderingContext2D");
    context.strokeStyle = getStrokeColor(this.comment);
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
    context.lineWidth = config.contextLineWidth;
    const { fontSize, scale } = getFontSizeAndScale(this.comment.charSize);
    context.font = parseFont(this.comment.font, fontSize);
    const drawScale =
      getConfig(config.commentScale, false) *
      scale *
      (this.comment.layer === -1 ? options.scale : 1);
    context.scale(drawScale, drawScale);
    context.fillStyle = this.comment.color;
    let leftOffset = 0,
      lineCount = 0;
    const paddingTop =
      (10 - scale * 10) *
      (this.comment.lineCount / config.hiResCommentCorrection);
    for (const item of this.comment.content) {
      const lines = item.content.split("\n");
      for (let j = 0; j < lines.length; j++) {
        const line = lines[j];
        if (line === undefined) continue;
        const posY =
          (this.comment.lineHeight * (lineCount + 1 + paddingTop) +
            (this.comment.charSize - this.comment.lineHeight) / 2 +
            this.comment.lineHeight * -0.16 +
            (config.fonts[this.comment.font as unknown as HTML5Fonts]?.offset ||
              0)) /
          scale;
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

export { HTML5Comment };
