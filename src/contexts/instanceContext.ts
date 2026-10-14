import type { BaseConfig, BaseOptions, NicoScript } from "@/@types/";
import type { RangeCacheContext } from "@/utils/rangeCache";

import type { ImageCacheContext } from "./cache";

type CommentInstanceContext = {
  config: BaseConfig;
  /** Current logical viewport, centered on the configured comment stage. */
  viewport?: { width: number; offsetX: number };
  options: BaseOptions;
  nicoScripts: NicoScript;
  imageCache: ImageCacheContext;
  rangeCache: RangeCacheContext;
};

export type { CommentInstanceContext };
