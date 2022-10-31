type formattedCommentWithFont = {
  id: number;
  vpos: number;
  date: number;
  date_usec: number;
  owner: boolean;
  premium: boolean;
  mail: string[];
  user_id: number;
  layer: number;
  loc: commentLoc;
  size: commentSize;
  fontSize: number;
  font: commentFont;
  color: string;
  full: boolean;
  ender: boolean;
  _live: boolean;
  long: number;
  invisible: boolean;
  content: commentContentItem[];
  flash: boolean;
  lineCount: number;
  lineOffset: number;
};
type formattedCommentWithSize = formattedCommentWithFont & {
  height: number;
  width: number;
  lineHeight: number;
  resized: boolean;
  resizedX: boolean;
  resizedY: boolean;
  content: commentMeasuredContentItem[];
  charSize: number;
};
type parsedComment = formattedCommentWithSize & {
  posY: number;
  image?: HTMLCanvasElement | boolean;
};
type commentContentItem = {
  content: string;
  font?: commentFlashFont;
  width?: number[];
};
type commentMeasuredContentItem = commentContentItem & {
  width: number[];
};
type commentContentIndex = {
  index: number;
  font: "gothic" | "gulim" | "simsunStrong" | "simsunWeak";
};
type commentFont = "defont" | "mincho" | "gothic" | "gulim" | "simsun";
type commentFlashFont = "defont" | "gulim" | "simsun";
type commentSize = "big" | "medium" | "small";
type commentLoc = "ue" | "naka" | "shita";
type collision = { [key in collisionPos]: collisionItem };
type collisionPos = "ue" | "shita" | "right" | "left";
type collisionItem = { [p: number]: number[] };
type nicoScript = {
  reverse: nicoScriptReverse[];
  ban: nicoScriptBan[];
  default: nicoScriptDefault[];
  replace: nicoScriptReplace[];
};
type nicoScriptReverse = {
  target: nicoScriptReverseTarget;
  start: number;
  end: number;
};
type nicoScriptReverseTarget = "コメ" | "投コメ" | "全";
type nicoScriptReplace = {
  start: number;
  long: number | undefined;
  keyword: string;
  replace: string;
  range: nicoScriptReplaceRange;
  target: nicoScriptReplaceTarget;
  condition: nicoScriptReplaceCondition;
  color: string | undefined;
  size: commentSize | undefined;
  font: commentFont | undefined;
  loc: commentLoc | undefined;
  no: number;
};
type nicoScriptReplaceRange = "単" | "全";
type nicoScriptReplaceTarget = "コメ" | "投コメ" | "全" | "含まない" | "含む";
type nicoScriptReplaceCondition = "完全一致" | "部分一致";
type nicoScriptBan = {
  start: number;
  end: number;
};
type nicoScriptDefault = {
  start: number;
  long: number | undefined;
  color: string | undefined;
  size: commentSize | undefined;
  font: commentFont | undefined;
  loc: commentLoc | undefined;
};
type measureTextResult = {
  width: number;
  height: number;
  resized: boolean;
  resizedX: boolean;
  resizedY: boolean;
  fontSize: number;
  lineHeight: number;
  content: commentMeasuredContentItem[];
  charSize: number;
};
type parsedCommand = {
  loc: commentLoc | undefined;
  size: commentSize | undefined;
  fontSize: number | undefined;
  color: string | undefined;
  font: commentFont | undefined;
  full: boolean;
  ender: boolean;
  _live: boolean;
  invisible: boolean;
  long: number | undefined;
};

type measureTextInput = {
  content: commentContentItem[];
  resized?: boolean;
  ender: boolean;
  size: commentSize;
  fontSize: number;
  resizedY?: boolean;
  resizedX?: boolean;
  font: commentFont;
  loc: commentLoc;
  full: boolean;
  flash: boolean;
  lineCount: number;
  lineHeight?: number;
  charSize?: number;
};

type measureInput = {
  font: commentFont;
  content: commentContentItem[];
  lineHeight: number;
  charSize: number;
  lineCount: number;
};
