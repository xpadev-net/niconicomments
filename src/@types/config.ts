import type { BaseSchema } from "valibot";
import { object } from "valibot";

import type {
  CommentSize,
  FormattedComment,
  IPluginConstructor,
  PlatformFont,
} from "@/@types/";
import type { BaseComment } from "@/comments/";

export type ConfigItem<T> = T | MultiConfigItem<T>;

export const ZMultiConfigItem = (item: BaseSchema) =>
  object({
    html5: item,
    flash: item,
  });
export type MultiConfigItem<T> = { html5: T; flash: T };
type ConfigSizeItem<T> = { big: T; medium: T; small: T };
type ConfigResizedItem<T> = { default: T; resized: T };
type ConfigFlashFontItem<T> = { gulim: T; simsun: T; defont: T };
type ConfigHTML5FontItem<T> = { gothic: T; mincho: T; defont: T };

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

export type BaseConfig = {
  cacheAge: number;
  canvasHeight: number;
  canvasWidth: number;
  collisionRange: { [key in "left" | "right"]: number };
  collisionPadding: number;
  colors: { [key: string]: string };
  commentDrawPadding: number;
  commentDrawRange: number;
  commentScale: ConfigItem<number>;
  commentStageSize: ConfigItem<CommentStageSize>;
  flashCommentYOffset: ConfigSizeItem<ConfigResizedItem<number>>;
  flashCommentYPaddingTop: ConfigResizedItem<number>;
  contextFillLiveOpacity: number;
  contextLineWidth: ConfigItem<number>;
  contextStrokeColor: string;
  contextStrokeInversionColor: string;
  contextStrokeOpacity: number;
  flashChar: FlashCharList;
  flashMode: FlashMode;
  flashScriptChar: FlashScriptChar;
  flashThreshold: number;
  fonts: {
    flash: FontList;
    html5: PlatformFont;
  };
  fontSize: ConfigItem<ConfigSizeItem<ConfigResizedItem<number>>>;
  fpsInterval: number;
  html5HiResCommentCorrection: number;
  html5LineCounts: ConfigItem<LineCounts>;
  lineHeight: ConfigItem<ConfigSizeItem<ConfigResizedItem<number>>>;
  html5MinFontSize: number;
  sameCAGap: number;
  sameCAMinScore: number;
  sameCARange: number;
  sameCATimestampRange: number;
  flashLetterSpacing: number;
  flashScriptCharOffset: number;
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
  flashDoubleResizeHeights: Partial<
    ConfigSizeItem<{
      [key: number]: number;
    }>
  >;
  flashLineBreakScale: ConfigSizeItem<number>;
  compatSpacer: {
    flash: {
      [key: string]: Partial<ConfigFlashFontItem<number>>;
    };
    html5: {
      [key: string]: Partial<ConfigHTML5FontItem<number>>;
    };
  };
};

export type Config = Partial<BaseConfig>;
