export type ButtonList = {
  left: ButtonPartLeft;
  middle: ButtonPartMiddle[];
  right: ButtonPartRight;
};

export type ButtonPartLeft = {
  type: "left";
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ButtonPartMiddle = {
  type: "middle";
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ButtonPartRight = {
  type: "right";
  right: number;
  top: number;
  height: number;
};
