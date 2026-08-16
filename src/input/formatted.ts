import { array, parse } from "valibot";

import type { InputParser, ResolvedFormattedComment } from "@/@types";
import { ZFormattedComment } from "@/@types";

export const FormattedParser: InputParser = {
  key: ["formatted", "niconicome"],
  parse: (input: unknown): ResolvedFormattedComment[] => {
    return parse(array(ZFormattedComment), input);
  },
};
