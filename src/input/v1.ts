import { array, parse } from "valibot";

import type { InputParser } from "@/@types";
import { type FormattedComment, type V1Thread, ZV1Thread } from "@/@types";

export const V1Parser: InputParser = {
  key: ["v1"],
  parse: (input: unknown) => {
    return fromV1(parse(array(ZV1Thread), input));
  },
};

/**
 * ニコニコ公式のv1 apiから帰ってきたデータ処理する
 * data内threadsのデータを渡されることを想定
 * @param data v1 apiから帰ってきたデータ
 * @returns 変換後のデータ
 */
const fromV1 = (data: V1Thread[]): FormattedComment[] => {
  const data_: FormattedComment[] = [];
  const userList: string[] = [];
  for (const item of data) {
    const val = item.comments;
    const forkName = item.fork;
    for (const value of val) {
      const tmpParam: FormattedComment = {
        id: value.no,
        vpos: Math.floor(value.vposMs / 10),
        content: value.body,
        date: date2time(value.postedAt),
        date_usec: 0,
        owner: forkName === "owner",
        premium: value.isPremium,
        mail: value.commands,
        user_id: -1,
        layer: -1,
        is_my_post: value.isMyPost,
      };
      if (tmpParam.content.startsWith("/") && tmpParam.owner) {
        tmpParam.mail.push("invisible");
      }
      const isUserExist = userList.indexOf(value.userId);
      if (isUserExist === -1) {
        tmpParam.user_id = userList.length;
        userList.push(value.userId);
      } else {
        tmpParam.user_id = isUserExist;
      }
      data_.push(tmpParam);
    }
  }
  return data_;
};

/**
 * v1 apiのpostedAtはISO 8601のtimestampなのでDate関数を使ってunix timestampに変換
 * @param date ISO 8601 timestamp
 * @returns unix timestamp
 */
const date2time = (date: string): number => Math.floor(Date.parse(date) / 1000);
