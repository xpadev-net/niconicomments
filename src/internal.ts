import type * as types from "@/@types/";
import * as comments from "@/comments";
import * as contexts from "@/contexts";
import * as colors from "@/definition/colors";
import * as config from "@/definition/config";
import * as fonts from "@/definition/fonts";
import * as initConfig from "@/definition/initConfig";
import * as errors from "@/errors";
import * as eventHandler from "@/eventHandler";
import * as inputParser from "@/inputParser";
import * as typeGuard from "@/typeGuard";
import * as utils from "@/utils";

const definition = {
  colors,
  config,
  fonts,
  initConfig,
};

export {
  comments,
  contexts,
  definition,
  errors,
  eventHandler,
  inputParser,
  typeGuard,
  types,
  utils,
};
