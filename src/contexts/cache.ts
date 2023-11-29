import type { IRenderer } from "@/@types/renderer";

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
