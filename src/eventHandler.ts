import type {
  CommentEventHandlerMap,
  CommentEventMap,
  ValueOf,
} from "@/@types/";
import { nicoScripts } from "@/contexts/";

let handlerList: {
  eventName: keyof CommentEventHandlerMap;
  handler: ValueOf<CommentEventHandlerMap>;
}[] = [];

const handlerCounts: { [key in keyof CommentEventHandlerMap]: number } = {
  seekDisable: 0,
  seekEnable: 0,
  commentDisable: 0,
  commentEnable: 0,
  jump: 0,
};

/**
 * イベントハンドラを登録する
 * @param eventName イベント名
 * @param handler イベントハンドラ
 */
const registerHandler = <K extends keyof CommentEventHandlerMap>(
  eventName: K,
  handler: CommentEventHandlerMap[K],
) => {
  handlerList.push({ eventName, handler });
  updateEventHandlerCounts();
};

/**
 * イベントハンドラを削除する
 * @param eventName イベント名
 * @param handler イベントハンドラ
 */
const removeHandler = <K extends keyof CommentEventHandlerMap>(
  eventName: K,
  handler: CommentEventHandlerMap[K],
) => {
  handlerList = handlerList.filter(
    (item) => item.eventName !== eventName || item.handler !== handler,
  );
  updateEventHandlerCounts();
};

/**
 * イベントハンドラの登録数を更新する
 */
const updateEventHandlerCounts = () => {
  for (const key_ of Object.keys(handlerCounts)) {
    const key = key_ as keyof CommentEventHandlerMap;
    handlerCounts[key] = handlerList.filter(
      (item) => item.eventName === key,
    ).length;
  }
};

/**
 * イベントを実行する
 * @param vpos 現在のvpos
 * @param lastVpos 前回のvpos
 */
const triggerHandler = (vpos: number, lastVpos: number) => {
  processCommentDisableScript(vpos, lastVpos);
  processSeekDisableScript(vpos, lastVpos);
  processJumpScript(vpos, lastVpos);
};

/**
 * コメント禁止コマンドを処理する
 * @param vpos 現在のvpos
 * @param lastVpos 前回のvpos
 */
const processCommentDisableScript = (vpos: number, lastVpos: number) => {
  if (handlerCounts.commentDisable < 1 && handlerCounts.commentEnable < 1)
    return;
  for (const range of nicoScripts.ban) {
    const vposInRange = range.start < vpos && vpos < range.end;
    const lastVposInRange = range.start < lastVpos && lastVpos < range.end;
    if (vposInRange && !lastVposInRange) {
      executeEvents("commentDisable", {
        type: "commentDisable",
        timeStamp: Date.now(),
        vpos: vpos,
      });
    } else if (!vposInRange && lastVposInRange) {
      executeEvents("commentEnable", {
        type: "commentEnable",
        timeStamp: Date.now(),
        vpos: vpos,
      });
    }
  }
};

/**
 * シーク禁止コマンドを処理する
 * @param vpos 現在のvpos
 * @param lastVpos 前回のvpos
 */
const processSeekDisableScript = (vpos: number, lastVpos: number) => {
  if (handlerCounts.seekDisable < 1 && handlerCounts.seekEnable < 1) return;
  for (const range of nicoScripts.seekDisable) {
    const vposInRange = range.start < vpos && vpos < range.end;
    const lastVposInRange = range.start < lastVpos && lastVpos < range.end;
    if (vposInRange && !lastVposInRange) {
      executeEvents("seekDisable", {
        type: "seekDisable",
        timeStamp: Date.now(),
        vpos: vpos,
      });
    } else if (!vposInRange && lastVposInRange) {
      executeEvents("seekEnable", {
        type: "seekEnable",
        timeStamp: Date.now(),
        vpos: vpos,
      });
    }
  }
};

/**
 * ジャンプコマンドを処理する
 * @param vpos 現在のvpos
 * @param lastVpos 前回のvpos
 */
const processJumpScript = (vpos: number, lastVpos: number) => {
  if (handlerCounts.jump < 1) return;
  for (const range of nicoScripts.jump) {
    const vposInRange = range.start < vpos && (!range.end || vpos < range.end);
    const lastVposInRange =
      range.start < lastVpos && (!range.end || lastVpos < range.end);
    if (vposInRange && !lastVposInRange) {
      executeEvents("jump", {
        type: "jump",
        timeStamp: Date.now(),
        vpos: vpos,
        to: range.to,
        message: range.message,
      });
    }
  }
};

/**
 * 特定のイベントに紐付けられたイベントハンドラを実行する
 * @param eventName イベント名
 * @param event イベントのデータ
 */
const executeEvents = <K extends keyof CommentEventMap>(
  eventName: K,
  event: CommentEventMap[K],
) => {
  for (const item of handlerList) {
    if (eventName !== item.eventName) continue;
    (item.handler as (event: CommentEventMap[K]) => unknown)(event);
  }
};

export { registerHandler, removeHandler, triggerHandler };
