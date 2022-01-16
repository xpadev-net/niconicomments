class NiwangoParser{
    constructor() {
        this.scripts = {};
        this.functions = ["drawShape","drawText","dt","commentTrigger","ctrig","if","timer","jump","jumpCancel","seek","addMarker","getMarker","sum","showResult","replace","rand","distance","screenWidth","screenHeight","addButton","playStartTime","BGM","playBGM","stopBGM","addAtPausePoint","addPostRoute","CM","playCM"];
    }
    parse(script,vpos){
        if (!script.startsWith("/")){
            return false;
        }
        script = script.slice(1);

        let regexp = new RegExp("^("+this.functions.join("|")+")");
        let match = script.match(regexp);
        if (match){
            let {func,arg,after} = parseFunc(script);
            if (func!==match[1]){
                return false;
            }
            arg = parseArg(arg);
            let _uuid = uuid();
            this.scripts[_uuid]={
                script:match[1],
                start:vpos,
                options:arg
            }
            script=after;
        }
    }
}

const _ = (input,def) => {
  return input?input:def;
}

const uuid = () => {
    let chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split("");
    for (let i = 0, len = chars.length; i < len; i++) {
        switch (chars[i]) {
            case "x":
                chars[i] = Math.floor(Math.random() * 16).toString(16);
                break;
            case "y":
                chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
                break;
        }
    }
    return chars.join("");
}

const parseArg = (input) => {
    let arr = Array.from(input),deps=0,char=null;
    let tmp = [],arg = {},left="undefined";
    for (let i in arr){
        let value = arr[i];
        if (value === '"'||value==="'"){
            if (arr[i-1]!=="\\"){
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
            arg[left]=tmp.join("");
            left="undefined";
            tmp=[];
        }else if(deps===0&&value===":"){
            left = tmp.join("");
            tmp=[];
        }else{
            tmp.push(value)
        }
    }
    if (tmp!==[]){
        arg[left]=tmp.join("");
    }
    return arg;
}

const parseFunc = (str) => {
    let arr = Array.from(str),deps=0,char=null;
    let func = [],arg = [];
    for (let i in arr){
        let value = arr[i];
        if (value === '"'||value==="'"){
            if (arr[i-1]!=="\\"){
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
                    return {func:func.join(""),arg:arg.join(""),after:arr.join("")};
                }
            }
        }
        if (deps>0){
            arg.push(value);
        }else{
            func.push(value)
        }
    }

}
export default NiwangoParser;