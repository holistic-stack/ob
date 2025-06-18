/**
 * @file OpenSCAD Transformation Comparison Visual Regression Tests
 * 
 * Enhanced visual regression tests with side-by-side comparison of original vs transformed objects
 * Provides better visual verification with reference objects, scale grids, and coordinate axes
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { TransformationComparisonCanvas } from './transformation-comparison-canvas';

test.describe('OpenSCAD Transformation Comparison Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TRANSFORM-TEST')) {
        console.log(`Browser: ${msg.text()}`);
      }
    });
  });

  test.describe('Translate Transformation Comparisons', () => {
    test('should show translate X axis comparison', async ({ mount, page }) => {
      console.log('[INIT] Testing translate X axis comparison');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="translate-x-comparison"
          baseOpenscadCode="cube([5, 5, 5])"
          transformedOpenscadCode="translate([10, 0, 0]) cube([5, 5, 5])"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('translate-x-comparison.png');

      console.log('[END] Translate X comparison test completed');
    });

    test('should show translate Y axis comparison', async ({ mount, page }) => {
      console.log('[INIT] Testing translate Y axis comparison');

      const component = await mount(
        <TransformationComparisonCanvas
          testName="translate-y-comparison"
          baseOpenscadCode="cube([5, 5, 5])"
          transformedOpenscadCode="translate([0, 10, 0]) cube([5, 5, 5])"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('translate-y-comparison.png');

      console.log('[END] Translate Y comparison test completed');
    });

    test('should show translate Z axis comparison', async ({ mount, page }) => {
      console.log('[INIT] Testing translate Z axis comparison');

      const component = await mount(
        <TransformationComparisonCanvas
          testName="translate-z-comparison"
          baseOpenscadCode="cube([5, 5, 5])"
          transformedOpenscadCode="translate([0, 0, 10]) cube([5, 5, 5])"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('translate-z-comparison.png');

      console.log('[END] Translate Z comparison test completed');
    });

    test('should show translate all axes comparison', async ({ mount, page }) => {
      console.log('[INIT] Testing translate all axes comparison');

      const component = await mount(
        <TransformationComparisonCanvas
          testName="translate-xyz-comparison"
          baseOpenscadCode="cube([5, 5, 5])"
          transformedOpenscadCode="translate([8, 6, 4]) cube([5, 5, 5])"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={35}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('translate-xyz-comparison.png');
      
      console.log('[END] Translate XYZ comparison test completed');
    });
  });

  test.describe('Rotate Transformation Comparisons', () => {
    test('should show rotate Z axis comparison', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate Z axis comparison');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="rotate-z-comparison"
          baseOpenscadCode="cube([10, 5, 3])"
          transformedOpenscadCode="rotate([0, 0, 45]) cube([10, 5, 3])"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('rotate-z-comparison.png');

      console.log('[END] Rotate Z comparison test completed');
    });

    test('should show rotate X axis comparison', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate X axis comparison');

      const component = await mount(
        <TransformationComparisonCanvas
          testName="rotate-x-comparison"
          baseOpenscadCode="cube([5, 10, 3])"
          transformedOpenscadCode="rotate([45, 0, 0]) cube([5, 10, 3])"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('rotate-x-comparison.png');

      console.log('[END] Rotate X comparison test completed');
    });

    test('should show rotate Y axis comparison', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate Y axis comparison');

      const component = await mount(
        <TransformationComparisonCanvas
          testName="rotate-y-comparison"
          baseOpenscadCode="cube([10, 5, 3])"
          transformedOpenscadCode="rotate([0, 45, 0]) cube([10, 5, 3])"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('rotate-y-comparison.png');

      console.log('[END] Rotate Y comparison test completed');
    });

    test('should show rotate all axes comparison', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate all axes comparison');

      const component = await mount(
        <TransformationComparisonCanvas
          testName="rotate-xyz-comparison"
          baseOpenscadCode="cube([8, 6, 4])"
          transformedOpenscadCode="rotate([30, 45, 60]) cube([8, 6, 4])"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={35}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('rotate-xyz-comparison.png');

      console.log('[END] Rotate XYZ comparison test completed');
    });
  });

  test.describe('Scale Transformation Comparisons', () => {
    test('should show uniform scale comparison', async ({ mount, page }) => {
      console.log('[INIT] Testing uniform scale comparison');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="scale-uniform-comparison"
          baseOpenscadCode="cube([5, 5, 5])"
          transformedOpenscadCode="scale([2, 2, 2]) cube([5, 5, 5])"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={35}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('scale-uniform-comparison.png');

      console.log('[END] Uniform scale comparison test completed');
    });

    test('should show non-uniform scale comparison', async ({ mount, page }) => {
      console.log('[INIT] Testing non-uniform scale comparison');

      const component = await mount(
        <TransformationComparisonCanvas
          testName="scale-non-uniform-comparison"
          baseOpenscadCode="cube([5, 5, 5])"
          transformedOpenscadCode="scale([3, 1.5, 0.5]) cube([5, 5, 5])"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={40}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('scale-non-uniform-comparison.png');

      console.log('[END] Non-uniform scale comparison test completed');
    });

    test('should show single factor scale comparison', async ({ mount, page }) => {
      console.log('[INIT] Testing single factor scale comparison');

      const component = await mount(
        <TransformationComparisonCanvas
          testName="scale-single-comparison"
          baseOpenscadCode="cube([5, 5, 5])"
          transformedOpenscadCode="scale(1.8) cube([5, 5, 5])"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('scale-single-comparison.png');
      
      console.log('[END] Single factor scale comparison test completed');
    });
  });

  test.describe('Mirror Transformation Comparisons', () => {
    test('should show mirror X axis comparison', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror X axis comparison');

      const component = await mount(
        <TransformationComparisonCanvas
          testName="mirror-x-comparison"
          baseOpenscadCode="cube([6, 4, 3])"
          transformedOpenscadCode="mirror([1, 0, 0]) cube([6, 4, 3])"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('mirror-x-comparison.png');

      console.log('[END] Mirror X comparison test completed');
    });

    test('should show mirror Y axis comparison', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror Y axis comparison');

      const component = await mount(
        <TransformationComparisonCanvas
          testName="mirror-y-comparison"
          baseOpenscadCode="cube([8, 6, 4])"
          transformedOpenscadCode="mirror([0, 1, 0]) cube([8, 6, 4])"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('mirror-y-comparison.png');

      console.log('[END] Mirror Y comparison test completed');
    });

    test('should show mirror Z axis comparison', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror Z axis comparison');

      const component = await mount(
        <TransformationComparisonCanvas
          testName="mirror-z-comparison"
          baseOpenscadCode="cube([8, 4, 6])"
          transformedOpenscadCode="mirror([0, 0, 1]) cube([8, 4, 6])"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('mirror-z-comparison.png');

      console.log('[END] Mirror Z comparison test completed');
    });

    test('should show mirror diagonal plane comparison', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror diagonal plane comparison');

      const component = await mount(
        <TransformationComparisonCanvas
          testName="mirror-diagonal-comparison"
          baseOpenscadCode="cube([6, 6, 4])"
          transformedOpenscadCode="mirror([1, 1, 0]) cube([6, 6, 4])"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={35}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('mirror-diagonal-comparison.png');
      
      console.log('[END] Mirror diagonal comparison test completed');
    });
  });

  test.describe('Complex Transformation Comparisons', () => {
    test('should show combined transformations comparison', async ({ mount, page }) => {
      console.log('[INIT] Testing combined transformations comparison');

      const component = await mount(
        <TransformationComparisonCanvas
          testName="combined-transforms-comparison"
          baseOpenscadCode="cube([5, 5, 5])"
          transformedOpenscadCode="translate([3, 2, 1]) rotate([15, 30, 45]) scale([1.5, 1.2, 0.8]) cube([5, 5, 5])"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={40}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('combined-transforms-comparison.png');

      console.log('[END] Combined transformations comparison test completed');
    });

    test('should show large values transformation comparison', async ({ mount, page }) => {
      console.log('[INIT] Testing large values transformation comparison');

      const component = await mount(
        <TransformationComparisonCanvas
          testName="large-values-comparison"
          baseOpenscadCode="cube([2, 2, 2])"
          transformedOpenscadCode="translate([15, 12, 10]) rotate([90, 180, 270]) scale([3, 3, 3]) cube([2, 2, 2])"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={50}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('large-values-comparison.png');

      console.log('[END] Large values transformation comparison test completed');
    });
  });
});
