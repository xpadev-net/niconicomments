/**
 * HTMLCanvasElement のオブジェクトプール
 * コメント画像生成時の document.createElement("canvas") コストを削減する
 * maxSize を超えたキャンバスは返却せずGCに委ねる（メモリ使用量の上限を保証）
 */
class CanvasPool {
  private readonly maxSize: number;
  private pool: HTMLCanvasElement[] = [];

  constructor(maxSize = 16) {
    this.maxSize = maxSize;
  }

  acquire(): HTMLCanvasElement {
    return this.pool.pop() ?? document.createElement("canvas");
  }

  release(canvas: HTMLCanvasElement): void {
    if (this.pool.length >= this.maxSize) return;
    canvas.width = 0;
    canvas.height = 0;
    this.pool.push(canvas);
  }

  clear(): void {
    this.pool.length = 0;
  }
}

export const canvasPool = new CanvasPool();
