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
  ZCommentDate,
  ZCommentDateUsec,
  ZCommentId,
  ZCommentLayer,
  ZCommentUserId,
  ZCommentVpos,
} from "./format.numeric";

const VIEWER_DEFAULT_COLLISION_LAYER = -1;

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
  layer: optional(ZCommentLayer, VIEWER_DEFAULT_COLLISION_LAYER),
  ignoreScale: optional(boolean(), false),
  is_my_post: optional(boolean(), false),
});

// The public/JSON input keeps the historical `layer` field name (no
// breaking change to the formatted-input format). Internally the render
// and collision pipeline uses `collisionLayer` (see
// src/utils/collisionLayer.ts), so the schema renames it on the way out.
export const ZFormattedComment = pipe(
  ZFormattedCommentEntries,
  transform(({ layer, ...rest }) => ({ ...rest, collisionLayer: layer })),
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
