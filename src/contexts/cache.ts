import type { IRenderer } from "@/@types/";

class ImageCacheContext {
  private _cache: {
    [key: string]: { image: IRenderer; timeout: number };
  } = {};

  get(key: string): { image: IRenderer; timeout: number } | undefined {
    return this._cache[key];
  }

  set(key: string, value: { image: IRenderer; timeout: number }) {
    this._cache[key] = value;
  }

  delete(key: string) {
    delete this._cache[key];
  }

  reset() {
    for (const entry of Object.values(this._cache)) {
      clearTimeout(entry.timeout);
      entry.image.destroy();
    }
    this._cache = {};
  }
}

export { ImageCacheContext };
