import type { BaseConfig, BaseOptions } from "@/@types/";

let defaultConfig: BaseConfig;

/**
 * 設定を更新する
 * @param config 更新後の設定
 */
const updateConfig = (config: BaseConfig) => {
  defaultConfig = config;
};

const setConfig = updateConfig;

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
  lazy: false,
};

const initialOptions: BaseOptions = { ...defaultOptions };

const setOptions = (options: BaseOptions) => {
  Object.assign(defaultOptions, options);
};

const resetOptions = () => {
  Object.assign(defaultOptions, initialOptions);
};

export {
  defaultConfig,
  defaultOptions,
  resetOptions,
  setConfig,
  setOptions,
  updateConfig,
};
