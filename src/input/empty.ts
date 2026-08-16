import type { InputParser, ResolvedFormattedComment } from "@/@types";

export const EmptyParser: InputParser = {
  key: ["empty"],
  parse: (): ResolvedFormattedComment[] => {
    return [];
  },
};
