import type { IComment } from "@/@types";

/**
 * phpのarray_push的なあれ
 * @param array
 * @param {string|number} key
 * @param push
 */
const ArrayPush = (
  array: { [key: number]: IComment[] },
  key: string | number,
  push: IComment
) => {
  if (!array) {
    array = {};
  }
  if (!array[Number(key)]) {
    array[Number(key)] = [];
  }
  array[Number(key)]?.push(push);
};
const ArrayEqual = (a: unknown[], b: unknown[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0, n = a.length; i < n; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export { ArrayEqual, ArrayPush };
