import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4200',
    trace: 'retain-on-failure',
    // Optional override for environments with a preinstalled Chromium binary.
    launchOptions: process.env['SCOPEPILOT_CHROMIUM_PATH']
      ? { executablePath: process.env['SCOPEPILOT_CHROMIUM_PATH'] }
      : {},
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },
});
