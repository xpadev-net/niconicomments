const ACTIVE_CACHE_MAX_SIZE = 4096;

class RangeCacheContext {
  readonly reverseActiveOwner = new Map<number, boolean>();
  readonly reverseActiveViewer = new Map<number, boolean>();
  readonly banActive = new Map<number, boolean>();

  reset() {
    this.reverseActiveOwner.clear();
    this.reverseActiveViewer.clear();
    this.banActive.clear();
  }

  setCachedActiveState(
    cache: Map<number, boolean>,
    vpos: number,
    result: boolean,
  ) {
    if (cache.size >= ACTIVE_CACHE_MAX_SIZE) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
      }
    }
    cache.set(vpos, result);
  }
}

export { RangeCacheContext };
