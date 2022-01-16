class Niwango {
    constructor() {
        this.isWide=false;
    }
    _screenWidth(){
        if (this.isWide){
            return 512;
        }
        return 640;
    }
    _screenHeight(){
        return 384;
    }
    sd2fhd(pixel){
        return pixel*1080/384;
    }
}
export default Niwango;