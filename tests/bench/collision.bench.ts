import { bench, describe } from "vitest";

import { processFixedComment, processMovableComment } from "@/utils/comment";

import {
  createCollision,
  createTimeline,
  FakeRenderer,
  generateCommentInstances,
  resetBenchState,
} from "./helpers";

describe("processFixedComment", () => {
  bench("100 fixed comments (ue)", () => {
    resetBenchState();
    const renderer = new FakeRenderer();
    const comments = generateCommentInstances(100, renderer, "ue");
    const timeline = createTimeline();
    const collision = createCollision();
    for (const comment of comments) {
      processFixedComment(comment, collision.ue, timeline);
    }
  });

  bench("1000 fixed comments (ue)", () => {
    resetBenchState();
    const renderer = new FakeRenderer();
    const comments = generateCommentInstances(1000, renderer, "ue");
    const timeline = createTimeline();
    const collision = createCollision();
    for (const comment of comments) {
      processFixedComment(comment, collision.ue, timeline);
    }
  });
});

describe("processMovableComment", () => {
  bench("100 movable comments (naka)", () => {
    resetBenchState();
    const renderer = new FakeRenderer();
    const comments = generateCommentInstances(100, renderer, "naka");
    const timeline = createTimeline();
    const collision = createCollision();
    for (const comment of comments) {
      processMovableComment(comment, collision, timeline);
    }
  });

  bench("1000 movable comments (naka)", () => {
    resetBenchState();
    const renderer = new FakeRenderer();
    const comments = generateCommentInstances(1000, renderer, "naka");
    const timeline = createTimeline();
    const collision = createCollision();
    for (const comment of comments) {
      processMovableComment(comment, collision, timeline);
    }
  });
});

describe("mixed comments (preRendering equivalent)", () => {
  bench("500 mixed comments", () => {
    resetBenchState();
    const renderer = new FakeRenderer();
    const nakaComments = generateCommentInstances(350, renderer, "naka", 1);
    const ueComments = generateCommentInstances(100, renderer, "ue", 2);
    const shitaComments = generateCommentInstances(50, renderer, "shita", 3);
    const timeline = createTimeline();
    const collision = createCollision();

    for (const comment of nakaComments) {
      processMovableComment(comment, collision, timeline);
    }
    for (const comment of ueComments) {
      processFixedComment(comment, collision.ue, timeline);
    }
    for (const comment of shitaComments) {
      processFixedComment(comment, collision.shita, timeline);
    }
  });
});
