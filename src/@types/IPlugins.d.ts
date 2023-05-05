import type { FormattedComment } from "@/@types/";

export interface IPluginConstructor {
  id: string;
  new (Canvas: HTMLCanvasElement, comments: FormattedComment[]): IPlugin;
}

export interface IPlugin {
  draw(vpos: number): void;
  addComments(comments: FormattedComment[]): void;
}
