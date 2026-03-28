/**
 * HTMLCanvasElement のオブジェクトプール
 * コメント画像生成時の document.createElement("canvas") コストを削減する
 */
class CanvasPool {
  private pool: HTMLCanvasElement[] = [];

  acquire(): HTMLCanvasElement {
    return this.pool.pop() ?? document.createElement("canvas");
  }

  release(canvas: HTMLCanvasElement): void {
    canvas.width = 0;
    canvas.height = 0;
    this.pool.push(canvas);
  }

  clear(): void {
    this.pool.length = 0;
  }
}

export const canvasPool = new CanvasPool();
