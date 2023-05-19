import { FormattedCommentWithSize } from "@/@types";
import { config } from "@/definition/config";

/**
 * Hexからrgbに変換する(_live用)
 * @param hex カラコ
 * @returns RGB
 */
const hex2rgb = (hex: string) => {
  if (hex.slice(0, 1) === "#") hex = hex.slice(1);
  if (hex.length === 3)
    hex =
      hex.slice(0, 1) +
      hex.slice(0, 1) +
      hex.slice(1, 2) +
      hex.slice(1, 2) +
      hex.slice(2, 3) +
      hex.slice(2, 3);

  return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(function (
    str
  ) {
    return parseInt(str, 16);
  });
};
/**
 * Hexからrgbaに変換する(_live用)
 * @param hex カラコ
 * @returns RGB
 */
const hex2rgba = (hex: string) => {
  if (hex.slice(0, 1) === "#") hex = hex.slice(1);
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
    if (index === 3) return parseInt(str, 16) / 256;
    return parseInt(str, 16);
  });
};

/**
 * コメントの枠色を取得する
 * @param comment コメント
 * @returns 枠色
 */
const getStrokeColor = (comment: FormattedCommentWithSize) => {
  if (comment.strokeColor) {
    const length = comment.strokeColor.length;
    if (length === 3 || length === 6) {
      return `rgba(${hex2rgb(comment.strokeColor).join(",")},${
        config.contextStrokeOpacity
      })`;
    } else if (length === 4 || length === 8) {
      return `rgba(${hex2rgba(comment.strokeColor).join(",")})`;
    }
  }
  return `rgba(${hex2rgb(
    comment.color === "#000000"
      ? config.contextStrokeInversionColor
      : config.contextStrokeColor
  ).join(",")},${config.contextStrokeOpacity})`;
};

export { getStrokeColor, hex2rgb, hex2rgba };
