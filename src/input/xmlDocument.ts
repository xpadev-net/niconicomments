import {
  type FormattedComment,
  type InputParser,
  toFiniteNumberInRange,
} from "@/@types";
import { InvalidFormatError } from "@/errors";
import typeGuard from "@/typeGuard";

export const assignUserId = (
  userIdMap: Map<string, number>,
  userId: string,
): number => {
  const existingUserId = userIdMap.get(userId);
  if (existingUserId !== undefined) return existingUserId;

  const nextUserId = userIdMap.size;
  userIdMap.set(userId, nextUserId);
  return nextUserId;
};

export const XmlDocumentParser: InputParser = {
  key: ["XMLDocument", "niconicome"],
  parse: (input: unknown): FormattedComment[] => {
    let isXmlDocument = false;
    if (typeof input === "object" && input !== null) {
      try {
        isXmlDocument = typeGuard.xmlDocument(input);
      } catch (error) {
        if (!(error instanceof TypeError)) throw error;
      }
    }
    if (isXmlDocument) {
      return parseXMLDocument(input as XMLDocument);
    }
    throw new InvalidFormatError();
  },
};

/**
 * niconicome等が吐き出すxml形式のコメントデータを処理する
 * @param data 吐き出されたxmlをDOMParserでparseFromStringしたもの
 * @returns 変換後のデータ
 */
const parseXMLDocument = (data: XMLDocument): FormattedComment[] => {
  const data_: FormattedComment[] = [];
  const userIdMap = new Map<string, number>();
  let index = Array.from(data.documentElement.children).length;
  for (const item of Array.from(data.documentElement.children)) {
    if (item.nodeName !== "chat") continue;
    const rawNo = item.getAttribute("no");
    const id =
      rawNo === null ? index++ : (toFiniteNumberInRange(rawNo) ?? undefined);
    const vpos = toFiniteNumberInRange(item.getAttribute("vpos"));
    const date = toFiniteNumberInRange(item.getAttribute("date"));
    const rawDateUsec = item.getAttribute("date_usec");
    const dateUsec =
      rawDateUsec === null
        ? 0
        : toFiniteNumberInRange(rawDateUsec, { max: 999_999 });
    if (
      id === undefined ||
      vpos === undefined ||
      date === undefined ||
      dateUsec === undefined
    ) {
      continue;
    }
    const tmpParam: FormattedComment = {
      id,
      vpos,
      content: item.textContent ?? "",
      date,
      date_usec: dateUsec,
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
    tmpParam.user_id = assignUserId(
      userIdMap,
      item.getAttribute("user_id") ?? "",
    );
    data_.push(tmpParam);
  }
  return data_;
};
