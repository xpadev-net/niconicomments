class NiconiComments {
    /**
     * NiconiComments Constructor
     * @param {HTMLCanvasElement} canvas - 描画対象のキャンバス
     * @param {[]} data - 描画用のコメント
     * @param {boolean} useLegacy - defontにsans-serifを適用するか(trueでニコニコ公式に準拠)
     * @param {boolean} formatted - dataが独自フォーマットに変換されているか
     */
    constructor(canvas, data, useLegacy=false, formatted=false) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.context.strokeStyle = "rgba(0,0,0,0.7)";
        this.context.textAlign = "left";
        this.context.textBaseline = "top";
        this.context.lineWidth = "6";
        this.commentYOffset = 0.1;
        this.commentYMarginTop = 0.2;
        this.commentYMarginBottom = 0.1;
        if (formatted) {
            this.data=data;
        }else{
            this.data = this.parseData(data);
        }
        this.timeline = {};
        this.collision_right = {};
        this.collision_left = {};
        this.collision_ue = {};
        this.collision_shita = {};
        this.useLegacy=useLegacy;
        this.preRendering();
    }

    /**
     * ニコニコが吐き出したデータを処理しやすいように変換する
     * @param {[]} data - ニコニコが吐き出したコメントデータ
     * @returns {*[]} - 独自フォーマットのコメントデータ
     */
    parseData(data) {
        let data_ = [];
        for (let i = 0; i < data.length; i++) {
            for (let key in data[i]) {
                let value = data[i][key];
                if (key === "chat") {
                    let tmpParam = {
                        "id": value["no"],
                        "vpos": value["vpos"],
                        "content": value["content"],
                        "date": value["date"],
                        "date_usec": value["date_usec"],
                        "thread": value["thread"]
                    };
                    if (value["mail"]) {
                        tmpParam["mail"] = value["mail"].split(" ");
                    } else {
                        tmpParam["mail"] = [];
                    }
                    data_.push(tmpParam);
                }
            }
        }
        data_.sort((a, b) => {
            if (a.vpos < b.vpos) return -1;
            if (a.vpos > b.vpos) return 1;
            if (a.date < b.date) return -1;
            if (a.date > b.date) return 1;
            if (a.date_usec < b.date_usec) return -1;
            if (a.date_usec > b.date_usec) return 1;
            return 0;
        });
        return data_;
    }

    /**
     * 事前に当たり判定を考慮してコメントの描画場所を決定する
     */
    preRendering() {
        this.getFont();
        this.getCommentSize();
        this.getCommentPos();
    }

    /**
     * コマンドをもとに各コメントに適用するフォントを決定する
     */
    getFont() {
        for (let i in this.data) {
            let comment = this.data[i];
            let command = this.parseCommand(comment.mail);
            this.data[i].loc = command.loc;
            this.data[i].size = command.size;
            this.data[i].fontSize = command.fontSize;
            this.data[i].font = command.font;
            this.data[i].color = command.color;
            this.data[i].full = command.full;
            this.data[i].ender = command.ender;
        }
    }

    /**
     * コメントの描画サイズを計算する
     */
    getCommentSize() {
        let tmpData = groupBy(this.data, "font", "fontSize");
        for (let i in tmpData) {
            for (let j in tmpData[i]) {
                this.context.font = parseFont(i, j);
                for (let k in tmpData[i][j]) {
                    let comment = tmpData[i][j][k];
                    let measure = this.measureText(comment);
                    this.data[comment.index].height = measure.height;
                    this.data[comment.index].width = measure.width;
                    this.data[comment.index].width_max = measure.width_max;
                    this.data[comment.index].width_min = measure.width_min;
                    if (measure.resized){
                        this.data[comment.index].fontSize = measure.fontSize;
                        this.context.font = parseFont(i, j);
                    }
                }
            }
        }
    }

    /**
     * 計算された描画サイズをもとに各コメントの配置位置を決定する
     */
    getCommentPos() {
        let data = this.data;
        for (let i in data) {
            let comment = data[i];
            for (let j = 0; j < 500; j++) {
                if (!this.timeline[comment.vpos + j]) {
                    this.timeline[comment.vpos + j] = [];
                }
                if (!this.collision_right[comment.vpos + j]) {
                    this.collision_right[comment.vpos + j] = [];
                }
                if (!this.collision_left[comment.vpos + j]) {
                    this.collision_left[comment.vpos + j] = [];
                }
                if (!this.collision_ue[comment.vpos + j]) {
                    this.collision_ue[comment.vpos + j] = [];
                }
                if (!this.collision_shita[comment.vpos + j]) {
                    this.collision_shita[comment.vpos + j] = [];
                }
            }
            if (comment.loc === "naka") {
                comment.vpos -= 70;
                this.data[i].vpos -= 70;
                let posY = 0, is_break = false, is_change = true, count = 0;
                while (is_change && count < 10) {
                    is_change = false;
                    count++;
                    for (let j = 0; j < 500; j++) {
                        let vpos = comment.vpos + j;
                        let left_pos = 1920 - ((1920 + comment.width_max) * j / 500);
                        if (left_pos + comment.width_max >= 1880) {
                            for (let k in this.collision_right[vpos]) {
                                let l = this.collision_right[vpos][k];
                                if ((posY < data[l].posY + data[l].height && posY + comment.height > data[l].posY) && data[l].thread === comment.thread) {
                                    if (data[l].posY + data[l].height > posY) {
                                        posY = data[l].posY + data[l].height;
                                        is_change = true;
                                    }
                                    if (posY + comment.height > 1080) {
                                        if (1080 < comment.height) {
                                            posY = 0;
                                        } else {
                                            posY = Math.floor(Math.random() * (1080 - comment.height));
                                        }
                                        is_break = true;
                                        break;
                                    }
                                }
                            }
                            if (is_break) {
                                break;
                            }
                        }
                        if (left_pos <= 40 && is_break === false) {
                            for (let k in this.collision_left[vpos]) {
                                let l = this.collision_left[vpos][k];
                                if ((posY < data[l].posY + data[l].height && posY + comment.height > data[l].posY) && data[l].thread === comment.thread) {
                                    if (data[l].posY + data[l].height > posY) {
                                        posY = data[l].posY + data[l].height;
                                        is_change = true;
                                    }
                                    if (posY + comment.height > 1080) {
                                        if (1080 < comment.height) {
                                            posY = 0;
                                        } else {
                                            posY = Math.random() * (1080 - comment.height);
                                        }
                                        is_break = true;
                                        break;
                                    }
                                }
                            }
                            if (is_break) {
                                break;
                            }
                        }
                        if (is_break) {
                            break;
                        }
                    }
                }
                for (let j = 0; j < 500; j++) {
                    let vpos = comment.vpos + j;
                    let left_pos = 1920 - ((1920 + comment.width_max) * j / 500);
                    arrayPush(this.timeline, vpos, i);
                    if (left_pos + comment.width_max >= 1880) {
                        arrayPush(this.collision_right, vpos, i);
                    }
                    if (left_pos <= 40) {
                        arrayPush(this.collision_left, vpos, i);
                    }
                }
                this.data[i].posY = posY;
            } else {
                let posY = 0, is_break = false, is_change = true, count = 0, collision;
                if (comment.loc === "ue") {
                    collision = this.collision_ue;
                } else if (comment.loc === "shita") {
                    collision = this.collision_shita;
                }
                while (is_change && count < 10) {
                    is_change = false;
                    count++;
                    for (let j = 0; j < 300; j++) {
                        let vpos = comment.vpos + j;
                        for (let k in collision[vpos]) {
                            let l = collision[vpos][k];
                            if ((posY < data[l].posY + data[l].height && posY + comment.height > data[l].posY) && data[l].thread === comment.thread) {
                                if (data[l].posY + data[l].height > posY) {
                                    posY = data[l].posY + data[l].height;
                                    is_change = true;
                                }
                                if (posY + comment.height > 1080) {
                                    if (1000 <= comment.height) {
                                        posY = 0;
                                    } else {
                                        posY = Math.floor(Math.random() * (1080 - comment.height));
                                    }
                                    is_break = true;
                                    break;
                                }
                            }
                        }
                        if (is_break) {
                            break;
                        }
                    }
                }
                for (let j = 0; j < 300; j++) {
                    let vpos = comment.vpos + j;
                    arrayPush(this.timeline, vpos, i);
                    if (comment.loc === "ue"){
                        arrayPush(this.collision_ue, vpos, i);
                    } else {
                        arrayPush(this.collision_shita, vpos, i);
                    }
                }
                this.data[i].posY = posY;
            }
        }
    }

    /**
     * context.measureTextの複数行対応版
     * 画面外にはみ出すコメントの縮小も行う
     * @param comment - 独自フォーマットのコメントデータ
     * @returns {{resized: boolean, width: number, width_max: number, fontSize: number, width_min: number, height: number}} - 描画サイズとリサイズの情報
     */
    measureText(comment) {
        let msg = comment.content;
        if (!comment.defaultFontSize){
            comment.defaultFontSize=comment.fontSize;
        }

        let width, width_max, width_min, height, width_arr = [], lines = msg.split("\n");

        for (let i = 0; i < lines.length; i++) {
            let measure = this.context.measureText(lines[i]);
            width_arr.push(measure.width);
        }
        width = width_arr.reduce((p, c) => p + c, 0) / width_arr.length;
        width_max = Math.max(...width_arr);
        width_min = Math.min(...width_arr);
        height = comment.fontSize*(this.commentYMarginTop + this.commentYMarginBottom+1) * lines.length;
        if (height > 1080&&comment.defaultFontSize*0.6<comment.fontSize&&comment.loc === "naka"){
            comment.fontSize-=1;
            comment.resized = true;
            this.context.font=parseFont(comment.font,comment.fontSize);
            return this.measureText(comment);
        }else if(comment.loc !== "naka"&&(lines.length<3||comment.ender)){
            if (comment.full&&width>1920){
                comment.fontSize-=1;
                comment.resized = true;
                this.context.font=parseFont(comment.font,comment.fontSize);
                return this.measureText(comment);
            }else if (!comment.full&&width>1440){
                comment.fontSize-=1;
                comment.resized = true;
                this.context.font=parseFont(comment.font,comment.fontSize);
                return this.measureText(comment);
            }
        }
        return {"width": width, "width_max": width_max, "width_min": width_min, "height": height, "resized":comment.resized, "fontSize": comment.fontSize};
    }

    /**
     * コマンドをもとに所定の位置にコメントを表示する
     * @param comment - 独自フォーマットのコメントデータ
     * @param {number} vpos - 動画の現在位置の100倍 ニコニコから吐き出されるコメントの位置情報は主にこれ
     */
    drawText(comment, vpos) {
        if (comment.loc === "naka") {
            let posX = 1920 - ((1920 + comment.width_max) * (vpos - comment.vpos) / 500);
            let lines = comment.content.split("\n");
            for (let i in lines) {
                let line = lines[i];
                this.context.strokeText(line, posX, comment.posY + (i * comment.fontSize) + this.commentYOffset * comment.fontSize+this.commentYMarginTop* comment.fontSize);
                this.context.fillText(line, posX, comment.posY + (i * comment.fontSize) + this.commentYOffset * comment.fontSize+this.commentYMarginTop* comment.fontSize);
            }
        } else if (comment.loc === "ue"){
            let posX = (1920 - comment.width_max) / 2;
            let lines = comment.content.split("\n");
            for (let i in lines) {
                let line = lines[i];
                this.context.strokeText(line, posX, comment.posY + (i * comment.fontSize) + this.commentYOffset * comment.fontSize+this.commentYMarginTop* comment.fontSize);
                this.context.fillText(line, posX, comment.posY + (i * comment.fontSize) + this.commentYOffset * comment.fontSize+this.commentYMarginTop* comment.fontSize);
            }
        } else if (comment.loc === "shita"){
            let posX = (1920 - comment.width_max) / 2;
            let lines = comment.content.split("\n");
            for (let i in lines) {
                let line = lines[i];
                let posY = 1080 - (comment.posY + comment.height) + (i * comment.fontSize) + (this.commentYOffset * comment.fontSize) + this.commentYMarginTop* comment.fontSize;
                this.context.strokeText(line, posX, posY);
                this.context.fillText(line, posX, posY);
            }
        }
    }

    /**
     * コメントに含まれるコマンドを解釈する
     * @param {[]} metadata - コメントのmail(コマンド)を空白で分割した配列
     * @returns {{loc: string, size: string, color: string, fontSize: number, ender: boolean, font: string, full: boolean}}
     */
    parseCommand(metadata) {
        let loc = "naka", size = "medium", fontSize = 70, color = "#FFFFFF", font = 'defont', full = false, ender = false;
        for (let i in metadata) {
            let command = metadata[i];
            if (loc === "naka") {
                switch (command) {
                    case "ue":
                        loc = "ue";
                        break;
                    case "shita":
                        loc = "shita";
                        break;
                }
            }
            if (size === "medium") {
                switch (command) {
                    case "big":
                        size = "big";
                        fontSize = 100;
                        break;
                    case "small":
                        size = "small";
                        fontSize = 50;
                        break;
                }
            }
            if (color === "#FFFFFF") {
                switch (command) {
                    case "red":
                        color = "#FF0000";
                        break;
                    case "pink":
                        color = "#FF8080";
                        break;
                    case "orange":
                        color = "#FFC000";
                        break;
                    case "yellow":
                        color = "#FFFF00";
                        break;
                    case "green":
                        color = "#00FF00";
                        break;
                    case "cyan":
                        color = "#00FFFF";
                        break;
                    case "blue":
                        color = "#0000FF";
                        break;
                    case "purple":
                        color = "#C000FF";
                        break;
                    case "black":
                        color = "#000000";
                        break;
                    case "white2":
                    case "niconicowhite":
                        color = "#CCCC99";
                        break;
                    case "red2":
                    case "truered":
                        color = "#CC0033";
                        break;
                    case "pink2":
                        color = "#FF33CC";
                        break;
                    case "orange2":
                    case "passionorange":
                        color = "#FF6600";
                        break;
                    case "yellow2":
                    case "madyellow":
                        color = "#999900";
                        break;
                    case "green2":
                    case "elementalgreen":
                        color = "#00CC66";
                        break;
                    case "cyan2":
                        color = "#00CCCC";
                        break;
                    case "blue2":
                    case "marineblue":
                        color = "#3399FF";
                        break;
                    case "purple2":
                    case "nobleviolet":
                        color = "#6633CC";
                        break;
                    case "black2":
                        color = "#666666";
                        break;
                    default:
                        if (command.match(/#[0-9a-zA-Z]{3,6}/)) {
                            color = command;
                        }
                }
            }
            if (font === 'defont') {
                switch (command) {
                    case "gothic":
                        font = "gothic";
                        break;
                    case "mincho":
                        font = "mincho";
                        break;
                }
            }
            switch (command) {
                case "full":
                    full = true;
                    break;
                case "ender":
                    ender = true;
                    break;
            }
        }
        return {loc, size, fontSize, color, font, full, ender};
    }

    /**
     * キャンバスを描画する
     * @param vpos - 動画の現在位置の100倍 ニコニコから吐き出されるコメントの位置情報は主にこれ
     */
    drawCanvas(vpos) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let index in this.timeline[vpos]) {
            let comment = this.data[this.timeline[vpos][index]];
            this.context.font = parseFont(comment.font, comment.fontSize);
            this.context.fillStyle = comment.color;
            this.drawText(comment, vpos);
        }
    }

    /**
     * キャンバスを消去する
     */
    clear(){
        this.context.clearRect(0, 0, 1920, 1080);
    }
}

/**
 * 配列を複数のキーでグループ化する
 * @param {{}} array
 * @param {string} key
 * @param {string} key2
 * @returns {{}}
 */
const groupBy = (array, key, key2) => {
    let data = {};
    for (let i in array) {
        if (!data[array[i][key]]) {
            data[array[i][key]] = {};
        }
        if (!data[array[i][key]][array[i][key2]]) {
            data[array[i][key]][array[i][key2]] = [];
        }
        array[i].index = i;
        data[array[i][key]][array[i][key2]].push(array[i]);
    }
    return data;
}
/**
 * フォント名とサイズをもとにcontextで使えるフォントを生成する
 * @param {string} font
 * @param {number} size
 * @returns {string}
 */
const parseFont = (font, size) => {
    switch (font) {
        case "gothic":
            return `normal 400 ${size}px "游ゴシック体", "游ゴシック", "Yu Gothic", YuGothic, yugothic, YuGo-Medium`;
        case "mincho":
            return `normal 400 ${size}px "游明朝体", "游明朝", "Yu Mincho", YuMincho, yumincho, YuMin-Medium`;
        default:
            if (this.useLegacy){
                return `normal 600 ${size}px Arial, "ＭＳ Ｐゴシック", "MS PGothic", MSPGothic, MS-PGothic`;
            }else{
                return `normal 600 ${size}px sans-serif, Arial, "ＭＳ Ｐゴシック", "MS PGothic", MSPGothic, MS-PGothic`;
            }
    }
}
/**
 * phpのarray_push的なあれ
 * @param array
 * @param {string} key
 * @param push
 */
const arrayPush = (array, key, push) => {
    if (!array) {
        array = {};
    }
    if (!array[key]) {
        array[key] = [];
    }
    array[key].push(push);
}
module.exports = NiconiComments;