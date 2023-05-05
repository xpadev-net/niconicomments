import type { CommentLoc, FormattedCommentWithSize } from "@/@types/";

export interface IComment {
  comment: FormattedCommentWithSize;
  invisible: boolean;
  loc: CommentLoc;
  width: number;
  long: number;
  height: number;
  vpos: number;
  flash: boolean;
  posY: number;
  owner: boolean;
  layer: number;
  mail: string[];
  image?: HTMLCanvasElement | null;
  draw: (vpos: number, showCollision: boolean, isDebug: boolean) => void;
}
