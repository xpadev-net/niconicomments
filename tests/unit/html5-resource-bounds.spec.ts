import { beforeEach, describe, expect, test, vi } from "vitest";

import type { FormattedComment, IRenderer } from "@/@types";
import { HTML5Comment } from "@/comments";
import { createNicoScripts, ImageCacheContext } from "@/contexts";
import { defaultConfig } from "@/definition/config";
import { initConfig } from "@/definition/initConfig";
import { CanvasRenderer } from "@/renderer/canvas";
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

const createLegacyImageRenderer = (): Omit<IRenderer, "destroy"> => {
  let font = "10px sans-serif";
  let size = { width: 0, height: 0 };
  return {
    rendererName: "LegacyImageRenderer",
    canvas: {} as HTMLCanvasElement,
    drawVideo() {},
    getFont() {
      return font;
    },
    getFillStyle() {
      return "#000000";
    },
    setScale() {},
    fillRect() {},
    strokeRect() {},
    fillText() {},
    strokeText() {},
    quadraticCurveTo() {},
    clearRect() {},
    setFont(nextFont: string) {
      font = nextFont;
    },
    setFillStyle() {},
    setStrokeStyle() {},
    setLineWidth() {},
    setGlobalAlpha() {},
    setSize(width: number, height: number) {
      size = { width, height };
    },
    getSize() {
      return size;
    },
    measureText(text: string) {
      const fontSize = Number(/([0-9.]+)px/.exec(font)?.[1] ?? 10);
      return textMetrics(text.length * fontSize * 0.5);
    },
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    save() {},
    restore() {},
    getCanvas() {
      // Test-only runtime contract break: createLegacyImageRenderer omits
      // destroy() while providing the members this cache path uses.
      return createLegacyImageRenderer() as IRenderer;
    },
    drawImage() {},
    flush() {},
    invalidateImage() {},
  };
};

class LegacyImageSourceRenderer extends RecordingRenderer {
  public readonly legacyImages: IRenderer[] = [];

  override getCanvas() {
    // Test-only runtime contract break for LegacyImageSourceRenderer; do not
    // copy this cast outside legacy compatibility tests.
    const image = createLegacyImageRenderer() as IRenderer;
    this.legacyImages.push(image);
    return image;
  }
}

class TestHTML5Comment extends HTML5Comment {
  exposeTextImage() {
    return this.getTextImage();
  }
  exposeCacheKey() {
    return this.cacheKey;
  }
  exposeCurrentImage() {
    return this.image;
  }
  drawBodyForTest() {
    this._draw(0, 0);
  }
  forceInvalidFontForTest() {
    (this.comment as { font: unknown }).font = "invalid-font";
    this.image = undefined;
  }
}

type FormattedCommentOverride = Pick<
  Partial<FormattedComment>,
  | "date"
  | "date_usec"
  | "is_my_post"
  | "layer"
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

const cachedKeyCount = (imageCache: ImageCacheContext, keys: string[]) =>
  keys.filter((key) => imageCache.get(key)).length;

const runWindowTimeout = (timeoutId: number) => {
  const timeoutCallIndex = vi
    .mocked(window.setTimeout)
    .mock.results.findIndex((result) => result.value === timeoutId);
  const timeoutCall = vi.mocked(window.setTimeout).mock.calls[timeoutCallIndex];
  const callback = timeoutCall?.[0];

  expect(callback).toEqual(expect.any(Function));
  (callback as () => void)();
};

const expectLegacyImageWithoutDestroy = (images: IRenderer[]) => {
  expect(images).toHaveLength(1);
  const image = images[0];
  expect(image).toBeDefined();
  expect("destroy" in (image as object)).toBe(false);
};

describe("HTML5 comment resource bounds", () => {
  beforeEach(() => {
    initConfig();
    let timeoutId = 0;
    vi.stubGlobal("window", {
      setTimeout: vi.fn(() => ++timeoutId),
    });
    vi.stubGlobal("clearTimeout", vi.fn());
  });

  test("caps newline-heavy comments before measurement and image generation", () => {
    const renderer = new RecordingRenderer();
    const comment = new TestHTML5Comment(
      formattedComment(1, "\n".repeat(10_000)),
      renderer,
      0,
      createContext(),
    );

    expect(comment.comment.lineCount).toBe(256);
    expect(renderer.measureCalls).toBeLessThanOrEqual(256);
    expect(comment.exposeTextImage()).toBeNull();
    expect(renderer.children).toHaveLength(0);
  });

  test("preserves normal multiline rendering", () => {
    const renderer = new RecordingRenderer();
    const comment = new TestHTML5Comment(
      formattedComment(1, "one\ntwo\nthree"),
      renderer,
      0,
      createContext(),
    );

    const image = comment.exposeTextImage();

    expect(image).not.toBeNull();
    expect(comment.comment.lineCount).toBe(3);
    expect(renderer.children).toHaveLength(1);
    expect(renderer.children[0]?.getSize().width).toBeGreaterThan(0);
    expect(renderer.children[0]?.fillTextCalls).toBe(3);
    expect(renderer.children[0]?.strokeTextCalls).toBe(3);
  });

  test("preserves text on the final allowed HTML5 line", () => {
    const renderer = new RecordingRenderer();
    const content = Array.from({ length: 256 }, (_, i) => `line-${i + 1}`).join(
      "\n",
    );
    const comment = new TestHTML5Comment(
      formattedComment(1, content),
      renderer,
      0,
      createContext(),
    );

    expect(comment.comment.lineCount).toBe(256);
    expect(comment.comment.content).toContainEqual(
      expect.objectContaining({
        content: expect.stringContaining("line-256"),
        slicedContent: expect.arrayContaining(["line-256"]),
      }),
    );
  });

  test("destroys allocated HTML5 text images when type validation fails", () => {
    const renderer = new RecordingRenderer();
    const comment = new TestHTML5Comment(
      formattedComment(1, "invalid font after allocation"),
      renderer,
      0,
      createContext(),
    );
    comment.forceInvalidFontForTest();

    expect(() => comment.exposeTextImage()).toThrow();
    expect(() => comment.exposeTextImage()).toThrow();

    expect(renderer.children).toHaveLength(2);
    expect(renderer.children.map((child) => child.destroyCalls)).toEqual([
      1, 1,
    ]);
  });

  test("clamps over-limit HTML5 lines after preserving the final allowed line", () => {
    const renderer = new RecordingRenderer();
    const content = Array.from({ length: 300 }, (_, i) => `line-${i + 1}`).join(
      "\n",
    );
    const comment = new TestHTML5Comment(
      formattedComment(1, content),
      renderer,
      0,
      createContext(),
    );

    expect(comment.comment.lineCount).toBe(256);
    expect(comment.comment.content).toContainEqual(
      expect.objectContaining({
        content: expect.stringContaining("line-256"),
        slicedContent: expect.arrayContaining(["line-256"]),
      }),
    );
    expect(comment.comment.content).not.toContainEqual(
      expect.objectContaining({
        content: expect.stringContaining("line-257"),
        slicedContent: expect.arrayContaining(["line-257"]),
      }),
    );
  });

  test.each([
    "ue",
    "shita",
  ] as const)("keeps %s fixed-comment resize measurement bounded for huge text", (loc) => {
    const renderer = new RecordingRenderer();
    const comment = new TestHTML5Comment(
      formattedComment(1, "x".repeat(5000), [loc]),
      renderer,
      0,
      createContext(),
    );
    const widthLimit =
      defaultConfig.commentStageSize.html5.width *
      defaultConfig.commentScale.html5;

    expect(comment.comment.resizedX).toBe(true);
    expect(comment.comment.charSize).toBeLessThan(1);
    expect(comment.comment.width).toBeLessThanOrEqual(widthLimit);
    expect(renderer.measureCalls).toBeLessThanOrEqual(80);

    const image = comment.exposeTextImage() as RecordingRenderer | null;

    expect(image).not.toBeNull();
    expect(image?.getSize().width).toBeLessThanOrEqual(widthLimit);
    expect(image?.getSize().height).toBeGreaterThan(0);
  });

  test.each([
    "ue",
    "shita",
  ] as const)("reserves and offsets HTML5 offscreen top padding for long %s comments", (loc) => {
    const renderer = new RecordingRenderer();
    const comment = new TestHTML5Comment(
      formattedComment(1, "x".repeat(5000), [loc]),
      renderer,
      0,
      createContext(),
    );

    const image = comment.exposeTextImage() as RecordingRenderer | null;

    expect(image).not.toBeNull();
    const paddingHeight =
      (image?.getSize().height ?? 0) - comment.comment.height;
    expect(paddingHeight).toBeGreaterThan(0);
    expect(image?.fillTextCallsByPosition[0]?.y).toBeGreaterThan(0);

    comment.drawBodyForTest();

    expect(renderer.drawImageCalls).toHaveLength(1);
    expect(renderer.drawImageCalls[0]?.image).toBe(image);
    expect(renderer.drawImageCalls[0]?.x).toBe(0);
    expect(renderer.drawImageCalls[0]?.y).toBeCloseTo(-paddingHeight, 5);
  });

  test("keeps owner @置換 resized fixed-comment draw origin stable", () => {
    const ctx = createContext();
    const replacedContent = "x".repeat(4096);
    const scriptRenderer = new RecordingRenderer();
    new TestHTML5Comment(
      formattedComment(1, `@置換 "needle" "${replacedContent}" 全 投コメ`, [], {
        owner: true,
      }),
      scriptRenderer,
      0,
      ctx,
    );
    const renderer = new RecordingRenderer();
    const comment = new TestHTML5Comment(
      formattedComment(2, "needle", ["ue"], { owner: true, vpos: 1 }),
      renderer,
      1,
      ctx,
    );

    expect(comment.comment.resizedX).toBe(true);
    expect(comment.comment.content).toContainEqual(
      expect.objectContaining({ content: replacedContent }),
    );

    const image = comment.exposeTextImage() as RecordingRenderer | null;

    expect(image).not.toBeNull();
    const paddingHeight =
      (image?.getSize().height ?? 0) - comment.comment.height;
    expect(paddingHeight).toBeGreaterThan(0);

    comment.drawBodyForTest();

    expect(renderer.drawImageCalls).toHaveLength(1);
    expect(renderer.drawImageCalls[0]?.image).toBe(image);
    expect(renderer.drawImageCalls[0]?.x).toBe(0);
    expect(renderer.drawImageCalls[0]?.y).toBe(0);
  });

  test("keeps fixed-comment resize measurement bounded at max content length", () => {
    const renderer = new RecordingRenderer();
    const comment = new TestHTML5Comment(
      formattedComment(1, "x".repeat(20_000), ["ue"]),
      renderer,
      0,
      createContext(),
    );
    const widthLimit =
      defaultConfig.commentStageSize.html5.width *
      defaultConfig.commentScale.html5;

    expect(comment.comment.resizedX).toBe(true);
    expect(comment.comment.width).toBeLessThanOrEqual(widthLimit);
    expect(renderer.measureCalls).toBeLessThanOrEqual(80);
  });

  test("keeps fixed-comment resize bounded when max line count also applies", () => {
    const renderer = new RecordingRenderer();
    const comment = new TestHTML5Comment(
      formattedComment(1, `${"x".repeat(5000)}\n${"\n".repeat(10_000)}`, [
        "shita",
      ]),
      renderer,
      0,
      createContext(),
    );
    const widthLimit =
      defaultConfig.commentStageSize.html5.width *
      defaultConfig.commentScale.html5;

    expect(comment.comment.lineCount).toBe(256);
    expect(comment.comment.resizedX).toBe(true);
    expect(comment.comment.resizedY).toBe(true);
    expect(comment.comment.charSize).toBeLessThan(1);
    expect(comment.comment.width).toBeLessThanOrEqual(widthLimit);
    expect(renderer.measureCalls).toBeLessThanOrEqual(7000);

    const image = comment.exposeTextImage() as RecordingRenderer | null;

    expect(image).not.toBeNull();
    expect(image?.getSize().width).toBeLessThanOrEqual(widthLimit);
    expect(image?.getSize().height).toBeGreaterThan(0);
  });

  test("bounds cache keys and per-context image cache growth", () => {
    const ctx = createContext();
    const longContentComment = new TestHTML5Comment(
      formattedComment(1, "x".repeat(10_000)),
      new RecordingRenderer(),
      0,
      ctx,
    );

    expect(longContentComment.exposeCacheKey().length).toBeLessThan(600);
    expect(longContentComment.exposeCacheKey()).not.toContain("x".repeat(1000));

    const cacheKeys: string[] = [];
    let firstComment: TestHTML5Comment | undefined;
    let firstImage: RecordingRenderer | undefined;
    for (let i = 0; i < 1050; i++) {
      const renderer = new RecordingRenderer();
      const comment = new TestHTML5Comment(
        formattedComment(i + 2, `cacheable ${i}`),
        renderer,
        i,
        ctx,
      );
      cacheKeys.push(comment.exposeCacheKey());
      const image = comment.exposeTextImage() as RecordingRenderer | null;
      expect(image).not.toBeNull();
      firstComment ??= comment;
      firstImage ??= image ?? undefined;
    }

    const cachedCount = cachedKeyCount(ctx.imageCache, cacheKeys);
    expect(cachedCount).toBeGreaterThan(0);
    expect(cachedCount).toBeLessThanOrEqual(1024);
    expect(cachedCount).toBeLessThan(cacheKeys.length);
    expect(firstImage?.destroyed).toBe(true);

    firstComment?.drawBodyForTest();

    expect(firstComment?.exposeCurrentImage()).not.toBe(firstImage);
    expect(firstComment?.exposeCurrentImage()).toBeTruthy();
  });

  test("expires legacy cached images without requiring destroy", () => {
    const ctx = createContext();
    const renderer = new LegacyImageSourceRenderer();
    const comment = new TestHTML5Comment(
      formattedComment(1, "legacy image"),
      renderer,
      0,
      ctx,
    );

    const image = comment.exposeTextImage();

    expect(image).not.toBeNull();
    expectLegacyImageWithoutDestroy(renderer.legacyImages);
    expect(ctx.imageCache.get(comment.exposeCacheKey())?.image).toBe(image);
    const timeoutId = ctx.imageCache.get(comment.exposeCacheKey())?.timeout;
    expect(timeoutId).toBeDefined();
    expect(() => runWindowTimeout(timeoutId as number)).not.toThrow();
    expect(ctx.imageCache.get(comment.exposeCacheKey())).toBeUndefined();
  });

  test("refreshes legacy cached image expiry without requiring destroy", () => {
    const ctx = createContext();
    const renderer = new LegacyImageSourceRenderer();
    const first = new TestHTML5Comment(
      formattedComment(1, "legacy cache hit"),
      renderer,
      0,
      ctx,
    );
    const second = new TestHTML5Comment(
      formattedComment(2, "legacy cache hit"),
      renderer,
      1,
      ctx,
    );

    const image = first.exposeTextImage();
    const cachedImage = second.exposeTextImage();

    expect(cachedImage).toBe(image);
    expectLegacyImageWithoutDestroy(renderer.legacyImages);
    const timeoutId = ctx.imageCache.get(second.exposeCacheKey())?.timeout;
    expect(timeoutId).toBeDefined();
    expect(() => runWindowTimeout(timeoutId as number)).not.toThrow();
    expect(ctx.imageCache.get(second.exposeCacheKey())).toBeUndefined();
  });

  test("evicts legacy cached images without requiring destroy", () => {
    const ctx = createContext();
    const firstRenderer = new LegacyImageSourceRenderer();
    const firstComment = new TestHTML5Comment(
      formattedComment(1, "legacy evicted"),
      firstRenderer,
      0,
      ctx,
    );
    const firstImage = firstComment.exposeTextImage();

    for (let i = 0; i < 1024; i++) {
      const comment = new TestHTML5Comment(
        formattedComment(i + 2, `cache filler ${i}`),
        new RecordingRenderer(),
        i + 1,
        ctx,
      );
      expect(comment.exposeTextImage()).not.toBeNull();
    }

    expect(firstImage).not.toBeNull();
    expectLegacyImageWithoutDestroy(firstRenderer.legacyImages);
    expect(ctx.imageCache.get(firstComment.exposeCacheKey())).toBeUndefined();
  });

  test("resets legacy cached images without requiring destroy", () => {
    const ctx = createContext();
    const renderer = new LegacyImageSourceRenderer();
    const comment = new TestHTML5Comment(
      formattedComment(1, "legacy reset"),
      renderer,
      0,
      ctx,
    );

    const image = comment.exposeTextImage();

    expect(image).not.toBeNull();
    expectLegacyImageWithoutDestroy(renderer.legacyImages);
    expect(ctx.imageCache.get(comment.exposeCacheKey())?.image).toBe(image);
    expect(() => ctx.imageCache.reset()).not.toThrow();
    expect(ctx.imageCache.get(comment.exposeCacheKey())).toBeUndefined();
  });

  test("preserves mail command order in image cache keys", () => {
    const ctx = createContext();
    const first = new TestHTML5Comment(
      formattedComment(1, "same content", ["red", "blue"]),
      new RecordingRenderer(),
      0,
      ctx,
    );
    const reversed = new TestHTML5Comment(
      formattedComment(2, "same content", ["blue", "red"]),
      new RecordingRenderer(),
      1,
      ctx,
    );
    const identical = new TestHTML5Comment(
      formattedComment(3, "same content", ["red", "blue"]),
      new RecordingRenderer(),
      2,
      ctx,
    );

    expect(first.comment.color).not.toBe(reversed.comment.color);
    expect(first.exposeCacheKey()).not.toBe(reversed.exposeCacheKey());
    expect(first.exposeCacheKey()).toBe(identical.exposeCacheKey());

    const firstImage = first.exposeTextImage();
    const reversedImage = reversed.exposeTextImage();
    const identicalImage = identical.exposeTextImage();

    expect(firstImage).not.toBeNull();
    expect(reversedImage).not.toBeNull();
    expect(firstImage).not.toBe(reversedImage);
    expect(identicalImage).toBe(firstImage);
  });

  test("keeps delimiter-ambiguous mail arrays out of the same image cache entry", () => {
    const ctx = createContext();
    const commaCommand = new TestHTML5Comment(
      formattedComment(1, "same content", ["red,blue"]),
      new RecordingRenderer(),
      0,
      ctx,
    );
    const separateCommands = new TestHTML5Comment(
      formattedComment(2, "same content", ["red", "blue"]),
      new RecordingRenderer(),
      1,
      ctx,
    );

    expect(commaCommand.comment.color).not.toBe(separateCommands.comment.color);
    expect(commaCommand.exposeCacheKey()).not.toBe(
      separateCommands.exposeCacheKey(),
    );

    const commaImage = commaCommand.exposeTextImage();
    const separateImage = separateCommands.exposeTextImage();

    expect(commaImage).not.toBeNull();
    expect(separateImage).not.toBeNull();
    expect(commaImage).not.toBe(separateImage);
  });

  test("clamps backing canvas dimensions including padding", () => {
    const context = {
      textAlign: "start",
      textBaseline: "alphabetic",
      lineJoin: "round",
      translate: vi.fn(),
      measureText: vi.fn(() => textMetrics(1)),
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
    } as unknown as HTMLCanvasElement;
    const renderer = new CanvasRenderer(canvas, undefined, 4);

    renderer.setSize(10_000, 10_000);

    expect(canvas.width).toBeLessThanOrEqual(8192);
    expect(canvas.height).toBeLessThanOrEqual(8192);
    expect(renderer.getSize().width).toBe(canvas.width - 8);
    expect(renderer.getSize().height).toBe(canvas.height - 8);
  });

  test("reapplies padding transform and canvas defaults after setSize resets context state", () => {
    const context = {
      textAlign: "left",
      textBaseline: "top",
      lineJoin: "miter",
      translate: vi.fn(),
      measureText: vi.fn(() => textMetrics(1)),
    };
    const resetContextState = () => {
      context.textAlign = "left";
      context.textBaseline = "top";
      context.lineJoin = "miter";
    };
    const canvas = {
      getContext: vi.fn(() => context),
    } as unknown as HTMLCanvasElement;
    let canvasWidth = 100;
    let canvasHeight = 50;
    Object.defineProperty(canvas, "width", {
      get: () => canvasWidth,
      set: (value: number) => {
        canvasWidth = value;
        resetContextState();
      },
    });
    Object.defineProperty(canvas, "height", {
      get: () => canvasHeight,
      set: (value: number) => {
        canvasHeight = value;
        resetContextState();
      },
    });

    const renderer = new CanvasRenderer(canvas, undefined, 4);

    expect(context.textAlign).toBe("start");
    expect(context.textBaseline).toBe("alphabetic");
    expect(context.lineJoin).toBe("round");
    expect(context.translate).toHaveBeenCalledTimes(1);
    expect(context.translate).toHaveBeenLastCalledWith(4, 4);
    expect(canvas.width).toBe(108);
    expect(canvas.height).toBe(58);

    renderer.setSize(200, 80);

    expect(context.textAlign).toBe("start");
    expect(context.textBaseline).toBe("alphabetic");
    expect(context.lineJoin).toBe("round");
    expect(context.translate).toHaveBeenCalledTimes(2);
    expect(context.translate).toHaveBeenLastCalledWith(4, 4);
    expect(canvas.width).toBe(208);
    expect(canvas.height).toBe(88);
    expect(renderer.getSize()).toEqual({ width: 200, height: 80 });
  });
});
