import { parse } from "valibot";
import { describe, expect, test } from "vitest";

import type { FormattedComment } from "@/@types";
import { ZFormattedComment } from "@/@types";
import {
  applyDefaultCollisionLayer,
  OWNER_DEFAULT_COLLISION_LAYER,
  VIEWER_DEFAULT_COLLISION_LAYER,
} from "@/utils/collisionLayer";

const formattedComment = (
  overrides: Partial<FormattedComment> = {},
): FormattedComment => ({
  id: 0,
  vpos: 0,
  content: "",
  date: 0,
  date_usec: 0,
  owner: false,
  premium: false,
  mail: [],
  user_id: 1,
  collisionLayer: VIEWER_DEFAULT_COLLISION_LAYER,
  ignoreScale: false,
  is_my_post: false,
  ...overrides,
});

describe("applyDefaultCollisionLayer", () => {
  test("normalizes default-layer owner comments onto the owner sentinel", () => {
    const comments = [formattedComment({ owner: true })];

    applyDefaultCollisionLayer(comments);

    expect(comments[0]?.collisionLayer).toBe(OWNER_DEFAULT_COLLISION_LAYER);
  });

  test("leaves viewer comments on the viewer default", () => {
    const comments = [formattedComment({ owner: false })];

    applyDefaultCollisionLayer(comments);

    expect(comments[0]?.collisionLayer).toBe(VIEWER_DEFAULT_COLLISION_LAYER);
  });

  test("does not override an explicitly assigned collisionLayer on owner comments", () => {
    const comments = [formattedComment({ owner: true, collisionLayer: 5 })];

    applyDefaultCollisionLayer(comments);

    expect(comments[0]?.collisionLayer).toBe(5);
  });
});

describe("ZFormattedComment legacy layer alias", () => {
  test("maps the deprecated layer field onto collisionLayer", () => {
    const output = parse(ZFormattedComment, { layer: 3 });

    expect(output.collisionLayer).toBe(3);
    expect(output).not.toHaveProperty("layer");
  });

  test("prefers an explicit collisionLayer over layer when both are given", () => {
    const output = parse(ZFormattedComment, { layer: 3, collisionLayer: 7 });

    expect(output.collisionLayer).toBe(7);
  });

  test("defaults to the viewer sentinel when neither field is given", () => {
    const output = parse(ZFormattedComment, {});

    expect(output.collisionLayer).toBe(VIEWER_DEFAULT_COLLISION_LAYER);
  });
});
