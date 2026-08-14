import type { FormattedComment } from "@/@types";

export const VIEWER_DEFAULT_COLLISION_LAYER = -1;
export const OWNER_DEFAULT_COLLISION_LAYER = -2;

/**
 * 投稿者コメントを視聴者コメントとは別の衝突レイヤーに正規化する
 * @param comments 正規化対象のコメントデータ
 */
const applyDefaultCollisionLayer = (comments: FormattedComment[]) => {
  for (const comment of comments) {
    if (
      comment.owner &&
      comment.collisionLayer === VIEWER_DEFAULT_COLLISION_LAYER
    ) {
      comment.collisionLayer = OWNER_DEFAULT_COLLISION_LAYER;
    }
  }
};

export { applyDefaultCollisionLayer };
