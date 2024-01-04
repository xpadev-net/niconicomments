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
  const parser = parsers.find((parser) => parser.key.includes(type));
  if (!parser) throw new InvalidFormatError();
  return sort(parser.parse(data));
};

/**
 * 共通処理
 * 投稿時間、日時順にソート
 * ※破壊関数
 * @param data ソート対象の配列
 * @returns ソート後の配列
 */
const sort = (data: FormattedComment[]): FormattedComment[] => {
  data.sort((a: FormattedComment, b: FormattedComment) => {
    if (a.vpos < b.vpos) return -1;
    if (a.vpos > b.vpos) return 1;
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    if (a.date_usec < b.date_usec) return -1;
    if (a.date_usec > b.date_usec) return 1;
    return 0;
  });
  return data;
};

export default convert2formattedComment;
