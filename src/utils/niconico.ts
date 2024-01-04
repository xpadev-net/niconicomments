import type {
  CommentContentItem,
  CommentHTML5Font,
  CommentSize,
  IRenderer,
  MeasureInput,
} from "@/@types";
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
  const lineCounts = getConfig(config.html5LineCounts, isFlash),
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
  const lineCounts = getConfig(config.html5LineCounts, isFlash),
    commentStageSize = getConfig(config.commentStageSize, isFlash);
  return commentStageSize.height / lineCounts.doubleResized[fontSize];
};

/**
 * コメントのサイズを計測する
 * @param comment コメント
 * @param renderer 計測対象のレンダラーインスタンス
 * @returns 計測結果
 */
const measure = (comment: MeasureInput, renderer: IRenderer) => {
  const width = measureWidth(comment, renderer);
  return {
    ...width,
    height: comment.lineHeight * (comment.lineCount - 1) + comment.charSize,
  };
};

const addHTML5PartToResult = (
  lineContent: CommentContentItem[],
  part: string,
  font?: CommentHTML5Font,
) => {
  if (part === "") return;
  font ??= "defont";
  for (const key of Object.keys(config.compatSpacer.html5)) {
    const spacerWidth = config.compatSpacer.html5[key]?.[font];
    if (!spacerWidth) continue;
    const compatIndex = part.indexOf(key);
    if (compatIndex >= 0) {
      addHTML5PartToResult(lineContent, part.slice(0, compatIndex), font);
      let i = compatIndex;
      for (; i < part.length && part[i] === key; i++) {
        /* empty */
      }
      lineContent.push({
        type: "spacer",
        char: key,
        charWidth: spacerWidth,
        count: i - compatIndex,
      });
      addHTML5PartToResult(lineContent, part.slice(i), font);
      return;
    }
  }
  lineContent.push({
    type: "text",
    content: part,
    slicedContent: part.split("\n"),
  });
};

/**
 * コメントの幅を計測する
 * @param comment コメント
 * @param renderer 計測対象のレンダラーインスタンス
 * @returns 計測結果
 */
const measureWidth = (comment: MeasureInput, renderer: IRenderer) => {
  const { fontSize, scale } = getFontSizeAndScale(comment.charSize),
    lineWidth: number[] = [],
    itemWidth: number[][] = [];
  renderer.setFont(parseFont(comment.font, fontSize));
  let currentWidth = 0;
  for (const item of comment.content) {
    if (item.type === "spacer") {
      currentWidth += item.count * fontSize * item.charWidth;
      itemWidth.push([item.count * fontSize * item.charWidth]);
      lineWidth.push(Math.ceil(currentWidth * scale));
      continue;
    }
    const lines = item.content.split("\n");
    renderer.setFont(parseFont(item.font ?? comment.font, fontSize));
    const width = [];
    for (let j = 0, n = lines.length; j < n; j++) {
      const line = lines[j];
      if (line === undefined) throw new TypeGuardError();
      const measure = renderer.measureText(line);
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
  if (charSize < config.html5MinFontSize) {
    if (charSize >= 1) charSize = Math.floor(charSize);
    return {
      scale: charSize / config.html5MinFontSize,
      fontSize: config.html5MinFontSize,
    };
  }
  return {
    scale: 1,
    fontSize: Math.floor(charSize),
  };
};

export {
  addHTML5PartToResult,
  getCharSize,
  getFontSizeAndScale,
  getLineHeight,
  measure,
};
