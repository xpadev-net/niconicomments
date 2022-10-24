type inputFormatType =
  | "niconicome"
  | "formatted"
  | "legacy"
  | "legacyOwner"
  | "owner"
  | "v1"
  | "default";
type modeType = "default" | "html5" | "flash";
type InitOptions = {
  config?: ConfigNullable;
  debug?: boolean;
  drawAllImageOnLoad?: boolean;
  enableLegacyPiP?: boolean;
  format?: inputFormatType;
  formatted?: boolean;
  keepCA?: boolean;
  mode?: modeType;
  scale?: number;
  showCollision?: boolean;
  showCommentCount?: boolean;
  showFPS?: boolean;
  useLegacy?: boolean;
  video?: HTMLVideoElement | undefined;
};
type Options = {
  config: ConfigNullable;
  debug: boolean;
  drawAllImageOnLoad: boolean;
  enableLegacyPiP: boolean;
  format: inputFormatType;
  formatted: boolean;
  keepCA: boolean;
  mode: modeType;
  scale: number;
  showCollision: boolean;
  showCommentCount: boolean;
  showFPS: boolean;
  useLegacy: boolean;
  video: HTMLVideoElement | undefined;
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
type groupedResult = formattedCommentWithFont & {
  index: number;
};
type groupedComments = {
  [key in commentFont]: { [key: string]: groupedResult[] };
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

interface measureTextInput {
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
}

interface measureTextParam extends measureTextInput {
  lineHeight: number;
  charSize: number;
}

type measureInput = {
  font: commentFont;
  content: commentContentItem[];
  lineHeight: number;
  charSize: number;
  lineCount: number;
};

type typeFontSize = {
  [key in commentSize]: {
    default: number;
    resized: number;
  };
};
type typeDoubleResizeMaxWidth = {
  [key in "full" | "normal"]: number;
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
type flashCharList = {
  [key in "simsunStrong" | "simsunWeak" | "gulim" | "gothic"]: string;
};
type fontList = {
  [key in "gulim" | "simsun"]: string;
};
type flashMode = "xp" | "vista";
type flashScriptChar = {
  [key in "super" | "sub"]: string;
};
type commentStageSize = { width: number; fullWidth: number; height: number };
type lineCounts = {
  [key in "default" | "resized" | "doubleResized"]: configSizeItem<number>;
};
type platform =
  | "win7"
  | "win8_1"
  | "win"
  | "mac10_9"
  | "mac10_11"
  | "mac"
  | "other";
type HTML5Fonts = "gothic" | "mincho" | "defont";
type FontItem = {
  font: string;
  offset: number;
  weight: number;
};
type platformFont = {
  [key in HTML5Fonts]: FontItem;
};
type Config = {
  cacheAge: number;
  canvasHeight: number;
  canvasWidth: number;
  collisionRange: { [key in "left" | "right"]: number };
  collisionWidth: number;
  colors: { [key: string]: string };
  commentDrawPadding: configItem<number>;
  commentDrawRange: configItem<number>;
  commentResizeStep: configItem<number>;
  commentScale: configItem<number>;
  commentStageSize: configItem<commentStageSize>;
  commentYMarginBottom: configItem<configSizeItem<number>>;
  commentYOffset: configItem<configSizeItem<configResizedItem<number>>>;
  commentYPaddingTop: configItem<configSizeItem<configResizedItem<number>>>;
  contextFillLiveOpacity: number;
  contextLineWidth: number;
  contextStrokeColor: string;
  contextStrokeInversionColor: string;
  contextStrokeOpacity: number;
  doubleResizeMaxWidth: configItem<typeDoubleResizeMaxWidth>;
  flashChar: flashCharList;
  flashMode: flashMode;
  flashScriptChar: flashScriptChar;
  flashThreshold: number;
  font: fontList;
  fonts: platformFont;
  fontSize: configItem<configSizeItem<configResizedItem<number>>>;
  fpsInterval: number;
  lineCounts: configItem<lineCounts>;
  lineHeight: configItem<configSizeItem<configResizedItem<number>>>;
  minFontSize: number;
  sameCAGap: number;
  sameCAMinScore: number;
  sameCARange: number;
};

type ConfigNullable = {
  cacheAge?: number;
  canvasHeight?: number;
  canvasWidth?: number;
  collisionRange?: { [key in "left" | "right"]: number };
  collisionWidth?: number;
  colors?: { [key: string]: string };
  commentDrawPadding?: configItem<number>;
  commentDrawRange?: configItem<number>;
  commentResizeStep?: configItem<number>;
  commentScale?: configItem<number>;
  commentStageSize?: configItem<commentStageSize>;
  commentYMarginBottom?: configItem<configSizeItem<number>>;
  commentYOffset?: configItem<configSizeItem<number>>;
  commentYPaddingTop?: configItem<configSizeItem<configResizedItem<number>>>;
  contextFillLiveOpacity?: number;
  contextLineWidth?: number;
  contextStrokeColor?: string;
  contextStrokeInversionColor?: string;
  contextStrokeOpacity?: number;
  doubleResizeMaxWidth?: configItem<typeDoubleResizeMaxWidth>;
  flashChar?: flashCharList;
  flashMode?: flashMode;
  flashScriptChar?: flashScriptChar;
  flashThreshold?: number;
  font?: fontList;
  fontSize?: configItem<configSizeItem<configResizedItem<number>>>;
  fpsInterval?: number;
  lineCounts?: configItem<lineCounts>;
  lineHeight?: configItem<configSizeItem<configResizedItem<number>>>;
  minFontSize?: number;
  sameCAGap?: number;
  sameCAMinScore?: number;
  sameCARange?: number;
};

type configItem<T> = T | { html5: T; flash: T };

type configSizeItem<T> = { big: T; medium: T; small: T };
type configResizedItem<T> = { default: T; resized: T };
type configFullItem<T> = { default: T; full: T };

type ConfigKeys =
  | "colors"
  | "commentYPaddingTop"
  | "commentYMarginBottom"
  | "fontSize"
  | "lineHeight"
  | "doubleResizeMaxWidth"
  | "fpsInterval"
  | "cacheAge"
  | "canvasWidth"
  | "canvasHeight"
  | "commentDrawRange"
  | "commentDrawPadding"
  | "collisionWidth"
  | "collisionRange"
  | "sameCARange"
  | "sameCAGap"
  | "sameCAMinScore";

type T_Type =
  | "string"
  | "number"
  | "bigint"
  | "boolean"
  | "symbol"
  | "undefined"
  | "object"
  | "function";
