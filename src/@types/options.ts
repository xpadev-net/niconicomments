import type { Output } from "valibot";
import { literal, union } from "valibot";

import type {
  Config,
  FormattedComment,
  FormattedLegacyComment,
  OwnerComment,
  RawApiResponse,
  V1Thread,
  Xml2jsPacket,
} from "@/@types/";

export const ZInputFormatType = union([
  literal("XMLDocument"),
  literal("niconicome"),
  literal("xml2js"),
  literal("formatted"),
  literal("legacy"),
  literal("legacyOwner"),
  literal("owner"),
  literal("v1"),
  literal("empty"),
  literal("default"),
]);
export type InputFormatType = Output<typeof ZInputFormatType>;

export type InputFormat =
  | XMLDocument
  | Xml2jsPacket
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
