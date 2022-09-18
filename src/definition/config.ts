const defaultConfig: Config = {
  /**
   * コマンドとカラーコードの対応表
   */
  colors: {
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
  },

  commentYPaddingTop: 0.08,
  commentYMarginBottom: 0.24,

  /**
   * font-sizeに対しての倍率
   */
  fontSize: {
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
  },
  lineHeight: {
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
  },
  /**
   * 臨海+改行リサイズが発生した際(DR)の横幅最大値
   */
  doubleResizeMaxWidth: {
    full: {
      html5: 3020,
      default: 3550,
      flash: 3550,
    },
    normal: {
      html5: 2540,
      default: 2650,
      flash: 2650,
    },
  },
  /**
   * fillColorが#000000以外の時の枠線の色
   */
  contextStrokeColor: "#000000",
  /**
   * fillColorが#000000の時の枠線の色
   */
  contextStrokeInversionColor: "#FFFFFF",
  /**
   * 枠線の透明度
   */
  contextStrokeOpacity: 0.7,
  /**
   * _liveコマンドの透明度
   */
  contextFillLiveOpacity: 0.5,
  /**
   * 枠線の太さ
   */
  contextLineWidth: 4,

  /**
   * fpsを更新する間隔(ms)
   */
  fpsInterval: 500,

  /**
   * キャッシュの追加保持期間(ms)
   */
  cacheAge: 2000,

  /**
   * キャンバスの横幅
   */
  canvasWidth: 1920,
  /**
   * キャンバスの高さ
   */
  canvasHeight: 1080,
  /**
   * コメントの処理範囲
   */
  commentDrawRange: 1450,
  /**
   * コメントの処理範囲外(片側)の幅
   * (config.canvasWidth - config.commentDrawRange) / 2,
   */
  commentDrawPadding: 235,
  /**
   * 当たり判定の幅
   */
  collisionWidth: 40,
  /**
   * 当たり判定の左右幅
   * left: collisionWidth,
   * right: canvasWidth - collisionWidth
   */
  collisionRange: {
    left: 40,
    right: 1880,
  },
  /**
   * 同一CAと判定する投下経過時間の最大値(秒)
   */
  sameCARange: 3600,
  /**
   * 同一CAと判定するvposの範囲(vpos)
   */
  sameCAGap: 100,
  /**
   * レイヤーを分離する基準値
   */
  sameCAMinScore: 10,
};

/**
 * 既定の設定
 */
const defaultOptions: Options = {
  config: {},
  debug: false,
  drawAllImageOnLoad: false,
  enableLegacyPiP: false,
  format: "default",
  formatted: false,
  keepCA: false,
  mode: "default",
  scale: 1,
  showCollision: false,
  showCommentCount: false,
  showFPS: false,
  useLegacy: false,
  video: undefined,
};

let config: Config;
let options: Options;
const setConfig = (value: Config) => (config = value);
const setOptions = (value: Options) => (options = value);
export {
  defaultConfig,
  defaultOptions,
  config,
  options,
  setConfig,
  setOptions,
};
