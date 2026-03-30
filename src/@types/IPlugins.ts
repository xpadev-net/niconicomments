import type { IComment, IRenderer } from "@/@types/";

export interface IPluginConstructor {
  id: string;
  new (Canvas: IRenderer, comments: IComment[]): IPlugin;
}

export interface IPlugin {
  /** Returning false skips texture invalidation only; compositing still runs. */
  draw?: (vpos: number) => boolean | undefined;
  addComments?: (comments: IComment[]) => void;
  transformComments?: (comments: IComment[]) => IComment[];
}

export type IPluginList = {
  instance: IPlugin;
  canvas: IRenderer;
}[];
