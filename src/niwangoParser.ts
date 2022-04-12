class NiwangoParser{
    private timeline: any;
    private functions: any;
    private variable: any;
    private queue: any;
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

    /**
     * コメントデータを分割して投げる
     * @param arg1
     * @param arg2
     */
    parse(arg1,arg2=0){
        let string, vpos;
        if (typeof arg1 == "object"){
            string = arg1.content.substring(1);
            vpos = arg1.vpos;
        }else{
            string = arg1;
            vpos = arg2
        }
        let scripts = splitWithDeps(string,";"),tmp=[];
        for (let i in scripts){
            let result = this.parseLine(scripts[i],vpos);
            if (result){
                tmp.push(result);
            }
        }
        return tmp;
    }

    /**
     * 文字列をスクリプトとしてパース
     * @param string
     * @param vpos
     */
    parseLine(string,vpos){
        let str = Array.from(string),leftArr = [];
        for (let i in str){
            let value = str[i], left = leftArr.join("").trim();
            if (value==="="&&left.match(/^[0-9a-zA-Z_]+$/)){
                return {type:"setVar",name:leftArr.join(""),value:this.parseLine(string.substring(Number(i)+1),vpos),vpos:vpos}
            }else if (value==="="&&left.match(/^[0-9a-zA-Z_]+:$/)){
                return {type:"initLocalVar",name:leftArr.join("").slice(0,-1),value:string.substring(Number(i)+1),vpos:vpos}
            }else if(value==="("){
                let res;
                switch (left){
                    case "drawShape":
                    case "jumpCancel":
                    case "seek":
                    case "addMarker":
                    case "getMarker":
                    case "sum":
                    case "showResult":
                    case "replace":
                    case "rand":
                    case "distance":
                    case "screenWidth":
                    case "screenHeight":
                    case "addButton":
                    case "BGM":
                    case "playBGM":
                    case "stopBGM":
                    case "addAtPausePoint":
                    case "addPostRoute":
                    case "CM":
                    case "playCM":
                        res = parseFunc(string);
                        if (res.after){
                            console.log(res.after);
                        }
                        return {type:left,arg:res.arg,vpos:vpos};
                    case "drawText":
                    case "dt":
                        res = parseFunc(string);
                        if (res.after){
                            console.log(res.after);
                        }
                        if(res.arg.default0){
                            res.arg.text=res.arg.default0;
                        }
                        return {type:left,arg:res.arg,vpos:vpos};
                    case "commentTrigger":
                    case "ctrig":
                        res = parseFunc(string,true);
                        if (res.after){
                            console.log(res.after);
                        }
                        if (res.arg.default0){
                            res.arg.then = res.arg.default0;
                        }
                        res.arg.then=this.parse(res.arg.then,vpos);
                        return {type:left,arg:res.arg,vpos:vpos};
                    case "timer":
                        res = parseFunc(string,true);
                        if (res.after){
                            console.log(res.after);
                        }
                        if (res.arg.default0){
                            res.arg.then = res.arg.default0;
                        }
                        res.arg.then = this.parse(res.arg.then,vpos+=res.arg.timer*100);
                        return {type:left,arg:res.arg,vpos:vpos};
                    case "if":
                        res = parseFunc(string,true);
                        if (res.after){
                            console.log(res.after);
                        }
                        if (res.arg.default0){
                            res.arg.when = res.arg.default0;
                        }
                        res.arg.when=this.parse(res.arg.when,vpos);
                        return {type:left,arg:res.arg,vpos:vpos};
                    case "jump":
                        res = parseFunc(string);
                        if (res.after){
                            console.log(res.after);
                        }
                        if(res.arg.default0){
                            res.arg.id=res.arg.default0;
                        }
                        return {type:left,arg:res.arg,vpos:vpos};
                    case "def":
                    case "def_kari":
                        res = parseFunc(string,true);
                        if (res.after){
                            console.log(res.after);
                        }
                        return {type:left,arg:res.arg,vpos:vpos};
                    default:
                        if (left in Object.keys(this.functions)){
                            res = parseFunc(string);
                            if (res.after){
                                console.log(res.after);
                            }
                            return {type:left,arg:res.arg,vpos:vpos};
                        }
                }
            }
            leftArr.push(value);
        }
        return {type:"unknown",arg: leftArr.join(""), vpos:vpos}
    }

    /**
     * 計算式の処理とかstringへの変換とか
     * @param script
     */
    eval(script:string){
        let str = Array.from(script),leftArr = [];
        for(let i in str){
            let value = str[i];
            leftArr.push(value)
        }
        return leftArr.join("")
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
            console.log(tmp.join(""));
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
    console.log(arg)
    return arg;
}
/**
 * クォートを考慮して文字列を分割
 * @param string
 * @param separator
 */
const splitWithDeps = (string,separator) => {
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
        if (deps===0&&value===separator){
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