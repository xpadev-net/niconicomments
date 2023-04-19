import type { configItem } from "@/@types/config";
import type { formattedComment } from "@/@types/format.formatted";
import type { IComment } from "@/@types/IComment";
import type {
  collision,
  collisionItem,
  commentContentIndex,
  commentFlashFont,
  commentFont,
  formattedCommentWithSize,
  Timeline,
} from "@/@types/types";
import { config } from "@/definition/config";
/**
 * 当たり判定からコメントを配置できる場所を探す
 * @param {number} currentPos
 * @param {parsedComment} targetComment
 * @param {number[]|undefined} collision
 */
const getPosY = (
  currentPos: number,
  targetComment: IComment,
  collision: IComment[] | undefined
): { currentPos: number; isChanged: boolean; isBreak: boolean } => {
  let isChanged = false,
    isBreak = false;
  if (!collision) return { currentPos, isChanged, isBreak };
  for (const collisionItem of collision) {
    if (
      currentPos < collisionItem.posY + collisionItem.height &&
      currentPos + targetComment.height > collisionItem.posY &&
      collisionItem.owner === targetComment.owner &&
      collisionItem.layer === targetComment.layer
    ) {
      if (collisionItem.posY + collisionItem.height > currentPos) {
        currentPos = collisionItem.posY + collisionItem.height;
        isChanged = true;
      }
      if (currentPos + targetComment.height > config.canvasHeight) {
        if (config.canvasHeight < targetComment.height) {
          if (targetComment.mail.includes("naka")) {
            currentPos = (targetComment.height - config.canvasHeight) / -2;
          } else {
            currentPos = 0;
          }
        } else {
          currentPos = Math.floor(
            Math.random() * (config.canvasHeight - targetComment.height)
          );
        }
        isBreak = true;
        break;
      }
    }
  }
  return { currentPos, isChanged, isBreak };
};
/**
 * コメントのvposと現在のvposから左右の位置を返す
 * @param {formattedCommentWithSize} comment
 * @param {number} vposLapsed
 * @param {boolean} isReverse
 */
const getPosX = (
  comment: formattedCommentWithSize,
  vpos: number,
  isReverse = false
): number => {
  if (comment.loc !== "naka") {
    return (config.canvasWidth - comment.width) / 2;
  }
  const speed =
    (config.commentDrawRange + comment.width) / (comment.long + 100);
  const vposLapsed = vpos - comment.vpos;
  const posX =
    config.commentDrawPadding +
    config.commentDrawRange -
    (vposLapsed + 100) * speed;
  if (isReverse) {
    return config.canvasWidth - comment.width - posX;
  }
  return posX;
};
/**
 * フォント名とサイズをもとにcontextで使えるフォントを生成する
 * @param {string} font
 * @param {string|number} size
 * @returns {string}
 */
const parseFont = (font: commentFont, size: string | number): string => {
  switch (font) {
    case "gulim":
    case "simsun":
      return config.font[font].replace("[size]", `${size}`);
    case "gothic":
    case "mincho":
      return `${config.fonts[font].weight} ${size}px ${config.fonts[font].font}`;
    default:
      return `${config.fonts.defont.weight} ${size}px ${config.fonts.defont.font}`;
  }
};
/**
 * phpのarray_push的なあれ
 * @param array
 * @param {string|number} key
 * @param push
 */
const arrayPush = (
  array: { [key: number]: IComment[] },
  key: string | number,
  push: IComment
) => {
  if (!array) {
    array = {};
  }
  if (!array[Number(key)]) {
    array[Number(key)] = [];
  }
  array[Number(key)]?.push(push);
};
/**
 * Hexからrgbに変換する(_live用)
 * @param {string} hex
 * @return {array} RGB
 */
const hex2rgb = (hex: string) => {
  if (hex.slice(0, 1) === "#") hex = hex.slice(1);
  if (hex.length === 3)
    hex =
      hex.slice(0, 1) +
      hex.slice(0, 1) +
      hex.slice(1, 2) +
      hex.slice(1, 2) +
      hex.slice(2, 3) +
      hex.slice(2, 3);

  return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(function (
    str
  ) {
    return parseInt(str, 16);
  });
};
/**
 * Hexからrgbaに変換する(_live用)
 * @param {string} hex
 * @return {array} RGB
 */
const hex2rgba = (hex: string) => {
  if (hex.slice(0, 1) === "#") hex = hex.slice(1);
  if (hex.length === 4)
    hex =
      hex.slice(0, 1) +
      hex.slice(0, 1) +
      hex.slice(1, 2) +
      hex.slice(1, 2) +
      hex.slice(2, 3) +
      hex.slice(2, 3) +
      hex.slice(3, 4) +
      hex.slice(3, 4);

  return [
    hex.slice(0, 2),
    hex.slice(2, 4),
    hex.slice(4, 6),
    hex.slice(4, 6),
  ].map((str, index) => {
    if (index === 3) return parseInt(str, 16) / 256;
    return parseInt(str, 16);
  });
};
/**
 * CAと思われるコメントのレイヤーを分離する
 * @param {formattedComment[]} rawData
 */
const changeCALayer = (rawData: formattedComment[]): formattedComment[] => {
  const userList: { [key: number]: number } = {};
  const data: formattedComment[] = [],
    index: { [key: string]: formattedComment } = {};
  for (const value of rawData) {
    if (value.user_id === undefined || value.user_id === -1) continue;
    if (userList[value.user_id] === undefined) userList[value.user_id] = 0;
    if (
      value.mail.indexOf("ca") > -1 ||
      value.mail.indexOf("patissier") > -1 ||
      value.mail.indexOf("ender") > -1 ||
      value.mail.indexOf("full") > -1
    ) {
      userList[value.user_id] += 5;
    }
    if ((value.content.match(/\r\n|\n|\r/g) || []).length > 2) {
      userList[value.user_id] +=
        (value.content.match(/\r\n|\n|\r/g) || []).length / 2;
    }
    const key = `${value.content}@@${[...value.mail]
        .sort()
        .filter((e) => !e.match(/@[\d.]+|184|device:.+|patissier|ca/))
        .join("")}`,
      lastComment = index[key];
    if (lastComment !== undefined) {
      if (
        value.vpos - lastComment.vpos > config.sameCAGap ||
        Math.abs(value.date - lastComment.date) < config.sameCARange
      ) {
        data.push(value);
        index[key] = value;
      }
    } else {
      data.push(value);
      index[key] = value;
    }
  }
  for (const value of data) {
    if (userList[value.user_id] || 0 >= config.sameCAMinScore)
      value.layer = value.user_id;
  }
  return data;
};

/**
 * Configがhtml5とflashで別れてる場合は対応するものを、そうでなければ初期値を返す
 * @param {configItem} input
 * @param {boolean} isFlash
 */
const getConfig = <T>(input: configItem<T>, isFlash = false): T => {
  if (
    Object.prototype.hasOwnProperty.call(input, "html5") &&
    Object.prototype.hasOwnProperty.call(input, "flash")
  ) {
    return (input as { [key in "html5" | "flash"]: T })[
      isFlash ? "flash" : "html5"
    ];
  } else {
    return input as T;
  }
};

const getStrokeColor = (comment: formattedCommentWithSize) => {
  if (comment.strokeColor) {
    const length = comment.strokeColor.length;
    if (length === 3 || length === 6) {
      return `rgba(${hex2rgb(comment.strokeColor).join(",")},${
        config.contextStrokeOpacity
      })`;
    } else if (length === 4 || length === 8) {
      return `rgba(${hex2rgba(comment.strokeColor).join(",")})`;
    }
  }
  return `rgba(${hex2rgb(
    comment.color === "#000000"
      ? config.contextStrokeInversionColor
      : config.contextStrokeColor
  ).join(",")},${config.contextStrokeOpacity})`;
};

const ArrayEqual = (a: unknown[], b: unknown[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0, n = a.length; i < n; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const getFlashFontIndex = (part: string): commentContentIndex[] => {
  const regex = {
    simsunStrong: new RegExp(config.flashChar.simsunStrong),
    simsunWeak: new RegExp(config.flashChar.simsunWeak),
    gulim: new RegExp(config.flashChar.gulim),
    gothic: new RegExp(config.flashChar.gothic),
  };
  const index: commentContentIndex[] = [];
  let match;
  if ((match = regex.simsunStrong.exec(part)) !== null) {
    index.push({ font: "simsunStrong", index: match.index });
  }
  if ((match = regex.simsunWeak.exec(part)) !== null) {
    index.push({ font: "simsunWeak", index: match.index });
  }
  if ((match = regex.gulim.exec(part)) !== null) {
    index.push({ font: "gulim", index: match.index });
  }
  if ((match = regex.gothic.exec(part)) !== null) {
    index.push({ font: "gothic", index: match.index });
  }
  return index;
};

const getFlashFontName = (font: string): commentFlashFont => {
  if (font.match("^simsun.+")) return "simsun";
  if (font === "gothic") return "defont";
  return font as commentFlashFont;
};

const nativeSort = <T>(getter: (input: T) => number) => {
  return (a: T, b: T) => {
    if (getter(a) > getter(b)) {
      return 1;
    } else if (getter(a) < getter(b)) {
      return -1;
    } else {
      return 0;
    }
  };
};

const processFixedComment = (
  comment: IComment,
  collision: collisionItem,
  timeline: Timeline
) => {
  let posY = 0,
    isChanged = true,
    count = 0;
  while (isChanged && count < 10) {
    isChanged = false;
    count++;
    for (let j = 0; j < comment.long; j++) {
      const result = getPosY(posY, comment, collision[comment.vpos + j]);
      posY = result.currentPos;
      isChanged = result.isChanged;
      if (result.isBreak) break;
    }
  }
  for (let j = 0; j < comment.long; j++) {
    const vpos = comment.vpos + j;
    arrayPush(timeline, vpos, comment);
    if (j > comment.long - 20) continue;
    arrayPush(collision, vpos, comment);
  }
  comment.posY = posY;
};

const processMovableComment = (
  comment: IComment,
  collision: collision,
  timeline: Timeline
) => {
  const beforeVpos =
    Math.round(-288 / ((1632 + comment.width) / (comment.long + 125))) - 100;
  const posY = (() => {
    if (config.canvasHeight < comment.height) {
      return (comment.height - config.canvasHeight) / -2;
    }
    let posY = 0;
    let isChanged = true,
      count = 0;
    while (isChanged && count < 10) {
      isChanged = false;
      count++;
      for (let j = beforeVpos; j < comment.long + 125; j++) {
        const vpos = comment.vpos + j;
        const left_pos = getPosX(comment.comment, vpos);
        let isBreak = false;
        if (
          left_pos + comment.width >= config.collisionRange.right &&
          left_pos <= config.collisionRange.right
        ) {
          const result = getPosY(posY, comment, collision.right[vpos]);
          posY = result.currentPos;
          isChanged = result.isChanged;
          isBreak = result.isBreak;
        }
        if (
          left_pos + comment.width >= config.collisionRange.left &&
          left_pos <= config.collisionRange.left
        ) {
          const result = getPosY(posY, comment, collision.left[vpos]);
          posY = result.currentPos;
          isChanged = result.isChanged;
          isBreak = result.isBreak;
        }
        if (isBreak) return posY;
      }
    }
    return posY;
  })();
  for (let j = beforeVpos; j < comment.long + 125; j++) {
    const vpos = comment.vpos + j;
    const left_pos = getPosX(comment.comment, vpos);
    arrayPush(timeline, vpos, comment);
    if (
      left_pos + comment.width >= config.collisionRange.right &&
      left_pos <= config.collisionRange.right
    ) {
      arrayPush(collision.right, vpos, comment);
    }
    if (
      left_pos + comment.width >= config.collisionRange.left &&
      left_pos <= config.collisionRange.left
    ) {
      arrayPush(collision.left, vpos, comment);
    }
  }
  comment.posY = posY;
};

export {
  ArrayEqual,
  arrayPush,
  changeCALayer,
  getConfig,
  getFlashFontIndex,
  getFlashFontName,
  getPosX,
  getPosY,
  getStrokeColor,
  hex2rgb,
  hex2rgba,
  nativeSort,
  parseFont,
  processFixedComment,
  processMovableComment,
};
