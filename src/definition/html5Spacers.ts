/**
 * U+2000-U+2006 の空白の幅(em比例)
 * Chromium / Firefox で名前付きフォントを計測した値と一致する。
 * WebKit ではグリフ欠落時のフォールバックで幅が変わるため、計測せずこの定数を使う。
 */
const HTML5_SPECIAL_SPACE_EM_WIDTH: { [char: string]: number } = {
  " ": 1 / 2,
  " ": 1,
  " ": 1 / 2,
  " ": 1,
  " ": 1 / 3,
  " ": 1 / 4,
  " ": 1 / 6,
};

export { HTML5_SPECIAL_SPACE_EM_WIDTH };
