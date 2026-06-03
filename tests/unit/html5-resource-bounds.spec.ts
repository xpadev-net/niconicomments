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

  test("keeps fixed-comment resize measurement bounded for huge text", () => {
    const renderer = new RecordingRenderer();
    const comment = new TestHTML5Comment(
      formattedComment(1, "x".repeat(5000), ["ue"]),
      renderer,
      0,
      createContext(),
    );

    expect(comment.comment.resizedX).toBe(true);
    expect(renderer.measureCalls).toBeLessThanOrEqual(80);
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
});
