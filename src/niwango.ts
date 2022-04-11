class Niwango {
    private isWide: boolean;
    constructor() {
        this.isWide=false;
    }
    _screenWidth(){
        if (this.isWide){
            return 640;
        }
        return 512;
    }
    _screenHeight(){
        return 384;
    }
    sd2fhd(pixel){
        return pixel*1080/384;
    }
}
export default Niwango;