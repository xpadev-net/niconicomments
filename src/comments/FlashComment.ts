import type {
  commentContentItem,
  commentMeasuredContentItem,
  formattedComment,
  formattedCommentWithFont,
  formattedCommentWithSize,
  measureTextInput,
  measureTextResult,
} from "@/@types/";
import { config, options } from "@/definition/config";
import {
  getConfig,
  getFlashFontIndex,
  getFlashFontName,
  getStrokeColor,
  isLineBreakResize,
  nativeSort,
  parseCommandAndNicoScript,
  parseFont,
} from "@/utils";

import { BaseComment } from "./BaseComment";

class FlashComment extends BaseComment {
  private _globalScale: number;
  private scale: number;
  private scaleX: number;
  override readonly pluginName: string = "FlashComment";
  constructor(comment: formattedComment, context: CanvasRenderingContext2D) {
    super(comment, context);
    this.scale ??= 1;
    this.scaleX ??= 1;
    this._globalScale ??= getConfig(config.commentScale, true);
    this.posY ??= 0;
  }

  override convertComment(comment: formattedComment): formattedCommentWithSize {
    this.scale = 1;
    this.scaleX = 1;
    this._globalScale = getConfig(config.commentScale, true);
    this.posY = 0;
    return this.getCommentSize(this.parseCommandAndNicoscript(comment));
  }

  /**
   * コメントの描画サイズを計算する
   * @param parsedData 計算対象のコメント
   * @returns 計算結果
   */
  override getCommentSize(
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

  override parseCommandAndNicoscript(
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
          lineContent.push({ content: part, slicedContent: part.split("\n") });
          continue;
        }
        const index = getFlashFontIndex(part);
        if (index.length === 0) {
          lineContent.push({ content: part, slicedContent: part.split("\n") });
        } else if (index.length === 1 && index[0]) {
          lineContent.push({
            content: part,
            slicedContent: part.split("\n"),
            font: getFlashFontName(index[0].font),
          });
        } else {
          index.sort(nativeSort((val) => val.index));
          if (config.flashMode === "xp") {
            let offset = 0;
            for (let i = 1, n = index.length; i < n; i++) {
              const currentVal = index[i],
                lastVal = index[i - 1];
              if (currentVal === undefined || lastVal === undefined) continue;
              const content = part.slice(offset, currentVal.index);
              lineContent.push({
                content: content,
                slicedContent: content.split("\n"),
                font: getFlashFontName(lastVal.font),
              });
              offset = currentVal.index;
            }
            const val = index[index.length - 1];
            if (val) {
              const content = part.slice(offset);
              lineContent.push({
                content: content,
                slicedContent: content.split("\n"),
                font: getFlashFontName(val.font),
              });
            }
          } else {
            const firstVal = index[0],
              secondVal = index[1];
            if (!firstVal || !secondVal) {
              lineContent.push({
                content: part,
                slicedContent: part.split("\n"),
              });
              continue;
            }
            if (firstVal.font !== "gothic") {
              lineContent.push({
                content: part,
                slicedContent: part.split("\n"),
                font: getFlashFontName(firstVal.font),
              });
            } else {
              const firstContent = part.slice(0, secondVal.index);
              const secondContent = part.slice(secondVal.index);
              lineContent.push({
                content: firstContent,
                slicedContent: firstContent.split("\n"),
                font: getFlashFontName(firstVal.font),
              });
              lineContent.push({
                content: secondContent,
                slicedContent: secondContent.split("\n"),
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

  override measureText(comment: measureTextInput): measureTextResult {
    const configLineHeight = getConfig(config.lineHeight, true),
      configFontSize = getConfig(config.fontSize, true);
    const lineCount = comment.lineCount;
    if (!comment.lineHeight)
      comment.lineHeight = configLineHeight[comment.size].default;
    if (isLineBreakResize(comment)) {
      comment.fontSize = configFontSize[comment.size].resized;
      comment.lineHeight = configLineHeight[comment.size].resized;
      comment.resized = true;
      comment.resizedY = true;
      this.context.font = parseFont(comment.font, comment.fontSize);
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
      for (let i = 0, n = lines.length; i < n; i++) {
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

  override _drawCollision(posX: number, posY: number, showCollision: boolean) {
    if (showCollision) {
      this.context.strokeStyle = "rgba(255,0,255,1)";
      this.context.strokeRect(
        posX,
        posY,
        this.comment.width,
        this.comment.height
      );
      for (let i = 0, n = this.comment.lineCount; i < n; i++) {
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
  }

  override _generateTextImage(): HTMLCanvasElement {
    const { image, context } = this.createCanvas();
    image.width = this.comment.width;
    image.height = this.comment.height;
    context.strokeStyle = getStrokeColor(this.comment);
    context.fillStyle = this.comment.color;
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
    context.lineWidth = 4;
    context.font = parseFont(this.comment.font, this.comment.fontSize);
    const scale =
      this._globalScale *
      this.scale *
      (this.comment.layer === -1 ? options.scale : 1);
    context.scale(scale * this.scaleX, scale);
    const lineOffset = this.comment.lineOffset;
    const offsetKey = this.comment.resizedY ? "resized" : "default";
    const offsetY =
      config.commentYPaddingTop[offsetKey] +
      this.comment.fontSize *
        this.comment.lineHeight *
        config.commentYOffset[this.comment.size][offsetKey];
    let lastFont = this.comment.font,
      leftOffset = 0,
      lineCount = 0;
    for (const item of this.comment.content) {
      if (lastFont !== (item.font || this.comment.font)) {
        lastFont = item.font || this.comment.font;
        context.font = parseFont(lastFont, this.comment.fontSize);
      }
      const lines = item.slicedContent;
      for (let j = 0, n = lines.length; j < n; j++) {
        const line = lines[j];
        if (line === undefined) continue;
        const posY =
          (lineOffset + lineCount + 1) *
            (this.comment.fontSize * this.comment.lineHeight) +
          offsetY;
        context.strokeText(line, leftOffset, posY);
        context.fillText(line, leftOffset, posY);
        if (j < n - 1) {
          leftOffset = 0;
          lineCount += 1;
        } else {
          leftOffset += item.width[j] || 0;
        }
      }
    }
    return image;
  }
}

export { FlashComment };
