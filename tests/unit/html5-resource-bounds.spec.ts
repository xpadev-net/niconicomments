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
  public measureCalls = 0;
  public fillTextCalls = 0;
  public strokeTextCalls = 0;
  public destroyed = false;
  private font = "10px sans-serif";
  private size = { width: 0, height: 0 };

  destroy() {
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
  fillText() {
    this.fillTextCalls++;
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
    this.children.push(child);
    return child;
  }
  drawImage() {}
  flush() {}
  invalidateImage() {}
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
}

const formattedComment = (
  id: number,
  content: string,
  mail: string[] = [],
): FormattedComment => ({
  id,
  vpos: 0,
  content,
  date: 1_700_000_000,
  date_usec: 0,
  owner: false,
  premium: false,
  mail,
  user_id: id,
  layer: -1,
  is_my_post: false,
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
