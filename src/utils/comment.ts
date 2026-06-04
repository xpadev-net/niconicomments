import { is } from "valibot";

import type {
  BaseConfig,
  BaseOptions,
  Collision,
  CollisionItem,
  CommentFont,
  CommentLoc,
  CommentSize,
  DefaultCommand,
  FormattedComment,
  FormattedCommentWithSize,
  IComment,
  MeasureTextInput,
  NicoScript,
  NicoScriptReplace,
  ParseCommandAndNicoScriptResult,
  ParsedCommand,
  Timeline,
} from "@/@types/";
import { ZCommentFont, ZCommentLoc, ZCommentSize } from "@/@types/";
import type { CommentInstanceContext } from "@/contexts/";
import { colors } from "@/definition/colors";
import typeGuard from "@/typeGuard";

import { arrayPush } from "./array";
import { getConfig } from "./config";
import type { RangeCacheContext } from "./rangeCache";

export { RangeCacheContext } from "./rangeCache";

const RE_QUOTE_START = /^["'「]$/;
const RE_QUOTE_END = /^["']$/;
const RE_WHITESPACE = /^\s+$/;
const RE_NICOSCRIPT = /^[@＠](\S+)(?:\s(.+))?/;
const RE_REVERSE = /^[@＠]逆(?:\s+)?(全|コメ|投コメ)?/;
const RE_JUMP =
  /\s*((?:sm|so|nm|ｓｍ|ｓｏ|ｎｍ)?[1-9１-９][0-9１-９]*|#[0-9]+:[0-9]+(?:\.[0-9]+)?)\s+(.*)/;
const RE_BUTTON_CONTENT =
  /^(?:(?<before>.*?)\[)?(?<body>.*?)(?:\](?<after>[^\]]*?))?$/su;
const RE_LONG = /^[@＠]([0-9.]+)/;
const RE_STROKE = /^nico:stroke:(.+)$/;
const RE_WAKU = /^nico:waku:(.+)$/;
const RE_FILL = /^nico:fill:(.+)$/;
const RE_OPACITY = /^nico:opacity:(.+)$/;
const RE_COLOR_CODE = /^#(?:[0-9a-z]{3}|[0-9a-z]{6})$/;
export const DEFAULT_COMMENT_LONG = 300;
export const DEFAULT_NICOSCRIPT_LONG = 30 * 100;
export const MAX_COMMENT_LONG = 120 * 100;
export const MAX_NICOSCRIPT_LONG = 60 * 60 * 100;
export const MAX_AT_BUTTON_COMMAND_CHARS = 16_384;
export const MAX_AT_BUTTON_TEXT_CHARS = 4096;
export const MAX_AT_BUTTON_MAIL_ENTRIES = 16;
export const MAX_AT_BUTTON_MAIL_CHARS = 64;
export const MAX_AT_BUTTON_LIMIT = 100;
export const MAX_PARSED_COMMAND_MAIL_ENTRIES = 64;
export const MAX_PARSED_COMMAND_MAIL_CHARS = 128;
export const MAX_NICOSCRIPT_COMMAND_CHARS = 16_384;
export const MAX_NICOSCRIPT_TEXT_CHARS = 4096;
const LAZY_LOOKAHEAD_LEAD_IN = 288;
const LAZY_LOOKAHEAD_MOTION_MARGIN = 125;
const LAZY_LOOKAHEAD_SAFETY_BUFFER = 100;
const STANDARD_LAZY_LOOKAHEAD_CANVAS_WIDTH = 1920;
const STANDARD_LAZY_LOOKAHEAD_TRAVEL_WIDTH = 1632;
// Derived from the maximum naka comment lead-in distance:
// 288px off-screen travel, 1632px total travel width, plus 125cs motion margin
// and a 100cs safety buffer to populate the lazy timeline before draw time.
export const MAX_LAZY_COMMENT_LOOKAHEAD =
  Math.ceil(
    (LAZY_LOOKAHEAD_LEAD_IN *
      (MAX_COMMENT_LONG + LAZY_LOOKAHEAD_MOTION_MARGIN)) /
      STANDARD_LAZY_LOOKAHEAD_TRAVEL_WIDTH,
  ) + LAZY_LOOKAHEAD_SAFETY_BUFFER;

export const getLazyCommentLookahead = (canvasWidth: number) => {
  if (!Number.isFinite(canvasWidth) || canvasWidth <= 0) {
    return MAX_LAZY_COMMENT_LOOKAHEAD;
  }
  return (
    Math.ceil(
      (LAZY_LOOKAHEAD_LEAD_IN *
        (MAX_COMMENT_LONG + LAZY_LOOKAHEAD_MOTION_MARGIN) *
        (STANDARD_LAZY_LOOKAHEAD_CANVAS_WIDTH / canvasWidth)) /
        STANDARD_LAZY_LOOKAHEAD_TRAVEL_WIDTH,
    ) + LAZY_LOOKAHEAD_SAFETY_BUFFER
  );
};

const normalizeLongCentiseconds = (value: number, max: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.min(Math.floor(value), max);
};

const normalizeCommentLong = (value: number | undefined) => {
  if (value === undefined) {
    return DEFAULT_COMMENT_LONG;
  }
  return (
    normalizeLongCentiseconds(value * 100, MAX_COMMENT_LONG) ||
    DEFAULT_COMMENT_LONG
  );
};

const normalizeParsedCommandLong = (value: number | undefined) => {
  if (value === undefined) {
    return undefined;
  }
  if (!Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return value;
};

const normalizeOptionalNicoscriptLong = (value: number | undefined) => {
  if (value === undefined) {
    return undefined;
  }
  return (
    normalizeLongCentiseconds(value * 100, MAX_NICOSCRIPT_LONG) || undefined
  );
};

const normalizeNicoscriptLong = (value: number | undefined) => {
  if (value === undefined) {
    return DEFAULT_NICOSCRIPT_LONG;
  }
  return (
    normalizeLongCentiseconds(value * 100, MAX_NICOSCRIPT_LONG) ||
    DEFAULT_NICOSCRIPT_LONG
  );
};

const clampString = (value: string, maxLength: number) =>
  value.length > maxLength ? value.slice(0, maxLength) : value;

const takeButtonText = (
  value: string | undefined,
  remaining: { value: number },
) => {
  if (!value || remaining.value <= 0) return "";
  const text = clampString(value, remaining.value);
  remaining.value -= text.length;
  return text;
};

const normalizeAtButtonLimit = (value: string | undefined) => {
  const limit = Number(value ?? 1);
  if (!Number.isFinite(limit) || limit <= 0) {
    return 0;
  }
  return Math.min(Math.floor(limit), MAX_AT_BUTTON_LIMIT);
};

const normalizeAtButtonMail = (value: string | undefined) => {
  if (!value) return [];
  return value
    .split(",", MAX_AT_BUTTON_MAIL_ENTRIES)
    .map((command) => clampString(command, MAX_AT_BUTTON_MAIL_CHARS))
    .filter((command) => command.length > 0);
};

const hasParsedMailCommand = (commands: string[], target: string) => {
  const len = Math.min(commands.length, MAX_PARSED_COMMAND_MAIL_ENTRIES);
  for (let i = 0; i < len; i++) {
    if (commands[i] === target) return true;
  }
  return false;
};

const processedTimelineComments = new WeakMap<IComment, WeakSet<Timeline>>();

type TimedRange = {
  start: number;
  end: number;
};

type ActiveRangeScanState<T extends TimedRange> = {
  sourceLength: number;
  sortedByStart: T[];
  sortedByEnd: T[];
  startIndex: number;
  endIndex: number;
  activeCount: number;
  targetCounts?: Record<NicoScript["reverse"][number]["target"], number>;
  lastVpos: number;
};

type ActiveRangeScanCaches = {
  reverse: WeakMap<
    NicoScript["reverse"],
    ActiveRangeScanState<NicoScript["reverse"][number]>
  >;
  ban: WeakMap<
    NicoScript["ban"],
    ActiveRangeScanState<NicoScript["ban"][number]>
  >;
};

const activeRangeScanCaches = new WeakMap<
  RangeCacheContext,
  ActiveRangeScanCaches
>();

const getActiveRangeScanCaches = (rangeCache: RangeCacheContext) => {
  const cached = activeRangeScanCaches.get(rangeCache);
  if (cached) return cached;
  const next: ActiveRangeScanCaches = {
    reverse: new WeakMap<
      NicoScript["reverse"],
      ActiveRangeScanState<NicoScript["reverse"][number]>
    >(),
    ban: new WeakMap<
      NicoScript["ban"],
      ActiveRangeScanState<NicoScript["ban"][number]>
    >(),
  };
  activeRangeScanCaches.set(rangeCache, next);
  return next;
};

const getActiveRangeScanState = <T extends TimedRange>(
  ranges: T[],
  scanCache: WeakMap<T[], ActiveRangeScanState<T>>,
) => {
  const cached = scanCache.get(ranges);
  if (cached?.sourceLength === ranges.length) return cached;
  // NicoScript ranges are append-only and immutable after creation; this
  // length check must be revisited if future code mutates start/end in place.
  const validRanges = ranges.filter((range) => range.start < range.end);
  const sortedByStart = [...validRanges].sort((a, b) => a.start - b.start);
  const sortedByEnd = [...validRanges].sort((a, b) => a.end - b.end);
  const next: ActiveRangeScanState<T> = {
    sourceLength: ranges.length,
    sortedByStart,
    sortedByEnd,
    startIndex: 0,
    endIndex: 0,
    activeCount: 0,
    lastVpos: -Infinity,
  };
  scanCache.set(ranges, next);
  return next;
};

const changeReverseTargetCount = (
  counts: Record<NicoScript["reverse"][number]["target"], number>,
  range: NicoScript["reverse"][number],
  delta: number,
) => {
  counts[range.target] += delta;
};

const getActiveRangeState = <T extends TimedRange>(
  ranges: T[],
  vpos: number,
  scanCache: WeakMap<T[], ActiveRangeScanState<T>>,
  changeTargetCount?: (
    counts: Record<NicoScript["reverse"][number]["target"], number>,
    range: T,
    delta: number,
  ) => void,
) => {
  if (!Number.isFinite(vpos)) return;
  const state = getActiveRangeScanState(ranges, scanCache);
  if (vpos < state.lastVpos) {
    state.startIndex = 0;
    state.endIndex = 0;
    state.activeCount = 0;
    state.targetCounts = undefined;
  }
  if (changeTargetCount && !state.targetCounts) {
    state.targetCounts = { コメ: 0, 投コメ: 0, 全: 0 };
  }
  state.lastVpos = vpos;

  while (state.startIndex < state.sortedByStart.length) {
    const range = state.sortedByStart[state.startIndex];
    if (!range || vpos <= range.start) break;
    state.startIndex++;
    state.activeCount++;
    if (state.targetCounts) {
      changeTargetCount?.(state.targetCounts, range, 1);
    }
  }

  while (state.endIndex < state.sortedByEnd.length) {
    const range = state.sortedByEnd[state.endIndex];
    if (!range || vpos < range.end) break;
    state.endIndex++;
    if (range.start < vpos) {
      state.activeCount--;
      if (state.targetCounts) {
        changeTargetCount?.(state.targetCounts, range, -1);
      }
    }
  }

  return state;
};

const isTimelineProcessed = (timeline: Timeline, comment: IComment) =>
  processedTimelineComments.get(comment)?.has(timeline) ?? false;

const markTimelineProcessed = (timeline: Timeline, comment: IComment) => {
  const processed = processedTimelineComments.get(comment);
  if (processed) {
    processed.add(timeline);
    return;
  }
  processedTimelineComments.set(comment, new WeakSet([timeline]));
};

/**
 * 改行リサイズが発生するか
 * @param comment 判定対象のコメント
 * @param config インスタンス設定
 * @returns 改行リサイズが発生するか
 */
const isLineBreakResize = (comment: MeasureTextInput, config: BaseConfig) => {
  return (
    !comment.resized &&
    !comment.ender &&
    comment.lineCount >= config.lineBreakCount[comment.size]
  );
};

/**
 * コメントの初期設定を取得する
 * @param vpos 現在のvpos
 * @param nicoScripts ニコスクリプト
 * @returns コメントの初期設定
 */
const getDefaultCommand = (
  vpos: number,
  nicoScripts: NicoScript,
): DefaultCommand => {
  {
    let writeIdx = 0;
    for (let i = 0; i < nicoScripts.default.length; i++) {
      const item = nicoScripts.default[i];
      if (!item) continue;
      if (item.long === undefined || item.start + item.long >= vpos) {
        nicoScripts.default[writeIdx++] = item;
      }
    }
    nicoScripts.default.length = writeIdx;
  }
  let color: string | undefined;
  let size: CommentSize | undefined;
  let font: CommentFont | undefined;
  let loc: CommentLoc | undefined;
  for (const item of nicoScripts.default) {
    if (item.loc) {
      loc = item.loc;
    }
    if (item.color) {
      color = item.color;
    }
    if (item.size) {
      size = item.size;
    }
    if (item.font) {
      font = item.font;
    }
    if (loc && color && size && font) break;
  }
  return { color, size, font, loc };
};

/**
 * コメントが@置換の処理対象かどうかを判定する
 * @param comment 判定対象のコメント
 * @param item @置換
 * @returns コメントが@置換の処理対象かどうか
 */
const nicoscriptReplaceIgnoreable = (
  comment: FormattedComment,
  item: NicoScriptReplace,
) =>
  ((item.target === "コメ" || item.target === "含まない") && comment.owner) ||
  (item.target === "投コメ" && !comment.owner) ||
  (item.target === "含まない" && comment.owner) ||
  (item.condition === "完全一致" && comment.content !== item.keyword) ||
  (item.condition === "部分一致" &&
    comment.content.indexOf(item.keyword) === -1);

/**
 * 置換コマンドを適用する
 * @param comment 対象のコメント
 * @param commands 対象のコマンド
 * @param nicoScripts ニコスクリプト
 */
const applyNicoScriptReplace = (
  comment: FormattedComment,
  commands: ParsedCommand,
  nicoScripts: NicoScript,
) => {
  {
    let writeIdx = 0;
    for (let i = 0; i < nicoScripts.replace.length; i++) {
      const item = nicoScripts.replace[i];
      if (!item) continue;
      if (item.long === undefined || item.start + item.long >= comment.vpos) {
        nicoScripts.replace[writeIdx++] = item;
      }
    }
    nicoScripts.replace.length = writeIdx;
  }
  for (const item of nicoScripts.replace) {
    if (nicoscriptReplaceIgnoreable(comment, item)) continue;
    if (item.range === "単") {
      comment.content = comment.content.replaceAll(item.keyword, item.replace);
    } else {
      comment.content = item.replace;
    }
    if (item.loc) {
      commands.loc = item.loc;
    }
    if (item.color) {
      commands.color = item.color;
    }
    if (item.size) {
      commands.size = item.size;
    }
    if (item.font) {
      commands.font = item.font;
    }
  }
};

/**
 * コメントのコマンドとニコスクリプトをパースする
 * @param comment 対象のコメント
 * @param ctx インスタンスコンテキスト
 * @returns パース後のコメント
 */
const parseCommandAndNicoScript = (
  comment: FormattedComment,
  ctx: CommentInstanceContext,
): ParseCommandAndNicoScriptResult => {
  const { config, options, nicoScripts, rangeCache } = ctx;
  const isFlash = isFlashComment(comment, config, options);
  const commands = parseCommands(comment, config, options);
  commands.long = normalizeParsedCommandLong(commands.long);
  processNicoscript(comment, commands, nicoScripts, rangeCache);
  const defaultCommand = getDefaultCommand(comment.vpos, nicoScripts);
  applyNicoScriptReplace(comment, commands, nicoScripts);
  const size = commands.size ?? defaultCommand.size ?? "medium";
  return {
    size: size,
    loc: commands.loc ?? defaultCommand.loc ?? "naka",
    color: commands.color ?? defaultCommand.color ?? "#FFFFFF",
    font: commands.font ?? defaultCommand.font ?? "defont",
    fontSize: getConfig(config.fontSize, isFlash)[size].default,
    long: normalizeCommentLong(commands.long),
    flash: isFlash,
    full: commands.full,
    ender: commands.ender,
    _live: commands._live,
    invisible: commands.invisible,
    strokeColor: commands.strokeColor,
    wakuColor: commands.wakuColor,
    fillColor: commands.fillColor,
    opacity: commands.opacity,
    button: commands.button,
  };
};

/**
 * 文字列のブラケットをパースする
 * @param input 入力文字列
 * @returns パース後の文字列
 */
const parseBrackets = (input: string) => {
  const content = input.split("");
  const result = [];
  let quote = "";
  let lastChar = "";
  let string = "";
  for (const i of content) {
    if (RE_QUOTE_START.test(i) && quote === "") {
      //["'「]
      quote = i;
    } else if (RE_QUOTE_END.test(i) && quote === i && lastChar !== "\\") {
      result.push(string.replaceAll("\\n", "\n"));
      quote = "";
      string = "";
    } else if (i === "」" && quote === "「") {
      //」
      result.push(string);
      quote = "";
      string = "";
    } else if (quote === "" && RE_WHITESPACE.test(i)) {
      if (string) {
        result.push(string);
        string = "";
      }
    } else {
      string += i;
    }

    lastChar = i;
  }
  result.push(string);
  return result;
};

/**
 * 置換コマンドを追加する
 * @param comment 対象のコメント
 * @param commands 対象のコマンド
 * @param nicoScripts ニコスクリプト
 */
const addNicoscriptReplace = (
  comment: FormattedComment,
  commands: ParsedCommand,
  nicoScripts: NicoScript,
  commandInput: string,
) => {
  //@置換
  const result = parseBrackets(commandInput.slice(4));
  if (
    result[0] === undefined ||
    (result[2] !== undefined &&
      !typeGuard.nicoScript.replace.range(result[2])) ||
    (result[3] !== undefined &&
      !typeGuard.nicoScript.replace.target(result[3])) ||
    (result[4] !== undefined &&
      !typeGuard.nicoScript.replace.condition(result[4]))
  )
    return;
  nicoScripts.replace.unshift({
    start: comment.vpos,
    long: normalizeOptionalNicoscriptLong(commands.long),
    keyword: clampString(result[0], MAX_NICOSCRIPT_TEXT_CHARS),
    replace: clampString(result[1] ?? "", MAX_NICOSCRIPT_TEXT_CHARS),
    range: result[2] ?? "単", //単
    target: result[3] ?? "コメ", //コメ
    condition: result[4] ?? "部分一致", //部分一致
    color: commands.color,
    size: commands.size,
    font: commands.font,
    loc: commands.loc,
    no: comment.id,
  });
  sortNicoscriptReplace(nicoScripts);
};

/**
 * 置換コマンドをvpos順にソートする
 * @param nicoScripts ニコスクリプト
 */
const sortNicoscriptReplace = (nicoScripts: NicoScript) => {
  nicoScripts.replace.sort((a, b) => {
    if (a.start < b.start) return -1;
    if (a.start > b.start) return 1;
    if (a.no < b.no) return -1;
    if (a.no > b.no) return 1;
    return 0;
  });
};

/**
 * ニコスクリプトを処理する
 * @param comment 対象のコメント
 * @param commands 対象のコマンド
 * @param nicoScripts ニコスクリプト
 * @param rangeCache レンジキャッシュ
 */
const processNicoscript = (
  comment: FormattedComment,
  commands: ParsedCommand,
  nicoScripts: NicoScript,
  rangeCache: RangeCacheContext,
) => {
  const nicoscriptInput = clampString(
    comment.content,
    MAX_NICOSCRIPT_COMMAND_CHARS,
  );
  const nicoscript = RE_NICOSCRIPT.exec(nicoscriptInput);
  if (!nicoscript) return;
  if (nicoscript[1] === "ボタン" && nicoscript[2]) {
    //ボタン
    if (hasParsedMailCommand(comment.mail, "from_button")) return;
    processAtButton(comment, commands);
    return;
  }
  if (!comment.owner) return;
  commands.invisible = true;
  if (nicoscript[1] === "デフォルト") {
    //デフォルト
    processDefaultScript(comment, commands, nicoScripts);
    return;
  }
  if (nicoscript[1] === "逆") {
    //逆
    processReverseScript(comment, commands, nicoScripts, rangeCache);
    return;
  }
  if (nicoscript[1] === "コメント禁止") {
    //コメント禁止
    processBanScript(comment, commands, nicoScripts, rangeCache);
    return;
  }
  if (nicoscript[1] === "シーク禁止") {
    //シーク禁止
    processSeekDisableScript(comment, commands, nicoScripts);
    return;
  }
  if (nicoscript[1] === "ジャンプ" && nicoscript[2]) {
    //ジャンプ
    processJumpScript(comment, commands, nicoscript[2], nicoScripts);
    return;
  }
  if (nicoscript[1] === "置換") {
    //置換
    addNicoscriptReplace(comment, commands, nicoScripts, nicoscriptInput);
  }
};

/**
 * デフォルトコマンドを処理する
 * @param comment 対象のコメント
 * @param commands 対象のコマンド
 * @param nicoScripts ニコスクリプト
 */
const processDefaultScript = (
  comment: FormattedComment,
  commands: ParsedCommand,
  nicoScripts: NicoScript,
) => {
  nicoScripts.default.unshift({
    start: comment.vpos,
    long: normalizeOptionalNicoscriptLong(commands.long),
    color: commands.color,
    size: commands.size,
    font: commands.font,
    loc: commands.loc,
  });
};

/**
 * 逆コマンドを処理する
 * @param comment 対象のコメント
 * @param commands 対象のコマンド
 * @param nicoScripts ニコスクリプト
 * @param rangeCache レンジキャッシュ
 */
const processReverseScript = (
  comment: FormattedComment,
  commands: ParsedCommand,
  nicoScripts: NicoScript,
  rangeCache: RangeCacheContext,
) => {
  const reverse = RE_REVERSE.exec(comment.content);
  const target = typeGuard.nicoScript.range.target(reverse?.[1])
    ? reverse?.[1]
    : "全";
  const long = normalizeNicoscriptLong(commands.long);
  nicoScripts.reverse.unshift({
    start: comment.vpos,
    end: comment.vpos + long,
    target,
  });
  rangeCache.reverseActiveOwner.clear();
  rangeCache.reverseActiveViewer.clear();
};

/**
 * コメント禁止コマンドを処理する
 * @param comment 対象のコメント
 * @param commands 対象のコマンド
 * @param nicoScripts ニコスクリプト
 * @param rangeCache レンジキャッシュ
 */
const processBanScript = (
  comment: FormattedComment,
  commands: ParsedCommand,
  nicoScripts: NicoScript,
  rangeCache: RangeCacheContext,
) => {
  const long = normalizeNicoscriptLong(commands.long);
  nicoScripts.ban.unshift({
    start: comment.vpos,
    end: comment.vpos + long,
  });
  rangeCache.banActive.clear();
};

/**
 * シーク禁止コマンドを処理する
 * @param comment 対象のコメント
 * @param commands 対象のコマンド
 * @param nicoScripts ニコスクリプト
 */
const processSeekDisableScript = (
  comment: FormattedComment,
  commands: ParsedCommand,
  nicoScripts: NicoScript,
) => {
  const long = normalizeNicoscriptLong(commands.long);
  nicoScripts.seekDisable.unshift({
    start: comment.vpos,
    end: comment.vpos + long,
  });
};

/**
 * ジャンプコマンドを処理する
 * @param comment 対象のコメント
 * @param commands 対象のコマンド
 * @param input 対象のコメント本文
 * @param nicoScripts ニコスクリプト
 */
const processJumpScript = (
  comment: FormattedComment,
  commands: ParsedCommand,
  input: string,
  nicoScripts: NicoScript,
) => {
  const jumpOptions = RE_JUMP.exec(input);
  if (!jumpOptions?.[1]) return;
  const long = normalizeOptionalNicoscriptLong(commands.long);
  const end = long === undefined ? undefined : long + comment.vpos;
  nicoScripts.jump.unshift({
    start: comment.vpos,
    end,
    to: jumpOptions[1],
    message: jumpOptions[2],
  });
};

/**
 * \@ボタンを処理する
 * @param comment 対象のコメント
 * @param commands 対象のコマンド
 */
const processAtButton = (
  comment: FormattedComment,
  commands: ParsedCommand,
) => {
  const args = parseBrackets(
    clampString(comment.content, MAX_AT_BUTTON_COMMAND_CHARS),
  );
  if (args[1] === undefined) return;
  commands.invisible = false;
  const content = RE_BUTTON_CONTENT.exec(args[1]) as {
    groups: { before?: string; body?: string; after?: string };
  };
  const remainingText = { value: MAX_AT_BUTTON_TEXT_CHARS };
  const message = {
    before: takeButtonText(content.groups?.before, remainingText),
    body: takeButtonText(content.groups?.body, remainingText),
    after: takeButtonText(content.groups?.after, remainingText),
  };
  commands.button = {
    message,
    commentMessage: clampString(
      args[2] ?? `${message.before}${message.body}${message.after}`,
      MAX_AT_BUTTON_TEXT_CHARS,
    ),
    commentVisible: args[3] !== "非表示",
    commentMail: normalizeAtButtonMail(args[4]),
    limit: normalizeAtButtonLimit(args[5]),
    local: hasParsedMailCommand(comment.mail, "local"),
    hidden: hasParsedMailCommand(comment.mail, "hidden"),
  };
};

/**
 * コマンドをパースする
 * @param comment 対象のコメント
 * @param config インスタンス設定
 * @param options インスタンスオプション
 * @returns パースしたコマンド
 */
const parseCommands = (
  comment: FormattedComment,
  config: BaseConfig,
  options: BaseOptions,
): ParsedCommand => {
  const isFlash = isFlashComment(comment, config, options);
  const result: ParsedCommand = {
    loc: undefined,
    size: undefined,
    fontSize: undefined,
    color: undefined,
    strokeColor: undefined,
    wakuColor: undefined,
    font: undefined,
    full: false,
    ender: false,
    _live: false,
    invisible: false,
    long: undefined,
  };
  const len = Math.min(comment.mail.length, MAX_PARSED_COMMAND_MAIL_ENTRIES);
  for (let i = 0; i < len; i++) {
    const command = comment.mail[i];
    if (command === undefined) continue;
    if (command.length > MAX_PARSED_COMMAND_MAIL_CHARS) continue;
    parseCommand(comment, command, result, isFlash, config);
  }
  if (comment.content.startsWith("/")) {
    result.invisible = true;
  }
  return result;
};

/**
 * コマンドをパースする
 * @param comment 対象のコメント
 * @param _command 対象のコマンド
 * @param result パースしたコマンド
 * @param isFlash Flashコメントかどうか
 * @param config インスタンス設定
 */
const parseCommand = (
  comment: FormattedComment,
  _command: string,
  result: ParsedCommand,
  isFlash: boolean,
  config: BaseConfig,
) => {
  const command = _command.toLowerCase();
  const long = RE_LONG.exec(command);
  if (long) {
    result.long = Number(long[1]);
    return;
  }
  const strokeColor = getColor(RE_STROKE.exec(command));
  if (strokeColor) {
    result.strokeColor ??= strokeColor;
    return;
  }
  const rectColor = getColor(RE_WAKU.exec(command));
  if (rectColor) {
    result.wakuColor ??= rectColor;
    return;
  }
  const fillColor = getColor(RE_FILL.exec(command));
  if (fillColor) {
    result.fillColor ??= fillColor;
    return;
  }
  const opacity = getOpacity(RE_OPACITY.exec(command));
  if (typeof opacity === "number") {
    result.opacity ??= opacity;
    return;
  }
  if (is(ZCommentLoc, command)) {
    result.loc ??= command;
    return;
  }
  if (result.size === undefined && is(ZCommentSize, command)) {
    result.size = command;
    result.fontSize = getConfig(config.fontSize, isFlash)[command].default;
    return;
  }
  if (config.colors[command]) {
    result.color ??= config.colors[command];
    return;
  }
  const colorCode = RE_COLOR_CODE.exec(command);
  if (colorCode && comment.premium) {
    result.color ??= colorCode[0].toUpperCase();
    return;
  }
  if (is(ZCommentFont, command)) {
    result.font ??= command;
    return;
  }
  if (typeGuard.comment.command.key(command)) {
    result[command] = true;
  }
};

/**
 * 正規表現の結果から色を取得する
 * @param match 正規表現の結果
 * @returns 色
 */
const getColor = (match: RegExpMatchArray | null) => {
  if (!match) return;
  const value = match[1];
  if (typeGuard.comment.color(value)) {
    return colors[value];
  }
  if (typeGuard.comment.colorCodeAllowAlpha(value)) {
    return value;
  }
  return;
};

/**
 * 正規表現の結果から透明度を取得する
 * @param match 正規表現の結果
 * @returns 透明度
 */
const getOpacity = (match: RegExpMatchArray | null) => {
  if (!match) return;
  const value = Number(match[1]);
  if (!Number.isNaN(value) && value >= 0) {
    return value;
  }
  return;
};

/**
 * コメントがFlash適用対象化判定返す
 * @param comment コメントデータ
 * @param config インスタンス設定
 * @param options インスタンスオプション
 * @returns Flash適用対象かどうか
 */
const isFlashComment = (
  comment: FormattedComment,
  config: BaseConfig,
  options: BaseOptions,
): boolean =>
  options.mode === "flash" ||
  (options.mode === "default" &&
    !(
      hasParsedMailCommand(comment.mail, "gothic") ||
      hasParsedMailCommand(comment.mail, "defont") ||
      hasParsedMailCommand(comment.mail, "mincho")
    ) &&
    (comment.date < config.flashThreshold ||
      hasParsedMailCommand(comment.mail, "nico:flash")));

/**
 * コメントが逆コマンド適用対象かを返す
 * @param vpos コメントのvpos
 * @param isOwner コメントが投稿者コメントかどうか
 * @param nicoScripts ニコスクリプト
 * @param rangeCache レンジキャッシュ
 * @returns 逆コマンド適用対象かどうか
 */
const isReverseActive = (
  vpos: number,
  isOwner: boolean,
  nicoScripts: NicoScript,
  rangeCache: RangeCacheContext,
): boolean => {
  const cache = isOwner
    ? rangeCache.reverseActiveOwner
    : rangeCache.reverseActiveViewer;
  const cached = cache.get(vpos);
  if (cached !== undefined) return cached;
  const activeState = getActiveRangeState(
    nicoScripts.reverse,
    vpos,
    getActiveRangeScanCaches(rangeCache).reverse,
    changeReverseTargetCount,
  );
  const result = isOwner
    ? (activeState?.targetCounts?.投コメ ?? 0) > 0 ||
      (activeState?.targetCounts?.全 ?? 0) > 0
    : (activeState?.targetCounts?.コメ ?? 0) > 0 ||
      (activeState?.targetCounts?.全 ?? 0) > 0;
  rangeCache.setCachedActiveState(cache, vpos, result);
  return result;
};

/**
 * コメントがコメント禁止コマンド適用対象かを返す
 * @param vpos コメントのvpos
 * @param nicoScripts ニコスクリプト
 * @param rangeCache レンジキャッシュ
 * @returns コメント禁止コマンド適用対象かどうか
 */
const isBanActive = (
  vpos: number,
  nicoScripts: NicoScript,
  rangeCache: RangeCacheContext,
): boolean => {
  const cached = rangeCache.banActive.get(vpos);
  if (cached !== undefined) return cached;
  const result =
    (getActiveRangeState(
      nicoScripts.ban,
      vpos,
      getActiveRangeScanCaches(rangeCache).ban,
    )?.activeCount ?? 0) > 0;
  rangeCache.setCachedActiveState(rangeCache.banActive, vpos, result);
  return result;
};

/**
 * 固定コメントを処理する
 * @param comment 固定コメント
 * @param collision コメントの衝突判定用配列
 * @param timeline コメントのタイムライン
 * @param lazy Y座標の計算を遅延させるか
 * @param config インスタンス設定
 */
const processFixedComment = (
  comment: IComment,
  collision: CollisionItem,
  timeline: Timeline,
  lazy = false,
  config: BaseConfig,
  touchedTimeline?: Set<number>,
) => {
  const commentVpos = comment.vpos;
  const commentLong = comment.long;
  const collisionEnd = Math.max(commentLong - 20, 0);
  const posY = lazy ? -1 : getFixedPosY(comment, collision, config);
  if (!isTimelineProcessed(timeline, comment)) {
    for (let j = 0; j < commentLong; j++) {
      const vpos = commentVpos + j;
      arrayPush(timeline, vpos, comment);
      touchedTimeline?.add(vpos);
      if (j <= collisionEnd) {
        arrayPush(collision, vpos, comment);
      }
    }
    markTimelineProcessed(timeline, comment);
  }
  comment.posY = posY;
};

/**
 * nakaコメントを処理する
 * @param comment nakaコメント
 * @param collision コメントの衝突判定用配列
 * @param timeline コメントのタイムライン
 * @param lazy Y座標の計算を遅延させるか
 * @param config インスタンス設定
 */
const processMovableComment = (
  comment: IComment,
  collision: Collision,
  timeline: Timeline,
  lazy = false,
  config: BaseConfig,
  touchedTimeline?: Set<number>,
) => {
  const commentWidth = comment.width;
  const commentLong = comment.long;
  const commentVpos = comment.vpos;
  const speed =
    (config.commentDrawRange + commentWidth * config.nakaCommentSpeedOffset) /
    (commentLong + 100);
  const drawPadding = config.commentDrawPadding;
  const drawRange = config.commentDrawRange;
  const collisionPadding = config.collisionPadding;
  const collisionRight = config.collisionRange.right;
  const collisionLeft = config.collisionRange.left;

  const beforeVpos =
    Math.round(-288 / ((1632 + commentWidth) / (commentLong + 125))) - 100;
  const posY = lazy
    ? -1
    : getMovablePosY(comment, collision, beforeVpos, config, speed);
  const n = commentLong + 125;
  if (!isTimelineProcessed(timeline, comment)) {
    for (let j = beforeVpos; j < n; j++) {
      const vpos = commentVpos + j;
      const leftPos = drawPadding + drawRange - (j + 100) * speed;
      arrayPush(timeline, vpos, comment);
      touchedTimeline?.add(vpos);
      if (
        leftPos + commentWidth + collisionPadding >= collisionRight &&
        leftPos <= collisionRight
      ) {
        arrayPush(collision.right, vpos, comment);
      }
      if (
        leftPos + commentWidth + collisionPadding >= collisionLeft &&
        leftPos <= collisionLeft
      ) {
        arrayPush(collision.left, vpos, comment);
      }
    }
    markTimelineProcessed(timeline, comment);
  }
  comment.posY = posY;
};

const getFixedPosY = (
  comment: IComment,
  collision: CollisionItem,
  config: BaseConfig,
) => {
  const commentLong = comment.long;
  const commentVpos = comment.vpos;
  let posY = 0;
  let isChanged = true;
  let count = 0;
  while (isChanged && count < 10) {
    isChanged = false;
    count++;
    for (let j = 0; j < commentLong; j++) {
      const result = getPosY(posY, comment, collision[commentVpos + j], config);
      posY = result.currentPos;
      isChanged ||= result.isChanged;
      if (result.isBreak) break;
    }
  }
  return posY;
};

const getMovablePosY = (
  comment: IComment,
  collision: Collision,
  beforeVpos: number,
  config: BaseConfig,
  speed: number = (config.commentDrawRange +
    comment.width * config.nakaCommentSpeedOffset) /
    (comment.long + 100),
) => {
  const canvasHeight = config.canvasHeight;
  const commentHeight = comment.height;
  if (canvasHeight < commentHeight) {
    return (commentHeight - canvasHeight) / -2;
  }
  const commentWidth = comment.width;
  const commentLong = comment.long;
  const commentVpos = comment.vpos;
  const drawPadding = config.commentDrawPadding;
  const drawRange = config.commentDrawRange;
  const collisionRight = config.collisionRange.right;
  const collisionLeft = config.collisionRange.left;
  const n = commentLong + 125;

  let posY = 0;
  let isChanged = true;
  let count = 0;
  let lastUpdatedIndex: number | undefined;
  while (isChanged && count < 10) {
    isChanged = false;
    count++;
    for (let j = beforeVpos; j < n; j += 5) {
      const vpos = commentVpos + j;
      const leftPos = drawPadding + drawRange - (j + 100) * speed;
      let isBreak = false;
      if (lastUpdatedIndex !== undefined && lastUpdatedIndex === vpos) {
        return posY;
      }
      if (
        leftPos + commentWidth >= collisionRight &&
        leftPos <= collisionRight
      ) {
        const result = getPosY(posY, comment, collision.right[vpos], config);
        posY = result.currentPos;
        isChanged ||= result.isChanged;
        if (result.isChanged) lastUpdatedIndex = vpos;
        isBreak ||= result.isBreak;
      }
      if (leftPos + commentWidth >= collisionLeft && leftPos <= collisionLeft) {
        const result = getPosY(posY, comment, collision.left[vpos], config);
        posY = result.currentPos;
        isChanged ||= result.isChanged;
        if (result.isChanged) lastUpdatedIndex = vpos;
        isBreak ||= result.isBreak;
      }
      if (isBreak) return posY;
    }
  }
  return posY;
};

/**
 * 当たり判定からコメントを配置できる場所を探す
 * @param _currentPos 現在のy座標
 * @param targetComment 対象コメント
 * @param collision 当たり判定
 * @param config インスタンス設定
 * @returns 現在地、更新されたか、終了すべきか
 */
const getPosY = (
  _currentPos: number,
  targetComment: IComment,
  collision: IComment[] | undefined,
  config: BaseConfig,
): { currentPos: number; isChanged: boolean; isBreak: boolean } => {
  if (!collision)
    return { currentPos: _currentPos, isChanged: false, isBreak: false };
  let currentPos = _currentPos;
  let isChanged = false;
  const targetIndex = targetComment.index;
  const targetOwner = targetComment.owner;
  const targetLayer = targetComment.layer;
  const targetHeight = targetComment.height;
  const canvasHeight = config.canvasHeight;
  const len = collision.length;
  restart: while (true) {
    for (let i = 0; i < len; i++) {
      const item = collision[i] as IComment;
      if (item.index === targetIndex || item.posY < 0) continue;
      if (
        item.owner === targetOwner &&
        item.layer === targetLayer &&
        currentPos < item.posY + item.height &&
        currentPos + targetHeight > item.posY
      ) {
        currentPos = item.posY + item.height;
        isChanged = true;
        if (currentPos + targetHeight > canvasHeight) {
          if (canvasHeight < targetHeight) {
            if (targetComment.mail.includes("naka")) {
              currentPos = (targetHeight - canvasHeight) / -2;
            } else {
              currentPos = 0;
            }
          } else {
            currentPos = Math.floor(
              Math.random() * (canvasHeight - targetHeight),
            );
          }
          return { currentPos, isChanged: true, isBreak: true };
        }
        continue restart;
      }
    }
    break;
  }
  return { currentPos, isChanged, isBreak: false };
};

/**
 * コメントのvposと現在のvposから左右の位置を返す
 * @param comment コメントデータ
 * @param vpos vpos
 * @param isReverse @逆が有効か
 * @param config インスタンス設定
 * @returns x座標
 */
const getPosX = (
  comment: FormattedCommentWithSize,
  vpos: number,
  config: BaseConfig,
  isReverse = false,
): number => {
  if (comment.loc !== "naka") {
    return (config.canvasWidth - comment.width) / 2;
  }
  const speed =
    (config.commentDrawRange + comment.width * config.nakaCommentSpeedOffset) /
    (comment.long + 100);
  const vposLapsed = vpos - comment.vpos;
  const posX =
    config.commentDrawPadding +
    config.commentDrawRange -
    (vposLapsed + 100) * speed;
  if (isReverse) {
    return config.canvasWidth - comment.width - posX;
  }
  return posX;
};

/**
 * フォント名とサイズをもとにcontextで使えるフォントを生成する
 * @param font フォント名
 * @param size サイズ
 * @param config インスタンス設定
 * @returns contextで使えるフォント
 */
const parseFont = (
  font: CommentFont,
  size: string | number,
  config: BaseConfig,
): string => {
  switch (font) {
    case "gulim":
    case "simsun":
      return config.fonts.flash[font].replace("[size]", `${size}`);
    case "gothic":
    case "mincho":
      return `${config.fonts.html5[font].weight} ${size}px ${config.fonts.html5[font].font}`;
    default:
      return `${config.fonts.html5.defont.weight} ${size}px ${config.fonts.html5.defont.font}`;
  }
};

export {
  getDefaultCommand,
  getFixedPosY,
  getMovablePosY,
  getPosX,
  getPosY,
  isBanActive,
  isFlashComment,
  isLineBreakResize,
  isReverseActive,
  parseCommandAndNicoScript,
  parseFont,
  processFixedComment,
  processMovableComment,
};
