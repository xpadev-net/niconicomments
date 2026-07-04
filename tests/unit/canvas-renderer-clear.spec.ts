import { describe, expect, test, vi } from "vitest";

import NiconiComments from "@/main";
import { CanvasRenderer } from "@/renderer/canvas";

type Transform = {
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
};

class RecordingCanvasContext {
  public calls: string[] = [];
  public fillStyle: string | CanvasGradient | CanvasPattern = "#000000";
  public font = "10px sans-serif";
  public lineJoin: CanvasLineJoin = "miter";
  public strokeStyle: string | CanvasGradient | CanvasPattern = "#000000";
  public textAlign: CanvasTextAlign = "start";
  public textBaseline: CanvasTextBaseline = "alphabetic";
  private transform: Transform = {
    scaleX: 1,
    scaleY: 1,
    translateX: 0,
    translateY: 0,
  };
  private stack: Transform[] = [];

  save() {
    this.calls.push("save");
    this.stack.push({ ...this.transform });
  }

  restore() {
    this.calls.push("restore");
    const restored = this.stack.pop();
    if (restored) this.transform = restored;
  }

  setTransform(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) {
    this.calls.push(`setTransform(${a},${b},${c},${d},${e},${f})`);
    this.transform = {
      scaleX: a,
      scaleY: d,
      translateX: e,
      translateY: f,
    };
  }

  translate(x: number, y: number) {
    this.calls.push(`translate(${x},${y})`);
    this.transform.translateX += x * this.transform.scaleX;
    this.transform.translateY += y * this.transform.scaleY;
  }

  scale(x: number, y: number) {
    this.calls.push(`scale(${x},${y})`);
    this.transform.scaleX *= x;
    this.transform.scaleY *= y;
  }

  getTransform() {
    return {
      a: this.transform.scaleX,
      b: 0,
      c: 0,
      d: this.transform.scaleY,
      e: this.transform.translateX,
      f: this.transform.translateY,
    };
  }

  clearRect(x: number, y: number, width: number, height: number) {
    this.calls.push(`clearRect(${x},${y},${width},${height})`);
  }

  fillRect(x: number, y: number, width: number, height: number) {
    this.calls.push(
      `fillRect(${x},${y},${width},${height})@${this.transform.scaleX},${this.transform.scaleY}`,
    );
  }

  drawImage(
    _image: HTMLCanvasElement,
    x: number,
    y: number,
    width?: number,
    height?: number,
  ) {
    if (width === undefined || height === undefined) {
      this.calls.push(
        `drawImage(${x},${y})@${this.transform.scaleX},${this.transform.scaleY}`,
      );
    } else {
      this.calls.push(
        `drawImage(${x},${y},${width},${height})@${this.transform.scaleX},${this.transform.scaleY}`,
      );
    }
  }
}

const createRenderer = (padding = 0) => {
  const context = new RecordingCanvasContext();
  const canvas = {
    width: 640,
    height: 360,
    getContext: vi.fn(() => context),
  } as unknown as HTMLCanvasElement;
  const renderer = new CanvasRenderer(canvas, undefined, padding);
  context.calls = [];
  return { context, renderer };
};

describe("CanvasRenderer.clearRect", () => {
  test("clears with an identity transform and restores scale for subsequent drawing", () => {
    const { context, renderer } = createRenderer();

    renderer.setScale(0.5);
    renderer.clearRect(0, 0, 640, 360);
    renderer.fillRect(10, 20, 30, 40);

    expect(context.calls).toEqual([
      "scale(0.5,0.5)",
      "save",
      "setTransform(1,0,0,1,0,0)",
      "clearRect(0,0,320,180)",
      "restore",
      "fillRect(10,20,30,40)@0.5,0.5",
    ]);
  });

  test("preserves padded renderer clear coordinates while resetting scale", () => {
    const { context, renderer } = createRenderer(4);

    renderer.setScale(0.5, 0.25);
    renderer.clearRect(1, 2, 100, 50);

    expect(context.calls).toEqual([
      "scale(0.5,0.25)",
      "save",
      "setTransform(1,0,0,1,0,0)",
      "clearRect(4.5,4.5,50,12.5)",
      "restore",
    ]);
  });

  test("expands logical clears when the renderer scale is greater than one", () => {
    const { context, renderer } = createRenderer();

    renderer.setScale(2);
    renderer.clearRect(0, 0, 640, 360);

    expect(context.calls).toEqual([
      "scale(2,2)",
      "save",
      "setTransform(1,0,0,1,0,0)",
      "clearRect(0,0,1280,720)",
      "restore",
    ]);
  });

  test("clears the entire backing canvas through NiconiComments.clear when renderer scale is reduced", () => {
    if (!("HTMLCanvasElement" in globalThis)) {
      Object.defineProperty(globalThis, "HTMLCanvasElement", {
        configurable: true,
        value: class HTMLCanvasElement {},
      });
    }
    const { context, renderer } = createRenderer();

    renderer.setSize(320, 180);
    const niconiComments = new NiconiComments(renderer, [], {
      format: "formatted",
    });
    renderer.setScale(0.5);
    context.calls = [];

    niconiComments.clear();

    expect(context.calls).toEqual([
      "save",
      "setTransform(1,0,0,1,0,0)",
      "clearRect(0,0,320,180)",
      "restore",
    ]);
  });

  test("falls back to clearRect when a custom renderer has a non-function clear property", () => {
    if (!("HTMLCanvasElement" in globalThis)) {
      Object.defineProperty(globalThis, "HTMLCanvasElement", {
        configurable: true,
        value: class HTMLCanvasElement {},
      });
    }
    const { context, renderer } = createRenderer();
    Object.defineProperty(renderer, "clear", {
      configurable: true,
      value: true,
    });
    const flush = vi.spyOn(renderer, "flush");
    const niconiComments = new NiconiComments(renderer, [], {
      format: "formatted",
    });
    context.calls = [];

    expect(() => niconiComments.clear()).not.toThrow();
    expect(context.calls).toEqual([
      "save",
      "setTransform(1,0,0,1,0,0)",
      "clearRect(0,0,213.33333333333331,120)",
      "restore",
    ]);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  test("draws padded sub-renderers without shifting their content origin", () => {
    const { context, renderer } = createRenderer();
    const { renderer: image } = createRenderer(4);
    image.setSize(100, 40);

    renderer.drawImage(image, 10, 20);

    expect(context.calls).toEqual(["drawImage(6,16,108,48)@1,1"]);
  });

  test("ignores incomplete destination size when drawing padded sub-renderers", () => {
    const { context, renderer } = createRenderer();
    const { renderer: image } = createRenderer(4);
    image.setSize(100, 40);

    renderer.drawImage(image, 10, 20, 200);

    expect(context.calls).toEqual(["drawImage(6,16,108,48)@1,1"]);
  });

  test("scales padded sub-renderer offsets with explicit destination size", () => {
    const { context, renderer } = createRenderer();
    const { renderer: image } = createRenderer(4);
    image.setSize(100, 40);

    renderer.setScale(0.5);
    renderer.drawImage(image, 10, 20, 200, 80);

    expect(context.calls).toEqual([
      "scale(0.5,0.5)",
      "drawImage(2,12,216,96)@0.5,0.5",
    ]);
  });
});
