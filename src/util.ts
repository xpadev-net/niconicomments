import { commentDrawPadding, commentDrawRange } from "@/definition/definition";

/**
 * 配列をフォントとサイズでグループ化する
 * @param {{}} array
 * @returns {{}}
 */
const groupBy = (array: formattedCommentWithFont[]): groupedComments => {
  const data = (["defont", "gothic", "mincho"] as commentFont[]).reduce(
    (pv, font) => {
      pv[font] = {};
      return pv;
    },
    {} as groupedComments
  );
  array.forEach((item, index) => {
    if (!data[item.font]) {
      console.log(data, item.font);
    }
    const value = data[item.font][item.fontSize] || [];
    value.push({ ...item, index });
    if (value.length === 1) {
      data[item.font][item.fontSize] = value;
    }
  });
  return data;
};
/**
 *
 */
const getPosY = (
  currentPos: number,
  targetComment: parsedComment,
  collision: number[] | undefined,
  data: parsedComment[]
): { currentPos: number; isChanged: boolean; isBreak: boolean } => {
  let isChanged = false,
    isBreak = false;
  if (!collision) return { currentPos, isChanged, isBreak };
  for (const index of collision) {
    const collisionItem = data[index];
    if (!collisionItem) continue;
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
      if (currentPos + targetComment.height > 1080) {
        if (1080 < targetComment.height) {
          if (targetComment.mail.includes("naka")) {
            currentPos = (targetComment.height - 1080) / -2;
          } else {
            currentPos = 0;
          }
        } else {
          currentPos = Math.floor(
            Math.random() * (1080 - targetComment.height)
          );
        }
        isBreak = true;
        break;
      }
    }
  }
  return { currentPos, isChanged, isBreak };
};
const getPosX = (width: number, vpos: number, long: number): number => {
  return (
    commentDrawRange -
    ((((width + commentDrawRange) * ((vpos + 100) / 100)) / 4) * 300) / long +
    commentDrawPadding
  );
};
/**
 * フォント名とサイズをもとにcontextで使えるフォントを生成する
 * @param {string} font
 * @param {string|number} size
 * @param {boolean} useLegacy
 * @returns {string}
 */
const parseFont = (
  font: commentFont,
  size: string | number,
  useLegacy: boolean
): string => {
  switch (font) {
    case "gothic":
      return `normal 400 ${size}px "游ゴシック体", "游ゴシック", "Yu Gothic", YuGothic, yugothic, YuGo-Medium`;
    case "mincho":
      return `normal 400 ${size}px "游明朝体", "游明朝", "Yu Mincho", YuMincho, yumincho, YuMin-Medium`;
    default:
      if (useLegacy) {
        return `normal 600 ${size}px Arial, "ＭＳ Ｐゴシック", "MS PGothic", MSPGothic, MS-PGothic`;
      } else {
        return `normal 600 ${size}px sans-serif, Arial, "ＭＳ Ｐゴシック", "MS PGothic", MSPGothic, MS-PGothic`;
      }
  }
};
/**
 * phpのarray_push的なあれ
 * @param array
 * @param {string|number} key
 * @param push
 */
const arrayPush = (
  array: { [key: number]: number[] },
  key: string | number,
  push: number
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
 * replaceAll
 */
const replaceAll = (string: string, target: string, replace: string) => {
  while (string.indexOf(target) !== -1) {
    string = string.replace(target, replace);
  }
  return string;
};
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
    const key = `${value.content}@@${Array.from(new Set([...value.mail].sort()))
        .filter((e) => !e.match(/@[\d.]+|184|device:.+|patissier|ca/))
        .join("")}`,
      lastComment = index[key];
    if (lastComment !== undefined) {
      if (
        value.vpos - lastComment.vpos > 100 ||
        Math.abs(value.date - lastComment.date) < 3600
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
    if (userList[value.user_id] || 0 >= 10) value.layer = value.user_id;
  }
  return data;
};

export {
  groupBy,
  getPosY,
  getPosX,
  parseFont,
  arrayPush,
  hex2rgb,
  replaceAll,
  changeCALayer,
};
