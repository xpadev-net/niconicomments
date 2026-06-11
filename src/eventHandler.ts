import type {
  CommentEventHandlerMap,
  CommentEventMap,
  NicoScript,
  ValueOf,
} from "@/@types/";

type EventRange = {
  start: number;
  end?: number;
};

type EventRangeScanState<T extends EventRange> = {
  sourceLength: number;
  sortedByStart: T[];
  sortedByEnd: T[];
};

const rangeEnd = (range: EventRange) => range.end ?? Infinity;

const compareRangeEnd = (a: EventRange, b: EventRange) => {
  const endA = rangeEnd(a);
  const endB = rangeEnd(b);
  if (endA === endB) return 0;
  return endA < endB ? -1 : 1;
};

const getRangeScanState = <T extends EventRange>(
  ranges: T[],
  scanCache: WeakMap<T[], EventRangeScanState<T>>,
) => {
  const cached = scanCache.get(ranges);
  if (cached?.sourceLength === ranges.length) return cached;
  // NicoScript event ranges are append-only and immutable after creation; this
  // length check must be revisited if future code mutates start/end in place.
  const sortedByStart = [...ranges].sort((a, b) => a.start - b.start);
  const sortedByEnd = [...ranges].sort(compareRangeEnd);
  const next = {
    sourceLength: ranges.length,
    sortedByStart,
    sortedByEnd,
  };
  scanCache.set(ranges, next);
  return next;
};

const rangeEndsAfter = (range: EventRange, vpos: number) =>
  range.end === undefined || vpos < range.end;

const lowerBoundStart = <T extends EventRange>(ranges: T[], vpos: number) => {
  let low = 0;
  let high = ranges.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const range = ranges[mid];
    if (range && range.start < vpos) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
};

const upperBoundEnd = <T extends EventRange>(ranges: T[], vpos: number) => {
  let low = 0;
  let high = ranges.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const range = ranges[mid];
    if (range && rangeEnd(range) <= vpos) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
};

const getTransitionRanges = <T extends EventRange>(
  ranges: T[],
  vpos: number,
  lastVpos: number,
  scanCache: WeakMap<T[], EventRangeScanState<T>>,
) => {
  if (!Number.isFinite(vpos) || !Number.isFinite(lastVpos)) {
    return { entered: [], exited: [] };
  }
  const state = getRangeScanState(ranges, scanCache);
  const entered: T[] = [];
  const exited: T[] = [];

  if (lastVpos <= vpos) {
    for (
      let i = lowerBoundStart(state.sortedByStart, lastVpos),
        end = lowerBoundStart(state.sortedByStart, vpos);
      i < end;
      i++
    ) {
      const range = state.sortedByStart[i];
      if (range && rangeEndsAfter(range, vpos)) {
        entered.push(range);
      }
    }
    for (
      let i = upperBoundEnd(state.sortedByEnd, lastVpos),
        end = upperBoundEnd(state.sortedByEnd, vpos);
      i < end;
      i++
    ) {
      const range = state.sortedByEnd[i];
      if (range && range.start < lastVpos) {
        exited.push(range);
      }
    }
  } else {
    for (
      let i = upperBoundEnd(state.sortedByEnd, vpos),
        end = upperBoundEnd(state.sortedByEnd, lastVpos);
      i < end;
      i++
    ) {
      const range = state.sortedByEnd[i];
      if (range && range.start < vpos) {
        entered.push(range);
      }
    }
    for (
      let i = lowerBoundStart(state.sortedByStart, vpos),
        end = lowerBoundStart(state.sortedByStart, lastVpos);
      i < end;
      i++
    ) {
      const range = state.sortedByStart[i];
      if (range && rangeEndsAfter(range, lastVpos)) {
        exited.push(range);
      }
    }
  }

  return { entered, exited };
};

class EventHandler {
  private handlerList: {
    eventName: keyof CommentEventHandlerMap;
    handler: ValueOf<CommentEventHandlerMap>;
  }[] = [];

  private handlerCounts: { [key in keyof CommentEventHandlerMap]: number } = {
    seekDisable: 0,
    seekEnable: 0,
    commentDisable: 0,
    commentEnable: 0,
    jump: 0,
  };

  private readonly banActiveRangeScans = new WeakMap<
    NicoScript["ban"],
    EventRangeScanState<NicoScript["ban"][number]>
  >();
  private readonly seekDisableActiveRangeScans = new WeakMap<
    NicoScript["seekDisable"],
    EventRangeScanState<NicoScript["seekDisable"][number]>
  >();
  private readonly jumpActiveRangeScans = new WeakMap<
    NicoScript["jump"],
    EventRangeScanState<NicoScript["jump"][number]>
  >();

  register<K extends keyof CommentEventHandlerMap>(
    eventName: K,
    handler: CommentEventHandlerMap[K],
  ) {
    this.handlerList.push({ eventName, handler });
    this._updateCounts();
  }

  remove<K extends keyof CommentEventHandlerMap>(
    eventName: K,
    handler: CommentEventHandlerMap[K],
  ) {
    this.handlerList = this.handlerList.filter(
      (item) => item.eventName !== eventName || item.handler !== handler,
    );
    this._updateCounts();
  }

  trigger(vpos: number, lastVpos: number, nicoScripts: NicoScript) {
    this._processCommentDisable(vpos, lastVpos, nicoScripts);
    this._processSeekDisable(vpos, lastVpos, nicoScripts);
    this._processJump(vpos, lastVpos, nicoScripts);
  }

  private _updateCounts() {
    for (const key_ of Object.keys(this.handlerCounts)) {
      const key = key_ as keyof CommentEventHandlerMap;
      this.handlerCounts[key] = this.handlerList.filter(
        (item) => item.eventName === key,
      ).length;
    }
  }

  private _processCommentDisable(
    vpos: number,
    lastVpos: number,
    nicoScripts: NicoScript,
  ) {
    if (
      this.handlerCounts.commentDisable < 1 &&
      this.handlerCounts.commentEnable < 1
    )
      return;
    const { entered, exited } = getTransitionRanges(
      nicoScripts.ban,
      vpos,
      lastVpos,
      this.banActiveRangeScans,
    );
    for (const _range of entered) {
      this._execute("commentDisable", {
        type: "commentDisable",
        timeStamp: Date.now(),
        vpos,
      });
    }
    for (const _range of exited) {
      this._execute("commentEnable", {
        type: "commentEnable",
        timeStamp: Date.now(),
        vpos,
      });
    }
  }

  private _processSeekDisable(
    vpos: number,
    lastVpos: number,
    nicoScripts: NicoScript,
  ) {
    if (this.handlerCounts.seekDisable < 1 && this.handlerCounts.seekEnable < 1)
      return;
    const { entered, exited } = getTransitionRanges(
      nicoScripts.seekDisable,
      vpos,
      lastVpos,
      this.seekDisableActiveRangeScans,
    );
    for (const _range of entered) {
      this._execute("seekDisable", {
        type: "seekDisable",
        timeStamp: Date.now(),
        vpos,
      });
    }
    for (const _range of exited) {
      this._execute("seekEnable", {
        type: "seekEnable",
        timeStamp: Date.now(),
        vpos,
      });
    }
  }

  private _processJump(
    vpos: number,
    lastVpos: number,
    nicoScripts: NicoScript,
  ) {
    if (this.handlerCounts.jump < 1) return;
    const { entered } = getTransitionRanges(
      nicoScripts.jump,
      vpos,
      lastVpos,
      this.jumpActiveRangeScans,
    );
    for (const range of entered) {
      this._execute("jump", {
        type: "jump",
        timeStamp: Date.now(),
        vpos,
        to: range.to,
        message: range.message,
      });
    }
  }

  private _execute<K extends keyof CommentEventMap>(
    eventName: K,
    event: CommentEventMap[K],
  ) {
    for (const item of this.handlerList) {
      if (eventName !== item.eventName) continue;
      (item.handler as (event: CommentEventMap[K]) => unknown)(event);
    }
  }
}

export { EventHandler };
