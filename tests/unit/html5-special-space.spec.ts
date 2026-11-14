import { beforeEach, describe, expect, test } from "vitest";

import type { BaseConfig, CommentContentItem, IRenderer } from "@/@types";
import { defaultConfig } from "@/definition/config";
import { initConfig } from "@/definition/initConfig";
import { addHTML5PartToResult, measure } from "@/utils/niconico";

const withFlag = (enabled: boolean): BaseConfig => ({
  ...defaultConfig,
  html5SpecialSpaceCompat: enabled,
});

describe("HTML5 special space compat (#472)", () => {
  beforeEach(() => initConfig());

  test("フラグ OFF では分割しない", () => {
    const out: CommentContentItem[] = [];
    addHTML5PartToResult(out, "a b", withFlag(false), "defont");
    expect(out).toHaveLength(1);
    expect(out[0]?.type).toBe("text");
  });

  test("フラグ ON で U+2000-2006 を spacer に分割し連続はまとめる", () => {
    const out: CommentContentItem[] = [];
    addHTML5PartToResult(out, "a  b ", withFlag(true), "gothic");
    expect(out.map((i) => i.type)).toEqual([
      "text",
      "spacer",
      "text",
      "spacer",
    ]);
    expect(out[1]).toMatchObject({ char: " ", charWidth: 1, count: 2 });
    expect(out[3]).toMatchObject({ char: " ", count: 1 });
    expect((out[3] as { charWidth: number }).charWidth).toBeCloseTo(1 / 3);
  });

  test("明示的な compatSpacer.html5 設定が優先される", () => {
    const config = withFlag(true);
    config.compatSpacer = {
      ...config.compatSpacer,
      html5: { " ": { gothic: 2 } },
    };
    const out: CommentContentItem[] = [];
    addHTML5PartToResult(out, " ", config, "gothic");
    expect(out[0]).toMatchObject({ type: "spacer", charWidth: 2 });
  });

  test("compatSpacer.html5 に 0 を明示すると幅 0 の spacer になる", () => {
    const config = withFlag(true);
    config.compatSpacer = {
      ...config.compatSpacer,
      html5: { "\u2001": { gothic: 0 } },
    };
    const out: CommentContentItem[] = [];
    addHTML5PartToResult(out, "a\u2001b\u2000", config, "gothic");
    expect(out.map((i) => i.type)).toEqual([
      "text",
      "spacer",
      "text",
      "spacer",
    ]);
    expect(out[1]).toMatchObject({ char: "\u2001", charWidth: 0, count: 1 });
    expect(out[3]).toMatchObject({ char: "\u2000", charWidth: 0.5 });
  });

  test("幅は measureText の結果(WebKit の縮んだ値)に依存しない", () => {
    const measured: string[] = [];
    const renderer = {
      setFont: () => {},
      measureText: (t: string) => {
        measured.push(t);
        return { width: 27.78 * t.length } as TextMetrics;
      },
    } as unknown as IRenderer;
    const config = withFlag(true);
    const out: CommentContentItem[] = [];
    addHTML5PartToResult(out, "    ", config, "defont");
    const { width } = measure(
      {
        font: "defont",
        charSize: 100,
        lineHeight: 100,
        lineCount: 1,
        content: out,
      } as never,
      renderer,
      config,
    );
    expect(measured).toEqual([]);
    // fontSize = 80: 0.5 + 1 + 1/3 + 1/4 em
    expect(width).toBe(Math.ceil(80 * (0.5 + 1 + 1 / 3 + 1 / 4)));
  });
});
