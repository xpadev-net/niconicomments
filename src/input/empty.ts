import type { FormattedComment, InputParser } from "@/@types";

export const EmptyParser: InputParser = {
  key: ["empty"],
  parse: (): FormattedComment[] => {
    return [];
  },
};
