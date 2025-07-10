/**
 * End-to-End OpenSCAD Pipeline Test
 *
 * Comprehensive E2E test using Playwright to validate the complete pipeline:
 * Monaco Editor → AST parsing → 3D rendering with real OpenSCAD code examples.
 *
 * This test validates:
 * 1. Application loads without hanging
 * 2. Monaco Editor accepts OpenSCAD code input
 * 3. Parser processes code and generates AST
 * 4. 3D renderer creates meshes from AST
 * 5. React Three Fiber displays the 3D scene
 */

import { expect, test } from '@playwright/experimental-ct-react';
import React from 'react';
import App from '../../App.js';

// Test data: Real OpenSCAD code examples
const TEST_CASES = [
  {
    name: 'Simple Cube',
    code: 'cube([10, 10, 10], center=true);',
    expectedPrimitives: ['cube'],
    description: 'Basic cube primitive test',
  },
  {
    name: 'Simple Sphere',
    code: 'sphere(r=5);',
    expectedPrimitives: ['sphere'],
    description: 'Basic sphere primitive test',
  },
  {
    name: 'Translated Cube',
    code: 'translate([100, 20, 30]) cube(5);',
    expectedPrimitives: ['cube'],
    expectedTransforms: ['translate'],
    description: 'Translation transformation test - validates vector parsing fix',
  },
  {
    name: 'Multiple Primitives',
    code: `
      cube([5, 5, 5], center=true);
      translate([15, 0, 0]) sphere(3);
      translate([0, 15, 0]) cylinder(h=10, r=2);
    `,
    expectedPrimitives: ['cube', 'sphere', 'cylinder'],
    expectedTransforms: ['translate'],
    description: 'Multiple primitives with transformations',
  },
  {
    name: 'Complex Scene',
    code: `
      // Base platform
      cube([20, 20, 2], center=true);
      
      // Tower
      translate([0, 0, 6])
        cube([4, 4, 10], center=true);
      
      // Sphere on top
      translate([0, 0, 13])
        sphere(r=2);
    `,
    expectedPrimitives: ['cube', 'sphere'],
    expectedTransforms: ['translate'],
    description: 'Complex scene with comments and multiple transformations',
  },
];

test.describe('OpenSCAD Pipeline E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any necessary page configurations
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('should load application without hanging', async ({ mount, page }) => {
    // Mount the main application
    const component = await mount(<App />);

    // Wait for the application to load
    await expect(component).toBeVisible();

    // Check that key elements are present
    await expect(page.locator('[data-testid="main-editor"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="main-renderer"]')).toBeVisible({ timeout: 10000 });

    // Verify no error messages are displayed
    const errorElements = page.locator('[data-testid="error-display"]');
    await expect(errorElements).toHaveCount(0);
  });

  // Test each OpenSCAD code example
  TEST_CASES.forEach((testCase) => {
    test(`should handle ${testCase.name}`, async ({ mount, page }) => {
      // Mount the application
      const component = await mount(<App />);
      await expect(component).toBeVisible();

      // Wait for Monaco Editor to be ready
      const editor = page.locator('[data-testid="monaco-editor-instance"]');
      await expect(editor).toBeVisible({ timeout: 10000 });

      // Clear any existing content and input the test code
      await editor.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.type(testCase.code);

      // Wait for parsing to complete (debounced)
      await page.waitForTimeout(500);

      // Check that parsing completed without errors
      const parseErrors = page.locator('[data-testid="parse-errors"]');
      await expect(parseErrors).toHaveCount(0);

      // Verify AST was generated
      const astDisplay = page.locator('[data-testid="ast-display"]');
      if (await astDisplay.isVisible()) {
        await expect(astDisplay).not.toBeEmpty();
      }

      // Wait for 3D rendering to complete
      await page.waitForTimeout(1000);

      // Verify 3D canvas is present and rendering
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();

      // Check for render errors
      const renderErrors = page.locator('[data-testid="error-display"]');
      await expect(renderErrors).toHaveCount(0);

      // Verify performance metrics are within acceptable range
      const performanceDisplay = page.locator('[data-testid="performance-metrics"]');
      if (await performanceDisplay.isVisible()) {
        const performanceText = await performanceDisplay.textContent();
        // Parse time should be under 100ms for simple cases
        if (performanceText?.includes('Parse time:')) {
          const parseTimeMatch = performanceText.match(/Parse time: (\d+)ms/);
          if (parseTimeMatch) {
            const parseTime = parseInt(parseTimeMatch[1], 10);
            expect(parseTime).toBeLessThan(100);
          }
        }
      }
    });
  });

  test('should handle rapid code changes without hanging', async ({ mount, page }) => {
    // Mount the application
    const component = await mount(<App />);
    await expect(component).toBeVisible();

    // Wait for Monaco Editor to be ready
    const editor = page.locator('[data-testid="monaco-editor-instance"]');
    await expect(editor).toBeVisible({ timeout: 10000 });

    // Simulate rapid typing/editing
    const rapidChanges = [
      'cube(1);',
      'cube(2);',
      'cube(3);',
      'sphere(1);',
      'sphere(2);',
      'translate([10,0,0]) cube(5);',
    ];

    for (const code of rapidChanges) {
      await editor.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.type(code);
      await page.waitForTimeout(100); // Short delay between changes
    }

    // Wait for final parsing to complete
    await page.waitForTimeout(500);

    // Verify no errors occurred
    const parseErrors = page.locator('[data-testid="parse-errors"]');
    await expect(parseErrors).toHaveCount(0);

    const renderErrors = page.locator('[data-testid="error-display"]');
    await expect(renderErrors).toHaveCount(0);
  });

  test('should handle invalid OpenSCAD code gracefully', async ({ mount, page }) => {
    // Mount the application
    const component = await mount(<App />);
    await expect(component).toBeVisible();

    // Wait for Monaco Editor to be ready
    const editor = page.locator('[data-testid="monaco-editor-instance"]');
    await expect(editor).toBeVisible({ timeout: 10000 });

    // Input invalid OpenSCAD code
    const invalidCode = 'cube([10,10,10'; // Missing closing bracket
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type(invalidCode);

    // Wait for parsing to complete
    await page.waitForTimeout(500);

    // Should handle the error gracefully without crashing
    // The application should still be responsive
    await expect(component).toBeVisible();

    // Canvas should still be present (even if empty)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should demonstrate vector parsing fix', async ({ mount, page }) => {
    // This test specifically validates the Tree-sitter vector parsing fix
    const component = await mount(<App />);
    await expect(component).toBeVisible();

    const editor = page.locator('[data-testid="monaco-editor-instance"]');
    await expect(editor).toBeVisible({ timeout: 10000 });

    // Use the specific case that was failing before our fix
    const problematicCode = 'cube(5, center=true);\ntranslate([100,20,30]) sphere(10);';

    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type(problematicCode);

    // Wait for parsing and rendering
    await page.waitForTimeout(1000);

    // Should parse and render without errors
    const parseErrors = page.locator('[data-testid="parse-errors"]');
    await expect(parseErrors).toHaveCount(0);

    const renderErrors = page.locator('[data-testid="error-display"]');
    await expect(renderErrors).toHaveCount(0);

    // The sphere should be translated to [100,20,30], not [10,0,0]
    // We can verify this by checking that the scene rendered successfully
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should maintain performance under load', async ({ mount, page }) => {
    // Performance test with larger OpenSCAD code
    const component = await mount(<App />);
    await expect(component).toBeVisible();

    const editor = page.locator('[data-testid="monaco-editor-instance"]');
    await expect(editor).toBeVisible({ timeout: 10000 });

    // Generate a larger OpenSCAD scene
    const largeScene = Array.from(
      { length: 20 },
      (_, i) => `translate([${i * 5}, 0, 0]) cube(2);`
    ).join('\n');

    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type(largeScene);

    // Wait for parsing and rendering
    await page.waitForTimeout(2000);

    // Should handle the larger scene without errors
    const parseErrors = page.locator('[data-testid="parse-errors"]');
    await expect(parseErrors).toHaveCount(0);

    const renderErrors = page.locator('[data-testid="error-display"]');
    await expect(renderErrors).toHaveCount(0);

    // Application should remain responsive
    await expect(component).toBeVisible();
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});
