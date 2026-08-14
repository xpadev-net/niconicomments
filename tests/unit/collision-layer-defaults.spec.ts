import { parse, safeParse } from "valibot";
import { describe, expect, test } from "vitest";

import {
  OWNER_DEFAULT_COLLISION_LAYER,
  VIEWER_DEFAULT_COLLISION_LAYER,
  ZFormattedComment,
} from "@/@types";

describe("ZFormattedComment layer default", () => {
  test("keeps an explicit layer value as-is", () => {
    const output = parse(ZFormattedComment, { layer: 3 });

    expect(output.layer).toBe(3);
  });

  test("defaults viewer comments to the viewer sentinel when layer is not given", () => {
    const output = parse(ZFormattedComment, { owner: false });

    expect(output.layer).toBe(VIEWER_DEFAULT_COLLISION_LAYER);
  });

  test("defaults owner comments to the owner sentinel when layer is not given", () => {
    const output = parse(ZFormattedComment, { owner: true });

    expect(output.layer).toBe(OWNER_DEFAULT_COLLISION_LAYER);
  });

  test("does not override an explicit custom layer on owner comments", () => {
    const output = parse(ZFormattedComment, { owner: true, layer: 5 });

    expect(output.layer).toBe(5);
  });

  test("promotes an owner comment carrying the plain viewer sentinel onto the owner sentinel", () => {
    // A caller (e.g. addComments() re-validating an already-normalized
    // comment, or an older payload built before owner/viewer separation
    // existed) may hand in owner:true with layer explicitly set to the
    // viewer default. That combination must still resolve to the owner
    // sentinel, or the comment would wrongly collide with viewers.
    const output = parse(ZFormattedComment, {
      owner: true,
      layer: VIEWER_DEFAULT_COLLISION_LAYER,
    });

    expect(output.layer).toBe(OWNER_DEFAULT_COLLISION_LAYER);
  });

  test("preserves an explicit layer across a re-parse (addComments round-trip)", () => {
    const first = parse(ZFormattedComment, { layer: 3 });
    const second = parse(ZFormattedComment, first);

    expect(second.layer).toBe(3);
  });

  test("accepts both sentinel values and any non-negative group id", () => {
    expect(
      safeParse(ZFormattedComment, { layer: VIEWER_DEFAULT_COLLISION_LAYER })
        .success,
    ).toBe(true);
    expect(
      safeParse(ZFormattedComment, { layer: OWNER_DEFAULT_COLLISION_LAYER })
        .success,
    ).toBe(true);
    expect(safeParse(ZFormattedComment, { layer: 0 }).success).toBe(true);
    expect(safeParse(ZFormattedComment, { layer: 42 }).success).toBe(true);
  });

  test("rejects a layer value outside the sentinel/group-id union", () => {
    expect(safeParse(ZFormattedComment, { layer: -3 }).success).toBe(false);
    expect(safeParse(ZFormattedComment, { layer: 1.5 }).success).toBe(false);
  });
});
