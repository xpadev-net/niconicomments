import type { IRenderer } from "@/@types/renderer";

const drawLeftBorder = (
  context: IRenderer,
  left: number,
  top: number,
  width: number,
  height: number,
  radius: number,
) => {
  context.save();
  context.beginPath();
  context.moveTo(left + width, top);
  context.lineTo(left + radius, top);
  context.quadraticCurveTo(left, top, left, top + radius);
  context.lineTo(left, top + height - radius);
  context.quadraticCurveTo(left, top + height, left + radius, top + height);
  context.lineTo(left + width, top + height);
  context.stroke();
  context.restore();
};

const drawMiddleBorder = (
  context: IRenderer,
  left: number,
  top: number,
  width: number,
  height: number,
) => {
  context.save();
  context.beginPath();
  context.moveTo(left + width, top);
  context.lineTo(left, top);
  context.moveTo(left + width, top + height);
  context.lineTo(left, top + height);
  context.stroke();
  context.restore();
};

const drawRightBorder = (
  context: IRenderer,
  right: number,
  top: number,
  height: number,
  radius: number,
) => {
  context.save();
  context.beginPath();
  context.moveTo(right - radius, top);
  context.quadraticCurveTo(right, top, right, top + radius);
  context.lineTo(right, top + height - radius);
  context.quadraticCurveTo(right, top + height, right - radius, top + height);
  context.stroke();
  context.restore();
};

export { drawLeftBorder, drawMiddleBorder, drawRightBorder };
