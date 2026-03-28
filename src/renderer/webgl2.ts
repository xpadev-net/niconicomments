import type { IRenderer } from "@/@types/";
import { CanvasRenderer } from "./canvas";

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
  c.a *= uAlpha;
  fragColor = c;
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
}

/* ─── Color Cache ─── */

const colorCache = new Map<string, [number, number, number, number]>();

/* ─── WebGL2Renderer ─── */

class WebGL2Renderer implements IRenderer {
  public readonly canvas: HTMLCanvasElement;
  public readonly video?: HTMLVideoElement;

  private readonly gl: WebGL2RenderingContext;

  // Programs & uniform locations
  private spriteProg: WebGLProgram;
  private spriteLocRect: WebGLUniformLocation;
  private spriteLocProj: WebGLUniformLocation;
  private spriteLocAlpha: WebGLUniformLocation;
  private spriteLocTex: WebGLUniformLocation;

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

  // Color parsing context
  private readonly colorCtx: CanvasRenderingContext2D;

  // Logical dimensions
  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement, video?: HTMLVideoElement) {
    this.canvas = canvas;
    this.video = video;
    this.width = canvas.width;
    this.height = canvas.height;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 not available");
    this.gl = gl;

    // Non-premultiplied alpha blending
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
    gl.viewport(0, 0, canvas.width, canvas.height);
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;

    // Compile programs
    this.spriteProg = this._createProgram(SPRITE_VERT, SPRITE_FRAG);
    this.spriteLocRect = this._getUniformLocation(this.spriteProg, "uRect");
    this.spriteLocProj = this._getUniformLocation(
      this.spriteProg,
      "uProjection",
    );
    this.spriteLocAlpha = this._getUniformLocation(this.spriteProg, "uAlpha");
    this.spriteLocTex = this._getUniformLocation(this.spriteProg, "uTexture");
    // Initialize sampler to texture unit 0
    gl.useProgram(this.spriteProg);
    gl.uniform1i(this.spriteLocTex, 0);

    this.rectProg = this._createProgram(RECT_VERT, RECT_FRAG);
    this.rectLocRect = this._getUniformLocation(this.rectProg, "uRect");
    this.rectLocProj = this._getUniformLocation(this.rectProg, "uProjection");
    this.rectLocColor = this._getUniformLocation(this.rectProg, "uColor");

    // Unit quad (0,0)→(1,1) as TRIANGLE_STRIP
    const quadVAO = gl.createVertexArray();
    if (!quadVAO) throw new Error("Failed to create vertex array");
    this.quadVAO = quadVAO;
    const quadBuf = gl.createBuffer();
    if (!quadBuf) throw new Error("Failed to create buffer");
    this.quadBuf = quadBuf;
    gl.bindVertexArray(this.quadVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    // Helper for text/path ops (same size, scale applied later via setScale)
    this.helper = this._createHelper(canvas.width, canvas.height);

    // 1x1 canvas for CSS color parsing
    const colorEl = document.createElement("canvas");
    colorEl.width = 1;
    colorEl.height = 1;
    const colorCtx = colorEl.getContext("2d");
    if (!colorCtx) throw new Error("Failed to create 2D context");
    this.colorCtx = colorCtx;

    this._updateProjection();

    // Context loss handling
    canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());
    canvas.addEventListener("webglcontextrestored", () =>
      this._rebuildGLResources(),
    );
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
    const vShader = this._createShader(gl.VERTEX_SHADER, vs);
    const fShader = this._createShader(gl.FRAGMENT_SHADER, fs);
    gl.attachShader(p, vShader);
    gl.attachShader(p, fShader);
    gl.linkProgram(p);
    gl.deleteShader(vShader);
    gl.deleteShader(fShader);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(p);
      gl.deleteProgram(p);
      throw new Error(`Program link: ${log}`);
    }
    return p;
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
    const cached = colorCache.get(css);
    if (cached) return cached;
    this.colorCtx.clearRect(0, 0, 1, 1);
    this.colorCtx.fillStyle = css;
    this.colorCtx.fillRect(0, 0, 1, 1);
    const d = this.colorCtx.getImageData(0, 0, 1, 1).data;
    const result: [number, number, number, number] = [
      (d[0] ?? 0) / 255,
      (d[1] ?? 0) / 255,
      (d[2] ?? 0) / 255,
      (d[3] ?? 0) / 255,
    ];
    colorCache.set(css, result);
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

    // Fast path: fits in a single texture
    if (w <= max && h <= max) {
      return [
        {
          tex: this._createTexture(source),
          srcX: 0,
          srcY: 0,
          srcW: w,
          srcH: h,
        },
      ];
    }

    // Tile grid
    const tilesX = Math.ceil(w / max);
    const tilesY = Math.ceil(h / max);
    const tiles: TileInfo[] = [];
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
    // Re-upload only for dynamic sources (video, plugin) - once per frame
    if (forceUpload && entry.lastFrame < this.frameCount) {
      for (const tile of entry.tiles) {
        gl.deleteTexture(tile.tex);
      }
      entry.tiles = this._buildTiles(source);
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
    const threshold = this.frameCount - 300;
    for (const [source, entry] of this.texMap) {
      if (entry.lastFrame < threshold) {
        this._deleteTiles(entry);
        this.texMap.delete(source);
      }
    }
  }

  private _rebuildGLResources(): void {
    const gl = this.gl;
    this.texMap.clear();

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    this.spriteProg = this._createProgram(SPRITE_VERT, SPRITE_FRAG);
    this.spriteLocRect = this._getUniformLocation(this.spriteProg, "uRect");
    this.spriteLocProj = this._getUniformLocation(
      this.spriteProg,
      "uProjection",
    );
    this.spriteLocAlpha = this._getUniformLocation(this.spriteProg, "uAlpha");
    this.spriteLocTex = this._getUniformLocation(this.spriteProg, "uTexture");
    gl.useProgram(this.spriteProg);
    gl.uniform1i(this.spriteLocTex, 0);

    this.rectProg = this._createProgram(RECT_VERT, RECT_FRAG);
    this.rectLocRect = this._getUniformLocation(this.rectProg, "uRect");
    this.rectLocProj = this._getUniformLocation(this.rectProg, "uProjection");
    this.rectLocColor = this._getUniformLocation(this.rectProg, "uColor");

    const quadVAO = gl.createVertexArray();
    if (!quadVAO) throw new Error("Failed to create vertex array");
    this.quadVAO = quadVAO;
    const quadBuf = gl.createBuffer();
    if (!quadBuf) throw new Error("Failed to create buffer");
    this.quadBuf = quadBuf;
    gl.bindVertexArray(this.quadVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  /* ═══ IRenderer: State ═══ */

  save(): void {
    this.stateStack.push({ ...this.state });
  }

  restore(): void {
    const s = this.stateStack.pop();
    if (s) this.state = s;
  }

  setScale(scale: number, arg1?: number): void {
    this.scaleX *= scale;
    this.scaleY *= arg1 ?? scale;
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
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
    this._updateProjection();
    // Recreate helper (canvas.width= resets 2D context state)
    this.helper = this._createHelper(width, height);
    if (this.scaleX !== 1 || this.scaleY !== 1) {
      this.helper.setScale(this.scaleX, this.scaleY);
    }
  }

  getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  getCanvas(padding = 0): IRenderer {
    return new CanvasRenderer(undefined, undefined, padding);
  }

  /* ═══ IRenderer: Drawing ═══ */

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
    const source = (image as CanvasRenderer).canvas;
    if (!(source instanceof HTMLCanvasElement)) {
      throw new TypeError("drawImage: image must be a CanvasRenderer");
    }
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
      r,
      g,
      b,
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
    // Top edge (full width including corners)
    this.cmds.push({
      kind: 1,
      x: nx - half,
      y: ny - half,
      w: nw + lw,
      h: lw,
      r,
      g,
      b,
      a: ea,
    });
    // Bottom edge
    this.cmds.push({
      kind: 1,
      x: nx - half,
      y: ny + nh - half,
      w: nw + lw,
      h: lw,
      r,
      g,
      b,
      a: ea,
    });
    // Left & right edges (between top/bottom to avoid overlap)
    if (nh > lw) {
      this.cmds.push({
        kind: 1,
        x: nx - half,
        y: ny + half,
        w: lw,
        h: nh - lw,
        r,
        g,
        b,
        a: ea,
      });
      this.cmds.push({
        kind: 1,
        x: nx + nw - half,
        y: ny + half,
        w: lw,
        h: nh - lw,
        r,
        g,
        b,
        a: ea,
      });
    }
  }

  drawVideo(enableLegacyPip: boolean): void {
    if (!this.video) return;
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
    this.helper.setFont(this.state.font);
    return this.helper.measureText(text);
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

  flush(): void {
    const gl = this.gl;
    gl.bindVertexArray(this.quadVAO);

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
      const helperEntry = this._uploadTexture(this.helper.canvas, true);
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

    gl.bindVertexArray(null);
    this.cmds.length = 0;
    this.frameCount++;

    // Periodic texture GC
    if (this.frameCount % 60 === 0) {
      this._gcTextures();
    }
  }

  /* ═══ Texture invalidation ═══ */

  invalidateImage(image: IRenderer): void {
    const source = (image as CanvasRenderer).canvas;
    if (source instanceof HTMLCanvasElement) {
      const entry = this.texMap.get(source);
      if (entry) {
        this._deleteTiles(entry);
        this.texMap.delete(source);
      }
    }
  }

  /* ═══ Lifecycle ═══ */

  destroy(): void {
    const gl = this.gl;
    for (const entry of this.texMap.values()) {
      this._deleteTiles(entry);
    }
    this.texMap.clear();
    gl.deleteVertexArray(this.quadVAO);
    gl.deleteBuffer(this.quadBuf);
    gl.deleteProgram(this.spriteProg);
    gl.deleteProgram(this.rectProg);
    this.helper.destroy();
  }
}

export { WebGL2Renderer };
