import { defineConfig, devices } from '@playwright/experimental-ct-react';
import process from 'node:process';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './src',
  /* The base directory, relative to the config file, for snapshot files created with toMatchSnapshot and toHaveScreenshot. */
  snapshotDir: "./test-results/screenshots",
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'line',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  testMatch: '**/*.vspec.tsx', // Match test files
  updateSnapshots: "missing",

  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Port to use for Playwright component endpoint. */
    ctPort: 3100,
    viewport: { width: 800, height: 800 },
    screenshot: 'on',

    /* Configure Vite for component testing */
    ctViteConfig: {
      plugins: [],
      define: {
        'process.env.NODE_ENV': '"test"',
        global: 'globalThis'
      },
      esbuild: {
        target: 'esnext',
        jsx: 'automatic'
      },
      resolve: {
        alias: {
          '@': '/src'
        }
      },
      optimizeDeps: {
        include: ['react', 'react-dom'],
        force: true
      }
    }
     
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], headless: true,
        screenshot: 'on',
        video: 'on',
        launchOptions: {
          // args: ["--headless","--no-sandbox","--use-angle=gl"]
          args: [
            '--enable-webgl',
            '--enable-accelerated-2d-canvas',
            '--enable-gpu-rasterization',
            '--enable-zero-copy',
            '--disable-web-security', // For local development
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox', // For CI environments
            '--disable-dev-shm-usage' // For CI environments
          ]
        } },
    }
  ],
});
