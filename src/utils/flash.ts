import type {
  ButtonPartLeft,
  ButtonPartMiddle,
  CommentContentIndex,
  CommentContentItem,
  CommentFlashFont,
  CommentFlashFontParsed,
  FormattedComment,
  FormattedCommentWithSize,
} from "@/@types";
import { config } from "@/definition/config";
import { getConfig } from "@/utils/config";
import { nativeSort } from "@/utils/sort";

/**
 * コメントの内容からフォント情報を取得する
 * @param part コメントの内容
 * @returns フォント情報
 */
const getFlashFontIndex = (part: string): CommentContentIndex[] => {
  const regex = {
    simsunStrong: new RegExp(config.flashChar.simsunStrong),
    simsunWeak: new RegExp(config.flashChar.simsunWeak),
    gulim: new RegExp(config.flashChar.gulim),
    gothic: new RegExp(config.flashChar.gothic),
  };
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
 * @returns パースしたコメントの内容
 */
const parseContent = (content: string) => {
  const results: CommentContentItem[] = [];
  const lines = Array.from(content.match(/\n|[^\n]+/g) ?? []);
  for (const line of lines) {
    const lineContent = parseLine(line);
    const firstContent = lineContent[0];
    const defaultFont = firstContent?.font;
    if (defaultFont) {
      results.push(
        ...lineContent.map((val) => {
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
      results.push(...lineContent);
    }
  }
  return results;
};

/**
 * 1行分のコメントの内容をパースする
 * @param line 1行分のコメントの内容
 * @returns パースしたコメントの内容
 */
const parseLine = (line: string) => {
  const parts = Array.from(line.match(/[ -~｡-ﾟ]+|[^ -~｡-ﾟ]+/g) ?? []);
  const lineContent: CommentContentItem[] = [];
  for (const part of parts) {
    if (part.match(/[ -~｡-ﾟ]+/g) !== null) {
      addPartToResult(lineContent, part, "defont");
      continue;
    }
    parseFullWidthPart(part, lineContent);
  }
  return lineContent;
};

/**
 * スペースの補正を行った上で結果を追加する
 * @param lineContent 結果格納用の配列
 * @param part 追加する文字列
 * @param font フォント
 */
const addPartToResult = (
  lineContent: CommentContentItem[],
  part: string,
  font?: CommentFlashFont,
) => {
  if (part === "") return;
  for (const key of Object.keys(config.compatSpacer.flash)) {
    const spacerWidth = config.compatSpacer.flash[key]?.[font ?? "defont"];
    if (!spacerWidth) continue;
    const compatIndex = part.indexOf(key);
    if (compatIndex >= 0) {
      addPartToResult(lineContent, part.slice(0, compatIndex), font);
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
      addPartToResult(lineContent, part.slice(i), font);
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
 */
const parseFullWidthPart = (
  part: string,
  lineContent: CommentContentItem[],
) => {
  const index = getFlashFontIndex(part);
  if (index.length === 0) {
    addPartToResult(lineContent, part);
  } else if (index.length === 1 && index[0]) {
    addPartToResult(lineContent, part, getFlashFontName(index[0].font));
  } else {
    parseMultiFontFullWidthPart(part, index, lineContent);
  }
};

/**
 * 複数のフォントが含まれる全角文字の部分をパースする
 * @param part 全角文字の部分
 * @param index フォントのインデックス
 * @param lineContent 1行分のコメントの内容
 */
const parseMultiFontFullWidthPart = (
  part: string,
  index: CommentContentIndex[],
  lineContent: CommentContentItem[],
) => {
  index.sort(nativeSort((val) => val.index));
  if (config.flashMode === "xp") {
    let offset = 0;
    for (let i = 1, n = index.length; i < n; i++) {
      const currentVal = index[i];
      const lastVal = index[i - 1];
      if (currentVal === undefined || lastVal === undefined) continue;
      const content = part.slice(offset, currentVal.index);
      addPartToResult(lineContent, content, getFlashFontName(lastVal.font));
      offset = currentVal.index;
    }
    const val = index[index.length - 1];
    if (val) {
      const content = part.slice(offset);
      addPartToResult(lineContent, content, getFlashFontName(val.font));
    }
    return;
  }
  const firstVal = index[0];
  const secondVal = index[1];
  if (!firstVal || !secondVal) {
    addPartToResult(lineContent, part);
    return;
  }
  if (firstVal.font !== "gothic") {
    addPartToResult(lineContent, part, getFlashFontName(firstVal.font));
    return;
  }
  const firstContent = part.slice(0, secondVal.index);
  const secondContent = part.slice(secondVal.index);
  addPartToResult(lineContent, firstContent, getFlashFontName(firstVal.font));
  addPartToResult(lineContent, secondContent, getFlashFontName(secondVal.font));
};

/**
 * コメントのボタンのパーツを取得する
 * @param comment コメント
 * @returns ボタンのデータを追加したコメント
 */
const getButtonParts = (
  comment: FormattedCommentWithSize,
): FormattedCommentWithSize => {
  let leftParts: ButtonPartLeft | undefined = undefined;
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
  getButtonParts,
  getFlashFontIndex,
  getFlashFontName,
  parseContent,
};
