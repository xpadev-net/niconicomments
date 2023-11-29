import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "./src/__tests__",
  use: {
    baseURL: "http://127.0.0.1:8080",
  },
  projects: [
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
  webServer: {
    command: "npm run test-server",
    url: "http://127.0.0.1:8080/docs/sample/index.html",
    reuseExistingServer: !process.env.CI,
  },
};

export default config;
