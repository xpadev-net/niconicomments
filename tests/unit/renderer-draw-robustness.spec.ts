import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

import type { FormattedComment, IRenderer } from "@/@types";
import { initConfig } from "@/definition/initConfig";
import NiconiComments from "@/main";

class HTMLCanvasElementMock {}

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
  public clearRectCalls = 0;
  public drawImageCalls = 0;
  public drawImageFailuresRemaining = 0;
  public drawVideoCalls = 0;
  public saveDepth = 0;
  private font = "10px sans-serif";
  private size = { width: 1920, height: 1080 };

  destroy() {}
  drawVideo() {
    this.drawVideoCalls++;
  }
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
  clearRect() {
    this.clearRectCalls++;
  }
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
  save() {
    this.saveDepth++;
  }
  restore() {
    this.saveDepth--;
  }
  getCanvas() {
    const child = new RecordingRenderer();
    this.children.push(child);
    return child;
  }
  drawImage() {
    this.drawImageCalls++;
    if (this.drawImageFailuresRemaining > 0) {
      this.drawImageFailuresRemaining--;
      throw new Error("invalid draw source");
    }
  }
  flush() {}
  invalidateImage() {}
}

class VideoSurfaceRenderer extends RecordingRenderer {
  public readonly video = {} as HTMLVideoElement;
}

class NullVideoRenderer extends RecordingRenderer {
  public readonly video = null;
}

const createComment = (
  overrides: Partial<FormattedComment> = {},
): FormattedComment => ({
  id: overrides.id ?? 1,
  vpos: overrides.vpos ?? 0,
  content: overrides.content ?? "test comment",
  date: overrides.date ?? 1,
  date_usec: overrides.date_usec ?? 0,
  owner: overrides.owner ?? false,
  premium: overrides.premium ?? false,
  mail: overrides.mail ?? [],
  user_id: overrides.user_id ?? 1,
  layer: overrides.layer ?? -1,
  is_my_post: overrides.is_my_post ?? false,
});

describe("renderer draw robustness", () => {
  beforeAll(() => {
    if (typeof HTMLCanvasElement === "undefined") {
      Object.defineProperty(globalThis, "HTMLCanvasElement", {
        value: HTMLCanvasElementMock,
        configurable: true,
      });
    }
  });

  beforeEach(() => {
    initConfig();
    let timeoutId = 0;
    vi.stubGlobal("window", {
      setTimeout: vi.fn(() => ++timeoutId),
    });
    vi.stubGlobal("clearTimeout", vi.fn());
  });

  test("culls an offscreen naka lead-in before text image generation", () => {
    const renderer = new RecordingRenderer();
    const instance = new NiconiComments(
      renderer,
      [createComment({ content: "lead-in", mail: ["@10"] })],
      { format: "formatted", mode: "html5" },
    );

    expect(instance.drawCanvas(-250, true)).toBe(true);

    expect(renderer.children).toHaveLength(0);
    expect(renderer.drawImageCalls).toBe(0);
  });

  test.each([
    "html5",
    "flash",
  ] as const)("keeps drawing after one %s comment image source fails", (mode) => {
    const renderer = new RecordingRenderer();
    renderer.drawImageFailuresRemaining = 1;
    const instance = new NiconiComments(
      renderer,
      [
        createComment({ id: 1, content: "bad source", mail: ["ue"] }),
        createComment({
          id: 2,
          content: "still draws",
          mail: ["ue", "nico:opacity:0.5"],
        }),
      ],
      { format: "formatted", mode },
    );

    expect(() => instance.drawCanvas(0, true)).not.toThrow();
    expect(renderer.drawImageCalls).toBe(2);
    expect(renderer.drawImageFailuresRemaining).toBe(0);
    expect(renderer.saveDepth).toBe(0);
  });

  test("redraws static frames when the renderer has a video surface", () => {
    const renderer = new VideoSurfaceRenderer();
    const instance = new NiconiComments(renderer, [], {
      format: "formatted",
      mode: "html5",
    });

    expect(instance.drawCanvas(1)).toBe(true);
    expect(instance.drawCanvas(2)).toBe(true);
    expect(instance.drawCanvas(2)).toBe(true);
    expect(renderer.clearRectCalls).toBe(3);
    expect(renderer.drawVideoCalls).toBe(3);
  });

  test("does not treat a null renderer video property as a video surface", () => {
    const renderer = new NullVideoRenderer();
    const instance = new NiconiComments(
      renderer,
      [createComment({ content: "static", mail: ["ue"] })],
      {
        format: "formatted",
        mode: "html5",
      },
    );

    expect(instance.drawCanvas(1)).toBe(true);
    expect(instance.drawCanvas(2)).toBe(false);
    expect(renderer.clearRectCalls).toBe(1);
    expect(renderer.drawVideoCalls).toBe(1);
  });
});
