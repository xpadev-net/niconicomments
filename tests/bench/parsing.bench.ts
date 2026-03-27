import { bench, describe } from "vitest";

import type { FormattedComment } from "@/@types";
import { parseCommandAndNicoScript } from "@/utils/comment";

import { generateComments, resetBenchState } from "./helpers";

// セットアップを1回だけ実行
resetBenchState();

const commentsNoCmd = generateComments(1000, 10);

const commentsMixedCmd = generateComments(1000, 20);
const mailOptions = [
  ["ue", "big", "red"],
  ["shita", "small", "#FF00FF"],
  ["naka", "medium", "green"],
  ["ue", "gothic"],
  ["mincho", "blue"],
  [],
];
for (let i = 0; i < commentsMixedCmd.length; i++) {
  commentsMixedCmd[i].mail = mailOptions[i % mailOptions.length];
}

const sortBase1000 = generateComments(1000, 30);
const sortBase5000 = generateComments(5000, 40);

/** ソート用に浅いコピーを作成（sort は破壊的） */
const cloneComments = (src: FormattedComment[]): FormattedComment[] =>
  src.map((c) => ({ ...c }));

const sortFn = (a: FormattedComment, b: FormattedComment) => {
  if (a.vpos < b.vpos) return -1;
  if (a.vpos > b.vpos) return 1;
  if (a.date < b.date) return -1;
  if (a.date > b.date) return 1;
  if (a.date_usec < b.date_usec) return -1;
  if (a.date_usec > b.date_usec) return 1;
  return 0;
};

describe("parseCommandAndNicoScript", () => {
  bench("1000 comments with no commands", () => {
    for (const comment of commentsNoCmd) {
      parseCommandAndNicoScript(comment);
    }
  });

  bench("1000 comments with mixed commands", () => {
    for (const comment of commentsMixedCmd) {
      parseCommandAndNicoScript(comment);
    }
  });
});

describe("comment sorting", () => {
  bench("sort 1000 comments", () => {
    cloneComments(sortBase1000).sort(sortFn);
  });

  bench("sort 5000 comments", () => {
    cloneComments(sortBase5000).sort(sortFn);
  });
});
