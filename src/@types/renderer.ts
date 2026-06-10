export interface IRenderer {
  readonly rendererName: string;
  readonly canvas: HTMLCanvasElement;
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
  /**
   * Measure text on a canvas with the given draw scale applied.
   *
   * In some environments (e.g. WKWebView on macOS), `measureText()` returns
   * different values depending on the canvas transform because font fallback
   * resolution depends on the effective physical glyph size.  niconicomments
   * renders comment text on an offscreen canvas at `drawScale`, so measuring
   * at that same scale avoids the mismatch that causes clipping.
   *
   * Optional — implementations that return identical metrics regardless of
   * scale (Chrome, Firefox, Node-canvas) may omit it.  Callers fall back to
   * `measureText()` when the method is absent.
   */
  measureTextAtDrawScale?(text: string, drawScale: number): TextMetrics;
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  save(): void;
  restore(): void;
  getCanvas(padding?: number): IRenderer;
  /**
   * Draw a sub-renderer's content onto this renderer.
   *
   * The source image is read from `image.canvas`.
   */
  drawImage(
    image: IRenderer,
    x: number,
    y: number,
    width?: number,
    height?: number,
  ): void;
  /**
   * Execute all buffered draw commands.
   *
   * Ordering contract: GPU-accelerated commands (drawImage, fillRect, strokeRect)
   * are rendered first, then Canvas 2D helper operations (text/path) are
   * composited on top.  Callers must ensure fillText/strokeText are issued
   * AFTER all drawImage calls within a single frame.
   */
  flush(): void;
  invalidateImage(image: IRenderer): void;
}
