import {
  array,
  check,
  instance,
  is,
  literal,
  optional,
  pipe,
  regex,
  string,
  union,
} from "valibot";

import type {
  ApiChat,
  ApiGlobalNumRes,
  ApiLeaf,
  ApiPing,
  ApiThread,
  CommentFont,
  CommentLoc,
  CommentMeasuredContentItem,
  CommentSize,
  FormattedComment,
  FormattedLegacyComment,
  HTML5Fonts,
  MeasureInput,
  MultiConfigItem,
  NicoScriptReplaceCondition,
  NicoScriptReplaceRange,
  NicoScriptReplaceTarget,
  NicoScriptReverseTarget,
  Options,
  OwnerComment,
  RawApiResponse,
  V1Comment,
  V1Thread,
  Xml2jsChat,
  Xml2jsChatItem,
  Xml2jsPacket,
} from "@/@types/";
import {
  ZApiChat,
  ZApiGlobalNumRes,
  ZApiLeaf,
  ZApiPing,
  ZApiThread,
  ZCommentFont,
  ZCommentLoc,
  ZCommentMeasuredContentItem,
  ZCommentSize,
  ZFormattedComment,
  ZFormattedLegacyComment,
  ZHTML5Fonts,
  ZInputFormatType,
  ZMeasureInput,
  ZNicoScriptReplaceCondition,
  ZNicoScriptReplaceRange,
  ZNicoScriptReplaceTarget,
  ZNicoScriptReverseTarget,
  ZOwnerComment,
  ZRawApiResponse,
  ZV1Comment,
  ZV1Thread,
  ZXml2jsChat,
  ZXml2jsChatItem,
  ZXml2jsPacket,
} from "@/@types/";
import { colors } from "@/definition/colors";

const MAX_OPTION_SCALE = 8;
const MAX_CANVAS_DIMENSION = 8192;
const MAX_CANVAS_AREA = 16_777_216;
const MAX_FONT_SIZE = 512;
const MAX_LINE_HEIGHT = 16;
const MAX_COMMENT_LIMIT = 10_000;
const MAX_COMMENT_LINE_COUNT = 256;
const MAX_COMMENT_RANGE = 86_400_000;
const MAX_UNIX_TIME_SECONDS = 4_102_444_800;
const MAX_CONFIG_RATIO = 64;
const MAX_CONFIG_SPACING = 1024;
const COMMENT_SIZES = ["big", "medium", "small"] as const;
const RESIZED_KEYS = ["default", "resized"] as const;

/**
 * 入力がBooleanかどうかを返す
 * @param i 入力
 * @returns 入力がBooleanかどうか
 */
const isBoolean = (i: unknown): i is boolean => typeof i === "boolean";

const isRecord = (i: unknown): i is Record<string, unknown> =>
  typeof i === "object" && i !== null;

const isFiniteNumberInRange = (
  i: unknown,
  {
    min = 0,
    max,
    integer = false,
  }: { min?: number; max: number; integer?: boolean },
) =>
  typeof i === "number" &&
  Number.isFinite(i) &&
  i >= min &&
  i <= max &&
  (!integer || Number.isInteger(i));

const isValidOptionScale = (i: unknown): i is number =>
  isFiniteNumberInRange(i, { min: Number.MIN_VALUE, max: MAX_OPTION_SCALE });

const isMode = (i: unknown): boolean =>
  i === "default" || i === "html5" || i === "flash";

const isHideCommentOrder = (i: unknown): boolean => i === "asc" || i === "desc";

const isBoundedSpacing = (i: unknown): boolean =>
  isFiniteNumberInRange(i, { max: MAX_CONFIG_SPACING });

const isBoundedOffset = (i: unknown): boolean =>
  isFiniteNumberInRange(i, {
    min: -MAX_CONFIG_SPACING,
    max: MAX_CONFIG_SPACING,
  });

const hasConfigKeys = (
  item: Record<string, unknown>,
  keys: readonly string[],
): boolean => keys.every((key) => Object.hasOwn(item, key));

const isBoundedNumberConfigItem = (
  item: unknown,
  validate: (i: unknown) => boolean,
): boolean => {
  if (validate(item)) return true;
  if (!isRecord(item) || !hasConfigKeys(item, ["html5", "flash"])) {
    return false;
  }
  return validate(item.html5) && validate(item.flash);
};

const isBoundedResizedItem = (
  item: unknown,
  validate: (i: unknown) => boolean,
): boolean => {
  if (!isRecord(item) || !hasConfigKeys(item, RESIZED_KEYS)) return false;
  return RESIZED_KEYS.every((key) => validate(item[key]));
};

const isBoundedSizeItem = (
  item: unknown,
  validate: (i: unknown) => boolean,
): boolean => {
  if (!isRecord(item) || !hasConfigKeys(item, COMMENT_SIZES)) return false;
  return COMMENT_SIZES.every((size) => validate(item[size]));
};

const isBoundedFontSizeConfig = (item: unknown): boolean =>
  isBoundedNumberConfigItem(item, (value) =>
    isBoundedSizeItem(value, (sizeValue) =>
      isBoundedResizedItem(sizeValue, (resizedValue) =>
        isFiniteNumberInRange(resizedValue, {
          min: Number.MIN_VALUE,
          max: MAX_FONT_SIZE,
        }),
      ),
    ),
  );

const isBoundedLineHeightConfig = (item: unknown): boolean =>
  isBoundedNumberConfigItem(item, (value) =>
    isBoundedSizeItem(value, (sizeValue) =>
      isBoundedResizedItem(sizeValue, (resizedValue) =>
        isFiniteNumberInRange(resizedValue, {
          min: Number.MIN_VALUE,
          max: MAX_LINE_HEIGHT,
        }),
      ),
    ),
  );

const isBoundedLineCountsConfig = (item: unknown): boolean =>
  isBoundedNumberConfigItem(item, (value) => {
    if (
      !isRecord(value) ||
      !hasConfigKeys(value, ["default", "resized", "doubleResized"])
    ) {
      return false;
    }
    return ["default", "resized", "doubleResized"].every((key) =>
      isBoundedSizeItem(value[key], (count) =>
        isFiniteNumberInRange(count, {
          min: Number.MIN_VALUE,
          max: MAX_COMMENT_LINE_COUNT,
        }),
      ),
    );
  });

const isBoundedCommentStageSizeConfig = (item: unknown): boolean =>
  isBoundedNumberConfigItem(item, (value) => {
    if (
      !isRecord(value) ||
      !hasConfigKeys(value, ["width", "fullWidth", "height"])
    ) {
      return false;
    }
    return ["width", "fullWidth", "height"].every((key) =>
      isFiniteNumberInRange(value[key], {
        min: Number.MIN_VALUE,
        max: MAX_CANVAS_DIMENSION,
      }),
    );
  });

const isBoundedCollisionRange = (item: unknown): boolean =>
  isRecord(item) &&
  hasConfigKeys(item, ["left", "right"]) &&
  isFiniteNumberInRange(item.left, { max: MAX_CANVAS_DIMENSION }) &&
  isFiniteNumberInRange(item.right, { max: MAX_CANVAS_DIMENSION });

const isBoundedLineBreakCount = (item: unknown): boolean =>
  isBoundedSizeItem(item, (count) =>
    isFiniteNumberInRange(count, {
      min: 1,
      max: MAX_COMMENT_LINE_COUNT,
      integer: true,
    }),
  );

const isBoundedFlashDoubleResizeHeights = (item: unknown): boolean => {
  if (!isRecord(item)) return false;
  for (const size of Object.keys(item)) {
    if (!COMMENT_SIZES.includes(size as (typeof COMMENT_SIZES)[number])) {
      return false;
    }
    const heights = item[size];
    if (!isRecord(heights)) return false;
    for (const height of Object.values(heights)) {
      if (!isFiniteNumberInRange(height, { max: MAX_CANVAS_DIMENSION })) {
        return false;
      }
    }
  }
  return true;
};

const isValidPlugins = (item: unknown): boolean =>
  Array.isArray(item) &&
  item.every(
    (plugin) =>
      typeof plugin === "function" &&
      typeof (plugin as { id?: unknown }).id === "string",
  );

const isValidCommentPlugins = (item: unknown): boolean =>
  Array.isArray(item) &&
  item.every(
    (plugin) =>
      isRecord(plugin) &&
      typeof plugin.class === "function" &&
      typeof plugin.condition === "function",
  );

const isValidCommentLimit = (item: unknown): boolean =>
  item === undefined ||
  isFiniteNumberInRange(item, {
    max: MAX_COMMENT_LIMIT,
    integer: true,
  });

const isValidConfig = (item: unknown): boolean => {
  if (!isRecord(item)) return false;
  const validators: Record<string, (i: unknown) => boolean> = {
    cacheAge: (i) => isFiniteNumberInRange(i, { max: MAX_COMMENT_RANGE }),
    canvasHeight: (i) =>
      isFiniteNumberInRange(i, {
        min: 1,
        max: MAX_CANVAS_DIMENSION,
      }),
    canvasWidth: (i) =>
      isFiniteNumberInRange(i, {
        min: 1,
        max: MAX_CANVAS_DIMENSION,
      }),
    atButtonPadding: isBoundedSpacing,
    atButtonRadius: isBoundedSpacing,
    collisionPadding: isBoundedSpacing,
    collisionRange: isBoundedCollisionRange,
    commentDrawPadding: (i) =>
      isFiniteNumberInRange(i, { max: MAX_CANVAS_DIMENSION }),
    commentDrawRange: (i) =>
      isFiniteNumberInRange(i, { max: MAX_CANVAS_DIMENSION }),
    commentLimit: isValidCommentLimit,
    commentPlugins: isValidCommentPlugins,
    commentScale: (i) =>
      isBoundedNumberConfigItem(i, (value) =>
        isFiniteNumberInRange(value, {
          min: Number.MIN_VALUE,
          max: MAX_CONFIG_RATIO,
        }),
      ),
    commentStageSize: isBoundedCommentStageSizeConfig,
    contextLineWidth: (i) =>
      isBoundedNumberConfigItem(i, (value) =>
        isFiniteNumberInRange(value, { max: MAX_CONFIG_SPACING }),
      ),
    contextStrokeOpacity: (i) => isFiniteNumberInRange(i, { max: 1 }),
    contextFillLiveOpacity: (i) => isFiniteNumberInRange(i, { max: 1 }),
    flashLetterSpacing: (i) =>
      isFiniteNumberInRange(i, { max: MAX_CONFIG_SPACING }),
    flashCommentYPaddingTop: (i) => isBoundedResizedItem(i, isBoundedSpacing),
    flashCommentYOffset: (i) =>
      isBoundedSizeItem(i, (sizeValue) =>
        isBoundedResizedItem(sizeValue, isBoundedOffset),
      ),
    flashDoubleResizeHeights: isBoundedFlashDoubleResizeHeights,
    flashLineBreakScale: (i) =>
      isBoundedSizeItem(i, (value) =>
        isFiniteNumberInRange(value, {
          min: Number.MIN_VALUE,
          max: MAX_CONFIG_RATIO,
        }),
      ),
    flashScriptCharOffset: (i) =>
      isFiniteNumberInRange(i, { max: MAX_CONFIG_RATIO }),
    flashThreshold: (i) =>
      isFiniteNumberInRange(i, { max: MAX_UNIX_TIME_SECONDS }),
    fontSize: isBoundedFontSizeConfig,
    fpsInterval: (i) => isFiniteNumberInRange(i, { max: MAX_COMMENT_RANGE }),
    hideCommentOrder: isHideCommentOrder,
    html5HiResCommentCorrection: (i) =>
      isFiniteNumberInRange(i, { max: MAX_CONFIG_SPACING }),
    html5LineCounts: isBoundedLineCountsConfig,
    html5MinFontSize: (i) =>
      isFiniteNumberInRange(i, {
        min: Number.MIN_VALUE,
        max: MAX_FONT_SIZE,
      }),
    lineBreakCount: isBoundedLineBreakCount,
    lineHeight: isBoundedLineHeightConfig,
    nakaCommentSpeedOffset: (i) =>
      isFiniteNumberInRange(i, { max: MAX_CONFIG_RATIO }),
    plugins: isValidPlugins,
    sameCAGap: (i) => isFiniteNumberInRange(i, { max: MAX_COMMENT_RANGE }),
    sameCAMinScore: (i) =>
      isFiniteNumberInRange(i, { max: MAX_COMMENT_LIMIT, integer: true }),
    sameCARange: (i) => isFiniteNumberInRange(i, { max: MAX_COMMENT_RANGE }),
    sameCATimestampRange: (i) =>
      isFiniteNumberInRange(i, { max: MAX_COMMENT_RANGE }),
  };

  for (const [key, validator] of Object.entries(validators)) {
    if (Object.hasOwn(item, key) && !validator(item[key])) {
      console.warn(
        `[Incorrect input] var: initOptions.config, key: ${key}, value: ${item[key]}`,
      );
      return false;
    }
  }
  const width = item.canvasWidth;
  const height = item.canvasHeight;
  if (
    typeof width === "number" &&
    typeof height === "number" &&
    width * height > MAX_CANVAS_AREA
  ) {
    console.warn(
      `[Incorrect input] var: initOptions.config, key: canvasArea, value: ${
        width * height
      }`,
    );
    return false;
  }
  return true;
};

const typeGuard = {
  formatted: {
    comment: (i: unknown): i is FormattedComment => is(ZFormattedComment, i),
    comments: (i: unknown): i is FormattedComment[] =>
      is(array(ZFormattedComment), i),
    legacyComment: (i: unknown): i is FormattedLegacyComment =>
      is(ZFormattedLegacyComment, i),
    legacyComments: (i: unknown): i is FormattedLegacyComment[] =>
      is(array(ZFormattedLegacyComment), i),
  },
  legacy: {
    rawApiResponses: (i: unknown): i is RawApiResponse[] =>
      is(array(ZRawApiResponse), i),
    apiChat: (i: unknown): i is ApiChat => is(ZApiChat, i),
    apiGlobalNumRes: (i: unknown): i is ApiGlobalNumRes =>
      is(ZApiGlobalNumRes, i),
    apiLeaf: (i: unknown): i is ApiLeaf => is(ZApiLeaf, i),
    apiPing: (i: unknown): i is ApiPing => is(ZApiPing, i),
    apiThread: (i: unknown): i is ApiThread => is(ZApiThread, i),
  },
  xmlDocument: (i: unknown): i is XMLDocument => {
    if ((i as XMLDocument).documentElement?.nodeName !== "packet") return false;
    if (!(i as XMLDocument).documentElement.children) return false;
    for (const element of Array.from(
      (i as XMLDocument).documentElement.children,
    )) {
      if (element?.nodeName !== "chat") continue;
      if (!typeAttributeVerify(element, ["vpos", "date"])) return false;
    }
    return true;
  },
  xml2js: {
    packet: (i: unknown): i is Xml2jsPacket => is(ZXml2jsPacket, i),
    chat: (i: unknown): i is Xml2jsChat => is(ZXml2jsChat, i),
    chatItem: (i: unknown): i is Xml2jsChatItem => is(ZXml2jsChatItem, i),
  },
  legacyOwner: {
    comments: (i: unknown): i is string =>
      is(
        pipe(
          string(),
          check((i) => {
            const lists = i.split(/\r\n|\r|\n/);
            for (const list of lists) {
              if (list.split(":").length < 3) {
                return false;
              }
            }
            return true;
          }),
        ),
        i,
      ),
  },
  owner: {
    comment: (i: unknown): i is OwnerComment => is(ZOwnerComment, i),
    comments: (i: unknown): i is OwnerComment[] => is(array(ZOwnerComment), i),
  },
  v1: {
    comment: (i: unknown): i is V1Comment => is(ZV1Comment, i),
    comments: (i: unknown): i is V1Comment[] => is(array(ZV1Comment), i),
    thread: (i: unknown): i is V1Thread => is(ZV1Thread, i),
    threads: (i: unknown): i is V1Thread[] => is(array(ZV1Thread), i),
  },
  nicoScript: {
    range: {
      target: (i: unknown): i is NicoScriptReverseTarget =>
        is(ZNicoScriptReverseTarget, i),
    },
    replace: {
      range: (i: unknown): i is NicoScriptReplaceRange =>
        is(ZNicoScriptReplaceRange, i),
      target: (i: unknown): i is NicoScriptReplaceTarget =>
        is(ZNicoScriptReplaceTarget, i),
      condition: (i: unknown): i is NicoScriptReplaceCondition =>
        is(ZNicoScriptReplaceCondition, i),
    },
  },
  comment: {
    font: (i: unknown): i is CommentFont => is(ZCommentFont, i),
    loc: (i: unknown): i is CommentLoc => is(ZCommentLoc, i),
    size: (i: unknown): i is CommentSize => is(ZCommentSize, i),
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
      is(
        pipe(
          string(),
          check((i) => Object.keys(colors).includes(i)),
        ),
        i,
      ),
    colorCode: (i: unknown): i is string =>
      is(pipe(string(), regex(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6})$/)), i),
    colorCodeAllowAlpha: (i: unknown): i is string =>
      is(
        pipe(
          string(),
          regex(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/),
        ),
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
        lazy: isBoolean,
        mode: isMode,
        scale: isValidOptionScale,
        config: isValidConfig,
        format: (i) => is(ZInputFormatType, i),
        video: (i: unknown) => is(optional(instance(HTMLVideoElement)), i),
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
    CommentMeasuredContentItem: (i: unknown): i is CommentMeasuredContentItem =>
      is(ZCommentMeasuredContentItem, i),
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
    if (!Object.hasOwn(item, key)) return false;
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
