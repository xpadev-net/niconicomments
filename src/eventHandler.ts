import { CommentEventHandlerMap, CommentEventMap } from "@/@types/event";
import { valueOf } from "@/@types/types";
import { nicoScripts } from "@/contexts/nicoscript";

let handlerList: {
  eventName: keyof CommentEventHandlerMap;
  handler: valueOf<CommentEventHandlerMap>;
}[] = [];

const handlerCounts: { [key in keyof CommentEventHandlerMap]: number } = {
  seekDisable: 0,
  seekEnable: 0,
  commentDisable: 0,
  commentEnable: 0,
  jump: 0,
};

const registerHandler = <K extends keyof CommentEventHandlerMap>(
  eventName: K,
  handler: CommentEventHandlerMap[K]
) => {
  handlerList.push({ eventName, handler });
  updateEventHandlerCounts();
};

const removeHandler = <K extends keyof CommentEventHandlerMap>(
  eventName: K,
  handler: CommentEventHandlerMap[K]
) => {
  handlerList = handlerList.filter(
    (item) => item.eventName !== eventName || item.handler !== handler
  );
  updateEventHandlerCounts();
};

const updateEventHandlerCounts = () => {
  for (const key_ in handlerCounts) {
    const key = key_ as keyof CommentEventHandlerMap;
    handlerCounts[key] = handlerList.filter(
      (item) => item.eventName === key
    ).length;
  }
};

const triggerHandler = (vpos: number, lastVpos: number) => {
  processCommentDisableScript(vpos, lastVpos);
  processSeekDisableScript(vpos, lastVpos);
  processJumpScript(vpos, lastVpos);
};

const processCommentDisableScript = (vpos: number, lastVpos: number) => {
  if (handlerCounts.commentDisable < 1 && handlerCounts.commentEnable < 1)
    return;
  for (const range of nicoScripts.ban) {
    const vposInRange = range.start < vpos && vpos < range.end,
      lastVposInRange = range.start < lastVpos && lastVpos < range.end;
    if (vposInRange && !lastVposInRange) {
      executeEvents("commentDisable", {
        type: "commentDisable",
        timeStamp: new Date().getTime(),
        vpos: vpos,
      });
    } else if (!vposInRange && lastVposInRange) {
      executeEvents("commentEnable", {
        type: "commentEnable",
        timeStamp: new Date().getTime(),
        vpos: vpos,
      });
    }
  }
};

const processSeekDisableScript = (vpos: number, lastVpos: number) => {
  if (handlerCounts.seekDisable < 1 && handlerCounts.seekEnable < 1) return;
  for (const range of nicoScripts.seekDisable) {
    const vposInRange = range.start < vpos && vpos < range.end,
      lastVposInRange = range.start < lastVpos && lastVpos < range.end;
    if (vposInRange && !lastVposInRange) {
      executeEvents("seekDisable", {
        type: "seekDisable",
        timeStamp: new Date().getTime(),
        vpos: vpos,
      });
    } else if (!vposInRange && lastVposInRange) {
      executeEvents("seekEnable", {
        type: "seekEnable",
        timeStamp: new Date().getTime(),
        vpos: vpos,
      });
    }
  }
};

const processJumpScript = (vpos: number, lastVpos: number) => {
  if (handlerCounts.jump < 1) return;
  for (const range of nicoScripts.jump) {
    const vposInRange = range.start < vpos && (!range.end || vpos < range.end),
      lastVposInRange =
        range.start < lastVpos && (!range.end || lastVpos < range.end);
    if (vposInRange && !lastVposInRange) {
      executeEvents("jump", {
        type: "jump",
        timeStamp: new Date().getTime(),
        vpos: vpos,
        to: range.to,
        message: range.message,
      });
    }
  }
};

const executeEvents = <K extends keyof CommentEventMap>(
  eventName: K,
  event: CommentEventMap[K]
) => {
  for (const item of handlerList) {
    if (eventName !== item.eventName) continue;
    (item.handler as (event: CommentEventMap[K]) => unknown)(event);
  }
};

export { registerHandler, removeHandler, triggerHandler };
