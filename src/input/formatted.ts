import { array, parse } from "valibot";

import type { FormattedComment, InputParser } from "@/@types";
import { ZFormattedComment } from "@/@types";

export const FormattedParser: InputParser = {
  key: ["formatted", "niconicome"],
  parse: (input: unknown): FormattedComment[] => {
    return parse(array(ZFormattedComment), input);
  },
};
