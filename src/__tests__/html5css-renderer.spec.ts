import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const loadCssSample = async (page: Page) => {
  await page.goto(
    "http://localhost:8080/docs/sample/test.html?renderer=css&time=20&video=0",
  );
  // BrowserSync injects this overlay only during local runs; in CI the detached
  // wait resolves immediately, matching the existing visual regression tests.
  await Promise.all([
    page.waitForSelector("div#loaded", { state: "attached" }),
    page.waitForSelector("div#__bs_notify__", { state: "detached" }),
  ]);
};

test("HTML5CSSRenderer contains its logical stage inside the host layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await loadCssSample(page);

  const metrics = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>(
      ".niconicomments-html5css-renderer",
    );
    const layer = root?.querySelector<HTMLElement>("div");
    const rootStyle = root ? getComputedStyle(root) : undefined;
    const layerStyle = layer ? getComputedStyle(layer) : undefined;
    const rootRect = root?.getBoundingClientRect();
    const layerRect = layer?.getBoundingClientRect();
    return {
      rootWidth: rootStyle?.width,
      rootHeight: rootStyle?.height,
      layerWidth: layerStyle?.width,
      layerHeight: layerStyle?.height,
      layerTransform: layerStyle?.transform,
      rootRect: rootRect
        ? {
            left: rootRect.left,
            top: rootRect.top,
            right: rootRect.right,
            bottom: rootRect.bottom,
          }
        : undefined,
      layerRect: layerRect
        ? {
            left: layerRect.left,
            top: layerRect.top,
            right: layerRect.right,
            bottom: layerRect.bottom,
          }
        : undefined,
    };
  });

  expect(metrics).toMatchObject({
    rootWidth: "360px",
    rootHeight: "900px",
    layerWidth: "1920px",
    layerHeight: "1080px",
  });
  expect(metrics.layerTransform).not.toBe("none");
  expect(metrics.rootRect).toBeDefined();
  expect(metrics.layerRect).toBeDefined();
  if (!metrics.rootRect || !metrics.layerRect) throw new Error("missing rect");
  expect(metrics.layerRect.left).toBeGreaterThanOrEqual(metrics.rootRect.left);
  expect(metrics.layerRect.top).toBeGreaterThanOrEqual(metrics.rootRect.top);
  expect(metrics.layerRect.right).toBeLessThanOrEqual(metrics.rootRect.right);
  expect(metrics.layerRect.bottom).toBeLessThanOrEqual(metrics.rootRect.bottom);
});

test("HTML5CSSRenderer commits direct canvas drawing into its DOM layer", async ({
  page,
}) => {
  await loadCssSample(page);

  const renderedChildren = await page.evaluate(() => {
    const root = document.createElement("div");
    root.dataset.width = "100";
    root.dataset.height = "100";
    document.body.appendChild(root);
    const global = window as typeof window & {
      NiconiComments: typeof import("@/main").default;
    };
    const renderer =
      new global.NiconiComments.internal.renderer.HTML5CSSRenderer(root);
    renderer.setFillStyle("#ff0000");
    renderer.fillRect(0, 0, 10, 10);
    renderer.flush();
    const layer = root.querySelector<HTMLElement>("div");
    const visibleChildren = layer
      ? Array.from(layer.children).filter((child) => {
          const style = getComputedStyle(child);
          return style.display !== "none";
        }).length
      : 0;
    renderer.destroy();
    root.remove();
    return visibleChildren;
  });

  expect(renderedChildren).toBeGreaterThan(0);
});

test("HTML5CSSRenderer keeps an active path across DOM-backed drawing", async ({
  page,
}) => {
  await loadCssSample(page);

  const strokedPixel = await page.evaluate(() => {
    const root = document.createElement("div");
    root.dataset.width = "100";
    root.dataset.height = "100";
    document.body.appendChild(root);
    const global = window as typeof window & {
      NiconiComments: typeof import("@/main").default;
    };
    const renderer =
      new global.NiconiComments.internal.renderer.HTML5CSSRenderer(root);
    renderer.setStrokeStyle("#00ff00");
    renderer.setLineWidth(4);
    renderer.beginPath();
    renderer.moveTo(0, 10);
    renderer.lineTo(40, 10);
    renderer.fillRect(0, 0, 20, 20);
    renderer.stroke();
    renderer.flush();
    const canvases = Array.from(root.querySelectorAll("canvas")).filter(
      (canvas) => getComputedStyle(canvas).display !== "none",
    );
    const canvas = canvases.at(-1);
    const pixel = canvas?.getContext("2d")?.getImageData(10, 10, 1, 1).data;
    renderer.destroy();
    root.remove();
    return pixel ? Array.from(pixel) : undefined;
  });

  expect(strokedPixel?.[1]).toBeGreaterThan(0);
});

test("HTML5CSSRenderer uses computed CSS dimensions as its initial logical size", async ({
  page,
}) => {
  await loadCssSample(page);

  const metrics = await page.evaluate(() => {
    const root = document.createElement("div");
    root.style.width = "320px";
    root.style.height = "180px";
    document.body.appendChild(root);
    const global = window as typeof window & {
      NiconiComments: typeof import("@/main").default;
    };
    const renderer =
      new global.NiconiComments.internal.renderer.HTML5CSSRenderer(root);
    const size = renderer.getSize();
    const layer = root.querySelector<HTMLElement>("div");
    const layerStyle = layer ? getComputedStyle(layer) : undefined;
    const layerWidth = layerStyle?.width;
    const layerHeight = layerStyle?.height;
    renderer.destroy();
    root.remove();
    return {
      width: size.width,
      height: size.height,
      layerWidth,
      layerHeight,
    };
  });

  expect(metrics).toEqual({
    width: 320,
    height: 180,
    layerWidth: "320px",
    layerHeight: "180px",
  });
});
