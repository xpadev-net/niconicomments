import type { IRenderer } from "@/@types/";
import { CanvasRenderingContext2DError } from "@/errors";
import { canvasPool } from "@/renderer/canvasPool";

const MAX_CANVAS_DIMENSION = 8192;
export const MAX_CANVAS_AREA = 16_777_216;
const MAX_MEASURE_TEXT_CACHE_TEXT_LENGTH = 512;

export const clampCanvasSize = (width: number, height: number) => {
  let nextWidth = Number.isFinite(width) ? Math.max(0, Math.floor(width)) : 0;
  let nextHeight = Number.isFinite(height)
    ? Math.max(0, Math.floor(height))
    : 0;
  if (nextWidth > MAX_CANVAS_DIMENSION || nextHeight > MAX_CANVAS_DIMENSION) {
    const scale = Math.min(
      MAX_CANVAS_DIMENSION / Math.max(1, nextWidth),
      MAX_CANVAS_DIMENSION / Math.max(1, nextHeight),
    );
    nextWidth = Math.floor(nextWidth * scale);
    nextHeight = Math.floor(nextHeight * scale);
  }
  if (nextWidth * nextHeight > MAX_CANVAS_AREA) {
    const scale = Math.sqrt(MAX_CANVAS_AREA / (nextWidth * nextHeight));
    nextWidth = Math.floor(nextWidth * scale);
    nextHeight = Math.floor(nextHeight * scale);
  }
  return {
    width: nextWidth,
    height: nextHeight,
  };
};

/**
 * Canvasを使ったレンダラー
 * dom/canvas周りのAPIを切り出したもの
 * @param canvas レンダリング先のCanvas
 * @param video レンダリングするVideo(任意)
 */
class CanvasRenderer implements IRenderer {
  public readonly rendererName = "CanvasRenderer";
  public readonly canvas: HTMLCanvasElement;
  public readonly video?: HTMLVideoElement;
  private readonly context: CanvasRenderingContext2D;

  private padding = 0;
  private width = 0;
  private height = 0;

  /**
   * measureText 結果のキャッシュ
   * キー: "font\0text" → 値: TextMetrics (主レンダラースケール)
   * キー: "@drawScale\0font\0text" → 値: TextMetrics (drawScaleスケール)
   * エントリ数が _MT_CACHE_MAX_SIZE に達した場合はそれ以上追加しない（既存エントリは維持）
   */
  private static readonly _MT_CACHE_MAX_SIZE = 5000;
  private static _mtCache = new Map<string, TextMetrics>();

  /** measureTextAtDrawScale 用の専用キャンバス (スケール依存計測用) */
  private static _dsCanvas: HTMLCanvasElement | null = null;
  private static _dsCtx: CanvasRenderingContext2D | null = null;
  private static _dsScale = 0;
  private static _dsFont = "";

  /** プールから取得した canvas かどうか (destroy 時にプールに返却するため) */
  private readonly pooled: boolean;
  private readonly _onDestroy?: () => void;

  constructor(
    canvas?: HTMLCanvasElement,
    video?: HTMLVideoElement,
    padding = 0,
    onDestroy?: () => void,
  ) {
    this.pooled = !canvas;
    this._onDestroy = onDestroy;
    this.canvas = canvas ?? canvasPool.acquire();
    const context = this.canvas.getContext("2d");
    if (!context) throw new CanvasRenderingContext2DError();
    this.context = context;
    this.video = video;
    this.padding = padding;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    if (this.padding > 0) {
      this.canvas.width += this.padding * 2;
      this.canvas.height += this.padding * 2;
    }
    this.resetContextState();
  }

  private resetContextState() {
    this.context.textAlign = "start";
    this.context.textBaseline = "alphabetic";
    this.context.lineJoin = "round";
    if (this.padding > 0) {
      this.context.translate(this.padding, this.padding);
    }
  }

  drawVideo(enableLegacyPip: boolean) {
    if (this.video && this.video.videoWidth > 0 && this.video.videoHeight > 0) {
      let scale: number;
      const height = this.canvas.height / this.video.videoHeight;
      const width = this.canvas.width / this.video.videoWidth;
      if (enableLegacyPip ? height > width : height < width) {
        scale = width;
      } else {
        scale = height;
      }
      const offsetX = (this.canvas.width - this.video.videoWidth * scale) * 0.5;
      const offsetY =
        (this.canvas.height - this.video.videoHeight * scale) * 0.5;
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
    const transform = this.context.getTransform();
    this.context.save();
    try {
      this.context.setTransform(1, 0, 0, 1, 0, 0);
      this.context.clearRect(
        x * transform.a + transform.e,
        y * transform.d + transform.f,
        width * transform.a,
        height * transform.d,
      );
    } finally {
      this.context.restore();
    }
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
    const paddingSize = this.padding * 2;
    const size = clampCanvasSize(width + paddingSize, height + paddingSize);
    this.width = Math.max(0, size.width - paddingSize);
    this.height = Math.max(0, size.height - paddingSize);
    this.canvas.width = size.width;
    this.canvas.height = size.height;
    this.resetContextState();
  }

  getSize(): { width: number; height: number } {
    return {
      width: this.width,
      height: this.height,
    };
  }

  measureText(text: string): TextMetrics {
    if (text.length > MAX_MEASURE_TEXT_CACHE_TEXT_LENGTH) {
      return this.context.measureText(text);
    }
    const key = `${this.context.font}\0${text}`;
    const cached = CanvasRenderer._mtCache.get(key);
    if (cached !== undefined) return cached;
    const result = this.context.measureText(text);
    if (CanvasRenderer._mtCache.size < CanvasRenderer._MT_CACHE_MAX_SIZE) {
      CanvasRenderer._mtCache.set(key, result);
    }
    return result;
  }

  /**
   * Measure text on a dedicated canvas with `drawScale` applied as the
   * transform, so font fallback resolution matches the offscreen render canvas.
   *
   * In WKWebView (macOS), `measureText()` resolves font fallbacks based on the
   * effective physical glyph size, which varies with the canvas transform.
   * Measuring at `drawScale` (= commentScale × fontScale × layerScale) returns
   * the same metrics the offscreen canvas will produce, preventing clipping.
   */
  measureTextAtDrawScale(text: string, drawScale: number): TextMetrics {
    const font = this.context.font;
    if (text.length > MAX_MEASURE_TEXT_CACHE_TEXT_LENGTH) {
      return CanvasRenderer._measureAtScale(text, font, drawScale);
    }
    const key = `@${drawScale}\0${font}\0${text}`;
    const cached = CanvasRenderer._mtCache.get(key);
    if (cached !== undefined) return cached;
    const result = CanvasRenderer._measureAtScale(text, font, drawScale);
    if (CanvasRenderer._mtCache.size < CanvasRenderer._MT_CACHE_MAX_SIZE) {
      CanvasRenderer._mtCache.set(key, result);
    }
    return result;
  }

  private static _measureAtScale(
    text: string,
    font: string,
    drawScale: number,
  ): TextMetrics {
    if (!CanvasRenderer._dsCanvas) {
      CanvasRenderer._dsCanvas = document.createElement("canvas");
      CanvasRenderer._dsCanvas.width = 1;
      CanvasRenderer._dsCanvas.height = 1;
      CanvasRenderer._dsCtx = CanvasRenderer._dsCanvas.getContext("2d");
    }
    const ctx = CanvasRenderer._dsCtx;
    if (!ctx) {
      const tmp = document.createElement("canvas");
      const tCtx = tmp.getContext("2d");
      if (!tCtx) throw new CanvasRenderingContext2DError();
      tCtx.setTransform(drawScale, 0, 0, drawScale, 0, 0);
      tCtx.font = font;
      return tCtx.measureText(text);
    }
    if (CanvasRenderer._dsScale !== drawScale) {
      ctx.setTransform(drawScale, 0, 0, drawScale, 0, 0);
      CanvasRenderer._dsScale = drawScale;
      CanvasRenderer._dsFont = "";
    }
    if (CanvasRenderer._dsFont !== font) {
      ctx.font = font;
      CanvasRenderer._dsFont = font;
    }
    return ctx.measureText(text);
  }

  static resetMeasureTextCache(): void {
    CanvasRenderer._mtCache.clear();
    CanvasRenderer._dsScale = 0;
    CanvasRenderer._dsFont = "";
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
  getCanvas(padding = 0): IRenderer {
    return new CanvasRenderer(undefined, undefined, padding);
  }

  flush(): void {
    // Canvas 2Dでは即時描画のため何もしない
  }

  invalidateImage(_image: IRenderer): void {
    // Canvas 2Dではテクスチャキャッシュがないため何もしない
  }

  destroy() {
    this._onDestroy?.();
    if (this.pooled) {
      canvasPool.release(this.canvas);
    }
  }
}

export { CanvasRenderer };
