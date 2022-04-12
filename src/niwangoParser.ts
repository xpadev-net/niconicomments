type formattedComment = {
    "id": number,
    "vpos": number,
    "content": string,
    "date": number,
    "date_usec": number,
    "owner": boolean,
    "premium": boolean,
    "mail": string[]
}

class NiwangoParser {
    private timeline: any;
    private functions: any;
    private variable: any;
    private queue: any;
    private last_chat: formattedComment;

    constructor() {
        this.timeline = {};
        this.queue = {};
        this.functions = {};
        this.variable = {
            chat: null,
            commentColor: undefined, //0xffffff
            commentPlace: undefined, //naka
            commentSize: undefined,  //medium
            commentInvisible: undefined, //false
            commentReverse: undefined,//0
            defaultSage: undefined,  //false
            postDisabled: undefined, //false
            seekDisabled: undefined, //false
            isLoaded: undefined,     //true
            isWide: undefined,       //false
            lastVideo: "sm1",        //sm1
        };
    }

    exec(comment: formattedComment) {
        if (comment.content.startsWith("/")) {
            let scripts = this.parse(comment);
            for (const key in scripts) {
                let value = scripts[key];
                switch (value.type) {
                    case "setVar":
                    //this.variable[value.name] = value.value.content;
                }
            }
        }
        this.last_chat = comment;
    }

    /**
     * コメントデータを分割して投げる
     * @param arg1
     * @param root
     */
    parse(arg1, root = true) {
        let string;
        if (typeof arg1 == "object") {
            string = arg1.content.substring(1);
        } else {
            string = arg1;
        }
        let scripts = splitWithDeps(string, /;/), tmp = [];
        for (let i in scripts) {
            let result = this.parseLine(scripts[i], root);
            if (result) {
                tmp.push(result);
            }
        }
        console.log(tmp);
        return tmp;
    }

    /**
     * 文字列をスクリプトとしてパース
     * @param string
     * @param root
     */
    parseLine(string: string, root: boolean = false) {
        let tmp = splitWithDeps(string, /;/);
        if (tmp.length > 1) {
            let result = [];
            for (const tmpKey in tmp) {
                result.push(this.parseLine(tmp[tmpKey], false));
            }
            return result;
        }
        if (string.startsWith("\\")) {
            string = string.slice(1);
        }
        let str: string[] = Array.from(string), leftArr = [];
        if (string.match(/^(true|false|[0-9.]+)$/) || isString(string)) {
            if (root) return {type: "ExpressionStatement", expression: this.parseLine(string)};
            return {
                type: "Literal",
                value: string
            }
        } else if (string.match(/^[a-zA-Z0-9_$]+$/)) {
            if (root) return {type: "ExpressionStatement", expression: this.parseLine(string)};
            return {
                type: "Identifier",
                name: string
            }
        } else if (string.match(/^[a-zA-Z0-9_$]+((\[([a-zA-Z0-9_$]+|["'].+["'])])|\.[a-zA-Z0-9_$]+)+$/)) {
            if (root) return {type: "ExpressionStatement", expression: this.parseLine(string)};
            if (string.match(/^[a-zA-Z0-9_$]+((\[([a-zA-Z0-9_$]+|["'].+["'])])|\.[a-zA-Z0-9_$]+)*\.[a-zA-Z0-9_$]+$/)) {
                return {
                    type: "MemberExpression",
                    object: this.parseLine(string.slice(0, string.lastIndexOf("."))),
                    property: this.parseLine(string.slice(string.lastIndexOf(".") + 1))
                }
            }
            return {
                type: "MemberExpression",
                object: this.parseLine(string.slice(0, string.lastIndexOf("["))),
                property: this.parseLine(string.slice(string.lastIndexOf("[") + 1, -1))
            }
        }
        for (let i in str) {
            let value = str[i], left = leftArr.join("").trim(), next_value = str[Number(i) + 1],
                last_value = str[Number(i) - 1], right_value = string.slice(Number(i) + 1);
            if ((value + next_value).match(/[=!<>+\-*\/%]=/)) continue;
            if ((last_value + value).match(/[=!<>+\-*\/%]=/)) {
                if (root) return {type: "ExpressionStatement", expression: this.parseLine(string)};
                return {
                    type: "BinaryExpression",
                    left: this.parseLine(left),
                    operator: last_value + value,
                    right: this.parseLine(right_value)
                }
            }
            if (value.match(/[+\-*\/%<>]/)) {
                if (root) return {type: "ExpressionStatement", expression: this.parseLine(string)};
                return {
                    type: "BinaryExpression",
                    left: this.parseLine(left),
                    operator: value,
                    right: this.parseLine(right_value)
                }
            } else if (value === "=" && left.match(/^[0-9a-zA-Z_]+:$/)) {
                return {
                    type: "VariableDeclaration",
                    declarations: [{
                        type: "VariableDeclarator",
                        id: this.parseLine(left.slice(0, -1)),
                        init: this.parseLine(right_value)
                    }]
                }
            } else if (value === "=") {
                if (root) return {type: "ExpressionStatement", expression: this.parseLine(string)};
                return {
                    type: "AssignmentExpression",
                    operator: value,
                    left: this.parseLine(left),
                    right: this.parseLine(right_value)
                }
            } else if (value === "(") {
                if (left === "") {
                    let brackets = parseBrackets(string)
                    if (brackets.brackets === "().alt()" || brackets.brackets === "().alternative()") {
                        return {
                            type: "IfStatement",
                            test: this.parseLine(brackets.args[0]),
                            consequent: {
                                type: "BlockStatement",
                                body: this.parse(brackets.args[1], false)
                            },
                            alternate: brackets.args.length === 3 ? {
                                type: "BlockStatement",
                                body: this.parse(brackets.args[2], false)
                            } : null
                        }
                    }
                    for (const key in brackets.args) {
                        brackets.args[key] = this.parseLine(brackets.args[key], false);
                    }

                    return {
                        type: "BlockStatement",
                        body: brackets.args
                    };
                } else {
                    if (root) return {type: "ExpressionStatement", expression: this.parseLine(string)};
                    const isScript = left.match(/def|def_kari|commentTrigger|ctrig|timer|if|while_kari/) !== null;
                    let func = parseFunc(string, isScript), args = [];
                    for (let i in func.arg) {
                        let value = func.arg[i];
                        if (isScript && i === "default1") {
                            let scripts = splitWithDeps(value, /;/);
                            const src = [];
                            for (let script of scripts) {
                                src.push(this.parseLine(script));
                            }
                            args.push({
                                type: "ArrowFunctionExpression",
                                body: {
                                    type: "BlockStatement",
                                    body: src
                                },
                                name: i
                            });
                        } else {
                            args.push({...this.parseLine(value), name: i});
                        }
                    }
                    return {
                        type: "CallExpression",
                        callee: this.parseLine(left),
                        arguments: args
                    }
                }
            }
            leftArr.push(value);
        }
    }
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
            if (value === "(") {
                deps++;
            } else if (value === ")") {
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
export default NiwangoParser;