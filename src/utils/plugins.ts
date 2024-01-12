import type { FormattedComment, IRenderer } from "@/@types";
import { HTML5Comment } from "@/comments";
import { config } from "@/definition/config";

/**
 * コメントのインスタンスを生成する
 * @param comment コメント
 * @param context 描画対象のCanvasコンテキスト
 * @param index コメントのインデックス
 * @returns プラグインまたは内臓のコメントインスタンス
 */
const createCommentInstance = (
  comment: FormattedComment,
  context: IRenderer,
  index: number,
) => {
  for (const plugin of config.commentPlugins) {
    if (plugin.condition(comment)) {
      return new plugin.class(comment, context, index);
    }
  }
  return new HTML5Comment(comment, context, index);
};

export { createCommentInstance };
