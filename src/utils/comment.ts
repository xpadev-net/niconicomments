import type {
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
  NicoScriptReplace,
  ParseCommandAndNicoScriptResult,
  ParsedCommand,
  Timeline,
} from "@/@types/";
import { nicoScripts } from "@/contexts/";
import { colors } from "@/definition/colors";
import { config, options } from "@/definition/config";
import typeGuard from "@/typeGuard";

import { ArrayPush } from "./array";
import { getConfig } from "./config";

/**
 * 改行リサイズが発生するか
 * @param comment 判定対象のコメント
 * @returns 改行リサイズが発生するか
 */
const isLineBreakResize = (comment: MeasureTextInput) => {
  return (
    !comment.resized &&
    !comment.ender &&
    comment.lineCount >= config.lineBreakCount[comment.size]
  );
};

/**
 * コメントの初期設定を取得する
 * @param vpos 現在のvpos
 * @returns コメントの初期設定
 */
const getDefaultCommand = (vpos: number): DefaultCommand => {
  nicoScripts.default = nicoScripts.default.filter(
    (item) => !item.long || item.start + item.long >= vpos,
  );
  let color = undefined,
    size: CommentSize | undefined = undefined,
    font = undefined,
    loc: CommentLoc | undefined = undefined;
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
  ((item.target === "\u30b3\u30e1" ||
    item.target === "\u542b\u307e\u306a\u3044") &&
    comment.owner) ||
  (item.target === "\u6295\u30b3\u30e1" && !comment.owner) ||
  (item.target === "\u542b\u307e\u306a\u3044" && comment.owner) ||
  (item.condition === "\u5b8c\u5168\u4e00\u81f4" &&
    comment.content !== item.keyword) ||
  (item.condition === "\u90e8\u5206\u4e00\u81f4" &&
    comment.content.indexOf(item.keyword) === -1);

/**
 * 置換コマンドを適用する
 * @param comment 対象のコメント
 * @param commands 対象のコマンド
 */
const applyNicoScriptReplace = (
  comment: FormattedComment,
  commands: ParsedCommand,
) => {
  nicoScripts.replace = nicoScripts.replace.filter(
    (item) => !item.long || item.start + item.long >= comment.vpos,
  );
  for (const item of nicoScripts.replace) {
    if (nicoscriptReplaceIgnoreable(comment, item)) continue;
    if (item.range === "\u5358") {
      comment.content = comment.content.replaceAll(item.keyword, item.replace);
    } else {
      comment.content = item.replace;
    }
    item.loc && (commands.loc = item.loc);
    item.color && (commands.color = item.color);
    item.size && (commands.size = item.size);
    item.font && (commands.font = item.font);
  }
};

/**
 * コメントのコマンドとニコスクリプトをパースする
 * @param comment 対象のコメント
 * @returns パース後のコメント
 */
const parseCommandAndNicoScript = (
  comment: FormattedComment,
): ParseCommandAndNicoScriptResult => {
  const isFlash = isFlashComment(comment);
  const commands = parseCommands(comment);
  processNicoscript(comment, commands);
  const defaultCommand = getDefaultCommand(comment.vpos);
  applyNicoScriptReplace(comment, commands);
  const size = commands.size ?? defaultCommand.size ?? "medium";
  return {
    size: size,
    loc: commands.loc ?? defaultCommand.loc ?? "naka",
    color: commands.color ?? defaultCommand.color ?? "#FFFFFF",
    font: commands.font ?? defaultCommand.font ?? "defont",
    fontSize: getConfig(config.fontSize, isFlash)[size].default,
    long: commands.long ? Math.floor(Number(commands.long) * 100) : 300,
    flash: isFlash,
    full: commands.full,
    ender: commands.ender,
    _live: commands._live,
    invisible: commands.invisible,
    strokeColor: commands.strokeColor,
    wakuColor: commands.wakuColor,
    fillColor: commands.fillColor,
    button: commands.button,
  };
};

/**
 * 文字列のブラケットをパースする
 * @param input 入力文字列
 * @returns パース後の文字列
 */
const parseBrackets = (input: string) => {
  const content = input.split(""),
    result = [];
  let quote = "",
    last_i = "",
    string = "";
  for (const i of content) {
    if (RegExp(/^["'\u300c]$/).exec(i) && quote === "") {
      //["'「]
      quote = i;
    } else if (RegExp(/^["']$/).exec(i) && quote === i && last_i !== "\\") {
      result.push(string.replaceAll("\\n", "\n"));
      quote = "";
      string = "";
    } else if (i === "\u300d" && quote === "\u300c") {
      //」
      result.push(string);
      quote = "";
      string = "";
    } else if (quote === "" && RegExp(/^\s+$/).exec(i)) {
      if (string) {
        result.push(string);
        string = "";
      }
    } else {
      string += i;
    }

    last_i = i;
  }
  result.push(string);
  return result;
};

/**
 * 置換コマンドを追加する
 * @param comment 対象のコメント
 * @param commands 対象のコマンド
 */
const addNicoscriptReplace = (
  comment: FormattedComment,
  commands: ParsedCommand,
) => {
  //@置換
  const result = parseBrackets(comment.content.slice(4));
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
    long:
      commands.long === undefined ? undefined : Math.floor(commands.long * 100),
    keyword: result[0],
    replace: result[1] ?? "",
    range: result[2] ?? "\u5358", //単
    target: result[3] ?? "\u30b3\u30e1", //コメ
    condition: result[4] ?? "\u90e8\u5206\u4e00\u81f4", //部分一致
    color: commands.color,
    size: commands.size,
    font: commands.font,
    loc: commands.loc,
    no: comment.id,
  });
  sortNicoscriptReplace();
};

/**
 * 置換コマンドをvpos順にソートする
 */
const sortNicoscriptReplace = () => {
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
 */
const processNicoscript = (
  comment: FormattedComment,
  commands: ParsedCommand,
) => {
  const nicoscript = RegExp(/^[@\uff20](\S+)(?:\s(.+))?/).exec(comment.content);
  if (!nicoscript) return;
  if (nicoscript[1] === "\u30dc\u30bf\u30f3" && nicoscript[2]) {
    //ボタン
    processAtButton(comment, commands);
    return;
  }
  if (!comment.owner) return;
  commands.invisible = true;
  if (nicoscript[1] === "\u30c7\u30d5\u30a9\u30eb\u30c8") {
    //デフォルト
    processDefaultScript(comment, commands);
    return;
  }
  if (nicoscript[1] === "\u9006") {
    //逆
    processReverseScript(comment, commands);
    return;
  }
  if (nicoscript[1] === "\u30b3\u30e1\u30f3\u30c8\u7981\u6b62") {
    //コメント禁止
    processBanScript(comment, commands);
    return;
  }
  if (nicoscript[1] === "\u30b7\u30fc\u30af\u7981\u6b62") {
    //シーク禁止
    processSeekDisableScript(comment, commands);
    return;
  }
  if (nicoscript[1] === "\u30b8\u30e3\u30f3\u30d7" && nicoscript[2]) {
    //ジャンプ
    processJumpScript(comment, commands, nicoscript[2]);
    return;
  }
  if (nicoscript[1] === "\u7f6e\u63db") {
    //置換
    addNicoscriptReplace(comment, commands);
  }
};

/**
 * デフォルトコマンドを処理する
 * @param comment 対象のコメント
 * @param commands 対象のコマンド
 */
const processDefaultScript = (
  comment: FormattedComment,
  commands: ParsedCommand,
) => {
  nicoScripts.default.unshift({
    start: comment.vpos,
    long:
      commands.long === undefined ? undefined : Math.floor(commands.long * 100),
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
 */
const processReverseScript = (
  comment: FormattedComment,
  commands: ParsedCommand,
) => {
  const reverse = RegExp(
    /^[@\uff20]\u9006(?:\s+)?(\u5168|\u30b3\u30e1|\u6295\u30b3\u30e1)?/,
  ).exec(comment.content);
  if (!reverse?.[1] || !typeGuard.nicoScript.range.target(reverse[1])) return;
  if (commands.long === undefined) {
    commands.long = 30;
  }
  nicoScripts.reverse.unshift({
    start: comment.vpos,
    end: comment.vpos + commands.long * 100,
    target: reverse[1],
  });
};

/**
 * コメント禁止コマンドを処理する
 * @param comment 対象のコメント
 * @param commands 対象のコマンド
 */
const processBanScript = (
  comment: FormattedComment,
  commands: ParsedCommand,
) => {
  if (commands.long === undefined) {
    commands.long = 30;
  }
  nicoScripts.ban.unshift({
    start: comment.vpos,
    end: comment.vpos + commands.long * 100,
  });
};

/**
 * シーク禁止コマンドを処理する
 * @param comment 対象のコメント
 * @param commands 対象のコマンド
 */
const processSeekDisableScript = (
  comment: FormattedComment,
  commands: ParsedCommand,
) => {
  if (commands.long === undefined) {
    commands.long = 30;
  }
  nicoScripts.seekDisable.unshift({
    start: comment.vpos,
    end: comment.vpos + commands.long * 100,
  });
};

/**
 * ジャンプコマンドを処理する
 * @param comment 対象のコメント
 * @param commands 対象のコマンド
 * @param input 対象のコメント本文
 */
const processJumpScript = (
  comment: FormattedComment,
  commands: ParsedCommand,
  input: string,
) => {
  const options = RegExp(
    /\s*((?:sm|so|nm|\uff53\uff4d|\uff53\uff4f|\uff4e\uff4d)?[1-9\uff11-\uff19][0-9\uff11-\uff19]*|#[0-9]+:[0-9]+(?:\.[0-9]+)?)\s+(.*)/,
  ).exec(input);
  if (!options?.[1]) return;
  nicoScripts.jump.unshift({
    start: comment.vpos,
    end: commands.long === undefined ? undefined : commands.long * 100,
    to: options[1],
    message: options[2],
  });
};

const processAtButton = (
  comment: FormattedComment,
  commands: ParsedCommand,
) => {
  const args = parseBrackets(comment.content);
  if (args[1] === undefined) return;
  commands.invisible = false;
  const content = RegExp(
    /^(?:(?<before>.*?)\[)?(?<body>.*?)(?:\](?<after>[^\]]*?))?$/su,
  ).exec(args[1]) as {
    groups: { before?: string; body?: string; after?: string };
  };
  const message = {
    before: content.groups?.before ?? "",
    body: content.groups?.body ?? "",
    after: content.groups?.after ?? "",
  };
  commands.button = {
    message,
    commentMessage:
      args[2] ?? `${message.before}${message.body}${message.after}`,
    commentVisible: args[3] !== "\u975e\u8868\u793a",
    commentMail: args[4]?.split(",") ?? [],
    limit: Number(args[5] ?? 1),
    local: comment.mail.includes("local"),
    hidden: comment.mail.includes("hidden"),
  };
};

/**
 * コマンドをパースする
 * @param comment 対象のコメント
 * @returns パースしたコマンド
 */
const parseCommands = (comment: FormattedComment): ParsedCommand => {
  const commands = comment.mail,
    isFlash = isFlashComment(comment);
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
  for (const command of commands) {
    parseCommand(comment, command, result, isFlash);
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
 */
const parseCommand = (
  comment: FormattedComment,
  _command: string,
  result: ParsedCommand,
  isFlash: boolean,
) => {
  const command = _command.toLowerCase();
  const long = RegExp(/^[@\uff20]([0-9.]+)/).exec(command);
  if (long) {
    result.long = Number(long[1]);
    return;
  }
  const strokeColor = getColor(RegExp(/^nico:stroke:(.+)$/).exec(command));
  if (strokeColor) {
    result.strokeColor ??= strokeColor;
    return;
  }
  const rectColor = getColor(RegExp(/^nico:waku:(.+)$/).exec(command));
  if (rectColor) {
    result.wakuColor ??= rectColor;
    return;
  }
  const fillColor = getColor(RegExp(/^nico:fill:(.+)$/).exec(command));
  if (fillColor) {
    result.fillColor ??= fillColor;
    return;
  }
  if (typeGuard.comment.loc(command)) {
    result.loc ??= command;
    return;
  }
  if (result.size === undefined && typeGuard.comment.size(command)) {
    result.size = command;
    result.fontSize = getConfig(config.fontSize, isFlash)[command].default;
    return;
  }
  if (config.colors[command]) {
    result.color ??= config.colors[command];
    return;
  }
  const colorCode = RegExp(/^#(?:[0-9a-z]{3}|[0-9a-z]{6})$/).exec(command);
  if (colorCode && comment.premium) {
    result.color ??= colorCode[0].toUpperCase();
    return;
  }
  if (typeGuard.comment.font(command)) {
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
  } else if (typeGuard.comment.colorCodeAllowAlpha(value)) {
    return value;
  }
  return;
};

/**
 * コメントがFlash適用対象化判定返す
 * @param comment コメントデータ
 * @returns Flash適用対象かどうか
 */
const isFlashComment = (comment: FormattedComment): boolean =>
  options.mode === "flash" ||
  (options.mode === "default" &&
    !(
      comment.mail.includes("gothic") ||
      comment.mail.includes("defont") ||
      comment.mail.includes("mincho")
    ) &&
    (comment.date < config.flashThreshold ||
      comment.mail.includes("nico:flash")));

/**
 * コメントが逆コマンド適用対象かを返す
 * @param vpos コメントのvpos
 * @param isOwner コメントが投稿者コメントかどうか
 * @returns 逆コマンド適用対象かどうか
 */
const isReverseActive = (vpos: number, isOwner: boolean): boolean => {
  for (const range of nicoScripts.reverse) {
    if (
      (range.target === "コメ" && isOwner) ||
      (range.target === "投コメ" && !isOwner)
    )
      continue;
    if (range.start < vpos && vpos < range.end) {
      return true;
    }
  }
  return false;
};

/**
 * コメントがコメント禁止コマンド適用対象かを返す
 * @param vpos コメントのvpos
 * @returns コメント禁止コマンド適用対象かどうか
 */
const isBanActive = (vpos: number): boolean => {
  for (const range of nicoScripts.ban) {
    if (range.start < vpos && vpos < range.end) return true;
  }
  return false;
};

/**
 * 固定コメントを処理する
 * @param comment 固定コメント
 * @param collision コメントの衝突判定用配列
 * @param timeline コメントのタイムライン
 */
const processFixedComment = (
  comment: IComment,
  collision: CollisionItem,
  timeline: Timeline,
) => {
  let posY = 0,
    isChanged = true,
    count = 0;
  while (isChanged && count < 10) {
    isChanged = false;
    count++;
    for (let j = 0; j < comment.long; j++) {
      const result = getPosY(posY, comment, collision[comment.vpos + j]);
      posY = result.currentPos;
      isChanged = result.isChanged;
      if (result.isBreak) break;
    }
  }
  for (let j = 0; j < comment.long; j++) {
    const vpos = comment.vpos + j;
    ArrayPush(timeline, vpos, comment);
    if (j > comment.long - 20) continue;
    ArrayPush(collision, vpos, comment);
  }
  comment.posY = posY;
};

/**
 * nakaコメントを処理する
 * @param comment nakaコメント
 * @param collision コメントの衝突判定用配列
 * @param timeline コメントのタイムライン
 */
const processMovableComment = (
  comment: IComment,
  collision: Collision,
  timeline: Timeline,
) => {
  const beforeVpos =
    Math.round(-288 / ((1632 + comment.width) / (comment.long + 125))) - 100;
  const posY = (() => {
    if (config.canvasHeight < comment.height) {
      return (comment.height - config.canvasHeight) / -2;
    }
    let posY = 0;
    let isChanged = true;
    while (isChanged) {
      isChanged = false;
      for (let j = beforeVpos, n = comment.long + 125; j < n; j++) {
        const vpos = comment.vpos + j;
        const left_pos = getPosX(comment.comment, vpos);
        let isBreak = false;
        if (
          left_pos + comment.width >= config.collisionRange.right &&
          left_pos <= config.collisionRange.right
        ) {
          const result = getPosY(posY, comment, collision.right[vpos]);
          posY = result.currentPos;
          isChanged ||= result.isChanged;
          isBreak = result.isBreak;
        }
        if (
          left_pos + comment.width >= config.collisionRange.left &&
          left_pos <= config.collisionRange.left
        ) {
          const result = getPosY(posY, comment, collision.left[vpos]);
          posY = result.currentPos;
          isChanged ||= result.isChanged;
          isBreak = result.isBreak;
        }
        if (isBreak) return posY;
      }
    }
    return posY;
  })();
  for (let j = beforeVpos, n = comment.long + 125; j < n; j++) {
    const vpos = comment.vpos + j;
    const left_pos = getPosX(comment.comment, vpos);
    ArrayPush(timeline, vpos, comment);
    if (
      left_pos + comment.width + config.collisionPadding >=
        config.collisionRange.right &&
      left_pos <= config.collisionRange.right
    ) {
      ArrayPush(collision.right, vpos, comment);
    }
    if (
      left_pos + comment.width + config.collisionPadding >=
        config.collisionRange.left &&
      left_pos <= config.collisionRange.left
    ) {
      ArrayPush(collision.left, vpos, comment);
    }
  }
  comment.posY = posY;
};

/**
 * 当たり判定からコメントを配置できる場所を探す
 * @param currentPos 現在のy座標
 * @param targetComment 対象コメント
 * @param collision 当たり判定
 * @param isChanged 位置が変更されたか
 * @returns 現在地、更新されたか、終了すべきか
 */
const getPosY = (
  currentPos: number,
  targetComment: IComment,
  collision: IComment[] | undefined,
  isChanged = false,
): { currentPos: number; isChanged: boolean; isBreak: boolean } => {
  let isBreak = false;
  if (!collision) return { currentPos, isChanged, isBreak };
  for (const collisionItem of collision) {
    if (
      currentPos < collisionItem.posY + collisionItem.height &&
      currentPos + targetComment.height > collisionItem.posY &&
      collisionItem.owner === targetComment.owner &&
      collisionItem.layer === targetComment.layer
    ) {
      if (collisionItem.posY + collisionItem.height > currentPos) {
        currentPos = collisionItem.posY + collisionItem.height;
        isChanged = true;
      }
      if (currentPos + targetComment.height > config.canvasHeight) {
        if (config.canvasHeight < targetComment.height) {
          if (targetComment.mail.includes("naka")) {
            currentPos = (targetComment.height - config.canvasHeight) / -2;
          } else {
            currentPos = 0;
          }
        } else {
          currentPos = Math.floor(
            Math.random() * (config.canvasHeight - targetComment.height),
          );
        }
        isBreak = true;
        break;
      }
      return getPosY(currentPos, targetComment, collision, true);
    }
  }
  return { currentPos, isChanged, isBreak };
};
/**
 * コメントのvposと現在のvposから左右の位置を返す
 * @param comment コメントデータ
 * @param vpos vpos
 * @param isReverse @逆が有効か
 * @returns x座標
 */
const getPosX = (
  comment: FormattedCommentWithSize,
  vpos: number,
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
 * @returns contextで使えるフォント
 */
const parseFont = (font: CommentFont, size: string | number): string => {
  switch (font) {
    case "gulim":
    case "simsun":
      return config.font[font].replace("[size]", `${size}`);
    case "gothic":
    case "mincho":
      return `${config.fonts[font].weight} ${size}px ${config.fonts[font].font}`;
    default:
      return `${config.fonts.defont.weight} ${size}px ${config.fonts.defont.font}`;
  }
};

export {
  getDefaultCommand,
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
