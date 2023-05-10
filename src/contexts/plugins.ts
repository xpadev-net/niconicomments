import type { IPlugin } from "@/@types/";

let plugins: IPlugin[] = [];

/**
 * プラグインを設定する
 * @param input プラグインの配列
 */
const setPlugins = (input: IPlugin[]) => {
  plugins = input;
};
export { plugins, setPlugins };
