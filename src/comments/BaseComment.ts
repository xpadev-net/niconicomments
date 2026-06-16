import type {
  BaseConfig,
  FormattedComment,
  FormattedCommentWithFont,
  FormattedCommentWithSize,
  FrameActiveState,
  IComment,
  IRenderer,
  MeasureTextInput,
  MeasureTextResult,
  ParseContentResult,
  Position,
} from "@/@types/";
import type { CommentInstanceContext } from "@/contexts";
import { NotImplementedError } from "@/errors/";
import { getPosX, isBanActive, isReverseActive, parseFont } from "@/utils";

// Matches strings that contain no visible glyphs: JS \s (covers U+0020,
// U+00A0, U+FEFF, U+3000, etc.) plus zero-width / Hangul filler codepoints
// that \s does not include.
const VISUALLY_BLANK_RE =
  /^[\s\u00AD\u200B-\u200D\u2060\u115F\u1160\u3164\uFFA0]*$/;

const MAX_CACHE_KEY_CONTENT_LENGTH = 512;
const MAX_CACHE_KEY_EDGE_LENGTH = 256;
const MAX_IMAGE_CACHE_ENTRIES = 1024;
const imageCacheEntries = new WeakMap<object, Set<string>>();
const destroyedTextImages = new WeakSet<IRenderer>();

const destroyTextImage = (image: IRenderer) => {
  // Legacy runtime renderers without destroy() are covered by
  // html5-resource-bounds tests; only destroyed modern images need tracking.
  if (typeof image.destroy !== "function") return false;
  if (destroyedTextImages.has(image)) return false;
  destroyedTextImages.add(image);
  image.destroy();
  return true;
};

const hashString = (input: string) => {
  let hash = 2166136261;
  for (let i = 0, n = input.length; i < n; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

const boundedCachePart = (input: string) => {
  if (input.length <= MAX_CACHE_KEY_CONTENT_LENGTH) return input;
  return `${input.slice(0, MAX_CACHE_KEY_EDGE_LENGTH)}\0${input.slice(-MAX_CACHE_KEY_EDGE_LENGTH)}\0${input.length}\0${hashString(input)}`;
};

const isOutsideStage = (
  posX: number,
  posY: number,
  width: number,
  height: number,
  config: BaseConfig,
) =>
  !Number.isFinite(posX) ||
  !Number.isFinite(posY) ||
  !Number.isFinite(width) ||
  !Number.isFinite(height) ||
  width <= 0 ||
  height <= 0 ||
  posX >= config.canvasWidth ||
  posY >= config.canvasHeight ||
  posX + width <= 0 ||
  posY + height <= 0;

/**
 * コメントの描画を行うクラスの基底クラス
 */
class BaseComment implements IComment {
  protected readonly renderer: IRenderer;
  protected readonly config: BaseConfig;
  protected readonly ctx: CommentInstanceContext;
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
  public index: number;
  private readonly _timeoutIds = new Set<number>();
  private _destroyed = false;

  /**
   * コンストラクタ
   * @param comment 処理対象のコメント
   * @param renderer 描画対象のレンダラークラス
   * @param index コメントのインデックス
   * @param ctx インスタンスコンテキスト
   */
  constructor(
    comment: FormattedComment,
    renderer: IRenderer,
    index: number,
    ctx: CommentInstanceContext,
  ) {
    this.renderer = renderer;
    this.ctx = ctx;
    this.config = ctx.config;
    this.posY = -1;
    this.pos = { x: 0, y: 0 };
    comment.content = comment.content.replace(/\t/g, "  ");
    this.comment = this.convertComment(comment);
    this.cacheKey = this.getCacheKey();
    this.index = index;
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
   * @param frameActiveState フレーム単位で計算済みの active state
   */
  public draw(
    vpos: number,
    showCollision: boolean,
    cursor?: Position,
    frameActiveState?: FrameActiveState,
  ) {
    const { nicoScripts, rangeCache } = this.ctx;
    const banActive =
      frameActiveState?.banActive ?? isBanActive(vpos, nicoScripts, rangeCache);
    if (banActive) return;
    const reverse = this.comment.owner
      ? (frameActiveState?.reverseActiveOwner ??
        isReverseActive(vpos, true, nicoScripts, rangeCache))
      : (frameActiveState?.reverseActiveViewer ??
        isReverseActive(vpos, false, nicoScripts, rangeCache));
    const posX = getPosX(this.comment, vpos, this.config, reverse);
    const posY =
      this.comment.loc === "shita"
        ? this.config.canvasHeight - this.posY - this.comment.height
        : this.posY;
    this.pos = {
      x: posX,
      y: posY,
    };
    if (
      isOutsideStage(
        posX,
        posY,
        this.comment.width,
        this.comment.height,
        this.config,
      )
    ) {
      return;
    }
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
    if (this.image && destroyedTextImages.has(this.image)) {
      this.image = undefined;
    }
    if (this.image === undefined) {
      this.image = this.getTextImage();
    }
    if (this.image) {
      const effectiveAlpha =
        typeof this.comment.opacity === "number"
          ? this.comment.opacity
          : this.comment._live
            ? this.config.contextFillLiveOpacity
            : 1;
      if (effectiveAlpha !== 1) {
        this.renderer.save();
        this.renderer.setGlobalAlpha(effectiveAlpha);
      }
      try {
        if (this.comment.button && !this.comment.button.hidden) {
          const button = this.getButtonImage(posX, posY, cursor);
          button && this.renderer.drawImage(button, posX, posY);
        }
        this.renderer.drawImage(this.image, posX, posY);
      } finally {
        if (effectiveAlpha !== 1) {
          this.renderer.restore();
        }
      }
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
      try {
        this.renderer.setStrokeStyle(this.comment.wakuColor);
        this.renderer.strokeRect(
          posX,
          posY,
          this.comment.width,
          this.comment.height,
        );
      } finally {
        this.renderer.restore();
      }
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
      try {
        this.renderer.setFillStyle(this.comment.fillColor);
        this.renderer.fillRect(
          posX,
          posY,
          this.comment.width,
          this.comment.height,
        );
      } finally {
        this.renderer.restore();
      }
    }
  }

  /**
   * コメントのメタデータを描画する
   * @param posX 描画位置
   * @param posY 描画位置
   */
  protected _drawDebugInfo(posX: number, posY: number) {
    if (this.ctx.options.debug) {
      this.renderer.save();
      try {
        this.renderer.setFont(parseFont("defont", 30, this.config));
        this.renderer.setFillStyle("#ff00ff");
        this.renderer.fillText(this.comment.mail.join(","), posX, posY + 30);
      } finally {
        this.renderer.restore();
      }
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
    if (this._destroyed) return null;
    if (
      this.comment.invisible ||
      (this.comment.lineCount === 1 && this.comment.width === 0) ||
      this.comment.height - (this.comment.charSize - this.comment.lineHeight) <=
        0 ||
      !this.canGenerateTextImage() ||
      VISUALLY_BLANK_RE.test(this.comment.rawContent)
    )
      return null;
    const key = this.cacheKey;
    const { imageCache, config } = this.ctx;
    const cache = imageCache.get(key);
    if (cache) {
      const entries = imageCacheEntries.get(imageCache);
      if (entries?.delete(key)) {
        entries.add(key);
      }
      this.image = cache.image;
      this._setCommentImageClearTimeout(
        this.comment.long * 10 + config.cacheAge,
      );
      clearTimeout(cache.timeout);
      const cachedImage = cache.image;
      cache.timeout = this._setCacheImageExpiryTimeout(
        key,
        cachedImage,
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
    const key = this.cacheKey;
    const { imageCache, config } = this.ctx;
    const lifetime = this.comment.long * 10 + config.cacheAge;
    let entries = imageCacheEntries.get(imageCache);
    if (!entries) {
      entries = new Set();
      imageCacheEntries.set(imageCache, entries);
    }
    this.image = image;
    if (!entries.has(key) && entries.size >= MAX_IMAGE_CACHE_ENTRIES) {
      for (const entryKey of entries) {
        if (!imageCache.get(entryKey)) entries.delete(entryKey);
      }
    }
    if (!entries.has(key) && entries.size >= MAX_IMAGE_CACHE_ENTRIES) {
      const oldestKey = entries.keys().next().value;
      if (oldestKey !== undefined) {
        const oldest = imageCache.get(oldestKey);
        if (oldest) {
          clearTimeout(oldest.timeout);
          destroyTextImage(oldest.image);
        }
        imageCache.delete(oldestKey);
        entries.delete(oldestKey);
      }
    }
    this._setCommentImageClearTimeout(lifetime);
    const timeout = this._setCacheImageExpiryTimeout(key, image, lifetime);
    imageCache.set(key, {
      timeout,
      image,
    });
    entries.delete(key);
    entries.add(key);
  }

  protected canGenerateTextImage(): boolean {
    return true;
  }

  protected getButtonImage(
    _posX: number,
    _posY: number,
    _cursor?: Position,
  ): IRenderer | undefined {
    return undefined;
  }

  public isHovered(
    _cursor?: Position,
    _posX?: number,
    _posY?: number,
  ): boolean {
    return false;
  }

  protected getCacheKey() {
    const mail = boundedCachePart(JSON.stringify(this.comment.mail ?? []));
    return `${this.pluginName}\0${mail}\0${boundedCachePart(this.comment.rawContent)}`;
  }

  private _setCommentImageClearTimeout(lifetime: number): void {
    const timeout = window.setTimeout(() => {
      this._timeoutIds.delete(timeout);
      this.image = undefined;
    }, lifetime);
    this._timeoutIds.add(timeout);
  }

  private _setCacheImageExpiryTimeout(
    key: string,
    image: IRenderer,
    lifetime: number,
  ): number {
    const timeout = window.setTimeout(() => {
      this._timeoutIds.delete(timeout);
      if (this.ctx.imageCache.get(key)?.image === image) {
        destroyTextImage(image);
        this.ctx.imageCache.delete(key);
        imageCacheEntries.get(this.ctx.imageCache)?.delete(key);
      }
    }, lifetime);
    this._timeoutIds.add(timeout);
    return timeout;
  }

  public destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    for (const timeout of this._timeoutIds) {
      clearTimeout(timeout);
    }
    this._timeoutIds.clear();
    const textImage = this.image;
    if (textImage) {
      const cachedImage = this.ctx.imageCache.get(this.cacheKey)?.image;
      if (cachedImage !== textImage) {
        destroyTextImage(textImage);
      }
    }
    this.image = null;
    if (this.buttonImage && this.buttonImage !== textImage) {
      destroyTextImage(this.buttonImage);
    }
    this.buttonImage = null;
  }
}

export { BaseComment };
