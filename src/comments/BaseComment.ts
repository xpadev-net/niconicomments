import type {
  formattedComment,
  formattedCommentWithSize,
  IComment,
} from "@/@types/";
import {
  formattedCommentWithFont,
  measureTextInput,
  measureTextResult,
} from "@/@types/";
import { config, options } from "@/definition/config";
import { NotImplementedError } from "@/errors/";
import { getPosX, isBanActive, isReverseActive, parseFont } from "@/utils";

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

  /**
   * コメントの描画サイズを計算する
   */
  getCommentSize(
    parsedData: formattedCommentWithFont
  ): formattedCommentWithSize {
    this.context.font = parseFont(parsedData.font, parsedData.fontSize);
    const size = parsedData as formattedCommentWithSize;
    if (parsedData.invisible) {
      size.height = 0;
      size.width = 0;
      size.lineHeight = 0;
      size.fontSize = 0;
      size.content = [];
      size.resized = false;
      size.resizedX = false;
      size.resizedY = false;
      size.charSize = 0;
      return size;
    }
    const measure = this.measureText(parsedData);
    if (options.scale !== 1 && size.layer === -1) {
      measure.height *= options.scale;
      measure.width *= options.scale;
      measure.fontSize *= options.scale;
    }
    size.height = measure.height;
    size.width = measure.width;
    size.lineHeight = measure.lineHeight;
    size.fontSize = measure.fontSize;
    size.content = measure.content;
    size.resized = measure.resized;
    size.resizedX = measure.resizedX;
    size.resizedY = measure.resizedY;
    size.charSize = measure.charSize;
    return size;
  }
  /**
   * context.measureTextの複数行対応版
   * 画面外にはみ出すコメントの縮小も行う
   * @param comment - 独自フォーマットのコメントデータ
   * @returns {{resized: boolean, width: number, width: number, fontSize: number, width_min: number, height: number, lineHeight: number}} - 描画サイズとリサイズの情報
   */
  measureText(comment: measureTextInput): measureTextResult {
    console.error("measureText method is not implemented", comment);
    throw new NotImplementedError(this.pluginName, "measureText");
  }
  convertComment(comment: formattedComment): formattedCommentWithSize {
    console.error("convertComment method is not implemented", comment);
    throw new NotImplementedError(this.pluginName, "convertComment");
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
