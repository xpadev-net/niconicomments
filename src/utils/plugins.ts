import { FormattedComment } from "@/@types";
import { HTML5Comment } from "@/comments";
import { config } from "@/definition/config";

const createCommentInstance = (
  comment: FormattedComment,
  context: CanvasRenderingContext2D
) => {
  for (const plugin of config.commentPlugins) {
    if (plugin.condition(comment)) {
      return new plugin.class(comment, context);
    }
  }
  return new HTML5Comment(comment, context);
};

export { createCommentInstance };
