import type { Canvas } from "@/@types";

let imageCache: {
  [key: string]: { image: Canvas; timeout: number | NodeJS.Timeout };
} = {};

/**
 * キャッシュをリセットする
 */
const resetImageCache = () => {
  imageCache = {};
};
export { imageCache, resetImageCache };
