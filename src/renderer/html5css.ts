import type { IRenderer } from "@/@types/";
import { CanvasRenderer, clampCanvasSize } from "@/renderer/canvas";

// Must be >= 1; trimHelperSurfaces keeps surfaces[0..helperCursor] after each frame.
const MAX_HELPER_SURFACES = 8;

type CssRenderState = {
  alpha: number;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  font: string;
  scaleX: number;
  scaleY: number;
};

type SavedCssRenderState = CssRenderState & {
  helper: CanvasRenderer;
};

const DEFAULT_CSS_RENDER_STATE: CssRenderState = {
  alpha: 1,
  fillStyle: "#000000",
  strokeStyle: "#000000",
  lineWidth: 1,
  font: "10px sans-serif",
  scaleX: 1,
  scaleY: 1,
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
  private readonly videoSurface?: CanvasRenderer;
  private width = 0;
  private height = 0;
  private state: CssRenderState = { ...DEFAULT_CSS_RENDER_STATE };
  private readonly stateStack: SavedCssRenderState[] = [];
  private readonly nodes: HTMLElement[] = [];
  private prevNodeCursor = 0;
  private activeCanvasSet = new Set<HTMLCanvasElement>();
  private prevCanvasSet = new Set<HTMLCanvasElement>();
  private readonly setupCanvases = new WeakSet<HTMLCanvasElement>();
  // Maps source canvas → set of clone canvases created for it this frame.
  // Clones are created when the same IRenderer is drawn more than once per frame.
  private readonly cloneMap = new Map<
    HTMLCanvasElement,
    Set<HTMLCanvasElement>
  >();
  // Reverse of cloneMap: clone → its source, for O(1) cleanup in flush().
  // WeakMap so the clone canvas can be GC'd if we miss a removal.
  private readonly cloneSourceMap = new WeakMap<
    HTMLCanvasElement,
    HTMLCanvasElement
  >();
  // Canvases created by this renderer's getCanvas() — safe to reparent in drawImage.
  // External canvases are never reparented; pixels are copied instead.
  private readonly ownedCanvases = new WeakSet<HTMLCanvasElement>();
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
    const size = this.normalizeSize(this.getInitialSize(root));
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
    if (
      !this.root.style.width &&
      this.getNumber(computedStyle?.width) === undefined
    ) {
      this.root.style.width = `${this.width}px`;
    }
    if (
      !this.root.style.height &&
      this.getNumber(computedStyle?.height) === undefined
    ) {
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
    // If the caller still holds live sub-renderers obtained via getCanvas(),
    // layer.remove() below detaches their canvases from the DOM implicitly.
    // prevCanvasSet/activeCanvasSet are cleared, so any subsequent
    // invalidateImage() on those sub-renderers is harmless (no-op on empty sets
    // and an already-detached element).
    this.resizeObserver?.disconnect();
    for (const helper of this.helperSurfaces) {
      this.teardownSurfaceCanvas(helper);
      helper.destroy();
    }
    if (this.videoSurface) {
      this.teardownSurfaceCanvas(this.videoSurface);
      this.videoSurface.destroy();
    }
    this.nodes.length = 0;
    this.prevCanvasSet.clear();
    this.activeCanvasSet.clear();
    this.cloneMap.clear();
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
    if (this.shouldDrawOnOverflowHelper()) {
      this.helper.save();
      this.helper.setFillStyle(this.state.fillStyle);
      this.helper.setGlobalAlpha(this.state.alpha);
      this.helper.fillRect(nx, ny, nw, nh);
      this.helper.restore();
      this.helperDirty = true;
      return;
    }
    const node = this.getNode("div");
    node.style.background = this.state.fillStyle;
    node.style.border = "0";
    node.style.boxSizing = "content-box";
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
    if (this.shouldDrawOnOverflowHelper()) {
      this.helper.save();
      this.helper.setStrokeStyle(this.state.strokeStyle);
      this.helper.setLineWidth(this.state.lineWidth);
      this.helper.setGlobalAlpha(this.state.alpha);
      this.helper.strokeRect(nx, ny, nw, nh);
      this.helper.restore();
      this.helperDirty = true;
      return;
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

  // NOTE: DOM-backed frames are rebuilt as a full logical stage. This matches
  // current callers, which always clear the whole renderer before drawing.
  clearRect(_x: number, _y: number, _width: number, _height: number): void {
    this.nodeCursor = 0;
    this.helperCursor = 0;
    this.pathActive = false;
    this.textDrawnBeforeDom = false;
    // restoreFrameStartState() already clears the stateStack and restores all
    // state to its frame-start values, so no further state reset is needed here.
    // Callers expect clearRect() to clear pixels only, not drawing state.
    this.restoreFrameStartState();
    for (let i = 0; i < this.prevNodeCursor; i++) {
      const node = this.nodes[i];
      if (node) this.hideNode(node);
    }
    // Source canvases are NOT hidden here — they remain visible until flush()
    // removes stale ones, keeping them flicker-free across frames.
    this.trimHelperSurfaces();
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
    const size = this.normalizeSize({ width, height });
    this.width = size.width;
    this.height = size.height;
    this.nodeCursor = 0;
    this.prevNodeCursor = 0;
    this.pathActive = false;
    this.textDrawnBeforeDom = false;
    for (const node of this.nodes) this.hideNode(node);
    for (const canvas of this.prevCanvasSet) {
      canvas.style.display = "none";
      canvas.remove();
    }
    for (const canvas of this.activeCanvasSet) {
      canvas.style.display = "none";
      canvas.remove();
    }
    this.prevCanvasSet.clear();
    this.activeCanvasSet.clear();
    this.cloneMap.clear();
    this.canvas.width = size.width;
    this.canvas.height = size.height;
    this.layer.style.width = `${size.width}px`;
    this.layer.style.height = `${size.height}px`;
    this.updateObjectFitContain();
    this.restoreFrameStartState();
    for (const helper of this.helperSurfaces) {
      this.teardownSurfaceCanvas(helper);
      helper.destroy();
    }
    this.helperSurfaces.length = 0;
    this.helperCursor = 0;
    if (this.videoSurface) {
      this.teardownSurfaceCanvas(this.videoSurface);
      this.videoSurface.setSize(size.width, size.height);
      this.setupVideoCanvas();
    }
    this.resetState();
    this.helper = this.prepareHelperSurface(0);
    this.helper.canvas.style.display = "none";
    this.helperDirty = false;
  }

  getSize(): { width: number; height: number } {
    return {
      width: this.width,
      height: this.height,
    };
  }

  measureText(text: string): TextMetrics {
    const font = this.helper.getFont();
    this.helper.setFont(this.state.font);
    try {
      return this.helper.measureText(text);
    } finally {
      this.helper.setFont(font);
    }
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
    if (!this.pathActive) return;
    this.helper.save();
    this.helper.setStrokeStyle(this.state.strokeStyle);
    this.helper.setLineWidth(this.state.lineWidth);
    this.helper.setGlobalAlpha(this.state.alpha);
    this.helper.stroke();
    this.helper.restore();
    this.helperDirty = true;
    this.pathActive = false;
    this.textDrawnBeforeDom = false;
  }

  save(): void {
    this.helper.save();
    this.stateStack.push({ ...this.state, helper: this.helper });
  }

  restore(): void {
    const saved = this.stateStack.pop();
    if (!saved) return;
    saved.helper.restore();
    if (saved.helper !== this.helper) {
      this.applyHelperScale(saved.scaleX, saved.scaleY);
    }
    this.state = this.toRenderState(saved);
  }

  getCanvas(padding = 0): IRenderer {
    // Sub-renderers are caller-owned, matching CanvasRenderer.getCanvas().
    // The change hook only keeps drawImage() snapshots fresh while they live.
    // WeakRef avoids retaining the parent where available. Older browsers fall
    // back to a strong reference so sub-renderer cache invalidation still works;
    // callers that keep sub-renderers alive should destroy them explicitly.
    let inner: CanvasRenderer | undefined;
    const invalidate =
      typeof WeakRef === "undefined"
        ? () => {
            if (inner) this.invalidateImage(inner);
          }
        : (() => {
            const parentRef = new WeakRef(this);
            return () => {
              if (inner) parentRef.deref()?.invalidateImage(inner);
            };
          })();
    inner = new CanvasRenderer(
      undefined,
      undefined,
      padding,
      invalidate,
      undefined, // onChange: canvas is live in the layer — no snapshot caching needed
    );
    this.ownedCanvases.add(inner.canvas);
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
    if (this.shouldDrawOnOverflowHelper()) {
      this.helper.save();
      this.helper.setGlobalAlpha(this.state.alpha);
      if (width === undefined || height === undefined) {
        this.helper.drawImage(image, x, y);
      } else {
        this.helper.drawImage(image, x, y, width, height);
      }
      this.helper.restore();
      this.helperDirty = true;
      return;
    }
    const deferHelperCommit = this.pathActive;
    if (deferHelperCommit) {
      console.warn(
        "HTML5CSSRenderer: DOM drawing interleaved with an active path before stroke().",
      );
    }
    if (this.textDrawnBeforeDom) {
      console.warn(
        "HTML5CSSRenderer: text drawn before a DOM-backed draw may render below it.",
      );
      this.textDrawnBeforeDom = false;
    }
    if (!deferHelperCommit) {
      this.commitHelperSurface();
    }
    // Place the source canvas directly in the layer — no toDataURL needed.
    // CSS width/height scales the canvas content just as it would an <img>.
    // Only canvases created by this renderer's getCanvas() are safe to
    // reparent into the layer. External canvases (e.g. plugin-owned) are never
    // reparented — pixels are copied so the caller's DOM is left intact.
    // For owned canvases drawn twice in one frame, also copy to allow both
    // occurrences to be independently positioned.
    let element: HTMLCanvasElement;
    if (!this.ownedCanvases.has(source)) {
      element = this.root.ownerDocument.createElement("canvas");
      element.width = source.width;
      element.height = source.height;
      const ctx = element.getContext("2d");
      if (!ctx) {
        console.warn(
          "HTML5CSSRenderer: failed to acquire 2D context for canvas copy.",
        );
        return;
      }
      ctx.drawImage(source, 0, 0);
    } else if (this.activeCanvasSet.has(source)) {
      element = this.root.ownerDocument.createElement("canvas");
      element.width = source.width;
      element.height = source.height;
      const ctx = element.getContext("2d");
      if (!ctx) {
        console.warn(
          "HTML5CSSRenderer: failed to acquire 2D context for canvas clone.",
        );
        return;
      }
      ctx.drawImage(source, 0, 0);
      let clones = this.cloneMap.get(source);
      if (!clones) {
        clones = new Set();
        this.cloneMap.set(source, clones);
      }
      clones.add(element);
      this.cloneSourceMap.set(element, source);
    } else {
      element = source;
    }
    if (!this.setupCanvases.has(element)) {
      element.style.position = "absolute";
      element.style.margin = "0";
      element.style.padding = "0";
      element.style.pointerEvents = "none";
      element.style.transformOrigin = "0 0";
      element.style.maxWidth = "none";
      element.style.maxHeight = "none";
      this.setupCanvases.add(element);
    }
    this.layer.appendChild(element);
    element.style.display = "block";
    element.style.opacity = String(this.state.alpha);
    this.positionNode(
      element,
      x,
      y,
      width ?? source.width,
      height ?? source.height,
    );
    this.activeCanvasSet.add(element);
  }

  flush(): void {
    this.commitHelperSurface();
    this.keepVideoSurfaceFirst();
    for (let i = this.nodeCursor, n = this.nodes.length; i < n; i++) {
      const node = this.nodes[i];
      if (node) this.hideNode(node);
    }
    this.prevNodeCursor = this.nodeCursor;
    // Remove source canvases that were visible last frame but not drawn this frame.
    for (const canvas of this.prevCanvasSet) {
      if (!this.activeCanvasSet.has(canvas)) {
        canvas.style.display = "none";
        canvas.remove();
        const src = this.cloneSourceMap.get(canvas);
        if (src) {
          this.cloneMap.get(src)?.delete(canvas);
        } else {
          this.cloneMap.delete(canvas);
        }
      }
    }
    const tmp = this.prevCanvasSet;
    this.prevCanvasSet = this.activeCanvasSet;
    this.activeCanvasSet = tmp;
    this.activeCanvasSet.clear();
    this.textDrawnBeforeDom = false;
    if (this.stateStack.length > 0) {
      console.warn(
        "HTML5CSSRenderer: save()/restore() calls are imbalanced at flush().",
      );
    }
  }

  invalidateImage(image: IRenderer): void {
    // Eagerly drop and detach the canvas so flush() never touches it again
    // and a pooled re-acquisition by another renderer finds no ghost in the DOM.
    const source = image.canvas;
    const clones = this.cloneMap.get(source);
    if (clones) {
      for (const clone of clones) {
        this.prevCanvasSet.delete(clone);
        this.activeCanvasSet.delete(clone);
        clone.style.display = "none";
        clone.remove();
      }
      this.cloneMap.delete(source);
    }
    this.prevCanvasSet.delete(source);
    this.activeCanvasSet.delete(source);
    source.style.display = "none";
    source.remove();
  }

  private getNode(tagName: "div"): HTMLElement {
    const deferHelperCommit = this.pathActive;
    if (deferHelperCommit) {
      console.warn(
        "HTML5CSSRenderer: DOM drawing interleaved with an active path before stroke().",
      );
    }
    if (this.textDrawnBeforeDom) {
      console.warn(
        "HTML5CSSRenderer: text drawn before a DOM-backed draw may render below it.",
      );
      this.textDrawnBeforeDom = false;
    }
    if (!deferHelperCommit) {
      this.commitHelperSurface();
    }
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
    const fitWidth = containerWidth > 0 ? containerWidth : this.width;
    const fitHeight = containerHeight > 0 ? containerHeight : this.height;
    const scale = Math.min(fitWidth / this.width, fitHeight / this.height);
    const offsetX = (fitWidth - this.width * scale) / 2;
    const offsetY = (fitHeight - this.height * scale) / 2;
    this.layer.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  }

  private getHelperSurface(index: number): CanvasRenderer {
    this.helperSurfaces[index] ??= new CanvasRenderer(undefined, undefined);
    return this.helperSurfaces[index];
  }

  private prepareHelperSurface(index: number): CanvasRenderer {
    const helper = this.getHelperSurface(index);
    helper.setSize(this.width, this.height);
    this.resetHelperContextDefaults(helper);
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
    const isOverflowHelper = this.helperCursor + 1 >= MAX_HELPER_SURFACES;
    // For the overflow helper we skip appendChild once it is already in the
    // layer (isConnected=true). The first draw that reaches overflow mode
    // finds isConnected=false and appends it; helperCursor is NOT incremented
    // so shouldDrawOnOverflowHelper detects it via isConnected on the next
    // call. All subsequent overflow draws re-enter here with isConnected=true
    // and skip the append, keeping the canvas at a stable z-order position.
    if (!isOverflowHelper || !this.helper.canvas.isConnected) {
      this.layer.appendChild(this.helper.canvas);
    }
    this.helperDirty = false;
    if (isOverflowHelper) {
      return;
    }
    this.helperCursor++;
    this.helper = this.prepareHelperSurface(this.helperCursor);
  }

  private keepVideoSurfaceFirst(): void {
    if (!this.videoSurface) return;
    this.layer.insertBefore(this.videoSurface.canvas, this.layer.firstChild);
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
    this.resetHelperContextDefaults(helper);
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

  private resetHelperContextDefaults(surface: IRenderer): void {
    const context = surface.canvas.getContext("2d");
    if (!context) return;
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
    context.lineJoin = "round";
  }

  private shouldDrawOnOverflowHelper(): boolean {
    return (
      this.helperCursor + 1 >= MAX_HELPER_SURFACES &&
      this.helper.canvas.isConnected
    );
  }

  private trimHelperSurfaces(): void {
    // clearRect() resets helperCursor before trimming, so the new frame only
    // needs surfaces through the current helper index.
    while (this.helperSurfaces.length > this.helperCursor + 1) {
      const helper = this.helperSurfaces.pop();
      if (!helper) continue;
      this.teardownSurfaceCanvas(helper);
      helper.destroy();
    }
  }

  private resetState(): void {
    const { scaleX, scaleY, lineWidth } = this.state;
    this.stateStack.length = 0;
    this.state = { ...DEFAULT_CSS_RENDER_STATE, scaleX, scaleY, lineWidth };
  }

  private restoreFrameStartState(): void {
    const frameStartState = this.stateStack[0];
    if (!frameStartState) return;
    for (let i = this.stateStack.length - 1; i >= 0; i--) {
      this.stateStack[i]?.helper.restore();
    }
    this.state = this.toRenderState(frameStartState);
    this.stateStack.length = 0;
  }

  private toRenderState(saved: SavedCssRenderState): CssRenderState {
    return {
      alpha: saved.alpha,
      fillStyle: saved.fillStyle,
      strokeStyle: saved.strokeStyle,
      lineWidth: saved.lineWidth,
      font: saved.font,
      scaleX: saved.scaleX,
      scaleY: saved.scaleY,
    };
  }

  private normalizeSize(size: { width: number; height: number }) {
    return clampCanvasSize(size.width, size.height);
  }

  private hideNode(node: HTMLElement) {
    node.style.display = "none";
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
