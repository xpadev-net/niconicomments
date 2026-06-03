import { beforeAll, beforeEach, describe, expect, test } from "vitest";

import type { FormattedComment, IComment, IRenderer } from "@/@types/";
import type { CommentInstanceContext } from "@/contexts";
import { createNicoScripts, ImageCacheContext } from "@/contexts";
import { defaultConfig, defaultOptions } from "@/definition/config";
import { initConfig } from "@/definition/initConfig";
import NiconiComments from "@/main";
import {
  DEFAULT_COMMENT_LONG,
  DEFAULT_NICOSCRIPT_LONG,
  MAX_COMMENT_LONG,
  MAX_LAZY_COMMENT_LOOKAHEAD,
  MAX_NICOSCRIPT_LONG,
  parseCommandAndNicoScript,
} from "@/utils/comment";
import { RangeCacheContext } from "@/utils/rangeCache";

class HTMLCanvasElementMock {}

const HUGE_DURATION = "@9999";
const OVERFLOW_DURATION = `@${"9".repeat(400)}`;

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
  private font = "";
  private size = { width: 1920, height: 1080 };

  destroy() {}
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
  measureText(_text: string) {
    return emptyTextMetrics(300);
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

class ReverseCommentsPlugin {
  static readonly id = "reverse-comments-plugin";

  constructor(_canvas: IRenderer, _comments: IComment[]) {}

  draw() {
    return false;
  }

  transformComments(comments: IComment[]) {
    return [...comments].reverse();
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

const createContext = (): CommentInstanceContext => {
  initConfig();
  return {
    config: { ...defaultConfig },
    options: { ...defaultOptions, mode: "html5" },
    nicoScripts: createNicoScripts(),
    imageCache: new ImageCacheContext(),
    rangeCache: new RangeCacheContext(),
  };
};

describe("duration bounds and lazy timeline expansion", () => {
  beforeAll(() => {
    if (typeof HTMLCanvasElement === "undefined") {
      Object.defineProperty(globalThis, "HTMLCanvasElement", {
        value: HTMLCanvasElementMock,
        configurable: true,
      });
    }
    if (typeof window === "undefined") {
      Object.defineProperty(globalThis, "window", {
        value: globalThis,
        configurable: true,
      });
    }
  });

  beforeEach(() => {
    initConfig();
  });

  test("caps huge fixed comment durations without creating enormous timeline keys", () => {
    const startVpos = 100;
    const instance = new NiconiComments(
      new FakeRenderer(),
      [createComment({ vpos: startVpos, mail: ["ue", HUGE_DURATION] })],
      { format: "formatted", mode: "html5" },
    );
    const state = instance as unknown as {
      comments: { long: number }[];
      timeline: Record<number, unknown[]>;
    };
    const keys = Object.keys(state.timeline)
      .map(Number)
      .sort((a, b) => a - b);

    expect(state.comments[0]?.long).toBe(MAX_COMMENT_LONG);
    expect(keys).toHaveLength(MAX_COMMENT_LONG);
    expect(keys[0]).toBe(startVpos);
    expect(keys.at(-1)).toBe(startVpos + MAX_COMMENT_LONG - 1);
  });

  test("caps huge moving durations and neutralizes overflow-like values", () => {
    const defaultMoving = parseCommandAndNicoScript(
      createComment(),
      createContext(),
    );
    const moving = parseCommandAndNicoScript(
      createComment({ mail: [HUGE_DURATION] }),
      createContext(),
    );
    expect(moving.long).toBe(MAX_COMMENT_LONG);

    const infinityLike = parseCommandAndNicoScript(
      createComment({ mail: [OVERFLOW_DURATION] }),
      createContext(),
    );
    expect(infinityLike.long).toBe(defaultMoving.long);
    expect(infinityLike.long).toBeLessThanOrEqual(MAX_COMMENT_LONG);
  });

  test("bounds NicoScript ban/reverse ranges and falls back to defaults for invalid durations", () => {
    const preservedNicoscriptDuration = "@300";
    const preservedBanContext = createContext();
    parseCommandAndNicoScript(
      createComment({
        owner: true,
        content: "@コメント禁止",
        mail: [preservedNicoscriptDuration],
      }),
      preservedBanContext,
    );
    expect(
      preservedBanContext.nicoScripts.ban[0]?.end -
        preservedBanContext.nicoScripts.ban[0]?.start,
    ).toBe(300 * 100);

    const banContext = createContext();
    parseCommandAndNicoScript(
      createComment({
        owner: true,
        content: "@コメント禁止",
        mail: [HUGE_DURATION],
      }),
      banContext,
    );
    expect(
      banContext.nicoScripts.ban[0]?.end - banContext.nicoScripts.ban[0]?.start,
    ).toBe(MAX_NICOSCRIPT_LONG);

    const reverseContext = createContext();
    parseCommandAndNicoScript(
      createComment({
        owner: true,
        content: "@逆 全",
        mail: [HUGE_DURATION],
      }),
      reverseContext,
    );
    expect(
      reverseContext.nicoScripts.reverse[0]?.end -
        reverseContext.nicoScripts.reverse[0]?.start,
    ).toBe(MAX_NICOSCRIPT_LONG);

    const zeroBanContext = createContext();
    parseCommandAndNicoScript(
      createComment({
        owner: true,
        content: "@コメント禁止",
        mail: ["@0"],
      }),
      zeroBanContext,
    );
    expect(
      zeroBanContext.nicoScripts.ban[0]?.end -
        zeroBanContext.nicoScripts.ban[0]?.start,
    ).toBe(DEFAULT_NICOSCRIPT_LONG);

    const overflowBanContext = createContext();
    parseCommandAndNicoScript(
      createComment({
        owner: true,
        content: "@コメント禁止",
        mail: [OVERFLOW_DURATION],
      }),
      overflowBanContext,
    );
    expect(
      overflowBanContext.nicoScripts.ban[0]?.end -
        overflowBanContext.nicoScripts.ban[0]?.start,
    ).toBe(DEFAULT_NICOSCRIPT_LONG);

    const zeroReverseContext = createContext();
    parseCommandAndNicoScript(
      createComment({
        owner: true,
        content: "@逆 全",
        mail: ["@0"],
      }),
      zeroReverseContext,
    );
    expect(
      zeroReverseContext.nicoScripts.reverse[0]?.end -
        zeroReverseContext.nicoScripts.reverse[0]?.start,
    ).toBe(DEFAULT_NICOSCRIPT_LONG);

    const overflowReverseContext = createContext();
    parseCommandAndNicoScript(
      createComment({
        owner: true,
        content: "@逆 全",
        mail: [OVERFLOW_DURATION],
      }),
      overflowReverseContext,
    );
    expect(
      overflowReverseContext.nicoScripts.reverse[0]?.end -
        overflowReverseContext.nicoScripts.reverse[0]?.start,
    ).toBe(DEFAULT_NICOSCRIPT_LONG);
  });

  test("lazy constructor defers timeline expansion until the visible window", () => {
    const farVpos = MAX_LAZY_COMMENT_LOOKAHEAD + MAX_COMMENT_LONG + 500;
    const instance = new NiconiComments(
      new FakeRenderer(),
      [
        createComment({ id: 1, vpos: 0, mail: ["ue"] }),
        createComment({
          id: 2,
          vpos: MAX_LAZY_COMMENT_LOOKAHEAD,
          mail: ["ue"],
        }),
        createComment({ id: 3, vpos: farVpos, mail: ["ue"] }),
      ],
      { format: "formatted", lazy: true, mode: "html5" },
    );
    const state = instance as unknown as {
      comments: { posY: number }[];
      processedCommentIndex: number;
      timeline: Record<number, unknown[]>;
    };

    expect(Object.keys(state.timeline)).toHaveLength(0);
    expect(state.processedCommentIndex).toBe(-1);

    instance.drawCanvas(0, true);
    const keys = Object.keys(state.timeline)
      .map(Number)
      .sort((a, b) => a - b);

    expect(state.processedCommentIndex).toBe(1);
    expect(state.comments[0]?.posY).not.toBe(-1);
    expect(state.comments[1]?.posY).not.toBe(-1);
    expect(state.comments[2]?.posY).toBe(-1);
    expect(keys).not.toContain(farVpos);
    expect(keys.at(-1)).toBeLessThan(farVpos);
  });

  test("lazy constructor falls back to eager resolution for plugin-reordered input", () => {
    const instance = new NiconiComments(
      new FakeRenderer(),
      [
        createComment({ id: 1, vpos: 0, mail: ["ue"] }),
        createComment({ id: 2, vpos: 100000, mail: ["ue"] }),
      ],
      {
        format: "formatted",
        lazy: true,
        mode: "html5",
        config: { plugins: [ReverseCommentsPlugin] },
      },
    );
    const state = instance as unknown as {
      comments: { posY: number }[];
      processedCommentIndex: number;
      timeline: Record<number, unknown[]>;
    };

    expect(state.processedCommentIndex).toBe(state.comments.length - 1);
    expect(state.comments[0]?.posY).not.toBe(-1);
    expect(state.comments[1]?.posY).not.toBe(-1);
    expect(state.timeline[0]).toBeDefined();
  });

  test("addComments keeps hostile durations bounded on the production path", () => {
    const instance = new NiconiComments(new FakeRenderer(), [], {
      format: "formatted",
      lazy: true,
      mode: "html5",
    });
    const state = instance as unknown as {
      comments: { long: number }[];
      timeline: Record<number, unknown[]>;
    };

    expect(() =>
      instance.addComments(
        createComment({ id: 1, vpos: 100, mail: ["ue", HUGE_DURATION] }),
        createComment({ id: 2, vpos: 500, mail: [HUGE_DURATION] }),
        createComment({ id: 3, vpos: 1000, mail: [OVERFLOW_DURATION] }),
      ),
    ).not.toThrow();

    expect(state.comments[0]?.long).toBe(MAX_COMMENT_LONG);
    expect(state.comments[1]?.long).toBe(MAX_COMMENT_LONG);
    expect(state.comments[2]?.long).toBe(DEFAULT_COMMENT_LONG);
    expect(Object.keys(state.timeline).length).toBeLessThan(
      MAX_COMMENT_LONG * 3,
    );
  });
});
