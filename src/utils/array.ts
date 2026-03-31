import type { IComment } from "@/@types";

/**
 * phpのarray_push的なあれ
 * @param _array 追加対象の配列
 * @param key 追加対象のキー
 * @param push 追加する値
 */
const arrayPush = (
  _array: { [key: number]: IComment[] },
  key: number,
  push: IComment,
) => {
  const arr = _array[key];
  if (arr) {
    arr.push(push);
  } else {
    _array[key] = [push];
  }
};
/**
 * ２つの配列を比較する
 * @param a １つ目
 * @param b ２つ目
 * @returns ２つの配列が等しいか
 */
const arrayEqual = (a: readonly unknown[], b: readonly unknown[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0, n = a.length; i < n; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export { arrayEqual, arrayPush };
