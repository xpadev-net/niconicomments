/**
 * 配列を複数のキーでグループ化する
 * @param {{}} array
 * @param {string} key
 * @param {string} key2
 * @returns {{}}
 */
const groupBy = (array: any, key: string, key2: string): {} => {
  let data: any = {};
  for (let i in array) {
    if (!data[array[i][key]]) {
      data[array[i][key]] = {};
    }
    if (!data[array[i][key]][array[i][key2]]) {
      data[array[i][key]][array[i][key2]] = [];
    }
    array[i].index = i;
    data[array[i][key]][array[i][key2]].push(array[i]);
  }
  return data;
};
/**
 * フォント名とサイズをもとにcontextで使えるフォントを生成する
 * @param {string} font
 * @param {string|number} size
 * @param {boolean} useLegacy
 * @returns {string}
 */
const parseFont = (
  font: string,
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
const arrayPush = (array: any, key: string | number, push: any) => {
  if (!array) {
    array = {};
  }
  if (!array[key]) {
    array[key] = [];
  }
  array[key].push(push);
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
  let count = 0;
  while (string.indexOf(target) !== -1 && count < 100) {
    string = string.replace(target, replace);
    count++;
  }
  return string;
};

/**
 * 引数をパースする
 * @param input
 * @param isScript
 */
const parseArg = (input: string, isScript: boolean = false) => {
  let arr: any[] = Array.from(input),
    deps: number = 0,
    char: string | null = null,
    tmp: string[] = [],
    arg: any = {},
    left: string = "default";
  for (let i in arr) {
    let value = arr[i];
    if (value === '"' || value === "'") {
      if (arr[Number(i) - 1] !== "\\") {
        if (char) {
          char = null;
        } else {
          char = value;
        }
      }
    }
    if (!char) {
      if (value === "(" || value === "[") {
        deps++;
      } else if (value === ")" || value === "]") {
        deps--;
      }
    }
    if (deps === 0 && value === ",") {
      let _left = left,
        i = 0;
      if (left === "default") {
        left += i;
      }
      while (arg[left]) {
        left = _left + i;
        i++;
      }
      arg[left] = tmp.join("");
      left = "default";
      tmp = [];
    } else if (
      deps === 0 &&
      value === ":" &&
      (!isScript || (isScript && tmp.join("").match(/^then|else|timer$/)))
    ) {
      left = tmp.join("");
      tmp = [];
    } else {
      tmp.push(value);
    }
  }
  if (tmp !== []) {
    let _left = left,
      i = 0;
    if (left === "default") {
      left += i;
    }
    while (arg[left]) {
      left = _left + i;
      i++;
    }
    arg[left] = tmp.join("");
  }
  return arg;
};
const unQuote = (string: any) => {
  if ((typeof string).match(/boolean|number/)) {
    return string;
  }
  if (string.match(/^["'「][\s\S]*["'」]$/)) {
    string = string.slice(1, -1);
  }
  if (string.match(/^-?[\d.]+|0x[\da-fA-F]+$/)) return Number(string);
  return string;
};
const getByName = (args: any, name: string) => {
  let default_value = name.match(/^\$(\d+)$/);
  if (default_value) name = "default" + (Number(default_value[1]) - 1);
  let tmp_value = name.match(/^@(\d+)$/);
  if (tmp_value) name = "tmp" + tmp_value[1];
  for (let key in args) {
    let arg = args[key];
    if (arg.NIWANGO_Identifier?.name === name) {
      return args[key];
    }
  }
  return false;
};

export {
  groupBy,
  parseFont,
  arrayPush,
  hex2rgb,
  replaceAll,
  parseArg,
  unQuote,
  getByName,
};
