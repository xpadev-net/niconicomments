import type { ResolvedFormattedComment } from "@/@types/";

export interface InputParser {
  key: string[];
  parse: (input: unknown) => ResolvedFormattedComment[];
}
