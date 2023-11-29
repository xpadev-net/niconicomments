import type {
  FormattedComment,
  FormattedCommentWithFont,
  FormattedCommentWithSize,
  IComment,
  MeasureTextInput,
  MeasureTextResult,
  ParseContentResult,
  Position,
} from "@/@types/";
import type { IRenderer } from "@/@types/renderer";
import { imageCache } from "@/contexts";
import { isDebug } from "@/contexts/debug";
import { config } from "@/definition/config";
import { NotImplementedError } from "@/errors/";
import { getPosX, isBanActive, isReverseActive, parseFont } from "@/utils";

/**
 * コメントの描画を行うクラスの基底クラス
 */
class BaseComment implements IComment {
  protected readonly renderer: IRenderer;
  protected cacheKey: string;
  public comment: FormattedCommentWithSize;
  public pos: {
    x: number;
    y: number;
  };
  public posY: number;
  public readonly pluginName: string = "BaseComment";
  public image?: IRenderer | null;
  public buttonImage?: IRenderer | null;

  /**
   * コンストラクタ
   * @param comment 処理対象のコメント
   * @param renderer 描画対象のレンダラークラス
   */
  constructor(comment: FormattedComment, renderer: IRenderer) {
    this.renderer = renderer;
    this.posY = 0;
    this.pos = { x: 0, y: 0 };
    comment.content = comment.content.replace(/\t/g, "\u2003\u2003");
    this.comment = this.convertComment(comment);
    this.cacheKey = this.getCacheKey();
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
  get content() {
    throw new NotImplementedError(this.pluginName, "set: content");
  }
  set content(_: string) {
    throw new NotImplementedError(this.pluginName, "set: content");
  }

  /**
   * コメントの描画サイズを計算する
   * @param parsedData コメント
   * @returns 描画サイズを含むコメント
   */
  protected getCommentSize(
    parsedData: FormattedCommentWithFont,
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
    comment: FormattedComment,
  ): FormattedCommentWithFont {
    console.error(
      "parseCommandAndNicoscript method is not implemented",
      comment,
    );
    throw new NotImplementedError(this.pluginName, "parseCommandAndNicoscript");
  }

  /**
   * コメントの本文をパースする
   * @param comment 処理対象のコメント本文
   * @returns 処理結果
   */
  protected parseContent(comment: string): ParseContentResult {
    console.error("parseContent method is not implemented", comment);
    throw new NotImplementedError(this.pluginName, "parseContent");
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
    comment: FormattedComment,
  ): FormattedCommentWithSize {
    console.error("convertComment method is not implemented", comment);
    throw new NotImplementedError(this.pluginName, "convertComment");
  }

  /**
   * コメントを描画する
   * @param vpos vpos
   * @param showCollision 当たり判定を表示するか
   * @param cursor カーソルの位置
   */
  public draw(vpos: number, showCollision: boolean, cursor?: Position) {
    if (isBanActive(vpos)) return;
    const reverse = isReverseActive(vpos, this.comment.owner);
    const posX = getPosX(this.comment, vpos, reverse);
    const posY =
      this.comment.loc === "shita"
        ? config.canvasHeight - this.posY - this.comment.height
        : this.posY;
    this.pos = {
      x: posX,
      y: posY,
    };
    this._drawBackgroundColor(posX, posY);
    this._draw(posX, posY, cursor);
    this._drawRectColor(posX, posY);
    this._drawCollision(posX, posY, showCollision);
    this._drawDebugInfo(posX, posY);
  }

  /**
   * コメント本体を描画する
   * @param posX 描画位置
   * @param posY 描画位置
   * @param cursor カーソルの位置
   */
  protected _draw(posX: number, posY: number, cursor?: Position) {
    if (this.image === undefined) {
      this.image = this.getTextImage();
    }
    if (this.image) {
      this.renderer.save();
      if (this.comment._live) {
        this.renderer.setGlobalAlpha(config.contextFillLiveOpacity);
      } else {
        this.renderer.setGlobalAlpha(1);
      }
      if (this.comment.button && !this.comment.button.hidden) {
        const button = this.getButtonImage(posX, posY, cursor);
        button && this.renderer.drawImage(button, posX, posY);
      }
      this.renderer.drawImage(this.image, posX, posY);
      this.renderer.restore();
    }
  }

  /**
   * 枠コマンドで指定されている場合に枠を描画する
   * @param posX 描画位置
   * @param posY 描画位置
   */
  protected _drawRectColor(posX: number, posY: number) {
    if (this.comment.wakuColor) {
      this.renderer.save();
      this.renderer.setStrokeStyle(this.comment.wakuColor);
      this.renderer.strokeRect(
        posX,
        posY,
        this.comment.width,
        this.comment.height,
      );
      this.renderer.restore();
    }
  }

  /**
   * コメントの背景を描画する
   * @param posX 描画位置
   * @param posY 描画位置
   */
  protected _drawBackgroundColor(posX: number, posY: number) {
    if (this.comment.fillColor) {
      this.renderer.save();
      this.renderer.setFillStyle(this.comment.fillColor);
      this.renderer.fillRect(
        posX,
        posY,
        this.comment.width,
        this.comment.height,
      );
      this.renderer.restore();
    }
  }

  /**
   * コメントのメタデータを描画する
   * @param posX 描画位置
   * @param posY 描画位置
   */
  protected _drawDebugInfo(posX: number, posY: number) {
    if (isDebug) {
      this.renderer.save();
      this.renderer.setFont(parseFont("defont", 30));
      this.renderer.setFillStyle("#ff00ff");
      this.renderer.fillText(this.comment.mail.join(","), posX, posY + 30);
      this.renderer.restore();
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
      showCollision,
    );
    throw new NotImplementedError(this.pluginName, "_drawCollision");
  }

  /**
   * コメントの画像を生成する
   * @returns 生成した画像
   */
  protected getTextImage(): IRenderer | null {
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
      window.setTimeout(
        () => {
          delete this.image;
        },
        this.comment.long * 10 + config.cacheAge,
      );
      clearTimeout(cache.timeout);
      cache.timeout = window.setTimeout(
        () => {
          imageCache[this.cacheKey]?.image.destroy();
          delete imageCache[this.cacheKey];
        },
        this.comment.long * 10 + config.cacheAge,
      );
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
  protected _generateTextImage(): IRenderer {
    console.error("_generateTextImage method is not implemented");
    throw new NotImplementedError(this.pluginName, "_generateTextImage");
  }

  /**
   * 画像をキャッシュする
   * @param image キャッシュ対象の画像
   */
  protected _cacheImage(image: IRenderer) {
    this.image = image;
    window.setTimeout(
      () => {
        delete this.image;
      },
      this.comment.long * 10 + config.cacheAge,
    );
    imageCache[this.cacheKey] = {
      timeout: window.setTimeout(
        () => {
          delete imageCache[this.cacheKey];
        },
        this.comment.long * 10 + config.cacheAge,
      ),
      image,
    };
  }

  protected getButtonImage(
    posX: number,
    posY: number,
    cursor?: Position,
  ): IRenderer | undefined {
    console.error(
      "getButtonImage method is not implemented",
      posX,
      posY,
      cursor,
    );
    throw new NotImplementedError(this.pluginName, "getButtonImage");
  }

  public isHovered(cursor?: Position, posX?: number, posY?: number): boolean {
    console.error("isHovered method is not implemented", posX, posY, cursor);
    throw new NotImplementedError(this.pluginName, "getButtonImage");
  }

  protected getCacheKey() {
    return (
      JSON.stringify(this.comment.content) +
      `@@${this.pluginName}@@` +
      [...this.comment.mail].sort((a, b) => a.localeCompare(b)).join(",")
    );
  }
}

export { BaseComment };
