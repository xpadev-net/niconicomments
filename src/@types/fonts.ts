import type { Output } from "valibot";
import { literal, union } from "valibot";

export type Platform =
  | "win7"
  | "win8_1"
  | "win"
  | "mac10_9"
  | "mac10_11"
  | "mac"
  | "other";
export const ZHTML5Fonts = union([
  literal("gothic"),
  literal("mincho"),
  literal("defont"),
]);
export type HTML5Fonts = Output<typeof ZHTML5Fonts>;
export type FontItem = {
  font: string;
  offset: number;
  weight: number;
};
export type PlatformFont = {
  [key in HTML5Fonts]: FontItem;
};
