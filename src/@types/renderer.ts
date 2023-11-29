export interface IRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly video?: HTMLVideoElement;
  destroy(): void;
  drawVideo(enableLegacyPip: boolean): void;
  getFont(): string;
  getFillStyle(): string | CanvasGradient | CanvasPattern;
  setScale(scale: number, arg1?: number): void;
  fillRect(x: number, y: number, width: number, height: number): void;
  strokeRect(x: number, y: number, width: number, height: number): void;
  fillText(text: string, x: number, y: number): void;
  strokeText(text: string, x: number, y: number): void;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
  clearRect(x: number, y: number, width: number, height: number): void;
  setFont(font: string): void;
  setFillStyle(color: string): void;
  setStrokeStyle(color: string): void;
  setLineWidth(width: number): void;
  setGlobalAlpha(alpha: number): void;
  setSize(width: number, height: number): void;
  getSize(): { width: number; height: number };
  measureText(text: string): TextMetrics;
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  save(): void;
  restore(): void;
  getCanvas(): IRenderer;
  drawImage(
    image: IRenderer,
    x: number,
    y: number,
    width?: number,
    height?: number,
  ): void;
}
