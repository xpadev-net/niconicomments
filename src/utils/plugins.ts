import type { Context2D, FormattedComment } from "@/@types";
import { HTML5Comment } from "@/comments";
import { config } from "@/definition/config";

/**
 * コメントのインスタンスを生成する
 * @param comment コメント
 * @param context 描画対象のCanvasコンテキスト
 * @returns プラグインまたは内臓のコメントインスタンス
 */
const createCommentInstance = (
  comment: FormattedComment,
  context: Context2D,
) => {
  for (const plugin of config.commentPlugins) {
    if (plugin.condition(comment)) {
      return new plugin.class(comment, context);
    }
  }
  return new HTML5Comment(comment, context);
};

export { createCommentInstance };
