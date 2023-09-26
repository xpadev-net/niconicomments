import type { Canvas, Context2D } from "@/@types";
import { CanvasRenderingContext2DError } from "@/errors";

/**
 * 環境に応じたCanvasを生成する
 * @returns 生成されたキャンバス
 */
const generateCanvas = (): Canvas => {
  return document.createElement("canvas");
};

/**
 * 環境に応じたContextを取得する
 * @param canvas 対象のキャンバス
 * @returns 取得されたContext
 */
const getContext = (canvas: Canvas): Context2D => {
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
  y: number,
) => {
  targetContext.drawImage(sourceImage, x, y);
};

export { drawImage, generateCanvas, getContext };
