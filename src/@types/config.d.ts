import type {
  CommentSize,
  FormattedComment,
  IPluginConstructor,
  PlatformFont,
} from "@/@types/";
import type { BaseComment } from "@/comments/";

export type ConfigItem<T> = T | MultiConfigItem<T>;
export type MultiConfigItem<T> = { html5: T; flash: T };
type ConfigSizeItem<T> = { big: T; medium: T; small: T };
type ConfigResizedItem<T> = { default: T; resized: T };

export type CommentStageSize = {
  width: number;
  fullWidth: number;
  height: number;
};

type FlashCharList = {
  [key in "simsunStrong" | "simsunWeak" | "gulim" | "gothic"]: string;
};
export type FlashMode = "xp" | "vista";
export type FlashScriptChar = {
  [key in "super" | "sub"]: string;
};
type FontList = {
  [key in "gulim" | "simsun"]: string;
};
type LineCounts = {
  [key in "default" | "resized" | "doubleResized"]: ConfigSizeItem<number>;
};
type TypeDoubleResizeMaxWidth = {
  [key in "full" | "normal"]: number;
};

export type BaseConfig = {
  cacheAge: number;
  canvasHeight: number;
  canvasWidth: number;
  collisionRange: { [key in "left" | "right"]: number };
  colors: { [key: string]: string };
  commentDrawPadding: number;
  commentDrawRange: number;
  commentScale: ConfigItem<number>;
  CommentStageSize: ConfigItem<CommentStageSize>;
  commentYMarginBottom: ConfigSizeItem<number>;
  commentYOffset: ConfigSizeItem<ConfigResizedItem<number>>;
  commentYPaddingTop: ConfigResizedItem<number>;
  contextFillLiveOpacity: number;
  contextLineWidth: ConfigItem<number>;
  contextStrokeColor: string;
  contextStrokeInversionColor: string;
  contextStrokeOpacity: number;
  doubleResizeMaxWidth: ConfigItem<TypeDoubleResizeMaxWidth>;
  flashChar: FlashCharList;
  FlashMode: FlashMode;
  FlashScriptChar: FlashScriptChar;
  flashThreshold: number;
  font: FontList;
  fonts: PlatformFont;
  fontSize: ConfigItem<ConfigSizeItem<ConfigResizedItem<number>>>;
  fpsInterval: number;
  hiResCommentCorrection: number;
  lineCounts: ConfigItem<LineCounts>;
  lineHeight: ConfigItem<ConfigSizeItem<ConfigResizedItem<number>>>;
  minFontSize: number;
  sameCAGap: number;
  sameCAMinScore: number;
  sameCARange: number;
  sameCATimestampRange: number;
  letterSpacing: number;
  scriptCharOffset: number;
  plugins: IPluginConstructor[];
  commentPlugins: {
    class: typeof BaseComment;
    condition: (comment: FormattedComment) => boolean;
  }[];
  commentLimit: number | undefined;
  hideCommentOrder: "asc" | "desc";
  lineBreakCount: { [key in CommentSize]: number };
  nakaCommentSpeedOffset: number;
  atButtonPadding: number;
  atButtonRadius: number;
};

export type Config = Partial<BaseConfig>;
