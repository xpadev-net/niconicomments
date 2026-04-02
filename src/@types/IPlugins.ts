import type { IComment, IRenderer } from "@/@types/";

export interface IPluginConstructor {
  id: string;
  new (Canvas: IRenderer, comments: IComment[]): IPlugin;
}

export interface IPlugin {
  /**
   * Returning false skips texture invalidation only; compositing still runs.
   * Do not return false before your canvas has been rendered at least once.
   * Plugins with static canvases should still implement draw() and return
   * false after first render to skip per-frame texture invalidation.
   */
  draw?: (vpos: number) => boolean | undefined;
  addComments?: (comments: IComment[]) => void;
  transformComments?: (comments: IComment[]) => IComment[];
}

export type IPluginList = {
  instance: IPlugin;
  canvas: IRenderer;
}[];
