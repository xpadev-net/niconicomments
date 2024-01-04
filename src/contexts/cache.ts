import type { IRenderer } from "@/@types/";

let imageCache: {
  [key: string]: { image: IRenderer; timeout: number };
} = {};

/**
 * キャッシュをリセットする
 */
const resetImageCache = () => {
  imageCache = {};
};
export { imageCache, resetImageCache };
