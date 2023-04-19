import { formattedComment } from "@/@types/format.formatted";
import { IComment } from "@/@types/IComment";
import { formattedCommentWithSize } from "@/@types/types";
import { config } from "@/definition/config";
import { NotImplementedError } from "@/errors/NotImplementedError";
import { getPosX, parseFont } from "@/util";
import { isBanActive, isReverseActive } from "@/utils/comment";

class BaseComment implements IComment {
  protected readonly context: CanvasRenderingContext2D;
  public comment: formattedCommentWithSize;
  public posY: number;
  public readonly pluginName: string = "BaseComment";
  public image?: HTMLCanvasElement | null;
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
    if (isBanActive(vpos)) return;
    const reverse = isReverseActive(vpos, this.comment.owner);
    const posX = getPosX(this.comment, vpos, reverse);
    const posY =
      this.comment.loc === "shita"
        ? config.canvasHeight - this.posY - this.comment.height
        : this.posY;
    this._draw(posX, posY);
    this._drawRectColor(posX, posY);
    this._drawCollision(posX, posY, showCollision);
    this._drawDebugInfo(posX, posY, debug);
  }

  _draw(posX: number, posY: number) {
    if (this.image === undefined) {
      this.image = this.getTextImage();
    }
    if (this.image) {
      if (this.comment._live) {
        this.context.globalAlpha = config.contextFillLiveOpacity;
      } else {
        this.context.globalAlpha = 1;
      }
      this.context.drawImage(this.image, posX, posY);
    }
  }

  _drawRectColor(posX: number, posY: number) {
    if (this.comment.wakuColor) {
      this.context.strokeStyle = this.comment.wakuColor;
      this.context.strokeRect(
        posX,
        posY,
        this.comment.width,
        this.comment.height
      );
    }
  }
  _drawDebugInfo(posX: number, posY: number, debug: boolean) {
    if (debug) {
      const font = this.context.font;
      const fillStyle = this.context.fillStyle;
      this.context.font = parseFont("defont", 30);
      this.context.fillStyle = "#ff00ff";
      this.context.fillText(this.comment.mail.join(","), posX, posY + 30);
      this.context.font = font;
      this.context.fillStyle = fillStyle;
    }
  }
  _drawCollision(posX: number, posY: number, showCollision: boolean) {
    console.error(
      "_drawCollision method is not implemented",
      posX,
      posY,
      showCollision
    );
    throw new NotImplementedError(this.pluginName, "_drawCollision");
  }
  getTextImage(): HTMLCanvasElement | null {
    console.error("getTextImage method is not implemented");
    throw new NotImplementedError(this.pluginName, "getTextImage");
  }
}

export { BaseComment };
