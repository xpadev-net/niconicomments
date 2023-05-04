import { expect, Page, test } from "@playwright/test";

test("0(レッツゴー陰陽師)", async ({ page }) => {
  await compare(page, 0, 20);
});

test("7(to the beginning)", async ({ page }) => {
  await compare(page, 7, 60);
});

test("15(残響散歌)", async ({ page }) => {
  await compare(page, 15, 50);
});

const compare = async (page: Page, video: number, time: number) => {
  await page.goto(
    `http://localhost:3000/docs/sample/index.html?novideo=1&time=${time}&video=${video}`,
    { waitUntil: "networkidle" }
  );
  await expect(page).toHaveScreenshot(`${video}-${time}.png`);
  expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(
    `${video}-${time}.png`,
    { threshold: 0.075 }
  );
};
