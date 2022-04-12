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

class NiwangoParser{
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
     */
    parse(arg1){
        let string;
        if (typeof arg1 == "object"){
            string = arg1.content.substring(1);
        }else{
            string = arg1;
        }
        let scripts = splitWithDeps(string,/;/),tmp=[];
        for (let i in scripts){
            let result = this.parseLine(scripts[i], true);
            console.log(result,scripts[i]);
            if (result){
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
    parseLine(string: string,root:boolean=false){
        let str: string[] = Array.from(string),leftArr = [];
        if (string.match(/^(true|false|[0-9]+)$/)||isString(string)){
            if (root)return {type: "ExpressionStatement",expression: this.parseLine(string)};
            return {
                type: "Literal",
                value: string
            }
        }else if(string.match(/^[a-zA-Z0-9_$]+$/)){
            if (root)return {type: "ExpressionStatement",expression: this.parseLine(string)};
            return {
                type: "Identifier",
                name: string
            }
        }else if(string.match(/^[a-zA-Z0-9_$]+((\[([a-zA-Z0-9_$]+|["'].+["'])])|\.[a-zA-Z0-9_$]+)+$/)){
            if (root)return {type: "ExpressionStatement",expression: this.parseLine(string)};
            if (string.match(/^[a-zA-Z0-9_$]+((\[([a-zA-Z0-9_$]+|["'].+["'])])|\.[a-zA-Z0-9_$]+)*\.[a-zA-Z0-9_$]+$/)){
                return {
                    type: "MemberExpression",
                    object: this.parseLine(string.slice(0,string.lastIndexOf("."))),
                    property: this.parseLine(string.slice(string.lastIndexOf(".")+1))
                }
            }
            return {
                type: "MemberExpression",
                object: this.parseLine(string.slice(0,string.lastIndexOf("["))),
                property: this.parseLine(string.slice(string.lastIndexOf("[")+1,-1))
            }
        }
        for (let i in str){
            let value = str[i], left = leftArr.join("").trim(), next_value = str[Number(i)+1], last_value = str[Number(i)-1], right_value = string.slice(Number(i)+1);
            if ((value+next_value).match(/==|!=|>=|<=/))continue;
            if ((last_value+value).match(/==|!=|>=|<=/)){
                if (root)return {type: "ExpressionStatement",expression: this.parseLine(string)};
                return {
                    type: "BinaryExpression",
                    left: this.parseLine(left.slice(0,-1)),
                    operator: last_value+value,
                    right: this.parseLine(right_value)
                }
            }
            if(value.match(/[+\-*\/%<>]/)){
                if (root)return {type: "ExpressionStatement",expression: this.parseLine(string)};
                return {
                    type: "BinaryExpression",
                    left: this.parseLine(left),
                    operator:  value,
                    right: this.parseLine(right_value)
                }
            }else if (value==="="&&left.match(/^[0-9a-zA-Z_]+:$/)){
                return {
                    type: "VariableDeclaration",
                    declarations: [{
                        type: "VariableDeclarator",
                        id: this.parseLine(left.slice(0,-1)),
                        init: this.parseLine(right_value)
                    }]
                }
            }else if (value==="="){
                if (root)return {type: "ExpressionStatement",expression: this.parseLine(string)};
                return {
                    type: "AssignmentExpression",
                    operator: value,
                    left: this.parseLine(left),
                    right: this.parseLine(right_value)
                }
            }else if(value==="("){
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
const parseFunc = (str,isScript=false) => {
    let arr = Array.from(str),deps=0,char=null;
    let func = [],arg = [];
    for (let i in arr){
        let value = arr[i];
        if (value === '"'||value==="'"){
            if (arr[Number(i)-1]!=="\\"){
                if (char){
                    char=null;
                }else{
                    char=value;
                }
            }
        }
        if (!char){
            if (value === "("){
                deps++;
            }else if(value===")"){
                deps--;
                if (deps===0){
                    arg.splice(0,1);
                    arr.splice(0,Number(i)+1);
                    return {func:func.join(""),arg:parseArg(arg.join(""),isScript),after:arr.join("")};
                }
            }
        }
        if (deps>0){
            arg.push(value);
        }else{
            func.push(value);
        }
    }

}
/**
 * 引数をパースする
 * @param input
 * @param isScript
 */
const parseArg = (input,isScript=false) => {
    let arr = Array.from(input),deps=0,char=null,tmp = [],arg = {},left="default";
    for (let i in arr){
        let value = arr[i];
        if (value === '"'||value==="'"){
            if (arr[Number(i)-1]!=="\\"){
                if (char){
                    char=null;
                }else{
                    char=value;
                }
            }
        }
        if (!char){
            if (value === "("||value==="["){
                deps++;
            }else if(value===")"||value==="]"){
                deps--;
            }
        }
        if (deps===0&&value===","){
            let _left = left, i = 0;
            if (left==="default"){
                left +=i;
            }
            while(arg[left]){
                left = _left+i;
                i++;
            }
            arg[left]=tmp.join("");
            left="default";
            tmp=[];
        }else if(deps===0&&value===":"&&(!isScript||(isScript&&tmp.join("").match(/^then|else|timer$/)))){
            left = tmp.join("");
            tmp=[];
        }else{
            tmp.push(value)
        }
    }
    if (tmp!==[]){
        let _left = left, i = 0;
        if (left==="default"){
            left +=i;
        }
        while(arg[left]){
            left = _left+i;
            i++;
        }
        arg[left]=tmp.join("");
    }
    return arg;
}
/**
 * クォートで囲われた文字列か判定
 */
const isString = (string:string) => {
    if (!(
        (string.startsWith('"')&&string.endsWith('"'))||
        (string.startsWith("'")&&string.endsWith("'"))||
        (string.startsWith("「")&&string.endsWith("」"))
    )){
        return false;
    }
    let str:string[] = Array.from(string.slice(1,-1)),quote = string.slice(0,1);
    for (const i in str) {
        if (str[i]===quote&&str[Number(i)-1]!=="\\"){
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
const splitWithDeps = (string: string,separator: RegExp) => {
    let arr = Array.from(string),deps=0,char=null;
    let res = [],tmp = [];
    for (let i in arr){
        let value = arr[i];
        if (value === '"'||value==="'"){
            if (arr[Number(i)-1]!=="\\"){
                if (char){
                    char=null;
                }else{
                    char=value;
                }
            }
        }
        if (!char){
            if (value === "("){
                deps++;
            }else if(value===")"){
                deps--;
            }
        }
        if (deps===0&&value.match(separator)){
            res.push(tmp.join(""));
            tmp=[];
        }else{
            tmp.push(value);
        }
    }
    if (tmp){
        res.push(tmp.join(""));
    }
    return res;
}
export default NiwangoParser;