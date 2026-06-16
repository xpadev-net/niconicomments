import { beforeEach, describe, expect, test, vi } from "vitest";

import type {
  Collision,
  FormattedComment,
  IComment,
  IPlugin,
  IPluginConstructor,
  IRenderer,
  Timeline,
} from "@/@types";
import { FlashComment, HTML5Comment } from "@/comments";
import { createNicoScripts, ImageCacheContext } from "@/contexts";
import { defaultConfig, defaultOptions } from "@/definition/config";
import { initConfig } from "@/definition/initConfig";
import NiconiComments from "@/main";
import { CanvasRenderer } from "@/renderer/canvas";
import { canvasPool } from "@/renderer/canvasPool";
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
  public destroyCalls = 0;
  public setSizeCalls = 0;
  public fillTextCalls = 0;
  public strokeTextCalls = 0;
  private font = "10px sans-serif";
  private size = { width: 1920, height: 1080 };

  destroy() {
    this.destroyCalls++;
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
    this.setSizeCalls++;
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
}

class TestFlashComment extends FlashComment {}

const formattedComment = (
  content: string,
  mail: string[] = [],
): FormattedComment => ({
  id: 1,
  vpos: 0,
  content,
  date: 1_700_000_000,
  date_usec: 0,
  owner: false,
  premium: false,
  mail,
  user_id: 1,
  layer: -1,
  is_my_post: false,
});

const createContext = () => ({
  config: defaultConfig,
  options: { ...defaultOptions, format: "formatted" as const },
  nicoScripts: createNicoScripts(),
  imageCache: new ImageCacheContext(),
  rangeCache: new RangeCacheContext(),
});

const ensureCanvasElement = () => {
  if (!("HTMLCanvasElement" in globalThis)) {
    vi.stubGlobal("HTMLCanvasElement", class HTMLCanvasElement {});
  }
};

const createCanvasLike = (): HTMLCanvasElement => {
  const context = {
    textAlign: "start",
    textBaseline: "alphabetic",
    lineJoin: "round",
    scale: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    quadraticCurveTo: vi.fn(),
    clearRect: vi.fn(),
    getTransform: vi.fn(() => ({ a: 1, d: 1, e: 0, f: 0 })),
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    measureText: vi.fn(() => textMetrics(1)),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  };
  return {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
  } as unknown as HTMLCanvasElement;
};

describe("destroy lifecycle cleanup", () => {
  beforeEach(() => {
    initConfig();
    canvasPool.clear();
    let timeoutId = 0;
    vi.stubGlobal("window", {
      setTimeout: vi.fn(() => ++timeoutId),
    });
    vi.stubGlobal("clearTimeout", vi.fn());
    ensureCanvasElement();
  });

  test("destroys comments and clears instance lifecycle references idempotently", () => {
    const renderer = new RecordingRenderer();
    const niconiComments = new NiconiComments(renderer, [], {
      format: "formatted",
    });
    const comment = {
      comment: formattedComment("manual") as IComment["comment"],
      invisible: false,
      index: 0,
      loc: "ue",
      width: 1,
      long: 1,
      height: 1,
      vpos: 1,
      flash: false,
      posY: 0,
      owner: false,
      layer: -1,
      mail: [],
      content: "manual",
      destroy: vi.fn(),
      draw: vi.fn(),
      isHovered: vi.fn(() => false),
    } as IComment;
    const state = niconiComments as unknown as {
      collision: Collision;
      comments: IComment[];
      timeline: Timeline;
    };
    state.comments = [comment];
    state.timeline[1] = [comment];
    state.collision.ue[1] = [comment];

    niconiComments.destroy();
    niconiComments.destroy();

    expect(comment.destroy).toHaveBeenCalledTimes(1);
    expect(renderer.destroyCalls).toBe(1);
    expect(state.comments).toHaveLength(0);
    expect(Object.keys(state.timeline)).toHaveLength(0);
    expect(Object.keys(state.collision.ue)).toHaveLength(0);
  });

  test("destroys plugin hooks and plugin canvases idempotently", () => {
    const renderer = new RecordingRenderer();
    class LifecyclePlugin implements IPlugin {
      static instance: LifecyclePlugin | undefined;
      public destroyCalls = 0;
      constructor() {
        LifecyclePlugin.instance = this;
      }
      destroy() {
        this.destroyCalls++;
      }
    }

    const niconiComments = new NiconiComments(renderer, [], {
      config: {
        plugins: [LifecyclePlugin as IPluginConstructor],
      },
      format: "formatted",
    });

    niconiComments.destroy();
    niconiComments.destroy();

    expect(LifecyclePlugin.instance?.destroyCalls).toBe(1);
    expect(renderer.children[0]?.destroyCalls).toBe(1);
    expect(renderer.destroyCalls).toBe(1);
    expect(
      (niconiComments as unknown as { plugins: unknown[] }).plugins,
    ).toHaveLength(0);
  });

  test("clears BaseComment-owned timeout handles during destroy", () => {
    const renderer = new RecordingRenderer();
    const ctx = createContext();
    const comment = new TestHTML5Comment(
      formattedComment("cached text"),
      renderer,
      0,
      ctx,
    );

    const image = comment.exposeTextImage();
    comment.destroy();
    ctx.imageCache.reset();

    expect(image).not.toBeNull();
    expect(clearTimeout).toHaveBeenCalledWith(1);
    expect(clearTimeout).toHaveBeenCalledWith(2);
    expect(renderer.children[0]?.destroyCalls).toBe(1);
  });

  test("destroys Flash at-button images during comment destroy", () => {
    const renderer = new RecordingRenderer();
    const comment = new TestFlashComment(
      formattedComment('@ボタン "[Push]" "posted" "表示" "" "3"'),
      renderer,
      0,
      createContext(),
    );

    comment.draw(0, false);
    comment.destroy();

    const textImage = renderer.children[0];
    const buttonImage = renderer.children[1];
    expect(textImage?.destroyCalls).toBe(0);
    expect(buttonImage?.destroyCalls).toBe(1);
  });

  test("does not return the same pooled canvas twice after repeated renderer destroy", () => {
    vi.stubGlobal("document", {
      createElement: vi.fn(() => createCanvasLike()),
    });
    const renderer = new CanvasRenderer();
    const releasedCanvas = renderer.canvas;

    renderer.destroy();
    renderer.destroy();
    const firstReuse = new CanvasRenderer();
    const secondReuse = new CanvasRenderer();

    expect(firstReuse.canvas).toBe(releasedCanvas);
    expect(secondReuse.canvas).not.toBe(releasedCanvas);

    firstReuse.destroy();
    secondReuse.destroy();
  });
});
