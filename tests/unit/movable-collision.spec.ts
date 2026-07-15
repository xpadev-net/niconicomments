import { beforeEach, describe, expect, test } from "vitest";

import type { Collision, IComment, Timeline } from "@/@types";
import { defaultConfig } from "@/definition/config";
import { initConfig } from "@/definition/initConfig";
import { processMovableComment } from "@/utils/comment";

const createCollision = (): Collision => ({
  ue: {},
  shita: {},
  left: {},
  right: {},
});

const createMovableComment = (
  index: number,
  vpos: number,
  long: number,
  options: { layer?: number; owner?: boolean; width?: number } = {},
) =>
  ({
    comment: {},
    invisible: false,
    index,
    loc: "naka",
    width: options.width ?? 100,
    long,
    height: 24,
    vpos,
    flash: false,
    posY: -1,
    owner: options.owner ?? false,
    layer: options.layer ?? -1,
    mail: [],
    content: `comment ${index}`,
    draw() {},
    isHovered: () => false,
  }) as IComment;

const process = (
  comment: IComment,
  collision: Collision,
  timeline: Timeline,
  lazy = false,
) => processMovableComment(comment, collision, timeline, lazy, defaultConfig);

const shareCollisionSample = (
  collision: Collision["left"] | Collision["right"],
  first: IComment,
  second: IComment,
) =>
  Object.values(collision).some(
    (comments) => comments.includes(first) && comments.includes(second),
  );

describe("movable comment collision", () => {
  beforeEach(() => {
    initConfig();
  });

  test("separates different-duration comments that collide only between the sampled lines", () => {
    const collision = createCollision();
    const timeline: Timeline = {};
    const slowLeading = createMovableComment(1, 0, 1000);
    const laterNormal = createMovableComment(2, 250, 300);

    process(slowLeading, collision, timeline);
    process(laterNormal, collision, timeline);

    expect(shareCollisionSample(collision.left, slowLeading, laterNormal)).toBe(
      false,
    );
    expect(
      shareCollisionSample(collision.right, slowLeading, laterNormal),
    ).toBe(false);
    expect(slowLeading.posY).toBe(0);
    expect(laterNormal.posY).toBe(slowLeading.height);
  });

  test("allows different-duration comments with overlapping active ranges but non-intersecting trajectories to share a row", () => {
    const collision = createCollision();
    const timeline: Timeline = {};
    const slowLeading = createMovableComment(1, 0, 1000);
    const muchLaterNormal = createMovableComment(2, 900, 300);

    process(slowLeading, collision, timeline);
    process(muchLaterNormal, collision, timeline);

    expect(slowLeading.posY).toBe(0);
    expect(muchLaterNormal.posY).toBe(0);
  });

  test("allows comments that overlap only outside the collision judgment region to share a row", () => {
    const collision = createCollision();
    const timeline: Timeline = {};
    const earlierSlow = createMovableComment(1, 0, 600, { width: 50 });
    const laterNormal = createMovableComment(2, 365, 300, { width: 50 });

    process(earlierSlow, collision, timeline);
    process(laterNormal, collision, timeline);

    expect(earlierSlow.posY).toBe(0);
    expect(laterNormal.posY).toBe(0);
  });

  test("separates unequal-width mixed-duration comments that collide inside the judgment region", () => {
    const collision = createCollision();
    const timeline: Timeline = {};
    const widerSlow = createMovableComment(1, 0, 600, { width: 200 });
    const narrowNormal = createMovableComment(2, 305, 300, { width: 20 });

    process(widerSlow, collision, timeline);
    process(narrowNormal, collision, timeline);

    expect(widerSlow.posY).toBe(0);
    expect(narrowNormal.posY).toBe(widerSlow.height);
  });

  test("preserves sampled-line collision placement for equal custom durations", () => {
    const collision = createCollision();
    const timeline: Timeline = {};
    const first = createMovableComment(1, 0, 1000);
    const second = createMovableComment(2, 0, 1000);

    process(first, collision, timeline);
    process(second, collision, timeline);

    expect(first.posY).toBe(0);
    expect(second.posY).toBe(first.height);
  });

  test("treats default and explicit @3 normalized durations as the same-duration path", () => {
    const collision = createCollision();
    const timeline: Timeline = {};
    const defaultDuration = createMovableComment(1, 0, 300);
    const explicitAtThree = createMovableComment(2, 0, 300);

    process(defaultDuration, collision, timeline);
    process(explicitAtThree, collision, timeline);

    expect(defaultDuration.posY).toBe(0);
    expect(explicitAtThree.posY).toBe(defaultDuration.height);
  });

  test.each([
    ["owner", { owner: true }],
    ["layer", { layer: 0 }],
  ])("does not separate intersecting mixed-duration comments with a different %s", (_, differingIdentity) => {
    const collision = createCollision();
    const timeline: Timeline = {};
    const slowLeading = createMovableComment(1, 0, 1000);
    const laterNormal = createMovableComment(2, 250, 300, differingIdentity);

    process(slowLeading, collision, timeline);
    process(laterNormal, collision, timeline);

    expect(slowLeading.posY).toBe(0);
    expect(laterNormal.posY).toBe(0);
  });

  test("does not duplicate timeline or analytic candidates when a lazy comment is reprocessed", () => {
    const collision = createCollision();
    const timeline: Timeline = {};
    const slowLeading = createMovableComment(1, 0, 1000);
    const laterNormal = createMovableComment(2, 250, 300);

    process(slowLeading, collision, timeline, true);
    expect(slowLeading.posY).toBe(-1);
    process(slowLeading, collision, timeline);
    process(laterNormal, collision, timeline);

    expect(
      timeline[0]?.filter((comment) => comment === slowLeading),
    ).toHaveLength(1);
    expect(slowLeading.posY).toBe(0);
    expect(laterNormal.posY).toBe(slowLeading.height);
  });

  test("detects a mixed-duration collision when comments are inserted out of chronological order", () => {
    const collision = createCollision();
    const timeline: Timeline = {};
    const slowLeading = createMovableComment(1, 0, 1000);
    const laterNormal = createMovableComment(2, 250, 300);

    process(laterNormal, collision, timeline);
    process(slowLeading, collision, timeline);

    expect(laterNormal.posY).toBe(0);
    expect(slowLeading.posY).toBe(laterNormal.height);
  });
});
