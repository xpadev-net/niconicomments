import type { CommentSize, Context2D, MeasureInput } from "@/@types";
import { config } from "@/definition/config";
import { TypeGuardError } from "@/errors/TypeGuardError";

import { parseFont } from "./comment";
import { getConfig } from "./config";

/**
 * 各サイズの行高を返す
 * @param fontSize コメントサイズ
 * @param isFlash Flashかどうか
 * @param resized リサイズされているか
 * @returns 行高
 */
const getLineHeight = (
  fontSize: CommentSize,
  isFlash: boolean,
  resized = false,
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

/**
 * 各サイズのフォントサイズを返す
 * @param fontSize コメントサイズ
 * @param isFlash Flashかどうか
 * @returns フォントサイズ
 */
const getCharSize = (fontSize: CommentSize, isFlash: boolean): number => {
  const lineCounts = getConfig(config.lineCounts, isFlash),
    commentStageSize = getConfig(config.commentStageSize, isFlash);
  return commentStageSize.height / lineCounts.doubleResized[fontSize];
};

/**
 * コメントのサイズを計測する
 * @param comment コメント
 * @param context 計測対象のCanvasコンテキスト
 * @returns 計測結果
 */
const measure = (comment: MeasureInput, context: Context2D) => {
  const width = measureWidth(comment, context);
  return {
    ...width,
    height: comment.lineHeight * (comment.lineCount - 1) + comment.charSize,
  };
};

/**
 * コメントの幅を計測する
 * @param comment コメント
 * @param context 計測対象のCanvasコンテキスト
 * @returns 計測結果
 */
const measureWidth = (comment: MeasureInput, context: Context2D) => {
  const { fontSize, scale } = getFontSizeAndScale(comment.charSize),
    lineWidth = [],
    itemWidth = [];
  context.font = parseFont(comment.font, fontSize);
  let currentWidth = 0;
  for (const item of comment.content) {
    const lines = item.content.split("\n");
    context.font = parseFont(item.font ?? comment.font, fontSize);
    const width = [];
    for (let j = 0, n = lines.length; j < n; j++) {
      const line = lines[j];
      if (line === undefined) throw new TypeGuardError();
      const measure = context.measureText(line);
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

/**
 * フォントサイズとスケールを返す
 * @param charSize 文字サイズ
 * @returns フォントサイズとスケール
 */
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
