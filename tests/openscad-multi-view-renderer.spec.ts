/**
 * @file OpenSCAD Multi-View Renderer E2E Tests
 * 
 * Visual regression tests using regular Playwright E2E testing instead of component testing.
 * Tests the OpenSCAD Multi-View Renderer by running it in the actual application.
 * 
 * This approach avoids the Babel transformation issues with @playwright/experimental-ct-react
 * while still providing comprehensive visual regression testing with screenshots.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { test, expect } from '@playwright/test';

test.describe('OpenSCAD Multi-View Renderer E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    console.log('[INIT] Setting up OpenSCAD Multi-View Renderer E2E test');
    
    // Navigate to the application
    await page.goto('http://localhost:5174/');
    
    // Wait for the application to load
    await expect(page.locator('h1')).toContainText('OpenSCAD to Babylon.js Pipeline');
  });

  test('should render OpenSCAD Multi-View Renderer with cube', async ({ page }) => {
    console.log('[DEBUG] Testing cube rendering in multi-view renderer');
    
    // Clear any existing code and enter cube code
    await page.locator('textarea[placeholder*="OpenSCAD"]').fill('cube([10, 10, 10]);');
    
    // Click process button
    await page.locator('button:has-text("Process OpenSCAD Code")').click();
    
    // Wait for processing to complete
    await expect(page.locator('text=Success')).toBeVisible({ timeout: 30000 });
    
    // Verify the 3D scene is rendered
    await expect(page.locator('canvas')).toBeVisible();
    
    // Take screenshot for visual regression testing
    await expect(page).toHaveScreenshot('openscad-cube-rendering.png');
    
    console.log('[END] Cube rendering test completed successfully');
  });

  test('should render sphere in multi-view renderer', async ({ page }) => {
    console.log('[DEBUG] Testing sphere rendering in multi-view renderer');
    
    // Enter sphere code
    await page.locator('textarea[placeholder*="OpenSCAD"]').fill('sphere(5);');
    
    // Process the code
    await page.locator('button:has-text("Process OpenSCAD Code")').click();
    
    // Wait for success
    await expect(page.locator('text=Success')).toBeVisible({ timeout: 30000 });
    
    // Take screenshot
    await expect(page).toHaveScreenshot('openscad-sphere-rendering.png');
    
    console.log('[END] Sphere rendering test completed successfully');
  });

  test('should render cylinder in multi-view renderer', async ({ page }) => {
    console.log('[DEBUG] Testing cylinder rendering in multi-view renderer');
    
    // Enter cylinder code
    await page.locator('textarea[placeholder*="OpenSCAD"]').fill('cylinder(h=10, r=3);');
    
    // Process the code
    await page.locator('button:has-text("Process OpenSCAD Code")').click();
    
    // Wait for success
    await expect(page.locator('text=Success')).toBeVisible({ timeout: 30000 });
    
    // Take screenshot
    await expect(page).toHaveScreenshot('openscad-cylinder-rendering.png');
    
    console.log('[END] Cylinder rendering test completed successfully');
  });

  test('should render union operation in multi-view renderer', async ({ page }) => {
    console.log('[DEBUG] Testing union operation rendering in multi-view renderer');
    
    // Enter union code
    await page.locator('textarea[placeholder*="OpenSCAD"]').fill(`
      union() {
        cube([5, 5, 5]);
        translate([3, 3, 3]) sphere(2);
      }
    `);
    
    // Process the code
    await page.locator('button:has-text("Process OpenSCAD Code")').click();
    
    // Wait for success
    await expect(page.locator('text=Success')).toBeVisible({ timeout: 30000 });
    
    // Take screenshot
    await expect(page).toHaveScreenshot('openscad-union-rendering.png');
    
    console.log('[END] Union operation test completed successfully');
  });

  test('should handle error states gracefully', async ({ page }) => {
    console.log('[DEBUG] Testing error handling in multi-view renderer');
    
    // Enter invalid code
    await page.locator('textarea[placeholder*="OpenSCAD"]').fill('invalid_function();');
    
    // Process the code
    await page.locator('button:has-text("Process OpenSCAD Code")').click();
    
    // Wait for error state
    await expect(page.locator('text=Error')).toBeVisible({ timeout: 30000 });
    
    // Take screenshot of error state
    await expect(page).toHaveScreenshot('openscad-error-state.png');
    
    console.log('[END] Error handling test completed successfully');
  });

  test('should test camera controls and debug information', async ({ page }) => {
    console.log('[DEBUG] Testing camera controls and debug information');
    
    // Enter cube code
    await page.locator('textarea[placeholder*="OpenSCAD"]').fill('cube([8, 8, 8]);');
    
    // Process the code
    await page.locator('button:has-text("Process OpenSCAD Code")').click();
    
    // Wait for success
    await expect(page.locator('text=Success')).toBeVisible({ timeout: 30000 });
    
    // Test debug controls if available
    const debugButton = page.locator('button:has-text("Debug Scene")');
    if (await debugButton.isVisible()) {
      await debugButton.click();
      console.log('[DEBUG] Debug scene button clicked');
    }
    
    // Test wireframe toggle if available
    const wireframeButton = page.locator('button:has-text("Toggle Wireframe")');
    if (await wireframeButton.isVisible()) {
      await wireframeButton.click();
      console.log('[DEBUG] Wireframe toggle clicked');
    }
    
    // Test camera reset if available
    const resetButton = page.locator('button:has-text("Reset Camera")');
    if (await resetButton.isVisible()) {
      await resetButton.click();
      console.log('[DEBUG] Camera reset clicked');
    }
    
    // Take screenshot with debug controls
    await expect(page).toHaveScreenshot('openscad-debug-controls.png');
    
    console.log('[END] Camera controls test completed successfully');
  });

  test('should test different canvas sizes', async ({ page }) => {
    console.log('[DEBUG] Testing different canvas sizes');
    
    // Set viewport to different size
    await page.setViewportSize({ width: 1600, height: 1200 });
    
    // Enter cube code
    await page.locator('textarea[placeholder*="OpenSCAD"]').fill('cube([6, 6, 6]);');
    
    // Process the code
    await page.locator('button:has-text("Process OpenSCAD Code")').click();
    
    // Wait for success
    await expect(page.locator('text=Success')).toBeVisible({ timeout: 30000 });
    
    // Take screenshot with larger viewport
    await expect(page).toHaveScreenshot('openscad-large-viewport.png');
    
    console.log('[END] Canvas size test completed successfully');
  });

  test('should test empty code handling', async ({ page }) => {
    console.log('[DEBUG] Testing empty code handling');
    
    // Clear the textarea
    await page.locator('textarea[placeholder*="OpenSCAD"]').fill('');
    
    // Process empty code
    await page.locator('button:has-text("Process OpenSCAD Code")').click();
    
    // Wait for some response (could be error or empty state)
    await page.waitForTimeout(5000);
    
    // Take screenshot of empty state
    await expect(page).toHaveScreenshot('openscad-empty-code.png');
    
    console.log('[END] Empty code test completed successfully');
  });

});
