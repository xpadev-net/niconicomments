import { beforeEach, describe, expect, test } from "vitest";

import type { FormattedComment } from "@/@types";
import type { CommentInstanceContext } from "@/contexts";
import { createNicoScripts, ImageCacheContext } from "@/contexts";
import { defaultConfig, defaultOptions } from "@/definition/config";
import { initConfig } from "@/definition/initConfig";
import { isFlashComment, parseCommandAndNicoScript } from "@/utils/comment";
import { RangeCacheContext } from "@/utils/rangeCache";

const createContext = (
  enableCustomCommands = false,
): CommentInstanceContext => {
  initConfig();
  return {
    config: { ...defaultConfig },
    options: { ...defaultOptions, enableCustomCommands, mode: "default" },
    nicoScripts: createNicoScripts(),
    imageCache: new ImageCacheContext(),
    rangeCache: new RangeCacheContext(),
  };
};

const createComment = (mail: string[]): FormattedComment => ({
  id: 1,
  vpos: 0,
  content: "test",
  date: Number.MAX_SAFE_INTEGER,
  date_usec: 0,
  owner: false,
  premium: false,
  mail,
  user_id: 1,
  layer: -1,
  ignoreScale: false,
  is_my_post: false,
});

describe("custom nico commands", () => {
  beforeEach(() => {
    initConfig();
  });

  test("are ignored by default while standard mail commands still work", () => {
    const ctx = createContext();
    const comment = createComment(["nico:stroke:#f00", "nico:scale:2", "red"]);

    const result = parseCommandAndNicoScript(comment, ctx);

    expect(result.strokeColor).toBeUndefined();
    expect(result.commandScale).toBeUndefined();
    expect(result.color).toBe("#FF0000");
  });

  test("are applied when explicitly enabled", () => {
    const ctx = createContext(true);
    const result = parseCommandAndNicoScript(
      createComment(["nico:stroke:#f00", "nico:scale:2"]),
      ctx,
    );

    expect(result.strokeColor).toBe("#f00");
    expect(result.commandScale).toBe(2);
  });

  test("nico:flash only affects Flash selection when explicitly enabled", () => {
    const comment = createComment(["nico:flash"]);

    expect(
      isFlashComment(comment, defaultConfig, createContext().options),
    ).toBe(false);
    expect(
      isFlashComment(comment, defaultConfig, createContext(true).options),
    ).toBe(true);
  });
});
