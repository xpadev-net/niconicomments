import type { Output } from "valibot";
import { object, string } from "valibot";

export const ZOwnerComment = object({
  time: string(),
  command: string(),
  comment: string(),
});
export type OwnerComment = Output<typeof ZOwnerComment>;

/**
 * @deprecated
 */
export type ownerComment = OwnerComment;
