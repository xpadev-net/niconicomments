export type platform =
  | "win7"
  | "win8_1"
  | "win"
  | "mac10_9"
  | "mac10_11"
  | "mac"
  | "other";
export type HTML5Fonts = "gothic" | "mincho" | "defont";
export type FontItem = {
  font: string;
  offset: number;
  weight: number;
};
export type platformFont = {
  [key in HTML5Fonts]: FontItem;
};
