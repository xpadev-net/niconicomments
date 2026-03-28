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
  imageCache = {};
  CanvasRenderer.resetMeasureTextCache();
  canvasPool.clear();
};
export { imageCache, resetImageCache };
