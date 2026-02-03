import { describe, expect, it } from "vitest";

import type { RawApiResponse, V1Thread, Xml2jsPacket } from "@/@types";
import { LegacyParser } from "@/input/legacy";
import { V1Parser } from "@/input/v1";
import { Xml2jsParser } from "@/input/xml2js";
import { XmlDocumentParser } from "@/input/xmlDocument";

const parseTwice = <T>(parser: (input: T) => unknown, input: T) => {
  const first = parser(input);
  const second = parser(input);
  return { first, second };
};

describe("input parsers determinism", () => {
  it("legacy parser assigns stable user ids", () => {
    const input: RawApiResponse[] = [
      {
        chat: {
          no: 1,
          vpos: 10,
          content: "a",
          date: 1,
          user_id: "u1",
          premium: 0,
          mail: "",
        },
      },
      {
        chat: {
          no: 2,
          vpos: 20,
          content: "b",
          date: 2,
          user_id: "u2",
          premium: 0,
          mail: "",
        },
      },
      {
        chat: {
          no: 3,
          vpos: 30,
          content: "c",
          date: 3,
          user_id: "u1",
          premium: 0,
          mail: "",
        },
      },
    ];
    const { first, second } = parseTwice(LegacyParser.parse, input);
    const firstParsed = first as ReturnType<typeof LegacyParser.parse>;
    const secondParsed = second as ReturnType<typeof LegacyParser.parse>;
    expect(firstParsed.map((item) => item.user_id)).toEqual([0, 1, 0]);
    expect(secondParsed.map((item) => item.user_id)).toEqual([0, 1, 0]);
  });

  it("v1 parser assigns stable user ids", () => {
    const input: V1Thread[] = [
      {
        id: "thread-1",
        fork: "main",
        commentCount: 2,
        comments: [
          {
            id: "c1",
            no: 1,
            vposMs: 100,
            body: "a",
            commands: [],
            userId: "u1",
            isPremium: false,
            score: 0,
            postedAt: "2020-01-01T00:00:00Z",
            nicoruCount: 0,
            nicoruId: null,
            source: "",
            isMyPost: false,
          },
          {
            id: "c2",
            no: 2,
            vposMs: 200,
            body: "b",
            commands: [],
            userId: "u2",
            isPremium: false,
            score: 0,
            postedAt: "2020-01-01T00:00:01Z",
            nicoruCount: 0,
            nicoruId: null,
            source: "",
            isMyPost: false,
          },
        ],
      },
      {
        id: "thread-2",
        fork: "main",
        commentCount: 1,
        comments: [
          {
            id: "c3",
            no: 3,
            vposMs: 300,
            body: "c",
            commands: [],
            userId: "u1",
            isPremium: false,
            score: 0,
            postedAt: "2020-01-01T00:00:02Z",
            nicoruCount: 0,
            nicoruId: null,
            source: "",
            isMyPost: false,
          },
        ],
      },
    ];
    const { first, second } = parseTwice(V1Parser.parse, input);
    const firstParsed = first as ReturnType<typeof V1Parser.parse>;
    const secondParsed = second as ReturnType<typeof V1Parser.parse>;
    expect(firstParsed.map((item) => item.user_id)).toEqual([0, 1, 0]);
    expect(secondParsed.map((item) => item.user_id)).toEqual([0, 1, 0]);
  });

  it("xml2js parser assigns stable user ids", () => {
    const input: Xml2jsPacket = {
      packet: {
        chat: [
          {
            $: {
              no: "1",
              vpos: "10",
              date: "1",
              date_usec: "0",
              mail: "",
              user_id: "u1",
              premium: "0",
              owner: "0",
            },
            _: "a",
          },
          {
            $: {
              no: "2",
              vpos: "20",
              date: "2",
              date_usec: "0",
              mail: "",
              user_id: "u2",
              premium: "0",
              owner: "0",
            },
            _: "b",
          },
        ],
      },
    };
    const { first, second } = parseTwice(Xml2jsParser.parse, input);
    const firstParsed = first as ReturnType<typeof Xml2jsParser.parse>;
    const secondParsed = second as ReturnType<typeof Xml2jsParser.parse>;
    expect(firstParsed.map((item) => item.user_id)).toEqual([0, 1]);
    expect(secondParsed.map((item) => item.user_id)).toEqual([0, 1]);
  });

  it("xmlDocument parser assigns stable user ids", () => {
    const createChatElement = (
      attrs: Record<string, string>,
      textContent: string,
    ): Element =>
      ({
        nodeName: "chat",
        getAttribute: (name: string) => attrs[name] ?? null,
        textContent,
      }) as Element;
    const domInput = {
      documentElement: {
        nodeName: "packet",
        children: {
          length: 3,
          [Symbol.iterator]: function* () {
            yield createChatElement(
              {
                no: "1",
                vpos: "10",
                date: "1",
                date_usec: "0",
                mail: "",
                user_id: "u1",
                premium: "0",
              },
              "a",
            );
            yield createChatElement(
              {
                no: "2",
                vpos: "20",
                date: "2",
                date_usec: "0",
                mail: "",
                user_id: "u2",
                premium: "0",
              },
              "b",
            );
            yield createChatElement(
              {
                no: "3",
                vpos: "30",
                date: "3",
                date_usec: "0",
                mail: "",
                user_id: "u1",
                premium: "0",
              },
              "c",
            );
          },
        },
      },
    } as unknown as XMLDocument;
    const { first, second } = parseTwice(XmlDocumentParser.parse, domInput);
    const firstParsed = first as ReturnType<typeof XmlDocumentParser.parse>;
    const secondParsed = second as ReturnType<typeof XmlDocumentParser.parse>;
    expect(firstParsed.map((item) => item.user_id)).toEqual([0, 1, 0]);
    expect(secondParsed.map((item) => item.user_id)).toEqual([0, 1, 0]);
  });
});
