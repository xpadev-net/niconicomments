import { describe, expect, it } from "vitest";

import { InvalidFormatError } from "@/errors";
import convert2formattedComment from "@/inputParser";

type TestElement = {
  nodeName: string;
  textContent: string;
  getAttribute: (name: string) => string | null;
};

const createXmlElement = (
  attributes: Record<string, string>,
  content: string,
): TestElement => ({
  nodeName: "chat",
  textContent: content,
  getAttribute: (name) => attributes[name] ?? null,
});

const createXmlDocument = (children: TestElement[]): XMLDocument =>
  ({
    documentElement: {
      nodeName: "packet",
      children,
    },
  }) as XMLDocument;

describe("convert2formattedComment", () => {
  it.each([
    {
      type: "legacy" as const,
      expectedUserIds: [0, 1, 0, 2, 2],
      input: [
        { chat: { no: 1, vpos: 0, date: 1, user_id: "alice", content: "a" } },
        { chat: { no: 2, vpos: 1, date: 2, user_id: "bob", content: "b" } },
        { chat: { no: 3, vpos: 2, date: 3, user_id: "alice", content: "c" } },
        { chat: { no: 4, vpos: 3, date: 4, user_id: "", content: "d" } },
        { chat: { no: 5, vpos: 4, date: 5, user_id: "", content: "e" } },
      ],
    },
    {
      type: "v1" as const,
      expectedUserIds: [0, 1, 0],
      input: [
        {
          id: "thread",
          fork: "main",
          comments: [
            {
              id: "1",
              no: 1,
              vposMs: 0,
              body: "a",
              commands: [],
              userId: "alice",
              isPremium: false,
              score: 0,
              postedAt: "2024-01-01T00:00:01.000Z",
              nicoruCount: 0,
              nicoruId: null,
              source: "nicovideo",
              isMyPost: false,
            },
            {
              id: "2",
              no: 2,
              vposMs: 10,
              body: "b",
              commands: [],
              userId: "bob",
              isPremium: false,
              score: 0,
              postedAt: "2024-01-01T00:00:02.000Z",
              nicoruCount: 0,
              nicoruId: null,
              source: "nicovideo",
              isMyPost: false,
            },
            {
              id: "3",
              no: 3,
              vposMs: 20,
              body: "c",
              commands: [],
              userId: "alice",
              isPremium: false,
              score: 0,
              postedAt: "2024-01-01T00:00:03.000Z",
              nicoruCount: 0,
              nicoruId: null,
              source: "nicovideo",
              isMyPost: false,
            },
          ],
        },
      ],
    },
    {
      type: "xml2js" as const,
      expectedUserIds: [0, 1, 0, 2, 2],
      input: {
        packet: {
          chat: [
            { _: "a", $: { no: "1", vpos: "0", date: "1", user_id: "alice" } },
            { _: "b", $: { no: "2", vpos: "1", date: "2", user_id: "bob" } },
            { _: "c", $: { no: "3", vpos: "2", date: "3", user_id: "alice" } },
            { _: "d", $: { no: "4", vpos: "3", date: "4" } },
            { _: "e", $: { no: "5", vpos: "4", date: "5" } },
          ],
        },
      },
    },
    {
      type: "XMLDocument" as const,
      expectedUserIds: [0, 1, 0, 2, 2],
      input: createXmlDocument([
        createXmlElement(
          { no: "1", vpos: "0", date: "1", user_id: "alice" },
          "a",
        ),
        createXmlElement(
          { no: "2", vpos: "1", date: "2", user_id: "bob" },
          "b",
        ),
        createXmlElement(
          { no: "3", vpos: "2", date: "3", user_id: "alice" },
          "c",
        ),
        createXmlElement({ no: "4", vpos: "3", date: "4" }, "d"),
        createXmlElement({ no: "5", vpos: "4", date: "5" }, "e"),
      ]),
    },
  ])("assigns stable user_id values for $type input", ({
    expectedUserIds,
    input,
    type,
  }) => {
    const output = convert2formattedComment(input, type);

    expect(output.map((comment) => comment.user_id)).toEqual(expectedUserIds);
  });

  it("routes XMLDocument input through the XML parser for XMLDocument and niconicome", () => {
    const xmlDocument = createXmlDocument([
      createXmlElement(
        { no: "1", vpos: "0", date: "1", user_id: "alice" },
        "xml",
      ),
    ]);

    expect(convert2formattedComment(xmlDocument, "XMLDocument")).toMatchObject([
      { id: 1, content: "xml", user_id: 0, owner: false },
    ]);
    expect(convert2formattedComment(xmlDocument, "niconicome")).toMatchObject([
      { id: 1, content: "xml", user_id: 0, owner: false },
    ]);
  });

  it("keeps formatted and niconicome array input on the formatted parser path", () => {
    const formattedArray = [
      {
        id: 1,
        vpos: 0,
        content: "array",
        date: 1,
        date_usec: 0,
        owner: false,
        premium: false,
        mail: [],
        user_id: 99,
        layer: -1,
        is_my_post: false,
      },
    ];

    expect(convert2formattedComment(formattedArray, "formatted")).toMatchObject(
      [{ id: 1, content: "array", user_id: 99 }],
    );
    expect(
      convert2formattedComment(formattedArray, "niconicome"),
    ).toMatchObject([{ id: 1, content: "array", user_id: 99 }]);
  });

  it.each([
    Number.NaN,
    Infinity,
    -Infinity,
  ])("rejects non-finite formatted vpos %s", (vpos) => {
    expect(() =>
      convert2formattedComment(
        [
          {
            id: 1,
            vpos,
            content: "bad",
            date: 1,
            date_usec: 0,
            owner: false,
            premium: false,
            mail: [],
            user_id: 1,
            layer: -1,
            is_my_post: false,
          },
        ],
        "formatted",
      ),
    ).toThrow();
  });

  it("accepts negative finite formatted vpos values", () => {
    const output = convert2formattedComment(
      [
        {
          id: 1,
          vpos: -9200,
          content: "early",
          date: 1,
          date_usec: 0,
          owner: false,
          premium: false,
          mail: [],
          user_id: 1,
          layer: -1,
          is_my_post: false,
        },
      ],
      "formatted",
    );

    expect(output).toMatchObject([{ id: 1, vpos: -9200, content: "early" }]);
  });

  it("drops malformed legacy API chat items while keeping valid comments", () => {
    const output = convert2formattedComment(
      [
        { chat: { no: 1, vpos: 10, date: 1, user_id: "alice", content: "ok" } },
        {
          chat: {
            no: 2,
            vpos: Infinity,
            date: 1,
            user_id: "bob",
            content: "bad vpos",
          },
        },
        {
          chat: {
            no: Number.NaN,
            vpos: 20,
            date: 1,
            user_id: "carol",
            content: "bad id",
          },
        },
        {
          chat: {
            no: 3,
            vpos: 30,
            date_usec: Infinity,
            date: 1,
            user_id: "dave",
            content: "bad date_usec",
          },
        },
      ],
      "legacy",
    );

    expect(output).toMatchObject([{ id: 1, vpos: 10, content: "ok" }]);
  });

  it("rejects non-finite v1 numeric fields and drops invalid postedAt comments", () => {
    const validComment = {
      id: "1",
      no: 1,
      vposMs: 100,
      body: "ok",
      commands: [],
      userId: "alice",
      isPremium: false,
      score: 0,
      postedAt: "2024-01-01T00:00:01.000Z",
      nicoruCount: 0,
      nicoruId: null,
      source: "nicovideo",
      isMyPost: false,
    };

    expect(() =>
      convert2formattedComment(
        [
          {
            id: "thread",
            fork: "main",
            comments: [{ ...validComment, vposMs: Infinity }],
          },
        ],
        "v1",
      ),
    ).toThrow();

    expect(
      convert2formattedComment(
        [
          {
            id: "thread",
            fork: "main",
            comments: [
              validComment,
              { ...validComment, id: "2", no: 2, postedAt: "not-a-date" },
            ],
          },
        ],
        "v1",
      ),
    ).toMatchObject([{ id: 1, vpos: 10, content: "ok" }]);
  });

  it("drops malformed XMLDocument chat items while keeping valid comments", () => {
    const output = convert2formattedComment(
      createXmlDocument([
        createXmlElement({ no: "1", vpos: "10", date: "1" }, "ok"),
        createXmlElement({ no: "2", vpos: "Infinity", date: "1" }, "bad"),
        createXmlElement({ no: "3", vpos: "20", date: "NaN" }, "bad"),
        createXmlElement(
          { no: "4", vpos: "30", date: "1", date_usec: "1000000" },
          "bad",
        ),
      ]),
      "XMLDocument",
    );

    expect(output).toMatchObject([{ id: 1, vpos: 10, content: "ok" }]);
  });

  it("keeps negative finite XML vpos values", () => {
    expect(
      convert2formattedComment(
        createXmlDocument([
          createXmlElement({ no: "1", vpos: "-9200", date: "1" }, "early"),
        ]),
        "XMLDocument",
      ),
    ).toMatchObject([{ id: 1, vpos: -9200, content: "early" }]);

    expect(
      convert2formattedComment(
        {
          packet: {
            chat: [{ _: "early", $: { no: "1", vpos: "-9200", date: "1" } }],
          },
        },
        "xml2js",
      ),
    ).toMatchObject([{ id: 1, vpos: -9200, content: "early" }]);
  });

  it("drops malformed xml2js chat items while keeping valid comments", () => {
    const output = convert2formattedComment(
      {
        packet: {
          chat: [
            { _: "ok", $: { no: "1", vpos: "10", date: "1" } },
            { _: "bad", $: { no: "2", vpos: "NaN", date: "1" } },
            { _: "bad", $: { no: "3", vpos: "20", date: "Infinity" } },
            {
              _: "bad",
              $: { no: "4", vpos: "30", date: "1", date_usec: "nonsense" },
            },
          ],
        },
      },
      "xml2js",
    );

    expect(output).toMatchObject([{ id: 1, vpos: 10, content: "ok" }]);
  });

  it("drops legacy owner text lines with malformed time fields", () => {
    const output = convert2formattedComment(
      "10:ue:ok\nNaN:ue:bad\nInfinity:ue:bad\nabc:ue:bad",
      "legacyOwner",
    );

    expect(output).toMatchObject([{ id: 0, vpos: 1000, content: "ok" }]);
  });

  it("drops owner comments with malformed time fields", () => {
    const output = convert2formattedComment(
      [
        { time: "1:23.45", command: "ue", comment: "ok" },
        { time: "abc", command: "ue", comment: "bad" },
        { time: "Infinity", command: "ue", comment: "bad" },
        { time: "9".repeat(400), command: "ue", comment: "bad" },
      ],
      "owner",
    );

    expect(output).toMatchObject([{ id: 0, vpos: 8345, content: "ok" }]);
  });

  it("keeps first-seen user_id assignment stable after the final sort", () => {
    const output = convert2formattedComment(
      [
        { chat: { no: 1, vpos: 20, date: 3, user_id: "bob", content: "late" } },
        {
          chat: {
            no: 2,
            vpos: 10,
            date: 2,
            user_id: "alice",
            content: "middle",
          },
        },
        { chat: { no: 3, vpos: 0, date: 1, user_id: "bob", content: "early" } },
      ],
      "legacy",
    );

    expect(output.map((comment) => comment.id)).toEqual([3, 2, 1]);
    expect(output.map((comment) => comment.user_id)).toEqual([0, 1, 0]);
  });

  it("rejects XMLDocument input for the formatted array parser", () => {
    const xmlDocument = createXmlDocument([
      createXmlElement(
        { no: "1", vpos: "0", date: "1", user_id: "alice" },
        "xml",
      ),
    ]);

    expect(() => convert2formattedComment(xmlDocument, "formatted")).toThrow();
  });

  it("throws InvalidFormatError for invalid XMLDocument-like input", () => {
    expect(() => convert2formattedComment(null, "XMLDocument")).toThrow(
      InvalidFormatError,
    );
    expect(() =>
      convert2formattedComment(
        {
          documentElement: {
            nodeName: "packet",
            children: [{ nodeName: "chat" }],
          },
        } as XMLDocument,
        "XMLDocument",
      ),
    ).toThrow(InvalidFormatError);
  });
});
