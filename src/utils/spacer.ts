/**
 * compatSpacer の幅を取得する
 * undefined のみを「未指定」として扱い、0 は幅 0 の spacer として返す
 * @param entry 文字に対するフォント別の幅定義
 * @param font フォント
 * @returns 幅(em比例)。未指定の場合は undefined
 */
const getCompatSpacerWidth = <Font extends string>(
  entry: Partial<Record<Font, number>> | undefined,
  font: Font,
): number | undefined => entry?.[font];

export { getCompatSpacerWidth };
