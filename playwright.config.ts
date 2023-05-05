import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "./src/__tests__",
  use: {
    baseURL: "http://127.0.0.1:3000",
  },
  projects: [
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
  webServer: {
    command: "npm run test-server",
    url: "http://127.0.0.1:3000/docs/sample/index.html",
    reuseExistingServer: !process.env.CI,
  },
};

export default config;
