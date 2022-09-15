/**
 * コマンドとカラーコードの対応表
 */
const colors: { [key: string]: string } = {
  white: "#FFFFFF",
  red: "#FF0000",
  pink: "#FF8080",
  orange: "#FFC000",
  yellow: "#FFFF00",
  green: "#00FF00",
  cyan: "#00FFFF",
  blue: "#0000FF",
  purple: "#C000FF",
  black: "#000000",
  white2: "#CCCC99",
  niconicowhite: "#CCCC99",
  red2: "#CC0033",
  truered: "#CC0033",
  pink2: "#FF33CC",
  orange2: "#FF6600",
  passionorange: "#FF6600",
  yellow2: "#999900",
  madyellow: "#999900",
  green2: "#00CC66",
  elementalgreen: "#00CC66",
  cyan2: "#00CCCC",
  blue2: "#3399FF",
  marinblue: "#3399FF",
  purple2: "#6633CC",
  nobleviolet: "#6633CC",
  black2: "#666666",
};
const commentYPaddingTop = 0.08;
const commentYMarginBottom = 0.24;
/**
 * font-size
 */
const fontSize: typeFontSize = {
  small: {
    default: 47,
    resized: 26.1,
  },
  medium: {
    default: 74,
    resized: 38.7,
  },
  big: {
    default: 110,
    resized: 61,
  },
};
/**
 * font-sizeに対しての倍率
 */
const lineHeight: typeFontSize = {
  small: {
    default: 1,
    resized: 1,
  },
  medium: {
    default: 1,
    resized: 1,
  },
  big: {
    default: 1.03,
    resized: 1.01,
  },
};
/**
 * 臨海+改行リサイズが発生した際(DR)の横幅最大値
 */
const doubleResizeMaxWidth: typeDoubleResizeMaxWidth = {
  full: {
    legacy: 3020,
    default: 3550,
  },
  normal: {
    legacy: 2540,
    default: 2650,
  },
};
/**
 * 既定の設定
 */
const defaultOptions: Options = {
  drawAllImageOnLoad: false,
  format: "default",
  formatted: false,
  debug: false,
  enableLegacyPiP: false,
  keepCA: false,
  showCollision: false,
  showCommentCount: false,
  showFPS: false,
  useLegacy: false,
  video: undefined,
};
/**
 * fpsを更新する間隔(ms)
 */
const fpsInterval = 500;
/**
 * キャッシュの追加保持期間(ms)
 */
const cacheAge = 2000;
/**
 * キャンバスの横幅
 */
const canvasWidth = 1920;
/**
 * キャンバスの高さ
 */
const canvasHeight = 1080;
/**
 * コメントの処理範囲
 */
const commentDrawRange = 1450;
/**
 * コメントの処理範囲外(片側)の幅
 */
const commentDrawPadding = (canvasWidth - commentDrawRange) / 2;
/**
 * 当たり判定の幅
 */
const collisionWidth = 40;
/**
 * 当たり判定の左右幅
 */
const collisionRange = {
  left: collisionWidth,
  right: canvasWidth - collisionWidth,
};
/**
 * 同一CAと判定する投下経過時間の最大値(秒)
 */
const sameCARange = 3600;
/**
 * 同一CAと判定するvposの範囲(vpos)
 */
const sameCAGap = 100;
/**
 * レイヤーを分離する基準値
 */
const sameCAMinScore = 10;

export {
  colors,
  commentYMarginBottom,
  commentYPaddingTop,
  fontSize,
  lineHeight,
  doubleResizeMaxWidth,
  defaultOptions,
  fpsInterval,
  cacheAge,
  canvasWidth,
  canvasHeight,
  commentDrawRange,
  commentDrawPadding,
  collisionRange,
  sameCARange,
  sameCAGap,
  sameCAMinScore,
};