class Niwango {
    constructor() {
        this.isWide=false;
    }
    _screenWidth(){
        if (this.isWide){
            return 512;
        }
        return 683;
    }
    _screenHeight(){
        return 384;
    }
    sd2fhd(pixel){
        return pixel*1080/384;
    }
}
const getArg = (str) => {
    let arr = Array.from(str),deps=0,char=null;
    let tmparr = [];
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
                    tmparr.splice(0,1);
                    return tmparr.join("");
                }
            }
        }
        if (deps>0){
            tmparr.push(value);
        }
    }

}
export default Niwango;