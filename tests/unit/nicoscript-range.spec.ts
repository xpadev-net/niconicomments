import { beforeEach, describe, expect, test, vi } from "vitest";

import type { FormattedComment } from "@/@types";
import type { CommentInstanceContext } from "@/contexts";
import { createNicoScripts, ImageCacheContext } from "@/contexts";
import { defaultConfig, defaultOptions } from "@/definition/config";
import { initConfig } from "@/definition/initConfig";
import { EventHandler } from "@/eventHandler";
import {
  isBanActive,
  isReverseActive,
  parseCommandAndNicoScript,
} from "@/utils/comment";
import { RangeCacheContext } from "@/utils/rangeCache";

const START_VPOS = 100;
const LONG_COMMAND = "@2";
const LAST_ACTIVE_VPOS = 299;
const END_VPOS = 300;

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

const parseScript = (
  ctx: CommentInstanceContext,
  content: string,
  mail = [LONG_COMMAND],
  vpos = START_VPOS,
) => {
  parseCommandAndNicoScript(
    createComment({
      id: 1,
      vpos,
      content,
      owner: true,
      mail,
    }),
    ctx,
  );
};

const parseViewerContent = (
  ctx: CommentInstanceContext,
  vpos: number,
  content: string,
) => {
  const comment = createComment({
    id: vpos,
    vpos,
    content,
    owner: false,
  });
  parseCommandAndNicoScript(comment, ctx);
  return comment.content;
};

describe("NicoScript range boundaries", () => {
  beforeEach(() => {
    initConfig();
  });

  test("@デフォルト is active on [start, end)", () => {
    const ctx = createContext();
    parseScript(ctx, "@デフォルト", ["red", LONG_COMMAND]);

    expect(
      parseCommandAndNicoScript(
        createComment({ vpos: START_VPOS - 1, content: "before" }),
        ctx,
      ).color,
    ).toBe("#FFFFFF");
    expect(
      parseCommandAndNicoScript(
        createComment({ vpos: START_VPOS, content: "start" }),
        ctx,
      ).color,
    ).toBe("#FF0000");
    expect(
      parseCommandAndNicoScript(
        createComment({ vpos: LAST_ACTIVE_VPOS, content: "last" }),
        ctx,
      ).color,
    ).toBe("#FF0000");
    expect(
      parseCommandAndNicoScript(
        createComment({ vpos: END_VPOS, content: "end" }),
        ctx,
      ).color,
    ).toBe("#FFFFFF");
  });

  test("@置換 is active on [start, end)", () => {
    const ctx = createContext();
    parseScript(ctx, '@置換 "needle" "hit" 全 全');

    expect(parseViewerContent(ctx, START_VPOS - 1, "needle before")).toBe(
      "needle before",
    );
    expect(parseViewerContent(ctx, START_VPOS, "needle start")).toBe("hit");
    expect(parseViewerContent(ctx, LAST_ACTIVE_VPOS, "needle last")).toBe(
      "hit",
    );
    expect(parseViewerContent(ctx, END_VPOS, "needle end")).toBe("needle end");
  });

  test("@逆 is active on [start, end)", () => {
    const ctx = createContext();
    parseScript(ctx, "@逆 全");

    expect(
      isReverseActive(START_VPOS - 1, false, ctx.nicoScripts, ctx.rangeCache),
    ).toBe(false);
    expect(
      isReverseActive(START_VPOS, false, ctx.nicoScripts, ctx.rangeCache),
    ).toBe(true);
    expect(
      isReverseActive(LAST_ACTIVE_VPOS, false, ctx.nicoScripts, ctx.rangeCache),
    ).toBe(true);
    expect(
      isReverseActive(END_VPOS, false, ctx.nicoScripts, ctx.rangeCache),
    ).toBe(false);
  });

  test("@コメント禁止 is active on [start, end)", () => {
    const ctx = createContext();
    parseScript(ctx, "@コメント禁止");

    expect(isBanActive(START_VPOS - 1, ctx.nicoScripts, ctx.rangeCache)).toBe(
      false,
    );
    expect(isBanActive(START_VPOS, ctx.nicoScripts, ctx.rangeCache)).toBe(true);
    expect(isBanActive(LAST_ACTIVE_VPOS, ctx.nicoScripts, ctx.rangeCache)).toBe(
      true,
    );
    expect(isBanActive(END_VPOS, ctx.nicoScripts, ctx.rangeCache)).toBe(false);
  });

  test("@コメント禁止 and @シーク禁止 events enter at start and exit at end", () => {
    const ctx = createContext();
    parseScript(ctx, "@コメント禁止");
    parseScript(ctx, "@シーク禁止");
    const eventHandler = new EventHandler();
    const commentDisable = vi.fn();
    const commentEnable = vi.fn();
    const seekDisable = vi.fn();
    const seekEnable = vi.fn();
    eventHandler.register("commentDisable", commentDisable);
    eventHandler.register("commentEnable", commentEnable);
    eventHandler.register("seekDisable", seekDisable);
    eventHandler.register("seekEnable", seekEnable);

    eventHandler.trigger(START_VPOS - 1, START_VPOS - 2, ctx.nicoScripts);

    expect(commentDisable).not.toHaveBeenCalled();
    expect(seekDisable).not.toHaveBeenCalled();

    eventHandler.trigger(START_VPOS, START_VPOS - 1, ctx.nicoScripts);

    expect(commentDisable).toHaveBeenCalledTimes(1);
    expect(seekDisable).toHaveBeenCalledTimes(1);
    expect(commentEnable).not.toHaveBeenCalled();
    expect(seekEnable).not.toHaveBeenCalled();

    eventHandler.trigger(LAST_ACTIVE_VPOS, START_VPOS, ctx.nicoScripts);

    expect(commentDisable).toHaveBeenCalledTimes(1);
    expect(seekDisable).toHaveBeenCalledTimes(1);
    expect(commentEnable).not.toHaveBeenCalled();
    expect(seekEnable).not.toHaveBeenCalled();

    eventHandler.trigger(END_VPOS, LAST_ACTIVE_VPOS, ctx.nicoScripts);

    expect(commentEnable).toHaveBeenCalledTimes(1);
    expect(seekEnable).toHaveBeenCalledTimes(1);
  });

  test("@ジャンプ fires when entering [start, end) but not at exact end", () => {
    const ctx = createContext();
    parseScript(ctx, "@ジャンプ sm9 jump message");

    for (const [vpos, expectedCalls] of [
      [START_VPOS, 1],
      [LAST_ACTIVE_VPOS, 1],
      [END_VPOS, 0],
    ] as const) {
      const eventHandler = new EventHandler();
      const jump = vi.fn();
      eventHandler.register("jump", jump);

      eventHandler.trigger(vpos, START_VPOS - 1, ctx.nicoScripts);

      expect(jump).toHaveBeenCalledTimes(expectedCalls);
      if (expectedCalls > 0) {
        expect(jump).toHaveBeenCalledWith(
          expect.objectContaining({ to: "sm9", message: "jump message" }),
        );
      }
    }
  });

  test("zero-length optional ranges are inactive at their start vpos", () => {
    const defaultCtx = createContext();
    parseScript(defaultCtx, "@デフォルト", ["red", "@0"]);

    expect(
      parseCommandAndNicoScript(
        createComment({ vpos: START_VPOS, content: "default zero" }),
        defaultCtx,
      ).color,
    ).toBe("#FFFFFF");

    const replaceCtx = createContext();
    parseScript(replaceCtx, '@置換 "needle" "hit" 全 全', ["@0"]);

    expect(parseViewerContent(replaceCtx, START_VPOS, "needle zero")).toBe(
      "needle zero",
    );

    const jumpCtx = createContext();
    parseScript(jumpCtx, "@ジャンプ sm9 zero", ["@0"]);
    const eventHandler = new EventHandler();
    const jump = vi.fn();
    eventHandler.register("jump", jump);

    eventHandler.trigger(START_VPOS, START_VPOS - 1, jumpCtx.nicoScripts);

    expect(jump).not.toHaveBeenCalled();
  });

  test("@逆 respects viewer and owner targets inside [start, end)", () => {
    const viewerCtx = createContext();
    parseScript(viewerCtx, "@逆 コメ");

    expect(
      isReverseActive(
        START_VPOS,
        false,
        viewerCtx.nicoScripts,
        viewerCtx.rangeCache,
      ),
    ).toBe(true);
    expect(
      isReverseActive(
        START_VPOS,
        true,
        viewerCtx.nicoScripts,
        viewerCtx.rangeCache,
      ),
    ).toBe(false);
    expect(
      isReverseActive(
        END_VPOS,
        false,
        viewerCtx.nicoScripts,
        viewerCtx.rangeCache,
      ),
    ).toBe(false);

    const ownerCtx = createContext();
    parseScript(ownerCtx, "@逆 投コメ");

    expect(
      isReverseActive(
        START_VPOS,
        false,
        ownerCtx.nicoScripts,
        ownerCtx.rangeCache,
      ),
    ).toBe(false);
    expect(
      isReverseActive(
        START_VPOS,
        true,
        ownerCtx.nicoScripts,
        ownerCtx.rangeCache,
      ),
    ).toBe(true);
    expect(
      isReverseActive(
        END_VPOS,
        true,
        ownerCtx.nicoScripts,
        ownerCtx.rangeCache,
      ),
    ).toBe(false);
  });

  test("@コメント禁止 and @シーク禁止 events stay active across overlap and adjacency", () => {
    const cases = [
      ["overlap", 200, 400],
      ["adjacent", END_VPOS, 500],
    ] as const;

    for (const [_label, secondStart, finalEnd] of cases) {
      const ctx = createContext();
      parseScript(ctx, "@コメント禁止");
      parseScript(ctx, "@シーク禁止");
      parseScript(ctx, "@コメント禁止", [LONG_COMMAND], secondStart);
      parseScript(ctx, "@シーク禁止", [LONG_COMMAND], secondStart);
      const eventHandler = new EventHandler();
      const commentDisable = vi.fn();
      const commentEnable = vi.fn();
      const seekDisable = vi.fn();
      const seekEnable = vi.fn();
      eventHandler.register("commentDisable", commentDisable);
      eventHandler.register("commentEnable", commentEnable);
      eventHandler.register("seekDisable", seekDisable);
      eventHandler.register("seekEnable", seekEnable);

      eventHandler.trigger(START_VPOS, START_VPOS - 1, ctx.nicoScripts);
      eventHandler.trigger(secondStart, secondStart - 1, ctx.nicoScripts);
      eventHandler.trigger(END_VPOS, END_VPOS - 1, ctx.nicoScripts);

      expect(commentDisable).toHaveBeenCalledTimes(1);
      expect(seekDisable).toHaveBeenCalledTimes(1);
      expect(commentEnable).not.toHaveBeenCalled();
      expect(seekEnable).not.toHaveBeenCalled();

      eventHandler.trigger(finalEnd, finalEnd - 1, ctx.nicoScripts);

      expect(commentEnable).toHaveBeenCalledTimes(1);
      expect(seekEnable).toHaveBeenCalledTimes(1);
    }
  });
});

describe("@置換 target semantics", () => {
  beforeEach(() => {
    initConfig();
  });

  const applyReplace = (
    target: "コメ" | "投コメ" | "全" | "含む" | "含まない",
    owner: boolean,
    content: string,
  ) => {
    const ctx = createContext();
    parseScript(ctx, `@置換 "needle" "hit" 全 ${target}`);
    const comment = createComment({
      id: owner ? 3 : 2,
      vpos: START_VPOS,
      content,
      owner,
    });

    parseCommandAndNicoScript(comment, ctx);

    return comment.content;
  };

  test.each([
    ["コメ", false, "needle viewer", "hit"],
    ["コメ", true, "needle owner", "needle owner"],
    ["投コメ", false, "needle viewer", "needle viewer"],
    ["投コメ", true, "needle owner", "hit"],
    ["全", false, "needle viewer", "hit"],
    ["全", true, "needle owner", "hit"],
    ["含む", false, "needle viewer", "hit"],
    ["含む", true, "needle owner", "hit"],
    ["含む", false, "plain viewer", "plain viewer"],
    ["含む", true, "plain owner", "plain owner"],
    ["含まない", false, "needle viewer", "needle viewer"],
    ["含まない", true, "needle owner", "needle owner"],
    ["含まない", false, "plain viewer", "hit"],
    ["含まない", true, "plain owner", "hit"],
  ] as const)("%s target maps owner=%s content %j to %j", (target, owner, content, expected) => {
    expect(applyReplace(target, owner, content)).toBe(expected);
  });

  test.each([
    ["含む", "needle", "hit"],
    ["含む", "needle plus", "needle plus"],
    ["含まない", "needle", "needle"],
    ["含まない", "needle plus", "hit"],
  ] as const)("%s target honors 完全一致 for %j", (target, content, expected) => {
    const ctx = createContext();
    parseScript(ctx, `@置換 "needle" "hit" 全 ${target} 完全一致`);
    const comment = createComment({
      id: 4,
      vpos: START_VPOS,
      content,
      owner: false,
    });

    parseCommandAndNicoScript(comment, ctx);

    expect(comment.content).toBe(expected);
  });
});
