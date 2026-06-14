import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

import type {
  FormattedComment,
  FormattedCommentWithSize,
  IRenderer,
} from "@/@types";
import { BaseComment } from "@/comments";
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

class BaseStyleCommentWithoutButtons extends BaseComment {
  protected override convertComment(
    comment: FormattedComment,
  ): FormattedCommentWithSize {
    return {
      ...comment,
      loc: "ue",
      size: "medium",
      fontSize: 24,
      font: "defont",
      color: "#ffffff",
      full: false,
      ender: false,
      _live: false,
      long: 100,
      invisible: false,
      rawContent: comment.content,
      flash: false,
      lineCount: 1,
      lineOffset: 0,
      content: [
        {
          type: "text",
          content: comment.content,
          slicedContent: [comment.content],
          width: [100],
        },
      ],
      height: 24,
      width: 100,
      lineHeight: 24,
      resized: false,
      resizedX: false,
      resizedY: false,
      charSize: 24,
      scale: 1,
      scaleX: 1,
      button: {
        message: {
          before: "",
          body: "Push",
          after: "",
        },
        commentMessage: "posted",
        commentVisible: true,
        commentMail: [],
        limit: 1,
        local: false,
        hidden: false,
      },
    };
  }

  protected override _generateTextImage(): IRenderer {
    return this.renderer.getCanvas();
  }

  protected override _drawCollision() {}
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

  test.each([
    ["showFPS", { showFPS: true }],
    ["showCollision", { showCollision: true }],
    ["showCommentCount", { showCommentCount: true }],
  ] as const)("redraws identical vpos frames when %s is enabled", (_, option) => {
    const renderer = new RecordingRenderer();
    const instance = new NiconiComments(
      renderer,
      [createComment({ content: "static", mail: ["ue"] })],
      {
        format: "formatted",
        mode: "html5",
        ...option,
      },
    );

    expect(instance.drawCanvas(1)).toBe(true);
    expect(instance.drawCanvas(1)).toBe(true);
    expect(renderer.clearRectCalls).toBe(2);
  });

  test("forceRendering redraws identical static comment-only frames", () => {
    const renderer = new RecordingRenderer();
    const instance = new NiconiComments(
      renderer,
      [createComment({ content: "static", mail: ["ue"] })],
      {
        format: "formatted",
        mode: "html5",
      },
    );

    expect(instance.drawCanvas(1)).toBe(true);
    expect(instance.drawCanvas(1, true)).toBe(true);
    expect(renderer.clearRectCalls).toBe(2);
  });

  test("skips unchanged identical static comment-only frames", () => {
    const renderer = new RecordingRenderer();
    const instance = new NiconiComments(
      renderer,
      [createComment({ content: "static", mail: ["ue"] })],
      {
        format: "formatted",
        mode: "html5",
      },
    );

    expect(instance.drawCanvas(1)).toBe(true);
    expect(instance.drawCanvas(1)).toBe(false);
    expect(renderer.clearRectCalls).toBe(1);
  });

  test("draws a base-style custom comment with button metadata as a no-op button", () => {
    const renderer = new RecordingRenderer();
    const instance = new NiconiComments(
      renderer,
      [createComment({ content: "custom button-like", mail: ["ue"] })],
      {
        format: "formatted",
        mode: "html5",
        config: {
          commentPlugins: [
            {
              class: BaseStyleCommentWithoutButtons,
              condition: () => true,
            },
          ],
        },
      },
    );

    expect(() => instance.drawCanvas(0, true, { x: 50, y: 10 })).not.toThrow();
    expect(renderer.drawImageCalls).toBe(1);
  });

  test("click over a base-style custom comment with button metadata is a no-op", () => {
    const instance = new NiconiComments(
      new RecordingRenderer(),
      [createComment({ content: "custom button-like", mail: ["ue"] })],
      {
        format: "formatted",
        mode: "html5",
        config: {
          commentPlugins: [
            {
              class: BaseStyleCommentWithoutButtons,
              condition: () => true,
            },
          ],
        },
      },
    );
    const state = instance as unknown as {
      comments: { comment: { button?: { limit: number } } }[];
    };

    expect(() => instance.click(0, { x: 50, y: 10 })).not.toThrow();
    expect(state.comments).toHaveLength(1);
    expect(state.comments[0]?.comment.button?.limit).toBe(1);
  });
});
