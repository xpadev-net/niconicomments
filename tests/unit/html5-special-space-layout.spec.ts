import { beforeEach, describe, expect, test, vi } from "vitest";

import type { FormattedComment, IRenderer } from "@/@types";
import { HTML5Comment } from "@/comments";
import { createNicoScripts, ImageCacheContext } from "@/contexts";
import { defaultConfig } from "@/definition/config";
import { HTML5_SPECIAL_SPACE_EM_WIDTH } from "@/definition/html5Spacers";
import { initConfig } from "@/definition/initConfig";
import { RangeCacheContext } from "@/utils";

const textMetrics = (width: number): TextMetrics =>
  ({
    width,
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: width,
    actualBoundingBoxAscent: 0,
    actualBoundingBoxDescent: 0,
    alphabeticBaseline: 0,
    hangingBaseline: 0,
    emHeightAscent: 0,
    emHeightDescent: 0,
    fontBoundingBoxAscent: 0,
    fontBoundingBoxDescent: 0,
    ideographicBaseline: 0,
  }) as TextMetrics;

class RecordingRenderer implements IRenderer {
  public readonly rendererName = "RecordingRenderer";
  public readonly canvas = {} as HTMLCanvasElement;
  public readonly children: RecordingRenderer[] = [];
  public readonly drawImageCalls: { image: IRenderer; x: number; y: number }[] =
    [];
  public readonly fillTextCallsByPosition: {
    text: string;
    x: number;
    y: number;
  }[] = [];
  public measureCalls = 0;
  public fillTextCalls = 0;
  public fillTextFailuresRemaining = 0;
  public strokeTextCalls = 0;
  public destroyCalls = 0;
  public destroyed = false;
  public nextChildFillTextFailuresRemaining = 0;
  private font = "10px sans-serif";
  private size = { width: 0, height: 0 };

  destroy() {
    this.destroyCalls++;
    this.destroyed = true;
  }
  drawVideo() {}
  getFont() {
    return this.font;
  }
  getFillStyle() {
    return "#000000";
  }
  setScale() {}
  fillRect() {}
  strokeRect() {}
  fillText(text: string, x: number, y: number) {
    this.fillTextCalls++;
    if (this.fillTextFailuresRemaining > 0) {
      this.fillTextFailuresRemaining--;
      throw new Error("fillText failed");
    }
    this.fillTextCallsByPosition.push({ text, x, y });
  }
  strokeText() {
    this.strokeTextCalls++;
  }
  quadraticCurveTo() {}
  clearRect() {}
  setFont(font: string) {
    this.font = font;
  }
  setFillStyle() {}
  setStrokeStyle() {}
  setLineWidth() {}
  setGlobalAlpha() {}
  setSize(width: number, height: number) {
    this.size = { width, height };
  }
  getSize() {
    return this.size;
  }
  measureText(text: string) {
    this.measureCalls++;
    const fontSize = Number(/([0-9.]+)px/.exec(this.font)?.[1] ?? 10);
    return textMetrics(text.length * fontSize * 0.5);
  }
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  stroke() {}
  save() {}
  restore() {}
  getCanvas() {
    const child = new RecordingRenderer();
    child.fillTextFailuresRemaining = this.nextChildFillTextFailuresRemaining;
    this.nextChildFillTextFailuresRemaining = 0;
    this.children.push(child);
    return child;
  }
  drawImage(image: IRenderer, x: number, y: number) {
    this.drawImageCalls.push({ image, x, y });
  }
  flush() {}
  invalidateImage() {}
}

type FormattedCommentOverride = Pick<
  Partial<FormattedComment>,
  | "layer"
  | "date"
  | "date_usec"
  | "ignoreScale"
  | "is_my_post"
  | "owner"
  | "premium"
  | "user_id"
  | "vpos"
>;

const formattedComment = (
  id: number,
  content: string,
  mail: string[] = [],
  overrides: FormattedCommentOverride = {},
): FormattedComment => ({
  id,
  vpos: overrides.vpos ?? 0,
  content,
  date: overrides.date ?? 1_700_000_000,
  date_usec: overrides.date_usec ?? 0,
  owner: overrides.owner ?? false,
  premium: overrides.premium ?? false,
  mail,
  user_id: overrides.user_id ?? id,
  layer: overrides.layer ?? -1,
  ignoreScale: overrides.ignoreScale ?? false,
  is_my_post: overrides.is_my_post ?? false,
});

const createContext = () => ({
  config: defaultConfig,
  options: {
    config: {},
    debug: false,
    enableLegacyPiP: false,
    format: "formatted" as const,
    formatted: false,
    keepCA: false,
    mode: "default" as const,
    scale: 1,
    showCollision: false,
    showCommentCount: false,
    showFPS: false,
    useLegacy: false,
    video: undefined,
    lazy: false,
  },
  nicoScripts: createNicoScripts(),
  imageCache: new ImageCacheContext(),
  rangeCache: new RangeCacheContext(),
});

class TestHTML5Comment extends HTML5Comment {
  exposeTextImage() {
    return this.getTextImage();
  }
}

const fontSizeOf = (renderer: RecordingRenderer) =>
  Number(/([0-9.]+)px/.exec(renderer.getFont())?.[1]);

const draw = (content: string, compat: boolean) => {
  const ctx = createContext();
  ctx.config = { ...defaultConfig, html5SpecialSpaceCompat: compat };
  const comment = new TestHTML5Comment(
    formattedComment(1, content, ["ue"]),
    new RecordingRenderer(),
    0,
    ctx,
  );
  const image = comment.exposeTextImage() as RecordingRenderer;
  return { comment, image, calls: image.fillTextCallsByPosition };
};

const SPECIAL_SPACES = Object.keys(HTML5_SPECIAL_SPACE_EM_WIDTH);

describe("HTML5 special spaces are laid out as margins, not drawn (#472)", () => {
  beforeEach(() => {
    initConfig();
    let timeoutId = 0;
    vi.stubGlobal("window", { setTimeout: vi.fn(() => ++timeoutId) });
    vi.stubGlobal("clearTimeout", vi.fn());
  });

  test.each(
    SPECIAL_SPACES.map((c) => [
      `U+${(c.codePointAt(0) ?? 0).toString(16).toUpperCase()}`,
      c,
    ]),
  )("%s は fillText に渡されず、定義された em 幅だけ x が進む", (_name, char) => {
    const { image, calls } = draw(`A${char}B`, true);
    expect(calls.map((c) => c.text)).toEqual(["A", "B"]);
    const [a, b] = calls;
    const fontSize = fontSizeOf(image);
    // モックの measureText は 1 文字 = 0.5em。A の後に空白の em 幅が加算される
    const expected =
      0.5 * fontSize + (HTML5_SPECIAL_SPACE_EM_WIDTH[char] ?? 0) * fontSize;
    expect((b?.x ?? 0) - (a?.x ?? 0)).toBeCloseTo(expected, 5);
    expect(b?.y).toBe(a?.y);
  });

  test("連続した空白は 1 つの余白にまとまり、元テキストは保持される", () => {
    const { comment, image, calls } = draw("A\u2001\u2001\u2003B", true);
    expect(calls.map((c) => c.text)).toEqual(["A", "B"]);
    const fontSize = fontSizeOf(image);
    expect((calls[1]?.x ?? 0) - (calls[0]?.x ?? 0)).toBeCloseTo(
      0.5 * fontSize + 3 * fontSize,
      5,
    );
    expect(comment.comment.rawContent).toBe("A\u2001\u2001\u2003B");
  });

  test("特殊空白は measureText に渡されない(幅は定数で決まる)", () => {
    const measured: string[] = [];
    class SpyRenderer extends RecordingRenderer {
      override measureText(text: string) {
        measured.push(text);
        return super.measureText(text);
      }
    }
    const ctx = createContext();
    ctx.config = { ...defaultConfig, html5SpecialSpaceCompat: true };
    new TestHTML5Comment(
      formattedComment(1, `A${SPECIAL_SPACES.join("")}B`, ["ue"]),
      new SpyRenderer(),
      0,
      ctx,
    );
    expect(measured.length).toBeGreaterThan(0);
    for (const text of measured) {
      for (const char of SPECIAL_SPACES) expect(text).not.toContain(char);
    }
  });

  test("改行を挟むと x は 0 に戻り、行だけが進む", () => {
    const calls = draw("A\u2001\nB", true).calls.filter((c) => c.text !== "");
    expect(calls.map((c) => c.text)).toEqual(["A", "B"]);
    expect(calls[1]?.x).toBe(0);
    expect(calls[1]?.y).toBeGreaterThan(calls[0]?.y ?? 0);
  });

  test("フラグ OFF では従来どおり文字をそのまま描画する", () => {
    const { calls } = draw("A\u2001B", false);
    expect(calls.map((c) => c.text)).toEqual(["A\u2001B"]);
    expect(calls[0]?.x).toBe(0);
  });
});
