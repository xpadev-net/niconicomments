import { ValiError } from "valibot";

import type { FormattedComment, InputFormatType } from "@/@types/";
import { InvalidFormatError } from "@/errors";
import { parsers } from "@/input";

/**
 * 入力されたデータを内部用のデータに変換
 * @param data 入力データ(XMLDocument/niconicome/formatted/legacy/owner/v1)
 * @param type 誤検出防止のため入力フォーマットは書かせる
 * @returns 変換後のデータを返す
 */
const convert2formattedComment = (
  data: unknown,
  type: InputFormatType,
): FormattedComment[] => {
  const targetParsers = parsers.filter((parser) => parser.key.includes(type));
  if (targetParsers.length === 0) throw new InvalidFormatError();

  let firstError: unknown;
  for (const parser of targetParsers) {
    try {
      return sort(parser.parse(data));
    } catch (error) {
      if (
        !(error instanceof InvalidFormatError || error instanceof ValiError)
      ) {
        throw error;
      }
      firstError ??= error;
    }
  }

  throw firstError ?? new InvalidFormatError();
};

/**
 * 共通処理
 * 投稿時間、日時順にソート
 * ※破壊関数
 * @param data ソート対象の配列
 * @returns ソート後の配列
 */
const sort = (data: FormattedComment[]): FormattedComment[] => {
  data.sort(
    (a, b) => a.vpos - b.vpos || a.date - b.date || a.date_usec - b.date_usec,
  );
  return data;
};

export default convert2formattedComment;
