import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './playwright-temp',
  timeout: 30_000,
  use: {
    headless: false,
    navigationTimeout: 30_000,
  },
});
