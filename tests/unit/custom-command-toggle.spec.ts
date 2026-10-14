import { beforeEach, describe, expect, test } from "vitest";

import type { FormattedComment, IRenderer } from "@/@types";
import type { CommentInstanceContext } from "@/contexts";
import { createNicoScripts, ImageCacheContext } from "@/contexts";
import { defaultConfig, defaultOptions } from "@/definition/config";
import { initConfig } from "@/definition/initConfig";
import NiconiComments from "@/main";
import { isFlashComment, parseCommandAndNicoScript } from "@/utils/comment";
import { RangeCacheContext } from "@/utils/rangeCache";

const createContext = (
  options: Partial<
    Pick<CommentInstanceContext["options"], "enableCustomCommands">
  > = {},
): CommentInstanceContext => {
  initConfig();
  return {
    config: { ...defaultConfig },
    options: { ...defaultOptions, ...options, mode: "default" },
    nicoScripts: createNicoScripts(),
    imageCache: new ImageCacheContext(),
    rangeCache: new RangeCacheContext(),
  };
};

const createInstance = (options: { enableCustomCommands?: boolean } = {}) =>
  new NiconiComments(
    {
      rendererName: "TestRenderer",
      getSize: () => ({ width: 1920, height: 1080 }),
      setLineWidth: () => {},
      setScale: () => {},
    } as IRenderer,
    [],
    { format: "formatted", mode: "html5", ...options },
  );

const getInstanceContext = (instance: NiconiComments) =>
  (instance as unknown as { ctx: CommentInstanceContext }).ctx;

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
    if (!("HTMLCanvasElement" in globalThis)) {
      Object.defineProperty(globalThis, "HTMLCanvasElement", {
        configurable: true,
        value: class HTMLCanvasElement {},
      });
    }
  });

  test("are ignored by default while standard mail commands still work", () => {
    const ctx = createContext();
    const comment = createComment(["nico:stroke:#f00", "nico:scale:2", "red"]);

    const result = parseCommandAndNicoScript(comment, ctx);

    expect(result.strokeColor).toBeUndefined();
    expect(result.commandScale).toBeUndefined();
    expect(result.color).toBe("#FF0000");
  });

  test("uses the default on real instances and keeps the option instance-local", () => {
    const defaultInstance = createInstance();
    const enabledInstance = createInstance({ enableCustomCommands: true });
    const defaultContext = getInstanceContext(defaultInstance);
    const enabledContext = getInstanceContext(enabledInstance);

    expect(defaultContext.options.enableCustomCommands).toBe(false);
    expect(enabledContext.options.enableCustomCommands).toBe(true);
    expect(defaultContext.options.enableCustomCommands).toBe(false);
    expect(
      parseCommandAndNicoScript(
        createComment(["nico:stroke:#f00"]),
        defaultContext,
      ).strokeColor,
    ).toBeUndefined();
    expect(
      parseCommandAndNicoScript(
        createComment(["nico:stroke:#f00"]),
        enabledContext,
      ).strokeColor,
    ).toBe("#f00");

    defaultInstance.destroy();
    enabledInstance.destroy();
  });

  test("are applied when explicitly enabled", () => {
    const ctx = createContext({ enableCustomCommands: true });
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
      isFlashComment(
        comment,
        defaultConfig,
        createContext({ enableCustomCommands: true }).options,
      ),
    ).toBe(true);
  });
});
