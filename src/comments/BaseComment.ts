import type {
  Canvas,
  Context2D,
  FormattedComment,
  FormattedCommentWithFont,
  FormattedCommentWithSize,
  IComment,
  MeasureTextInput,
  MeasureTextResult,
} from "@/@types/";
import { imageCache } from "@/contexts";
import { config } from "@/definition/config";
import { NotImplementedError } from "@/errors/";
import { getPosX, isBanActive, isReverseActive, parseFont } from "@/utils";
import { drawImage, generateCanvas, getContext } from "@/utils/canvas";

/**
 * コメントの描画を行うクラスの基底クラス
 */
class BaseComment implements IComment {
  protected readonly context: Context2D;
  protected readonly cacheKey: string;
  public comment: FormattedCommentWithSize;
  public posY: number;
  public readonly pluginName: string = "BaseComment";
  public image?: Canvas | null;

  /**
   * コンストラクタ
   * @param comment 処理対象のコメント
   * @param context 描画対象のcanvasのcontext
   */
  constructor(comment: FormattedComment, context: Context2D) {
    this.context = context;
    this.posY = 0;
    comment.content = comment.content.replace(/\t/g, "\u2003\u2003");
    this.comment = this.convertComment(comment);
    this.cacheKey =
      JSON.stringify(this.comment.content) +
      `@@${this.pluginName}@@` +
      [...this.comment.mail].sort().join(",");
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
   * @param parsedData コメント
   * @returns 描画サイズを含むコメント
   */
  protected getCommentSize(
    parsedData: FormattedCommentWithFont
  ): FormattedCommentWithSize {
    console.error("getCommentSize method is not implemented", parsedData);
    throw new NotImplementedError(this.pluginName, "getCommentSize");
  }

  /**
   * コメントに含まれるニコスクリプトを処理する
   * @param comment 処理対象のコメント
   * @returns 処理結果
   */
  protected parseCommandAndNicoscript(
    comment: FormattedComment
  ): FormattedCommentWithFont {
    console.error(
      "parseCommandAndNicoscript method is not implemented",
      comment
    );
    throw new NotImplementedError(this.pluginName, "parseCommandAndNicoscript");
  }

  /**
   * context.measureTextの複数行対応版
   * 画面外にはみ出すコメントの縮小も行う
   * @param comment - 独自フォーマットのコメントデータ
   * @returns - 描画サイズとリサイズの情報
   */
  protected measureText(comment: MeasureTextInput): MeasureTextResult {
    console.error("measureText method is not implemented", comment);
    throw new NotImplementedError(this.pluginName, "measureText");
  }

  /**
   * サイズ計測などを行うためのラッパー関数
   * @param comment コンストラクタで受け取ったコメント
   * @returns 描画サイズを含むコメント
   */
  protected convertComment(
    comment: FormattedComment
  ): FormattedCommentWithSize {
    console.error("convertComment method is not implemented", comment);
    throw new NotImplementedError(this.pluginName, "convertComment");
  }

  /**
   * コメントを描画する
   * @param vpos vpos
   * @param showCollision 当たり判定を表示するか
   * @param debug デバッグ情報を表示するか
   */
  public draw(vpos: number, showCollision: boolean, debug: boolean) {
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

  /**
   * コメント本体を描画する
   * @param posX 描画位置
   * @param posY 描画位置
   */
  protected _draw(posX: number, posY: number) {
    if (this.image === undefined) {
      this.image = this.getTextImage();
    }
    if (this.image) {
      if (this.comment._live) {
        this.context.globalAlpha = config.contextFillLiveOpacity;
      } else {
        this.context.globalAlpha = 1;
      }
      drawImage(this.context, this.image, posX, posY);
    }
  }

  /**
   * 枠コマンドで指定されている場合に枠を描画する
   * @param posX 描画位置
   * @param posY 描画位置
   */
  protected _drawRectColor(posX: number, posY: number) {
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

  /**
   * コメントのメタデータを描画する
   * @param posX 描画位置
   * @param posY 描画位置
   * @param debug デバッグモードかどうか
   */
  protected _drawDebugInfo(posX: number, posY: number, debug: boolean) {
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

  /**
   * コメントの当たり判定を描画する
   * @param posX 描画位置
   * @param posY 描画位置
   * @param showCollision 当たり判定を表示するかどうか
   */
  protected _drawCollision(posX: number, posY: number, showCollision: boolean) {
    console.error(
      "_drawCollision method is not implemented",
      posX,
      posY,
      showCollision
    );
    throw new NotImplementedError(this.pluginName, "_drawCollision");
  }

  /**
   * コメントの画像を生成する
   * @returns 生成した画像
   */
  protected getTextImage(): Canvas | null {
    if (
      this.comment.invisible ||
      (this.comment.lineCount === 1 && this.comment.width === 0) ||
      this.comment.height - (this.comment.charSize - this.comment.lineHeight) <=
        0
    )
      return null;
    const cache = imageCache[this.cacheKey];
    if (cache) {
      this.image = cache.image;
      setTimeout(() => {
        delete this.image;
      }, this.comment.long * 10 + config.cacheAge);
      clearTimeout(cache.timeout);
      cache.timeout = setTimeout(() => {
        delete imageCache[this.cacheKey];
      }, this.comment.long * 10 + config.cacheAge);
      return cache.image;
    }
    if (this.image) return this.image;
    const image = this._generateTextImage();
    this._cacheImage(image);
    return image;
  }

  /**
   * コメントの画像を実際に生成する
   */
  protected _generateTextImage(): Canvas {
    console.error("_generateTextImage method is not implemented");
    throw new NotImplementedError(this.pluginName, "_generateTextImage");
  }

  /**
   * 画像をキャッシュする
   * @param image キャッシュ対象の画像
   */
  protected _cacheImage(image: Canvas) {
    this.image = image;
    setTimeout(() => {
      delete this.image;
    }, this.comment.long * 10 + config.cacheAge);
    imageCache[this.cacheKey] = {
      timeout: setTimeout(() => {
        delete imageCache[this.cacheKey];
      }, this.comment.long * 10 + config.cacheAge),
      image,
    };
  }

  /**
   * Canvasを生成する
   * @returns 生成したCanvas
   */
  protected createCanvas(): {
    image: Canvas;
    context: Context2D;
  } {
    const image = generateCanvas();
    const context = getContext(image);
    return {
      image,
      context,
    };
  }
}

export { BaseComment };
