import type { Output } from "valibot";
import {
  notValue,
  number,
  object,
  optional,
  record,
  string,
  union,
  unknown,
} from "valibot";

export const ZApiChat = object({
  thread: optional(string(), ""),
  no: optional(number(), 0),
  vpos: number(),
  date: optional(number(), 0),
  date_usec: optional(number(), 0),
  nicoru: optional(number(), 0),
  premium: optional(number(), 0),
  anonymity: optional(number(), 0),
  user_id: optional(string(), ""),
  mail: optional(string(), ""),
  content: string(),
  deleted: optional(number(), 0),
});
export type ApiChat = Output<typeof ZApiChat>;

export const ZRawApiResponse = union([
  object({ chat: ZApiChat }),
  record(string([notValue("chat")]), unknown()),
]);
export type RawApiResponse = Output<typeof ZRawApiResponse>;

/**
 * @deprecated
 */
export const ZApiPing = object({
  content: string(),
});
/**
 * @deprecated
 */
export type ApiPing = Output<typeof ZApiPing>;

/**
 * @deprecated
 */
export const ZApiThread = object({
  resultcode: number(),
  thread: string(),
  server_time: number(),
  ticket: string(),
  revision: number(),
});
/**
 * @deprecated
 */
export type ApiThread = Output<typeof ZApiThread>;

/**
 * @deprecated
 */
export const ZApiLeaf = object({
  thread: string(),
  count: number(),
});
/**
 * @deprecated
 */
export type ApiLeaf = Output<typeof ZApiLeaf>;

/**
 * @deprecated
 */
export const ZApiGlobalNumRes = object({
  thread: string(),
  num_res: number(),
});
/**
 * @deprecated
 */
export type ApiGlobalNumRes = Output<typeof ZApiGlobalNumRes>;

/**
 * @deprecated
 */
export type rawApiResponse = RawApiResponse;
