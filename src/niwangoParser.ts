class NiwangoParser{
    private timeline: any;
    private variable: any;
    private queue: any;
    constructor() {
        this.timeline = {};
        this.variable = {};
        this.queue = {};
    }
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
    parseLine(string,vpos){
        let str = Array.from(string),leftArr = [];
        for (let i in str){
            let value = str[i], left = leftArr.join("");
            if (value==="="&&left.match(/^[0-9a-zA-Z_]+$/)){
                return {type:"setVar",name:leftArr.join(""),value:string.substring(Number(i)+1),vpos:vpos}
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
                    case "def":
                    case "def_kari":
                        console.log(string)
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
                    default:
                        res = parseFunc(string);
                        if (res.after){
                            console.log(res.after);
                        }
                        return {type:left,arg:res.arg,vpos:vpos};
                }
            }
            leftArr.push(value);
        }
    }
}
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
const parseArg = (input,isScript=false) => {
    console.log(input);
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