import { check, number, pipe } from "valibot";

type NumberRangeOptions = {
  min?: number;
  max?: number;
  integer?: boolean;
};

const MAX_SAFE_TIMELINE_VALUE = Number.MAX_SAFE_INTEGER;
const MIN_SAFE_TIMELINE_VALUE = Number.MIN_SAFE_INTEGER;

export const isFiniteNumberInRange = (
  value: unknown,
  {
    min = 0,
    max = MAX_SAFE_TIMELINE_VALUE,
    integer = true,
  }: NumberRangeOptions = {},
): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max &&
  (!integer || Number.isInteger(value));

const rangedNumber = (options?: NumberRangeOptions) =>
  pipe(
    number(),
    check((value) => isFiniteNumberInRange(value, options)),
  );

export const ZCommentId = rangedNumber();
export const ZCommentVpos = rangedNumber({ min: MIN_SAFE_TIMELINE_VALUE });
export const ZCommentDate = rangedNumber();
export const ZCommentDateUsec = rangedNumber({ max: 999_999 });
export const ZCommentUserId = rangedNumber({ min: -1 });
export const ZCommentLayer = rangedNumber({ min: -1 });

export const toFiniteNumberInRange = (
  value: unknown,
  options?: NumberRangeOptions,
): number | undefined => {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return undefined;
  }
  const numericValue = typeof value === "number" ? value : Number(value);
  return isFiniteNumberInRange(numericValue, options)
    ? numericValue
    : undefined;
};
