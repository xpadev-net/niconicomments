type platform =
  | "win7"
  | "win8_1"
  | "win"
  | "mac10_9"
  | "mac10_11"
  | "mac"
  | "other";
type HTML5Fonts = "gothic" | "mincho" | "defont";
type FontItem = {
  font: string;
  offset: number;
  weight: number;
};
type platformFont = {
  [key in HTML5Fonts]: FontItem;
};
