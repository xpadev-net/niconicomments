import type { IPlugin } from "@/@types/IPlugins";

let plugins: IPlugin[] = [];
const setPlugins = (input: IPlugin[]) => {
  plugins = input;
};
export { plugins, setPlugins };
