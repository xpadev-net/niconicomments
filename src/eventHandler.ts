import type {
  CommentEventHandlerMap,
  CommentEventMap,
  NicoScript,
  ValueOf,
} from "@/@types/";

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
    for (const range of nicoScripts.ban) {
      const vposInRange = range.start < vpos && vpos < range.end;
      const lastVposInRange = range.start < lastVpos && lastVpos < range.end;
      if (vposInRange && !lastVposInRange) {
        this._execute("commentDisable", {
          type: "commentDisable",
          timeStamp: Date.now(),
          vpos,
        });
      } else if (!vposInRange && lastVposInRange) {
        this._execute("commentEnable", {
          type: "commentEnable",
          timeStamp: Date.now(),
          vpos,
        });
      }
    }
  }

  private _processSeekDisable(
    vpos: number,
    lastVpos: number,
    nicoScripts: NicoScript,
  ) {
    if (this.handlerCounts.seekDisable < 1 && this.handlerCounts.seekEnable < 1)
      return;
    for (const range of nicoScripts.seekDisable) {
      const vposInRange = range.start < vpos && vpos < range.end;
      const lastVposInRange = range.start < lastVpos && lastVpos < range.end;
      if (vposInRange && !lastVposInRange) {
        this._execute("seekDisable", {
          type: "seekDisable",
          timeStamp: Date.now(),
          vpos,
        });
      } else if (!vposInRange && lastVposInRange) {
        this._execute("seekEnable", {
          type: "seekEnable",
          timeStamp: Date.now(),
          vpos,
        });
      }
    }
  }

  private _processJump(
    vpos: number,
    lastVpos: number,
    nicoScripts: NicoScript,
  ) {
    if (this.handlerCounts.jump < 1) return;
    for (const range of nicoScripts.jump) {
      const vposInRange =
        range.start < vpos && (!range.end || vpos < range.end);
      const lastVposInRange =
        range.start < lastVpos && (!range.end || lastVpos < range.end);
      if (vposInRange && !lastVposInRange) {
        this._execute("jump", {
          type: "jump",
          timeStamp: Date.now(),
          vpos,
          to: range.to,
          message: range.message,
        });
      }
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
