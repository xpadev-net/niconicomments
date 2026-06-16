import type { InferOutput } from "valibot";
import { array, boolean, object, omit, optional, string } from "valibot";

import {
  ZCommentDate,
  ZCommentDateUsec,
  ZCommentId,
  ZCommentLayer,
  ZCommentUserId,
  ZCommentVpos,
} from "./format.numeric";

export const ZFormattedComment = object({
  id: optional(ZCommentId, 0),
  vpos: optional(ZCommentVpos, 0),
  content: optional(string(), ""),
  date: optional(ZCommentDate, 0),
  date_usec: optional(ZCommentDateUsec, 0),
  owner: optional(boolean(), false),
  premium: optional(boolean(), false),
  mail: optional(array(string()), []),
  user_id: optional(ZCommentUserId, 0),
  layer: optional(ZCommentLayer, -1),
  is_my_post: optional(boolean(), false),
});
export type FormattedComment = InferOutput<typeof ZFormattedComment>;

/**
 * @deprecated
 */
export const ZFormattedLegacyComment = omit(ZFormattedComment, [
  "layer",
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
