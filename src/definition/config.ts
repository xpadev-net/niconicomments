import type { BaseConfig, BaseOptions } from "@/@types/";
let defaultConfig: BaseConfig;

/**
 * 設定を更新する
 * @param config 更新後の設定
 */
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

/**
 * 設定を更新する
 * @param value 更新後の設定
 */
const setConfig = (value: BaseConfig) => {
  config = value;
};

/**
 * 設定を更新する
 * @param value 更新後の設定
 */
const setOptions = (value: BaseOptions) => {
  options = value;
};
export {
  config,
  defaultConfig,
  defaultOptions,
  options,
  setConfig,
  setOptions,
  updateConfig,
};
