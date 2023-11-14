import { array, custom, is, literal, regex, string, union } from "valibot";

import type {
  CommentMeasuredContentItem,
  HTML5Fonts,
  MeasureInput,
  MultiConfigItem,
  NicoScriptReplaceCondition,
  NicoScriptReplaceRange,
  NicoScriptReplaceTarget,
  NicoScriptReverseTarget,
  Options,
} from "@/@types/";
import {
  ZCommentMeasuredContentItem,
  ZHTML5Fonts,
  ZMeasureInput,
} from "@/@types/";
import { colors } from "@/definition/colors";

/**
 * 入力がBooleanかどうかを返す
 * @param i 入力
 * @returns 入力がBooleanかどうか
 */
const isBoolean = (i: unknown): i is boolean => typeof i === "boolean";

/**
 * 入力がNumberかどうかを返す
 * @param i 入力
 * @returns 入力がNumberかどうか
 */
const isNumber = (i: unknown): i is number => typeof i === "number";

/**
 * 入力がObjectかどうかを返す
 * @param i 入力
 * @returns 入力がObjectかどうか
 */
const isObject = (i: unknown): i is object => typeof i === "object";

const typeGuard = {
  xmlDocument: (i: unknown): i is XMLDocument => {
    if (
      !(i as XMLDocument).documentElement ||
      (i as XMLDocument).documentElement.nodeName !== "packet"
    )
      return false;
    if (!(i as XMLDocument).documentElement.children) return false;
    for (const element of Array.from(
      (i as XMLDocument).documentElement.children,
    )) {
      if (!element || element.nodeName !== "chat") continue;
      if (!typeAttributeVerify(element, ["vpos", "date"])) return false;
    }
    return true;
  },
  legacyOwner: {
    comments: (i: unknown): i is string =>
      is(
        string([
          custom((i) => {
            const lists = i.split(/\r\n|\r|\n/);
            for (const list of lists) {
              if (list.split(":").length < 3) {
                return false;
              }
            }
            return true;
          }),
        ]),
        i,
      ),
  },
  nicoScript: {
    range: {
      target: (i: unknown): i is NicoScriptReverseTarget =>
        is(string([regex(/^(?:\u6295?\u30b3\u30e1|\u5168)$/)]), i),
    },
    replace: {
      range: (i: unknown): i is NicoScriptReplaceRange =>
        is(string([regex(/^[\u5358\u5168]$/)]), i),
      target: (i: unknown): i is NicoScriptReplaceTarget =>
        is(
          string([
            regex(
              /^(?:\u30b3\u30e1|\u6295\u30b3\u30e1|\u5168|\u542b\u3080|\u542b\u307e\u306a\u3044)$/,
            ),
          ]),
          i,
        ),
      condition: (i: unknown): i is NicoScriptReplaceCondition =>
        is(
          string([
            regex(/^(?:\u90e8\u5206\u4e00\u81f4|\u5b8c\u5168\u4e00\u81f4)$/),
          ]),
          i,
        ),
    },
  },
  comment: {
    command: {
      key: (i: unknown): i is "full" | "ender" | "_live" | "invisible" =>
        is(
          union([
            literal("full"),
            literal("ender"),
            literal("_live"),
            literal("invisible"),
          ]),
          i,
        ),
    },
    color: (i: unknown): i is keyof typeof colors =>
      is(string([custom((i) => Object.keys(colors).includes(i))]), i),
    colorCodeAllowAlpha: (i: unknown): i is string =>
      is(
        string([
          regex(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/),
        ]),
        i,
      ),
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
          !!RegExp(
            /^(XMLDocument|niconicome|formatted|legacy|legacyOwner|owner|v1|default|empty)$/,
          ).exec(i),
        video: (i: unknown) =>
          typeof i === "object" && (i as HTMLVideoElement).nodeName === "VIDEO",
      };
      for (const key of Object.keys(keys)) {
        if (
          (item as { [key: string]: unknown })[key] !== undefined &&
          !(keys[key] as (i: unknown) => boolean)(
            (item as { [key: string]: unknown })[key],
          )
        ) {
          console.warn(
            `[Incorrect input] var: initOptions, key: ${key}, value: ${
              (item as { [key: string]: unknown })[key]
            }`,
          );
          return false;
        }
      }
      return true;
    },
  },
  internal: {
    CommentMeasuredContentItemArray: (
      i: unknown,
    ): i is CommentMeasuredContentItem[] =>
      is(array(ZCommentMeasuredContentItem), i),
    MultiConfigItem: <T>(i: unknown): i is MultiConfigItem<T> =>
      typeof i === "object" && objectVerify(i, ["html5", "flash"]),
    HTML5Fonts: (i: unknown): i is HTML5Fonts => is(ZHTML5Fonts, i),
    MeasureInput: (i: unknown): i is MeasureInput => is(ZMeasureInput, i),
  },
};

/**
 * オブジェクトのプロパティを確認する
 * @param item 確認するオブジェクト
 * @param keys 確認するプロパティ
 * @returns 要求したプロパティが全て存在するかどうか
 */
const objectVerify = (item: unknown, keys: string[]): boolean => {
  if (typeof item !== "object" || !item) return false;
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(item, key)) return false;
  }
  return true;
};

/**
 * Elementのプロパティを確認する
 * @param item 確認するElement
 * @param keys 確認するプロパティ
 * @returns 要求したプロパティが全て存在するかどうか
 */
const typeAttributeVerify = (item: unknown, keys: string[]): boolean => {
  if (typeof item !== "object" || !item) return false;
  for (const key of keys) {
    if ((item as Element).getAttribute(key) === null) return false;
  }
  return true;
};
export default typeGuard;
