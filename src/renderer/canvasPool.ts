/**
 * HTMLCanvasElement のオブジェクトプール
 * コメント画像生成時の document.createElement("canvas") コストを削減する
 * maxSize を超えたキャンバスは返却せずGCに委ねる（メモリ使用量の上限を保証）
 */
class CanvasPool {
  private readonly maxSize: number;
  private pool: HTMLCanvasElement[] = [];
  private pooledCanvases = new WeakSet<HTMLCanvasElement>();

  constructor(maxSize = 16) {
    this.maxSize = maxSize;
  }

  acquire(): HTMLCanvasElement {
    const canvas = this.pool.pop();
    if (canvas) {
      this.pooledCanvases.delete(canvas);
      return canvas;
    }
    return document.createElement("canvas");
  }

  release(canvas: HTMLCanvasElement): void {
    if (this.pooledCanvases.has(canvas)) return;
    if (this.pool.length >= this.maxSize) return;
    canvas.width = 0;
    canvas.height = 0;
    this.pooledCanvases.add(canvas);
    this.pool.push(canvas);
  }

  clear(): void {
    this.pool.length = 0;
    this.pooledCanvases = new WeakSet<HTMLCanvasElement>();
  }
}

export const canvasPool = new CanvasPool();
