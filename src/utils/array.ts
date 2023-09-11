import type { IComment } from "@/@types";

/**
 * phpのarray_push的なあれ
 * @param array 追加対象の配列
 * @param key 追加対象のキー
 * @param push 追加する値
 */
const ArrayPush = (
  array: { [key: number]: IComment[] },
  key: string | number,
  push: IComment,
) => {
  if (!array) {
    array = {};
  }
  if (!array[Number(key)]) {
    array[Number(key)] = [];
  }
  array[Number(key)]?.push(push);
};
/**
 * ２つの配列を比較する
 * @param a １つ目
 * @param b ２つ目
 * @returns ２つの配列が等しいか
 */
const ArrayEqual = (a: unknown[], b: unknown[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0, n = a.length; i < n; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export { ArrayEqual, ArrayPush };
