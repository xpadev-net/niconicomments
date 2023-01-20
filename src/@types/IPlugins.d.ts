import { formattedComment } from "@/@types/format.formatted";

export interface IPluginConstructor {
  id: string;
  new (Canvas: HTMLCanvasElement, comments: formattedComment[]): IPlugin;
}

export interface IPlugin {
  draw(vpos: number): void;
  addComments(comments: formattedComment[]): void;
}
