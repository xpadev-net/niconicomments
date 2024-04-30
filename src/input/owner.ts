import { array, parse } from "valibot";

import type { InputParser } from "@/@types";
import {
  type FormattedComment,
  type OwnerComment,
  ZOwnerComment,
} from "@/@types";

export const OwnerParser: InputParser = {
  key: ["owner"],
  parse: (input) => {
    return fromOwner(parse(array(ZOwnerComment), input));
  },
};

/**
 * 投稿者コメントのエディターのデータを処理する
 * @param data 投米のデータ
 * @returns 変換後のデータ
 */
const fromOwner = (data: OwnerComment[]): FormattedComment[] => {
  const data_: FormattedComment[] = [];
  for (let i = 0, n = data.length; i < n; i++) {
    const value = data[i];
    if (!value) continue;
    const tmpParam: FormattedComment = {
      id: i,
      vpos: time2vpos(value.time),
      content: value.comment,
      date: i,
      date_usec: 0,
      owner: true,
      premium: true,
      mail: [],
      user_id: -1,
      layer: -1,
      is_my_post: false,
    };
    if (value.command) {
      tmpParam.mail = value.command.split(/\s+/g);
    }
    if (tmpParam.content.startsWith("/")) {
      tmpParam.mail.push("invisible");
    }
    data_.push(tmpParam);
  }
  return data_;
};

/**
 * 投稿者コメントのエディターは秒数の入力フォーマットに割りと色々対応しているのでvposに変換
 * @param input 分:秒.秒・分:秒・秒.秒・秒
 * @returns vpos
 */
const time2vpos = (input: string): number => {
  const time = RegExp(
    /^(?:(\d+):(\d+)\.(\d+)|(\d+):(\d+)|(\d+)\.(\d+)|(\d+))$/,
  ).exec(input);
  if (time) {
    if (
      time[1] !== undefined &&
      time[2] !== undefined &&
      time[3] !== undefined
    ) {
      return (
        (Number(time[1]) * 60 + Number(time[2])) * 100 +
        Number(time[3]) / 10 ** (time[3].length - 2)
      );
    }
    if (time[4] !== undefined && time[5] !== undefined) {
      return (Number(time[4]) * 60 + Number(time[5])) * 100;
    }
    if (time[6] !== undefined && time[7] !== undefined) {
      return (
        Number(time[6]) * 100 + Number(time[7]) / 10 ** (time[7].length - 2)
      );
    }
    if (time[8] !== undefined) {
      return Number(time[8]) * 100;
    }
  }
  return 0;
};
