/**
 * @file OpenSCAD Transformations Visual Regression Tests
 * 
 * Comprehensive visual regression tests for all OpenSCAD transformation operations
 * Tests translate, rotate, scale, and mirror with various parameter combinations
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { VisualTestCanvas } from './visual-test-canvas';

test.describe('OpenSCAD Transformations Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[VISUAL-TEST')) {
        console.log(`Browser: ${msg.text()}`);
      }
    });
  });

  test.describe('Translate Transformation Tests', () => {
    test('should render translated cube on X axis', async ({ mount, page }) => {
      console.log('[INIT] Testing translate on X axis');
      
      const component = await mount(
        <VisualTestCanvas
          testName="translate-x"
          openscadCode="translate([10, 0, 0]) cube([5, 5, 5]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('translate-x.png');

      console.log('[END] Translate X test completed');
    });

    test('should render translated cube on Y axis', async ({ mount, page }) => {
      console.log('[INIT] Testing translate on Y axis');

      const component = await mount(
        <VisualTestCanvas
          testName="translate-y"
          openscadCode="translate([0, 10, 0]) cube([5, 5, 5]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('translate-y.png');

      console.log('[END] Translate Y test completed');
    });

    test('should render translated cube on Z axis', async ({ mount, page }) => {
      console.log('[INIT] Testing translate on Z axis');

      const component = await mount(
        <VisualTestCanvas
          testName="translate-z"
          openscadCode="translate([0, 0, 10]) cube([5, 5, 5]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('translate-z.png');

      console.log('[END] Translate Z test completed');
    });

    test('should render translated cube on all axes', async ({ mount, page }) => {
      console.log('[INIT] Testing translate on all axes');

      const component = await mount(
        <VisualTestCanvas
          testName="translate-xyz"
          openscadCode="translate([8, 6, 4]) cube([5, 5, 5]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('translate-xyz.png');
      
      console.log('[END] Translate XYZ test completed');
    });
  });

  test.describe('Rotate Transformation Tests', () => {
    test('should render rotated cube around Z axis', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate around Z axis');
      
      const component = await mount(
        <VisualTestCanvas
          testName="rotate-z"
          openscadCode="rotate([0, 0, 45]) cube([10, 5, 3]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('rotate-z.png');

      console.log('[END] Rotate Z test completed');
    });

    test('should render rotated cube around X axis', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate around X axis');

      const component = await mount(
        <VisualTestCanvas
          testName="rotate-x"
          openscadCode="rotate([45, 0, 0]) cube([5, 10, 3]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('rotate-x.png');

      console.log('[END] Rotate X test completed');
    });

    test('should render rotated cube around Y axis', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate around Y axis');

      const component = await mount(
        <VisualTestCanvas
          testName="rotate-y"
          openscadCode="rotate([0, 45, 0]) cube([10, 5, 3]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('rotate-y.png');

      console.log('[END] Rotate Y test completed');
    });

    test('should render rotated cube around all axes', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate around all axes');

      const component = await mount(
        <VisualTestCanvas
          testName="rotate-xyz"
          openscadCode="rotate([30, 45, 60]) cube([8, 6, 4]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('rotate-xyz.png');

      console.log('[END] Rotate XYZ test completed');
    });

    test('should render rotated cube with single angle', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate with single angle');

      const component = await mount(
        <VisualTestCanvas
          testName="rotate-single"
          openscadCode="rotate(30) cube([8, 4, 2]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('rotate-single.png');
      
      console.log('[END] Rotate single angle test completed');
    });
  });

  test.describe('Scale Transformation Tests', () => {
    test('should render scaled cube uniformly', async ({ mount, page }) => {
      console.log('[INIT] Testing uniform scale');
      
      const component = await mount(
        <VisualTestCanvas
          testName="scale-uniform"
          openscadCode="scale([2, 2, 2]) cube([5, 5, 5]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('scale-uniform.png');

      console.log('[END] Uniform scale test completed');
    });

    test('should render scaled cube non-uniformly', async ({ mount, page }) => {
      console.log('[INIT] Testing non-uniform scale');

      const component = await mount(
        <VisualTestCanvas
          testName="scale-non-uniform"
          openscadCode="scale([3, 1.5, 0.5]) cube([5, 5, 5]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('scale-non-uniform.png');

      console.log('[END] Non-uniform scale test completed');
    });

    test('should render scaled cube with single factor', async ({ mount, page }) => {
      console.log('[INIT] Testing scale with single factor');

      const component = await mount(
        <VisualTestCanvas
          testName="scale-single"
          openscadCode="scale(1.8) cube([5, 5, 5]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('scale-single.png');
      
      console.log('[END] Single factor scale test completed');
    });
  });

  test.describe('Mirror Transformation Tests', () => {
    test('should render mirrored cube across X axis', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror across X axis');

      // Capture console logs for debugging
      const consoleLogs: string[] = [];
      page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push(text);
        console.log(`[BROWSER-CONSOLE] ${text}`);
      });

      const component = await mount(
        <VisualTestCanvas
          testName="mirror-x"
          openscadCode="mirror([1, 0, 0]) cube([6, 4, 3]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);

      // Log captured console messages
      console.log('[DEBUG] Captured console logs:', consoleLogs.length);
      consoleLogs.forEach((log, index) => {
        if (log.includes('ParserResourceManager') || log.includes('AST') || log.includes('mirror')) {
          console.log(`[DEBUG] Console ${index}: ${log}`);
        }
      });

      await expect(component).toHaveScreenshot('mirror-x.png');

      console.log('[END] Mirror X test completed');
    });

    test('should render mirrored cube across Y axis', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror across Y axis');

      const component = await mount(
        <VisualTestCanvas
          testName="mirror-y"
          openscadCode="mirror([0, 1, 0]) cube([8, 6, 4]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('mirror-y.png');

      console.log('[END] Mirror Y test completed');
    });

    test('should render mirrored cube across Z axis', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror across Z axis');

      const component = await mount(
        <VisualTestCanvas
          testName="mirror-z"
          openscadCode="mirror([0, 0, 1]) cube([8, 4, 6]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('mirror-z.png');

      console.log('[END] Mirror Z test completed');
    });

    test('should render mirrored cube across diagonal plane', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror across diagonal plane');

      const component = await mount(
        <VisualTestCanvas
          testName="mirror-diagonal"
          openscadCode="mirror([1, 1, 0]) cube([6, 6, 4]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('mirror-diagonal.png');
      
      console.log('[END] Mirror diagonal test completed');
    });
  });

  test.describe('Combined Transformation Tests', () => {
    test('should render cube with translate and rotate combination', async ({ mount, page }) => {
      console.log('[INIT] Testing translate + rotate combination');

      const component = await mount(
        <VisualTestCanvas
          testName="combined-translate-rotate"
          openscadCode="translate([5, 3, 2]) rotate([0, 0, 45]) cube([6, 4, 3]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('combined-translate-rotate.png');

      console.log('[END] Translate + rotate combination test completed');
    });

    test('should render cube with scale and rotate combination', async ({ mount, page }) => {
      console.log('[INIT] Testing scale + rotate combination');

      const component = await mount(
        <VisualTestCanvas
          testName="combined-scale-rotate"
          openscadCode="scale([2, 1, 1.5]) rotate([30, 0, 0]) cube([4, 4, 4]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('combined-scale-rotate.png');

      console.log('[END] Scale + rotate combination test completed');
    });

    test('should render cube with all transformations combined', async ({ mount, page }) => {
      console.log('[INIT] Testing all transformations combined');

      const component = await mount(
        <VisualTestCanvas
          testName="combined-all-transforms"
          openscadCode="translate([3, 2, 1]) rotate([15, 30, 45]) scale([1.5, 1.2, 0.8]) cube([5, 5, 5]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('combined-all-transforms.png');

      console.log('[END] All transformations combined test completed');
    });

    test('should render nested transformations', async ({ mount, page }) => {
      console.log('[INIT] Testing nested transformations');

      const component = await mount(
        <VisualTestCanvas
          testName="nested-transforms"
          openscadCode="translate([8, 0, 0]) { rotate([0, 0, 30]) { scale([1.5, 1.5, 1.5]) cube([3, 3, 3]); } }"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('nested-transforms.png');

      console.log('[END] Nested transformations test completed');
    });
  });

  test.describe('Transformation Edge Cases', () => {
    test('should render transformation with zero values', async ({ mount, page }) => {
      console.log('[INIT] Testing transformation with zero values');

      const component = await mount(
        <VisualTestCanvas
          testName="transform-zero-values"
          openscadCode="translate([0, 0, 0]) rotate([0, 0, 0]) scale([1, 1, 1]) cube([6, 6, 6]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('transform-zero-values.png');

      console.log('[END] Zero values transformation test completed');
    });

    test('should render transformation with negative values', async ({ mount, page }) => {
      console.log('[INIT] Testing transformation with negative values');

      const component = await mount(
        <VisualTestCanvas
          testName="transform-negative-values"
          openscadCode="translate([-5, -3, -2]) rotate([-30, -45, -60]) scale([0.5, 2, 1.5]) cube([8, 4, 6]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('transform-negative-values.png');

      console.log('[END] Negative values transformation test completed');
    });

    test('should render transformation with large values', async ({ mount, page }) => {
      console.log('[INIT] Testing transformation with large values');

      const component = await mount(
        <VisualTestCanvas
          testName="transform-large-values"
          openscadCode="translate([15, 12, 10]) rotate([90, 180, 270]) scale([3, 3, 3]) cube([2, 2, 2]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('transform-large-values.png');

      console.log('[END] Large values transformation test completed');
    });
  });
});
