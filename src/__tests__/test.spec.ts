import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

test("0(レッツゴー陰陽師)", async ({ page }) => {
  await compare(page, 0, 20);
});

test("7(to the beginning)", async ({ page }) => {
  await compare(page, 7, 60);
});

test("8(満天)", async ({ page }) => {
  await compare(page, 8, 50);
  await compare(page, 8, 80);
  await compare(page, 8, 90);
});

test("9(うっせぇわ)", async ({ page }) => {
  await compare(page, 9, 70);
});

test("11(アンインストール)", async ({ page }) => {
  await compare(page, 11, 55);
  await compare(page, 11, 90);
});

test("15(残響散歌)", async ({ page }) => {
  await compare(page, 15, 50);
  await compare(page, 15, 90);
  await compare(page, 15, 105);
});

test("22(ヨワイボクラハウタウ)", async ({ page }) => {
  await compare(page, 22, 140);
});

test("-1(regression fixtures)", async ({ page }) => {
  await compareWithVersion(page, -1, 45.95, "0.2.76");
  await compareWithVersion(page, -1, 46, "0.2.76");
});

const compare = async (page: Page, video: number, time: number) => {
  await loadSample(page, video, time);
  await expect(page).toHaveScreenshot(`${video}-${time}.png`);
  expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(
    `${video}-${time}.png`,
    { threshold: 0.075 },
  );
};

const compareWithVersion = async (
  page: Page,
  video: number,
  time: number,
  ncVersion: string,
) => {
  await loadSample(page, video, time, ncVersion);
  const expected = PNG.sync.read(await page.screenshot({ fullPage: true }));

  await loadSample(page, video, time);
  const actual = PNG.sync.read(await page.screenshot({ fullPage: true }));

  expect(actual.width).toBe(expected.width);
  expect(actual.height).toBe(expected.height);

  const diff = new PNG({ width: actual.width, height: actual.height });
  const diffPixels = pixelmatch(
    expected.data,
    actual.data,
    diff.data,
    actual.width,
    actual.height,
    { threshold: 0.075 },
  );

  expect(
    diffPixels,
    `${video}-${time} differs from ${ncVersion}`,
  ).toBeLessThanOrEqual(64);
};

const loadSample = async (
  page: Page,
  video: number,
  time: number,
  ncVersion?: string,
) => {
  const query = new URLSearchParams({
    time: String(time),
    video: String(video),
  });
  if (ncVersion) {
    query.set("ncVersion", ncVersion);
  }
  await page.goto(`/docs/sample/test.html?${query}`);
  await Promise.all([
    page.waitForSelector("div#loaded", { state: "attached" }),
    page.waitForSelector("div#__bs_notify__", { state: "detached" }),
  ]);
};
