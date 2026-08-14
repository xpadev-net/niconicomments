import { parse, safeParse } from "valibot";
import { describe, expect, test } from "vitest";

import {
  OWNER_DEFAULT_COLLISION_LAYER,
  VIEWER_DEFAULT_COLLISION_LAYER,
  ZFormattedComment,
} from "@/@types";

describe("ZFormattedComment layer input", () => {
  test("renames the public layer field onto collisionLayer", () => {
    const output = parse(ZFormattedComment, { layer: 3 });

    expect(output.collisionLayer).toBe(3);
    expect(output).not.toHaveProperty("layer");
  });

  test("defaults viewer comments to the viewer sentinel when layer is not given", () => {
    const output = parse(ZFormattedComment, { owner: false });

    expect(output.collisionLayer).toBe(VIEWER_DEFAULT_COLLISION_LAYER);
  });

  test("defaults owner comments to the owner sentinel when layer is not given", () => {
    const output = parse(ZFormattedComment, { owner: true });

    expect(output.collisionLayer).toBe(OWNER_DEFAULT_COLLISION_LAYER);
  });

  test("does not override an explicit layer on owner comments", () => {
    const output = parse(ZFormattedComment, { owner: true, layer: 5 });

    expect(output.collisionLayer).toBe(5);
  });

  test("ignores an unrecognized collisionLayer input key in favor of layer", () => {
    const output = parse(ZFormattedComment, { layer: 3, collisionLayer: 7 });

    expect(output.collisionLayer).toBe(3);
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
