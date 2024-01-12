import type {
  Config,
  FormattedComment,
  FormattedLegacyComment,
  OwnerComment,
  RawApiResponse,
  V1Thread,
} from "@/@types/";

export type InputFormatType =
  | "XMLDocument"
  | "niconicome"
  | "formatted"
  | "legacy"
  | "legacyOwner"
  | "owner"
  | "v1"
  | "empty"
  | "default";
export type InputFormat =
  | XMLDocument
  | FormattedComment[]
  | FormattedLegacyComment[]
  | RawApiResponse[]
  | OwnerComment[]
  | V1Thread[]
  | string
  | undefined;
type ModeType = "default" | "html5" | "flash";
export type BaseOptions = {
  config: Config;
  debug: boolean;
  enableLegacyPiP: boolean;
  format: InputFormatType;
  formatted: boolean;
  keepCA: boolean;
  mode: ModeType;
  scale: number;
  showCollision: boolean;
  showCommentCount: boolean;
  showFPS: boolean;
  useLegacy: boolean;
  video: HTMLVideoElement | undefined;
  lazy: boolean;
};
export type Options = Partial<BaseOptions>;

/**
 * @deprecated
 */
export type inputFormatType = InputFormatType;
/**
 * @deprecated
 */
export type inputFormat = InputFormat;
