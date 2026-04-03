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
    } catch (err) {
      // Canvas is already bound to a WebGL2 context and cannot obtain a
      // 2D context. Create a fresh canvas element as a replacement.
      console.warn("Canvas2D context failed, creating fresh canvas:", err);
      const fresh = document.createElement("canvas");
      fresh.width = canvas.width;
      fresh.height = canvas.height;
      fresh.id = canvas.id;
      fresh.className = canvas.className;
      fresh.style.cssText = canvas.style.cssText;
      if (canvas.parentNode) {
        canvas.replaceWith(fresh);
      }
      // NOTE: The original canvas element is now detached from the DOM.
      // Callers should use the returned renderer's canvas property instead.
      return new CanvasRenderer(fresh, video);
    }
  }
}
