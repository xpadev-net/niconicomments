import type { Canvas, FormattedComment } from "@/@types/";

export interface IPluginConstructor {
  id: string;
  new (Canvas: Canvas, comments: FormattedComment[]): IPlugin;
}

export interface IPlugin {
  draw(vpos: number): void;
  addComments(comments: FormattedComment[]): void;
}
