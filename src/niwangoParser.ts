//@ts-ignore
import { parse as peg$parse } from "./niwango.peg.js";

class NiwangoParser {
  constructor() {}

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

export default NiwangoParser;
