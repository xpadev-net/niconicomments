import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

import type {
  FormattedComment,
  FormattedCommentWithSize,
  IComment,
  IRenderer,
} from "@/@types";
import { BaseComment } from "@/comments";
import { initConfig } from "@/definition/initConfig";
import NiconiComments from "@/main";
import { WebGL2Renderer } from "@/renderer/webgl2";

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
  public flushCalls = 0;
  public flushFailuresRemaining = 0;
  public rendererNeedsRedraw = false;
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
  flush() {
    this.flushCalls++;
    if (this.flushFailuresRemaining > 0) {
      this.flushFailuresRemaining--;
      throw new Error("flush failed");
    }
    this.rendererNeedsRedraw = false;
  }
  needsRedraw() {
    return this.rendererNeedsRedraw;
  }
  invalidateImage() {}
}

class VideoSurfaceRenderer extends RecordingRenderer {
  public readonly video = {} as HTMLVideoElement;
}

class NullVideoRenderer extends RecordingRenderer {
  public readonly video = null;
}

type WebGLTextureSetupMock = {
  readonly TEXTURE_2D: number;
  readonly TEXTURE_MIN_FILTER: number;
  readonly TEXTURE_MAG_FILTER: number;
  readonly TEXTURE_WRAP_S: number;
  readonly TEXTURE_WRAP_T: number;
  readonly LINEAR: number;
  readonly CLAMP_TO_EDGE: number;
  readonly RGBA: number;
  readonly UNSIGNED_BYTE: number;
  createTexture: ReturnType<typeof vi.fn<() => WebGLTexture>>;
  bindTexture: ReturnType<typeof vi.fn>;
  texParameteri: ReturnType<typeof vi.fn>;
  texImage2D: ReturnType<typeof vi.fn>;
  deleteTexture: ReturnType<typeof vi.fn>;
};

type WebGL2RendererTexturePrivate = {
  gl: WebGLTextureSetupMock;
  _createTexture(uploadSource: HTMLCanvasElement): WebGLTexture;
};

type WebGLRestoreSetupMock = {
  readonly BLEND: number;
  readonly ONE: number;
  readonly ONE_MINUS_SRC_ALPHA: number;
  readonly UNPACK_PREMULTIPLY_ALPHA_WEBGL: number;
  enable: ReturnType<typeof vi.fn>;
  blendFunc: ReturnType<typeof vi.fn>;
  pixelStorei: ReturnType<typeof vi.fn>;
  viewport: ReturnType<typeof vi.fn>;
  bindVertexArray: ReturnType<typeof vi.fn>;
};

type WebGL2RendererRestorePrivate = {
  gl: WebGLRestoreSetupMock;
  canvas: { width: number; height: number };
  texMap: Map<unknown, unknown>;
  cmds: unknown[];
  helperDirty: boolean;
  frameCount: number;
  quadVAO: WebGLVertexArrayObject;
  _initGLResources(): {
    spriteProg: WebGLProgram;
    spriteLocRect: WebGLUniformLocation;
    spriteLocProj: WebGLUniformLocation;
    spriteLocAlpha: WebGLUniformLocation;
    rectProg: WebGLProgram;
    rectLocRect: WebGLUniformLocation;
    rectLocProj: WebGLUniformLocation;
    rectLocColor: WebGLUniformLocation;
    quadVAO: WebGLVertexArrayObject;
    quadBuf: WebGLBuffer;
  };
  _rebuildGLResources(): void;
  flush(): void;
  needsRedraw(): boolean;
};

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

class NaNVposFirstCommentPlugin {
  static readonly id = "nan-vpos-first-comment-plugin";

  constructor(canvas: IRenderer, comments: IComment[]) {
    void canvas;
    void comments;
  }

  draw() {
    return false;
  }

  transformComments(comments: IComment[]) {
    if (comments[0]) {
      comments[0].comment.vpos = Number.NaN;
    }
    return comments;
  }
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
    Number.NaN,
    Infinity,
    -Infinity,
  ])("ignores non-finite drawCanvas vpos %s before lazy work", (vpos) => {
    const renderer = new RecordingRenderer();
    const instance = new NiconiComments(
      renderer,
      [createComment({ vpos: 1000, content: "lazy" })],
      { format: "formatted", mode: "html5", lazy: true },
    );
    const state = instance as unknown as {
      processedCommentIndex: number;
      nextUnprocessedCommentIndex: number;
    };

    expect(instance.drawCanvas(vpos)).toBe(false);

    expect(renderer.clearRectCalls).toBe(0);
    expect(state.processedCommentIndex).toBe(-1);
    expect(state.nextUnprocessedCommentIndex).toBe(0);
  });

  test("skips malformed plugin comment vpos without starving later lazy comments", () => {
    const renderer = new RecordingRenderer();
    const instance = new NiconiComments(
      renderer,
      [
        createComment({ id: 1, vpos: 1000, content: "plugin-malformed" }),
        createComment({ id: 2, vpos: 1000, content: "valid", mail: ["ue"] }),
      ],
      {
        format: "formatted",
        mode: "html5",
        lazy: true,
        config: { plugins: [NaNVposFirstCommentPlugin] },
      },
    );
    const state = instance as unknown as {
      comments: IComment[];
      timeline: Record<number, IComment[]>;
    };

    expect(instance.drawCanvas(1000, true)).toBe(true);

    expect(state.comments[0]?.invisible).toBe(true);
    expect(state.comments[0]?.posY).toBe(0);
    expect(state.timeline[1000]?.map((comment) => comment.comment.id)).toEqual([
      2,
    ]);
    expect(Object.hasOwn(state.timeline, "NaN")).toBe(false);
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

  test("retries an unchanged frame after renderer flush fails", () => {
    const renderer = new RecordingRenderer();
    renderer.flushFailuresRemaining = 1;
    const instance = new NiconiComments(renderer, [], {
      format: "formatted",
      mode: "html5",
    });

    expect(() => instance.drawCanvas(1)).toThrow("flush failed");
    expect(instance.drawCanvas(1)).toBe(true);

    expect(renderer.clearRectCalls).toBe(2);
    expect(renderer.flushCalls).toBe(2);
  });

  test("does not replay NicoScript transitions when retrying after flush fails", () => {
    const renderer = new RecordingRenderer();
    renderer.flushFailuresRemaining = 1;
    const instance = new NiconiComments(
      renderer,
      [
        createComment({
          content: "@ジャンプ sm9 retry-safe",
          owner: true,
        }),
      ],
      {
        format: "formatted",
        mode: "html5",
      },
    );
    const jumpHandler = vi.fn();
    instance.addEventListener("jump", jumpHandler);

    expect(() => instance.drawCanvas(1)).toThrow("flush failed");
    expect(jumpHandler).toHaveBeenCalledTimes(1);

    expect(instance.drawCanvas(1)).toBe(true);

    expect(jumpHandler).toHaveBeenCalledTimes(1);
    expect(jumpHandler).toHaveBeenCalledWith(
      expect.objectContaining({ to: "sm9", message: "retry-safe" }),
    );
  });

  test("redraws unchanged frames when renderer reports restored resources", () => {
    const renderer = new RecordingRenderer();
    const instance = new NiconiComments(renderer, [], {
      format: "formatted",
      mode: "html5",
    });

    expect(instance.drawCanvas(1)).toBe(true);
    expect(instance.drawCanvas(1)).toBe(false);

    renderer.rendererNeedsRedraw = true;

    expect(instance.drawCanvas(1)).toBe(true);
    expect(instance.drawCanvas(1)).toBe(false);
    expect(renderer.clearRectCalls).toBe(2);
    expect(renderer.flushCalls).toBe(2);
  });

  test("redraws identical vpos frames when the cursor changes", () => {
    const renderer = new RecordingRenderer();
    const instance = new NiconiComments(
      renderer,
      [createComment({ content: "static", mail: ["ue"] })],
      {
        format: "formatted",
        mode: "html5",
      },
    );

    expect(instance.drawCanvas(1, false, { x: 0, y: 0 })).toBe(true);
    expect(instance.drawCanvas(1, false, { x: 0, y: 0 })).toBe(false);
    expect(instance.drawCanvas(1, false, { x: 1, y: 0 })).toBe(true);
    expect(renderer.clearRectCalls).toBe(2);
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

  test("ignores non-finite click vpos before reading timeline buckets", () => {
    const instance = new NiconiComments(new RecordingRenderer(), [], {
      format: "formatted",
      mode: "html5",
    });
    const state = instance as unknown as {
      timeline: Record<string, IComment[]>;
    };
    state.timeline.NaN = [
      {
        isHovered: () => {
          throw new Error("NaN bucket should not be read");
        },
      } as IComment,
    ];

    expect(() => instance.click(Number.NaN, { x: 0, y: 0 })).not.toThrow();
  });

  test.each([
    { x: Number.NaN, y: 0 },
    { x: 0, y: Infinity },
    { x: -Infinity, y: 0 },
  ])("ignores non-finite click position %# before reading timeline", (pos) => {
    const instance = new NiconiComments(new RecordingRenderer(), [], {
      format: "formatted",
      mode: "html5",
    });
    const state = instance as unknown as {
      timeline: Record<string, IComment[]>;
    };
    state.timeline[0] = [
      {
        isHovered: () => {
          throw new Error("invalid cursor should not read timeline");
        },
      } as IComment,
    ];

    expect(() => instance.click(0, pos)).not.toThrow();
  });

  test("deletes and unbinds a new WebGL texture when upload fails", () => {
    const texture = {} as WebGLTexture;
    const uploadError = new Error("upload failed");
    const gl: WebGLTextureSetupMock = {
      TEXTURE_2D: 1,
      TEXTURE_MIN_FILTER: 2,
      TEXTURE_MAG_FILTER: 3,
      TEXTURE_WRAP_S: 4,
      TEXTURE_WRAP_T: 5,
      LINEAR: 6,
      CLAMP_TO_EDGE: 7,
      RGBA: 8,
      UNSIGNED_BYTE: 9,
      createTexture: vi.fn(() => texture),
      bindTexture: vi.fn(),
      texParameteri: vi.fn(),
      texImage2D: vi.fn(() => {
        throw uploadError;
      }),
      deleteTexture: vi.fn(),
    };
    const renderer = Object.create(
      WebGL2Renderer.prototype,
    ) as WebGL2RendererTexturePrivate;
    renderer.gl = gl;

    expect(() => renderer._createTexture({} as HTMLCanvasElement)).toThrow(
      uploadError,
    );

    expect(gl.bindTexture).toHaveBeenNthCalledWith(1, gl.TEXTURE_2D, texture);
    expect(gl.bindTexture).toHaveBeenNthCalledWith(2, gl.TEXTURE_2D, null);
    expect(gl.bindTexture).toHaveBeenCalledTimes(2);
    expect(gl.deleteTexture).toHaveBeenCalledTimes(1);
    expect(gl.deleteTexture).toHaveBeenCalledWith(texture);
  });

  test("WebGL resource rebuild marks the renderer dirty until flush succeeds", () => {
    const gl: WebGLRestoreSetupMock = {
      BLEND: 1,
      ONE: 2,
      ONE_MINUS_SRC_ALPHA: 3,
      UNPACK_PREMULTIPLY_ALPHA_WEBGL: 4,
      enable: vi.fn(),
      blendFunc: vi.fn(),
      pixelStorei: vi.fn(),
      viewport: vi.fn(),
      bindVertexArray: vi.fn(),
    };
    const renderer = Object.create(
      WebGL2Renderer.prototype,
    ) as WebGL2RendererRestorePrivate;
    renderer.gl = gl;
    renderer.canvas = { width: 1920, height: 1080 };
    renderer.texMap = new Map();
    renderer.cmds = [];
    renderer.helperDirty = false;
    renderer.frameCount = 0;
    renderer._initGLResources = vi.fn(() => ({
      spriteProg: {} as WebGLProgram,
      spriteLocRect: {} as WebGLUniformLocation,
      spriteLocProj: {} as WebGLUniformLocation,
      spriteLocAlpha: {} as WebGLUniformLocation,
      rectProg: {} as WebGLProgram,
      rectLocRect: {} as WebGLUniformLocation,
      rectLocProj: {} as WebGLUniformLocation,
      rectLocColor: {} as WebGLUniformLocation,
      quadVAO: {} as WebGLVertexArrayObject,
      quadBuf: {} as WebGLBuffer,
    }));

    renderer._rebuildGLResources();

    expect(renderer.needsRedraw()).toBe(true);

    renderer.flush();

    expect(renderer.needsRedraw()).toBe(false);
  });
});
