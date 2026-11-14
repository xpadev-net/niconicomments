import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// 1920x1080 の論理座標での期待幅 (Chromium 実測, issue #472)
const expectedWidths: Record<number, number> = {
  935: 1903.1,
  962: 1911.6,
  963: 1917.2,
  964: 1903.1,
};

const data = JSON.parse(
  readFileSync("tests/fixtures/worldline-ca.json", "utf8"),
);

test("html5SpecialSpaceCompat で特殊空白の CA が Chromium と同じ寸法になる", async ({
  page,
}) => {
  await page.setContent('<canvas width="1920" height="1080"></canvas>');
  await page.addScriptTag({ path: "dist/bundle.js" });
  const result = await page.evaluate((data) => {
    const w = window as unknown as {
      NiconiComments: new (
        canvas: HTMLCanvasElement,
        data: unknown,
        options: unknown,
      ) => {
        drawCanvas(vpos: number): void;
        timeline: Record<
          number,
          { invisible: boolean; width: number; comment: { id: number } }[]
        >;
      };
    };
    const nc = new w.NiconiComments(
      document.querySelector("canvas") as HTMLCanvasElement,
      data,
      {
        format: "formatted",
        mode: "html5",
        keepCA: true,
        config: {
          html5SpecialSpaceCompat: true,
          contextLineWidth: { html5: 0, flash: 0 },
        },
      },
    );
    nc.drawCanvas(21700);
    return (nc.timeline[21700] ?? [])
      .filter((c) => !c.invisible)
      .map((c) => ({ id: c.comment.id, width: c.width }));
  }, data);

  expect(result.map((r) => r.id).sort()).toEqual(
    Object.keys(expectedWidths).map(Number).sort(),
  );
  for (const { id, width } of result) {
    expect(Math.abs(width - (expectedWidths[id] as number))).toBeLessThan(0.5);
  }
});
