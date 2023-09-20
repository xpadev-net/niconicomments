import type {
  Canvas,
  CommentContentItem,
  Context2D,
  FormattedComment,
  FormattedCommentWithFont,
  FormattedCommentWithSize,
  MeasureTextInput,
  MeasureTextResult,
} from "@/@types/";
import { config, options } from "@/definition/config";
import { TypeGuardError } from "@/errors/TypeGuardError";
import typeGuard from "@/typeGuard";
import {
  getConfig,
  getStrokeColor,
  isLineBreakResize,
  parseCommandAndNicoScript,
  parseContent,
  parseFont,
} from "@/utils";

import { BaseComment } from "./BaseComment";

class FlashComment extends BaseComment {
  private _globalScale: number;
  override readonly pluginName: string = "FlashComment";
  constructor(comment: FormattedComment, context: Context2D) {
    super(comment, context);
    this._globalScale ??= getConfig(config.commentScale, true);
  }

  override get content() {
    return this.comment.rawContent;
  }
  override set content(input: string) {
    const { content, lineCount, lineOffset } = this.parseContent(input);
    const comment: FormattedCommentWithFont = {
      ...this.comment,
      rawContent: input,
      content,
      lineCount,
      lineOffset,
    };
    const val = content[0];
    if (val?.font) {
      comment.font = val.font;
    }
    this.comment = this.getCommentSize(comment);
    this.cacheKey =
      JSON.stringify(this.comment.content) +
      `@@${this.pluginName}@@` +
      [...this.comment.mail].sort().join(",");
    delete this.image;
  }

  override convertComment(comment: FormattedComment): FormattedCommentWithSize {
    this._globalScale = getConfig(config.commentScale, true);
    return this.getCommentSize(this.parseCommandAndNicoscript(comment));
  }

  /**
   * コメントの描画サイズを計算する
   * @param parsedData 計算対象のコメント
   * @returns 計算結果
   */
  override getCommentSize(
    parsedData: FormattedCommentWithFont,
  ): FormattedCommentWithSize {
    if (parsedData.invisible) {
      return {
        ...parsedData,
        height: 0,
        width: 0,
        lineHeight: 0,
        fontSize: 0,
        resized: false,
        resizedX: false,
        resizedY: false,
        charSize: 0,
        scale: 1,
        scaleX: 1,
        content: [],
      };
    }
    this.context.save();
    this.context.font = parseFont(parsedData.font, parsedData.fontSize);
    const measure = this.measureText({ ...parsedData, scale: 1 });
    if (options.scale !== 1 && parsedData.layer === -1) {
      measure.height *= options.scale;
      measure.width *= options.scale;
    }
    this.context.restore();
    if (parsedData.button) {
      measure.width += getConfig(config.commentDrawPadding, true) * 2;
    }
    return {
      ...parsedData,
      height: measure.height * this._globalScale,
      width: measure.width * this._globalScale,
      lineHeight: measure.lineHeight,
      fontSize: measure.fontSize,
      resized: measure.resized,
      resizedX: measure.resizedX,
      resizedY: measure.resizedY,
      charSize: measure.charSize,
      scale: measure.scale,
      scaleX: measure.scaleX,
      content: measure.content,
    };
  }

  override parseCommandAndNicoscript(
    comment: FormattedComment,
  ): FormattedCommentWithFont {
    const data = parseCommandAndNicoScript(comment);
    const { content, lineCount, lineOffset } = this.parseContent(
      comment.content,
    );
    const val = content[0];
    if (val?.font) {
      data.font = val.font;
    }
    return {
      ...comment,
      rawContent: comment.content,
      ...data,
      content,
      lineCount,
      lineOffset,
    };
  }

  override parseContent(input: string) {
    const content: CommentContentItem[] = parseContent(input);
    const lineCount = content.reduce((pv, val) => {
      return pv + (val.content.match(/\n/g)?.length ?? 0);
    }, 1);
    const lineOffset =
      (input.match(new RegExp(config.FlashScriptChar.super, "g"))?.length ??
        0) *
        -1 *
        config.scriptCharOffset +
      (input.match(new RegExp(config.FlashScriptChar.sub, "g"))?.length ?? 0) *
        config.scriptCharOffset;
    return {
      content,
      lineCount,
      lineOffset,
    };
  }

  override measureText(comment: MeasureTextInput): MeasureTextResult {
    const configLineHeight = getConfig(config.lineHeight, true),
      configFontSize = getConfig(config.fontSize, true);
    const lineCount = comment.lineCount;
    comment.lineHeight ??= configLineHeight[comment.size].default;
    if (isLineBreakResize(comment)) {
      comment.fontSize = configFontSize[comment.size].resized;
      comment.lineHeight = configLineHeight[comment.size].resized;
      comment.resized = true;
      comment.resizedY = true;
      this.context.font = parseFont(comment.font, comment.fontSize);
    }
    const { width_arr, spacedWidth_arr } = this._measureContent(comment);
    const leadLine = (function () {
      let max = 0,
        index = -1;
      spacedWidth_arr.forEach((val, i) => {
        if (max < val) {
          max = val;
          index = i;
        }
      });
      return { max, index };
    })();
    const width = leadLine.max;
    const scaleX = leadLine.max / (width_arr[leadLine.index] ?? 1);
    const width_max = width * comment.scale;
    const height =
      (comment.fontSize * comment.lineHeight * lineCount +
        config.commentYPaddingTop[comment.resizedY ? "resized" : "default"]) *
      comment.scale;
    if (comment.loc !== "naka") {
      const widthLimit = getConfig(config.CommentStageSize, true)[
        comment.full ? "fullWidth" : "width"
      ];
      if (width_max > widthLimit && !comment.resizedX) {
        comment.fontSize = configFontSize[comment.size].default;
        comment.lineHeight = configLineHeight[comment.size].default;
        comment.scale = widthLimit / width_max;
        comment.resizedX = true;
        comment.resized = true;
        return this.measureText(comment);
      }
    }
    if (!typeGuard.internal.CommentMeasuredContentItemArray(comment.content)) {
      throw new TypeGuardError();
    }
    return {
      width: width_max,
      charSize: 0,
      height: height,
      resized: !!comment.resized,
      fontSize: comment.fontSize,
      lineHeight: comment.lineHeight,
      content: comment.content,
      resizedX: !!comment.resizedX,
      resizedY: !!comment.resizedY,
      scale: comment.scale,
      scaleX,
    };
  }

  private _measureContent(comment: MeasureTextInput) {
    const width_arr: number[] = [],
      spacedWidth_arr: number[] = [];
    let currentWidth = 0,
      spacedWidth = 0;
    for (const item of comment.content) {
      const lines = item.content.split("\n");
      const widths: number[] = [];

      this.context.font = parseFont(
        item.font ?? comment.font,
        comment.fontSize,
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
    return { width_arr, spacedWidth_arr };
  }

  override _drawCollision(posX: number, posY: number, showCollision: boolean) {
    if (showCollision) {
      this.context.save();
      this.context.strokeStyle = "rgba(255,0,255,1)";
      this.context.strokeRect(
        posX,
        posY,
        this.comment.width,
        this.comment.height,
      );
      for (let i = 0, n = this.comment.lineCount; i < n; i++) {
        const linePosY =
          ((i + 1) * (this.comment.fontSize * this.comment.lineHeight) +
            config.commentYPaddingTop[
              this.comment.resizedY ? "resized" : "default"
            ]) *
          this.comment.scale;
        this.context.strokeStyle = `rgba(255,255,0,0.25)`;
        this.context.strokeRect(
          posX,
          posY + linePosY * this._globalScale,
          this.comment.width,
          this.comment.fontSize *
            this.comment.lineHeight *
            -1 *
            this._globalScale *
            this.comment.scale *
            (this.comment.layer === -1 ? options.scale : 1),
        );
      }
      this.context.restore();
    }
  }

  override _generateTextImage(): Canvas {
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
      this.comment.scale *
      (this.comment.layer === -1 ? options.scale : 1);
    context.scale(scale * this.comment.scaleX, scale);
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
      const font = item.font ?? this.comment.font;
      if (lastFont !== font) {
        lastFont = font;
        context.font = parseFont(font, this.comment.fontSize);
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
          continue;
        }
        leftOffset += item.width[j] ?? 0;
      }
    }
    return image;
  }
}

export { FlashComment };
