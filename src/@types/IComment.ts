import type { CommentLoc, FormattedCommentWithSize, Position } from "@/@types/";
import type { IRenderer } from "@/@types/renderer";

export interface IComment {
  comment: FormattedCommentWithSize;
  invisible: boolean;
  index: number;
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
  image?: IRenderer | null;
  draw: (vpos: number, showCollision: boolean, cursor?: Position) => void;
  isHovered: (cursor?: Position, posX?: number, posY?: number) => boolean;
}
