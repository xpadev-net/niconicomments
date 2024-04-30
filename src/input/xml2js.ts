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
  const userList: string[] = [];
  let index = data.packet.chat.length;
  for (const item of data.packet.chat) {
    const tmpParam: FormattedComment = {
      id: Number(item.$.no) || index++,
      vpos: Number(item.$.vpos),
      content: item._,
      date: Number(item.$.date),
      date_usec: Number(item.$.date_usec),
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
