import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const baseUrl = process.env.TEST_BASE_URL ?? "";

const loadBundle = async (page: Page) => {
  await page.goto(`${baseUrl}/docs/sample/test.html`);
  await page.waitForFunction(() => "NiconiComments" in window);
  await page.waitForSelector("div#__bs_notify__", { state: "detached" });
};

test("WebGL2Renderer invalidates non-CanvasRenderer image sources", async ({
  page,
}) => {
  await loadBundle(page);

  const result = await page.evaluate(() => {
    const global = window as typeof window & {
      NiconiComments: typeof import("@/main").default;
    };

    const output = document.createElement("canvas");
    output.width = 2;
    output.height = 2;
    document.body.appendChild(output);

    let renderer: InstanceType<
      typeof global.NiconiComments.internal.renderer.WebGL2Renderer
    >;
    try {
      renderer = new global.NiconiComments.internal.renderer.WebGL2Renderer(
        output,
      );
    } catch {
      output.remove();
      return { supported: false };
    }

    const source = document.createElement("canvas");
    source.width = 2;
    source.height = 2;
    const sourceCtx = source.getContext("2d");
    const readback = document.createElement("canvas");
    readback.width = 2;
    readback.height = 2;
    const readCtx = readback.getContext("2d");
    if (!sourceCtx || !readCtx) {
      renderer.destroy();
      output.remove();
      return { supported: true, pixel: undefined };
    }

    const customRenderer = {
      rendererName: "CustomRenderer",
      canvas: source,
      destroy() {},
      drawVideo() {},
      getFont: () => "10px sans-serif",
      getFillStyle: () => "#000000",
      setScale() {},
      fillRect() {},
      strokeRect() {},
      fillText() {},
      strokeText() {},
      quadraticCurveTo() {},
      clearRect() {},
      setFont() {},
      setFillStyle() {},
      setStrokeStyle() {},
      setLineWidth() {},
      setGlobalAlpha() {},
      setSize(width: number, height: number) {
        source.width = width;
        source.height = height;
      },
      getSize: () => ({ width: source.width, height: source.height }),
      measureText: () => ({ width: 0 }) as TextMetrics,
      beginPath() {},
      closePath() {},
      moveTo() {},
      lineTo() {},
      stroke() {},
      save() {},
      restore() {},
      getCanvas: () => customRenderer,
      drawImage() {},
      flush() {},
      invalidateImage() {},
    };

    sourceCtx.fillStyle = "#ff0000";
    sourceCtx.fillRect(0, 0, 2, 2);
    renderer.drawImage(customRenderer, 0, 0);
    renderer.flush();

    sourceCtx.fillStyle = "#00ff00";
    sourceCtx.fillRect(0, 0, 2, 2);
    renderer.invalidateImage(customRenderer);
    renderer.clearRect(0, 0, 2, 2);
    renderer.drawImage(customRenderer, 0, 0);
    renderer.flush();

    readCtx.drawImage(output, 0, 0);
    const pixel = Array.from(readCtx.getImageData(0, 0, 1, 1).data);
    renderer.destroy();
    output.remove();
    return { supported: true, pixel };
  });

  if (!result.supported) {
    test.skip(true, "WebGL2 not available in this environment");
    return;
  }

  expect(result.pixel).toBeDefined();
  expect(result.pixel?.[0]).toBeLessThan(50);
  expect(result.pixel?.[1]).toBeGreaterThan(200);
  expect(result.pixel?.[2]).toBeLessThan(50);
  expect(result.pixel?.[3]).toBe(255);
});
