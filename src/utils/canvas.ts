import { Canvas, Context2D } from "@/@types";
import { CanvasRenderingContext2DError } from "@/errors";
import typeGuard from "@/typeGuard";
import { isNode } from "@/utils/node";

const generateCanvas = (): Canvas => {
  if (isNode) {
    const { createCanvas } = require("canvas") as {
      createCanvas: (width: number, height: number) => Canvas;
    };
    return createCanvas(1920, 1080);
  }
  return document.createElement("canvas");
};

const getContext = (canvas: Canvas): Context2D => {
  if (typeGuard.canvas.nodeCanvas(canvas)) {
    return canvas.getContext("2d");
  }
  const context = canvas.getContext("2d");
  if (!context) throw new CanvasRenderingContext2DError();
  return context;
};

const drawImage = (
  targetContext: Context2D,
  sourceImage: Canvas,
  x: number,
  y: number
) => {
  if (typeGuard.canvas.nodeContext(targetContext)) {
    if (!typeGuard.canvas.nodeCanvas(sourceImage)) return;
    targetContext.drawImage(sourceImage, x, y);
    return;
  }
  if (typeGuard.canvas.nodeCanvas(sourceImage)) return;
  targetContext.drawImage(sourceImage, x, y);
};

export { drawImage, generateCanvas, getContext };
