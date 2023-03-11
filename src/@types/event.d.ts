export interface CommentEventBase {
  type: CommentEventName;
  timeStamp: number;
  vpos: number;
}

export interface SeekDisableEvent extends CommentEventBase {
  type: "seekDisable";
}

export type SeekDisableEventHandler = (event: SeekDisableEvent) => unknown;

export interface SeekEnableEvent extends CommentEventBase {
  type: "seekEnable";
}
export type SeekEnableEventHandler = (event: SeekEnableEvent) => unknown;

export interface CommentDisableEvent extends CommentEventBase {
  type: "commentDisable";
}
export type CommentDisableEventHandler = (
  event: CommentDisableEvent
) => unknown;

export interface CommentEnableEvent extends CommentEventBase {
  type: "commentEnable";
}
export type CommentEnableEventHandler = (event: CommentEnableEvent) => unknown;

export interface JumpEvent extends CommentEventBase {
  type: "jump";
  to: string;
  message?: string;
}
export type JumpEventHandler = (event: JumpEvent) => unknown;

export type CommentEventName =
  | "seekDisable"
  | "seekEnable"
  | "commentDisable"
  | "commentEnable"
  | "jump";
export interface CommentEventHandlerMap {
  seekDisable: SeekDisableEventHandler;
  seekEnable: SeekEnableEventHandler;
  commentDisable: CommentDisableEventHandler;
  commentEnable: CommentEnableEventHandler;
  jump: JumpEventHandler;
}
export interface CommentEventMap {
  seekDisable: SeekDisableEvent;
  seekEnable: SeekEnableEvent;
  commentDisable: CommentDisableEvent;
  commentEnable: CommentEnableEvent;
  jump: JumpEvent;
}
