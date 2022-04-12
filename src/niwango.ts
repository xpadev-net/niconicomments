import NiwangoParser from "./niwangoParser";

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

class Niwango {
    private last_chat: formattedComment;
    private parser: NiwangoParser;

    constructor() {
        this.last_chat = null;
        this.parser = new NiwangoParser();
    }

    parse(comment: formattedComment) {
        if (comment.content.startsWith("/")) {
            let scripts = this.parser.parse(comment);
            console.log(scripts, comment.content);
        }
        this.last_chat = comment;
    }


}

export default Niwango;