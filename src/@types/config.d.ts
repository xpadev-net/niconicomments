type configItem<T> = T | { html5: T; flash: T };
type configSizeItem<T> = { big: T; medium: T; small: T };
type configResizedItem<T> = { default: T; resized: T };

type commentStageSize = { width: number; fullWidth: number; height: number };

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
type lineCounts = {
  [key in "default" | "resized" | "doubleResized"]: configSizeItem<number>;
};
type typeDoubleResizeMaxWidth = {
  [key in "full" | "normal"]: number;
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
  commentScale: configItem<number>;
  commentStageSize: configItem<commentStageSize>;
  commentYPadding: configResizedItem<number>;
  commentYOffset: number;
  contextFillLiveOpacity: number;
  contextLineWidth: number;
  contextStrokeColor: string;
  contextStrokeInversionColor: string;
  contextStrokeOpacity: number;
  flashChar: flashCharList;
  flashMode: flashMode;
  flashScriptChar: flashScriptChar;
  flashThreshold: number;
  font: fontList;
  fonts: platformFont;
  fontSize: configItem<configSizeItem<configResizedItem<number>>>;
  fpsInterval: number;
  lineCounts: configItem<lineCounts>;
  hiResCommentCorrection: number;
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
