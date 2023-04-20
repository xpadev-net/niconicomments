import type { commentSize, measureInput } from "@/@types/";
import { config } from "@/definition/config";
import { getConfig, parseFont } from "@/util";

/**
 * 各サイズの行高を返す
 * @param fontSize
 * @param resized
 * @param isFlash
 */
const getLineHeight = (
  fontSize: commentSize,
  isFlash: boolean,
  resized = false
) => {
  const lineCounts = getConfig(config.lineCounts, isFlash),
    commentStageSize = getConfig(config.commentStageSize, isFlash),
    lineHeight = commentStageSize.height / lineCounts.doubleResized[fontSize],
    defaultLineCount = lineCounts.default[fontSize];
  if (resized) {
    const resizedLineCount = lineCounts.resized[fontSize];
    return (
      (commentStageSize.height -
        lineHeight * (defaultLineCount / resizedLineCount)) /
      (resizedLineCount - 1)
    );
  }
  return (commentStageSize.height - lineHeight) / (defaultLineCount - 1);
};
const getCharSize = (fontSize: commentSize, isFlash: boolean): number => {
  const lineCounts = getConfig(config.lineCounts, isFlash),
    commentStageSize = getConfig(config.commentStageSize, isFlash);
  return commentStageSize.height / lineCounts.doubleResized[fontSize];
};

const measure = (comment: measureInput, context: CanvasRenderingContext2D) => {
  const width = measureWidth(comment, context);
  return {
    ...width,
    height: comment.lineHeight * (comment.lineCount - 1) + comment.charSize,
  };
};

const measureWidth = (
  comment: measureInput,
  context: CanvasRenderingContext2D
) => {
  const { fontSize, scale } = getFontSizeAndScale(comment.charSize),
    lineWidth = [],
    itemWidth = [];
  context.font = parseFont(comment.font, fontSize);
  let currentWidth = 0;
  for (const item of comment.content) {
    const lines = item.content.split("\n");
    context.font = parseFont(item.font || comment.font, fontSize);
    const width = [];
    for (let j = 0; j < lines.length; j++) {
      const measure = context.measureText(lines[j] as string);
      currentWidth += measure.width;
      width.push(measure.width);
      if (j < lines.length - 1) {
        lineWidth.push(Math.ceil(currentWidth * scale));
        currentWidth = 0;
      }
    }
    itemWidth.push(width);
    lineWidth.push(Math.ceil(currentWidth * scale));
  }
  return {
    width: Math.max(...lineWidth),
    lineWidth,
    itemWidth,
  };
};

const getFontSizeAndScale = (charSize: number) => {
  charSize *= 0.8;
  if (charSize < config.minFontSize) {
    if (charSize >= 1) charSize = Math.floor(charSize);
    return {
      scale: charSize / config.minFontSize,
      fontSize: config.minFontSize,
    };
  }
  return {
    scale: 1,
    fontSize: Math.floor(charSize),
  };
};

export { getCharSize, getFontSizeAndScale, getLineHeight, measure };
