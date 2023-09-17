import { ConfigItem } from "@/@types";
import typeGuard from "@/typeGuard";

/**
 * Configがhtml5とflashで別れてる場合は対応するものを、そうでなければ初期値を返す
 * @template T
 * @param input コンフィグアイテム
 * @param isFlash Flashかどうか
 * @returns コンフィグアイテムの値
 */
const getConfig = <T>(input: ConfigItem<T>, isFlash = false): T => {
  if (typeGuard.internal.MultiConfigItem(input)) {
    return input[isFlash ? "flash" : "html5"];
  }
  return input;
};

export { getConfig };
