import type { ButtonList, IComment } from "@/@types/";

export type FormattedCommentWithFont = {
  id: number;
  vpos: number;
  date: number;
  date_usec: number;
  owner: boolean;
  premium: boolean;
  mail: string[];
  user_id: number;
  layer: number;
  loc: CommentLoc;
  size: CommentSize;
  fontSize: number;
  font: CommentFont;
  color: string;
  strokeColor?: string;
  wakuColor?: string;
  fillColor?: string;
  full: boolean;
  ender: boolean;
  _live: boolean;
  long: number;
  invisible: boolean;
  content: CommentContentItem[];
  rawContent: string;
  flash: boolean;
  lineCount: number;
  lineOffset: number;
  button?: ButtonParams;
};
export type FormattedCommentWithSize = FormattedCommentWithFont & {
  height: number;
  width: number;
  lineHeight: number;
  resized: boolean;
  resizedX: boolean;
  resizedY: boolean;
  content: CommentMeasuredContentItem[];
  charSize: number;
  scale: number;
  scaleX: number;
  buttonObjects?: ButtonList;
};
export type ParseContentResult = {
  content: CommentContentItem[];
  lineCount: number;
  lineOffset: number;
};
export type ParseCommandAndNicoScriptResult = {
  flash: boolean;
  loc: CommentLoc;
  size: CommentSize;
  fontSize: number;
  color: string;
  strokeColor?: string;
  wakuColor?: string;
  fillColor?: string;
  font: CommentFont;
  full: boolean;
  ender: boolean;
  _live: boolean;
  invisible: boolean;
  long: number;
  button?: ButtonParams;
};
export type CommentContentItem = {
  content: string;
  slicedContent: string[];
  isButton?: boolean;
  font?: CommentFlashFont;
  width?: number[];
};
export type CommentMeasuredContentItem = CommentContentItem & {
  width: number[];
};
export type CommentFlashFontParsed =
  | "gothic"
  | "gulim"
  | "simsunStrong"
  | "simsunWeak";
export type CommentContentIndex = {
  index: number;
  font: CommentFlashFontParsed;
};
export type CommentFont = "defont" | "mincho" | "gothic" | "gulim" | "simsun";
export type CommentFlashFont = "defont" | "gulim" | "simsun";
export type CommentSize = "big" | "medium" | "small";
export type CommentLoc = "ue" | "naka" | "shita";
export type Collision = { [key in CollisionPos]: CollisionItem };
export type Timeline = { [key: number]: IComment[] };
export type CollisionPos = "ue" | "shita" | "right" | "left";
export type CollisionItem = { [p: number]: IComment[] };
export type NicoScript = {
  reverse: NicoScriptReverse[];
  ban: NicoScriptBan[];
  default: NicoScriptDefault[];
  replace: NicoScriptReplace[];
  seekDisable: NicoScriptSeekDisable[];
  jump: NicoScriptJump[];
};
type NicoScriptSeekDisable = {
  start: number;
  end: number;
};
type NicoScriptJump = {
  start: number;
  end?: number;
  to: string;
  message?: string;
};
type NicoScriptReverse = {
  target: NicoScriptReverseTarget;
  start: number;
  end: number;
};
export type NicoScriptReverseTarget = "コメ" | "投コメ" | "全";
export type NicoScriptReplace = {
  start: number;
  long: number | undefined;
  keyword: string;
  replace: string;
  range: NicoScriptReplaceRange;
  target: NicoScriptReplaceTarget;
  condition: NicoScriptReplaceCondition;
  color: string | undefined;
  size: CommentSize | undefined;
  font: CommentFont | undefined;
  loc: CommentLoc | undefined;
  no: number;
};
export type NicoScriptReplaceRange = "単" | "全";
export type NicoScriptReplaceTarget =
  | "コメ"
  | "投コメ"
  | "全"
  | "含まない"
  | "含む";
export type NicoScriptReplaceCondition = "完全一致" | "部分一致";
type NicoScriptBan = {
  start: number;
  end: number;
};
type NicoScriptDefault = {
  start: number;
  long: number | undefined;
  color: string | undefined;
  size: CommentSize | undefined;
  font: CommentFont | undefined;
  loc: CommentLoc | undefined;
};
export type MeasureTextResult = {
  width: number;
  height: number;
  resized: boolean;
  resizedX: boolean;
  resizedY: boolean;
  fontSize: number;
  lineHeight: number;
  content: CommentMeasuredContentItem[];
  charSize: number;
  scaleX: number;
  scale: number;
};

export type ButtonParams = {
  message: {
    before: string;
    body: string;
    after: string;
  }; //表示するボタンの内容
  commentMessage: string; //コメントの内容
  commentMail: string[]; //コメントのコマンド → 未指定時は色のみ継承
  commentVisible: boolean; //コメントを投稿するか
  limit: number; //ボタンの使用上限
  local: boolean; //ローカルコメントか
  hidden: boolean; //通常のコメントのように表示するか
};

export type ParsedCommand = {
  loc: CommentLoc | undefined;
  size: CommentSize | undefined;
  fontSize: number | undefined;
  color: string | undefined;
  strokeColor?: string;
  wakuColor?: string;
  fillColor?: string;
  font: CommentFont | undefined;
  full: boolean;
  ender: boolean;
  _live: boolean;
  invisible: boolean;
  long: number | undefined;
  button?: ButtonParams;
};

export type MeasureTextInput = FormattedCommentWithFont & {
  resized?: boolean;
  resizedY?: boolean;
  resizedX?: boolean;
  lineHeight?: number;
  charSize?: number;
  scale: number;
};

export type MeasureInput = {
  font: CommentFont;
  content: CommentContentItem[];
  lineHeight: number;
  charSize: number;
  lineCount: number;
};

export type ValueOf<T> = T[keyof T];
