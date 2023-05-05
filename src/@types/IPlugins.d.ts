import type { formattedComment } from "@/@types/";

export interface IPluginConstructor {
  id: string;
  new (Canvas: HTMLCanvasElement, comments: formattedComment[]): IPlugin;
}

export interface IPlugin {
  draw(vpos: number): void;
  addComments(comments: formattedComment[]): void;
}
