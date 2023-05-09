import type { CommentContentIndex, CommentFlashFont } from "@/@types";
import { CommentContentItem } from "@/@types";
import { config } from "@/definition/config";
import { nativeSort } from "@/utils/sort";

const getFlashFontIndex = (part: string): CommentContentIndex[] => {
  const regex = {
    simsunStrong: new RegExp(config.flashChar.simsunStrong),
    simsunWeak: new RegExp(config.flashChar.simsunWeak),
    gulim: new RegExp(config.flashChar.gulim),
    gothic: new RegExp(config.flashChar.gothic),
  };
  const index: CommentContentIndex[] = [];
  let match;
  if ((match = regex.simsunStrong.exec(part)) !== null) {
    index.push({ font: "simsunStrong", index: match.index });
  }
  if ((match = regex.simsunWeak.exec(part)) !== null) {
    index.push({ font: "simsunWeak", index: match.index });
  }
  if ((match = regex.gulim.exec(part)) !== null) {
    index.push({ font: "gulim", index: match.index });
  }
  if ((match = regex.gothic.exec(part)) !== null) {
    index.push({ font: "gothic", index: match.index });
  }
  return index;
};

const getFlashFontName = (font: string): CommentFlashFont => {
  if (font.match("^simsun.+")) return "simsun";
  if (font === "gothic") return "defont";
  return font as CommentFlashFont;
};

const parseContent = (content: string) => {
  const results: CommentContentItem[] = [];
  const lines = (content.match(/\n|[^\n]+/g) || []).map((val) =>
    Array.from(val.match(/[ -~｡-ﾟ]+|[^ -~｡-ﾟ]+/g) || [])
  );
  for (const line of lines) {
    const lineContent = parseLine(line);
    const firstContent = lineContent[0];
    if (firstContent && firstContent.font) {
      results.push(
        ...lineContent.map((val) => {
          if (!val.font) {
            val.font = firstContent.font;
          }
          return val;
        })
      );
    } else {
      results.push(...lineContent);
    }
  }
  return results;
};

const parseLine = (line: string[]) => {
  const lineContent: CommentContentItem[] = [];
  for (const part of line) {
    if (part.match(/[ -~｡-ﾟ]+/g) !== null) {
      lineContent.push({ content: part, slicedContent: part.split("\n") });
      continue;
    }
    parseFullWidthPart(part, lineContent);
  }
  return lineContent;
};

const parseFullWidthPart = (
  part: string,
  lineContent: CommentContentItem[]
) => {
  const index = getFlashFontIndex(part);
  if (index.length === 0) {
    lineContent.push({ content: part, slicedContent: part.split("\n") });
  } else if (index.length === 1 && index[0]) {
    lineContent.push({
      content: part,
      slicedContent: part.split("\n"),
      font: getFlashFontName(index[0].font),
    });
  } else {
    parseMultiFontFullWidthPart(part, index, lineContent);
  }
};

const parseMultiFontFullWidthPart = (
  part: string,
  index: CommentContentIndex[],
  lineContent: CommentContentItem[]
) => {
  index.sort(nativeSort((val) => val.index));
  if (config.FlashMode === "xp") {
    let offset = 0;
    for (let i = 1, n = index.length; i < n; i++) {
      const currentVal = index[i],
        lastVal = index[i - 1];
      if (currentVal === undefined || lastVal === undefined) continue;
      const content = part.slice(offset, currentVal.index);
      lineContent.push({
        content: content,
        slicedContent: content.split("\n"),
        font: getFlashFontName(lastVal.font),
      });
      offset = currentVal.index;
    }
    const val = index[index.length - 1];
    if (val) {
      const content = part.slice(offset);
      lineContent.push({
        content: content,
        slicedContent: content.split("\n"),
        font: getFlashFontName(val.font),
      });
    }
    return;
  }
  const firstVal = index[0],
    secondVal = index[1];
  if (!firstVal || !secondVal) {
    lineContent.push({
      content: part,
      slicedContent: part.split("\n"),
    });
    return;
  }
  if (firstVal.font !== "gothic") {
    lineContent.push({
      content: part,
      slicedContent: part.split("\n"),
      font: getFlashFontName(firstVal.font),
    });
    return;
  }
  const firstContent = part.slice(0, secondVal.index);
  const secondContent = part.slice(secondVal.index);
  lineContent.push({
    content: firstContent,
    slicedContent: firstContent.split("\n"),
    font: getFlashFontName(firstVal.font),
  });
  lineContent.push({
    content: secondContent,
    slicedContent: secondContent.split("\n"),
    font: getFlashFontName(secondVal.font),
  });
};

export { getFlashFontIndex, getFlashFontName, parseContent };
