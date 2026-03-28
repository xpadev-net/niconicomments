import type { IRenderer } from "@/@types/";
import { CanvasRenderer } from "@/renderer/canvas";

/* ─── Shader Sources ─── */

const SPRITE_VERT = `#version 300 es
layout(location = 0) in vec2 aPosition;
uniform mat4 uProjection;
uniform vec4 uRect;
out vec2 vTexCoord;
void main() {
  vTexCoord = aPosition;
  vec2 pos = uRect.xy + aPosition * uRect.zw;
  gl_Position = uProjection * vec4(pos, 0.0, 1.0);
}`;

const SPRITE_FRAG = `#version 300 es
precision mediump float;
in vec2 vTexCoord;
uniform sampler2D uTexture;
uniform float uAlpha;
out vec4 fragColor;
void main() {
  vec4 c = texture(uTexture, vTexCoord);
  fragColor = vec4(c.rgb * uAlpha, c.a * uAlpha);
}`;

const RECT_VERT = `#version 300 es
layout(location = 0) in vec2 aPosition;
uniform mat4 uProjection;
uniform vec4 uRect;
void main() {
  vec2 pos = uRect.xy + aPosition * uRect.zw;
  gl_Position = uProjection * vec4(pos, 0.0, 1.0);
}`;

const RECT_FRAG = `#version 300 es
precision mediump float;
uniform vec4 uColor;
out vec4 fragColor;
void main() {
  fragColor = uColor;
}`;

/* ─── Constants ─── */

const GC_INTERVAL_FRAMES = 60;
const GC_MAX_IDLE_FRAMES = 300;
const COLOR_CACHE_MAX_SIZE = 256;

/* ─── Internal Types ─── */

interface SpriteCmd {
  kind: 0;
  source: TexSource;
  x: number;
  y: number;
  w: number;
  h: number;
  alpha: number;
}

interface RectCmd {
  kind: 1;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

type DrawCmd = SpriteCmd | RectCmd;
type TexSource = HTMLCanvasElement | HTMLVideoElement;

interface TileInfo {
  tex: WebGLTexture;
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
}

interface TexEntry {
  tiles: TileInfo[];
  sourceW: number;
  sourceH: number;
  lastFrame: number;
}

interface RenderState {
  alpha: number;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  font: string;
  scaleX: number;
  scaleY: number;
}

/* ─── WebGL2Renderer ─── */

class WebGL2Renderer implements IRenderer {
  public readonly rendererName = "WebGL2Renderer";
  public readonly canvas: HTMLCanvasElement;
  public readonly video?: HTMLVideoElement;

  private readonly gl: WebGL2RenderingContext;

  // Programs & uniform locations
  private spriteProg: WebGLProgram;
  private spriteLocRect: WebGLUniformLocation;
  private spriteLocProj: WebGLUniformLocation;
  private spriteLocAlpha: WebGLUniformLocation;

  private rectProg: WebGLProgram;
  private rectLocRect: WebGLUniformLocation;
  private rectLocProj: WebGLUniformLocation;
  private rectLocColor: WebGLUniformLocation;

  // Geometry
  private quadVAO: WebGLVertexArrayObject;
  private quadBuf: WebGLBuffer;

  // Texture size limit
  private readonly maxTextureSize: number;
  private tileCanvas: HTMLCanvasElement | null = null;
  private tileCtx: CanvasRenderingContext2D | null = null;

  // Projection matrix (column-major Float32Array)
  private readonly proj = new Float32Array(16);
  private scaleX = 1;
  private scaleY = 1;

  // State stack
  private state: RenderState = {
    alpha: 1,
    fillStyle: "#000000",
    strokeStyle: "#000000",
    lineWidth: 1,
    font: "10px sans-serif",
    scaleX: 1,
    scaleY: 1,
  };
  private readonly stateStack: RenderState[] = [];

  // Command buffer
  private readonly cmds: DrawCmd[] = [];

  // Texture cache with frame-based GC
  private readonly texMap = new Map<TexSource, TexEntry>();
  private frameCount = 0;

  // Canvas 2D helper for text & path operations
  private helper: CanvasRenderer;
  private helperDirty = false;

  // Color parsing
  private readonly colorCtx: CanvasRenderingContext2D;
  private readonly colorCache = new Map<
    string,
    [number, number, number, number]
  >();

  // Logical dimensions
  private width: number;
  private height: number;

  // Event listener references for cleanup
  private readonly _onContextLost: (e: Event) => void;
  private readonly _onContextRestored: () => void;

  constructor(canvas: HTMLCanvasElement, video?: HTMLVideoElement) {
    this.canvas = canvas;
    this.video = video;
    this.width = canvas.width;
    this.height = canvas.height;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 not available");
    this.gl = gl;

    // Premultiplied alpha pipeline:
    // - UNPACK_PREMULTIPLY_ALPHA_WEBGL ensures texImage2D always delivers
    //   premultiplied data (the browser un-premultiplies Canvas 2D's internal
    //   store then re-premultiplies on upload, per WebGL spec §5.14.8).
    // - Blend ONE × src + (1−srcA) × dst is the standard premultiplied blend.
    // - The sprite shader scales both RGB and A by uAlpha.
    // This relies on spec-compliant Canvas→WebGL premultiplication round-trip;
    // minor precision loss (≤1/255) may occur for partially-transparent pixels.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.viewport(0, 0, canvas.width, canvas.height);
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;

    // Initialize all resources; release GL context on any failure
    try {
      const glRes = this._initGLResources();
      this.spriteProg = glRes.spriteProg;
      this.spriteLocRect = glRes.spriteLocRect;
      this.spriteLocProj = glRes.spriteLocProj;
      this.spriteLocAlpha = glRes.spriteLocAlpha;
      this.rectProg = glRes.rectProg;
      this.rectLocRect = glRes.rectLocRect;
      this.rectLocProj = glRes.rectLocProj;
      this.rectLocColor = glRes.rectLocColor;
      this.quadVAO = glRes.quadVAO;
      this.quadBuf = glRes.quadBuf;

      this.helper = this._createHelper(canvas.width, canvas.height);

      const colorEl = document.createElement("canvas");
      colorEl.width = 1;
      colorEl.height = 1;
      const colorCtx = colorEl.getContext("2d");
      if (!colorCtx) throw new Error("Failed to create 2D context");
      this.colorCtx = colorCtx;
    } catch (e) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      throw e;
    }

    this._updateProjection();

    // Context loss handling (store references for removal in destroy)
    this._onContextLost = (e: Event) => e.preventDefault();
    this._onContextRestored = () => {
      try {
        this._rebuildGLResources();
      } catch (e) {
        console.error(
          "WebGL2Renderer: context restore failed, renderer is now inactive:",
          e,
        );
        this.destroy();
      }
    };
    canvas.addEventListener("webglcontextlost", this._onContextLost);
    canvas.addEventListener("webglcontextrestored", this._onContextRestored);
  }

  /* ═══ Private: WebGL helpers ═══ */

  private _getUniformLocation(
    prog: WebGLProgram,
    name: string,
  ): WebGLUniformLocation {
    const loc = this.gl.getUniformLocation(prog, name);
    if (!loc) throw new Error(`Uniform ${name} not found`);
    return loc;
  }

  private _createHelper(w: number, h: number): CanvasRenderer {
    const el = document.createElement("canvas");
    el.width = w;
    el.height = h;
    return new CanvasRenderer(el);
  }

  private _createShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const s = gl.createShader(type);
    if (!s) throw new Error("Failed to create shader");
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error(`Shader compile: ${log}`);
    }
    return s;
  }

  private _createProgram(vs: string, fs: string): WebGLProgram {
    const gl = this.gl;
    const p = gl.createProgram();
    if (!p) throw new Error("Failed to create program");
    try {
      const vShader = this._createShader(gl.VERTEX_SHADER, vs);
      const fShader = this._createShader(gl.FRAGMENT_SHADER, fs);
      gl.attachShader(p, vShader);
      gl.attachShader(p, fShader);
      gl.linkProgram(p);
      gl.deleteShader(vShader);
      gl.deleteShader(fShader);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(p);
        throw new Error(`Program link: ${log}`);
      }
      return p;
    } catch (e) {
      gl.deleteProgram(p);
      throw e;
    }
  }

  private _initGLResources() {
    const gl = this.gl;

    const spriteProg = this._createProgram(SPRITE_VERT, SPRITE_FRAG);
    const spriteLocRect = this._getUniformLocation(spriteProg, "uRect");
    const spriteLocProj = this._getUniformLocation(spriteProg, "uProjection");
    const spriteLocAlpha = this._getUniformLocation(spriteProg, "uAlpha");
    const spriteLocTex = this._getUniformLocation(spriteProg, "uTexture");
    gl.useProgram(spriteProg);
    gl.uniform1i(spriteLocTex, 0);

    const rectProg = this._createProgram(RECT_VERT, RECT_FRAG);
    const rectLocRect = this._getUniformLocation(rectProg, "uRect");
    const rectLocProj = this._getUniformLocation(rectProg, "uProjection");
    const rectLocColor = this._getUniformLocation(rectProg, "uColor");

    const quadVAO = gl.createVertexArray();
    if (!quadVAO) throw new Error("Failed to create vertex array");
    const quadBuf = gl.createBuffer();
    if (!quadBuf) throw new Error("Failed to create buffer");
    gl.bindVertexArray(quadVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    gl.useProgram(null);

    return {
      spriteProg,
      spriteLocRect,
      spriteLocProj,
      spriteLocAlpha,
      rectProg,
      rectLocRect,
      rectLocProj,
      rectLocColor,
      quadVAO,
      quadBuf,
    };
  }

  private _updateProjection(): void {
    // Orthographic: left=0 right=logicalW top=0 bottom=logicalH
    const w = this.canvas.width / this.scaleX;
    const h = this.canvas.height / this.scaleY;
    const p = this.proj;
    p.fill(0);
    p[0] = 2 / w;
    p[5] = -2 / h;
    p[10] = -1;
    p[12] = -1;
    p[13] = 1;
    p[15] = 1;
  }

  private _parseColor(css: string): [number, number, number, number] {
    const cached = this.colorCache.get(css);
    if (cached) return cached;
    this.colorCtx.clearRect(0, 0, 1, 1);
    this.colorCtx.fillStyle = css;
    this.colorCtx.fillRect(0, 0, 1, 1);
    // getImageData returns non-premultiplied RGBA per spec
    const d = this.colorCtx.getImageData(0, 0, 1, 1).data;
    const result: [number, number, number, number] = [
      (d[0] ?? 0) / 255,
      (d[1] ?? 0) / 255,
      (d[2] ?? 0) / 255,
      (d[3] ?? 0) / 255,
    ];
    if (this.colorCache.size >= COLOR_CACHE_MAX_SIZE) {
      const firstKey = this.colorCache.keys().next().value;
      if (firstKey !== undefined) this.colorCache.delete(firstKey);
    }
    this.colorCache.set(css, result);
    return result;
  }

  private _createTexture(uploadSource: TexSource): WebGLTexture {
    const gl = this.gl;
    const tex = gl.createTexture();
    if (!tex) throw new Error("Failed to create texture");
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      uploadSource,
    );
    return tex;
  }

  private _extractTile(
    source: TexSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
  ): HTMLCanvasElement {
    if (!this.tileCanvas) {
      this.tileCanvas = document.createElement("canvas");
      this.tileCtx = this.tileCanvas.getContext("2d");
    }
    if (!this.tileCtx) throw new Error("Failed to create 2D context for tile");
    this.tileCanvas.width = sw;
    this.tileCanvas.height = sh;
    this.tileCtx.drawImage(
      source as CanvasImageSource,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      sw,
      sh,
    );
    return this.tileCanvas;
  }

  private _buildTiles(source: TexSource): TileInfo[] {
    const gl = this.gl;
    const max = this.maxTextureSize;
    const w =
      source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const h =
      source instanceof HTMLVideoElement ? source.videoHeight : source.height;

    if (w <= 0 || h <= 0) return [];

    // Fast path: fits in a single texture
    if (w <= max && h <= max) {
      const tex = this._createTexture(source);
      gl.bindTexture(gl.TEXTURE_2D, null);
      return [{ tex, srcX: 0, srcY: 0, srcW: w, srcH: h }];
    }

    // Tile grid
    const tilesX = Math.ceil(w / max);
    const tilesY = Math.ceil(h / max);
    const tiles: TileInfo[] = [];
    try {
      for (let ty = 0; ty < tilesY; ty++) {
        for (let tx = 0; tx < tilesX; tx++) {
          const srcX = tx * max;
          const srcY = ty * max;
          const srcW = Math.min(max, w - srcX);
          const srcH = Math.min(max, h - srcY);
          const tileCanvas = this._extractTile(source, srcX, srcY, srcW, srcH);
          const tex = this._createTexture(tileCanvas);
          tiles.push({ tex, srcX, srcY, srcW, srcH });
        }
      }
    } catch (e) {
      for (const tile of tiles) {
        gl.deleteTexture(tile.tex);
      }
      throw e;
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    return tiles;
  }

  private _uploadTexture(source: TexSource, forceUpload: boolean): TexEntry {
    const gl = this.gl;
    let entry = this.texMap.get(source);
    if (!entry) {
      const w =
        source instanceof HTMLVideoElement ? source.videoWidth : source.width;
      const h =
        source instanceof HTMLVideoElement ? source.videoHeight : source.height;
      entry = {
        tiles: this._buildTiles(source),
        sourceW: w,
        sourceH: h,
        lastFrame: this.frameCount,
      };
      this.texMap.set(source, entry);
      return entry;
    }
    // Re-upload only for dynamic sources (video, plugin) - once per frame.
    // Build new tiles before deleting old ones so the entry stays valid on error.
    if (forceUpload && entry.lastFrame < this.frameCount) {
      const oldTiles = entry.tiles;
      entry.tiles = this._buildTiles(source);
      for (const tile of oldTiles) {
        gl.deleteTexture(tile.tex);
      }
      const w =
        source instanceof HTMLVideoElement ? source.videoWidth : source.width;
      const h =
        source instanceof HTMLVideoElement ? source.videoHeight : source.height;
      entry.sourceW = w;
      entry.sourceH = h;
    }
    entry.lastFrame = this.frameCount;
    return entry;
  }

  private _deleteTiles(entry: TexEntry): void {
    for (const tile of entry.tiles) {
      this.gl.deleteTexture(tile.tex);
    }
  }

  private _gcTextures(): void {
    const threshold = this.frameCount - GC_MAX_IDLE_FRAMES;
    for (const [source, entry] of this.texMap) {
      if (entry.lastFrame < threshold) {
        this._deleteTiles(entry);
        this.texMap.delete(source);
      }
    }
  }

  private _rebuildGLResources(): void {
    const gl = this.gl;
    // After context loss all GPU objects (textures, programs, VAOs, buffers)
    // are already invalidated by the browser — no GL delete calls needed.
    this.texMap.clear();
    this.cmds.length = 0;
    this.helperDirty = false;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    const res = this._initGLResources();
    this.spriteProg = res.spriteProg;
    this.spriteLocRect = res.spriteLocRect;
    this.spriteLocProj = res.spriteLocProj;
    this.spriteLocAlpha = res.spriteLocAlpha;
    this.rectProg = res.rectProg;
    this.rectLocRect = res.rectLocRect;
    this.rectLocProj = res.rectLocProj;
    this.rectLocColor = res.rectLocColor;
    this.quadVAO = res.quadVAO;
    this.quadBuf = res.quadBuf;
  }

  /* ═══ IRenderer: State ═══ */

  save(): void {
    this.stateStack.push({ ...this.state });
    this.helper.save();
  }

  restore(): void {
    const s = this.stateStack.pop();
    if (s) {
      const scaleChanged =
        s.scaleX !== this.state.scaleX || s.scaleY !== this.state.scaleY;
      this.state = s;
      this.scaleX = s.scaleX;
      this.scaleY = s.scaleY;
      if (scaleChanged) this._updateProjection();
    }
    this.helper.restore();
  }

  setScale(scale: number, arg1?: number): void {
    this.scaleX *= scale;
    this.scaleY *= arg1 ?? scale;
    this.state.scaleX = this.scaleX;
    this.state.scaleY = this.scaleY;
    this._updateProjection();
    this.helper.setScale(scale, arg1);
  }

  /* ═══ IRenderer: Style ═══ */

  getFont(): string {
    return this.state.font;
  }

  setFont(font: string): void {
    this.state.font = font;
  }

  getFillStyle(): string {
    return this.state.fillStyle;
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

  /* ═══ IRenderer: Canvas management ═══ */

  setSize(width: number, height: number): void {
    // Evict old helper texture and discard pending text
    const oldEntry = this.texMap.get(this.helper.canvas);
    if (oldEntry) {
      this._deleteTiles(oldEntry);
      this.texMap.delete(this.helper.canvas);
    }
    this.helper.destroy();
    this.helperDirty = false;
    this.cmds.length = 0;
    this.stateStack.length = 0;

    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
    // Reset scale to match Canvas2D behavior (canvas.width= resets transform)
    this.scaleX = 1;
    this.scaleY = 1;
    this.state.scaleX = 1;
    this.state.scaleY = 1;
    this._updateProjection();
    this.helper = this._createHelper(width, height);
  }

  getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  getCanvas(padding = 0): IRenderer {
    return new CanvasRenderer(undefined, undefined, padding);
  }

  /* ═══ IRenderer: Drawing ═══ */

  // NOTE: gl.clear always clears the full framebuffer regardless of x/y/w/h.
  // This matches the current call site (always full-canvas), but deviates from
  // the Canvas 2D sub-region semantics. Use gl.scissor if sub-region support
  // is needed in the future.
  clearRect(x: number, y: number, w: number, h: number): void {
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.cmds.length = 0;
    this.helper.clearRect(x, y, w, h);
    this.helperDirty = false;
  }

  drawImage(
    image: IRenderer,
    x: number,
    y: number,
    width?: number,
    height?: number,
  ): void {
    // getCanvas() always returns CanvasRenderer, so this check is safe.
    // If a non-CanvasRenderer IRenderer is needed as a source in the future,
    // extract its HTMLCanvasElement via a shared interface property instead.
    if (!(image instanceof CanvasRenderer)) {
      throw new TypeError("drawImage: image must be a CanvasRenderer");
    }
    const source = image.canvas;
    this.cmds.push({
      kind: 0,
      source,
      x,
      y,
      w: width ?? source.width,
      h: height ?? source.height,
      alpha: this.state.alpha,
    });
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    let nx = x,
      ny = y,
      nw = w,
      nh = h;
    if (nw < 0) {
      nx += nw;
      nw = -nw;
    }
    if (nh < 0) {
      ny += nh;
      nh = -nh;
    }
    const [r, g, b, a] = this._parseColor(this.state.fillStyle);
    const ea = a * this.state.alpha;
    this.cmds.push({
      kind: 1,
      x: nx,
      y: ny,
      w: nw,
      h: nh,
      r: r * ea,
      g: g * ea,
      b: b * ea,
      a: ea,
    });
  }

  strokeRect(x: number, y: number, w: number, h: number): void {
    let nx = x,
      ny = y,
      nw = w,
      nh = h;
    if (nw < 0) {
      nx += nw;
      nw = -nw;
    }
    if (nh < 0) {
      ny += nh;
      nh = -nh;
    }
    const [r, g, b, a] = this._parseColor(this.state.strokeStyle);
    const ea = a * this.state.alpha;
    const lw = this.state.lineWidth;
    const half = lw / 2;
    const pr = r * ea,
      pg = g * ea,
      pb = b * ea;
    // When the rect is too small for non-overlapping edges, emit a single
    // filled rect covering the entire stroke outline to avoid double-
    // compositing artifacts with semi-transparent strokes.
    if (nh <= lw || nw <= lw) {
      this.cmds.push({
        kind: 1,
        x: nx - half,
        y: ny - half,
        w: nw + lw,
        h: nh + lw,
        r: pr,
        g: pg,
        b: pb,
        a: ea,
      });
      return;
    }
    // Top edge (full width including corners)
    this.cmds.push({
      kind: 1,
      x: nx - half,
      y: ny - half,
      w: nw + lw,
      h: lw,
      r: pr,
      g: pg,
      b: pb,
      a: ea,
    });
    // Bottom edge
    this.cmds.push({
      kind: 1,
      x: nx - half,
      y: ny + nh - half,
      w: nw + lw,
      h: lw,
      r: pr,
      g: pg,
      b: pb,
      a: ea,
    });
    // Left & right edges (between top/bottom to avoid overlap)
    this.cmds.push({
      kind: 1,
      x: nx - half,
      y: ny + half,
      w: lw,
      h: nh - lw,
      r: pr,
      g: pg,
      b: pb,
      a: ea,
    });
    this.cmds.push({
      kind: 1,
      x: nx + nw - half,
      y: ny + half,
      w: lw,
      h: nh - lw,
      r: pr,
      g: pg,
      b: pb,
      a: ea,
    });
  }

  // NOTE: Positions are computed from raw canvas pixel dimensions, matching
  // CanvasRenderer behaviour. Under a non-unit setScale the values are in the
  // scaled coordinate space and the projection maps them identically to how
  // Canvas 2D's transform would.
  drawVideo(enableLegacyPip: boolean): void {
    if (
      !this.video ||
      this.video.videoWidth === 0 ||
      this.video.videoHeight === 0
    )
      return;
    let scale: number;
    const hRatio = this.canvas.height / this.video.videoHeight;
    const wRatio = this.canvas.width / this.video.videoWidth;
    if (enableLegacyPip ? hRatio > wRatio : hRatio < wRatio) {
      scale = wRatio;
    } else {
      scale = hRatio;
    }
    const offsetX = (this.canvas.width - this.video.videoWidth * scale) * 0.5;
    const offsetY = (this.canvas.height - this.video.videoHeight * scale) * 0.5;
    this.cmds.push({
      kind: 0,
      source: this.video,
      x: offsetX,
      y: offsetY,
      w: this.video.videoWidth * scale,
      h: this.video.videoHeight * scale,
      alpha: 1,
    });
  }

  /* ═══ IRenderer: Text (delegated to Canvas 2D helper) ═══ */

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

  measureText(text: string): TextMetrics {
    this.helper.save();
    this.helper.setFont(this.state.font);
    const result = this.helper.measureText(text);
    this.helper.restore();
    return result;
  }

  /* ═══ IRenderer: Path (delegated to Canvas 2D helper) ═══ */

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

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this.helper.quadraticCurveTo(cpx, cpy, x, y);
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

  /* ═══ Flush: execute all buffered draw commands ═══ */

  // ORDERING CONTRACT: All GPU commands (sprites + rects) are drawn first,
  // then the Canvas 2D helper overlay (text/path ops) is composited on top.
  // This is correct as long as fillText/strokeText on the main renderer are
  // only called AFTER all drawImage calls within a frame — which is the case
  // in the current drawCanvas flow (debug text is drawn last).
  flush(): void {
    const gl = this.gl;
    gl.bindVertexArray(this.quadVAO);

    try {
      let currentProg: WebGLProgram | null = null;

      for (const cmd of this.cmds) {
        if (cmd.kind === 0) {
          // Sprite command — draw one quad per tile
          if (currentProg !== this.spriteProg) {
            gl.useProgram(this.spriteProg);
            gl.uniformMatrix4fv(this.spriteLocProj, false, this.proj);
            currentProg = this.spriteProg;
          }
          gl.activeTexture(gl.TEXTURE0);
          const entry = this._uploadTexture(
            cmd.source,
            cmd.source instanceof HTMLVideoElement,
          );
          const sx = cmd.w / entry.sourceW;
          const sy = cmd.h / entry.sourceH;
          for (const tile of entry.tiles) {
            gl.bindTexture(gl.TEXTURE_2D, tile.tex);
            gl.uniform4f(
              this.spriteLocRect,
              cmd.x + tile.srcX * sx,
              cmd.y + tile.srcY * sy,
              tile.srcW * sx,
              tile.srcH * sy,
            );
            gl.uniform1f(this.spriteLocAlpha, cmd.alpha);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          }
        } else {
          // Rect command
          if (currentProg !== this.rectProg) {
            gl.useProgram(this.rectProg);
            gl.uniformMatrix4fv(this.rectLocProj, false, this.proj);
            currentProg = this.rectProg;
          }
          gl.uniform4f(this.rectLocRect, cmd.x, cmd.y, cmd.w, cmd.h);
          gl.uniform4f(this.rectLocColor, cmd.r, cmd.g, cmd.b, cmd.a);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }

      // Composite Canvas 2D helper overlay (text/path operations)
      if (this.helperDirty) {
        if (currentProg !== this.spriteProg) {
          gl.useProgram(this.spriteProg);
          gl.uniformMatrix4fv(this.spriteLocProj, false, this.proj);
        }
        gl.activeTexture(gl.TEXTURE0);
        // Invalidate cached helper texture so _uploadTexture always
        // re-uploads the latest helper canvas content
        this.invalidateImage(this.helper);
        const helperEntry = this._uploadTexture(this.helper.canvas, false);
        const logicalW = this.canvas.width / this.scaleX;
        const logicalH = this.canvas.height / this.scaleY;
        for (const tile of helperEntry.tiles) {
          gl.bindTexture(gl.TEXTURE_2D, tile.tex);
          gl.uniform4f(
            this.spriteLocRect,
            (tile.srcX / helperEntry.sourceW) * logicalW,
            (tile.srcY / helperEntry.sourceH) * logicalH,
            (tile.srcW / helperEntry.sourceW) * logicalW,
            (tile.srcH / helperEntry.sourceH) * logicalH,
          );
          gl.uniform1f(this.spriteLocAlpha, 1);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }
    } finally {
      gl.bindVertexArray(null);
      this.cmds.length = 0;
      this.helperDirty = false;
      this.frameCount++;
    }

    // Periodic texture GC
    if (this.frameCount % GC_INTERVAL_FRAMES === 0) {
      this._gcTextures();
    }
  }

  /* ═══ Texture invalidation ═══ */

  invalidateImage(image: IRenderer): void {
    if (!(image instanceof CanvasRenderer)) return;
    const entry = this.texMap.get(image.canvas);
    if (entry) {
      this._deleteTiles(entry);
      this.texMap.delete(image.canvas);
    }
  }

  /* ═══ Lifecycle ═══ */

  destroy(): void {
    const gl = this.gl;
    for (const entry of this.texMap.values()) {
      this._deleteTiles(entry);
    }
    this.texMap.clear();
    this.colorCache.clear();
    gl.deleteVertexArray(this.quadVAO);
    gl.deleteBuffer(this.quadBuf);
    gl.deleteProgram(this.spriteProg);
    gl.deleteProgram(this.rectProg);
    this.helper.destroy();
    this.tileCanvas = null;
    this.tileCtx = null;
    this.canvas.removeEventListener("webglcontextlost", this._onContextLost);
    this.canvas.removeEventListener(
      "webglcontextrestored",
      this._onContextRestored,
    );
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

export { WebGL2Renderer };
