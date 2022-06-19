type InitOptions = {
    useLegacy: boolean,
    formatted: boolean,
    video: HTMLVideoElement | null,
    showCollision: boolean,
    showFPS: boolean,
    showCommentCount: boolean,
    drawAllImageOnLoad: boolean,
    debug: boolean,
    enableLegacyPiP: boolean
}
type rawApiResponse = {
    [key: string]: apiPing | apiThread | apiLeaf | apiGlobalNumRes | apiChat
}
type apiPing = {
    "content": string
}
type apiThread = {
    "resultcode": number,
    "thread": string,
    "server_time": number,
    "ticket": string,
    "revision": number
}
type apiLeaf = {
    "thread": string,
    "count": number
}
type apiGlobalNumRes = {
    "thread": string,
    "num_res": number
}
type apiChat = {
    "thread": string,
    "no": number,
    "vpos": number,
    "date": number,
    "date_usec": number,
    "nicoru": number,
    "premium": number,
    "anonymity": number,
    "user_id": string,
    "mail": string,
    "content": string,
    "deleted": number
}
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
type formattedCommentWithFont = formattedComment & {
    "loc": string,
    "size": string,
    "fontSize": number,
    "font": string,
    "color": string,
    "full": boolean,
    "ender": boolean,
    "_live": boolean,
    "long": number,
    "invisible": boolean
}
type formattedCommentWithSize = formattedCommentWithFont & {
    "height": number,
    "width": number,
    "width_max": number,
    "width_min": number,
    "lineHeight": number
}
type parsedComment = formattedCommentWithSize & {
    posY: number,
    image?: HTMLCanvasElement | boolean
}
type measureTextResult = {
    "width": number,
    "width_max": number,
    "width_min": number,
    "height": number,
    "resized": boolean,
    "fontSize": number,
    "lineHeight": number
}
type T_fontSize = {
    [key: string]: {
        "default": number,
        "resized": number
    }
}
type T_doubleResizeMaxWidth = {
    [key: string]: {
        "legacy": number,
        "default": number
    }
}

let isDebug: boolean = false;

class NiconiComments {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private readonly commentYPaddingTop: number;
    private readonly commentYMarginBottom: number;
    private readonly fontSize: T_fontSize;
    private readonly lineHeight: T_fontSize;
    private readonly doubleResizeMaxWidth: T_doubleResizeMaxWidth;
    private video: HTMLVideoElement | null;
    private showCollision: boolean;
    public showFPS: boolean;
    public showCommentCount: boolean;
    public enableLegacyPiP: boolean;
    private data: parsedComment[];
    private timeline: { [key: number]: number[] };
    private nicoScripts: {
        replace: any[]; ban: any[];
        default: any[]; reverse: any[]
    };
    private collision_right: any;
    private collision_left: any;
    private collision_ue: any;
    private collision_shita: any;
    private lastVpos: number;
    private useLegacy: boolean;
    private fpsCount: number;
    private fps: number;

    /**
     * NiconiComments Constructor
     * @param {HTMLCanvasElement} canvas - 描画対象のキャンバス
     * @param {[]} data - 描画用のコメント
     * @param {{useLegacy: boolean, formatted: boolean, video: HTMLVideoElement|null}, showCollision: boolean, showFPS: boolean, showCommentCount: boolean, drawAllImageOnLoad: boolean} options - 細かい設定類
     */
    constructor(canvas: HTMLCanvasElement, data: (rawApiResponse | formattedComment)[], options: InitOptions = {
        useLegacy: false,
        formatted: false,
        video: null,
        showCollision: false,
        showFPS: false,
        showCommentCount: false,
        drawAllImageOnLoad: false,
        debug: false,
        enableLegacyPiP: false
    }) {
        isDebug = options.debug;
        const constructorStart = performance.now();

        this.canvas = canvas;
        let context = canvas.getContext("2d");
        if (!context) throw new Error("Fail to get CanvasRenderingContext2D");
        this.context = context;
        this.context.strokeStyle = "rgba(0,0,0,0.7)";
        this.context.textAlign = "start";
        this.context.textBaseline = "alphabetic";
        this.context.lineWidth = 4;
        this.commentYPaddingTop = 0.08;
        this.commentYMarginBottom = 0.24;
        this.fontSize = {
            "small": {
                "default": 47,
                "resized": 26.1
            },
            "medium": {
                "default": 74,
                "resized": 38.7
            },
            "big": {
                "default": 110,
                "resized": 61
            }
        };
        this.lineHeight = {
            "small": {
                "default": 1,
                "resized": 1
            },
            "medium": {
                "default": 1,
                "resized": 1
            },
            "big": {
                "default": 1.03,
                "resized": 1.01
            }
        };
        this.doubleResizeMaxWidth = {
            full: {
                legacy: 3020,
                default: 3220
            },
            normal: {
                legacy: 2540,
                default: 2740
            }
        };
        let parsedData: formattedComment[] = options.formatted ? data as formattedComment[] : this.parseData(data as rawApiResponse[]);
        this.video = options.video ? options.video : null;
        this.showCollision = options.showCollision;
        this.showFPS = options.showFPS;
        this.showCommentCount = options.showCommentCount;
        this.enableLegacyPiP = options.enableLegacyPiP

        this.timeline = {};
        this.nicoScripts = {reverse: [], default: [], replace: [], ban: []};
        this.collision_right = {};
        this.collision_left = {};
        this.collision_ue = {};
        this.collision_shita = {};
        this.data = [];
        this.lastVpos = -1;
        this.useLegacy = options.useLegacy;
        this.preRendering(parsedData, options.drawAllImageOnLoad);
        this.fpsCount = 0;
        this.fps = 0;
        window.setInterval(() => {
            this.fps = this.fpsCount * 2;
            this.fpsCount = 0;
        }, 500);
        logger(`constructor complete: ${performance.now() - constructorStart}ms`);
    }

    /**
     * ニコニコが吐き出したデータを処理しやすいように変換する
     * @param {[]} data - ニコニコが吐き出したコメントデータ
     * @returns {*[]} - 独自フォーマットのコメントデータ
     */
    parseData(data: rawApiResponse[]) {
        const parseDataStart = performance.now();
        let data_: formattedComment[] = [];
        for (let i = 0; i < data.length; i++) {
            let val = data[i];
            if (!val) continue;
            for (let key in val) {
                let value = val[key];
                if (isApiChat(value) && value["deleted"] !== 1) {
                    let tmpParam: any = {
                        "id": value["no"],
                        "vpos": value["vpos"],
                        "content": value["content"],
                        "date": value["date"],
                        "date_usec": value["date_usec"],
                        "owner": !value["user_id"],
                        "premium": value["premium"] === 1,
                        "mail": []
                    };
                    if (value["mail"]) {
                        tmpParam["mail"] = value["mail"].split(/[\s　]/g);
                    }
                    if (value["content"].startsWith("/") && !value["user_id"]) {
                        tmpParam["mail"].push("invisible");
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
        logger(`parseData complete: ${performance.now() - parseDataStart}ms`);
        return data_;
    }

    /**
     * 事前に当たり判定を考慮してコメントの描画場所を決定する
     * @param {any[]} rawData
     * @param {boolean} drawAll - 読み込み時にすべてのコメント画像を生成する
     * ※読み込み時めちゃくちゃ重くなるので途中で絶対にカクついてほしくないという場合以外は非推奨
     */
    preRendering(rawData: formattedComment[], drawAll: boolean) {
        const preRenderingStart = performance.now();
        let parsedData: parsedComment[] = this.getCommentPos(this.getCommentSize(this.getFont(rawData)) as parsedComment[]);
        this.data = this.sortComment(parsedData);
        if (drawAll) {
            for (let i in parsedData) {
                this.getTextImage(Number(i));
            }
        }
        logger(`preRendering complete: ${performance.now() - preRenderingStart}ms`);
    }

    /**
     * コマンドをもとに各コメントに適用するフォントを決定する
     */
    getFont(parsedData: formattedComment[]): formattedCommentWithFont[] {
        const getFontStart = performance.now();
        const result: formattedCommentWithFont[] = [];
        for (let i in parsedData) {
            let value = parsedData[i];
            if (!value) continue;
            value.content = value.content.replace(/\t/g, "\u2003\u2003")
            result[i] = this.parseCommandAndNicoscript(value);
        }
        logger(`getFont complete: ${performance.now() - getFontStart}ms`);
        return result
    }

    /**
     * コメントの描画サイズを計算する
     */
    getCommentSize(parsedData: formattedCommentWithFont[]): formattedCommentWithSize[] {
        const getCommentSizeStart = performance.now();
        let tmpData: any = groupBy(parsedData, "font", "fontSize");
        let result: formattedCommentWithSize[] = [];
        for (let i in tmpData) {
            for (let j in tmpData[i]) {
                this.context.font = parseFont(i, j, this.useLegacy);
                for (let k in tmpData[i][j]) {
                    let comment = tmpData[i][j][k];
                    if (comment.invisible) {
                        continue;
                    }
                    let measure = this.measureText(comment);
                    let size = parsedData[comment.index] as formattedCommentWithSize;
                    size.height = measure.height;
                    size.width = measure.width;
                    size.width_max = measure.width_max;
                    size.width_min = measure.width_min;
                    size.lineHeight = measure.lineHeight;
                    if (measure.resized) {
                        size.fontSize = measure.fontSize;
                        this.context.font = parseFont(i, j, this.useLegacy);
                    }
                    result[comment.index] = size;
                }
            }
        }
        logger(`getCommentSize complete: ${performance.now() - getCommentSizeStart}ms`);
        return result;
    }

    /**
     * 計算された描画サイズをもとに各コメントの配置位置を決定する
     */
    getCommentPos(parsedData: parsedComment[]) {
        const getCommentPosStart = performance.now();
        let data = parsedData as parsedComment[];
        for (let i in data) {
            let comment = data[i];
            if (!comment || comment.invisible) {
                continue;
            }
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
                parsedData[i]!.vpos -= 70;
                let posY = 0, is_break = false, is_change = true, count = 0;
                if (1080 < comment.height) {
                    posY = (comment.height - 1080) / -2;
                } else {
                    while (is_change && count < 10) {
                        is_change = false;
                        count++;
                        for (let j = 0; j < 500; j++) {
                            let vpos = comment.vpos + j;
                            let left_pos = 1920 - ((1920 + comment.width_max) * j / 500);
                            if (left_pos + comment.width_max >= 1880) {
                                for (let k in this.collision_right[vpos]) {
                                    let l = this.collision_right[vpos][k];
                                    if ((posY < data[l]!.posY + data[l]!.height && posY + comment.height > data[l]!.posY) && data[l]!.owner === comment.owner) {
                                        if (data[l]!.posY + data[l]!.height > posY) {
                                            posY = data[l]!.posY + data[l]!.height;
                                            is_change = true;
                                        }
                                        if (posY + comment.height > 1080) {
                                            if (1080 < comment.height) {
                                                posY = (comment.height - 1080) / -2;
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
                            if (left_pos <= 40) {
                                for (let k in this.collision_left[vpos]) {
                                    let l = this.collision_left[vpos][k];
                                    if ((posY < data[l]!.posY + data[l]!.height && posY + comment.height > data[l]!.posY) && data[l]!.owner === comment.owner) {
                                        if (data[l]!.posY + data[l]!.height > posY) {
                                            posY = data[l]!.posY + data[l]!.height;
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
                parsedData[i]!.posY = posY;
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
                            if ((posY < data[l]!.posY + data[l]!.height && posY + comment.height > data[l]!.posY) && data[l]!.owner === comment.owner) {
                                if (data[l]!.posY + data[l]!.height > posY) {
                                    posY = data[l]!.posY + data[l]!.height;
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
                for (let j = 0; j < comment.long; j++) {
                    let vpos = comment.vpos + j;
                    arrayPush(this.timeline, vpos, i);
                    if (comment.loc === "ue") {
                        arrayPush(this.collision_ue, vpos, i);
                    } else {
                        arrayPush(this.collision_shita, vpos, i);
                    }
                }
                parsedData[i]!.posY = posY;
            }
        }
        logger(`getCommentPos complete: ${performance.now() - getCommentPosStart}ms`);
        return parsedData;
    }

    /**
     * 投稿者コメントを前に移動
     */
    sortComment(parsedData: parsedComment[]) {
        const sortCommentStart = performance.now();
        for (let vpos in this.timeline) {
            if (!this.timeline[vpos]) continue;
            const owner = [], user = [];
            for (let i of this.timeline[vpos]!) {
                if (parsedData[i]!.owner) {
                    owner.push(i);
                } else {
                    user.push(i);
                }
            }
            this.timeline[vpos]! = owner.concat(user);
        }
        logger(`parseData complete: ${performance.now() - sortCommentStart}ms`);
        return parsedData;
    }

    /**
     * context.measureTextの複数行対応版
     * 画面外にはみ出すコメントの縮小も行う
     * @param comment - 独自フォーマットのコメントデータ
     * @returns {{resized: boolean, width: number, width_max: number, fontSize: number, width_min: number, height: number, lineHeight: number}} - 描画サイズとリサイズの情報
     */
    measureText(comment: { content: string; resized: boolean; ender: any; size: string; fontSize: number; tateresized: boolean; font: any; loc: string; full: any; yokoResized: boolean; lineHeight: number | undefined; }): measureTextResult {
        let width, width_max, width_min, height, width_arr = [], lines = comment.content.split("\n");
        if (!comment.lineHeight) comment.lineHeight = this.lineHeight[comment.size]!.default;
        if (!comment.resized && !comment.ender) {
            if (comment.size === "big" && lines.length > 2) {
                comment.fontSize = this.fontSize.big!.resized;
                comment.lineHeight = this.lineHeight.big!.resized;
                comment.resized = true;
                comment.tateresized = true;
                this.context.font = parseFont(comment.font, comment.fontSize, this.useLegacy);
            } else if (comment.size === "medium" && lines.length > 4) {
                comment.fontSize = this.fontSize.medium!.resized;
                comment.lineHeight = this.lineHeight.medium!.resized;
                comment.resized = true;
                comment.tateresized = true;
                this.context.font = parseFont(comment.font, comment.fontSize, this.useLegacy);
            } else if (comment.size === "small" && lines.length > 6) {
                comment.fontSize = this.fontSize.small!.resized;
                comment.lineHeight = this.lineHeight.small!.resized;
                comment.resized = true;
                comment.tateresized = true;
                this.context.font = parseFont(comment.font, comment.fontSize, this.useLegacy);
            }
        }
        for (let i = 0; i < lines.length; i++) {
            let measure = this.context.measureText(lines[i] as string);
            width_arr.push(measure.width);
        }
        width = width_arr.reduce((p, c) => p + c, 0) / width_arr.length;
        width_max = Math.max(...width_arr);
        width_min = Math.min(...width_arr);
        height = (comment.fontSize * comment.lineHeight * (1 + this.commentYPaddingTop) * lines.length) + (this.commentYMarginBottom * comment.fontSize);
        if (comment.loc !== "naka" && !comment.tateresized) {
            if (comment.full && width_max > 1930) {
                comment.fontSize -= 2;
                comment.resized = true;
                comment.yokoResized = true;
                this.context.font = parseFont(comment.font, comment.fontSize, this.useLegacy);
                return this.measureText(comment);
            } else if (!comment.full && width_max > 1440) {
                comment.fontSize -= 1;
                comment.resized = true;
                comment.yokoResized = true;
                this.context.font = parseFont(comment.font, comment.fontSize, this.useLegacy);
                return this.measureText(comment);
            }
        } else if (comment.loc !== "naka" && comment.tateresized && (comment.full && width_max > 2120 || !comment.full && width_max > 1440) && !comment.yokoResized) {
            comment.fontSize = this.fontSize[comment.size]!.default;
            comment.resized = true;
            comment.yokoResized = true;
            this.context.font = parseFont(comment.font, comment.fontSize, this.useLegacy);
            return this.measureText(comment);
        } else if (comment.loc !== "naka" && comment.tateresized && comment.yokoResized) {
            if (comment.full && width_max > this.doubleResizeMaxWidth.full![this.useLegacy ? "legacy" : "default"]) {
                comment.fontSize -= 1;
                this.context.font = parseFont(comment.font, comment.fontSize, this.useLegacy);
                return this.measureText(comment);
            } else if (!comment.full && width_max > this.doubleResizeMaxWidth.normal![this.useLegacy ? "legacy" : "default"]) {
                comment.fontSize -= 1;
                this.context.font = parseFont(comment.font, comment.fontSize, this.useLegacy);
                return this.measureText(comment);
            }
        }

        return {
            "width": width,
            "width_max": width_max,
            "width_min": width_min,
            "height": height,
            "resized": comment.resized,
            "fontSize": comment.fontSize,
            "lineHeight": comment.lineHeight
        };
    }

    /**
     * コマンドをもとに所定の位置に事前に生成したコメントを表示する
     * @param comment - 独自フォーマットのコメントデータ
     * @param {number} vpos - 動画の現在位置の100倍 ニコニコから吐き出されるコメントの位置情報は主にこれ
     */
    drawText(comment: parsedComment, vpos: number) {
        let reverse = false;
        for (let i in this.nicoScripts.reverse) {
            let range = this.nicoScripts.reverse[i];
            if ((range.target === "コメ" && comment.owner) || (range.target === "投コメ" && !comment.owner)) {
                break;
            }
            if (range.start < vpos && vpos < range.end) {
                reverse = true;
            }
        }
        for (let i in this.nicoScripts.ban) {
            let range = this.nicoScripts.ban[i];
            if (range.start < vpos && vpos < range.end) {
                return;
            }
        }
        let posX = (1920 - comment.width_max) / 2, posY = comment.posY;
        if (comment.loc === "naka") {
            if (reverse) {
                posX = ((1920 + comment.width_max) * (vpos - comment.vpos) / 500) - comment.width_max;
            } else {
                posX = 1920 - ((1920 + comment.width_max) * (vpos - comment.vpos) / 500);
            }
        } else if (comment.loc === "shita") {
            posY = 1080 - comment.posY - comment.height;
        }
        if (comment.image && comment.image !== true) {
            this.context.drawImage(comment.image, posX, posY);
        }
        if (this.showCollision) {
            this.context.strokeStyle = "rgba(0,255,255,1)";
            this.context.strokeRect(posX, posY, comment.width_max, comment.height);
            let lines = comment.content.split("\n");
            for (let i in lines) {
                let linePosY = (Number(i) + 1) * (comment.fontSize * comment.lineHeight) * (1 + this.commentYPaddingTop);
                this.context.strokeStyle = "rgba(255,255,0,0.5)";
                this.context.strokeRect(posX, posY + linePosY, comment.width_max, comment.fontSize * comment.lineHeight * -1);
            }
        }
    }

    /**
     * drawTextで毎回fill/strokeすると重いので画像化して再利用できるようにする
     * @param {number} i - コメントデータのインデックス
     */
    getTextImage(i: number) {
        let value = this.data[i];
        if (!value || value.invisible) return;
        let image = document.createElement("canvas");
        image.width = value.width_max;
        image.height = value.height;
        let context = image.getContext("2d");
        if (!context) throw new Error("Fail to get CanvasRenderingContext2D");
        context.strokeStyle = "rgba(0,0,0,0.7)";
        context.textAlign = "start";
        context.textBaseline = "alphabetic";
        context.lineWidth = 4;
        context.font = parseFont(value.font, value.fontSize, this.useLegacy);
        if (value._live) {
            let rgb = hex2rgb(value.color);
            context.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5)`;
        } else {
            context.fillStyle = value.color;
        }
        if (value.color === "#000000") {
            context.strokeStyle = "rgba(255,255,255,0.7)";
        }
        let lines = value.content.split("\n");
        for (let i in lines) {
            let line = lines[i] as string, posY;
            posY = (Number(i) + 1) * (value.fontSize * value.lineHeight) * (1 + this.commentYPaddingTop);
            context.strokeText(line, 0, posY);
            context.fillText(line, 0, posY);
        }
        this.data[i]!.image = image;
        setTimeout(() => {
            if (this.data[i]!.image) delete this.data[i]!.image;
        }, 5000);
    }

    /**
     * コメントに含まれるコマンドを解釈する
     * @param comment- 独自フォーマットのコメントデータ
     * @returns {{loc: string|null, size: string|null, color: string|null, fontSize: number|null, ender: boolean, font: string|null, full: boolean, _live: boolean, invisible: boolean, long:number|null}}
     */
    parseCommand(comment: any) {
        let metadata = comment.mail,
            loc = null,
            size = null,
            fontSize = null,
            color = null,
            font = null,
            full = false,
            ender = false,
            _live = false,
            invisible = false,
            long = null;
        for (let i in metadata) {
            let command = metadata[i].toLowerCase();
            const match = command.match(/^@([0-9.]+)/);
            if (match) {
                long = match[1];
            }
            if (loc === null) {
                switch (command) {
                    case "ue":
                        loc = "ue";
                        break;
                    case "shita":
                        loc = "shita";
                        break;
                }
            }
            if (size === null) {
                switch (command) {
                    case "big":
                        size = "big";
                        fontSize = this.fontSize.big!.default;
                        break;
                    case "small":
                        size = "small";
                        fontSize = this.fontSize.small!.default;
                        break;
                }
            }
            if (color === null) {
                switch (command) {
                    case "white":
                        color = "#FFFFFF";
                        break;
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
                        const match = command.match(/#[0-9a-z]{3,6}/);
                        if (match && comment.premium) {
                            color = match[0].toUpperCase();
                        }
                        break;
                }
            }
            if (font === null) {
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
                case "_live":
                    _live = true;
                    break;
                case "invisible":
                    invisible = true;
                    break;
            }
        }
        return {loc, size, fontSize, color, font, full, ender, _live, invisible, long};
    }

    parseCommandAndNicoscript(comment: formattedComment): formattedCommentWithFont {
        let data = this.parseCommand(comment),
            nicoscript = comment.content.match(/^@(デフォルト|置換|逆|コメント禁止|シーク禁止|ジャンプ)/)

        if (nicoscript) {
            switch (nicoscript[1]) {
                case "デフォルト":
                    this.nicoScripts.default.push({
                        start: comment.vpos,
                        long: data.long === null ? null : Math.floor(data.long * 100),
                        color: data.color,
                        size: data.size,
                        font: data.font,
                        loc: data.loc
                    });
                    break;
                case "逆":
                    let reverse = comment.content.match(/^@逆 ?(全|コメ|投コメ)?/);
                    if (!reverse) reverse = [];
                    if (!reverse[1]) {
                        reverse[1] = "全";
                    }
                    if (data.long === null) {
                        data.long = 30;
                    }
                    this.nicoScripts.reverse.push({
                        start: comment.vpos,
                        end: comment.vpos + (data.long * 100),
                        target: reverse[1]
                    });
                    break;
                case "コメント禁止":
                    if (data.long === null) {
                        data.long = 30;
                    }
                    this.nicoScripts.reverse.push({
                        start: comment.vpos,
                        end: comment.vpos + (data.long * 100),
                    });
                    break;
                case "置換":
                    let content = comment.content.split(""),
                        quote = "",
                        last_i = "",
                        string = "",
                        result = [];
                    for (let i of content.slice(4)) {
                        if (i.match(/["'「]/) && quote === "") {
                            quote = i;
                        } else if (i.match(/["']/) && quote === i && last_i !== "\\") {
                            result.push(replaceAll(string, "\\n", "\n"));
                            quote = "";
                            string = "";
                        } else if (i.match(/」/) && quote === "「") {
                            result.push(string);
                            quote = "";
                            string = "";
                        } else if (quote === "" && i.match(/[\s　]/)) {
                            if (string) {
                                result.push(string);
                                string = "";
                            }
                        } else {
                            string += i
                        }

                        last_i = i;
                    }
                    result.push(string);
                    this.nicoScripts.replace.push({
                        start: comment.vpos,
                        long: data.long === null ? null : Math.floor(data.long * 100),
                        keyword: result[0],
                        replace: result[1] || "",
                        range: result[2] || "単",
                        target: result[3] || "コメ",
                        condition: result[4] || "部分一致",
                        color: data.color,
                        size: data.size,
                        font: data.font,
                        loc: data.loc
                    });
                    break;
            }
            data.invisible = true;
        }
        let color = "#FFFFFF", size = "medium", font = "defont", loc = "naka";
        for (let i in this.nicoScripts.default) {
            if (this.nicoScripts.default[i].long !== null && this.nicoScripts.default[i].start + this.nicoScripts.default[i].long < comment.vpos) {
                this.nicoScripts.default = this.nicoScripts.default.splice(Number(i), 1);
                continue;
            }
            if (this.nicoScripts.default[i].loc) {
                loc = this.nicoScripts.default[i].loc
            }
            if (this.nicoScripts.default[i].color) {
                color = this.nicoScripts.default[i].color
            }
            if (this.nicoScripts.default[i].size) {
                size = this.nicoScripts.default[i].size
            }
            if (this.nicoScripts.default[i].font) {
                font = this.nicoScripts.default[i].font
            }
        }
        for (let i in this.nicoScripts.replace) {
            if (this.nicoScripts.replace[i].long !== null && this.nicoScripts.replace[i].start + this.nicoScripts.replace[i].long < comment.vpos) {
                this.nicoScripts.default = this.nicoScripts.default.splice(Number(i), 1);
                continue;
            }
            const item = this.nicoScripts.replace[i];
            if ((item.target === "コメ" && comment.owner) || (item.target === "投コメ" && !comment.owner) || (item.target === "含まない" && comment.owner)) continue;
            if ((item.condition === "完全一致" && comment.content === item.keyword) || (item.condition === "部分一致" && comment.content.indexOf(item.keyword) !== -1)) {
                if (item.range === "単") {
                    comment.content = replaceAll(comment.content, item.keyword, item.replace);
                } else {
                    comment.content = item.replace;
                }
                if (item.loc) {
                    loc = item.loc
                }
                if (item.color) {
                    color = item.color
                }
                if (item.size) {
                    size = item.size
                }
                if (item.font) {
                    font = item.font
                }
            }
        }
        if (!data.loc) {
            data.loc = loc;
        }
        if (!data.color) {
            data.color = color;
        }
        if (!data.size) {
            data.size = size;
            data.fontSize = this.fontSize[data.size]!.default;
        }
        if (!data.font) {
            data.font = font;
        }
        if (data.loc !== "naka") {
            if (!data.long) {
                data.long = 300;
            } else {
                data.long = Math.floor(data.long * 100);
            }
        }
        return {...comment, ...data} as formattedCommentWithFont;

    }

    /**
     * キャンバスを描画する
     * @param vpos - 動画の現在位置の100倍 ニコニコから吐き出されるコメントの位置情報は主にこれ
     */
    drawCanvas(vpos: number) {
        const drawCanvasStart = performance.now();
        if (this.lastVpos === vpos) return;
        this.lastVpos = vpos;
        this.fpsCount++;
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.video) {
            let offsetX, offsetY, scale, height = this.canvas.height / this.video.videoHeight,
                width = this.canvas.width / this.video.videoWidth;
            if (this.enableLegacyPiP?height > width : height < width) {
                scale = width;
            } else {
                scale = height;
            }
            offsetX = (this.canvas.width - this.video.videoWidth * scale) * 0.5;
            offsetY = (this.canvas.height - this.video.videoHeight * scale) * 0.5;
            this.context.drawImage(this.video, offsetX, offsetY, this.video.videoWidth * scale, this.video.videoHeight * scale);
        }
        if (this.timeline[vpos]) {
            for (let i in this.timeline[vpos]) {
                let index = this.timeline[vpos]![Number(i) as number] as number;
                let comment = this.data[index];
                if (!comment || comment.invisible) {
                    continue;
                }
                if (comment.image === undefined) {
                    this.getTextImage(index);
                }
                try {
                    this.drawText(comment, vpos);
                } catch (e) {
                    comment.image = false;
                }
            }
        }
        if (this.showFPS) {
            this.context.font = parseFont("defont", 60, this.useLegacy);
            this.context.fillStyle = "#00FF00";
            this.context.strokeStyle = "rgba(0,0,0,0.7)";
            this.context.strokeText("FPS:" + this.fps, 100, 100);
            this.context.fillText("FPS:" + this.fps, 100, 100);
        }
        if (this.showCommentCount) {
            this.context.font = parseFont("defont", 60, this.useLegacy);
            this.context.fillStyle = "#00FF00";
            this.context.strokeStyle = "rgba(0,0,0,0.7)";
            if (this.timeline[vpos]) {
                this.context.strokeText("Count:" + this.timeline[vpos]!.length, 100, 200);
                this.context.fillText("Count:" + this.timeline[vpos]!.length, 100, 200);
            } else {
                this.context.strokeText("Count:0", 100, 200);
                this.context.fillText("Count:0", 100, 200);
            }
        }
        logger(`drawCanvas complete: ${performance.now() - drawCanvasStart}ms`);
    }

    /**
     * キャンバスを消去する
     */
    clear() {
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
const groupBy = (array: any, key: string, key2: string): {} => {
    let data: any = {};
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
 * @param {string|number} size
 * @param {boolean} useLegacy
 * @returns {string}
 */
const parseFont = (font: string, size: string | number, useLegacy: boolean): string => {
    switch (font) {
        case "gothic":
            return `normal 400 ${size}px "游ゴシック体", "游ゴシック", "Yu Gothic", YuGothic, yugothic, YuGo-Medium`;
        case "mincho":
            return `normal 400 ${size}px "游明朝体", "游明朝", "Yu Mincho", YuMincho, yumincho, YuMin-Medium`;
        default:
            if (useLegacy) {
                return `normal 600 ${size}px Arial, "ＭＳ Ｐゴシック", "MS PGothic", MSPGothic, MS-PGothic`;
            } else {
                return `normal 600 ${size}px sans-serif, Arial, "ＭＳ Ｐゴシック", "MS PGothic", MSPGothic, MS-PGothic`;
            }
    }
}
/**
 * phpのarray_push的なあれ
 * @param array
 * @param {string|number} key
 * @param push
 */
const arrayPush = (array: any, key: string | number, push: any) => {
    if (!array) {
        array = {};
    }
    if (!array[key]) {
        array[key] = [];
    }
    array[key].push(push);
}
/**
 * Hexからrgbに変換する(_live用)
 * @param {string} hex
 * @return {array} RGB
 */
const hex2rgb = (hex: string) => {
    if (hex.slice(0, 1) === "#") hex = hex.slice(1);
    if (hex.length === 3) hex = hex.slice(0, 1) + hex.slice(0, 1) + hex.slice(1, 2) + hex.slice(1, 2) + hex.slice(2, 3) + hex.slice(2, 3);

    return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(function (str) {
        return parseInt(str, 16);
    });
}
/**
 * replaceAll
 */
const replaceAll = (string: string, target: string, replace: string) => {
    let count = 0;
    while (string.indexOf(target) !== -1 && count < 100) {
        string = string.replace(target, replace)
        count++;
    }
    return string;
}
const isApiChat = (item: any): item is apiChat =>
    item.no&&item.vpos&&item.content

const logger = (msg: any) => {
    if (isDebug) console.debug(msg);
}

export default NiconiComments;