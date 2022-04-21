import {parseFunc, parseBrackets, isString, splitWithDeps, arrayPush, unQuote} from "./Utils";

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
    private scripts: any;
    private last_chat: formattedComment;
    private last_vpos: number;
    private rollback: any;

    constructor() {
        this.timeline = {};
        this.scripts = {};
        this.functions = {};
        this.rollback = {};
        this.last_vpos = -1;
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

    /**
     * パース処理のみ
     * execは後で消す
     * @param comment
     */
    init(comment: formattedComment) {
        if (comment.content.startsWith("/")) {
            let scripts = this.parse(comment);
            arrayPush(this.scripts, comment.vpos, scripts);
            for (const item of scripts) {
                if (!item)continue;
                //this.exec(item);
            }
        }
        this.last_chat = comment;
    }

    /**
     * vpos時点の処理を実行
     * 場合によってはロルバ
     * @param vpos
     */
    run(vpos: number) {
        if (this.last_vpos < vpos) {
            for (let i = this.last_vpos; i <= vpos; i++) {
                if (this.scripts[i]) {
                    for (let j in this.scripts[i]) {
                        this.exec(this.scripts[i][j]);
                    }
                    this.rollback[i] = {
                        functions: JSON.parse(JSON.stringify(this.functions)),
                        timeline: JSON.parse(JSON.stringify(this.timeline)),
                        variable: JSON.parse(JSON.stringify(this.variable)),
                    }
                }
            }
        } else if (this.last_vpos > vpos) {
            for (let i = vpos; i >= 0; i--) {
                if (this.rollback[i]) {
                    this.functions = JSON.parse(JSON.stringify(this.rollback[i].functions));
                    this.timeline = JSON.parse(JSON.stringify(this.rollback[i].timeline));
                    this.variable = JSON.parse(JSON.stringify(this.rollback[i].variable));
                    break;
                }
            }
        }
    }

    /**
     * 関数実行
     * @param script
     * @param root
     */
    exec(script: any, root = false) {
        if (!script)return
        switch (script.type) {
            case "ExpressionStatement":
                this.exec(script.expression);
                break;
            case "AssignmentExpression":
                switch (script.operator) {
                    case "=":
                        let left = this.exec(script.left), right = this.exec(script.right);
                        if (typeof left === "string") {
                            this.variable[left] = right;
                        } else {
                            left = right;
                        }
                        break;
                }
                break;
            case "BinaryExpression":
                switch (script.operator) {
                    case "+":
                        let left = this.exec(script.left), right = this.exec(script.right);

                        return left + right;
                }
                break;
            case "CallExpression":
                switch (this.exec(script.callee)) {
                    case "def_kari":
                        
                }
                console.info("name:", this.exec(script.callee), "args:", script.arguments);
                break;
            case "IfStatement":
                console.log(script);
                break;
            case "Identifier":
                return script.name;
            case "Literal":
                return unQuote(script.value);
            case "MemberExpression":
                let left = this.exec(script.object), right = this.exec(script.property);
                if (typeof left === "string") {
                    if (left.match(/^[\d]+$/)&&right==="times"){
                        return {
                            type:"loop",
                            count:left
                        }
                    }
                    return this.variable[left][right];
                }
                return left[right];
            default:
                console.log("unknown:",script);
        }
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
        return tmp;
    }

    /**
     * 文字列をスクリプトとしてパース
     * @param string
     * @param root
     */
    parseLine(string: string, root: boolean = false) {
        string = string.trim();
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
        if (string.match(/^(true|false|[\d.]+|0x[\da-fA-F]+)$/) || isString(string)) {
            if (root) return {type: "ExpressionStatement", expression: this.parseLine(string)};
            return {
                type: "Literal",
                value: string
            }
        } else if (string.match(/^[a-zA-Z\d_@$]+$/)) {
            if (root) return {type: "ExpressionStatement", expression: this.parseLine(string)};
            return {
                type: "Identifier",
                name: string
            }
        } else if (string.match(/^[a-zA-Z\d_@$]+((\[([a-zA-Z\d_@$]+|["'].+["'])])|\.[a-zA-Z\d_@$]+)+$/)) {
            if (root) return {type: "ExpressionStatement", expression: this.parseLine(string)};
            if (string.match(/^[a-zA-Z\d_@$]+((\[([a-zA-Z\d_@$]+|["'].+["'])])|\.[a-zA-Z\d_@$]+)*\.[a-zA-Z\d_@$]+$/)) {
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
        let deps = 0, char = null;
        for (let i in str) {
            let value = str[i], left = leftArr.join("").trim(), next_value = str[Number(i) + 1],
                last_value = str[Number(i) - 1], right_value = string.slice(Number(i) + 1);
            if (value === '"' || value === "'") {
                if (last_value !== "\\") {
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
            if (deps===0&&char===null) {
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
                if (value.match(/[*\/]/)) {
                    if (root) return {type: "ExpressionStatement", expression: this.parseLine(string)};
                    return {
                        type: "BinaryExpression",
                        left: this.parseLine(left),
                        operator: value,
                        right: this.parseLine(right_value)
                    }
                }
            }
            leftArr.push(value);
        }
        leftArr = [];
        for (let i in str){
            let value = str[i], left = leftArr.join("").trim(), next_value = str[Number(i) + 1],
                last_value = str[Number(i) - 1], right_value = string.slice(Number(i) + 1);
            if (value.match(/[+\-<>]/)) {
                if (root) return {type: "ExpressionStatement", expression: this.parseLine(string)};
                return {
                    type: "BinaryExpression",
                    left: this.parseLine(left),
                    operator: value,
                    right: this.parseLine(right_value)
                }
            } else if (value === "=" && left.match(/^\w+:$/)) {
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
            } else if (value === "[" && left === ""){
                if (string.match(/]\[/)){
                    return {
                        type: "MemberExpression",
                        object: this.parseLine(string.slice(0, string.lastIndexOf("["))),
                        property: this.parseLine(string.slice(string.lastIndexOf("[") + 1, -1))
                    }
                }
                let elements = [],items = splitWithDeps(string.slice(1,-1),/,/);
                for (let item of items){
                    elements.push(this.parseLine(item));
                }
                return {
                    type: "ArrayExpression",
                    elements: elements
                }
            }else if (value === "(") {
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
        //console.log(string);
    }
}

export default NiwangoParser;