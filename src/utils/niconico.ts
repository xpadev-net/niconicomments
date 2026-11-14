import type {
  BaseConfig,
  CommentContentItem,
  CommentHTML5Font,
  CommentSize,
  IRenderer,
  MeasureInput,
} from "@/@types";
import { HTML5_SPECIAL_SPACE_EM_WIDTH } from "@/definition/html5Spacers";
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

const getHTML5SpacerWidth = (
  char: string,
  config: BaseConfig,
  font: CommentHTML5Font,
): number | undefined => {
  const explicit = config.compatSpacer.html5[char]?.[font];
  // undefined のみ未指定。0 は幅 0 の spacer として扱う
  if (explicit !== undefined) return explicit;
  if (config.html5SpecialSpaceCompat) {
    return HTML5_SPECIAL_SPACE_EM_WIDTH[char];
  }
  return undefined;
};

const addHTML5PartToResult = (
  lineContent: CommentContentItem[],
  part: string,
  config: BaseConfig,
  _font?: CommentHTML5Font,
) => {
  if (part === "") return;
  const font = _font ?? "defont";
  const hasCompat =
    config.html5SpecialSpaceCompat ||
    Object.keys(config.compatSpacer.html5).length > 0;
  if (!hasCompat) {
    lineContent.push({
      type: "text",
      content: part,
      slicedContent: part.split("\n"),
    });
    return;
  }
  let textStart = 0;
  const flushText = (end: number) => {
    if (end <= textStart) return;
    const content = part.slice(textStart, end);
    lineContent.push({
      type: "text",
      content,
      slicedContent: content.split("\n"),
    });
  };
  let i = 0;
  while (i < part.length) {
    const char = part[i] as string;
    const width = getHTML5SpacerWidth(char, config, font);
    if (width === undefined) {
      i++;
      continue;
    }
    flushText(i);
    let end = i + 1;
    while (end < part.length && part[end] === char) end++;
    lineContent.push({
      type: "spacer",
      char,
      charWidth: width,
      count: end - i,
    });
    i = end;
    textStart = end;
  }
  flushText(part.length);
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
