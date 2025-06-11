/**
 * @file Playwright E2E Configuration
 * 
 * Configuration for end-to-end testing of the OpenSCAD to Babylon.js pipeline
 * using Playwright with TypeScript and React.
 * 
 * @author Luciano Júnior
 * @date January 2025
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* The base directory, relative to the config file, for snapshot files created with toMatchSnapshot and toHaveScreenshot. */
  snapshotDir: './e2e/test-results',
  /* Maximum time one test can run for. */
  timeout: 60 * 1000, // 60 seconds for complex CSG operations
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Viewport size */
    viewport: { width: 1280, height: 720 },

    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,

    /* Wait for network idle before considering navigation complete */
    waitForLoadState: 'networkidle',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable WebGL for Babylon.js 3D rendering
        launchOptions: {
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
        }
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'webgl.force-enabled': true,
            'webgl.disabled': false
          }
        }
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // Safari/WebKit specific settings for WebGL
        launchOptions: {
          args: ['--enable-webgl']
        }
      },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        launchOptions: {
          args: [
            '--enable-webgl',
            '--enable-accelerated-2d-canvas',
            '--no-sandbox'
          ]
        }
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        launchOptions: {
          args: ['--enable-webgl']
        }
      },
    },

    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: { 
        ...devices['Desktop Edge'], 
        channel: 'msedge',
        launchOptions: {
          args: [
            '--enable-webgl',
            '--enable-accelerated-2d-canvas',
            '--no-sandbox'
          ]
        }
      },
    },
    {
      name: 'Google Chrome',
      use: { 
        ...devices['Desktop Chrome'], 
        channel: 'chrome',
        launchOptions: {
          args: [
            '--enable-webgl',
            '--enable-accelerated-2d-canvas',
            '--no-sandbox'
          ]
        }
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start the dev server
    stdout: 'pipe',
    stderr: 'pipe',
  },

  /* Global setup and teardown */
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  /* Test output directories */
  outputDir: 'test-results/',
  
  /* Expect configuration */
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 10 * 1000, // 10 seconds for individual assertions
    
    /* Threshold for screenshot comparisons */
    threshold: 0.2,
    
    /* Animation handling */
    toHaveScreenshot: {
      mode: 'css',
      animations: 'disabled'
    },
    
    toMatchSnapshot: {
      mode: 'css',
      animations: 'disabled'
    }
  },
});
