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
  } catch {
    return new CanvasRenderer(canvas, video);
  }
}
