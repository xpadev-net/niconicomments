import type { FormattedComment, InputParser } from "@/@types";
import { InvalidFormatError } from "@/errors";
import typeGuard from "@/typeGuard";

export const XmlDocumentParser: InputParser = {
  key: ["formatted", "niconicome"],
  parse: (input: unknown): FormattedComment[] => {
    if (!typeGuard.xmlDocument(input)) throw new InvalidFormatError();
    return parseXMLDocument(input);
  },
};

/**
 * niconicome等が吐き出すxml形式のコメントデータを処理する
 * @param data 吐き出されたxmlをDOMParserでparseFromStringしたもの
 * @returns 変換後のデータ
 */
const parseXMLDocument = (data: XMLDocument): FormattedComment[] => {
  const data_: FormattedComment[] = [];
  const userList: string[] = [];
  let index = Array.from(data.documentElement.children).length;
  for (const item of Array.from(data.documentElement.children)) {
    if (item.nodeName !== "chat") continue;
    const tmpParam: FormattedComment = {
      id: Number(item.getAttribute("no")) || index++,
      vpos: Number(item.getAttribute("vpos")),
      content: item.textContent ?? "",
      date: Number(item.getAttribute("date")) || 0,
      date_usec: Number(item.getAttribute("date_usec")) || 0,
      owner: !item.getAttribute("user_id"),
      premium: item.getAttribute("premium") === "1",
      mail: [],
      user_id: -1,
      layer: -1,
      is_my_post: false,
    };
    if (item.getAttribute("mail")) {
      tmpParam.mail = item.getAttribute("mail")?.split(/\s+/g) ?? [];
    }
    if (tmpParam.content.startsWith("/") && tmpParam.owner) {
      tmpParam.mail.push("invisible");
    }
    const userId = item.getAttribute("user_id") ?? "";
    const isUserExist = userList.indexOf(userId);
    if (isUserExist === -1) {
      tmpParam.user_id = userList.length;
      userList.push(userId);
    } else {
      tmpParam.user_id = isUserExist;
    }
    data_.push(tmpParam);
  }
  return data_;
};
