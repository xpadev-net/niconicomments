import type { InferOutput } from "valibot";
import {
  array,
  boolean,
  object,
  omit,
  optional,
  pipe,
  string,
  transform,
} from "valibot";

import {
  OWNER_DEFAULT_COLLISION_LAYER,
  VIEWER_DEFAULT_COLLISION_LAYER,
  ZCommentDate,
  ZCommentDateUsec,
  ZCommentId,
  ZCommentLayer,
  ZCommentUserId,
  ZCommentVpos,
} from "./format.numeric";

const ZFormattedCommentEntries = object({
  id: optional(ZCommentId, 0),
  vpos: optional(ZCommentVpos, 0),
  content: optional(string(), ""),
  date: optional(ZCommentDate, 0),
  date_usec: optional(ZCommentDateUsec, 0),
  owner: optional(boolean(), false),
  premium: optional(boolean(), false),
  mail: optional(array(string()), []),
  user_id: optional(ZCommentUserId, 0),
  layer: optional(ZCommentLayer),
  ignoreScale: optional(boolean(), false),
  is_my_post: optional(boolean(), false),
});

// The public/JSON input keeps the historical `layer` field name (no
// breaking change to the formatted-input format). Internally the render
// and collision pipeline uses `collisionLayer`, so the schema renames it
// on the way out. When `layer` is omitted, the default depends on `owner`
// so that owner and viewer comments start out on separate collision
// layers without a separate post-parse normalization pass.
export const ZFormattedComment = pipe(
  ZFormattedCommentEntries,
  transform(({ layer, owner, ...rest }) => ({
    ...rest,
    owner,
    collisionLayer:
      layer ??
      (owner ? OWNER_DEFAULT_COLLISION_LAYER : VIEWER_DEFAULT_COLLISION_LAYER),
  })),
);
export type FormattedComment = InferOutput<typeof ZFormattedComment>;

/**
 * @deprecated
 */
export const ZFormattedLegacyComment = omit(ZFormattedCommentEntries, [
  "layer",
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
