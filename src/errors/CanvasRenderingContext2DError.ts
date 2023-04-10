class CanvasRenderingContext2DError extends Error {
  constructor(options: { [key: string]: unknown } = {}) {
    super("CanvasRenderingContext2DError", options);
  }
}
CanvasRenderingContext2DError.prototype.name = "CanvasRenderingContext2DError";
export { CanvasRenderingContext2DError };