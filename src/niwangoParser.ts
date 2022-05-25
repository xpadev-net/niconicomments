import {parseFunc, parseBrackets, isString, splitWithDeps, arrayPush, unQuote, getByName} from "./Utils";
import {parse} from  "./niwango";

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
    private locals: any;
    private that: any;

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

        this.locals = {
            window: {},
            document: {}
        };

        this.that = Object.create(null);

    }

    //todo: 使わなかったら消す
    eval(code) {
        const params = [], args = [];

        for (let param in this.locals) {
            if (this.locals.hasOwnProperty(param)) {
                args.push(this.locals[param]);
                params.push(param);
            }
        }

        let context = Array.prototype.concat.call(this.that, params, code);
        const sandbox = new (Function.prototype.bind.apply(Function, context));
        context = Array.prototype.concat.call(this.that, args);

        return Function.prototype.bind.apply(sandbox, context);
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
            this.exec(scripts);//todo: 実装完了したら消す
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
                    this.last_vpos = i;
                    for (let j in this.scripts[i]) {
                        this.exec(this.scripts[i][j]);
                    }
                    this.rollback[i] = {
                        functions: JSON.parse(JSON.stringify(this.functions)),
                        timeline: JSON.parse(JSON.stringify(this.timeline)),
                        scripts: JSON.parse(JSON.stringify(this.scripts)),
                        variable: JSON.parse(JSON.stringify(this.variable)),
                    }
                }
            }
        } else if (this.last_vpos > vpos) {
            for (let i = vpos; i >= 0; i--) {
                if (this.rollback[i]) {
                    this.functions = JSON.parse(JSON.stringify(this.rollback[i].functions));
                    this.timeline = JSON.parse(JSON.stringify(this.rollback[i].timeline));
                    this.scripts = JSON.parse(JSON.stringify(this.rollback[i].scripts));
                    this.variable = JSON.parse(JSON.stringify(this.rollback[i].variable));
                    break;
                }
            }
        }
    }

    /**
     * 関数実行
     * @param script
     * @param options
     */
    exec(script: any, options = {root: false, argument: {}}) {
        try {
            if (!script) return
            switch (script.type) {
                case "ExpressionStatement":
                    this.exec(script.expression, options);
                    break;
                case "AssignmentExpression":
                    switch (script.operator) {
                        case "=":
                            let left = this.exec(script.left, options), right = this.exec(script.right, options);
                            if (typeof left === "string") {
                                this.variable[left] = right;
                            } else {
                                left = right;
                            }
                            break;
                    }
                    break;
                case "ArrayExpression":
                    let array = [];
                    for (let item of script.elements) {
                        array.push(this.exec(item, options));
                    }
                    return array;
                case "ArrowFunctionExpression":
                    return this.exec(script.body, options);
                case "BinaryExpression":
                    let left_var;
                    switch (script.operator) {
                        case ">=":
                            return this.exec(script.left, options) >= this.exec(script.right, options);
                        case "<=":
                            return this.exec(script.left, options) <= this.exec(script.right, options);
                        case ">":
                            return this.exec(script.left, options) > this.exec(script.right, options);
                        case "<":
                            return this.exec(script.left, options) < this.exec(script.right, options);
                        case "!=":
                            return this.exec(script.left, options) != this.exec(script.right, options);
                        case "+=":
                            left_var = this.exec(script.left, options);
                            if (typeof left_var === "string") {
                                return this.variable[left_var] += this.exec(script.right, options);
                            } else {
                                return left_var += this.exec(script.right, options);
                            }
                        case "-=":
                            left_var = this.exec(script.left, options);
                            if (typeof left_var === "string") {
                                return this.variable[left_var] -= this.exec(script.right, options);
                            } else {
                                return left_var -= this.exec(script.right, options);
                            }
                        case "+":
                            return this.exec(script.left, options) + this.exec(script.right, options);
                        case "-":
                            return this.exec(script.left, options) - this.exec(script.right, options);
                        default:
                            console.warn("unknown binary expression:", script, options);
                    }
                    break;
                case "BlockStatement":
                    for (let item of script.body) {
                        this.exec(item, options);
                    }
                    break;
                case "CallExpression":
                    let callee = this.exec(script.callee, options),args;
                    if (callee.type !== "Identifier") {
                        console.warn("invalid identifier:", script, options)
                        break;
                    }
                    switch (callee.raw) {
                        case "def_kari":
                            this.functions[this.exec(script.arguments[0], options).raw] = script.arguments[1];
                            console.info("define:", this.exec(script.arguments[0], options).raw);
                            break;
                        case "drawText":
                        case "dt":
                            args = this.execArg({
                                text: null,
                                x: null,
                                y: null,
                                z: null,
                                size: null,
                                pos: null,
                                color: null,
                                bold: null,
                                visible: null,
                                filter: null,
                                alpha: null,
                                mover: null
                            }, script.arguments, options);
                            console.log("[drawText] text:", args, script.arguments);
                            let DrawText = {
                                type: "DrawText",
                                ...args
                            }
                            arrayPush(this.timeline,this.last_vpos,DrawText);
                            return DrawText;
                        case "drawShape":
                            args = this.execArg({
                                x: null,
                                y: null,
                                z: null,
                                shape: null,
                                width: null,
                                height: null,
                                color: null,
                                visible: null,
                                pos: null,
                                mask: null,
                                commentmask: null,
                                alpha: null,
                                rotation: null,
                                mover: null
                            }, script.arguments, options);
                            console.log("[DrawShape] shape:", args, script.arguments);
                            let DrawShape = {
                                type: "DrawShape",
                                ...args
                            }
                            arrayPush(this.timeline,this.last_vpos,DrawShape);
                            return DrawShape;
                        case "rand":
                            if (script.arguments[0].raw){
                                let num = 0,str = script.arguments[0].raw;
                                for (let i = 0; i < str.length; ++i) {
                                    num+=str.charCodeAt(i);
                                }
                                return num;
                            }
                            return Math.round(Math.random()*100000);
                        case "timer":
                            console.info("called timer:", script);
                            arrayPush(this.scripts, this.last_vpos + getByName(script.arguments, "timer") * 100, getByName(script.arguments, "default0"));
                            break;
                        case "ZEN::loop":
                            console.info("ZEN::loop:", script,callee.count);
                            for (let i = 0; i < callee.count; i++) {
                                this.exec(script.arguments[0], {argument: {...options.argument,tmp0:i}, root: false});
                            }
                            break;
                        case "@":
                            //todo: @関数実装(引数にtmpを代入)
                            break;
                        default:
                            if (this.functions[callee.raw]) {
                                console.info("called func:", callee, "func:", this.functions[callee.raw], "args:", script.arguments);
                                this.exec(this.functions[callee], {...options, argument: script.arguments});
                            } else {
                                console.warn("unknown func:", this.exec(script.callee), script, "funcs:", this.functions);
                            }
                    }
                    break;
                case "EmptyStatement":
                    return;
                case "IfStatement":
                    let test = this.exec(script.test, options);
                    console.log("ifstate:", script.test, test, script, options);
                    break;
                case "Identifier":
                    let arg = getByName(options.argument, script.name);
                    if (script.name.match(/^\$|@/)) console.info("parse args:", options.argument, script.name, arg)
                    if (arg !== false) {
                        return this.exec(arg, options);
                    }
                    return {
                        type: "Identifier",
                        raw: script.name
                    };
                case "Literal":
                    return {
                        type: "Literal",
                        raw: unQuote(script.value)
                    };
                case "MemberExpression":
                    let left = this.exec(script.object, options), right = this.exec(script.property, options);
                    if (left?.type.match(/Literal|Identifier/))left = left.raw;
                    if (right?.type.match(/Literal|Identifier/))right = right.raw;
                    if (typeof left !== "object") {
                        if (typeof left === "number" && right === "times") {
                            return {
                                type: "Identifier",
                                raw: "ZEN::loop",
                                count: left
                            }
                        } else if (right === "indexOf") {
                            return {
                                type: "Identifier",
                                raw: "indexOf",
                                target: this.exec(left, options)
                            }
                        }
                        if (!this.variable[left]) {
                            console.warn("undefined left:", left, right, script);
                            break;
                        }
                        return this.variable[left][right];
                    }
                    return left[right];
                case "Program":
                    for (let item of script.body){
                        this.exec(item);
                    }
                    break;
                case "UpdateExpression":
                    console.warn("unknown update expression:", script, options);
                    break;
                case "VariableDeclaration":
                    for (let item of script.declarations) {
                        let left = this.exec(item.id, options), right = this.exec(item.init, options);
                        if (typeof left === "string") {
                            this.variable[left] = right;
                        } else {
                            left = right;
                        }
                        console.info("init var:", left, right, item);
                    }
                    break;
                default:
                    console.warn("unknown:", script);
            }
        } catch (e) {
            console.error(e.name + ": " + e.message, script, this);
        }
    }

    /**
     * 名前付き・無名引数をテンプレートに割り当てる
     * @param template
     * @param args
     * @param options
     * @return any
     */
    execArg(template: any, args: any, options: any) {
        for (let key in args) {
            if (template[args[key].id] === null) {
                template[args[key].id] = this.exec(args[key], options);
            }
        }
        for (let key in args) {
            if (args[key].id.match(/^default\d+$/)) {
                for (let key2 in template) {
                    if (template[key2] === null) {
                        template[key2] = this.exec(args[key], options);
                        break;
                    }
                }
            }
        }
        return template;
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
        let ast = parse(string);
        //console.log(ast);
        return ast;
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
            return {
                type: "BlockStatement",
                body: result
            };
        }
        if (string.startsWith("\\")) {
            string = string.slice(1);
        }
        let str: string[] = Array.from(string), leftArr = [];
        if (string.match(/^(true|false|-?[\d.]+|0x[\da-fA-F]+)$/) || isString(string)) {
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
            if (deps === 0 && char === null) {
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
                    if (left==="") {
                        console.warn("unknown script:", string);
                        return {
                            type: "EmptyStatement",
                            raw: string
                        }
                    }
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
        for (let i in str) {
            let value = str[i], left = leftArr.join("").trim(), next_value = str[Number(i) + 1],
                last_value = str[Number(i) - 1], right_value = string.slice(Number(i) + 1);
            if (value.match(/[+\-<>]/)) {
                if (root) return {type: "ExpressionStatement", expression: this.parseLine(string)};
                if (next_value && next_value.match(/[+\-]/) && value == next_value) continue;
                if (last_value && last_value.match(/[+\-]/) && value == last_value) {
                    return {
                        type: "UpdateExpression",
                        argument: this.parseLine(left || right_value),
                        operator: last_value + value,
                        prefix: left === "",
                    }
                }
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
            } else if (value === "[" && left === "") {
                if (string.match(/]\[/)) {
                    return {
                        type: "MemberExpression",
                        object: this.parseLine(string.slice(0, string.lastIndexOf("["))),
                        property: this.parseLine(string.slice(string.lastIndexOf("[") + 1, -1))
                    }
                }
                let elements = [], items = splitWithDeps(string.slice(1, -1), /,/);
                for (let item of items) {
                    elements.push(this.parseLine(item));
                }
                return {
                    type: "ArrayExpression",
                    elements: elements
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
                                id: i
                            });
                        } else {
                            args.push({...this.parseLine(value), id: i});
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
        if (string!=="")console.warn("unknown script: ",string);
        return {
            type: "EmptyStatement",
            raw: string
        }
    }
}

export default NiwangoParser;