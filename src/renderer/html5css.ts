import type { IRenderer } from "@/@types/";
import { CanvasRenderer } from "@/renderer/canvas";

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
  private nodeCursor = 0;

  constructor(root: HTMLElement, video?: HTMLVideoElement) {
    this.root = root;
    this.video = video;
    const size = this.getInitialSize(root);
    this.width = size.width;
    this.height = size.height;
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.display = "none";
    this.helper = new CanvasRenderer(undefined, undefined);
    this.helper.setSize(this.width, this.height);

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
      this.root.style.position = "relative";
    }

    this.layer = document.createElement("div");
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
    this.updateObjectFitContain();
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateObjectFitContain();
      });
      this.resizeObserver.observe(this.root);
    }
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.helper.destroy();
    this.nodes.length = 0;
    this.layer.remove();
    this.canvas.remove();
    this.root.classList.remove("niconicomments-html5css-renderer");
  }

  drawVideo(enableLegacyPip: boolean): void {
    if (!this.video) return;
    this.helper.drawVideo(enableLegacyPip);
    this.helperDirty = true;
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
    const node = this.getNode("div");
    node.style.background = "transparent";
    node.style.border = `${this.state.lineWidth * this.state.scaleX}px solid ${
      this.state.strokeStyle
    }`;
    node.style.boxSizing = "border-box";
    this.positionNode(node, x, y, width, height);
  }

  fillText(text: string, x: number, y: number): void {
    this.helper.save();
    this.helper.setFont(this.state.font);
    this.helper.setFillStyle(this.state.fillStyle);
    this.helper.setGlobalAlpha(this.state.alpha);
    this.helper.fillText(text, x, y);
    this.helper.restore();
    this.helperDirty = true;
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
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this.helper.quadraticCurveTo(cpx, cpy, x, y);
  }

  clearRect(x: number, y: number, width: number, height: number): void {
    this.nodeCursor = 0;
    this.helper.clearRect(x, y, width, height);
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
    this.canvas.width = width;
    this.canvas.height = height;
    this.layer.style.width = `${width}px`;
    this.layer.style.height = `${height}px`;
    this.updateObjectFitContain();
    this.helper.destroy();
    this.helper = new CanvasRenderer(undefined, undefined);
    this.helper.setSize(width, height);
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
  }

  save(): void {
    this.stateStack.push({ ...this.state });
    this.helper.save();
  }

  restore(): void {
    const state = this.stateStack.pop();
    if (state) {
      this.state = state;
    }
    this.helper.restore();
  }

  getCanvas(padding = 0): IRenderer {
    const inner = new CanvasRenderer(undefined, undefined, padding, () => {
      this.invalidateImage(inner);
    });
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
    node.src = this.getImageUrl(source);
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
    if (this.helperDirty) {
      this.invalidateImage(this.helper);
      this.drawImage(
        this.helper,
        0,
        0,
        this.canvas.width / this.state.scaleX,
        this.canvas.height / this.state.scaleY,
      );
      this.helperDirty = false;
    }
    for (let i = this.nodeCursor, n = this.nodes.length; i < n; i++) {
      const node = this.nodes[i];
      if (node) node.style.display = "none";
    }
  }

  invalidateImage(image: IRenderer): void {
    this.imageUrlCache.delete(image.canvas);
  }

  private getImageUrl(source: HTMLCanvasElement): string {
    const cached = this.imageUrlCache.get(source);
    if (cached) return cached;
    const url = source.toDataURL();
    this.imageUrlCache.set(source, url);
    return url;
  }

  private getNode(tagName: "div" | "img"): HTMLElement {
    let node = this.nodes[this.nodeCursor];
    if (!node || node.tagName.toLowerCase() !== tagName) {
      node?.remove();
      node = document.createElement(tagName);
      node.style.position = "absolute";
      node.style.margin = "0";
      node.style.padding = "0";
      node.style.pointerEvents = "none";
      node.style.transformOrigin = "0 0";
      node.style.maxWidth = "none";
      node.style.maxHeight = "none";
      this.nodes[this.nodeCursor] = node;
      this.layer.appendChild(node);
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
  ) {
    const scaleX = this.state.scaleX;
    const scaleY = this.state.scaleY;
    node.style.left = `${x * scaleX}px`;
    node.style.top = `${y * scaleY}px`;
    node.style.width = `${width * scaleX}px`;
    node.style.height = `${height * scaleY}px`;
  }

  private updateObjectFitContain(): void {
    const rect = this.root.getBoundingClientRect();
    const containerWidth = rect.width || this.width;
    const containerHeight = rect.height || this.height;
    const scale = Math.min(
      containerWidth / this.width,
      containerHeight / this.height,
    );
    const offsetX = (containerWidth - this.width * scale) / 2;
    const offsetY = (containerHeight - this.height * scale) / 2;
    this.layer.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  }

  private getInitialSize(root: HTMLElement) {
    const width =
      this.getNumber(root.dataset.width) ??
      this.getNumber(root.getAttribute("width")) ??
      (root instanceof HTMLCanvasElement ? root.width : undefined) ??
      this.getNumber(root.style.width) ??
      0;
    const height =
      this.getNumber(root.dataset.height) ??
      this.getNumber(root.getAttribute("height")) ??
      (root instanceof HTMLCanvasElement ? root.height : undefined) ??
      this.getNumber(root.style.height) ??
      0;
    return { width, height };
  }

  private getNumber(value: string | null | undefined): number | undefined {
    if (!value) return undefined;
    const number = Number.parseFloat(value);
    return Number.isFinite(number) && number > 0 ? number : undefined;
  }
}

export { HTML5CSSRenderer };
