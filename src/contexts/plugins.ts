import type { IPlugin } from "@/@types/";

let plugins: IPlugin[] = [];
const setPlugins = (input: IPlugin[]) => {
  plugins = input;
};
export { plugins, setPlugins };
