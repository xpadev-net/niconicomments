import { expect, test } from "@playwright/test";

test("HTML5CSSRenderer contains its logical stage inside the host layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto(
    "http://localhost:8080/docs/sample/test.html?renderer=css&time=20&video=0",
  );
  await page.waitForSelector("div#loaded", { state: "attached" });

  const metrics = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>(
      ".niconicomments-html5css-renderer",
    );
    const layer = root?.querySelector<HTMLElement>("div");
    const rootStyle = root ? getComputedStyle(root) : undefined;
    const layerStyle = layer ? getComputedStyle(layer) : undefined;
    const rootRect = root?.getBoundingClientRect();
    const layerRect = layer?.getBoundingClientRect();
    const renderedChildren = layer
      ? Array.from(layer.children).filter((child) => {
          const style = getComputedStyle(child);
          return style.display !== "none";
        }).length
      : 0;
    return {
      rootWidth: rootStyle?.width,
      rootHeight: rootStyle?.height,
      layerWidth: layerStyle?.width,
      layerHeight: layerStyle?.height,
      layerTransform: layerStyle?.transform,
      renderedChildren,
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
  expect(metrics.renderedChildren).toBeGreaterThan(0);
  expect(metrics.rootRect).toBeDefined();
  expect(metrics.layerRect).toBeDefined();
  if (!metrics.rootRect || !metrics.layerRect) throw new Error("missing rect");
  expect(metrics.layerRect.left).toBeGreaterThanOrEqual(metrics.rootRect.left);
  expect(metrics.layerRect.top).toBeGreaterThanOrEqual(metrics.rootRect.top);
  expect(metrics.layerRect.right).toBeLessThanOrEqual(metrics.rootRect.right);
  expect(metrics.layerRect.bottom).toBeLessThanOrEqual(metrics.rootRect.bottom);
});
