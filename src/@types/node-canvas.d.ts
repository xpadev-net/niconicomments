/**
 * MIT License
 *
 * Copyright (c) 2020 lynweklm@gmail.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * original source: @napi-rs/canvas
 */

export class NodeCanvas {
  constructor(width: number, height: number, flag?: SvgExportFlag);

  width: number;
  height: number;
  getContext(
    contextType: "2d",
    contextAttributes?: ContextAttributes
  ): NodeContext;
  encodeSync(format: "webp" | "jpeg", quality?: number): Buffer;
  encodeSync(format: "png"): Buffer;
  encodeSync(format: "avif", cfg?: AvifConfig): Buffer;
  encode(format: "webp" | "jpeg", quality?: number): Promise<Buffer>;
  encode(format: "png"): Promise<Buffer>;
  encode(format: "avif", cfg?: AvifConfig): Promise<Buffer>;

  toBuffer(mime: "image/png"): Buffer;
  toBuffer(mime: "image/jpeg" | "image/webp", quality?: number): Buffer;
  toBuffer(mime: "image/avif", cfg?: AvifConfig): Buffer;
  // raw pixels
  data(): Buffer;
  toDataURL(mime?: "image/png"): string;
  toDataURL(mime: "image/jpeg" | "image/webp", quality?: number): string;
  toDataURL(
    mime?: "image/jpeg" | "image/webp" | "image/png",
    quality?: number
  ): string;
  toDataURL(mime?: "image/avif", cfg?: AvifConfig): string;

  toDataURLAsync(mime?: "image/png"): Promise<string>;
  toDataURLAsync(
    mime: "image/jpeg" | "image/webp",
    quality?: number
  ): Promise<string>;
  toDataURLAsync(
    mime?: "image/jpeg" | "image/webp" | "image/png",
    quality?: number
  ): Promise<string>;
  toDataURLAsync(mime?: "image/avif", cfg?: AvifConfig): Promise<string>;
}

export enum SvgExportFlag {
  ConvertTextToPaths = 0x01,
  NoPrettyXML = 0x02,
  RelativePathEncoding = 0x04,
}

export interface AvifConfig {
  /** 0-100 scale, 100 is lossless */
  quality?: number;
  /** 0-100 scale */
  alphaQuality?: number;
  /** rav1e preset 1 (slow) 10 (fast but crappy), default is 4 */
  speed?: number;
  /** How many threads should be used (0 = match core count) */
  threads?: number;
  /** set to '4:2:0' to use chroma subsampling, default '4:4:4' */
  chromaSubsampling?: ChromaSubsampling;
}
/**
 * https://en.wikipedia.org/wiki/Chroma_subsampling#Types_of_sampling_and_subsampling
 * https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Video_concepts
 */
export enum ChromaSubsampling {
  /**
   * Each of the three Y'CbCr components has the same sample rate, thus there is no chroma subsampling. This scheme is sometimes used in high-end film scanners and cinematic post-production.
   * Note that "4:4:4" may instead be wrongly referring to R'G'B' color space, which implicitly also does not have any chroma subsampling (except in JPEG R'G'B' can be subsampled).
   * Formats such as HDCAM SR can record 4:4:4 R'G'B' over dual-link HD-SDI.
   */
  Yuv444 = 0,
  /**
   * The two chroma components are sampled at half the horizontal sample rate of luma: the horizontal chroma resolution is halved. This reduces the bandwidth of an uncompressed video signal by one-third.
   * Many high-end digital video formats and interfaces use this scheme:
   * - [AVC-Intra 100](https://en.wikipedia.org/wiki/AVC-Intra)
   * - [Digital Betacam](https://en.wikipedia.org/wiki/Betacam#Digital_Betacam)
   * - [Betacam SX](https://en.wikipedia.org/wiki/Betacam#Betacam_SX)
   * - [DVCPRO50](https://en.wikipedia.org/wiki/DV#DVCPRO) and [DVCPRO HD](https://en.wikipedia.org/wiki/DV#DVCPRO_HD)
   * - [Digital-S](https://en.wikipedia.org/wiki/Digital-S)
   * - [CCIR 601](https://en.wikipedia.org/wiki/Rec._601) / [Serial Digital Interface](https://en.wikipedia.org/wiki/Serial_digital_interface) / [D1](https://en.wikipedia.org/wiki/D-1_(Sony))
   * - [ProRes (HQ, 422, LT, and Proxy)](https://en.wikipedia.org/wiki/Apple_ProRes)
   * - [XDCAM HD422](https://en.wikipedia.org/wiki/XDCAM)
   * - [Canon MXF HD422](https://en.wikipedia.org/wiki/Canon_XF-300)
   */
  Yuv422 = 1,
  /**
   * n 4:2:0, the horizontal sampling is doubled compared to 4:1:1,
   * but as the **Cb** and **Cr** channels are only sampled on each alternate line in this scheme, the vertical resolution is halved.
   * The data rate is thus the same.
   * This fits reasonably well with the PAL color encoding system, since this has only half the vertical chrominance resolution of [NTSC](https://en.wikipedia.org/wiki/NTSC).
   * It would also fit extremely well with the [SECAM](https://en.wikipedia.org/wiki/SECAM) color encoding system,
   * since like that format, 4:2:0 only stores and transmits one color channel per line (the other channel being recovered from the previous line).
   * However, little equipment has actually been produced that outputs a SECAM analogue video signal.
   * In general, SECAM territories either have to use a PAL-capable display or a [transcoder](https://en.wikipedia.org/wiki/Transcoding) to convert the PAL signal to SECAM for display.
   */
  Yuv420 = 2,
  /**
   * What if the chroma subsampling model is 4:0:0?
   * That says to use every pixel of luma data, but that each row has 0 chroma samples applied to it. The resulting image, then, is comprised solely of the luminance data—a greyscale image.
   */
  Yuv400 = 3,
}

export interface ContextAttributes {
  alpha?: boolean;
  colorSpace?: ColorSpace;
}

export interface NodeContext
  extends Omit<
    CanvasRenderingContext2D,
    | "drawImage"
    | "createPattern"
    | "getTransform"
    | "drawFocusIfNeeded"
    | "scrollPathIntoView"
    | "canvas"
  > {
  canvas: NodeCanvas;
  /**
   * @param startAngle The angle at which to begin the gradient, in radians. Angle measurements start vertically above the centre and move around clockwise.
   * @param x The x-axis coordinate of the centre of the gradient.
   * @param y The y-axis coordinate of the centre of the gradient.
   */
  createConicGradient(startAngle: number, x: number, y: number): CanvasGradient;
  drawImage(image: Image | NodeCanvas, dx: number, dy: number): void;
  drawImage(
    image: Image | NodeCanvas,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ): void;
  drawImage(
    image: Image | NodeCanvas,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ): void;
  createPattern(
    image: Image | ImageData,
    repeat: "repeat" | "repeat-x" | "repeat-y" | "no-repeat" | null
  ): CanvasPattern;
  getContextAttributes(): { alpha: boolean; desynchronized: boolean };
  getTransform(): DOMMatrix;
}
export class Image {
  constructor();
  // attrs only affects SVG
  constructor(
    width: number,
    height: number,
    attrs?: { colorSpace?: ColorSpace }
  );
  width: number;
  height: number;
  readonly naturalWidth: number;
  readonly naturalHeight: number;
  readonly complete: boolean;
  alt: string;
  src: Buffer;
  onload?(): void;
  onerror?(err: Error): void;
}
export type ColorSpace = "srgb" | "display-p3";
