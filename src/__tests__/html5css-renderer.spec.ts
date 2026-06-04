import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

// Used by the layout test that inspects the CSS renderer mounted on the page.
const loadCssSample = async (page: Page) => {
  await page.goto(
    "http://localhost:8080/docs/sample/test.html?renderer=css&time=20&video=0",
  );
  // BrowserSync injects this overlay only during local runs; in CI the detached
  // wait resolves immediately, matching the existing visual regression tests.
  await Promise.race([
    page.waitForSelector("div#loaded", { state: "attached" }),
    page.waitForSelector("div#renderer-error", { state: "attached" }),
  ]);
  await page.waitForSelector("div#__bs_notify__", { state: "detached" });
  if ((await page.locator("#renderer-error").count()) > 0) {
    throw new Error(
      `CSS renderer failed: ${await page.locator("#renderer-error").textContent()}`,
    );
  }
};

// Used by tests that construct their own renderer inside page.evaluate —
// they only need the bundle present, not a CSS-rendered page.
const loadBundle = async (page: Page) => {
  await page.goto("http://localhost:8080/docs/sample/test.html?time=0&video=0");
  // Serialise the two waits so the BrowserSync overlay cannot appear between
  // them and race with drawing assertions (same pattern as loadCssSample).
  await page.waitForSelector("div#loaded", { state: "attached" });
  await page.waitForSelector("div#__bs_notify__", { state: "detached" });
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
  await loadBundle(page);

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

test("HTML5CSSRenderer resets state to defaults on clearRect", async ({
  page,
}) => {
  await loadBundle(page);

  const rectWidth = await page.evaluate(() => {
    const root = document.createElement("div");
    root.dataset.width = "200";
    root.dataset.height = "100";
    document.body.appendChild(root);
    const global = window as typeof window & {
      NiconiComments: typeof import("@/main").default;
    };
    const renderer =
      new global.NiconiComments.internal.renderer.HTML5CSSRenderer(root);
    // Set scale before clearRect — it must NOT bleed into the next frame.
    renderer.setScale(2);
    renderer.clearRect(0, 0, 200, 100);
    renderer.fillRect(1, 1, 10, 10);
    renderer.flush();
    const layer = root.querySelector<HTMLElement>("div");
    const node = layer?.firstElementChild;
    const width = node ? getComputedStyle(node).width : undefined;
    renderer.destroy();
    root.remove();
    return width;
  });

  // scale resets to 1 on clearRect → 10 × 1 = 10 px
  expect(rectWidth).toBe("10px");
});

test("HTML5CSSRenderer discards imbalanced saved state on clearRect", async ({
  page,
}) => {
  await loadBundle(page);

  const rectWidth = await page.evaluate(() => {
    const root = document.createElement("div");
    root.dataset.width = "200";
    root.dataset.height = "100";
    document.body.appendChild(root);
    const global = window as typeof window & {
      NiconiComments: typeof import("@/main").default;
    };
    const renderer =
      new global.NiconiComments.internal.renderer.HTML5CSSRenderer(root);
    renderer.setScale(2);
    renderer.save();
    renderer.setScale(3);
    renderer.flush();
    renderer.clearRect(0, 0, 200, 100);
    renderer.fillRect(1, 1, 10, 10);
    renderer.flush();
    const layer = root.querySelector<HTMLElement>("div");
    const node = layer?.firstElementChild;
    const width = node ? getComputedStyle(node).width : undefined;
    renderer.destroy();
    root.remove();
    return width;
  });

  // clearRect resets all state to defaults (scale=1); neither scale=2 nor
  // scale=6 (2×3) from the imbalanced save should bleed into the next frame.
  expect(rectWidth).toBe("10px");
});

test("HTML5CSSRenderer restores helper drawing after zero scale", async ({
  page,
}) => {
  await loadBundle(page);

  const paintedPixels = await page.evaluate(() => {
    const root = document.createElement("div");
    root.dataset.width = "100";
    root.dataset.height = "100";
    document.body.appendChild(root);
    const global = window as typeof window & {
      NiconiComments: typeof import("@/main").default;
    };
    const renderer =
      new global.NiconiComments.internal.renderer.HTML5CSSRenderer(root);
    renderer.setScale(2);
    renderer.save();
    renderer.setScale(0);
    renderer.restore();
    renderer.setFont("20px sans-serif");
    renderer.fillText("x", 5, 20);
    renderer.flush();
    const canvases = Array.from(root.querySelectorAll("canvas")).filter(
      (canvas) => getComputedStyle(canvas).display !== "none",
    );
    const canvas = canvases.at(-1);
    const pixels = canvas?.getContext("2d")?.getImageData(0, 0, 100, 100).data;
    renderer.destroy();
    root.remove();
    if (!pixels) return 0;
    let count = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i]) count++;
    }
    return count;
  });

  expect(paintedPixels).toBeGreaterThan(0);
});

test("HTML5CSSRenderer keeps an active path across DOM-backed drawing", async ({
  page,
}) => {
  await loadBundle(page);
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") {
      warnings.push(message.text());
    }
  });

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
  expect(warnings).toContain(
    "HTML5CSSRenderer: DOM drawing interleaved with an active path before stroke().",
  );
});

test("HTML5CSSRenderer clears text-before-DOM warning state after flush", async ({
  page,
}) => {
  await loadBundle(page);
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") {
      warnings.push(message.text());
    }
  });

  await page.evaluate(() => {
    const root = document.createElement("div");
    root.dataset.width = "100";
    root.dataset.height = "100";
    document.body.appendChild(root);
    const global = window as typeof window & {
      NiconiComments: typeof import("@/main").default;
    };
    const renderer =
      new global.NiconiComments.internal.renderer.HTML5CSSRenderer(root);
    renderer.fillText("x", 10, 20);
    renderer.flush();
    renderer.fillRect(0, 0, 10, 10);
    renderer.flush();
    renderer.destroy();
    root.remove();
  });

  expect(warnings).not.toContain(
    "HTML5CSSRenderer: text drawn before a DOM-backed draw may render below it.",
  );
});

test("HTML5CSSRenderer reapplies helper context defaults after resizing surfaces", async ({
  page,
}) => {
  await loadBundle(page);

  const lineJoin = await page.evaluate(() => {
    const root = document.createElement("div");
    root.dataset.width = "100";
    root.dataset.height = "100";
    document.body.appendChild(root);
    const global = window as typeof window & {
      NiconiComments: typeof import("@/main").default;
    };
    const renderer =
      new global.NiconiComments.internal.renderer.HTML5CSSRenderer(root);
    renderer.beginPath();
    renderer.moveTo(0, 10);
    renderer.lineTo(10, 20);
    renderer.lineTo(20, 10);
    renderer.stroke();
    renderer.flush();
    const canvases = Array.from(root.querySelectorAll("canvas")).filter(
      (canvas) => getComputedStyle(canvas).display !== "none",
    );
    const canvas = canvases.at(-1);
    const result = canvas?.getContext("2d")?.lineJoin;
    renderer.destroy();
    root.remove();
    return result;
  });

  expect(lineJoin).toBe("round");
});

test("HTML5CSSRenderer keeps the video surface below DOM and text layers", async ({
  page,
}) => {
  await loadBundle(page);

  const order = await page.evaluate(() => {
    const root = document.createElement("div");
    root.dataset.width = "100";
    root.dataset.height = "100";
    document.body.appendChild(root);
    const video = document.createElement("video");
    const global = window as typeof window & {
      NiconiComments: typeof import("@/main").default;
    };
    const renderer =
      new global.NiconiComments.internal.renderer.HTML5CSSRenderer(root, video);
    renderer.drawVideo(false);
    renderer.setFillStyle("#ff0000");
    renderer.fillRect(0, 0, 10, 10);
    renderer.fillText("x", 20, 20);
    renderer.flush();
    const layer = root.querySelector<HTMLElement>("div");
    const children = layer ? Array.from(layer.children) : [];
    const result = {
      firstTag: children.at(0)?.tagName.toLowerCase(),
      secondTag: children.at(1)?.tagName.toLowerCase(),
      lastTag: children.at(-1)?.tagName.toLowerCase(),
      length: children.length,
    };
    renderer.destroy();
    root.remove();
    return result;
  });

  expect(order).toEqual({
    firstTag: "canvas",
    secondTag: "div",
    lastTag: "canvas",
    length: 3,
  });
});

test("HTML5CSSRenderer caps and trims helper surfaces", async ({ page }) => {
  await loadBundle(page);

  const counts = await page.evaluate(() => {
    const root = document.createElement("div");
    root.dataset.width = "100";
    root.dataset.height = "100";
    document.body.appendChild(root);
    const global = window as typeof window & {
      NiconiComments: typeof import("@/main").default;
    };
    const renderer =
      new global.NiconiComments.internal.renderer.HTML5CSSRenderer(root);
    for (let i = 0; i < 20; i++) {
      renderer.fillText("x", i, i + 10);
      renderer.fillRect(i, i, 1, 1);
    }
    renderer.flush();
    const layer = root.querySelector<HTMLElement>("div");
    const beforeClear = layer
      ? Array.from(layer.children).filter(
          (child) => child.tagName.toLowerCase() === "canvas",
        ).length
      : 0;
    renderer.clearRect(0, 0, 100, 100);
    const afterClear = layer
      ? Array.from(layer.children).filter(
          (child) => child.tagName.toLowerCase() === "canvas",
        ).length
      : 0;
    renderer.destroy();
    root.remove();
    return { beforeClear, afterClear };
  });

  expect(counts.beforeClear).toBeLessThanOrEqual(8);
  expect(counts.afterClear).toBe(1);
});

test("HTML5CSSRenderer refreshes drawImage snapshots after sub-renderer clears", async ({
  page,
}) => {
  await loadBundle(page);

  const result = await page.evaluate(() => {
    const root = document.createElement("div");
    root.dataset.width = "100";
    root.dataset.height = "100";
    document.body.appendChild(root);
    const global = window as typeof window & {
      NiconiComments: typeof import("@/main").default;
    };
    const renderer =
      new global.NiconiComments.internal.renderer.HTML5CSSRenderer(root);
    const image = renderer.getCanvas();
    image.setSize(10, 10);
    image.setFillStyle("#ff0000");
    image.fillRect(0, 0, 10, 10);
    renderer.drawImage(image, 0, 0);
    renderer.flush();
    const source = image.canvas;
    const firstInLayer = root.contains(source);
    const ctx = source.getContext("2d");
    const firstAlpha = ctx?.getImageData(0, 0, 1, 1).data[3] ?? -1;

    renderer.clearRect(0, 0, 100, 100);
    image.clearRect(0, 0, 10, 10);
    renderer.drawImage(image, 0, 0);
    renderer.flush();
    const secondInLayer = root.contains(source);
    const secondAlpha = ctx?.getImageData(0, 0, 1, 1).data[3] ?? -1;

    image.destroy();
    renderer.destroy();
    root.remove();
    return { firstInLayer, secondInLayer, firstAlpha, secondAlpha };
  });

  expect(result.firstInLayer).toBe(true);
  expect(result.secondInLayer).toBe(true);
  expect(result.firstAlpha).toBe(255);
  expect(result.secondAlpha).toBe(0);
});

test("HTML5CSSRenderer refreshes drawImage snapshots after sub-renderer resize", async ({
  page,
}) => {
  await loadBundle(page);

  const metrics = await page.evaluate(() => {
    const root = document.createElement("div");
    root.dataset.width = "100";
    root.dataset.height = "100";
    document.body.appendChild(root);
    const global = window as typeof window & {
      NiconiComments: typeof import("@/main").default;
    };
    const renderer =
      new global.NiconiComments.internal.renderer.HTML5CSSRenderer(root);
    const image = renderer.getCanvas();
    image.setSize(10, 10);
    image.setFillStyle("#ff0000");
    image.fillRect(0, 0, 10, 10);
    renderer.drawImage(image, 0, 0);
    renderer.flush();
    const source = image.canvas;
    const firstInLayer = root.contains(source);
    const firstWidth = firstInLayer
      ? getComputedStyle(source).width
      : undefined;
    const firstHeight = firstInLayer
      ? getComputedStyle(source).height
      : undefined;

    renderer.clearRect(0, 0, 100, 100);
    image.setSize(20, 5);
    renderer.drawImage(image, 0, 0);
    renderer.flush();
    const secondInLayer = root.contains(source);
    const width = secondInLayer ? getComputedStyle(source).width : undefined;
    const height = secondInLayer ? getComputedStyle(source).height : undefined;

    image.destroy();
    renderer.destroy();
    root.remove();
    return {
      firstInLayer,
      secondInLayer,
      firstWidth,
      firstHeight,
      width,
      height,
    };
  });

  expect(metrics.firstInLayer).toBe(true);
  expect(metrics.secondInLayer).toBe(true);
  expect(metrics.firstWidth).toBe("10px");
  expect(metrics.firstHeight).toBe("10px");
  expect(metrics.width).toBe("20px");
  expect(metrics.height).toBe("5px");
});

test("HTML5CSSRenderer uses clamped canvas dimensions consistently", async ({
  page,
}) => {
  await loadBundle(page);

  const metrics = await page.evaluate(() => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const global = window as typeof window & {
      NiconiComments: typeof import("@/main").default;
    };
    const renderer =
      new global.NiconiComments.internal.renderer.HTML5CSSRenderer(root);
    renderer.setSize(10000, 10000);
    const size = renderer.getSize();
    const layer = root.querySelector<HTMLElement>("div");
    const layerStyle = layer ? getComputedStyle(layer) : undefined;
    const layerWidth = layerStyle?.width;
    const layerHeight = layerStyle?.height;
    const canvas = root.querySelector("canvas");
    renderer.destroy();
    root.remove();
    return {
      width: size.width,
      height: size.height,
      layerWidth,
      layerHeight,
      canvasWidth: canvas?.width,
      canvasHeight: canvas?.height,
    };
  });

  expect(metrics).toEqual({
    width: 4096,
    height: 4096,
    layerWidth: "4096px",
    layerHeight: "4096px",
    canvasWidth: 4096,
    canvasHeight: 4096,
  });
});

test("HTML5CSSRenderer uses computed CSS dimensions as its initial logical size", async ({
  page,
}) => {
  await loadBundle(page);

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
