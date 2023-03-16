import { IPluginConstructor } from "@/@types/IPlugins";
import { commentSize } from "@/@types/types";

type configItem<T> = T | { html5: T; flash: T };
type configSizeItem<T> = { big: T; medium: T; small: T };
type configResizedItem<T> = { default: T; resized: T };

type commentStageSize = { width: number; fullWidth: number; height: number };

type flashCharList = {
  [key in "simsunStrong" | "simsunWeak" | "gulim" | "gothic"]: string;
};
type flashMode = "xp" | "vista";
type flashScriptChar = {
  [key in "super" | "sub"]: string;
};
type fontList = {
  [key in "gulim" | "simsun"]: string;
};
type lineCounts = {
  [key in "default" | "resized" | "doubleResized"]: configSizeItem<number>;
};
type typeDoubleResizeMaxWidth = {
  [key in "full" | "normal"]: number;
};

type BaseConfig = {
  cacheAge: number;
  canvasHeight: number;
  canvasWidth: number;
  collisionRange: { [key in "left" | "right"]: number };
  colors: { [key: string]: string };
  commentDrawPadding: number;
  commentDrawRange: number;
  commentScale: configItem<number>;
  commentStageSize: configItem<commentStageSize>;
  commentYMarginBottom: configSizeItem<number>;
  commentYOffset: configSizeItem<configResizedItem<number>>;
  commentYPaddingTop: configResizedItem<number>;
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
  hiResCommentCorrection: number;
  lineCounts: configItem<lineCounts>;
  lineHeight: configItem<configSizeItem<configResizedItem<number>>>;
  minFontSize: number;
  sameCAGap: number;
  sameCAMinScore: number;
  sameCARange: number;
  letterSpacing: number;
  scriptCharOffset: number;
  plugins: IPluginConstructor[];
  commentLimit: number | undefined;
  hideCommentOrder: "asc" | "desc";
  lineBreakCount: { [key in commentSize]: number };
};

export type Config = Partial<BaseConfig>;
