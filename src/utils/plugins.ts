import type { FormattedComment, IRenderer } from "@/@types";
import { HTML5Comment } from "@/comments";
import type { CommentInstanceContext } from "@/contexts/";

/**
 * コメントのインスタンスを生成する
 * @param comment コメント
 * @param renderer 描画対象のCanvasコンテキスト
 * @param index コメントのインデックス
 * @param ctx インスタンスコンテキスト
 * @returns プラグインまたは内臓のコメントインスタンス
 */
const createCommentInstance = (
  comment: FormattedComment,
  renderer: IRenderer,
  index: number,
  ctx: CommentInstanceContext,
) => {
  for (const plugin of ctx.config.commentPlugins) {
    if (plugin.condition(comment, ctx.config, ctx.options)) {
      return new plugin.class(comment, renderer, index, ctx);
    }
  }
  return new HTML5Comment(comment, renderer, index, ctx);
};

export { createCommentInstance };
