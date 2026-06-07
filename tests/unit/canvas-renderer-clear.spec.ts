import { describe, expect, test, vi } from "vitest";

import { CanvasRenderer } from "@/renderer/canvas";

type Transform = {
  scaleX: number;
  scaleY: number;
};

class RecordingCanvasContext {
  public calls: string[] = [];
  public fillStyle: string | CanvasGradient | CanvasPattern = "#000000";
  public font = "10px sans-serif";
  public lineJoin: CanvasLineJoin = "miter";
  public strokeStyle: string | CanvasGradient | CanvasPattern = "#000000";
  public textAlign: CanvasTextAlign = "start";
  public textBaseline: CanvasTextBaseline = "alphabetic";
  private transform: Transform = { scaleX: 1, scaleY: 1 };
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
    this.transform = { scaleX: a, scaleY: d };
  }

  translate(x: number, y: number) {
    this.calls.push(`translate(${x},${y})`);
  }

  scale(x: number, y: number) {
    this.calls.push(`scale(${x},${y})`);
    this.transform.scaleX *= x;
    this.transform.scaleY *= y;
  }

  clearRect(x: number, y: number, width: number, height: number) {
    this.calls.push(`clearRect(${x},${y},${width},${height})`);
  }

  fillRect(x: number, y: number, width: number, height: number) {
    this.calls.push(
      `fillRect(${x},${y},${width},${height})@${this.transform.scaleX},${this.transform.scaleY}`,
    );
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
      "clearRect(0,0,640,360)",
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
      "clearRect(5,6,100,50)",
      "restore",
    ]);
  });
});
