import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:8080";
const serverPort = new URL(baseURL).port || "8080";

const config: PlaywrightTestConfig = {
  testDir: "./src/__tests__",
  use: {
    baseURL,
  },
  projects: [
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
  webServer: {
    command: `npm run test-server -- -p ${serverPort}`,
    url: `${baseURL}/docs/sample/index.html`,
    reuseExistingServer: !process.env.CI,
  },
};

export default config;
