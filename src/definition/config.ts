import type { BaseConfig } from "@/@types/config";
import type { BaseOptions } from "@/@types/options";
let defaultConfig: BaseConfig;
const updateConfig = (config: BaseConfig) => {
  defaultConfig = config;
};

/**
 * 既定の設定
 */
const defaultOptions: BaseOptions = {
  config: {},
  debug: false,
  enableLegacyPiP: false,
  format: "default",
  formatted: false,
  keepCA: false,
  mode: "default",
  scale: 1,
  showCollision: false,
  showCommentCount: false,
  showFPS: false,
  useLegacy: false,
  video: undefined,
};

let config: BaseConfig;
let options: BaseOptions;
const setConfig = (value: BaseConfig) => (config = value);
const setOptions = (value: BaseOptions) => (options = value);
export {
  config,
  defaultConfig,
  defaultOptions,
  options,
  setConfig,
  setOptions,
  updateConfig,
};
