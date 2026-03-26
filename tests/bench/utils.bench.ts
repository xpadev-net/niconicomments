import { bench, describe } from "vitest";

import type { FormattedCommentWithSize } from "@/@types";
import { arrayPush } from "@/utils/array";
import { hex2rgb, hex2rgba } from "@/utils/color";
import { getPosX, parseFont } from "@/utils/comment";

import { resetBenchState } from "./helpers";

describe("getPosX", () => {
  bench("10000 position calculations", () => {
    resetBenchState();
    const comment = {
      loc: "naka",
      width: 200,
      long: 300,
      vpos: 100,
    } as FormattedCommentWithSize;
    for (let vpos = 100; vpos < 10100; vpos++) {
      getPosX(comment, vpos);
    }
  });
});

describe("hex2rgb", () => {
  bench("10000 hex to rgb conversions", () => {
    const colors = ["#FF0000", "#00FF00", "#0000FF", "#ABC", "#FFFFFF", "#000"];
    for (let i = 0; i < 10000; i++) {
      hex2rgb(colors[i % colors.length]);
    }
  });
});

describe("hex2rgba", () => {
  bench("10000 hex to rgba conversions", () => {
    const colors = ["#FF0000FF", "#00FF0080", "#0000FFCC", "#ABCD"];
    for (let i = 0; i < 10000; i++) {
      hex2rgba(colors[i % colors.length]);
    }
  });
});

describe("parseFont", () => {
  bench("10000 font parsing", () => {
    resetBenchState();
    const fonts = ["defont", "gothic", "mincho", "gulim", "simsun"] as const;
    const sizes = [15, 24, 39];
    for (let i = 0; i < 10000; i++) {
      parseFont(fonts[i % fonts.length], sizes[i % sizes.length]);
    }
  });
});

describe("arrayPush", () => {
  bench("10000 arrayPush operations", () => {
    const obj: { [key: number]: unknown[] } = {};
    const item = { index: 0 } as never;
    for (let i = 0; i < 10000; i++) {
      arrayPush(obj, i % 500, item);
    }
  });
});
