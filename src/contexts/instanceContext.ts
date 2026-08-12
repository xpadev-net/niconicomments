import type {
  BaseConfig,
  BaseOptions,
  FormattedComment,
  NicoScript,
} from "@/@types/";
import type { RangeCacheContext } from "@/utils/rangeCache";

import type { ImageCacheContext } from "./cache";

type CommentInstanceContext = {
  config: BaseConfig;
  options: BaseOptions;
  nicoScripts: NicoScript;
  imageCache: ImageCacheContext;
  rangeCache: RangeCacheContext;
  keepCAScalePreservedComments: WeakSet<FormattedComment>;
};

export type { CommentInstanceContext };
