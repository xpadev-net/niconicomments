import type {
  CommentContentItemText,
  FormattedComment,
  FormattedCommentWithFont,
  FormattedCommentWithSize,
  HTML5Fonts,
  IRenderer,
  MeasureInput,
  MeasureTextInput,
  MeasureTextResult,
} from "@/@types/";
import type { CommentInstanceContext } from "@/contexts/";
import { TypeGuardError } from "@/errors/TypeGuardError";
import typeGuard from "@/typeGuard";
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
import { addHTML5PartToResult } from "@/utils/niconico";

import { BaseComment } from "./BaseComment";

const MAX_RESIZE_ITERATIONS = 20;
const MAX_HTML5_COMMENT_CHARS = 16_384;
const MAX_HTML5_COMMENT_LINES = 256;
const HTML5_COMMENT_IMAGE_PADDING = 4;
const MAX_HTML5_COMMENT_IMAGE_WIDTH = 8192 - HTML5_COMMENT_IMAGE_PADDING * 2;
const MAX_HTML5_COMMENT_IMAGE_HEIGHT = 8192 - HTML5_COMMENT_IMAGE_PADDING * 2;
const MAX_HTML5_COMMENT_IMAGE_AREA = 16_777_216;

const clampHTML5Content = (input: string) => {
  let lineCount = 1;
  let end = 0;
  for (; end < input.length && end < MAX_HTML5_COMMENT_CHARS; end++) {
    if (input[end] === "\n") {
      if (lineCount >= MAX_HTML5_COMMENT_LINES) break;
      lineCount++;
    }
  }
  const content = input.slice(0, end);
  return {
    content,
    lineCount,
  };
};

const isWithinImageBounds = (width: number, height: number) => {
  const paddedWidth = width + HTML5_COMMENT_IMAGE_PADDING * 2;
  const paddedHeight = height + HTML5_COMMENT_IMAGE_PADDING * 2;
  return (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0 &&
    width <= MAX_HTML5_COMMENT_IMAGE_WIDTH &&
    height <= MAX_HTML5_COMMENT_IMAGE_HEIGHT &&
    paddedWidth * paddedHeight <= MAX_HTML5_COMMENT_IMAGE_AREA
  );
};

class HTML5Comment extends BaseComment {
  override readonly pluginName: string = "HTML5Comment";
  constructor(
    comment: FormattedComment,
    context: IRenderer,
    index: number,
    ctx: CommentInstanceContext,
  ) {
    super(comment, context, index, ctx);
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
    this.renderer.setFont(
      parseFont(parsedData.font, parsedData.fontSize, this.config),
    );
    const meas = this.measureText({ ...parsedData, scale: 1 });
    if (this.ctx.options.scale !== 1 && parsedData.layer === -1) {
      meas.height *= this.ctx.options.scale;
      meas.width *= this.ctx.options.scale;
      meas.fontSize *= this.ctx.options.scale;
    }
    this.renderer.restore();
    return {
      ...parsedData,
      height: meas.height,
      width: meas.width,
      lineHeight: meas.lineHeight,
      fontSize: meas.fontSize,
      resized: meas.resized,
      resizedX: meas.resizedX,
      resizedY: meas.resizedY,
      charSize: meas.charSize,
      content: meas.content,
      scaleX: meas.scaleX,
      scale: meas.scale,
    };
  }

  override parseCommandAndNicoscript(
    comment: FormattedComment,
  ): FormattedCommentWithFont {
    const data = parseCommandAndNicoScript(comment, this.ctx);
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
    const clamped = clampHTML5Content(input);
    addHTML5PartToResult(
      content,
      clamped.content,
      this.config,
      font ?? "defont",
    );
    const lineCount = clamped.lineCount;
    const lineOffset = 0;
    return {
      content,
      lineCount,
      lineOffset,
    };
  }

  override measureText(comment: MeasureTextInput): MeasureTextResult {
    const scale = getConfig(this.config.commentScale, false);
    const configFontSize = getConfig(this.config.fontSize, false);
    const lineHeight = getLineHeight(comment.size, false, this.config);
    const charSize = getCharSize(comment.size, false, this.config);
    if (!comment.lineHeight) comment.lineHeight = lineHeight;
    if (!comment.charSize) comment.charSize = charSize;
    comment.fontSize = comment.charSize * 0.8;
    this.renderer.setFont(
      parseFont(comment.font, comment.fontSize, this.config),
    );
    if (isLineBreakResize(comment, this.config)) {
      comment.fontSize = configFontSize[comment.size].resized;
      const newLineHeight = getLineHeight(
        comment.size,
        false,
        this.config,
        true,
      );
      comment.charSize =
        comment.charSize * (newLineHeight / comment.lineHeight);
      comment.lineHeight = newLineHeight;
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
    const widthLimit = getConfig(this.config.commentStageSize, false)[
      comment.full ? "fullWidth" : "width"
    ];
    if (!typeGuard.internal.MeasureInput(comment)) throw new TypeGuardError();
    const measureResult = measure(comment, this.renderer, this.config);
    if (comment.loc !== "naka" && measureResult.width > widthLimit) {
      return this._processResizeX(comment, measureResult.width);
    }
    return measureResult;
  }

  private _processResizeX(comment: MeasureTextInput, width: number) {
    const widthLimit = getConfig(this.config.commentStageSize, false)[
      comment.full ? "fullWidth" : "width"
    ];
    const lineHeight = getLineHeight(comment.size, false, this.config);
    const charSize = getCharSize(comment.size, false, this.config);
    const scale = widthLimit / width;
    comment.resizedX = true;
    const baseCharSize = Math.max(1, (comment.charSize ?? 0) * scale);
    const baseLineHeight = Math.max(1, (comment.lineHeight ?? 0) * scale);

    const workComment: MeasureTextInput = {
      ...comment,
      charSize: baseCharSize,
      lineHeight: baseLineHeight,
      fontSize: baseCharSize * 0.8,
    };
    if (!typeGuard.internal.MeasureInput(workComment)) {
      throw new TypeGuardError();
    }

    const getMeasured = (nextCharSize: number) => {
      workComment.charSize = nextCharSize;
      workComment.lineHeight = baseLineHeight * (nextCharSize / baseCharSize);
      workComment.fontSize = nextCharSize * 0.8;
      return measure(workComment, this.renderer, this.config);
    };

    let low = Math.max(1, Math.floor(baseCharSize * 0.5));
    let high = Math.max(low, Math.ceil(baseCharSize * 1.5));
    let best = baseCharSize;
    let bestResult = getMeasured(baseCharSize);
    if (bestResult.width > widthLimit) {
      high = baseCharSize;
      let remainingIterations = MAX_RESIZE_ITERATIONS;
      while (remainingIterations-- > 0) {
        const candidate = getMeasured(low);
        const nextLow = Math.max(1, Math.floor(low * 0.5));
        if (candidate.width <= widthLimit || nextLow === low) {
          best = low;
          bestResult = candidate;
          break;
        }
        high = low;
        low = nextLow;
      }
    } else {
      let remainingIterations = MAX_RESIZE_ITERATIONS;
      while (remainingIterations-- > 0) {
        const candidate = getMeasured(high);
        if (candidate.width > widthLimit) break;
        best = high;
        bestResult = candidate;
        const nextHigh = Math.ceil(high * 1.5);
        if (nextHigh === high) break;
        high = nextHigh;
      }
    }
    if (bestResult.width <= widthLimit && low < high) {
      let left = best;
      let right = high;
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const candidate = getMeasured(mid);
        if (candidate.width <= widthLimit) {
          best = mid;
          bestResult = candidate;
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
    }
    if (comment.resizedY) {
      const resizeScale = best / (comment.charSize ?? 1);
      comment.charSize = resizeScale * charSize;
      comment.lineHeight = resizeScale * lineHeight;
    } else {
      comment.charSize = best;
      comment.lineHeight = baseLineHeight * (best / baseCharSize);
    }
    comment.fontSize = (comment.charSize ?? 0) * 0.8;
    return measure(
      comment as MeasureTextInput & MeasureInput,
      this.renderer,
      this.config,
    );
  }

  override _drawCollision(posX: number, posY: number, showCollision: boolean) {
    if (showCollision) {
      this.renderer.save();
      const scale = getConfig(this.config.commentScale, false);
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
            (this.config.fonts.html5[this.comment.font]?.offset || 0)) *
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

  protected override canGenerateTextImage(): boolean {
    return isWithinImageBounds(this.comment.width, this.comment.height);
  }

  override _generateTextImage(): IRenderer {
    const { fontSize, scale } = getFontSizeAndScale(
      this.comment.charSize,
      this.config,
    );
    const paddingTop =
      (10 - scale * 10) *
      ((this.comment.lineCount + 1) / this.config.html5HiResCommentCorrection);
    const drawScale =
      getConfig(this.config.commentScale, false) *
      scale *
      (this.comment.layer === -1 ? this.ctx.options.scale : 1);
    const image = this.renderer.getCanvas(HTML5_COMMENT_IMAGE_PADDING);
    image.setSize(this.comment.width, this.comment.height);
    image.setStrokeStyle(getStrokeColor(this.comment, this.config));
    image.setFillStyle(this.comment.color);
    image.setLineWidth(getConfig(this.config.contextLineWidth, false));
    image.setFont(parseFont(this.comment.font, fontSize, this.config));
    image.setScale(drawScale);
    let lineCount = 0;
    if (!typeGuard.internal.HTML5Fonts(this.comment.font))
      throw new TypeGuardError();
    const offsetY =
      (this.comment.charSize - this.comment.lineHeight) / 2 +
      this.comment.lineHeight * -0.16 +
      (this.config.fonts.html5[this.comment.font]?.offset || 0);
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
