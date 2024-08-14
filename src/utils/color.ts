import type { FormattedCommentWithSize } from "@/@types";
import { config } from "@/definition/config";

/**
 * Hexからrgbに変換する(_live用)
 * @param _hex カラコ
 * @returns RGB
 */
const hex2rgb = (_hex: string) => {
  let hex = _hex;
  if (hex.startsWith("#")) hex = hex.slice(1);
  if (hex.length === 3)
    hex =
      hex.slice(0, 1) +
      hex.slice(0, 1) +
      hex.slice(1, 2) +
      hex.slice(1, 2) +
      hex.slice(2, 3) +
      hex.slice(2, 3);

  return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map((str) =>
    Number.parseInt(str, 16),
  );
};
/**
 * Hexからrgbaに変換する(_live用)
 * @param _hex カラコ
 * @returns RGB
 */
const hex2rgba = (_hex: string) => {
  let hex = _hex;
  if (hex.startsWith("#")) hex = hex.slice(1);
  if (hex.length === 4)
    hex =
      hex.slice(0, 1) +
      hex.slice(0, 1) +
      hex.slice(1, 2) +
      hex.slice(1, 2) +
      hex.slice(2, 3) +
      hex.slice(2, 3) +
      hex.slice(3, 4) +
      hex.slice(3, 4);

  return [
    hex.slice(0, 2),
    hex.slice(2, 4),
    hex.slice(4, 6),
    hex.slice(4, 6),
  ].map((str, index) => {
    if (index === 3) return Number.parseInt(str, 16) / 256;
    return Number.parseInt(str, 16);
  });
};

/**
 * コメントの枠色を取得する
 * @param comment コメント
 * @returns 枠色
 */
const getStrokeColor = (comment: FormattedCommentWithSize) => {
  if (comment.strokeColor) {
    const color = comment.strokeColor.slice(1);
    const length = color.length;
    if (length === 3 || length === 6) {
      return `rgba(${hex2rgb(color).join(",")},${config.contextStrokeOpacity})`;
    }
    if (length === 4 || length === 8) {
      return `rgba(${hex2rgba(color).join(",")})`;
    }
  }
  return `rgba(${hex2rgb(
    comment.color === "#000000"
      ? config.contextStrokeInversionColor
      : config.contextStrokeColor,
  ).join(",")},${config.contextStrokeOpacity})`;
};

export { getStrokeColor, hex2rgb, hex2rgba };
