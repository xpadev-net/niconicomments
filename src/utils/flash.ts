import type { commentContentIndex, commentFlashFont } from "@/@types";
import { config } from "@/definition/config";

const getFlashFontIndex = (part: string): commentContentIndex[] => {
  const regex = {
    simsunStrong: new RegExp(config.flashChar.simsunStrong),
    simsunWeak: new RegExp(config.flashChar.simsunWeak),
    gulim: new RegExp(config.flashChar.gulim),
    gothic: new RegExp(config.flashChar.gothic),
  };
  const index: commentContentIndex[] = [];
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

const getFlashFontName = (font: string): commentFlashFont => {
  if (font.match("^simsun.+")) return "simsun";
  if (font === "gothic") return "defont";
  return font as commentFlashFont;
};

export { getFlashFontIndex, getFlashFontName };
