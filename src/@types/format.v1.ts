import type { Output } from "valibot";
import { array, boolean, null_, number, object, string, union } from "valibot";

export const ZV1Comment = object({
  id: string(),
  no: number(),
  vposMs: number(),
  body: string(),
  commands: array(string()),
  userId: string(),
  isPremium: boolean(),
  score: number(),
  postedAt: string(),
  nicoruCount: number(),
  nicoruId: union([string(), null_()]),
  source: string(),
  isMyPost: boolean(),
});
export type V1Comment = Output<typeof ZV1Comment>;

export const ZV1Thread = object({
  id: number(),
  fork: string(),
  commentCount: number(),
  comments: array(ZV1Comment),
});
export type V1Thread = Output<typeof ZV1Thread>;

/**
 * @deprecated
 */
export type v1Thread = V1Thread;
