import type { IRenderer } from "@/@types/";
import { CanvasRenderingContext2DError } from "@/errors";

/**
 * Canvasを使ったレンダラー
 * dom/canvas周りのAPIを切り出したもの
 * @param canvas レンダリング先のCanvas
 * @param video レンダリングするVideo(任意)
 */
class CanvasRenderer implements IRenderer {
  public readonly canvas: HTMLCanvasElement;
  public readonly video?: HTMLVideoElement;
  private readonly context: CanvasRenderingContext2D;
  constructor(canvas?: HTMLCanvasElement, video?: HTMLVideoElement) {
    this.canvas = canvas ?? document.createElement("canvas");
    const context = this.canvas.getContext("2d");
    if (!context) throw new CanvasRenderingContext2DError();
    this.context = context;
    this.context.textAlign = "start";
    this.context.textBaseline = "alphabetic";
    this.video = video;
  }

  drawVideo(enableLegacyPip: boolean) {
    if (this.video) {
      let scale;
      const height = this.canvas.height / this.video.videoHeight,
        width = this.canvas.width / this.video.videoWidth;
      if (enableLegacyPip ? height > width : height < width) {
        scale = width;
      } else {
        scale = height;
      }
      const offsetX = (this.canvas.width - this.video.videoWidth * scale) * 0.5,
        offsetY = (this.canvas.height - this.video.videoHeight * scale) * 0.5;
      this.context.drawImage(
        this.video,
        offsetX,
        offsetY,
        this.video.videoWidth * scale,
        this.video.videoHeight * scale,
      );
    }
  }

  getFont(): string {
    return this.context.font;
  }

  getFillStyle(): string | CanvasGradient | CanvasPattern {
    return this.context.fillStyle;
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
    if (!(image instanceof CanvasRenderer)) {
      throw new TypeError(
        "CanvasRenderer.drawImage: 'image' argument must be an instance of CanvasRenderer.",
      );
    }

    if (width === undefined || height === undefined)
      this.context.drawImage(image.canvas, x, y);
    else this.context.drawImage(image.canvas, x, y, width, height);
  }

  fillRect(x: number, y: number, width: number, height: number): void {
    this.context.fillRect(x, y, width, height);
  }
  strokeRect(x: number, y: number, width: number, height: number) {
    this.context.strokeRect(x, y, width, height);
  }

  fillText(text: string, x: number, y: number): void {
    this.context.fillText(text, x, y);
  }
  strokeText(text: string, x: number, y: number) {
    this.context.strokeText(text, x, y);
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this.context.quadraticCurveTo(cpx, cpy, x, y);
  }

  clearRect(x: number, y: number, width: number, height: number): void {
    this.context.clearRect(x, y, width, height);
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
  setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  getSize(): { width: number; height: number } {
    return { width: this.canvas.width, height: this.canvas.height };
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

  destroy() {
    //for override
  }
}
export { CanvasRenderer };
