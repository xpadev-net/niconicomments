import { array, parse, safeParse, unknown as unknownSchema } from "valibot";

import { type FormattedComment, type InputParser, ZApiChat } from "@/@types";

import { assignUserId } from "./xmlDocument";

export const LegacyParser: InputParser = {
  key: ["legacy"],
  parse: (input) => {
    return fromLegacy(parse(array(unknownSchema()), input));
  },
};

/**
 * ニコニコ公式のlegacy apiから帰ってきたデータ処理する
 * @param data legacy apiから帰ってきたデータ
 * @returns 変換後のデータ
 */
const fromLegacy = (data: unknown[]): FormattedComment[] => {
  const data_: FormattedComment[] = [];
  const userIdMap = new Map<string, number>();
  for (const _val of data) {
    const chat =
      typeof _val === "object" && _val !== null && "chat" in _val
        ? _val.chat
        : undefined;
    const val = safeParse(ZApiChat, chat);
    if (!val.success) continue;
    const value = val.output;
    if (value.deleted !== 1) {
      const tmpParam: FormattedComment = {
        id: value.no,
        vpos: value.vpos,
        content: value.content || "",
        date: value.date,
        date_usec: value.date_usec || 0,
        owner: !value.user_id,
        premium: value.premium === 1,
        mail: [],
        user_id: -1,
        layer: -1,
        is_my_post: false,
      };
      if (value.mail) {
        tmpParam.mail = value.mail.split(/\s+/g);
      }
      if (value.content.startsWith("/") && !value.user_id) {
        tmpParam.mail.push("invisible");
      }
      tmpParam.user_id = assignUserId(userIdMap, value.user_id);
      data_.push(tmpParam);
    }
  }
  return data_;
};
