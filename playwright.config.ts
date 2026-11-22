import { defineConfig, devices } from '@playwright/test';
import { readEnv } from '@starter/runtime';

const env = readEnv();

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(env['CI']),
  retries: env['CI'] ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: env['E2E_WEB_URL'] ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
