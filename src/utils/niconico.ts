import type {
  BaseConfig,
  CommentContentItem,
  CommentHTML5Font,
  CommentSize,
  IRenderer,
  MeasureInput,
} from "@/@types";
import { TypeGuardError } from "@/errors/TypeGuardError";

import { parseFont } from "./comment";
import { getConfig } from "./config";

/**
 * 各サイズの行高を返す
 * @param fontSize コメントサイズ
 * @param isFlash Flashかどうか
 * @param config インスタンス設定
 * @param resized リサイズされているか
 * @returns 行高
 */
const getLineHeight = (
  fontSize: CommentSize,
  isFlash: boolean,
  config: BaseConfig,
  resized = false,
) => {
  const lineCounts = getConfig(config.html5LineCounts, isFlash);
  const commentStageSize = getConfig(config.commentStageSize, isFlash);
  const lineHeight =
    commentStageSize.height / lineCounts.doubleResized[fontSize];
  const defaultLineCount = lineCounts.default[fontSize];
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
 * @param config インスタンス設定
 * @returns フォントサイズ
 */
const getCharSize = (
  fontSize: CommentSize,
  isFlash: boolean,
  config: BaseConfig,
): number => {
  const lineCounts = getConfig(config.html5LineCounts, isFlash);
  const commentStageSize = getConfig(config.commentStageSize, isFlash);
  return commentStageSize.height / lineCounts.doubleResized[fontSize];
};

/**
 * コメントのサイズを計測する
 * @param comment コメント
 * @param renderer 計測対象のレンダラーインスタンス
 * @param config インスタンス設定
 * @returns 計測結果
 */
const measure = (
  comment: MeasureInput,
  renderer: IRenderer,
  config: BaseConfig,
  layerScale = 1,
) => {
  const width = measureWidth(comment, renderer, config, layerScale);
  return {
    ...width,
    height: comment.lineHeight * (comment.lineCount - 1) + comment.charSize,
  };
};

const addHTML5PartToResult = (
  lineContent: CommentContentItem[],
  part: string,
  config: BaseConfig,
  _font?: CommentHTML5Font,
) => {
  if (part === "") return;
  const font = _font ?? "defont";
  for (const key of Object.keys(config.compatSpacer.html5)) {
    const spacerWidth = config.compatSpacer.html5[key]?.[font];
    if (!spacerWidth) continue;
    const compatIndex = part.indexOf(key);
    if (compatIndex >= 0) {
      addHTML5PartToResult(
        lineContent,
        part.slice(0, compatIndex),
        config,
        font,
      );
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
      addHTML5PartToResult(lineContent, part.slice(i), config, font);
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
 * @param config インスタンス設定
 * @returns 計測結果
 */
const measureWidth = (
  comment: MeasureInput,
  renderer: IRenderer,
  config: BaseConfig,
  layerScale = 1,
) => {
  const { fontSize, scale } = getFontSizeAndScale(comment.charSize, config);
  const drawScale = getConfig(config.commentScale, false) * scale * layerScale;
  const lineWidth: number[] = [];
  const itemWidth: number[][] = [];
  const initialFont = parseFont(comment.font, fontSize, config);
  renderer.setFont(initialFont);
  let lastFont = initialFont;
  let currentWidth = 0;
  for (const item of comment.content) {
    if (item.type === "spacer") {
      currentWidth += item.count * fontSize * item.charWidth;
      itemWidth.push([item.count * fontSize * item.charWidth]);
      lineWidth.push(Math.ceil(currentWidth * scale));
      continue;
    }
    const lines = item.slicedContent ?? item.content.split("\n");
    const font = parseFont(item.font ?? comment.font, fontSize, config);
    if (font !== lastFont) {
      renderer.setFont(font);
      lastFont = font;
    }
    const width = [];
    for (let j = 0, n = lines.length; j < n; j++) {
      const line = lines[j];
      if (line === undefined) throw new TypeGuardError();
      const m =
        renderer.measureTextAtDrawScale?.(line, drawScale) ??
        renderer.measureText(line);
      currentWidth += m.width;
      width.push(m.width);
      if (j < lines.length - 1) {
        lineWidth.push(Math.ceil(currentWidth * scale));
        currentWidth = 0;
      }
    }
    itemWidth.push(width);
    lineWidth.push(Math.ceil(currentWidth * scale));
  }
  let maxWidth = 0;
  for (const width of lineWidth) {
    if (width > maxWidth) maxWidth = width;
  }
  return {
    width: maxWidth,
    lineWidth,
    itemWidth,
  };
};

/**
 * フォントサイズとスケールを返す
 * @param _charSize 文字サイズ
 * @param config インスタンス設定
 * @returns フォントサイズとスケール
 */
const getFontSizeAndScale = (_charSize: number, config: BaseConfig) => {
  let charSize = _charSize;
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
