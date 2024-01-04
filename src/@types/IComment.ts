import type {
  CommentLoc,
  FormattedCommentWithSize,
  IRenderer,
  Position,
} from "@/@types/";

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
  image?: IRenderer | null;
  draw: (vpos: number, showCollision: boolean, cursor?: Position) => void;
  isHovered: (cursor?: Position, posX?: number, posY?: number) => boolean;
}
