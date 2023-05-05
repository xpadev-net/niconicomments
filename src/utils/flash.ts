import type { CommentContentIndex, CommentFlashFont } from "@/@types";
import { config } from "@/definition/config";

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

export { getFlashFontIndex, getFlashFontName };
