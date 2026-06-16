import type { InferOutput } from "valibot";
import { object, optional, string } from "valibot";

export const ZOwnerComment = object({
  time: string(),
  command: optional(string(), ""),
  comment: string(),
});
export type OwnerComment = InferOutput<typeof ZOwnerComment>;

/**
 * @deprecated
 */
export type ownerComment = OwnerComment;
