import type {
  commentContentItem,
  commentMeasuredContentItem,
  formattedComment,
  formattedCommentWithFont,
  formattedCommentWithSize,
  HTML5Fonts,
  measureInput,
  measureTextInput,
  measureTextResult,
} from "@/@types/";
import { imageCache } from "@/contexts/";
import { config, options } from "@/definition/config";
import { CanvasRenderingContext2DError } from "@/errors/";
import {
  getCharSize,
  getFontSizeAndScale,
  getLineHeight,
  measure,
} from "@/nico";
import {
  getConfig,
  getStrokeColor,
  isLineBreakResize,
  parseCommandAndNicoScript,
  parseFont,
} from "@/utils";

import { BaseComment } from "./BaseComment";

class HTML5Comment extends BaseComment {
  override readonly pluginName: string = "HTML5Comment";
  constructor(comment: formattedComment, context: CanvasRenderingContext2D) {
    super(comment, context);
    this.posY = 0;
  }

  override convertComment(comment: formattedComment): formattedCommentWithSize {
    return this.getCommentSize(this.parseCommandAndNicoscript(comment));
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
    if (!comment.lineHeight) comment.lineHeight = lineHeight;
    if (!comment.charSize) comment.charSize = charSize;
    comment.fontSize = comment.charSize * 0.8;
    let width, height, itemWidth;
    this.context.font = parseFont(comment.font, comment.fontSize);
    if (isLineBreakResize(comment)) {
      comment.fontSize = configFontSize[comment.size].resized;
      const lineHeight = getLineHeight(comment.size, false, true);
      comment.charSize = comment.charSize * (lineHeight / comment.lineHeight);
      comment.lineHeight = lineHeight;
      comment.resized = true;
      comment.resizedY = true;
    }
    const measureResult = measure(comment as measureInput, this.context);
    height = measureResult.height;
    width = measureResult.width;
    itemWidth = measureResult.itemWidth;
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

    for (let i = 0, n = comment.content.length; i < n; i++) {
      const item = comment.content[i];
      if (!item || !itemWidth) continue;
      item.width = itemWidth[i];
    }
    comment.fontSize = (comment.charSize || 0) * 0.8;
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

  override _drawCollision(posX: number, posY: number, showCollision: boolean) {
    if (showCollision) {
      const scale = getConfig(config.commentScale, false);
      this.context.strokeStyle = "rgba(0,255,255,1)";
      this.context.strokeRect(
        posX,
        posY,
        this.comment.width,
        this.comment.height
      );
      for (let i = 0, n = this.comment.lineCount; i < n; i++) {
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
  }

  /**
   * drawTextで毎回fill/strokeすると重いので画像化して再利用できるようにする
   */
  override getTextImage(): HTMLCanvasElement | null {
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
    const { fontSize, scale } = getFontSizeAndScale(this.comment.charSize);
    const paddingTop =
      (10 - scale * 10) *
      ((this.comment.lineCount + 1) / config.hiResCommentCorrection);
    const image = document.createElement("canvas");
    image.width = this.comment.width + 2 * 2 * this.comment.charSize;
    document.body.append(image);
    image.height =
      this.comment.height +
      ((paddingTop + 1) * this.comment.lineHeight) / scale;
    const context = image.getContext("2d");
    if (!context) throw new CanvasRenderingContext2DError();
    context.strokeStyle = getStrokeColor(this.comment);
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
    context.lineWidth = config.contextLineWidth;
    context.font = parseFont(this.comment.font, fontSize);
    const drawScale =
      getConfig(config.commentScale, false) *
      scale *
      (this.comment.layer === -1 ? options.scale : 1);
    context.scale(drawScale, drawScale);
    context.fillStyle = this.comment.color;
    let leftOffset = 0,
      lineCount = 0;
    for (const item of this.comment.content) {
      const lines = item.content.split("\n");
      for (let j = 0, n = lines.length; j < n; j++) {
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
