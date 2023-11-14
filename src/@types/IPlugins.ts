import type { Canvas, IComment } from "@/@types/";

export interface IPluginConstructor {
  id: string;
  new (Canvas: Canvas, comments: IComment[]): IPlugin;
}

export interface IPlugin {
  draw?: (vpos: number) => void;
  addComments?: (comments: IComment[]) => void;
  transformComments?: (comments: IComment[]) => IComment[];
}

export type IPluginList = {
  instance: IPlugin;
  canvas: HTMLCanvasElement;
}[];
