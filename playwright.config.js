var defineConfig = require("@playwright/test").defineConfig;
var slowMo = Number(process.env.SLOWMO_MS || 0);

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    channel: "chrome",
    launchOptions: {
      slowMo: slowMo
    },
    viewport: { width: 1280, height: 800 },
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "python3 -m http.server 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    stdout: "ignore",
    stderr: "pipe"
  }
});
