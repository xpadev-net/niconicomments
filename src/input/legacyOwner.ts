import type { InputParser } from "@/@types";
import { type FormattedComment } from "@/@types";
import { InvalidFormatError } from "@/errors";
import typeGuard from "@/typeGuard";

export const LegacyOwnerParser: InputParser = {
  key: ["legacyOwner"],
  parse: (input) => {
    if (!typeGuard.legacyOwner.comments(input)) throw new InvalidFormatError();
    return fromLegacyOwner(input);
  },
};

/**
 * 旧プレイヤーの投稿者コメントのエディターのデータを処理する
 * @param data 旧投米のテキストデータ
 * @returns 変換後のデータ
 */
const fromLegacyOwner = (data: string): FormattedComment[] => {
  const data_: FormattedComment[] = [],
    comments = data.split("\n");
  for (let i = 0, n = comments.length; i < n; i++) {
    const value = comments[i];
    if (!value) continue;
    const commentData = value.split(":");
    if (commentData.length < 3) {
      continue;
    } else if (commentData.length > 3) {
      for (let j = 3, n = commentData.length; j < n; j++) {
        commentData[2] += `:${commentData[j]}`;
      }
    }
    const tmpParam: FormattedComment = {
      id: i,
      vpos: Number(commentData[0]) * 100,
      content: commentData[2] ?? "",
      date: i,
      date_usec: 0,
      owner: true,
      premium: true,
      mail: [],
      user_id: -1,
      layer: -1,
      is_my_post: false,
    };
    if (commentData[1]) {
      tmpParam.mail = commentData[1].split(/[\s+]/g);
    }
    if (tmpParam.content.startsWith("/")) {
      tmpParam.mail.push("invisible");
    }
    data_.push(tmpParam);
  }
  return data_;
};
