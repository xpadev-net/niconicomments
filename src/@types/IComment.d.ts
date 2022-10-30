interface IComment {
  comment: formattedCommentWithSize;
  invisible: boolean;
  loc: commentLoc;
  width: number;
  long: number;
  height: number;
  vpos: number;
  flash: boolean;
  posY: number;
  owner: boolean;
  layer: number;
  mail: string[];
  getTextImage: (vpos: number) => void;
  draw: (vpos: number, showCollision: boolean, isDebug: boolean) => void;
}
