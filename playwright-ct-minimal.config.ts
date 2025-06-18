import { defineConfig, devices } from '@playwright/experimental-ct-react';

export default defineConfig({
  testDir: './',
  timeout: 10 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'line',
  testMatch: /.*\.vspec\.tsx/,
  use: {
    trace: 'on-first-retry',
    ctPort: 3100,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        // Desktop-specific viewport for Babylon.js testing
        viewport: { width: 1280, height: 720 },
      },
    }
  ],
});
