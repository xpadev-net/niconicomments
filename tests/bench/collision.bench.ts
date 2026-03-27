import { bench, describe } from "vitest";

import type { IComment } from "@/@types";
import { processFixedComment, processMovableComment } from "@/utils/comment";

import {
  createCollision,
  createTimeline,
  FakeRenderer,
  generateCommentInstances,
  resetBenchState,
} from "./helpers";

/** コメントの posY を -1 にリセットする */
const resetPosY = (comments: IComment[]) => {
  for (const c of comments) c.posY = -1;
};

// セットアップを describe スコープで1回実行し、
// bench コールバック内では衝突状態のリセットのみ行う
resetBenchState();
const renderer = new FakeRenderer();

const fixed100 = generateCommentInstances(100, renderer, "ue", 1);
const fixed1000 = generateCommentInstances(1000, renderer, "ue", 2);
const movable100 = generateCommentInstances(100, renderer, "naka", 3);
const movable1000 = generateCommentInstances(1000, renderer, "naka", 4);
const mixedNaka = generateCommentInstances(350, renderer, "naka", 5);
const mixedUe = generateCommentInstances(100, renderer, "ue", 6);
const mixedShita = generateCommentInstances(50, renderer, "shita", 7);

describe("processFixedComment", () => {
  bench("100 fixed comments (ue)", () => {
    resetPosY(fixed100);
    const timeline = createTimeline();
    const collision = createCollision();
    for (const comment of fixed100) {
      processFixedComment(comment, collision.ue, timeline);
    }
  });

  bench("1000 fixed comments (ue)", () => {
    resetPosY(fixed1000);
    const timeline = createTimeline();
    const collision = createCollision();
    for (const comment of fixed1000) {
      processFixedComment(comment, collision.ue, timeline);
    }
  });
});

describe("processMovableComment", () => {
  bench("100 movable comments (naka)", () => {
    resetPosY(movable100);
    const timeline = createTimeline();
    const collision = createCollision();
    for (const comment of movable100) {
      processMovableComment(comment, collision, timeline);
    }
  });

  bench("1000 movable comments (naka)", () => {
    resetPosY(movable1000);
    const timeline = createTimeline();
    const collision = createCollision();
    for (const comment of movable1000) {
      processMovableComment(comment, collision, timeline);
    }
  });
});

describe("mixed comments (preRendering equivalent)", () => {
  bench("500 mixed comments", () => {
    resetPosY(mixedNaka);
    resetPosY(mixedUe);
    resetPosY(mixedShita);
    const timeline = createTimeline();
    const collision = createCollision();

    for (const comment of mixedNaka) {
      processMovableComment(comment, collision, timeline);
    }
    for (const comment of mixedUe) {
      processFixedComment(comment, collision.ue, timeline);
    }
    for (const comment of mixedShita) {
      processFixedComment(comment, collision.shita, timeline);
    }
  });
});
