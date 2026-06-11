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
   * Measure text in the same canvas context class used for comment rendering.
   *
   * In WKWebView on macOS, font matching can depend on whether the canvas was
   * connected to the document when its context first resolved the font. The
   * main renderer is connected, while comment text is rendered on detached
   * offscreen canvases. Implementations can use this hook to measure with a
   * detached canvas as well, avoiding connected-vs-detached font metric
   * mismatches that cause clipping. `drawScale` is supplied so implementations
   * can mirror render-time state, although WKWebView's observed mismatch is
   * caused by canvas connection state rather than the transform itself.
   *
   * Optional — implementations that return identical metrics regardless of
   * context state (Chrome, Firefox, Node-canvas) may omit it. Callers fall
   * back to `measureText()` when the method is absent.
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
