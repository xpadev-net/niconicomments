import type { IRenderer } from "@/@types/";
import { CanvasRenderer } from "./canvas";
import { WebGL2Renderer } from "./webgl2";

export { CanvasRenderer, WebGL2Renderer };

export function createRenderer(
  canvas: HTMLCanvasElement,
  video?: HTMLVideoElement,
): IRenderer {
  try {
    return new WebGL2Renderer(canvas, video);
  } catch (e) {
    console.warn("WebGL2 initialisation failed, falling back to Canvas2D:", e);
    try {
      return new CanvasRenderer(canvas, video);
    } catch {
      // Canvas is already bound to a WebGL2 context and cannot obtain a
      // 2D context. Create a fresh canvas element as a replacement.
      const fresh = document.createElement("canvas");
      fresh.width = canvas.width;
      fresh.height = canvas.height;
      canvas.replaceWith(fresh);
      return new CanvasRenderer(fresh, video);
    }
  }
}
