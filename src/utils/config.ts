import { configItem } from "@/@types";

/**
 * Configがhtml5とflashで別れてる場合は対応するものを、そうでなければ初期値を返す
 * @param {configItem} input
 * @param {boolean} isFlash
 */
const getConfig = <T>(input: configItem<T>, isFlash = false): T => {
  if (
    Object.prototype.hasOwnProperty.call(input, "html5") &&
    Object.prototype.hasOwnProperty.call(input, "flash")
  ) {
    return (input as { [key in "html5" | "flash"]: T })[
      isFlash ? "flash" : "html5"
    ];
  } else {
    return input as T;
  }
};

export { getConfig };
