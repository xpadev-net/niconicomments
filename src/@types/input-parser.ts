import type { FormattedComment } from "@/@types/";

export interface InputParser {
  key: string[];
  parse: (input: unknown) => FormattedComment[];
}
