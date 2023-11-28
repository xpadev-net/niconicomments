import type { IComment } from "@/@types/";
import type { IRenderer } from "@/@types/renderer";

export interface IPluginConstructor {
  id: string;
  new (Canvas: IRenderer, comments: IComment[]): IPlugin;
}

export interface IPlugin {
  draw?: (vpos: number) => void;
  addComments?: (comments: IComment[]) => void;
  transformComments?: (comments: IComment[]) => IComment[];
}

export type IPluginList = {
  instance: IPlugin;
  canvas: IRenderer;
}[];
