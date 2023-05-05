import {
  Canvas as NodeCanvas,
  CanvasRenderingContext2D as NodeContext,
} from "canvas";

export { NodeCanvas, NodeContext };
export type Canvas = NodeCanvas | HTMLCanvasElement;
export type Context2D = NodeContext | CanvasRenderingContext2D;
