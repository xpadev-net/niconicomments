import type { InferInput, InferOutput } from "valibot";
import {
  array,
  boolean,
  object,
  omit,
  optional,
  pipe,
  string,
  transform,
} from "valibot";

import {
  OWNER_DEFAULT_COLLISION_LAYER,
  VIEWER_DEFAULT_COLLISION_LAYER,
  ZCommentDate,
  ZCommentDateUsec,
  ZCommentId,
  ZCommentLayer,
  ZCommentUserId,
  ZCommentVpos,
} from "./format.numeric";

const ZFormattedCommentEntries = object({
  id: optional(ZCommentId, 0),
  vpos: optional(ZCommentVpos, 0),
  content: optional(string(), ""),
  date: optional(ZCommentDate, 0),
  date_usec: optional(ZCommentDateUsec, 0),
  owner: optional(boolean(), false),
  premium: optional(boolean(), false),
  mail: optional(array(string()), []),
  user_id: optional(ZCommentUserId, 0),
  layer: optional(ZCommentLayer),
  ignoreScale: optional(boolean(), false),
  is_my_post: optional(boolean(), false),
});

// `layer` doubles as the comment's collision-grouping id. When omitted —
// or when an owner comment still carries the plain viewer default,
// e.g. from a caller/older payload built before owner/viewer separation
// existed — the default depends on `owner` so that owner and viewer
// comments always start out on separate collision layers.
export const ZFormattedComment = pipe(
  ZFormattedCommentEntries,
  transform((input) => {
    const layer = input.layer ?? VIEWER_DEFAULT_COLLISION_LAYER;
    return {
      ...input,
      layer:
        input.owner && layer === VIEWER_DEFAULT_COLLISION_LAYER
          ? OWNER_DEFAULT_COLLISION_LAYER
          : layer,
    };
  }),
);
/**
 * 公開APIの入出力型。`id` や `ignoreScale` など default 付きのフィールドは
 * 省略できる。`addComments` やコンストラクタなど公開APIの引数型として使う。
 */
export type FormattedComment = InferInput<typeof ZFormattedComment>;
/**
 * パース済み・正規化済みのコメントの型。default 付きのフィールドも含めて
 * 全プロパティが確定している。ライブラリ内部でのみ使う。
 */
export type ResolvedFormattedComment = InferOutput<typeof ZFormattedComment>;

/**
 * @deprecated
 */
export const ZFormattedLegacyComment = omit(ZFormattedCommentEntries, [
  "layer",
  "ignoreScale",
  "user_id",
  "is_my_post",
]);
/**
 * @deprecated
 */
export type FormattedLegacyComment = InferInput<typeof ZFormattedLegacyComment>;
/**
 * @deprecated
 */
export type ResolvedFormattedLegacyComment = InferOutput<
  typeof ZFormattedLegacyComment
>;

/**
 * @deprecated
 */
export type formattedComment = FormattedComment;
/**
 * @deprecated
 */
export type formattedLegacyComment = FormattedLegacyComment;
