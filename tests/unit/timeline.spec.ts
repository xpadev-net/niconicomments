import { beforeEach, describe, expect, test, vi } from "vitest";

import type { FormattedComment, IComment, IRenderer, Timeline } from "@/@types";
import { defaultConfig } from "@/definition/config";
import { initConfig } from "@/definition/initConfig";
import NiconiComments from "@/main";
import { processFixedComment } from "@/utils/comment";

const emptyTextMetrics = (width: number): TextMetrics =>
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
  public destroyCalls = 0;
  private font = "";
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
  measureText() {
    return emptyTextMetrics(120);
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
  drawImage() {}
  flush() {}
  invalidateImage() {}
}

const ensureCanvasElement = () => {
  if (!("HTMLCanvasElement" in globalThis)) {
    Object.defineProperty(globalThis, "HTMLCanvasElement", {
      configurable: true,
      value: class HTMLCanvasElement {},
    });
  }
};

const formattedComment = (
  id: number,
  vpos: number,
  owner = false,
): FormattedComment => ({
  id,
  vpos,
  content: `comment ${id}`,
  date: id,
  date_usec: 0,
  owner,
  premium: false,
  mail: ["ue"],
  user_id: id,
  layer: -1,
  is_my_post: false,
});

const timelineIndexes = (timeline: Timeline, vpos: number) =>
  timeline[vpos]?.map((comment) => comment.index) ?? [];

const createFixedComment = (index: number, vpos: number, long: number) =>
  ({
    comment: {},
    invisible: false,
    index,
    loc: "ue",
    width: 120,
    long,
    height: 24,
    vpos,
    flash: false,
    posY: -1,
    owner: false,
    layer: -1,
    mail: ["ue"],
    content: `comment ${index}`,
    draw() {},
    isHovered: () => false,
  }) as IComment;

describe("timeline construction", () => {
  beforeEach(() => {
    initConfig();
  });

  test("reprocessing a fixed comment computes posY without duplicating timeline or collision buckets", () => {
    const timeline: Timeline = {};
    const collision: Timeline = {};
    const touchedOnFirstPass = new Set<number>();
    const touchedOnSecondPass = new Set<number>();
    const comment = createFixedComment(1, 100, 30);

    processFixedComment(
      comment,
      collision,
      timeline,
      true,
      defaultConfig,
      touchedOnFirstPass,
    );
    processFixedComment(
      comment,
      collision,
      timeline,
      false,
      defaultConfig,
      touchedOnSecondPass,
    );

    expect(comment.posY).toBe(0);
    expect(touchedOnFirstPass.size).toBe(30);
    expect(touchedOnSecondPass.size).toBe(0);
    expect(timeline[100]).toHaveLength(1);
    expect(timeline[129]).toHaveLength(1);
    expect(collision[100]).toHaveLength(1);
    expect(collision[110]).toHaveLength(1);
  });

  test("dense fixed comments do not use per-bucket includes scans", () => {
    const timeline: Timeline = {};
    const collision: Timeline = {};
    const originalIncludes = Array.prototype.includes;
    let includesCalls = 0;
    Array.prototype.includes = function includes(...args) {
      includesCalls++;
      return originalIncludes.apply(this, args);
    };

    try {
      for (let i = 0; i < 500; i++) {
        processFixedComment(
          createFixedComment(i, 200, 1),
          collision,
          timeline,
          true,
          defaultConfig,
        );
      }
    } finally {
      Array.prototype.includes = originalIncludes;
    }

    expect(includesCalls).toBe(0);
    expect(timeline[200]).toHaveLength(500);
  });
});

describe("destroy", () => {
  test("propagates lifecycle cleanup to the renderer", () => {
    ensureCanvasElement();
    const renderer = new FakeRenderer();
    const niconiComments = new NiconiComments(renderer, [], {
      format: "formatted",
    });

    niconiComments.destroy();

    expect(renderer.destroyCalls).toBe(1);
  });
});

describe("addComments", () => {
  test("sorts overlapping touched buckets without resorting unrelated timeline buckets", () => {
    ensureCanvasElement();
    const renderer = new FakeRenderer();
    const niconiComments = new NiconiComments(
      renderer,
      [
        formattedComment(1, 100, false),
        formattedComment(2, 100, true),
        formattedComment(3, 900, false),
        formattedComment(4, 900, true),
      ],
      { format: "formatted" },
    );
    const timeline = (
      niconiComments as unknown as {
        timeline: Timeline;
      }
    ).timeline;
    const unrelatedSort = vi.spyOn(timeline[900] ?? [], "sort");

    niconiComments.addComments(
      formattedComment(5, 100, true),
      formattedComment(6, 100, false),
    );

    expect(timelineIndexes(timeline, 100)).toEqual([0, 5, 1, 4]);
    expect(unrelatedSort).not.toHaveBeenCalled();
  });
});
