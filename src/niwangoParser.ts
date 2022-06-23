//@ts-ignore
import {parse as peg$parse} from "./niwango.peg.js";


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

class NiwangoParser {
    private timeline: any;
    private functions: any;
    private variable: any;
    private scripts: any;
    private last_chat: formattedComment | undefined;
    private last_vpos: number;
    private rollback: any;
    private locals: any;
    private that: any;

    constructor() {
        this.timeline = {};
        this.scripts = {};
        this.functions = {};
        this.rollback = {};
        this.last_vpos = -1;
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
        this.locals = {
            window: {
            },
            document: {
            }
        };
        this.that = Object.create(null); // create our own this object for the user code
    }

    eval(code: string) {
        const params = []; // the names of local variables
        const args = []; // the local variables

        for (let param in this.locals) {
            if (this.locals.hasOwnProperty(param)) {
                args.push(this.locals[param]);
                params.push(param);
            }
        }

        let context = Array.prototype.concat.call(this.that, params, code); // create the parameter list for the sandbox
        // @ts-ignore
        const sandbox = new (Function.prototype.bind.apply(Function, context)); // create the sandbox function
        context = Array.prototype.concat.call(this.that, args); // create the argument list for the sandbox
        // @ts-ignore
        return Function.prototype.bind.apply(sandbox, context)(); // bind the local variables to the sandbox
    }

    /**
     * パース処理のみ
     * execは後で消す
     * @param comment
     */
    init(comment: formattedComment) {
        if (comment.content.startsWith("/")) {
            let scripts = this.parse(comment);
            console.log(scripts);
        }
        this.last_chat = comment;
    }

    /**
     * コメントデータを分割して投げる
     * @param arg1
     */
    parse(arg1: string | formattedComment): any {
        let string;
        if (typeof arg1 == "object") {
            string = arg1.content.substring(1);
        } else {
            string = arg1;
        }
        return peg$parse(string);
    }
}

// create our own local versions of window and document with limited functionality





export default NiwangoParser;