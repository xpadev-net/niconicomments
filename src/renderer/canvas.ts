import type { IRenderer } from "@/@types/renderer";
import { CanvasRenderingContext2DError } from "@/errors";

class CanvasRenderer implements IRenderer {
  public readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  constructor(canvas?: HTMLCanvasElement) {
    this.canvas = canvas ?? document.createElement("canvas");
    const context = this.canvas.getContext("2d");
    if (!context) throw new CanvasRenderingContext2DError();
    this.context = context;
  }

  setScale(scale: number, arg1?: number) {
    this.context.scale(scale, arg1 ?? scale);
  }

  drawImage(
    image: IRenderer,
    x: number,
    y: number,
    width?: number,
    height?: number,
  ) {
    if (width === undefined || height === undefined)
      this.context.drawImage(image.canvas, x, y);
    else this.context.drawImage(image.canvas, x, y, width, height);
  }

  fillRect(x: number, y: number, width: number, height: number): void {
    this.context.fillRect(x, y, width, height);
  }
  fillText(text: string, x: number, y: number): void {
    this.context.fillText(text, x, y);
    this.context.strokeText(text, x, y);
  }
  setFont(font: string): void {
    this.context.font = font;
  }
  setFillStyle(color: string): void {
    this.context.fillStyle = color;
  }
  setStrokeStyle(color: string): void {
    this.context.strokeStyle = color;
  }
  setLineWidth(width: number): void {
    this.context.lineWidth = width;
  }
  setGlobalAlpha(alpha: number): void {
    this.context.globalAlpha = alpha;
  }
  measureText(text: string): TextMetrics {
    return this.context.measureText(text);
  }
  beginPath(): void {
    this.context.beginPath();
  }
  closePath(): void {
    this.context.closePath();
  }
  moveTo(x: number, y: number): void {
    this.context.moveTo(x, y);
  }
  lineTo(x: number, y: number): void {
    this.context.lineTo(x, y);
  }
  stroke(): void {
    this.context.stroke();
  }
  save(): void {
    this.context.save();
  }
  restore(): void {
    this.context.restore();
  }
  getCanvas(): IRenderer {
    return new CanvasRenderer();
  }
}
export { CanvasRenderer };
