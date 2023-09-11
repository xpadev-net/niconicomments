import type { IPluginList } from "@/@types/";

let plugins: IPluginList = [];

/**
 * プラグインを設定する
 * @param input プラグインの配列
 */
const setPlugins = (input: IPluginList) => {
  plugins = input;
};
export { plugins, setPlugins };
