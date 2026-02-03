import { describe, expect, it } from "vitest";

import { HTML5Comment } from "@/comments/HTML5Comment";
import { config } from "@/definition/config";

import { createComment, FakeRenderer, resetTestConfig } from "./helpers";

describe("HTML5Comment sizing", () => {
  it("returns stable size for identical inputs", () => {
    resetTestConfig();
    const renderer = new FakeRenderer();
    const base = createComment();
    base.content = "stable-size";
    const comment = new HTML5Comment(base, renderer, 0);
    const first = comment.getCommentSize(
      comment.parseCommandAndNicoscript(base),
    );
    const second = comment.getCommentSize(
      comment.parseCommandAndNicoscript(base),
    );
    expect(second.width).toBe(first.width);
    expect(second.height).toBe(first.height);
  });

  it("resizes long fixed comments within width limit", () => {
    resetTestConfig();
    const renderer = new FakeRenderer();
    const base = createComment();
    base.content = "x".repeat(200);
    const comment = new HTML5Comment(base, renderer, 0);
    const measured = comment.getCommentSize(
      comment.parseCommandAndNicoscript(base),
    );
    const widthLimit = config.commentStageSize.html5.width;
    expect(measured.width).toBeLessThanOrEqual(widthLimit);
  });
});
