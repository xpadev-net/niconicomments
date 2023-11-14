import type { Output } from "valibot";
import { array, boolean, number, object, optional, string } from "valibot";

export const ZFormattedComment = object({
  id: number(),
  vpos: number(),
  content: string(),
  date: number(),
  date_usec: optional(number(), 0),
  owner: boolean(),
  premium: boolean(),
  mail: array(string()),
  user_id: number(),
  layer: number(),
  is_my_post: boolean(),
});
export type FormattedComment = Output<typeof ZFormattedComment>;

export const ZFormattedLegacyComment = object({
  id: number(),
  vpos: number(),
  content: string(),
  date: number(),
  date_usec: optional(number(), 0),
  owner: boolean(),
  premium: boolean(),
  mail: array(string()),
});
export type FormattedLegacyComment = Output<typeof ZFormattedLegacyComment>;

/**
 * @deprecated
 */
export type formattedComment = FormattedComment;
/**
 * @deprecated
 */
export type formattedLegacyComment = FormattedLegacyComment;
