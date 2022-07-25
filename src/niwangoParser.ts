//@ts-ignore
import { parse as peg$parse } from "./niwango.peg.js";
import typeGuard from "@/typeGuard";

/**
 * pgejsのラッパー
 * 型つけるだけ
 * @param arg
 */
const parse = (arg: string | formattedComment) => {
  if (typeGuard.formatted.comment(arg)) {
    return peg$parse(arg.content.substring(1));
  } else {
    return peg$parse(arg);
  }
};

export default parse;
