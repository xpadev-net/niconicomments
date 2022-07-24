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
  video?: HTMLVideoElement | null;
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
  video: HTMLVideoElement | null;
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
  loc: string;
  size: string;
  fontSize: number;
  font: string;
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
type measureTextResult = {
  width: number;
  width_max: number;
  width_min: number;
  height: number;
  resized: boolean;
  fontSize: number;
  lineHeight: number;
};
type T_fontSize = {
  [key: string]: {
    default: number;
    resized: number;
  };
};
type T_doubleResizeMaxWidth = {
  [key: string]: {
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
  nicoruId: null;
  source: string;
  isMyPost: boolean;
};
type ownerComment = {
  time: string;
  command: string;
  comment: string;
};
