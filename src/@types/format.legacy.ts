import type { InferOutput } from "valibot";
import {
  notValue,
  object,
  optional,
  pipe,
  record,
  string,
  union,
  unknown,
} from "valibot";

import {
  ZCommentDate,
  ZCommentDateUsec,
  ZCommentId,
  ZCommentVpos,
} from "./format.numeric";

export const ZApiChat = object({
  thread: optional(string(), ""),
  no: optional(ZCommentId, 0),
  vpos: ZCommentVpos,
  date: optional(ZCommentDate, 0),
  date_usec: optional(ZCommentDateUsec, 0),
  nicoru: optional(ZCommentId, 0),
  premium: optional(ZCommentId, 0),
  anonymity: optional(ZCommentId, 0),
  user_id: optional(string(), ""),
  mail: optional(string(), ""),
  content: string(),
  deleted: optional(ZCommentId, 0),
});
export type ApiChat = InferOutput<typeof ZApiChat>;

export const ZRawApiResponse = union([
  object({ chat: unknown() }),
  record(pipe(string(), notValue("chat")), unknown()),
]);
export type RawApiResponse = InferOutput<typeof ZRawApiResponse>;

/**
 * @deprecated
 */
export const ZApiPing = object({
  content: string(),
});
/**
 * @deprecated
 */
export type ApiPing = InferOutput<typeof ZApiPing>;

/**
 * @deprecated
 */
export const ZApiThread = object({
  resultcode: ZCommentId,
  thread: string(),
  server_time: ZCommentDate,
  ticket: string(),
  revision: ZCommentId,
});
/**
 * @deprecated
 */
export type ApiThread = InferOutput<typeof ZApiThread>;

/**
 * @deprecated
 */
export const ZApiLeaf = object({
  thread: string(),
  count: ZCommentId,
});
/**
 * @deprecated
 */
export type ApiLeaf = InferOutput<typeof ZApiLeaf>;

/**
 * @deprecated
 */
export const ZApiGlobalNumRes = object({
  thread: string(),
  num_res: ZCommentId,
});
/**
 * @deprecated
 */
export type ApiGlobalNumRes = InferOutput<typeof ZApiGlobalNumRes>;

/**
 * @deprecated
 */
export type rawApiResponse = RawApiResponse;
