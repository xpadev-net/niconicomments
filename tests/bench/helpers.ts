import type {
  Collision,
  FormattedComment,
  IComment,
  IRenderer,
  Timeline,
} from "@/@types";
import { HTML5Comment } from "@/comments/HTML5Comment";
import { resetNicoScripts } from "@/contexts/nicoscript";
import {
  defaultConfig,
  defaultOptions,
  setConfig,
  setOptions,
} from "@/definition/config";
import { initConfig } from "@/definition/initConfig";

const emptyTextMetrics = (width: number): TextMetrics =>
  ({
    width,
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: width,
    actualBoundingBoxAscent: 0,
    actualBoundingBoxDescent: 0,
    alphabeticBaseline: 0,
    hangingBaseline: 0,
    emHeightAscent: 0,
    emHeightDescent: 0,
    fontBoundingBoxAscent: 0,
    fontBoundingBoxDescent: 0,
    ideographicBaseline: 0,
  }) as TextMetrics;

class FakeRenderer implements IRenderer {
  public readonly rendererName = "FakeRenderer";
  public readonly canvas = document.createElement("canvas");
  private font = "";
  private size = { width: 1920, height: 1080 };

  destroy() {}
  drawVideo() {}
  getFont() {
    return this.font;
  }
  getFillStyle() {
    return "#000000";
  }
  setScale() {}
  fillRect() {}
  strokeRect() {}
  fillText() {}
  strokeText() {}
  quadraticCurveTo() {}
  clearRect() {}
  setFont(font: string) {
    this.font = font;
  }
  setFillStyle() {}
  setStrokeStyle() {}
  setLineWidth() {}
  setGlobalAlpha() {}
  setSize(width: number, height: number) {
    this.size = { width, height };
  }
  getSize() {
    return this.size;
  }
  measureText(_text: string) {
    // 実際のコメントは200〜500px幅になるため、現実的な幅で
    // 衝突検出のホットパスを十分に負荷テストする
    return emptyTextMetrics(300);
  }
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  stroke() {}
  save() {}
  restore() {}
  getCanvas() {
    return this;
  }
  drawImage() {}
  flush() {}
  invalidateImage() {}
}

/**
 * Deterministic pseudo-random number generator (mulberry32)
 */
const mulberry32 = (seed: number) => {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Reset all global state for clean benchmark runs
 */
const resetBenchState = () => {
  initConfig();
  setConfig(defaultConfig);
  setOptions(defaultOptions);
  resetNicoScripts();
};

/**
 * Generate deterministic FormattedComment array
 */
const generateComments = (count: number, seed = 42): FormattedComment[] => {
  const rng = mulberry32(seed);
  const comments: FormattedComment[] = [];
  for (let i = 0; i < count; i++) {
    comments.push({
      id: i,
      vpos: Math.floor(rng() * 30000),
      content: `test comment ${i}`,
      date: 1600000000 + Math.floor(rng() * 100000),
      date_usec: Math.floor(rng() * 1000000),
      owner: false,
      premium: false,
      mail: [],
      user_id: Math.floor(rng() * 100),
      layer: -1,
      is_my_post: false,
    });
  }
  return comments;
};

/**
 * Generate deterministic IComment instances using FakeRenderer
 */
const generateCommentInstances = (
  count: number,
  renderer: FakeRenderer,
  loc: "ue" | "naka" | "shita" = "naka",
  seed = 42,
): IComment[] => {
  const rng = mulberry32(seed);
  const instances: IComment[] = [];
  for (let i = 0; i < count; i++) {
    const base: FormattedComment = {
      id: i,
      vpos: Math.floor(rng() * 10000),
      content: `comment ${i} content text`,
      date: 1600000000 + i,
      date_usec: 0,
      owner: false,
      premium: false,
      mail: loc === "naka" ? [] : [loc],
      user_id: Math.floor(rng() * 50),
      layer: -1,
      is_my_post: false,
    };
    const instance = new HTML5Comment(base, renderer, i);
    instance.posY = -1;
    if (loc === "naka") {
      instance.comment.loc = "naka";
      instance.comment.long = 300;
    }
    instances.push(instance as unknown as IComment);
  }
  return instances;
};

const createTimeline = (): Timeline => ({});

const createCollision = (): Collision => ({
  ue: {},
  shita: {},
  left: {},
  right: {},
});

export {
  createCollision,
  createTimeline,
  FakeRenderer,
  generateCommentInstances,
  generateComments,
  resetBenchState,
};
