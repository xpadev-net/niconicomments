import type { IRenderer } from "@/@types/";
import { CanvasRenderer } from "@/renderer/canvas";

const TRANSPARENT_IMAGE_URL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

type CssRenderState = {
  alpha: number;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  font: string;
  scaleX: number;
  scaleY: number;
};

class HTML5CSSRenderer implements IRenderer {
  public readonly rendererName = "HTML5CSSRenderer";
  public readonly canvas: HTMLCanvasElement;
  public readonly root: HTMLElement;
  public readonly layer: HTMLDivElement;
  public readonly video?: HTMLVideoElement;

  private helper: CanvasRenderer;
  private helperDirty = false;
  private helperCursor = 0;
  private pathActive = false;
  private textDrawnBeforeDom = false;
  private readonly helperSurfaces: CanvasRenderer[] = [];
  private readonly subRenderers = new Set<IRenderer>();
  private readonly videoSurface?: CanvasRenderer;
  private width = 0;
  private height = 0;
  private state: CssRenderState = {
    alpha: 1,
    fillStyle: "#000000",
    strokeStyle: "#000000",
    lineWidth: 1,
    font: "10px sans-serif",
    scaleX: 1,
    scaleY: 1,
  };
  private readonly stateStack: CssRenderState[] = [];
  private readonly imageUrlCache = new WeakMap<HTMLCanvasElement, string>();
  private readonly nodes: HTMLElement[] = [];
  private readonly resizeObserver?: ResizeObserver;
  private readonly originalRootStyle: {
    boxSizing: string;
    height: string;
    overflow: string;
    pointerEvents: string;
    position: string;
    width: string;
  };
  private nodeCursor = 0;

  constructor(root: HTMLElement, video?: HTMLVideoElement) {
    this.root = root;
    this.video = video;
    const size = this.getInitialSize(root);
    this.width = size.width;
    this.height = size.height;
    this.canvas = this.root.ownerDocument.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.display = "none";
    this.helper = this.prepareHelperSurface(0);
    if (this.video) {
      this.videoSurface = new CanvasRenderer(undefined, this.video);
      this.videoSurface.setSize(this.width, this.height);
    }
    this.originalRootStyle = {
      boxSizing: this.root.style.boxSizing,
      height: this.root.style.height,
      overflow: this.root.style.overflow,
      pointerEvents: this.root.style.pointerEvents,
      position: this.root.style.position,
      width: this.root.style.width,
    };

    const computedStyle = this.root.ownerDocument.defaultView?.getComputedStyle(
      this.root,
    );
    this.root.classList.add("niconicomments-html5css-renderer");
    if (!this.root.style.width && !this.getNumber(computedStyle?.width)) {
      this.root.style.width = `${this.width}px`;
    }
    if (!this.root.style.height && !this.getNumber(computedStyle?.height)) {
      this.root.style.height = `${this.height}px`;
    }
    this.root.style.boxSizing = "border-box";
    this.root.style.overflow = "hidden";
    this.root.style.pointerEvents = "none";
    if (
      this.root.style.position === "" ||
      this.root.style.position === "static"
    ) {
      const computedPosition = computedStyle?.position;
      if (!computedPosition || computedPosition === "static") {
        this.root.style.position = "relative";
      }
    }

    this.layer = this.root.ownerDocument.createElement("div");
    this.layer.style.position = "absolute";
    this.layer.style.left = "0";
    this.layer.style.top = "0";
    this.layer.style.overflow = "hidden";
    this.layer.style.pointerEvents = "none";
    this.layer.style.width = `${this.width}px`;
    this.layer.style.height = `${this.height}px`;
    this.layer.style.transformOrigin = "0 0";

    this.root.appendChild(this.canvas);
    this.root.appendChild(this.layer);
    this.setupVideoCanvas();
    this.updateObjectFitContain();
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) {
          this.updateObjectFitContain();
          return;
        }
        const box = Array.isArray(entry.contentBoxSize)
          ? entry.contentBoxSize[0]
          : entry.contentBoxSize;
        this.updateObjectFitContainWithSize(
          box?.inlineSize ?? entry.contentRect.width,
          box?.blockSize ?? entry.contentRect.height,
        );
      });
      this.resizeObserver.observe(this.root);
    }
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    for (const helper of this.helperSurfaces) {
      this.teardownSurfaceCanvas(helper);
      helper.destroy();
    }
    if (this.videoSurface) {
      this.teardownSurfaceCanvas(this.videoSurface);
      this.videoSurface.destroy();
    }
    for (const subRenderer of Array.from(this.subRenderers)) {
      subRenderer.destroy();
    }
    this.subRenderers.clear();
    this.nodes.length = 0;
    this.layer.remove();
    this.canvas.remove();
    this.root.classList.remove("niconicomments-html5css-renderer");
    this.root.style.boxSizing = this.originalRootStyle.boxSizing;
    this.root.style.height = this.originalRootStyle.height;
    this.root.style.overflow = this.originalRootStyle.overflow;
    this.root.style.pointerEvents = this.originalRootStyle.pointerEvents;
    this.root.style.position = this.originalRootStyle.position;
    this.root.style.width = this.originalRootStyle.width;
  }

  drawVideo(enableLegacyPip: boolean): void {
    if (!this.videoSurface) return;
    this.videoSurface.clearRect(0, 0, this.width, this.height);
    this.videoSurface.drawVideo(enableLegacyPip);
    this.videoSurface.canvas.style.display = "block";
  }

  getFont(): string {
    return this.state.font;
  }

  getFillStyle(): string {
    return this.state.fillStyle;
  }

  setScale(scale: number, arg1?: number): void {
    this.state.scaleX *= scale;
    this.state.scaleY *= arg1 ?? scale;
    this.helper.setScale(scale, arg1);
  }

  fillRect(x: number, y: number, width: number, height: number): void {
    let nx = x;
    let ny = y;
    let nw = width;
    let nh = height;
    if (nw < 0) {
      nx += nw;
      nw = -nw;
    }
    if (nh < 0) {
      ny += nh;
      nh = -nh;
    }
    const node = this.getNode("div");
    node.style.background = this.state.fillStyle;
    node.style.border = "0";
    this.positionNode(node, nx, ny, nw, nh);
  }

  strokeRect(x: number, y: number, width: number, height: number): void {
    let nx = x;
    let ny = y;
    let nw = width;
    let nh = height;
    if (nw < 0) {
      nx += nw;
      nw = -nw;
    }
    if (nh < 0) {
      ny += nh;
      nh = -nh;
    }
    const node = this.getNode("div");
    node.style.background = "transparent";
    const borderWidthX = this.state.lineWidth * this.state.scaleX;
    const borderWidthY = this.state.lineWidth * this.state.scaleY;
    const borderX = `${borderWidthX}px`;
    const borderY = `${borderWidthY}px`;
    node.style.border = "0";
    node.style.borderLeft = `${borderX} solid ${this.state.strokeStyle}`;
    node.style.borderRight = `${borderX} solid ${this.state.strokeStyle}`;
    node.style.borderTop = `${borderY} solid ${this.state.strokeStyle}`;
    node.style.borderBottom = `${borderY} solid ${this.state.strokeStyle}`;
    node.style.boxSizing = "border-box";
    this.positionNode(
      node,
      nx,
      ny,
      nw,
      nh,
      -borderWidthX / 2,
      -borderWidthY / 2,
      borderWidthX,
      borderWidthY,
    );
  }

  fillText(text: string, x: number, y: number): void {
    this.helper.save();
    this.helper.setFont(this.state.font);
    this.helper.setFillStyle(this.state.fillStyle);
    this.helper.setGlobalAlpha(this.state.alpha);
    this.helper.fillText(text, x, y);
    this.helper.restore();
    this.helperDirty = true;
    this.textDrawnBeforeDom = true;
  }

  strokeText(text: string, x: number, y: number): void {
    this.helper.save();
    this.helper.setFont(this.state.font);
    this.helper.setStrokeStyle(this.state.strokeStyle);
    this.helper.setLineWidth(this.state.lineWidth);
    this.helper.setGlobalAlpha(this.state.alpha);
    this.helper.strokeText(text, x, y);
    this.helper.restore();
    this.helperDirty = true;
    this.textDrawnBeforeDom = true;
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this.helper.quadraticCurveTo(cpx, cpy, x, y);
  }

  clearRect(_x: number, _y: number, _width: number, _height: number): void {
    this.nodeCursor = 0;
    this.helperCursor = 0;
    this.pathActive = false;
    this.textDrawnBeforeDom = false;
    this.resetState();
    for (const node of this.nodes) {
      node.style.display = "none";
    }
    for (let i = 1, n = this.helperSurfaces.length; i < n; i++) {
      const helper = this.helperSurfaces[i];
      if (!helper) continue;
      helper.setSize(this.width, this.height);
      this.setupSurfaceCanvas(helper);
      helper.canvas.style.display = "none";
    }
    this.helper = this.prepareHelperSurface(0);
    this.helper.canvas.style.display = "none";
    if (this.videoSurface) {
      this.videoSurface.clearRect(0, 0, this.width, this.height);
      this.videoSurface.canvas.style.display = "none";
      this.layer.insertBefore(this.videoSurface.canvas, this.layer.firstChild);
    }
    this.helperDirty = false;
  }

  setFont(font: string): void {
    this.state.font = font;
  }

  setFillStyle(color: string): void {
    this.state.fillStyle = color;
  }

  setStrokeStyle(color: string): void {
    this.state.strokeStyle = color;
  }

  setLineWidth(width: number): void {
    this.state.lineWidth = width;
  }

  setGlobalAlpha(alpha: number): void {
    this.state.alpha = alpha;
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.nodeCursor = 0;
    this.pathActive = false;
    this.textDrawnBeforeDom = false;
    for (const node of this.nodes) {
      node.style.display = "none";
    }
    this.canvas.width = width;
    this.canvas.height = height;
    this.layer.style.width = `${width}px`;
    this.layer.style.height = `${height}px`;
    this.updateObjectFitContain();
    for (const helper of this.helperSurfaces) {
      this.teardownSurfaceCanvas(helper);
      helper.destroy();
    }
    this.helperSurfaces.length = 0;
    this.helperCursor = 0;
    if (this.videoSurface) {
      this.teardownSurfaceCanvas(this.videoSurface);
      this.videoSurface.setSize(width, height);
      this.setupVideoCanvas();
    }
    this.resetState();
    this.helper = this.prepareHelperSurface(0);
    this.helperDirty = false;
  }

  getSize(): { width: number; height: number } {
    return {
      width: this.width,
      height: this.height,
    };
  }

  measureText(text: string): TextMetrics {
    this.helper.save();
    this.helper.setFont(this.state.font);
    const result = this.helper.measureText(text);
    this.helper.restore();
    return result;
  }

  beginPath(): void {
    this.pathActive = true;
    this.helper.beginPath();
  }

  closePath(): void {
    this.helper.closePath();
  }

  moveTo(x: number, y: number): void {
    this.helper.moveTo(x, y);
  }

  lineTo(x: number, y: number): void {
    this.helper.lineTo(x, y);
  }

  stroke(): void {
    this.helper.save();
    this.helper.setStrokeStyle(this.state.strokeStyle);
    this.helper.setLineWidth(this.state.lineWidth);
    this.helper.setGlobalAlpha(this.state.alpha);
    this.helper.stroke();
    this.helper.restore();
    this.helperDirty = true;
    this.pathActive = false;
  }

  save(): void {
    this.stateStack.push({ ...this.state });
  }

  restore(): void {
    const state = this.stateStack.pop();
    if (state) {
      this.applyHelperScale(state.scaleX, state.scaleY);
      this.state = state;
    }
  }

  getCanvas(padding = 0): IRenderer {
    const inner = new CanvasRenderer(undefined, undefined, padding, () => {
      this.invalidateImage(inner);
      this.subRenderers.delete(inner);
    });
    this.subRenderers.add(inner);
    return inner;
  }

  drawImage(
    image: IRenderer,
    x: number,
    y: number,
    width?: number,
    height?: number,
  ): void {
    const source = image.canvas;
    const node = this.getNode("img") as HTMLImageElement;
    const url = this.getImageUrl(source);
    if (node.src !== url) {
      node.src = url;
    }
    node.style.border = "0";
    node.style.background = "transparent";
    this.positionNode(
      node,
      x,
      y,
      width ?? source.width,
      height ?? source.height,
    );
  }

  flush(): void {
    this.commitHelperSurface();
    for (let i = this.nodeCursor, n = this.nodes.length; i < n; i++) {
      const node = this.nodes[i];
      if (node) node.style.display = "none";
    }
    if (this.stateStack.length > 0) {
      console.warn(
        "HTML5CSSRenderer: save()/restore() calls are imbalanced at flush().",
      );
    }
  }

  invalidateImage(image: IRenderer): void {
    this.imageUrlCache.delete(image.canvas);
  }

  private getImageUrl(source: HTMLCanvasElement): string {
    const cached = this.imageUrlCache.get(source);
    if (cached) return cached;
    let url: string;
    try {
      url = source.toDataURL();
    } catch (error) {
      console.warn(
        "HTML5CSSRenderer: failed to serialize a canvas image.",
        error,
      );
      url = TRANSPARENT_IMAGE_URL;
    }
    this.imageUrlCache.set(source, url);
    return url;
  }

  private getNode(tagName: "div" | "img"): HTMLElement {
    if (this.pathActive) {
      console.warn(
        "HTML5CSSRenderer: DOM drawing interrupted an active path before stroke().",
      );
    }
    if (this.textDrawnBeforeDom) {
      console.warn(
        "HTML5CSSRenderer: text drawn before a DOM-backed draw may render below it.",
      );
      this.textDrawnBeforeDom = false;
    }
    this.commitHelperSurface();
    let node = this.nodes[this.nodeCursor];
    if (!node || node.tagName.toLowerCase() !== tagName) {
      node?.remove();
      node = this.root.ownerDocument.createElement(tagName);
      node.style.position = "absolute";
      node.style.margin = "0";
      node.style.padding = "0";
      node.style.pointerEvents = "none";
      node.style.transformOrigin = "0 0";
      node.style.maxWidth = "none";
      node.style.maxHeight = "none";
      if (tagName === "img") node.style.objectFit = "fill";
      this.nodes[this.nodeCursor] = node;
    }
    this.layer.appendChild(node);
    node.style.display = "block";
    node.style.opacity = String(this.state.alpha);
    this.nodeCursor++;
    return node;
  }

  private positionNode(
    node: HTMLElement,
    x: number,
    y: number,
    width: number,
    height: number,
    offsetX = 0,
    offsetY = 0,
    extraWidth = 0,
    extraHeight = 0,
  ) {
    const scaleX = this.state.scaleX;
    const scaleY = this.state.scaleY;
    node.style.left = `${x * scaleX + offsetX}px`;
    node.style.top = `${y * scaleY + offsetY}px`;
    node.style.width = `${width * scaleX + extraWidth}px`;
    node.style.height = `${height * scaleY + extraHeight}px`;
  }

  private updateObjectFitContain(): void {
    if (
      this.width <= 0 ||
      this.height <= 0 ||
      !Number.isFinite(this.width) ||
      !Number.isFinite(this.height)
    ) {
      this.layer.style.transform = "translate(0px, 0px) scale(1)";
      return;
    }
    const rect = this.root.getBoundingClientRect();
    this.updateObjectFitContainWithSize(rect.width, rect.height);
  }

  private updateObjectFitContainWithSize(
    containerWidth: number,
    containerHeight: number,
  ): void {
    if (
      this.width <= 0 ||
      this.height <= 0 ||
      !Number.isFinite(this.width) ||
      !Number.isFinite(this.height)
    ) {
      this.layer.style.transform = "translate(0px, 0px) scale(1)";
      return;
    }
    const fitWidth = containerWidth || this.width;
    const fitHeight = containerHeight || this.height;
    const scale = Math.min(fitWidth / this.width, fitHeight / this.height);
    const offsetX = (fitWidth - this.width * scale) / 2;
    const offsetY = (fitHeight - this.height * scale) / 2;
    this.layer.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  }

  private getHelperSurface(index: number): CanvasRenderer {
    const helper =
      this.helperSurfaces[index] ?? new CanvasRenderer(undefined, undefined);
    if (!this.helperSurfaces[index]) {
      this.helperSurfaces[index] = helper;
    }
    return helper;
  }

  private prepareHelperSurface(index: number): CanvasRenderer {
    const helper = this.getHelperSurface(index);
    helper.setSize(this.width, this.height);
    this.setupSurfaceCanvas(helper);
    if (this.state.scaleX !== 1 || this.state.scaleY !== 1) {
      helper.setScale(this.state.scaleX, this.state.scaleY);
    }
    return helper;
  }

  private commitHelperSurface(): void {
    if (!this.helperDirty) return;
    // Frame callers should follow clearRect() -> draw operations -> flush().
    // Drawing again after flush() intentionally keeps the committed surface
    // visible until the next clearRect() starts a fresh frame.
    this.helper.canvas.style.display = "block";
    this.layer.appendChild(this.helper.canvas);
    this.helperDirty = false;
    this.helperCursor++;
    this.helper = this.prepareHelperSurface(this.helperCursor);
  }

  private setupVideoCanvas(): void {
    if (!this.videoSurface) return;
    this.setupSurfaceCanvas(this.videoSurface);
    this.videoSurface.canvas.style.display = "none";
    this.layer.insertBefore(this.videoSurface.canvas, this.layer.firstChild);
  }

  private setupSurfaceCanvas(surface: IRenderer): void {
    const { style } = surface.canvas;
    style.position = "absolute";
    style.left = "0";
    style.top = "0";
    style.width = `${this.width}px`;
    style.height = `${this.height}px`;
    style.pointerEvents = "none";
    style.margin = "0";
    style.padding = "0";
    style.maxWidth = "none";
    style.maxHeight = "none";
  }

  private applyHelperScale(scaleX: number, scaleY: number): void {
    const currentScaleX = this.state.scaleX;
    const currentScaleY = this.state.scaleY;
    if (
      currentScaleX === 0 ||
      currentScaleY === 0 ||
      scaleX === 0 ||
      scaleY === 0 ||
      !Number.isFinite(currentScaleX) ||
      !Number.isFinite(currentScaleY) ||
      !Number.isFinite(scaleX) ||
      !Number.isFinite(scaleY)
    ) {
      this.recreateCurrentHelperSurface(scaleX, scaleY);
      return;
    }
    const ratioX = scaleX / this.state.scaleX;
    const ratioY = scaleY / this.state.scaleY;
    if (ratioX === 1 && ratioY === 1) return;
    if (Number.isFinite(ratioX) && Number.isFinite(ratioY)) {
      this.helper.setScale(ratioX, ratioY);
    }
  }

  private recreateCurrentHelperSurface(scaleX: number, scaleY: number): void {
    this.teardownSurfaceCanvas(this.helper);
    this.helper.destroy();
    const helper = new CanvasRenderer(undefined, undefined);
    this.helperSurfaces[this.helperCursor] = helper;
    this.helper = helper;
    helper.setSize(this.width, this.height);
    this.setupSurfaceCanvas(helper);
    helper.canvas.style.display = "none";
    if (
      scaleX !== 0 &&
      scaleY !== 0 &&
      Number.isFinite(scaleX) &&
      Number.isFinite(scaleY)
    ) {
      helper.setScale(scaleX, scaleY);
    }
  }

  private teardownSurfaceCanvas(surface: IRenderer): void {
    surface.canvas.remove();
    surface.canvas.removeAttribute("style");
  }

  private resetState(): void {
    this.stateStack.length = 0;
    this.state = {
      alpha: 1,
      fillStyle: "#000000",
      strokeStyle: "#000000",
      lineWidth: 1,
      font: "10px sans-serif",
      scaleX: 1,
      scaleY: 1,
    };
  }

  private getInitialSize(root: HTMLElement) {
    const computedStyle =
      root.ownerDocument.defaultView?.getComputedStyle(root);
    const rect = root.getBoundingClientRect();
    const width =
      this.getNumber(root.dataset.width) ??
      this.getNumber(root.getAttribute("width")) ??
      (root instanceof HTMLCanvasElement ? root.width : undefined) ??
      this.getNumber(root.style.width) ??
      this.getNumber(computedStyle?.width) ??
      this.getPositiveNumber(rect.width) ??
      0;
    const height =
      this.getNumber(root.dataset.height) ??
      this.getNumber(root.getAttribute("height")) ??
      (root instanceof HTMLCanvasElement ? root.height : undefined) ??
      this.getNumber(root.style.height) ??
      this.getNumber(computedStyle?.height) ??
      this.getPositiveNumber(rect.height) ??
      0;
    return { width, height };
  }

  private getPositiveNumber(value: number): number | undefined {
    return Number.isFinite(value) && value > 0 ? value : undefined;
  }

  private getNumber(value: string | null | undefined): number | undefined {
    if (!value) return undefined;
    const match = value.match(/^\s*(\d+(?:\.\d+)?)(?:px)?\s*$/);
    if (!match) return undefined;
    const number = Number.parseFloat(match[1] ?? "");
    return Number.isFinite(number) && number > 0 ? number : undefined;
  }
}

export { HTML5CSSRenderer };
