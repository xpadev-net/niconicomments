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
  for (const entry of Object.values(imageCache)) {
    clearTimeout(entry.timeout);
    entry.image.destroy();
  }
  imageCache = {};
  CanvasRenderer.resetMeasureTextCache();
  canvasPool.clear();
};

export { imageCache, resetImageCache };
