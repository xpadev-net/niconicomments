import { beforeEach, describe, expect, test, vi } from "vitest";

import type {
  FormattedComment,
  FormattedCommentWithSize,
  IRenderer,
} from "@/@types";
import { FlashComment } from "@/comments";
import { createNicoScripts, ImageCacheContext } from "@/contexts";
import { defaultConfig, defaultOptions } from "@/definition/config";
import { initConfig } from "@/definition/initConfig";
import {
  buildAtButtonComment,
  MAX_AT_BUTTON_LIMIT,
  MAX_AT_BUTTON_MAIL_ENTRIES,
  MAX_AT_BUTTON_TEXT_CHARS,
  MAX_FLASH_COMMENT_LINES,
  MAX_FLASH_CONTENT_ITEMS,
  MAX_NICOSCRIPT_COMMAND_CHARS,
  MAX_NICOSCRIPT_TEXT_CHARS,
  MAX_PARSED_COMMAND_MAIL_ENTRIES,
  parseCommandAndNicoScript,
  RangeCacheContext,
} from "@/utils";

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
  public measureCalls = 0;
  public fillTextCalls = 0;
  public setSizeCalls = 0;
  public strokeTextCalls = 0;
  private font = "10px sans-serif";
  private size = { width: 0, height: 0 };

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
    this.measureCalls++;
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

class TestFlashComment extends FlashComment {
  exposeTextImage() {
    return this.getTextImage();
  }
}

const formattedComment = (
  content: string,
  mail: string[] = [],
): FormattedComment => ({
  id: 1,
  vpos: 0,
  content,
  date: 1_400_000_000,
  date_usec: 0,
  owner: false,
  premium: false,
  mail,
  user_id: 1,
  layer: -1,
  is_my_post: false,
});

const sizedComment = (
  comment: FormattedComment,
  data: ReturnType<typeof parseCommandAndNicoScript>,
): FormattedCommentWithSize =>
  ({
    ...comment,
    ...data,
    rawContent: comment.content,
    content: [],
    lineCount: 1,
    lineOffset: 0,
    height: 0,
    width: 0,
    lineHeight: 1,
    resized: false,
    resizedX: false,
    resizedY: false,
    charSize: 0,
    scale: 1,
    scaleX: 1,
  }) as FormattedCommentWithSize;

const createContext = () => ({
  config: defaultConfig,
  options: { ...defaultOptions, mode: "flash" as const },
  nicoScripts: createNicoScripts(),
  imageCache: new ImageCacheContext(),
  rangeCache: new RangeCacheContext(),
});

describe("Flash and at-button resource bounds", () => {
  beforeEach(() => {
    initConfig();
    let timeoutId = 0;
    vi.stubGlobal("window", {
      setTimeout: vi.fn(() => ++timeoutId),
    });
    vi.stubGlobal("clearTimeout", vi.fn());
  });

  test("caps newline-heavy Flash comments before measurement and drawing", () => {
    const renderer = new RecordingRenderer();
    const comment = new TestFlashComment(
      formattedComment("\n".repeat(10_000)),
      renderer,
      0,
      createContext(),
    );

    expect(comment.comment.lineCount).toBe(MAX_FLASH_COMMENT_LINES);
    expect(renderer.measureCalls).toBeLessThanOrEqual(
      MAX_FLASH_COMMENT_LINES * 2,
    );

    const image = comment.exposeTextImage() as RecordingRenderer | null;

    expect(image?.fillTextCalls ?? 0).toBeLessThanOrEqual(
      MAX_FLASH_COMMENT_LINES * 2,
    );
    expect(image?.strokeTextCalls ?? 0).toBeLessThanOrEqual(
      MAX_FLASH_COMMENT_LINES * 2,
    );
  });

  test("keeps the last allowed Flash line content when clamping", () => {
    const renderer = new RecordingRenderer();
    const comment = new TestFlashComment(
      formattedComment(
        `${"\n".repeat(MAX_FLASH_COMMENT_LINES - 1)}last-line-kept`,
      ),
      renderer,
      0,
      createContext(),
    );

    expect(comment.comment.lineCount).toBe(MAX_FLASH_COMMENT_LINES);
    expect(
      comment.comment.content.some(
        (item) => item.type === "text" && item.content === "last-line-kept",
      ),
    ).toBe(true);
  });

  test("preserves normal Flash multiline rendering", () => {
    const renderer = new RecordingRenderer();
    const comment = new TestFlashComment(
      formattedComment("one\ntwo\nthree"),
      renderer,
      0,
      createContext(),
    );

    const image = comment.exposeTextImage() as RecordingRenderer | null;

    expect(comment.comment.lineCount).toBe(3);
    expect(image).not.toBeNull();
    expect(image?.fillTextCalls).toBeGreaterThan(0);
    expect(image?.fillTextCalls).toBeLessThanOrEqual(8);
    expect(image?.strokeTextCalls).toBeGreaterThan(0);
    expect(image?.strokeTextCalls).toBeLessThanOrEqual(8);
  });

  test("does not allocate Flash text images outside bounded dimensions", () => {
    const renderer = new RecordingRenderer();
    const comment = new TestFlashComment(
      formattedComment("x".repeat(50_000)),
      renderer,
      0,
      createContext(),
    );
    const initialCanvasCount = renderer.children.length;

    expect(comment.exposeTextImage()).toBeNull();
    expect(renderer.children).toHaveLength(initialCanvasCount);
  });

  test("parses long spacer-heavy Flash comments iteratively within item bounds", () => {
    const renderer = new RecordingRenderer();
    const budgetFiller = "x ".repeat(MAX_FLASH_CONTENT_ITEMS / 2);
    const skippedTail = `\n${"tail ".repeat(3000)}`;
    const comment = new TestFlashComment(
      formattedComment(`${budgetFiller}${skippedTail}`),
      renderer,
      0,
      createContext(),
    );

    expect(comment.comment.content).toHaveLength(MAX_FLASH_CONTENT_ITEMS);
    expect(
      comment.comment.content.some(
        (item) => item.type === "text" && item.content.includes("tail"),
      ),
    ).toBe(false);
    expect(renderer.measureCalls).toBeLessThanOrEqual(MAX_FLASH_CONTENT_ITEMS);
  });

  test("does not allocate button canvases for many normal Flash comments", () => {
    const renderer = new RecordingRenderer();
    const comments: TestFlashComment[] = [];

    for (let i = 0; i < 500; i++) {
      comments.push(
        new TestFlashComment(formattedComment(`normal-${i}`), renderer, i, {
          ...createContext(),
          imageCache: new ImageCacheContext(),
        }),
      );
    }

    expect(renderer.children).toHaveLength(0);

    for (const comment of comments) {
      comment.draw(0, false);
    }

    expect(renderer.children).toHaveLength(comments.length);
  });

  test("allocates a visible at-button canvas only on first draw", () => {
    const renderer = new RecordingRenderer();
    const comment = new TestFlashComment(
      formattedComment('@ボタン "[Push]" "posted" "表示" "" "3"'),
      renderer,
      0,
      createContext(),
    );

    expect(renderer.children).toHaveLength(0);

    comment.draw(0, false);

    expect(renderer.children).toHaveLength(2);
    const buttonImage = renderer.children[1];
    expect(buttonImage?.setSizeCalls).toBe(1);

    comment.draw(0, false);

    expect(renderer.children).toHaveLength(2);
    expect(buttonImage?.setSizeCalls).toBe(1);
  });

  test("does not allocate button canvases for hidden at-buttons", () => {
    const renderer = new RecordingRenderer();
    const comment = new TestFlashComment(
      formattedComment('@ボタン "[Hidden]" "posted" "表示" "" "3"', ["hidden"]),
      renderer,
      0,
      createContext(),
    );

    comment.draw(0, false);

    expect(comment.comment.button?.hidden).toBe(true);
    expect(renderer.children).toHaveLength(1);
  });

  test("caps escaped-newline at-button display text from the displayed body", () => {
    const renderer = new RecordingRenderer();
    const comment = new TestFlashComment(
      formattedComment(`@ボタン "[${"x\\n".repeat(300)}]"`),
      renderer,
      0,
      createContext(),
    );

    expect(comment.comment.button?.message.body.length).toBeLessThanOrEqual(
      MAX_AT_BUTTON_TEXT_CHARS,
    );
    expect(comment.comment.lineCount).toBe(MAX_FLASH_COMMENT_LINES);
    expect(renderer.measureCalls).toBeLessThanOrEqual(
      MAX_FLASH_COMMENT_LINES * 4,
    );
  });

  test("caps combined at-button display parts to the Flash line budget", () => {
    const renderer = new RecordingRenderer();
    const comment = new TestFlashComment(
      formattedComment(
        `@ボタン "${"\n".repeat(100)}[${"\n".repeat(100)}]${"\n".repeat(100)}"`,
      ),
      renderer,
      0,
      createContext(),
    );
    const image = comment.exposeTextImage() as RecordingRenderer | null;

    expect(comment.comment.lineCount).toBe(MAX_FLASH_COMMENT_LINES);
    expect(renderer.measureCalls).toBeLessThanOrEqual(
      MAX_FLASH_COMMENT_LINES * 4,
    );
    expect(image?.fillTextCalls ?? 0).toBeLessThanOrEqual(
      MAX_FLASH_COMMENT_LINES * 4,
    );
  });

  test("normalizes hostile at-button payload fields", () => {
    const longBody = "x".repeat(MAX_AT_BUTTON_TEXT_CHARS + 500);
    const longMessage = "posted".repeat(1000);
    const mail = Array.from({ length: 100 }, (_, i) => `mail${i}`).join(",");
    const data = parseCommandAndNicoScript(
      formattedComment(
        `@ボタン "[${longBody}]" "${longMessage}" "表示" "${mail}" "999999"`,
      ),
      createContext(),
    );

    expect(data.button?.message.body).toHaveLength(MAX_AT_BUTTON_TEXT_CHARS);
    expect(data.button?.commentMessage).toHaveLength(MAX_AT_BUTTON_TEXT_CHARS);
    expect(data.button?.commentMail).toHaveLength(MAX_AT_BUTTON_MAIL_ENTRIES);
    expect(data.button?.limit).toBe(MAX_AT_BUTTON_LIMIT);
  });

  test("bounds at-button parsing before the first nicoscript regex capture", () => {
    const data = parseCommandAndNicoScript(
      formattedComment(
        `@ボタン "[${"x".repeat(MAX_NICOSCRIPT_COMMAND_CHARS + 500)}]"`,
      ),
      createContext(),
    );

    expect(data.button?.message.body.length).toBeLessThanOrEqual(
      MAX_AT_BUTTON_TEXT_CHARS,
    );
  });

  test("bounds stored nicoscript replacement text", () => {
    const ctx = createContext();

    parseCommandAndNicoScript(
      {
        ...formattedComment(
          `@置換 "${"k".repeat(MAX_NICOSCRIPT_TEXT_CHARS + 500)}" "${"r".repeat(MAX_NICOSCRIPT_TEXT_CHARS + 500)}" 単`,
        ),
        owner: true,
      },
      ctx,
    );

    expect(ctx.nicoScripts.replace[0]?.keyword).toHaveLength(
      MAX_NICOSCRIPT_TEXT_CHARS,
    );
    expect(ctx.nicoScripts.replace[0]?.replace).toHaveLength(
      MAX_NICOSCRIPT_TEXT_CHARS,
    );
  });

  test("bounds original mail command parsing", () => {
    const ignoredCommands = Array.from(
      { length: MAX_PARSED_COMMAND_MAIL_ENTRIES },
      () => "x".repeat(10_000),
    );
    const data = parseCommandAndNicoScript(
      formattedComment("normal", [...ignoredCommands, "red", "big"]),
      createContext(),
    );

    expect(data.color).toBe("#FFFFFF");
    expect(data.size).toBe("medium");
  });

  test("normalizes invalid at-button limits to no generated comments", () => {
    const data = parseCommandAndNicoScript(
      formattedComment('@ボタン "[Push]" "@ボタン [Loop]" "表示" "" "NaN"'),
      createContext(),
    );

    expect(data.button?.limit).toBe(0);
    expect(
      buildAtButtonComment(sizedComment(formattedComment(""), data), 10),
    ).toBeUndefined();
  });

  test("bounds generated at-button comments and prevents recursive buttons", () => {
    const data = parseCommandAndNicoScript(
      formattedComment(
        '@ボタン "[Push]" "@ボタン [Loop]" "表示" "red,big" "100000"',
      ),
      createContext(),
    );
    const parsed = sizedComment(formattedComment(""), data);
    const generated: FormattedComment[] = [];

    for (let i = 0; i < MAX_AT_BUTTON_LIMIT + 10; i++) {
      const next = buildAtButtonComment(parsed, i);
      if (next) generated.push(next);
    }

    expect(generated).toHaveLength(MAX_AT_BUTTON_LIMIT);
    expect(data.button?.limit).toBe(0);
    expect(generated[0]?.content).toBe("@ボタン [Loop]");
    expect(generated[0]?.mail).toContain("from_button");

    const generatedData = parseCommandAndNicoScript(
      generated[0] as FormattedComment,
      createContext(),
    );

    expect(generatedData.button).toBeUndefined();
  });

  test("preserves normal at-button generated comments", () => {
    const data = parseCommandAndNicoScript(
      formattedComment('@ボタン "[Push]" "posted" "表示" "red,big" "2"'),
      createContext(),
    );
    const parsed = sizedComment(formattedComment(""), data);
    const first = buildAtButtonComment(parsed, 50);
    const second = buildAtButtonComment(parsed, 51);
    const third = buildAtButtonComment(parsed, 52);

    expect(data.button?.message.body).toBe("Push");
    expect(first).toMatchObject({
      vpos: 50,
      content: "posted",
      mail: ["red", "big", "from_button"],
    });
    expect(second).toBeDefined();
    expect(third).toBeUndefined();
  });
});
