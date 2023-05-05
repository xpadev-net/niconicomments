import type {
  CommentContentItem,
  CommentMeasuredContentItem,
  FormattedComment,
  FormattedCommentWithFont,
  FormattedCommentWithSize,
  HTML5Fonts,
  MeasureInput,
  MeasureTextInput,
  MeasureTextResult,
} from "@/@types/";
import { config, options } from "@/definition/config";
import {
  getCharSize,
  getConfig,
  getFontSizeAndScale,
  getLineHeight,
  getStrokeColor,
  isLineBreakResize,
  measure,
  parseCommandAndNicoScript,
  parseFont,
} from "@/utils";

import { BaseComment } from "./BaseComment";

class HTML5Comment extends BaseComment {
  override readonly pluginName: string = "HTML5Comment";
  constructor(comment: FormattedComment, context: CanvasRenderingContext2D) {
    super(comment, context);
    this.posY = 0;
  }

  override convertComment(comment: FormattedComment): FormattedCommentWithSize {
    return this.getCommentSize(this.parseCommandAndNicoscript(comment));
  }
  override getCommentSize(
    parsedData: FormattedCommentWithFont
  ): FormattedCommentWithSize {
    this.context.font = parseFont(parsedData.font, parsedData.fontSize);
    const size = parsedData as FormattedCommentWithSize;
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

  override parseCommandAndNicoscript(
    comment: FormattedComment
  ): FormattedCommentWithFont {
    const data = parseCommandAndNicoScript(comment);
    const content: CommentContentItem[] = [];
    content.push({
      content: comment.content,
      slicedContent: comment.content.split("\n"),
    });
    const lineCount = content.reduce((pv, val) => {
      return pv + (val.content.match(/\n/g)?.length || 0);
    }, 1);
    const lineOffset = 0;
    return {
      ...data,
      content,
      lineCount,
      lineOffset,
    } as FormattedCommentWithFont;
  }

  override measureText(comment: MeasureTextInput): MeasureTextResult {
    const scale = getConfig(config.commentScale, false);
    const configFontSize = getConfig(config.fontSize, false),
      lineHeight = getLineHeight(comment.size, false),
      charSize = getCharSize(comment.size, false);
    if (!comment.lineHeight) comment.lineHeight = lineHeight;
    if (!comment.charSize) comment.charSize = charSize;
    comment.fontSize = comment.charSize * 0.8;
    this.context.font = parseFont(comment.font, comment.fontSize);
    if (isLineBreakResize(comment)) {
      comment.fontSize = configFontSize[comment.size].resized;
      const lineHeight = getLineHeight(comment.size, false, true);
      comment.charSize = comment.charSize * (lineHeight / comment.lineHeight);
      comment.lineHeight = lineHeight;
      comment.resized = true;
      comment.resizedY = true;
    }
    const { width, height, itemWidth } = this._measureComment(comment);

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
      content: comment.content as CommentMeasuredContentItem[],
      resizedX: !!comment.resizedX,
      resizedY: !!comment.resizedY,
      charSize: comment.charSize || 0,
    };
  }

  private _measureComment(comment: MeasureTextInput) {
    const widthLimit = getConfig(config.CommentStageSize, false)[
      comment.full ? "fullWidth" : "width"
    ];
    const measureResult = measure(comment as MeasureInput, this.context);
    if (comment.loc !== "naka" && measureResult.width > widthLimit) {
      return this._processResizeX(comment, measureResult.width);
    }
    return measureResult;
  }

  private _processResizeX(comment: MeasureTextInput, width: number) {
    const widthLimit = getConfig(config.CommentStageSize, false)[
      comment.full ? "fullWidth" : "width"
    ];
    const lineHeight = getLineHeight(comment.size, false);
    const charSize = getCharSize(comment.size, false);
    const scale = widthLimit / width;
    comment.resizedX = true;
    let _comment: MeasureTextInput = { ...comment };
    _comment.charSize = (_comment.charSize || 0) * scale;
    _comment.lineHeight = (_comment.lineHeight || 0) * scale;
    _comment.fontSize = _comment.charSize * 0.8;
    let result = measure(_comment as MeasureInput, this.context);
    if (result.width > widthLimit) {
      while (result.width >= widthLimit) {
        const originalCharSize = _comment.charSize;
        _comment.charSize -= 1;
        _comment.lineHeight *= _comment.charSize / originalCharSize;
        _comment.fontSize = _comment.charSize * 0.8;
        result = measure(_comment as MeasureInput, this.context);
      }
    } else {
      let lastComment: MeasureTextInput = { ..._comment };
      while (result.width < widthLimit) {
        lastComment = { ..._comment };
        const originalCharSize = _comment.charSize;
        _comment.charSize += 1;
        _comment.lineHeight *= _comment.charSize / originalCharSize;
        _comment.fontSize = _comment.charSize * 0.8;
        result = measure(_comment as MeasureInput, this.context);
      }
      _comment = lastComment;
    }
    if (comment.resizedY) {
      const scale = (_comment.charSize || 0) / (comment.charSize || 0);
      comment.charSize = scale * charSize;
      comment.lineHeight = scale * lineHeight;
    } else {
      comment.charSize = _comment.charSize;
      comment.lineHeight = _comment.lineHeight;
    }
    comment.fontSize = (comment.charSize || 0) * 0.8;
    return measure(comment as MeasureInput, this.context);
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

  override _generateTextImage(): HTMLCanvasElement {
    const { fontSize, scale } = getFontSizeAndScale(this.comment.charSize);
    const paddingTop =
      (10 - scale * 10) *
      ((this.comment.lineCount + 1) / config.hiResCommentCorrection);
    const { image, context } = this.createCanvas();
    image.width = this.comment.width + 2 * 2 * this.comment.charSize;
    image.height =
      this.comment.height +
      ((paddingTop + 1) * this.comment.lineHeight) / scale;
    context.strokeStyle = getStrokeColor(this.comment);
    context.fillStyle = this.comment.color;
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
    context.lineWidth = config.contextLineWidth;
    context.font = parseFont(this.comment.font, fontSize);
    const drawScale =
      getConfig(config.commentScale, false) *
      scale *
      (this.comment.layer === -1 ? options.scale : 1);
    context.scale(drawScale, drawScale);
    let lineCount = 0;
    const offsetY =
      (this.comment.charSize - this.comment.lineHeight) / 2 +
      this.comment.lineHeight * -0.16 +
      (config.fonts[this.comment.font as unknown as HTML5Fonts]?.offset || 0);
    for (const item of this.comment.content) {
      const lines = item.slicedContent;
      for (let j = 0, n = lines.length; j < n; j++) {
        const line = lines[j];
        if (line === undefined) continue;
        const posY =
          (this.comment.lineHeight * (lineCount + 1 + paddingTop) + offsetY) /
          scale;
        context.strokeText(line, 0, posY);
        context.fillText(line, 0, posY);
        lineCount += 1;
      }
    }
    return image;
  }
}

export { HTML5Comment };
