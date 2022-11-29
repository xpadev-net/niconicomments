type inputFormatType =
  | "niconicome"
  | "formatted"
  | "legacy"
  | "legacyOwner"
  | "owner"
  | "v1"
  | "empty"
  | "default";
type inputFormat =
  | XMLDocument
  | formattedComment[]
  | formattedLegacyComment[]
  | rawApiResponse[]
  | ownerComment[]
  | v1Thread[]
  | string
  | undefined;
type modeType = "default" | "html5" | "flash";
type Options = {
  config: ConfigNullable;
  debug: boolean;
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
type InitOptions = Partial<Options>;
