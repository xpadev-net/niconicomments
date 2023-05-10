import { Canvas, Context2D } from "@/@types";
import { CanvasRenderingContext2DError } from "@/errors";
import typeGuard from "@/typeGuard";
import { isNode } from "@/utils/node";

/**
 * 環境に応じたCanvasを生成する
 * @returns 生成されたキャンバス
 */
const generateCanvas = (): Canvas => {
  if (isNode) {
    const { createCanvas } = require("@napi-rs/canvas") as {
      createCanvas: (width: number, height: number) => Canvas;
    };
    return createCanvas(1920, 1080);
  }
  return document.createElement("canvas");
};

/**
 * 環境に応じたContextを取得する
 * @param canvas 対象のキャンバス
 * @returns 取得されたContext
 */
const getContext = (canvas: Canvas): Context2D => {
  if (typeGuard.canvas.nodeCanvas(canvas)) {
    return canvas.getContext("2d");
  }
  const context = canvas.getContext("2d");
  if (!context) throw new CanvasRenderingContext2DError();
  return context;
};

/**
 * 環境に応じて画像を描画する
 * @param targetContext 描画対象のContext
 * @param sourceImage 描画する画像
 * @param x 描画するx座標
 * @param y 描画するy座標
 */
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
