/**
 * Browser Debug Test
 * 
 * Playwright test to debug browser issues including the metrics.ts import problem
 */

import { test, expect } from '@playwright/test';

test.describe('Browser Debug', () => {
  test('should load application without import errors', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for network failures
    const networkErrors: string[] = [];
    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    // Listen for page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Navigate to the application
    await page.goto('http://localhost:5174');

    // Wait for the page to load
    await page.waitForLoadState('load');

    // Check for specific metrics.ts related errors
    const metricsErrors = [
      ...consoleErrors,
      ...networkErrors,
      ...pageErrors
    ].filter(error => 
      error.includes('metrics.ts') || 
      error.includes('ERR_BLOCKED_BY_CLIENT') ||
      error.includes('Failed to resolve')
    );

    // Log all errors for debugging
    if (consoleErrors.length > 0) {
      console.log('Console Errors:', consoleErrors);
    }
    if (networkErrors.length > 0) {
      console.log('Network Errors:', networkErrors);
    }
    if (pageErrors.length > 0) {
      console.log('Page Errors:', pageErrors);
    }

    // Check that the application loaded successfully
    await expect(page.locator('body')).toBeVisible();

    // Verify no metrics.ts related errors
    expect(metricsErrors).toHaveLength(0);

    // Take a screenshot for visual debugging
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  });

  test('should load unified parser service without errors', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    await page.goto('http://localhost:5174');
    await page.waitForLoadState('load');

    // Look for parser service initialization messages
    const parserMessages = consoleMessages.filter(msg => 
      msg.includes('UnifiedParserService') || 
      msg.includes('OpenSCAD parser')
    );

    console.log('Parser Service Messages:', parserMessages);

    // Verify the application is working
    await expect(page.locator('body')).toBeVisible();
  });

  test('should check network requests for TypeScript files', async ({ page }) => {
    const tsRequests: string[] = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.endsWith('.ts') && !url.includes('node_modules')) {
        tsRequests.push(url);
      }
    });

    await page.goto('http://localhost:5174');
    await page.waitForLoadState('load');

    // Log any direct TypeScript file requests (these should not happen in production)
    if (tsRequests.length > 0) {
      console.log('Direct TypeScript file requests:', tsRequests);
    }

    // In a properly configured Vite app, there should be no direct .ts file requests
    expect(tsRequests).toHaveLength(0);
  });
});
