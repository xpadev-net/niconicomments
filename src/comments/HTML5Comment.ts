import type {
  CommentContentItemText,
  FormattedComment,
  FormattedCommentWithFont,
  FormattedCommentWithSize,
  HTML5Fonts,
  IRenderer,
  MeasureTextInput,
  MeasureTextResult,
} from "@/@types/";
import { config, options } from "@/definition/config";
import { TypeGuardError } from "@/errors/TypeGuardError";
import typeGuard from "@/typeGuard";
import {
  addHTML5PartToResult,
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
  constructor(comment: FormattedComment, context: IRenderer, index: number) {
    super(comment, context, index);
    this.posY = -1;
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
    this.comment = this.getCommentSize(comment);
    this.cacheKey = this.getCacheKey();
    this.image = undefined;
  }

  override convertComment(comment: FormattedComment): FormattedCommentWithSize {
    return this.getCommentSize(this.parseCommandAndNicoscript(comment));
  }
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
        content: [],
        scaleX: 1,
        scale: 1,
      };
    }
    this.renderer.save();
    this.renderer.setFont(parseFont(parsedData.font, parsedData.fontSize));
    const measure = this.measureText({ ...parsedData, scale: 1 });
    if (options.scale !== 1 && parsedData.layer === -1) {
      measure.height *= options.scale;
      measure.width *= options.scale;
      measure.fontSize *= options.scale;
    }
    this.renderer.restore();
    return {
      ...parsedData,
      height: measure.height,
      width: measure.width,
      lineHeight: measure.lineHeight,
      fontSize: measure.fontSize,
      resized: measure.resized,
      resizedX: measure.resizedX,
      resizedY: measure.resizedY,
      charSize: measure.charSize,
      content: measure.content,
      scaleX: measure.scaleX,
      scale: measure.scale,
    };
  }

  override parseCommandAndNicoscript(
    comment: FormattedComment,
  ): FormattedCommentWithFont {
    const data = parseCommandAndNicoScript(comment);
    const { content, lineCount, lineOffset } = this.parseContent(
      comment.content,
      data.font as HTML5Fonts,
    );
    return {
      ...comment,
      rawContent: comment.content,
      ...data,
      content,
      lineCount,
      lineOffset,
    };
  }

  override parseContent(input: string, font?: HTML5Fonts) {
    const content: CommentContentItemText[] = [];
    addHTML5PartToResult(content, input, font ?? "defont");
    const lineCount = input.split("\n").length;
    const lineOffset = 0;
    return {
      content,
      lineCount,
      lineOffset,
    };
  }

  override measureText(comment: MeasureTextInput): MeasureTextResult {
    const scale = getConfig(config.commentScale, false);
    const configFontSize = getConfig(config.fontSize, false);
    const lineHeight = getLineHeight(comment.size, false);
    const charSize = getCharSize(comment.size, false);
    if (!comment.lineHeight) comment.lineHeight = lineHeight;
    if (!comment.charSize) comment.charSize = charSize;
    comment.fontSize = comment.charSize * 0.8;
    this.renderer.setFont(parseFont(comment.font, comment.fontSize));
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
      if (item?.type !== "text" || !itemWidth) continue;
      item.width = itemWidth[i];
    }
    comment.fontSize = (comment.charSize ?? 0) * 0.8;
    if (!typeGuard.internal.CommentMeasuredContentItemArray(comment.content)) {
      throw new TypeGuardError();
    }
    return {
      width: width * scale,
      height: height * scale,
      resized: !!comment.resized,
      fontSize: comment.fontSize,
      lineHeight: comment.lineHeight ?? 0,
      content: comment.content,
      resizedX: !!comment.resizedX,
      resizedY: !!comment.resizedY,
      charSize: comment.charSize ?? 0,
      scaleX: 1,
      scale: 1,
    };
  }

  private _measureComment(comment: MeasureTextInput) {
    const widthLimit = getConfig(config.commentStageSize, false)[
      comment.full ? "fullWidth" : "width"
    ];
    if (!typeGuard.internal.MeasureInput(comment)) throw new TypeGuardError();
    const measureResult = measure(comment, this.renderer);
    if (comment.loc !== "naka" && measureResult.width > widthLimit) {
      return this._processResizeX(comment, measureResult.width);
    }
    return measureResult;
  }

  private _processResizeX(comment: MeasureTextInput, width: number) {
    const widthLimit = getConfig(config.commentStageSize, false)[
      comment.full ? "fullWidth" : "width"
    ];
    const lineHeight = getLineHeight(comment.size, false);
    const charSize = getCharSize(comment.size, false);
    const scale = widthLimit / width;
    comment.resizedX = true;
    let _comment: MeasureTextInput = { ...comment };
    _comment.charSize = (_comment.charSize ?? 0) * scale;
    _comment.lineHeight = (_comment.lineHeight ?? 0) * scale;
    _comment.fontSize = _comment.charSize * 0.8;
    if (!typeGuard.internal.MeasureInput(_comment)) throw new TypeGuardError();
    let result = measure(_comment, this.renderer);
    if (result.width > widthLimit) {
      while (result.width >= widthLimit) {
        const originalCharSize = _comment.charSize;
        _comment.charSize -= 1;
        _comment.lineHeight *= _comment.charSize / originalCharSize;
        _comment.fontSize = _comment.charSize * 0.8;
        result = measure(_comment, this.renderer);
      }
    } else {
      let lastComment: MeasureTextInput = { ..._comment };
      while (result.width < widthLimit) {
        lastComment = { ..._comment };
        const originalCharSize = _comment.charSize;
        _comment.charSize += 1;
        _comment.lineHeight *= _comment.charSize / originalCharSize;
        _comment.fontSize = _comment.charSize * 0.8;
        result = measure(_comment, this.renderer);
      }
      _comment = lastComment;
    }
    if (comment.resizedY) {
      const scale = (_comment.charSize ?? 0) / (comment.charSize ?? 0);
      comment.charSize = scale * charSize;
      comment.lineHeight = scale * lineHeight;
    } else {
      comment.charSize = _comment.charSize;
      comment.lineHeight = _comment.lineHeight;
    }
    comment.fontSize = (comment.charSize ?? 0) * 0.8;
    if (!typeGuard.internal.MeasureInput(comment)) throw new TypeGuardError();
    return measure(comment, this.renderer);
  }

  override _drawCollision(posX: number, posY: number, showCollision: boolean) {
    if (showCollision) {
      this.renderer.save();
      const scale = getConfig(config.commentScale, false);
      this.renderer.setStrokeStyle("rgba(0,255,255,1)");
      this.renderer.strokeRect(
        posX,
        posY,
        this.comment.width,
        this.comment.height,
      );
      for (let i = 0, n = this.comment.lineCount; i < n; i++) {
        if (!typeGuard.internal.HTML5Fonts(this.comment.font))
          throw new TypeGuardError();
        const linePosY =
          (this.comment.lineHeight * (i + 1) +
            (this.comment.charSize - this.comment.lineHeight) / 2 +
            this.comment.lineHeight * -0.16 +
            (config.fonts.html5[this.comment.font]?.offset || 0)) *
          scale;
        this.renderer.setStrokeStyle("rgba(255,255,0,0.5)");
        this.renderer.strokeRect(
          posX,
          posY + linePosY,
          this.comment.width,
          this.comment.fontSize * -1 * scale,
        );
      }
      this.renderer.restore();
    }
  }

  override _generateTextImage(): IRenderer {
    const { fontSize, scale } = getFontSizeAndScale(this.comment.charSize);
    const paddingTop =
      (10 - scale * 10) *
      ((this.comment.lineCount + 1) / config.html5HiResCommentCorrection);
    const drawScale =
      getConfig(config.commentScale, false) *
      scale *
      (this.comment.layer === -1 ? options.scale : 1);
    const image = this.renderer.getCanvas();
    image.setSize(this.comment.width, this.comment.height);
    image.setStrokeStyle(getStrokeColor(this.comment));
    image.setFillStyle(this.comment.color);
    image.setLineWidth(getConfig(config.contextLineWidth, false));
    image.setFont(parseFont(this.comment.font, fontSize));
    image.setScale(drawScale);
    let lineCount = 0;
    if (!typeGuard.internal.HTML5Fonts(this.comment.font))
      throw new TypeGuardError();
    const offsetY =
      (this.comment.charSize - this.comment.lineHeight) / 2 +
      this.comment.lineHeight * -0.16 +
      (config.fonts.html5[this.comment.font]?.offset || 0);
    for (const item of this.comment.content) {
      if (item?.type === "spacer") {
        lineCount += item.count * item.charWidth * this.comment.fontSize;
        continue;
      }
      const lines = item.slicedContent;
      for (let j = 0, n = lines.length; j < n; j++) {
        const line = lines[j];
        if (line === undefined) continue;
        const posY =
          (this.comment.lineHeight * (lineCount + 1 + paddingTop) + offsetY) /
          scale;
        image.strokeText(line, 0, posY);
        image.fillText(line, 0, posY);
        lineCount += 1;
      }
    }
    return image;
  }

  override getButtonImage() {
    return undefined;
  }
  override isHovered() {
    return false;
  }
}

export { HTML5Comment };
