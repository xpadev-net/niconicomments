import { describe, expect, it } from "vitest";

import type { Collision, IComment, Timeline } from "@/@types";
import { HTML5Comment } from "@/comments/HTML5Comment";
import { processFixedComment, processMovableComment } from "@/utils/comment";

import { createComment, FakeRenderer, resetTestConfig } from "./helpers";

const createTimeline = (): Timeline => ({});

const createCollision = (): Collision => ({
  ue: {},
  shita: {},
  left: {},
  right: {},
});

const cloneState = (timeline: Timeline, collision: Collision) => ({
  timeline: JSON.stringify(timeline),
  collision: JSON.stringify(collision),
});

const newCommentInstance = (renderer: FakeRenderer, vpos = 0) => {
  const base = createComment();
  base.vpos = vpos;
  const instance = new HTML5Comment(base, renderer, 0);
  instance.posY = -1;
  return instance as unknown as IComment;
};

describe("process comment timeline determinism", () => {
  it("processFixedComment inserts timeline/collision only once", () => {
    resetTestConfig();
    const renderer = new FakeRenderer();
    const comment = newCommentInstance(renderer, 0);
    const timeline = createTimeline();
    const collision = createCollision();
    processFixedComment(comment, collision.ue, timeline);
    const first = cloneState(timeline, collision);
    processFixedComment(comment, collision.ue, timeline);
    const second = cloneState(timeline, collision);
    expect(second).toEqual(first);
    expect(comment.posY).toBeGreaterThanOrEqual(0);
  });

  it("processMovableComment inserts timeline/collision only once", () => {
    resetTestConfig();
    const renderer = new FakeRenderer();
    const comment = newCommentInstance(renderer, 0);
    comment.comment.loc = "naka";
    comment.comment.long = 300;
    const timeline = createTimeline();
    const collision = createCollision();
    processMovableComment(comment, collision, timeline);
    const first = cloneState(timeline, collision);
    processMovableComment(comment, collision, timeline);
    const second = cloneState(timeline, collision);
    expect(second).toEqual(first);
    expect(comment.posY).toBeGreaterThanOrEqual(0);
  });
});
