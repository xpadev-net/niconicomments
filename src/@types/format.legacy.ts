import type { Output } from "valibot";
import { number, object, record, string, union } from "valibot";

export const ZApiPing = object({
  content: string(),
});
export type ApiPing = Output<typeof ZApiPing>;

export const ZApiThread = object({
  resultcode: number(),
  thread: string(),
  server_time: number(),
  ticket: string(),
  revision: number(),
});
export type ApiThread = Output<typeof ZApiThread>;

export const ZApiLeaf = object({
  thread: string(),
  count: number(),
});
export type ApiLeaf = Output<typeof ZApiLeaf>;

export const ZApiGlobalNumRes = object({
  thread: string(),
  num_res: number(),
});
export type ApiGlobalNumRes = Output<typeof ZApiGlobalNumRes>;

export const ZApiChat = object({
  thread: string(),
  no: number(),
  vpos: number(),
  date: number(),
  date_usec: number(),
  nicoru: number(),
  premium: number(),
  anonymity: number(),
  user_id: string(),
  mail: string(),
  content: string(),
  deleted: number(),
});
export type ApiChat = Output<typeof ZApiChat>;

export const ZRawApiResponse = record(
  string(),
  union([ZApiPing, ZApiThread, ZApiLeaf, ZApiGlobalNumRes, ZApiChat]),
);
export type RawApiResponse = Output<typeof ZRawApiResponse>;

/**
 * @deprecated
 */
export type rawApiResponse = RawApiResponse;
