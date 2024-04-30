/**
 * 特定のキーを使ってオブジェクトをソートする
 * @param getter ソートするキーを取得する関数
 * @returns ソート用の関数
 */
const nativeSort = <T>(getter: (input: T) => number) => {
  return (a: T, b: T) => {
    if (getter(a) > getter(b)) {
      return 1;
    }
    if (getter(a) < getter(b)) {
      return -1;
    }
    return 0;
  };
};

export { nativeSort };
