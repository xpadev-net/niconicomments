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
}
/**
 * フォント名とサイズをもとにcontextで使えるフォントを生成する
 * @param {string} font
 * @param {string|number} size
 * @param {boolean} useLegacy
 * @returns {string}
 */
const parseFont = (font: string, size: string | number, useLegacy: boolean): string => {
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
}
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
}
/**
 * Hexからrgbに変換する(_live用)
 * @param {string} hex
 * @return {array} RGB
 */
const hex2rgb = (hex: string) => {
    if (hex.slice(0, 1) === "#") hex = hex.slice(1);
    if (hex.length === 3) hex = hex.slice(0, 1) + hex.slice(0, 1) + hex.slice(1, 2) + hex.slice(1, 2) + hex.slice(2, 3) + hex.slice(2, 3);

    return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(function (str) {
        return parseInt(str, 16);
    });
}
/**
 * replaceAll
 */
const replaceAll = (string: string, target: string, replace: string) => {
    let count = 0;
    while (string.indexOf(target) !== -1 && count < 100) {
        string = string.replace(target, replace)
        count++;
    }
    return string;
}


/**
 * 関数をパースして関数名と引数を返す
 * @param str
 * @param isScript
 */
const parseFunc = (str, isScript = false) => {
    let arr = Array.from(str), deps = 0, char = null;
    let func = [], arg = [];
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
            if (value === "(") {
                deps++;
            } else if (value === ")") {
                deps--;
                if (deps === 0) {
                    arg.splice(0, 1);
                    arr.splice(0, Number(i) + 1);
                    return {func: func.join(""), arg: parseArg(arg.join(""), isScript), after: arr.join("")};
                }
            }
        }
        if (deps > 0) {
            arg.push(value);
        } else {
            func.push(value);
        }
    }

}
/**
 * 引数をパースする
 * @param input
 * @param isScript
 */
const parseArg = (input, isScript = false) => {
    let arr = Array.from(input), deps = 0, char = null, tmp = [], arg = {}, left = "default";
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
            let _left = left, i = 0;
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
        } else if (deps === 0 && value === ":" && (!isScript || (isScript && tmp.join("").match(/^then|else|timer$/)))) {
            left = tmp.join("");
            tmp = [];
        } else {
            tmp.push(value)
        }
    }
    if (tmp !== []) {
        let _left = left, i = 0;
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
}
/**
 * カッコを含むものを処理
 */
const parseBrackets = (string) => {
    let str = Array.from(string), deps = 0, leftArr = [], brackets = [], args = [];
    for (let i in str) {
        let value = str[i], left = leftArr.join("").trim();
        if (deps === 0) {
            brackets.push(value);
        }
        leftArr.push(value);
        if (value === "(") {
            deps++;
            if (deps === 1) {
                leftArr = [];
            }
        } else if (value === ")") {
            deps--;
            if (deps === 0) {
                leftArr.pop();
                left = leftArr.join("");
                args.push(left.trim());
                leftArr = [];
                brackets.push(value);
            }
        } else if (value === "[") {
            deps++;
        } else if (value === "]") {
            deps--;
        } else if (value === ",") {
            if (deps === 1) {
                leftArr.pop();
                left = leftArr.join("");
                args.push(left.trim());
                leftArr = [];
            }
        }
    }
    return {brackets: brackets.join("").trim(), args: args};
}
/**
 * クォートで囲われた文字列か判定
 */
const isString = (string: string) => {
    if (!(
        (string.startsWith('"') && string.endsWith('"')) ||
        (string.startsWith("'") && string.endsWith("'")) ||
        (string.startsWith("「") && string.endsWith("」"))
    )) {
        return false;
    }
    let str: string[] = Array.from(string.slice(1, -1)), quote = string.slice(0, 1);
    for (const i in str) {
        if (str[i] === quote && str[Number(i) - 1] !== "\\") {
            return false;
        }
    }
    return true;
}

/**
 * クォートを考慮して文字列を分割
 * @param string
 * @param separator
 */
const splitWithDeps = (string: string, separator: RegExp) => {
    let arr = Array.from(string), deps = 0, char = null;
    let res = [], tmp = [];
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
            if (value.match(/[(\[]/)) {
                deps++;
            } else if (value.match(/[)\]]/)) {
                deps--;
            }
        }
        if (deps === 0 && value.match(separator)) {
            res.push(tmp.join(""));
            tmp = [];
        } else {
            tmp.push(value);
        }
    }
    if (tmp) {
        res.push(tmp.join(""));
    }
    return res;
}
const unQuote = (string: string) => {
    if (string.match(/^["'「][\s\S]*["'」]$/)) {
        return string.slice(1, -1);
    }
    return string
}
const getByName = (args: any,name: string) => {
    for (let arg of args){
        if (arg.name === name){
            return arg;
        }
    }
    return false;
}

export {
    groupBy,
    parseFont,
    arrayPush,
    hex2rgb,
    replaceAll,
    parseFunc,
    parseArg,
    parseBrackets,
    isString,
    splitWithDeps,
    unQuote,
    getByName
};