import type {
  BaseConfig,
  ButtonPartLeft,
  ButtonPartMiddle,
  CommentContentIndex,
  CommentContentItem,
  CommentFlashFont,
  CommentFlashFontParsed,
  FormattedComment,
  FormattedCommentWithSize,
} from "@/@types";
import { getConfig } from "@/utils/config";
import { nativeSort } from "@/utils/sort";

export const MAX_FLASH_COMMENT_CHARS = 16_384;
export const MAX_FLASH_COMMENT_LINES = 256;
export const MAX_FLASH_CONTENT_ITEMS = 2048;

const flashCharRegexCache = new WeakMap<
  BaseConfig,
  { simsunStrong: RegExp; simsunWeak: RegExp; gulim: RegExp; gothic: RegExp }
>();

const getFlashCharRegex = (config: BaseConfig) => {
  let cached = flashCharRegexCache.get(config);
  if (!cached) {
    cached = {
      simsunStrong: new RegExp(config.flashChar.simsunStrong),
      simsunWeak: new RegExp(config.flashChar.simsunWeak),
      gulim: new RegExp(config.flashChar.gulim),
      gothic: new RegExp(config.flashChar.gothic),
    };
    flashCharRegexCache.set(config, cached);
  }
  return cached;
};

const clampFlashContent = (input: string) => {
  let lineCount = 1;
  let end = 0;
  for (; end < input.length && end < MAX_FLASH_COMMENT_CHARS; end++) {
    if (input[end] === "\n") {
      lineCount++;
      if (lineCount >= MAX_FLASH_COMMENT_LINES) {
        end++;
        break;
      }
    }
  }
  return {
    content: input.slice(0, end),
    lineCount,
  };
};

/**
 * コメントの内容からフォント情報を取得する
 * @param part コメントの内容
 * @param config インスタンス設定
 * @returns フォント情報
 */
const getFlashFontIndex = (
  part: string,
  config: BaseConfig,
): CommentContentIndex[] => {
  const regex = getFlashCharRegex(config);
  const index: CommentContentIndex[] = [];
  let match = regex.simsunStrong.exec(part);
  if (match !== null) {
    index.push({ font: "simsunStrong", index: match.index });
  }
  match = regex.simsunWeak.exec(part);
  if (match !== null) {
    index.push({ font: "simsunWeak", index: match.index });
  }
  match = regex.gulim.exec(part);
  if (match !== null) {
    index.push({ font: "gulim", index: match.index });
  }
  match = regex.gothic.exec(part);
  if (match !== null) {
    index.push({ font: "gothic", index: match.index });
  }
  return index;
};

/**
 * フォント名を取得する
 * @param font フォント
 * @returns フォント名
 */
const getFlashFontName = (font: CommentFlashFontParsed): CommentFlashFont => {
  if (font === "simsunStrong" || font === "simsunWeak") return "simsun";
  if (font === "gothic") return "defont";
  return font;
};

/**
 * コメントの内容をパースする
 * @param content コメントの内容
 * @param config インスタンス設定
 * @returns パースしたコメントの内容
 */
const parseContent = (content: string, config: BaseConfig) => {
  const results: CommentContentItem[] = [];
  const clamped = clampFlashContent(content);
  const lines = Array.from(clamped.content.match(/\n|[^\n]+/g) ?? []);
  for (const line of lines) {
    const lineContent = parseLine(line, config);
    const firstContent = lineContent[0];
    const remainingItems = MAX_FLASH_CONTENT_ITEMS - results.length;
    if (remainingItems <= 0) break;
    const defaultFont = firstContent?.font;
    if (defaultFont) {
      results.push(
        ...lineContent.slice(0, remainingItems).map((val) => {
          val.font ??= defaultFont;
          if (val.type === "spacer") {
            const spacer = config.compatSpacer.flash[val.char];
            if (!spacer) return val;
            const width = spacer[val.font];
            if (!width) return val;
            val.charWidth = width;
          }
          return val;
        }),
      );
    } else {
      results.push(...lineContent.slice(0, remainingItems));
    }
  }
  return results;
};

/**
 * 1行分のコメントの内容をパースする
 * @param line 1行分のコメントの内容
 * @param config インスタンス設定
 * @returns パースしたコメントの内容
 */
const parseLine = (line: string, config: BaseConfig) => {
  const parts = Array.from(line.match(/[ -~｡-ﾟ]+|[^ -~｡-ﾟ]+/g) ?? []);
  const lineContent: CommentContentItem[] = [];
  for (const part of parts) {
    if (part.match(/[ -~｡-ﾟ]+/g) !== null) {
      addPartToResult(lineContent, part, config, "defont");
      continue;
    }
    parseFullWidthPart(part, lineContent, config);
  }
  return lineContent;
};

/**
 * スペースの補正を行った上で結果を追加する
 * @param lineContent 結果格納用の配列
 * @param part 追加する文字列
 * @param config インスタンス設定
 * @param font フォント
 */
const addPartToResult = (
  lineContent: CommentContentItem[],
  part: string,
  config: BaseConfig,
  font?: CommentFlashFont,
) => {
  if (part === "" || lineContent.length >= MAX_FLASH_CONTENT_ITEMS) return;
  for (const key of Object.keys(config.compatSpacer.flash)) {
    const spacerWidth = config.compatSpacer.flash[key]?.[font ?? "defont"];
    if (!spacerWidth) continue;
    const compatIndex = part.indexOf(key);
    if (compatIndex >= 0) {
      addPartToResult(lineContent, part.slice(0, compatIndex), config, font);
      let i = compatIndex;
      for (; i < part.length && part[i] === key; i++) {
        /* empty */
      }
      lineContent.push({
        type: "spacer",
        char: key,
        charWidth: spacerWidth,
        font,
        count: i - compatIndex,
      });
      addPartToResult(lineContent, part.slice(i), config, font);
      return;
    }
  }
  lineContent.push({
    type: "text",
    content: part,
    slicedContent: part.split("\n"),
    font,
  });
};

/**
 * 全角文字の部分をパースする
 * @param part 全角文字の部分
 * @param lineContent 1行分のコメントの内容
 * @param config インスタンス設定
 */
const parseFullWidthPart = (
  part: string,
  lineContent: CommentContentItem[],
  config: BaseConfig,
) => {
  const index = getFlashFontIndex(part, config);
  if (index.length === 0) {
    addPartToResult(lineContent, part, config);
  } else if (index.length === 1 && index[0]) {
    addPartToResult(lineContent, part, config, getFlashFontName(index[0].font));
  } else {
    parseMultiFontFullWidthPart(part, index, lineContent, config);
  }
};

/**
 * 複数のフォントが含まれる全角文字の部分をパースする
 * @param part 全角文字の部分
 * @param index フォントのインデックス
 * @param lineContent 1行分のコメントの内容
 * @param config インスタンス設定
 */
const parseMultiFontFullWidthPart = (
  part: string,
  index: CommentContentIndex[],
  lineContent: CommentContentItem[],
  config: BaseConfig,
) => {
  index.sort(nativeSort((val) => val.index));
  if (config.flashMode === "xp") {
    let offset = 0;
    for (let i = 1, n = index.length; i < n; i++) {
      const currentVal = index[i];
      const lastVal = index[i - 1];
      if (currentVal === undefined || lastVal === undefined) continue;
      const content = part.slice(offset, currentVal.index);
      addPartToResult(
        lineContent,
        content,
        config,
        getFlashFontName(lastVal.font),
      );
      offset = currentVal.index;
    }
    const val = index[index.length - 1];
    if (val) {
      const content = part.slice(offset);
      addPartToResult(lineContent, content, config, getFlashFontName(val.font));
    }
    return;
  }
  const firstVal = index[0];
  const secondVal = index[1];
  if (!firstVal || !secondVal) {
    addPartToResult(lineContent, part, config);
    return;
  }
  if (firstVal.font !== "gothic") {
    addPartToResult(lineContent, part, config, getFlashFontName(firstVal.font));
    return;
  }
  const firstContent = part.slice(0, secondVal.index);
  const secondContent = part.slice(secondVal.index);
  addPartToResult(
    lineContent,
    firstContent,
    config,
    getFlashFontName(firstVal.font),
  );
  addPartToResult(
    lineContent,
    secondContent,
    config,
    getFlashFontName(secondVal.font),
  );
};

/**
 * コメントのボタンのパーツを取得する
 * @param comment コメント
 * @param config インスタンス設定
 * @returns ボタンのデータを追加したコメント
 */
const getButtonParts = (
  comment: FormattedCommentWithSize,
  config: BaseConfig,
): FormattedCommentWithSize => {
  let leftParts: ButtonPartLeft | undefined;
  const parts: ButtonPartMiddle[] = [];
  const atButtonPadding = getConfig(config.atButtonPadding, true);
  const lineOffset = comment.lineOffset;
  const lineHeight = comment.fontSize * comment.lineHeight;
  const offsetKey = comment.resizedY ? "resized" : "default";
  const offsetY =
    config.flashCommentYPaddingTop[offsetKey] +
    comment.fontSize *
      comment.lineHeight *
      config.flashCommentYOffset[comment.size][offsetKey];
  let leftOffset = 0;
  let lineCount = 0;
  let isLastButton = false;
  for (const item of comment.content) {
    if (item.type === "spacer") {
      leftOffset += item.count * comment.fontSize * item.charWidth;
      continue;
    }
    const lines = item.slicedContent;
    for (let j = 0, n = lines.length; j < n; j++) {
      const line = lines[j];
      if (line === undefined) continue;
      const posY = (lineOffset + lineCount + 1) * lineHeight + offsetY;
      const partWidth = item.width[j] ?? 0;
      if (comment.button && !comment.button.hidden) {
        if (!isLastButton && item.isButton) {
          leftParts = {
            type: "left",
            left: leftOffset + atButtonPadding,
            top: posY - lineHeight + atButtonPadding,
            width: partWidth + atButtonPadding,
            height: lineHeight,
          };
          leftOffset += atButtonPadding * 2;
        } else if (isLastButton && item.isButton) {
          parts.push({
            type: "middle",
            left: leftOffset,
            top: posY - lineHeight + atButtonPadding,
            width: partWidth,
            height: lineHeight,
          });
        } else if (isLastButton && !item.isButton) {
          if (leftParts) {
            comment.buttonObjects = {
              left: leftParts,
              middle: parts,
              right: {
                type: "right",
                right: leftOffset + atButtonPadding,
                top: posY - lineHeight + atButtonPadding,
                height: lineHeight,
              },
            };
          }
          return comment;
        }
      }
      if (j < n - 1) {
        leftOffset = 0;
        lineCount += 1;
        continue;
      }
      leftOffset += partWidth;
    }
    isLastButton = !!item.isButton;
  }
  if (comment.button && !comment.button.hidden && isLastButton && leftParts) {
    const posY = (lineOffset + lineCount + 1) * lineHeight + offsetY;
    comment.buttonObjects = {
      left: leftParts,
      middle: parts,
      right: {
        type: "right",
        right: leftOffset + atButtonPadding,
        top: posY - lineHeight + atButtonPadding,
        height: lineHeight,
      },
    };
  }
  return comment;
};

/**
 * ボタンからのコメントを作成する
 * @param comment @ボタンのコメント
 * @param vpos コメントのvpos
 * @returns 作成したコメント
 */
const buildAtButtonComment = (
  comment: FormattedCommentWithSize,
  vpos: number,
): FormattedComment | undefined => {
  if (!comment.button || comment.button.limit <= 0) return;
  comment.button.limit -= 1;
  const mail = [...comment.button.commentMail, "from_button"];
  if (!comment.button.commentVisible) {
    mail.push("invisible");
  }
  return {
    id: -1,
    vpos,
    content: comment.button.commentMessage,
    date: -1,
    date_usec: -1,
    owner: false,
    premium: true,
    mail,
    user_id: -10,
    layer: -1,
    is_my_post: true,
  };
};

export {
  buildAtButtonComment,
  clampFlashContent,
  getButtonParts,
  getFlashFontIndex,
  getFlashFontName,
  parseContent,
};
