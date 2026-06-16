import { parse } from "valibot";

import {
  type FormattedComment,
  type InputParser,
  toFiniteNumberInRange,
  type Xml2jsPacket,
} from "@/@types";
import { ZXml2jsPacket } from "@/@types/";

import { assignUserId } from "./xmlDocument";

export const Xml2jsParser: InputParser = {
  key: ["xml2js"],
  parse: (input) => {
    return fromXml2js(parse(ZXml2jsPacket, input));
  },
};

const fromXml2js = (data: Xml2jsPacket): FormattedComment[] => {
  const data_: FormattedComment[] = [];
  const userIdMap = new Map<string, number>();
  let index = data.packet.chat.length;
  for (const item of data.packet.chat) {
    const rawNo = item.$.no;
    const id =
      rawNo === undefined
        ? index++
        : (toFiniteNumberInRange(rawNo) ?? undefined);
    const vpos = toFiniteNumberInRange(item.$.vpos, {
      min: Number.MIN_SAFE_INTEGER,
    });
    const date = toFiniteNumberInRange(item.$.date);
    const dateUsec = toFiniteNumberInRange(item.$.date_usec, {
      max: 999_999,
    });
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
      content: item._,
      date,
      date_usec: dateUsec,
      owner: !(item.$.owner === "0" || item.$.user_id),
      premium: item.$.premium === "1",
      mail: item.$.mail.split(/\s+/g),
      user_id: -1,
      layer: -1,
      is_my_post: false,
    };
    if (tmpParam.content.startsWith("/") && tmpParam.owner) {
      tmpParam.mail.push("invisible");
    }
    tmpParam.user_id = assignUserId(userIdMap, item.$.user_id ?? "");
    data_.push(tmpParam);
  }
  return data_;
};
