import { beforeEach, describe, expect, test, vi } from "vitest";

import type { BaseConfig, FormattedComment, IRenderer } from "@/@types";
import { defaultConfig } from "@/definition/config";
import { initConfig } from "@/definition/initConfig";
import { InvalidOptionError } from "@/errors";
import NiconiComments from "@/main";

type MultiFontSizeConfig = Extract<BaseConfig["fontSize"], { html5: unknown }>;

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

class FakeRenderer implements IRenderer {
  public readonly rendererName = "FakeRenderer";
  public readonly canvas = {} as HTMLCanvasElement;
  public drawImageCalls = 0;
  private font = "";
  private size = { width: 1920, height: 1080 };

  destroy() {}
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
  fillText() {}
  strokeText() {}
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
    return this;
  }
  drawImage() {
    this.drawImageCalls++;
  }
  flush() {}
  invalidateImage() {}
}

const createComment = (id: number): FormattedComment => ({
  id,
  vpos: 0,
  content: `comment ${id}`,
  date: id,
  date_usec: 0,
  owner: false,
  premium: false,
  mail: ["ue"],
  user_id: id,
  layer: -1,
  is_my_post: false,
});

describe("init option and config bounds", () => {
  beforeEach(() => {
    initConfig();
    if (!("HTMLCanvasElement" in globalThis)) {
      Object.defineProperty(globalThis, "HTMLCanvasElement", {
        configurable: true,
        value: class HTMLCanvasElement {},
      });
    }
    let timeoutId = 0;
    vi.stubGlobal("window", {
      setTimeout: vi.fn(() => ++timeoutId),
    });
    vi.stubGlobal("clearTimeout", vi.fn());
  });

  test.each([
    Infinity,
    Number.NaN,
    1e9,
    0,
  ])("rejects unsafe scale value %s", (scale) => {
    expect(
      () =>
        new NiconiComments(new FakeRenderer(), [], {
          format: "formatted",
          mode: "html5",
          scale,
        }),
    ).toThrow(InvalidOptionError);
  });

  test("rejects config values that can break allocation or loop bounds", () => {
    const fontSize = defaultConfig.fontSize as MultiFontSizeConfig;
    expect(
      () =>
        new NiconiComments(new FakeRenderer(), [], {
          format: "formatted",
          mode: "html5",
          config: { canvasWidth: 1e9 },
        }),
    ).toThrow(InvalidOptionError);
    expect(
      () =>
        new NiconiComments(new FakeRenderer(), [], {
          format: "formatted",
          mode: "html5",
          config: { canvasWidth: Number.MIN_VALUE },
        }),
    ).toThrow(InvalidOptionError);
    expect(
      () =>
        new NiconiComments(new FakeRenderer(), [], {
          format: "formatted",
          mode: "html5",
          config: { commentLimit: -1 },
        }),
    ).toThrow(InvalidOptionError);
    expect(
      () =>
        new NiconiComments(new FakeRenderer(), [], {
          format: "formatted",
          mode: "html5",
          config: {
            fontSize: {
              ...fontSize,
              html5: {
                ...fontSize.html5,
                medium: {
                  ...fontSize.html5.medium,
                  default: Infinity,
                },
              },
            },
          },
        }),
    ).toThrow(InvalidOptionError);
    expect(
      () =>
        new NiconiComments(new FakeRenderer(), [], {
          format: "formatted",
          mode: "html5",
          config: { atButtonPadding: Infinity },
        }),
    ).toThrow(InvalidOptionError);
    expect(
      () =>
        new NiconiComments(new FakeRenderer(), [], {
          format: "formatted",
          mode: "html5",
          config: {
            flashCommentYPaddingTop: {
              default: Infinity,
              resized: 3,
            },
          },
        }),
    ).toThrow(InvalidOptionError);
  });

  test("rejects invalid init and config control values", () => {
    expect(
      () =>
        new NiconiComments(new FakeRenderer(), [], {
          format: "formatted",
          lazy: "true" as unknown as boolean,
          mode: "html5",
        }),
    ).toThrow(InvalidOptionError);
    expect(
      () =>
        new NiconiComments(new FakeRenderer(), [], {
          format: "formatted",
          mode: "legacy" as "html5",
        }),
    ).toThrow(InvalidOptionError);
    expect(
      () =>
        new NiconiComments(new FakeRenderer(), [], {
          format: "formatted",
          mode: "html5",
          config: { hideCommentOrder: "bad" as "asc" },
        }),
    ).toThrow(InvalidOptionError);
    expect(
      () =>
        new NiconiComments(new FakeRenderer(), [], {
          format: "formatted",
          mode: "html5",
          config: { plugins: {} as BaseConfig["plugins"] },
        }),
    ).toThrow(InvalidOptionError);
    expect(
      () =>
        new NiconiComments(new FakeRenderer(), [], {
          format: "formatted",
          mode: "html5",
          config: { commentPlugins: {} as BaseConfig["commentPlugins"] },
        }),
    ).toThrow(InvalidOptionError);
  });

  test("accepts the explicit default config", () => {
    expect(
      () =>
        new NiconiComments(new FakeRenderer(), [], {
          format: "formatted",
          mode: "html5",
          config: { ...defaultConfig },
        }),
    ).not.toThrow();
  });

  test("ignores explicit undefined config values and keeps defaults", () => {
    expect(
      () =>
        new NiconiComments(new FakeRenderer(), [], {
          format: "formatted",
          mode: "html5",
          config: {
            canvasWidth: undefined as unknown as number,
            commentLimit: undefined,
          },
        }),
    ).not.toThrow();
  });

  test("treats commentLimit 0 as drawing zero comments", () => {
    const zeroLimitRenderer = new FakeRenderer();
    const zeroLimit = new NiconiComments(
      zeroLimitRenderer,
      [createComment(1), createComment(2)],
      {
        format: "formatted",
        mode: "html5",
        config: { commentLimit: 0 },
      },
    );
    zeroLimitRenderer.drawImageCalls = 0;
    zeroLimit.drawCanvas(0, true);

    const unlimitedRenderer = new FakeRenderer();
    const unlimited = new NiconiComments(
      unlimitedRenderer,
      [createComment(1), createComment(2)],
      {
        format: "formatted",
        mode: "html5",
      },
    );
    unlimitedRenderer.drawImageCalls = 0;
    unlimited.drawCanvas(0, true);

    expect(zeroLimitRenderer.drawImageCalls).toBe(0);
    expect(unlimitedRenderer.drawImageCalls).toBeGreaterThan(0);
  });
});
