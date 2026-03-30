import type { IRenderer } from "@/@types/";
import { CanvasRenderer } from "@/renderer/canvas";
import { canvasPool } from "@/renderer/canvasPool";

let imageCache: {
  [key: string]: { image: IRenderer; timeout: number };
} = {};

/**
 * キャッシュをリセットする
 */
const resetImageCache = () => {
  for (const key of Object.keys(imageCache)) {
    const entry = imageCache[key];
    if (entry) {
      clearTimeout(entry.timeout);
      entry.image.destroy();
    }
  }
  imageCache = {};
  CanvasRenderer.resetMeasureTextCache();
  canvasPool.clear();
};

export { imageCache, resetImageCache };
