import type { InferOutput } from "valibot";
import {
  array,
  boolean,
  object,
  omit,
  optional,
  pipe,
  strictObject,
  string,
  transform,
  union,
} from "valibot";

import {
  ZCommentDate,
  ZCommentDateUsec,
  ZCommentId,
  ZCommentLayer,
  ZCommentUserId,
  ZCommentVpos,
} from "./format.numeric";

const VIEWER_DEFAULT_COLLISION_LAYER = -1;

const commonEntries = {
  id: optional(ZCommentId, 0),
  vpos: optional(ZCommentVpos, 0),
  content: optional(string(), ""),
  date: optional(ZCommentDate, 0),
  date_usec: optional(ZCommentDateUsec, 0),
  owner: optional(boolean(), false),
  premium: optional(boolean(), false),
  mail: optional(array(string()), []),
  user_id: optional(ZCommentUserId, 0),
  ignoreScale: optional(boolean(), false),
  is_my_post: optional(boolean(), false),
};

const ZFormattedCommentEntries = object({
  ...commonEntries,
  collisionLayer: optional(ZCommentLayer, VIEWER_DEFAULT_COLLISION_LAYER),
});

// Strict: unknown keys (including the deprecated `layer`) fail validation,
// so `union` below falls through to the legacy-layer schema instead of
// silently dropping them.
const ZFormattedCommentStrict = strictObject({
  ...commonEntries,
  collisionLayer: optional(ZCommentLayer, VIEWER_DEFAULT_COLLISION_LAYER),
});

/**
 * @deprecated collisionLayer への移行前の互換フォーマット。layer を collisionLayer として扱う。
 */
const ZFormattedLegacyLayerComment = pipe(
  object({
    ...commonEntries,
    collisionLayer: optional(ZCommentLayer),
    layer: optional(ZCommentLayer),
  }),
  transform(({ layer, collisionLayer, ...rest }) => ({
    ...rest,
    collisionLayer: collisionLayer ?? layer ?? VIEWER_DEFAULT_COLLISION_LAYER,
  })),
);

export const ZFormattedComment = union([
  ZFormattedCommentStrict,
  ZFormattedLegacyLayerComment,
]);
export type FormattedComment = InferOutput<typeof ZFormattedComment>;

/**
 * @deprecated
 */
export const ZFormattedLegacyComment = omit(ZFormattedCommentEntries, [
  "collisionLayer",
  "ignoreScale",
  "user_id",
  "is_my_post",
]);
/**
 * @deprecated
 */
export type FormattedLegacyComment = InferOutput<
  typeof ZFormattedLegacyComment
>;

/**
 * @deprecated
 */
export type formattedComment = FormattedComment;
/**
 * @deprecated
 */
export type formattedLegacyComment = FormattedLegacyComment;
