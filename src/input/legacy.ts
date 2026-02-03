import { array, parse, safeParse } from "valibot";

import type { InputParser } from "@/@types";
import {
  type FormattedComment,
  type RawApiResponse,
  ZApiChat,
  ZRawApiResponse,
} from "@/@types";

export const LegacyParser: InputParser = {
  key: ["legacy"],
  parse: (input) => {
    return fromLegacy(parse(array(ZRawApiResponse), input));
  },
};

/**
 * ニコニコ公式のlegacy apiから帰ってきたデータ処理する
 * @param data legacy apiから帰ってきたデータ
 * @returns 変換後のデータ
 */
const fromLegacy = (data: RawApiResponse[]): FormattedComment[] => {
  const data_: FormattedComment[] = [];
  const userList = new Map<string, number>();
  for (const _val of data) {
    const val = safeParse(ZApiChat, _val.chat);
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
      const userId = value.user_id ?? "";
      const existing = userList.get(userId);
      if (existing === undefined) {
        const nextId = userList.size;
        userList.set(userId, nextId);
        tmpParam.user_id = nextId;
      } else {
        tmpParam.user_id = existing;
      }
      data_.push(tmpParam);
    }
  }
  return data_;
};
