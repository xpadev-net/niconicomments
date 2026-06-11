import type { BaseConfig, BaseOptions, NicoScript } from "@/@types/";
import type { RangeCacheContext } from "@/utils/rangeCache";

import type { ImageCacheContext } from "./cache";

type CommentInstanceContext = {
  config: BaseConfig;
  options: BaseOptions;
  nicoScripts: NicoScript;
  imageCache: ImageCacheContext;
  rangeCache: RangeCacheContext;
};

export type { CommentInstanceContext };
