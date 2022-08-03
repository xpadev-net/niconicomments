type inputFormatType =
  | "niconicome"
  | "formatted"
  | "legacy"
  | "owner"
  | "v1"
  | "default";
type InitOptions = {
  useLegacy?: boolean;
  formatted?: boolean;
  format?: inputFormatType;
  video?: HTMLVideoElement | undefined;
  showCollision?: boolean;
  showFPS?: boolean;
  showCommentCount?: boolean;
  drawAllImageOnLoad?: boolean;
  debug?: boolean;
  enableLegacyPiP?: boolean;
  keepCA?: boolean;
};
type Options = {
  useLegacy: boolean;
  formatted: boolean;
  format: inputFormatType;
  video: HTMLVideoElement | undefined;
  showCollision: boolean;
  showFPS: boolean;
  showCommentCount: boolean;
  drawAllImageOnLoad: boolean;
  debug: boolean;
  enableLegacyPiP: boolean;
  keepCA: boolean;
};
type rawApiResponse = {
  [key: string]: apiPing | apiThread | apiLeaf | apiGlobalNumRes | apiChat;
};
type apiPing = {
  content: string;
};
type apiThread = {
  resultcode: number;
  thread: string;
  server_time: number;
  ticket: string;
  revision: number;
};
type apiLeaf = {
  thread: string;
  count: number;
};
type apiGlobalNumRes = {
  thread: string;
  num_res: number;
};
type apiChat = {
  thread: string;
  no: number;
  vpos: number;
  date: number;
  date_usec: number;
  nicoru: number;
  premium: number;
  anonymity: number;
  user_id: string;
  mail: string;
  content: string;
  deleted: number;
};
type formattedComment = {
  id: number;
  vpos: number;
  content: string;
  date: number;
  date_usec: number;
  owner: boolean;
  premium: boolean;
  mail: string[];
  user_id: number;
  layer: number;
};
type formattedLegacyComment = {
  id: number;
  vpos: number;
  content: string;
  date: number;
  date_usec: number;
  owner: boolean;
  premium: boolean;
  mail: string[];
};
type formattedCommentWithFont = formattedComment & {
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
};
type formattedCommentWithSize = formattedCommentWithFont & {
  height: number;
  width: number;
  width_max: number;
  width_min: number;
  lineHeight: number;
};
type parsedComment = formattedCommentWithSize & {
  posY: number;
  image?: HTMLCanvasElement | boolean;
};
type groupedResult = formattedCommentWithFont & {
  index: number;
};
type groupedComments = {
  [key in commentFont]: { [key: string]: groupedResult[] };
};
type commentFont = "defont" | "mincho" | "gothic";
type commentSize = "big" | "medium" | "small";
type commentLoc = "ue" | "naka" | "shita";
type posCollision = { [p: number]: number[] };
type collision = { [key in collisionPosList]: posCollision };
type collisionPosList = "ue" | "shita" | "right" | "left";
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
  width_max: number;
  width_min: number;
  height: number;
  resized: boolean;
  fontSize: number;
  lineHeight: number;
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
type typeFontSize = {
  [key in commentSize]: {
    default: number;
    resized: number;
  };
};
type typeDoubleResizeMaxWidth = {
  [key in "full" | "normal"]: {
    legacy: number;
    default: number;
  };
};
type v1Thread = {
  id: string;
  fork: string;
  commentCount: number;
  comments: { [key: string]: v1Comment };
};
type v1Comment = {
  id: string;
  no: number;
  vposMs: number;
  body: string;
  commands: string[];
  userId: string;
  isPremium: boolean;
  score: number;
  postedAt: string;
  nicoruCount: number;
  nicoruId: undefined;
  source: string;
  isMyPost: boolean;
};
type ownerComment = {
  time: string;
  command: string;
  comment: string;
};
