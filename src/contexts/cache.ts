import type { IRenderer } from "@/@types/renderer";

let imageCache: {
  [key: string]: { image: IRenderer; timeout: number | NodeJS.Timeout };
} = {};

/**
 * キャッシュをリセットする
 */
const resetImageCache = () => {
  imageCache = {};
};
export { imageCache, resetImageCache };
