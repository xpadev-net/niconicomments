import type { Canvas, CommentLoc, FormattedCommentWithSize } from "@/@types/";
import type { CursorPos } from "@/@types/cursor";

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
  content: string;
  image?: Canvas | null;
  draw: (vpos: number, showCollision: boolean, cursor?: CursorPos) => void;
}
