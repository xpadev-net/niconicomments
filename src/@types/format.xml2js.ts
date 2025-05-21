import type { InferOutput } from "valibot";
import { array, object, optional, string } from "valibot";

export const ZXml2jsChatItem = object({
  _: string(),
  $: object({
    no: optional(string()),
    vpos: string(),
    date: optional(string(), "0"),
    date_usec: optional(string(), "0"),
    user_id: optional(string()),
    owner: optional(string(), ""),
    premium: optional(string(), ""),
    mail: optional(string(), ""),
  }),
});
export type Xml2jsChatItem = InferOutput<typeof ZXml2jsChatItem>;

export const ZXml2jsChat = object({
  chat: array(ZXml2jsChatItem),
});
export type Xml2jsChat = InferOutput<typeof ZXml2jsChat>;

export const ZXml2jsPacket = object({
  packet: ZXml2jsChat,
});
export type Xml2jsPacket = InferOutput<typeof ZXml2jsPacket>;
