/**
 * Cross-renderer equivalence tests.
 *
 * Each test renders the same comment data at the same timestamp with two
 * different renderers and asserts that the resulting screenshots are visually
 * equivalent (within a per-pixel tolerance).  Canvas2D is the reference
 * renderer because it is the most deterministic.
 *
 * Viewport is fixed at 1920×1080 so that:
 *   - The canvas `object-fit:contain` scale factor is exactly 1 (no resampling)
 *   - The CSS-renderer layer `transform:scale()` is also exactly 1
 * This eliminates letterbox-related pixel differences and keeps tolerances tight.
 *
 * NOTE: visual-regression tests must run on GitHub CI (not locally) due to
 * font rendering differences across platforms.
 */

import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

// Same video/time pairs as test.spec.ts
const CASES: Array<[video: number, time: number]> = [
  [0, 20],
  [7, 60],
  [8, 50],
  [8, 80],
  [8, 90],
  [9, 70],
  [11, 55],
  [11, 90],
  [15, 50],
  [15, 90],
  [15, 105],
  [22, 140],
];

// Viewport matches the canvas/layer logical size — eliminates scaling artefacts.
const VIEWPORT = { width: 1920, height: 1080 };

// Maximum fraction of pixels allowed to differ between renderers.
// CSS shares the same pre-rendered sub-canvases as Canvas2D, so compositing
// edges are the only source of divergence → tight budget.
// WebGL2 goes through GPU texture sampling which can shift colours slightly.
const MAX_DIFF_RATIO_CSS = 0.01;
const MAX_DIFF_RATIO_WEBGL = 0.02;

// Per-pixel channel tolerance passed to pixelmatch (0–1 range, maps to 0–255).
const PIXELMATCH_THRESHOLD = 0.1;

async function loadRenderer(
  page: Page,
  video: number,
  time: number,
  renderer: string,
): Promise<boolean> {
  await page.goto(
    `http://localhost:8080/docs/sample/test.html?time=${time}&video=${video}&renderer=${renderer}`,
  );
  await Promise.race([
    page.waitForSelector("div#loaded", { state: "attached" }),
    page.waitForSelector("div#renderer-error", { state: "attached" }),
  ]);
  if ((await page.locator("#renderer-error").count()) > 0) {
    return false;
  }
  await page.waitForSelector("div#__bs_notify__", { state: "detached" });
  return true;
}

function diffRatio(a: Buffer, b: Buffer): number {
  const imgA = PNG.sync.read(a);
  const imgB = PNG.sync.read(b);
  const { width, height } = imgA;
  if (imgB.width !== width || imgB.height !== height) {
    throw new Error(
      `Screenshot dimension mismatch: ${width}x${height} vs ${imgB.width}x${imgB.height}`,
    );
  }
  const numDiff = pixelmatch(imgA.data, imgB.data, undefined, width, height, {
    threshold: PIXELMATCH_THRESHOLD,
  });
  return numDiff / (width * height);
}

for (const [video, time] of CASES) {
  test(`css matches canvas: video=${video} time=${time}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT);

    await loadRenderer(page, video, time, "canvas");
    const canvasShot = await page.screenshot();

    const cssOk = await loadRenderer(page, video, time, "css");
    if (!cssOk) {
      test.skip(true, "CSS renderer not available in this environment");
      return;
    }
    const cssShot = await page.screenshot();

    const ratio = diffRatio(canvasShot, cssShot);
    expect(
      ratio,
      `pixel diff ratio (${(ratio * 100).toFixed(2)}%)`,
    ).toBeLessThanOrEqual(MAX_DIFF_RATIO_CSS);
  });

  test(`webgl matches canvas: video=${video} time=${time}`, async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORT);

    await loadRenderer(page, video, time, "canvas");
    const canvasShot = await page.screenshot();

    const ok = await loadRenderer(page, video, time, "webgl");
    if (!ok) {
      test.skip(true, "WebGL2 not available in this environment");
      return;
    }
    const webglShot = await page.screenshot();

    const ratio = diffRatio(canvasShot, webglShot);
    expect(
      ratio,
      `pixel diff ratio (${(ratio * 100).toFixed(2)}%)`,
    ).toBeLessThanOrEqual(MAX_DIFF_RATIO_WEBGL);
  });
}
