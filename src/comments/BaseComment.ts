import { formattedComment } from "@/@types/format.formatted";
import { IComment } from "@/@types/IComment";
import { formattedCommentWithSize } from "@/@types/types";
import { NotImplementedError } from "@/errors/NotImplementedError";

class BaseComment implements IComment {
  protected readonly context: CanvasRenderingContext2D;
  public comment: formattedCommentWithSize;
  public posY: number;
  public readonly pluginName: string = "BaseComment";
  constructor(comment: formattedComment, context: CanvasRenderingContext2D) {
    this.context = context;
    this.posY = 0;
    comment.content = comment.content.replace(/\t/g, "\u2003\u2003");
    this.comment = this.convertComment(comment);
  }
  get invisible() {
    return this.comment.invisible;
  }
  get loc() {
    return this.comment.loc;
  }
  get long() {
    return this.comment.long;
  }
  get vpos() {
    return this.comment.vpos;
  }
  get width() {
    return this.comment.width;
  }
  get height() {
    return this.comment.height;
  }
  get flash() {
    return false;
  }
  get layer() {
    return this.comment.layer;
  }
  get owner() {
    return this.comment.owner;
  }
  get mail() {
    return this.comment.mail;
  }
  convertComment(comment: formattedComment) {
    console.error("convertComment method is not implemented", comment);
    throw new NotImplementedError(this.pluginName, "convertComment");
    return {} as formattedCommentWithSize;
  }
  draw(vpos: number, showCollision: boolean, debug: boolean) {
    console.error("draw method is not implemented", vpos, showCollision, debug);
    throw new NotImplementedError(this.pluginName, "draw");
  }
  getTextImage(vpos: number) {
    console.error("getTextImage method is not implemented", vpos);
    throw new NotImplementedError(this.pluginName, "getTextImage");
  }
}

export { BaseComment };
