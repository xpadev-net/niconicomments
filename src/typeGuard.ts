import { colors } from "@/definition/colors";

import type {
  formattedComment,
  formattedLegacyComment,
} from "@/@types/format.formatted";
import type {
  apiChat,
  apiGlobalNumRes,
  apiLeaf,
  apiPing,
  apiThread,
  rawApiResponse,
} from "@/@types/format.legacy";
import type { ownerComment } from "@/@types/format.owner";
import type { v1Comment, v1Thread } from "@/@types/format.v1";
import type {
  commentFont,
  commentLoc,
  commentSize,
  nicoScriptReplaceCondition,
  nicoScriptReplaceRange,
  nicoScriptReplaceTarget,
  nicoScriptReverseTarget,
} from "@/@types/types";
import type { Options } from "@/@types/options";

const isBoolean = (i: unknown): i is boolean => typeof i === "boolean";
const isNumber = (i: unknown): i is number => typeof i === "number";
const isObject = (i: unknown): i is object => typeof i === "object";

const typeGuard = {
  formatted: {
    comment: (i: unknown): i is formattedComment =>
      objectVerify(i, [
        "id",
        "vpos",
        "content",
        "date",
        "date_usec",
        "owner",
        "premium",
        "mail",
        "user_id",
        "layer",
      ]),
    comments: (i: unknown): i is formattedComment[] => {
      if (typeof i !== "object") return false;
      for (const item of i as formattedComment[]) {
        if (!typeGuard.formatted.comment(item)) return false;
      }
      return true;
    },
    legacyComment: (i: unknown): i is formattedLegacyComment =>
      objectVerify(i, [
        "id",
        "vpos",
        "content",
        "date",
        "owner",
        "premium",
        "mail",
      ]),
    legacyComments: (i: unknown): i is formattedLegacyComment[] => {
      if (typeof i !== "object") return false;
      for (const item of i as formattedLegacyComment[]) {
        if (!typeGuard.formatted.legacyComment(item)) return false;
      }
      return true;
    },
  },
  legacy: {
    rawApiResponses: (i: unknown): i is rawApiResponse[] => {
      if (typeof i !== "object") return false;
      for (const itemWrapper of i as rawApiResponse[]) {
        for (const key of Object.keys(itemWrapper)) {
          const item = itemWrapper[key];
          if (!item) continue;
          if (
            !(
              typeGuard.legacy.apiChat(item) ||
              typeGuard.legacy.apiGlobalNumRes(item) ||
              typeGuard.legacy.apiLeaf(item) ||
              typeGuard.legacy.apiPing(item) ||
              typeGuard.legacy.apiThread(item)
            )
          ) {
            return false;
          }
        }
      }
      return true;
    },
    apiChat: (i: unknown): i is apiChat =>
      typeof i === "object" &&
      objectVerify(i as apiChat, ["content", "date", "no", "thread", "vpos"]),
    apiGlobalNumRes: (i: unknown): i is apiGlobalNumRes =>
      objectVerify(i, ["num_res", "thread"]),
    apiLeaf: (i: unknown): i is apiLeaf => objectVerify(i, ["count", "thread"]),
    apiPing: (i: unknown): i is apiPing => objectVerify(i, ["content"]),
    apiThread: (i: unknown): i is apiThread =>
      objectVerify(i, [
        "resultcode",
        "revision",
        "server_time",
        "thread",
        "ticket",
      ]),
  },
  xmlDocument: (i: unknown): i is XMLDocument => {
    if (
      !(i as XMLDocument).documentElement ||
      (i as XMLDocument).documentElement.nodeName !== "packet"
    )
      return false;
    if (!(i as XMLDocument).documentElement.children) return false;
    for (
      let index = 0;
      index < (i as XMLDocument).documentElement.children.length;
      index++
    ) {
      const value = (i as XMLDocument).documentElement.children[index];
      if (!value || value.nodeName !== "chat") continue;
      if (!typeAttributeVerify(value, ["no", "vpos", "date", "date_usec"]))
        return false;
    }
    return true;
  },
  legacyOwner: {
    comments: (i: unknown): i is string => {
      if (typeof i !== "string") return false;
      const lists = i.split("\n");
      for (const list of lists) {
        if (list.split(":").length < 3) {
          return false;
        }
      }
      return true;
    },
  },
  owner: {
    comment: (i: unknown): i is ownerComment =>
      objectVerify(i, ["time", "command", "comment"]),
    comments: (i: unknown): i is ownerComment[] => {
      if (typeof i !== "object") return false;
      for (const item of i as ownerComment[]) {
        if (!typeGuard.owner.comment(item)) return false;
      }
      return true;
    },
  },
  v1: {
    comment: (i: unknown): i is v1Comment =>
      objectVerify(i, [
        "id",
        "no",
        "vposMs",
        "body",
        "commands",
        "userId",
        "isPremium",
        "score",
        "postedAt",
        "nicoruCount",
        "nicoruId",
        "source",
        "isMyPost",
      ]),
    thread: (i: unknown): i is v1Thread => {
      if (!objectVerify(i, ["id", "fork", "commentCount", "comments"]))
        return false;
      for (const item of Object.keys((i as v1Thread).comments)) {
        if (!typeGuard.v1.comment((i as v1Thread).comments[item])) return false;
      }
      return true;
    },
    threads: (i: unknown): i is v1Thread[] => {
      if (typeof i !== "object") return false;
      for (const item of i as v1Thread[]) {
        if (!typeGuard.v1.thread(item)) return false;
      }
      return true;
    },
  },

  nicoScript: {
    range: {
      target: (i: unknown): i is nicoScriptReverseTarget =>
        typeof i === "string" && !!i.match(/^(?:\u6295?\u30b3\u30e1|\u5168)$/),
    },
    replace: {
      range: (i: unknown): i is nicoScriptReplaceRange =>
        typeof i === "string" && !!i.match(/^(?:\u5358|\u5168)$/),
      target: (i: unknown): i is nicoScriptReplaceTarget =>
        typeof i === "string" &&
        !!i.match(
          /^(?:\u30b3\u30e1|\u6295\u30b3\u30e1|\u5168|\u542b\u3080|\u542b\u307e\u306a\u3044)$/
        ),
      condition: (i: unknown): i is nicoScriptReplaceCondition =>
        typeof i === "string" &&
        !!i.match(/^(?:\u90e8\u5206\u4e00\u81f4|\u5b8c\u5168\u4e00\u81f4)$/),
    },
  },
  comment: {
    font: (i: unknown): i is commentFont =>
      typeof i === "string" && !!i.match(/^(?:gothic|mincho|defont)$/),
    loc: (i: unknown): i is commentLoc =>
      typeof i === "string" && !!i.match(/^(?:ue|naka|shita)$/),
    size: (i: unknown): i is commentSize =>
      typeof i === "string" && !!i.match(/^(?:big|medium|small)$/),
    command: {
      key: (i: unknown): i is "full" | "ender" | "_live" | "invisible" =>
        typeof i === "string" && !!i.match(/^(?:full|ender|_live|invisible)$/),
    },
    color: (i: unknown): i is keyof typeof colors =>
      typeof i === "string" && Object.keys(colors).includes(i),
    colorCode: (i: unknown): i is string =>
      typeof i === "string" &&
      !!i.match(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/),
  },

  config: {
    initOptions: (item: unknown): item is Options => {
      if (typeof item !== "object" || !item) return false;
      const keys: { [key: string]: (i: unknown) => boolean } = {
        useLegacy: isBoolean,
        formatted: isBoolean,
        showCollision: isBoolean,
        showFPS: isBoolean,
        showCommentCount: isBoolean,
        drawAllImageOnLoad: isBoolean,
        debug: isBoolean,
        enableLegacyPiP: isBoolean,
        keepCA: isBoolean,
        scale: isNumber,
        config: isObject,
        format: (i: unknown) =>
          typeof i === "string" &&
          !!i.match(
            /^(niconicome|formatted|legacy|legacyOwner|owner|v1|default|empty)$/
          ),
        video: (i: unknown) =>
          typeof i === "object" && (i as HTMLVideoElement).nodeName === "VIDEO",
      };
      for (const key in keys) {
        if (
          (item as { [key: string]: unknown })[key] !== undefined &&
          !(keys[key] as (i: unknown) => boolean)(
            (item as { [key: string]: unknown })[key]
          )
        ) {
          console.warn(
            `[Incorrect input] var: initOptions, key: ${key}, value: ${
              (item as { [key: string]: unknown })[key]
            }`
          );
          return false;
        }
      }
      return true;
    },
  },
};

const objectVerify = (item: unknown, keys: string[]): boolean => {
  if (typeof item !== "object" || !item) return false;
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(item, key)) return false;
  }
  return true;
};
const typeAttributeVerify = (item: unknown, keys: string[]): boolean => {
  if (typeof item !== "object" || !item) return false;
  for (const key of keys) {
    if ((item as Element).getAttribute(key) === null) return false;
  }
  return true;
};
export default typeGuard;
