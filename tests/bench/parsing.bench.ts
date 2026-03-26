import { bench, describe } from "vitest";

import { parseCommandAndNicoScript } from "@/utils/comment";

import { generateComments, resetBenchState } from "./helpers";

describe("parseCommandAndNicoScript", () => {
  bench("1000 comments with no commands", () => {
    resetBenchState();
    const comments = generateComments(1000, 10);
    for (const comment of comments) {
      parseCommandAndNicoScript(comment);
    }
  });

  bench("1000 comments with mixed commands", () => {
    resetBenchState();
    const comments = generateComments(1000, 20);
    const mailOptions = [
      ["ue", "big", "red"],
      ["shita", "small", "#FF00FF"],
      ["naka", "medium", "green"],
      ["ue", "gothic"],
      ["mincho", "blue"],
      [],
    ];
    for (let i = 0; i < comments.length; i++) {
      comments[i].mail = mailOptions[i % mailOptions.length];
    }
    for (const comment of comments) {
      parseCommandAndNicoScript(comment);
    }
  });
});

describe("comment sorting", () => {
  bench("sort 1000 comments", () => {
    const comments = generateComments(1000, 30);
    comments.sort((a, b) => {
      if (a.vpos < b.vpos) return -1;
      if (a.vpos > b.vpos) return 1;
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      if (a.date_usec < b.date_usec) return -1;
      if (a.date_usec > b.date_usec) return 1;
      return 0;
    });
  });

  bench("sort 5000 comments", () => {
    const comments = generateComments(5000, 40);
    comments.sort((a, b) => {
      if (a.vpos < b.vpos) return -1;
      if (a.vpos > b.vpos) return 1;
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      if (a.date_usec < b.date_usec) return -1;
      if (a.date_usec > b.date_usec) return 1;
      return 0;
    });
  });
});
