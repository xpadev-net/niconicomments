import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

// Used by the layout test that inspects the CSS renderer mounted on the page.
const loadCssSample = async (page: Page) => {
  await page.goto("/docs/sample/test.html?renderer=css&time=20&video=0");
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
  await page.goto("/docs/sample/test.html?time=0&video=0");
  await Promise.race([
    page.waitForSelector("div#loaded", { state: "attached" }),
    page.waitForSelector("div#renderer-error", { state: "attached" }),
  ]);
  if ((await page.locator("#renderer-error").count()) > 0) {
    throw new Error(
      `Page failed to load: ${await page.locator("#renderer-error").textContent()}`,
    );
  }
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

test("HTML5CSSRenderer preserves display scale across clearRect", async ({
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
    // Scale set before any frame (mirrors main.ts constructor setScale).
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

  // Display scale 2 persists across clearRect → 10 × 2 = 20 px
  expect(rectWidth).toBe("20px");
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
    // Display scale 2 is the frame-start scale.
    renderer.setScale(2);
    // An imbalanced save/setScale — the extra scale(3) must not survive clearRect.
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

  // clearRect restores to the frame-start scale (2); the accumulated scale(3)
  // from inside the imbalanced save must not bleed (scale must not be 6).
  // Display scale 2 is preserved: 10 × 2 = 20 px.
  expect(rectWidth).toBe("20px");
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

test("HTML5CSSRenderer bounds duplicate owned canvas clones per frame", async ({
  page,
}) => {
  await loadBundle(page);

  const result = await page.evaluate(() => {
    const global = window as typeof window & {
      NiconiComments: typeof import("@/main").default;
    };
    const createRenderer = () => {
      const root = document.createElement("div");
      root.dataset.width = "200";
      root.dataset.height = "100";
      document.body.appendChild(root);
      const renderer =
        new global.NiconiComments.internal.renderer.HTML5CSSRenderer(root);
      const layer = root.querySelector<HTMLElement>("div");
      if (!layer) throw new Error("missing renderer layer");
      return { root, renderer, layer };
    };
    const countLayerCanvases = (layer: HTMLElement) =>
      Array.from(layer.children).filter(
        (child) => child.tagName.toLowerCase() === "canvas",
      ).length;
    const countVisibleLayerCanvases = (layer: HTMLElement) =>
      Array.from(layer.children).filter(
        (child) =>
          child.tagName.toLowerCase() === "canvas" &&
          getComputedStyle(child).display !== "none",
      ).length;
    const drawRepeatedly = (
      renderer: InstanceType<
        typeof global.NiconiComments.internal.renderer.HTML5CSSRenderer
      >,
      image: ReturnType<
        InstanceType<
          typeof global.NiconiComments.internal.renderer.HTML5CSSRenderer
        >["getCanvas"]
      >,
      count: number,
    ) => {
      for (let i = 0; i < count; i++) {
        renderer.drawImage(image, i % 200, Math.floor(i / 200) * 12);
      }
    };
    const withVirtualCreatedCanvases = <T>(callback: () => T): T => {
      const originalCreateElement = document.createElement;
      document.createElement = ((
        tagName: string,
        options?: ElementCreationOptions,
      ) => {
        const element = originalCreateElement.call(document, tagName, options);
        if (tagName.toLowerCase() === "canvas") {
          let virtualWidth = 0;
          let virtualHeight = 0;
          Object.defineProperty(element, "width", {
            configurable: true,
            get: () => virtualWidth,
            set: (value) => {
              virtualWidth = Number(value) || 0;
            },
          });
          Object.defineProperty(element, "height", {
            configurable: true,
            get: () => virtualHeight,
            set: (value) => {
              virtualHeight = Number(value) || 0;
            },
          });
          Object.defineProperty(element, "getContext", {
            configurable: true,
            value: () =>
              ({
                drawImage: () => undefined,
              }) as unknown as CanvasRenderingContext2D,
          });
        }
        return element;
      }) as typeof document.createElement;
      try {
        return callback();
      } finally {
        document.createElement = originalCreateElement;
      }
    };

    const countCase = createRenderer();
    const smallImage = countCase.renderer.getCanvas();
    smallImage.setSize(10, 10);
    smallImage.setFillStyle("#ff0000");
    smallImage.fillRect(0, 0, 10, 10);
    drawRepeatedly(countCase.renderer, smallImage, 1200);
    countCase.renderer.flush();
    const countCappedFrameVisibleCanvases = countVisibleLayerCanvases(
      countCase.layer,
    );
    const countCappedFrameConnectedCanvases = countLayerCanvases(
      countCase.layer,
    );

    countCase.renderer.clearRect(0, 0, 200, 100);
    countCase.renderer.drawImage(smallImage, 0, 0);
    countCase.renderer.drawImage(smallImage, 20, 0);
    countCase.renderer.flush();
    const recoveredFrameVisibleCanvases = countVisibleLayerCanvases(
      countCase.layer,
    );
    const recoveredFrameConnectedCanvases = countLayerCanvases(countCase.layer);

    smallImage.destroy();
    countCase.renderer.destroy();
    countCase.root.remove();

    const byteCase = createRenderer();
    const largeImage = byteCase.renderer.getCanvas();
    largeImage.setSize(2048, 2048);
    withVirtualCreatedCanvases(() => {
      drawRepeatedly(byteCase.renderer, largeImage, 40);
    });
    byteCase.renderer.flush();
    const byteCappedFrameConnectedCanvases = countLayerCanvases(byteCase.layer);
    const byteCappedFrameVisibleCanvases = countVisibleLayerCanvases(
      byteCase.layer,
    );

    largeImage.destroy();
    byteCase.renderer.destroy();
    byteCase.root.remove();

    const externalCase = createRenderer();
    const externalElement = document.createElement("canvas");
    const externalImage =
      new global.NiconiComments.internal.renderer.CanvasRenderer(
        externalElement,
      );
    externalImage.setSize(2048, 2048);
    withVirtualCreatedCanvases(() => {
      drawRepeatedly(externalCase.renderer, externalImage, 40);
    });
    externalCase.renderer.flush();
    const externalByteCappedFrameConnectedCanvases = countLayerCanvases(
      externalCase.layer,
    );
    const externalByteCappedFrameVisibleCanvases = countVisibleLayerCanvases(
      externalCase.layer,
    );

    externalImage.destroy();
    externalCase.renderer.destroy();
    externalCase.root.remove();
    return {
      countCappedFrameVisibleCanvases,
      countCappedFrameConnectedCanvases,
      recoveredFrameVisibleCanvases,
      recoveredFrameConnectedCanvases,
      byteCappedFrameVisibleCanvases,
      byteCappedFrameConnectedCanvases,
      externalByteCappedFrameVisibleCanvases,
      externalByteCappedFrameConnectedCanvases,
    };
  });

  // Source canvas + at most 1024 duplicate clones. The remaining over-cap
  // duplicate draws are skipped without throwing.
  expect(result.countCappedFrameVisibleCanvases).toBe(1025);
  expect(result.countCappedFrameConnectedCanvases).toBe(1025);
  // 2048 x 2048 x 4 bytes = 16 MiB per clone, so the 512 MiB byte budget allows
  // the source canvas plus 32 duplicate clones.
  expect(result.byteCappedFrameVisibleCanvases).toBe(33);
  expect(result.byteCappedFrameConnectedCanvases).toBe(33);
  // External canvases are copied instead of reparented. The first copy of a
  // source is allowed, then repeated copies of that source consume the same
  // 512 MiB budget, allowing 32 more copied canvases.
  expect(result.externalByteCappedFrameVisibleCanvases).toBe(33);
  expect(result.externalByteCappedFrameConnectedCanvases).toBe(33);
  expect(result.recoveredFrameVisibleCanvases).toBe(2);
  expect(result.recoveredFrameConnectedCanvases).toBe(2);
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

test("HTML5CSSRenderer preserves display scale across multiple frames", async ({
  page,
}) => {
  await loadBundle(page);

  const widths = await page.evaluate(() => {
    const root = document.createElement("div");
    root.dataset.width = "200";
    root.dataset.height = "100";
    document.body.appendChild(root);
    const global = window as typeof window & {
      NiconiComments: typeof import("@/main").default;
    };
    const renderer =
      new global.NiconiComments.internal.renderer.HTML5CSSRenderer(root);
    // Mirrors main.ts constructor: set display scale once before any frame.
    renderer.setScale(0.5, 0.5);

    const getFirstNodeWidth = () => {
      const layer = root.querySelector<HTMLElement>("div");
      const node = layer?.firstElementChild;
      return node ? getComputedStyle(node).width : undefined;
    };

    // Frame 1
    renderer.clearRect(0, 0, 200, 100);
    renderer.fillRect(0, 0, 100, 50);
    renderer.flush();
    const frame1Width = getFirstNodeWidth();

    // Frame 2 — scale must still be 0.5, not 1
    renderer.clearRect(0, 0, 200, 100);
    renderer.fillRect(0, 0, 100, 50);
    renderer.flush();
    const frame2Width = getFirstNodeWidth();

    renderer.destroy();
    root.remove();
    return { frame1Width, frame2Width };
  });

  // 100 logical units × scale 0.5 = 50 px in both frames
  expect(widths.frame1Width).toBe("50px");
  expect(widths.frame2Width).toBe("50px");
});

test("HTML5CSSRenderer hides source canvases after clearRect and flush", async ({
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
    const visibleBefore =
      root.contains(source) && getComputedStyle(source).display !== "none";

    // clearRect + flush mirrors NiconiComments.clear() — source canvases must disappear.
    renderer.clearRect(0, 0, 100, 100);
    renderer.flush();
    const visibleAfter =
      root.contains(source) && getComputedStyle(source).display !== "none";

    image.destroy();
    renderer.destroy();
    root.remove();
    return { visibleBefore, visibleAfter };
  });

  expect(result.visibleBefore).toBe(true);
  expect(result.visibleAfter).toBe(false);
});
