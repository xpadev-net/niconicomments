import type { InferOutput } from "valibot";
import {
  array,
  boolean,
  nullable,
  object,
  optional,
  string,
  unknown,
} from "valibot";

import { ZCommentId, ZCommentScore, ZCommentVpos } from "./format.numeric";

export const ZV1Comment = object({
  id: string(),
  no: ZCommentId,
  vposMs: ZCommentVpos,
  body: string(),
  commands: array(string()),
  userId: string(),
  isPremium: boolean(),
  score: ZCommentScore,
  postedAt: string(),
  nicoruCount: ZCommentId,
  nicoruId: nullable(string()),
  source: string(),
  isMyPost: boolean(),
});
export type V1Comment = InferOutput<typeof ZV1Comment>;

export const ZV1Thread = object({
  id: unknown(),
  fork: string(),
  commentCount: optional(ZCommentId, 0),
  comments: array(ZV1Comment),
});
export type V1Thread = InferOutput<typeof ZV1Thread>;

/**
 * @deprecated
 */
export type v1Thread = V1Thread;
