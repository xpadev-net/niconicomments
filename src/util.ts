import { config, options } from "@/definition/config";
import { nicoScripts } from "@/contexts/nicoscript";
import typeGuard from "@/typeGuard";
import { colors } from "@/definition/colors";
import type { configItem } from "@/@types/config";
import type { IComment } from "@/@types/IComment";
import type {
  commentContentIndex,
  commentFont,
  formattedCommentWithFont,
  formattedCommentWithSize,
  parsedCommand,
} from "@/@types/types";
import type { formattedComment } from "@/@types/format.formatted";
import { commentFlashFont } from "@/@types/types";
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
 * @param {number} width
 * @param {number} vpos
 * @param {number} long
 */
const getPosX = (width: number, vpos: number, long: number): number => {
  const speed = (config.commentDrawRange + width) / (long + 100);
  return (
    config.commentDrawPadding + config.commentDrawRange - (vpos + 100) * speed
  );
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

/**
 * コメントがFlash適用対象化判定返す
 * @param {formattedComment} comment
 */
const isFlashComment = (comment: formattedComment): boolean =>
  options.mode === "flash" ||
  (options.mode === "default" &&
    !(
      comment.mail.includes("gothic") ||
      comment.mail.includes("defont") ||
      comment.mail.includes("mincho")
    ) &&
    (comment.date < config.flashThreshold ||
      comment.mail.includes("nico:flash")));

const parseCommandAndNicoScript = (
  comment: formattedComment
): formattedCommentWithFont => {
  const isFlash = isFlashComment(comment);
  const data = parseCommand(comment),
    string = comment.content,
    nicoscript = string.match(
      /^(?:@|\uff20)(\u30c7\u30d5\u30a9\u30eb\u30c8|\u7f6e\u63db|\u9006|\u30b3\u30e1\u30f3\u30c8\u7981\u6b62|\u30b7\u30fc\u30af\u7981\u6b62|\u30b8\u30e3\u30f3\u30d7)/
    );
  if (nicoscript && comment.owner) {
    const reverse = comment.content.match(
      /^(?:@|\uff20)\u9006(?:\s+)?(\u5168|\u30b3\u30e1|\u6295\u30b3\u30e1)?/
    );
    const content = comment.content.split(""),
      result = [];
    let quote = "",
      last_i = "",
      string = "";
    if (nicoscript[1] === "\u30c7\u30d5\u30a9\u30eb\u30c8") {
      //＠デフォルト
      nicoScripts.default.unshift({
        start: comment.vpos,
        long: data.long === undefined ? undefined : Math.floor(data.long * 100),
        color: data.color,
        size: data.size,
        font: data.font,
        loc: data.loc,
      });
    } else if (
      nicoscript[1] === "\u9006" &&
      reverse &&
      reverse[1] &&
      typeGuard.nicoScript.range.target(reverse[1])
    ) {
      //＠逆
      if (data.long === undefined) {
        data.long = 30;
      }
      nicoScripts.reverse.unshift({
        start: comment.vpos,
        end: comment.vpos + data.long * 100,
        target: reverse[1],
      });
    } else if (nicoscript[1] === "\u30b3\u30e1\u30f3\u30c8\u7981\u6b62") {
      //@コメント禁止

      if (data.long === undefined) {
        data.long = 30;
      }
      nicoScripts.ban.unshift({
        start: comment.vpos,
        end: comment.vpos + data.long * 100,
      });
    } else if (nicoscript[1] === "\u7f6e\u63db") {
      //@置換
      for (const i of content.slice(4)) {
        if (i.match(/["'\u300c]/) && quote === "") {
          quote = i;
        } else if (i.match(/["']/) && quote === i && last_i !== "\\") {
          result.push(string.replaceAll("\\n", "\n"));
          quote = "";
          string = "";
        } else if (i.match(/\u300d/) && quote === "\u300c") {
          result.push(string);
          quote = "";
          string = "";
        } else if (quote === "" && i.match(/\s+/)) {
          if (string) {
            result.push(string);
            string = "";
          }
        } else {
          string += i;
        }

        last_i = i;
      }
      result.push(string);
      if (
        !(
          result[0] === undefined ||
          (result[2] !== undefined &&
            !typeGuard.nicoScript.replace.range(result[2])) ||
          (result[3] !== undefined &&
            !typeGuard.nicoScript.replace.target(result[3])) ||
          (result[4] !== undefined &&
            !typeGuard.nicoScript.replace.condition(result[4]))
        )
      ) {
        nicoScripts.replace.unshift({
          start: comment.vpos,
          long:
            data.long === undefined ? undefined : Math.floor(data.long * 100),
          keyword: result[0],
          replace: result[1] || "",
          range: result[2] || "\u5358",
          target: result[3] || "\u30b3\u30e1",
          condition: result[4] || "\u90e8\u5206\u4e00\u81f4",
          color: data.color,
          size: data.size,
          font: data.font,
          loc: data.loc,
          no: comment.id,
        });
        nicoScripts.replace.sort((a, b) => {
          if (a.start < b.start) return -1;
          if (a.start > b.start) return 1;
          if (a.no < b.no) return -1;
          if (a.no > b.no) return 1;
          return 0;
        });
      }
    }
    data.invisible = true;
  }
  let color = undefined,
    size = undefined,
    font = undefined,
    loc = undefined;
  for (let i = 0; i < nicoScripts.default.length; i++) {
    const item = nicoScripts.default[i];
    if (!item) continue;
    if (item.long !== undefined && item.start + item.long < comment.vpos) {
      nicoScripts.default = nicoScripts.default.splice(Number(i), 1);
      continue;
    }
    if (item.loc) {
      loc = item.loc;
    }
    if (item.color) {
      color = item.color;
    }
    if (item.size) {
      size = item.size;
    }
    if (item.font) {
      font = item.font;
    }
    if (loc && color && size && font) break;
  }
  for (let i = 0; i < nicoScripts.replace.length; i++) {
    const item = nicoScripts.replace[i];
    if (!item) continue;
    if (item.long !== undefined && item.start + item.long < comment.vpos) {
      nicoScripts.default = nicoScripts.default.splice(Number(i), 1);
      continue;
    }
    if (
      (item.target === "\u30b3\u30e1" && comment.owner) ||
      (item.target === "\u6295\u30b3\u30e1" && !comment.owner) ||
      (item.target === "\u542b\u307e\u306a\u3044" && comment.owner)
    )
      continue;
    if (
      (item.condition === "\u5b8c\u5168\u4e00\u81f4" &&
        comment.content === item.keyword) ||
      (item.condition === "\u90e8\u5206\u4e00\u81f4" &&
        comment.content.indexOf(item.keyword) !== -1)
    ) {
      if (item.range === "\u5358") {
        comment.content = comment.content.replaceAll(
          item.keyword,
          item.replace
        );
      } else {
        comment.content = item.replace;
      }
      if (item.loc) {
        data.loc = item.loc;
      }
      if (item.color) {
        data.color = item.color;
      }
      if (item.size) {
        data.size = item.size;
        data.fontSize = getConfig(config.fontSize, isFlash)[data.size].default;
      }
      if (item.font) {
        data.font = item.font;
      }
    }
  }
  if (!data.loc) {
    data.loc = loc || "naka";
  }
  if (!data.color) {
    data.color = color || "#FFFFFF";
  }
  if (!data.size) {
    data.size = size || "medium";
    data.fontSize = getConfig(config.fontSize, isFlash)[data.size].default;
  }
  if (!data.font) {
    data.font = font || "defont";
  }
  if (!data.long) {
    data.long = 300;
  } else {
    data.long = Math.floor(Number(data.long) * 100);
  }
  return {
    ...comment,
    content: [],
    lineCount: 0,
    lineOffset: 0,
    ...data,
    flash: isFlash,
  } as formattedCommentWithFont;
};

const parseCommand = (comment: formattedComment): parsedCommand => {
  const metadata = comment.mail,
    isFlash = isFlashComment(comment);
  const result: parsedCommand = {
    loc: undefined,
    size: undefined,
    fontSize: undefined,
    color: undefined,
    strokeColor: undefined,
    wakuColor: undefined,
    font: undefined,
    full: false,
    ender: false,
    _live: false,
    invisible: false,
    long: undefined,
  };
  for (let command of metadata) {
    command = command.toLowerCase();
    let match;
    if ((match = command.match(/^(?:@|\uff20)([0-9.]+)/)) && match[1]) {
      result.long = Number(match[1]);
    } else if (
      result.strokeColor === undefined &&
      (match = command.match(/^nico:stroke:(.+)$/))
    ) {
      if (typeGuard.comment.color(match[1])) {
        result.strokeColor = colors[match[1]];
      } else if (typeGuard.comment.colorCode(match[1])) {
        result.strokeColor = match[1].slice(1);
      }
    } else if (
      result.wakuColor === undefined &&
      (match = command.match(/^nico:waku:(.+)$/))
    ) {
      if (typeGuard.comment.color(match[1])) {
        result.wakuColor = colors[match[1]];
      } else if (typeGuard.comment.colorCode(match[1])) {
        result.wakuColor = match[1].slice(1);
      }
    } else if (result.loc === undefined && typeGuard.comment.loc(command)) {
      result.loc = command;
    } else if (result.size === undefined && typeGuard.comment.size(command)) {
      result.size = command;
      result.fontSize = getConfig(config.fontSize, isFlash)[command].default;
    } else {
      if (result.color === undefined) {
        const color = config.colors[command];
        if (color) {
          result.color = color;
          continue;
        } else {
          const match = command.match(/#[0-9a-z]{3,6}/);
          if (match && match[0] && comment.premium) {
            result.color = match[0].toUpperCase();
            continue;
          }
        }
      }
      if (result.font === undefined && typeGuard.comment.font(command)) {
        result.font = command;
      } else if (typeGuard.comment.command.key(command)) {
        result[command] = true;
      }
    }
  }
  if (comment.content.startsWith("/")) {
    result.invisible = true;
  }
  return result;
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

const getValue = <T>(value: T | undefined | null, alternative: T): T => {
  return value ?? alternative;
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

export {
  getPosY,
  getPosX,
  parseFont,
  arrayPush,
  hex2rgb,
  hex2rgba,
  getStrokeColor,
  changeCALayer,
  getConfig,
  isFlashComment,
  parseCommandAndNicoScript,
  ArrayEqual,
  getFlashFontIndex,
  getFlashFontName,
  getValue,
  nativeSort,
};
