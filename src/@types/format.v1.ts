import type { InferOutput } from "valibot";
import {
  array,
  boolean,
  nullable,
  number,
  object,
  optional,
  string,
  unknown,
} from "valibot";

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
  nicoruId: nullable(string()),
  source: string(),
  isMyPost: boolean(),
});
export type V1Comment = InferOutput<typeof ZV1Comment>;

export const ZV1Thread = object({
  id: unknown(),
  fork: string(),
  commentCount: optional(number(), 0),
  comments: array(ZV1Comment),
});
export type V1Thread = InferOutput<typeof ZV1Thread>;

/**
 * @deprecated
 */
export type v1Thread = V1Thread;
