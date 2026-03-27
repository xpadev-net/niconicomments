import { bench, describe } from "vitest";

import type { FormattedCommentWithSize, IComment } from "@/@types";
import { arrayPush } from "@/utils/array";
import { hex2rgb, hex2rgba } from "@/utils/color";
import { getPosX, parseFont } from "@/utils/comment";

import { resetBenchState } from "./helpers";

// config 依存の関数のためセットアップを1回実行
resetBenchState();

const posXComment = {
  loc: "naka",
  width: 200,
  long: 300,
  vpos: 100,
} as FormattedCommentWithSize;

const rgbColors = ["#FF0000", "#00FF00", "#0000FF", "#ABC", "#FFFFFF", "#000"];
const rgbaColors = ["#FF0000FF", "#00FF0080", "#0000FFCC", "#ABCD"];
const fontNames = ["defont", "gothic", "mincho", "gulim", "simsun"] as const;
const fontSizes = [15, 24, 39];

describe("getPosX", () => {
  bench("10000 position calculations", () => {
    for (let vpos = 100; vpos < 10100; vpos++) {
      getPosX(posXComment, vpos);
    }
  });
});

describe("hex2rgb", () => {
  bench("10000 hex to rgb conversions", () => {
    for (let i = 0; i < 10000; i++) {
      hex2rgb(rgbColors[i % rgbColors.length]);
    }
  });
});

describe("hex2rgba", () => {
  bench("10000 hex to rgba conversions", () => {
    for (let i = 0; i < 10000; i++) {
      hex2rgba(rgbaColors[i % rgbaColors.length]);
    }
  });
});

describe("parseFont", () => {
  bench("10000 font parsing", () => {
    for (let i = 0; i < 10000; i++) {
      parseFont(fontNames[i % fontNames.length], fontSizes[i % fontSizes.length]);
    }
  });
});

describe("arrayPush", () => {
  bench("10000 arrayPush operations", () => {
    const obj: { [key: number]: IComment[] } = {};
    const item = { index: 0 } as IComment;
    for (let i = 0; i < 10000; i++) {
      arrayPush(obj, i % 500, item);
    }
  });
});
