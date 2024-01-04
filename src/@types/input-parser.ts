import type { FormattedComment } from "@/@types/format.formatted";

export interface InputParser {
  key: string[];
  parse: (input: unknown) => FormattedComment[];
}
