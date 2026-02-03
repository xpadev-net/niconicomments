import type { IRenderer } from "@/@types";
import {
  config,
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
  measureText(text: string) {
    return emptyTextMetrics(text.length * 0.5);
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
}

const createComment = () => ({
  id: 1,
  vpos: 0,
  content: "test",
  date: 0,
  date_usec: 0,
  owner: false,
  premium: false,
  mail: [],
  user_id: 0,
  layer: -1,
  is_my_post: false,
});

const resetTestConfig = () => {
  initConfig();
  setConfig(defaultConfig);
  setOptions(defaultOptions);
};

export { FakeRenderer, createComment, resetTestConfig };
