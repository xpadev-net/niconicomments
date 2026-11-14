import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

/**
 * macOS runner 上の WebKit 用設定。
 * システムフォント(Hiragino 等)でのみ再現する計測差を、寸法で検証する。
 */
const config: PlaywrightTestConfig = {
  testDir: "./src/__tests__",
  testMatch: "**/webkit-*.spec.ts",
  projects: [
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
};

export default config;
