import type { Output } from "valibot";
import {
  array,
  boolean,
  intersect,
  literal,
  number,
  object,
  optional,
  string,
  union,
} from "valibot";

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
  is_my_post: boolean;
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

export const ZCommentFont = union([
  literal("defont"),
  literal("mincho"),
  literal("gothic"),
  literal("gulim"),
  literal("simsun"),
]);
export type CommentFont = Output<typeof ZCommentFont>;

export const ZCommentHTML5Font = union([
  literal("defont"),
  literal("mincho"),
  literal("gothic"),
]);
export type CommentHTML5Font = Output<typeof ZCommentHTML5Font>;

export const ZCommentFlashFont = union([
  literal("defont"),
  literal("gulim"),
  literal("simsun"),
]);
export type CommentFlashFont = Output<typeof ZCommentFlashFont>;

export const ZCommentContentItemSpacer = object({
  type: literal("spacer"),
  char: string(),
  charWidth: number(),
  isButton: optional(boolean()),
  font: optional(ZCommentFlashFont),
  count: number(),
});

export const ZCommentContentItemText = object({
  type: literal("text"),
  content: string(),
  slicedContent: array(string()),
  isButton: optional(boolean()),
  font: optional(ZCommentFlashFont),
  width: optional(array(number())),
});
export type CommentContentItemText = Output<typeof ZCommentContentItemText>;

export const ZCommentContentItem = union([
  ZCommentContentItemSpacer,
  ZCommentContentItemText,
]);
export type CommentContentItem = Output<typeof ZCommentContentItem>;
export const ZCommentMeasuredContentItemText = intersect([
  ZCommentContentItem,
  object({
    width: array(number()),
  }),
]);

export const ZCommentMeasuredContentItem = union([
  ZCommentMeasuredContentItemText,
  ZCommentContentItemSpacer,
]);
export type CommentMeasuredContentItem = Output<
  typeof ZCommentMeasuredContentItem
>;
export type CommentFlashFontParsed =
  | "gothic"
  | "gulim"
  | "simsunStrong"
  | "simsunWeak";
export type CommentContentIndex = {
  index: number;
  font: CommentFlashFontParsed;
};
export const ZCommentSize = union([
  literal("big"),
  literal("medium"),
  literal("small"),
]);
export type CommentSize = Output<typeof ZCommentSize>;
export const ZCommentLoc = union([
  literal("ue"),
  literal("naka"),
  literal("shita"),
]);
export type CommentLoc = Output<typeof ZCommentLoc>;
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
export const ZNicoScriptReverseTarget = union([
  literal("\u30b3\u30e1"), //コメ
  literal("\u6295\u30b3\u30e1"), //投コメ
  literal("\u5168"), //全
]);
export type NicoScriptReverseTarget = Output<typeof ZNicoScriptReverseTarget>;
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
export const ZNicoScriptReplaceRange = union([
  literal("\u5358"), //単
  literal("\u5168"), //全
]);
export type NicoScriptReplaceRange = Output<typeof ZNicoScriptReplaceRange>;
export const ZNicoScriptReplaceTarget = union([
  literal("\u30b3\u30e1"), //コメ
  literal("\u6295\u30b3\u30e1"), //投コメ
  literal("\u5168"), //全
  literal("\u542b\u307e\u306a\u3044"), //含まない
  literal("\u542b\u3080"), //含む
]);
export type NicoScriptReplaceTarget = Output<typeof ZNicoScriptReplaceTarget>;
export const ZNicoScriptReplaceCondition = union([
  literal("\u90e8\u5206\u4e00\u81f4"), //部分一致
  literal("\u5b8c\u5168\u4e00\u81f4"), //完全一致
]);
export type NicoScriptReplaceCondition = Output<
  typeof ZNicoScriptReplaceCondition
>;
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

export const ZMeasureInput = object({
  font: ZCommentFont,
  content: array(ZCommentContentItem),
  lineHeight: number(),
  charSize: number(),
  lineCount: number(),
});
export type MeasureInput = Output<typeof ZMeasureInput>;

export type ValueOf<T> = T[keyof T];
