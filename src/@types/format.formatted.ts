import type { Output } from "valibot";
import {
  array,
  boolean,
  number,
  object,
  omit,
  optional,
  string,
} from "valibot";

export const ZFormattedComment = object({
  id: number(),
  vpos: number(),
  content: string(),
  date: number(),
  date_usec: optional(number(), 0),
  owner: boolean(),
  premium: boolean(),
  mail: array(string()),
  user_id: optional(number(), 0),
  layer: optional(number(), -1),
  is_my_post: optional(boolean(), false),
});
export type FormattedComment = Output<typeof ZFormattedComment>;

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
export type FormattedLegacyComment = Output<typeof ZFormattedLegacyComment>;

/**
 * @deprecated
 */
export type formattedComment = FormattedComment;
/**
 * @deprecated
 */
export type formattedLegacyComment = FormattedLegacyComment;
