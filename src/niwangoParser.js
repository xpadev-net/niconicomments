class NiwangoParser{
    constructor() {
        this.scripts = {};
        this.functions = ["drawShape","drawText","dt","commentTrigger","ctrig","if","timer","jump","jumpCancel","seek","addMarker","getMarker","sum","showResult","replace","rand","distance","screenWidth","screenHeight","addButton","playStartTime","BGM","playBGM","stopBGM","addAtPausePoint","addPostRoute","CM","playCM"];
        this.userFunc = {};
    }
    parse(script,vpos){
        if (!script.startsWith("/")){
            return false;
        }
        script = script.slice(1);

        for (let i = 0; i < 1; i++){
            let regexp = new RegExp("^("+this.functions.join("|")+")\\(");
            let match = script.match(regexp);
            if (match){
                let {func,arg,after} = parseFunc(script);
                if (func!==match[1]){
                    return false;
                }
                arg = parseArg(arg);
                switch (func){
                    case "timer":
                        this.parse(arg.default,vpos+Number(arg.timer)*100);
                        break;
                    default:
                        console.log(func,arg);
                }
                script=after;
                continue;
            }
            match = script.match(/^(def|def_kari)\(/);
            if (match){
                let {func,arg,after} = parseFunc(script);
                if (func!==match[1]){
                    return false;
                }
                arg = parseArg(arg,true);
                this.userFunc[arg.default.replace(/^(?:"|')(.*)(?:"|')$/,"$1")] = arg.default0;

                console.log(this.userFunc)
                script=after;
                continue;
            }
            regexp = new RegExp("^("+this.userFunc.keys().join("|")+")\\(");
            match = script.match(regexp);
            if (match){

            }
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

const parseArg = (input,isScript=false) => {
    let arr = Array.from(input),deps=0,char=null;
    let tmp = [],arg = {},left="default";
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
            let _left = left, i = 0;
            while(arg[left]){
                left = _left+i;
                i++;
            }
            arg[left]=tmp.join("");
            left="default";
            tmp=[];
        }else if(deps===0&&value===":"&&!isScript){
            left = tmp.join("");
            tmp=[];
        }else{
            tmp.push(value)
        }
    }
    if (tmp!==[]){
        let _left = left, i = 0;
        while(arg[left]){
            left = _left+i;
            i++;
        }
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