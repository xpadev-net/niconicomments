import { parse } from "valibot";

import type { FormattedComment, InputParser, Xml2jsPacket } from "@/@types";
import { ZXml2jsPacket } from "@/@types/";

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
    const tmpParam: FormattedComment = {
      id: Number(item.$.no) || index++,
      vpos: Number(item.$.vpos) || 0,
      content: item._,
      date: Number(item.$.date) || 0,
      date_usec: Number(item.$.date_usec) || 0,
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
    const userId = item.$.user_id ?? "";
    const existingUserId = userIdMap.get(userId);
    if (existingUserId === undefined) {
      tmpParam.user_id = userIdMap.size;
      userIdMap.set(userId, tmpParam.user_id);
    } else {
      tmpParam.user_id = existingUserId;
    }
    data_.push(tmpParam);
  }
  return data_;
};
