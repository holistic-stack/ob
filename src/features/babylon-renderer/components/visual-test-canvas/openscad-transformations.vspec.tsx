/**
 * @file Simplified OpenSCAD Transformations Visual Regression Tests
 *
 * Comprehensive visual regression tests for all OpenSCAD transformation operations
 * Tests translate, rotate, scale, and mirror with various parameter combinations
 *
 * SIMPLIFIED VISUAL FEATURES IMPLEMENTED:
 * - Black canvas background with white/colored mesh objects for maximum contrast
 * - Transparent reference object (ghost) showing original position for transformation comparison
 * - Clean, minimal design without cluttering visual elements (no grid, axes, or markers)
 * - Callback-based rendering completion using scene.executeWhenReady() for reliable timing
 * - Strategic camera positioning for optimal viewing of both transformed and reference objects
 *
 * VISUAL STYLE REQUIREMENTS MET:
 * - Black canvas background (#000000)
 * - White/colored main mesh objects that are clearly visible
 * - Transparent gray reference object (30% alpha) for comparison
 * - No grid lines, axes, or face markers cluttering the view
 * - Focus purely on transformation effect comparison
 *
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { OpenSCADToMeshWrapper } from './openscad-to-mesh-wrapper';

test.describe('OpenSCAD Transformations Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'log' && (msg.text().includes('[VISUAL-TEST') || msg.text().includes('[INIT]') || msg.text().includes('[DEBUG]') || msg.text().includes('[ERROR]'))) {
        console.log(`Browser: ${msg.text()}`);
      }
    });
  });

  /**
   * Helper function to wait for rendering completion using Babylon.js scene.executeWhenReady()
   *
   * This function replaces all timeout-based waiting with proper callback-based approach.
   * It waits for the OpenSCADToMeshWrapper component to signal rendering completion via data attributes.
   *
   * @param page - Playwright page object
   * @param testName - Test identifier for canvas element lookup
   * @returns Promise that resolves when rendering is complete
   */
  async function waitForRenderingComplete(page: any, testName: string): Promise<void> {
    console.log(`[DEBUG] Waiting for rendering completion for test: ${testName}`);

    // Wait for the canvas to have data-rendering-complete="true"
    await page.waitForFunction(
      (testName: string) => {
        const canvas = document.querySelector(`[data-testid="visual-test-canvas-${testName}"]`);
        return canvas && canvas.getAttribute('data-rendering-complete') === 'true';
      },
      testName,
      { timeout: 60000 } // 60 second timeout to allow for visual aids creation
    );

    console.log(`[DEBUG] Rendering completion detected for test: ${testName}`);
  }



  test.describe('Translate Transformation Tests', () => {
    test('should render translated cube on X axis with simplified visual aids and reference', async ({ mount, page }) => {
      console.log('[INIT] Testing translate on X axis with simplified visual aids and transparent reference');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="translate-x"
          openscadCode="translate([10, 0, 0]) cube([5, 5, 5]);"
          referenceOpenscadCode="cube([5, 5, 5]);"
          width={800}
          height={600}
          enableDebugLogging={true}
          enableReferenceObject={true}
        />
      );

      await waitForRenderingComplete(page, 'translate-x');
      await expect(component).toHaveScreenshot('translate-x.png');

      console.log('[END] Translate X test completed with simplified visual aids and reference');
    });

    test('should render translated cube on Y axis with simplified visual aids and reference', async ({ mount, page }) => {
      console.log('[INIT] Testing translate on Y axis with simplified visual aids and transparent reference');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="translate-y"
          openscadCode="translate([0, 10, 0]) cube([5, 5, 5]);"
          referenceOpenscadCode="cube([5, 5, 5]);"
          width={800}
          height={600}
          enableDebugLogging={true}
          enableReferenceObject={true}
        />
      );

      await waitForRenderingComplete(page, 'translate-y');
      await expect(component).toHaveScreenshot('translate-y.png');

      console.log('[END] Translate Y test completed with simplified visual aids and reference');
    });

    test('should render translated cube on Z axis with simplified visual aids and reference', async ({ mount, page }) => {
      console.log('[INIT] Testing translate on Z axis with simplified visual aids and transparent reference');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="translate-z"
          openscadCode="translate([0, 0, 10]) cube([5, 5, 5]);"
          referenceOpenscadCode="cube([5, 5, 5]);"
          width={800}
          height={600}
          enableDebugLogging={true}
          enableReferenceObject={true}
        />
      );

      await waitForRenderingComplete(page, 'translate-z');
      await expect(component).toHaveScreenshot('translate-z.png');

      console.log('[END] Translate Z test completed with simplified visual aids and reference');
    });

    test('should render translated cube on all axes with simplified visual aids and reference', async ({ mount, page }) => {
      console.log('[INIT] Testing translate on all axes with simplified visual aids and transparent reference');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="translate-xyz"
          openscadCode="translate([8, 6, 4]) cube([5, 5, 5]);"
          referenceOpenscadCode="cube([5, 5, 5]);"
          width={800}
          height={600}
          enableDebugLogging={true}
          enableReferenceObject={true}
        />
      );

      await waitForRenderingComplete(page, 'translate-xyz');
      await expect(component).toHaveScreenshot('translate-xyz.png');

      console.log('[END] Translate XYZ test completed with simplified visual aids and reference');
    });
  });

  test.describe('Rotate Transformation Tests', () => {
    test('should render rotated cube around Z axis with enhanced visual aids and reference', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate around Z axis with enhanced visual aids and transparent reference');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="rotate-z"
          openscadCode="rotate([0, 0, 45]) cube([10, 5, 3]);"
          referenceOpenscadCode="cube([10, 5, 3]);"
          width={800}
          height={600}
          enableDebugLogging={true}
          enableReferenceObject={true}
        />
      );

      await waitForRenderingComplete(page, 'rotate-z');
      await expect(component).toHaveScreenshot('rotate-z.png');

      console.log('[END] Rotate Z test completed with visual aids and reference');
    });

    test('should render rotated cube around X axis with enhanced visual aids and reference', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate around X axis with enhanced visual aids and transparent reference');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="rotate-x"
          openscadCode="rotate([45, 0, 0]) cube([5, 10, 3]);"
          referenceOpenscadCode="cube([5, 10, 3]);"
          width={800}
          height={600}
          enableDebugLogging={true}
          enableReferenceObject={true}
        />
      );

      await waitForRenderingComplete(page, 'rotate-x');
      await expect(component).toHaveScreenshot('rotate-x.png');

      console.log('[END] Rotate X test completed with simplified visual aids and reference');
    });

    test('should render rotated cube around Y axis with simplified visual aids and reference', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate around Y axis with simplified visual aids and transparent reference');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="rotate-y"
          openscadCode="rotate([0, 45, 0]) cube([10, 5, 3]);"
          referenceOpenscadCode="cube([10, 5, 3]);"
          width={800}
          height={600}
          enableDebugLogging={true}
          enableReferenceObject={true}
        />
      );

      await waitForRenderingComplete(page, 'rotate-y');
      await expect(component).toHaveScreenshot('rotate-y.png');

      console.log('[END] Rotate Y test completed with simplified visual aids and reference');
    });

    test('should render rotated cube around all axes with simplified visual aids and reference', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate around all axes with simplified visual aids and transparent reference');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="rotate-xyz"
          openscadCode="rotate([30, 45, 60]) cube([8, 6, 4]);"
          referenceOpenscadCode="cube([8, 6, 4]);"
          width={800}
          height={600}
          enableDebugLogging={true}
          enableReferenceObject={true}
        />
      );

      await waitForRenderingComplete(page, 'rotate-xyz');
      await expect(component).toHaveScreenshot('rotate-xyz.png');

      console.log('[END] Rotate XYZ test completed with simplified visual aids and reference');
    });

    test('should render rotated cube with single angle with simplified visual aids and reference', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate with single angle with simplified visual aids and transparent reference');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="rotate-single"
          openscadCode="rotate(30) cube([8, 4, 2]);"
          referenceOpenscadCode="cube([8, 4, 2]);"
          width={800}
          height={600}
          enableDebugLogging={true}
          enableReferenceObject={true}
        />
      );

      await waitForRenderingComplete(page, 'rotate-single');
      await expect(component).toHaveScreenshot('rotate-single.png');

      console.log('[END] Rotate single angle test completed with visual aids and reference');
    });
  });

  test.describe('Scale Transformation Tests', () => {
    test('should render scaled cube uniformly with simplified visual aids and reference', async ({ mount, page }) => {
      console.log('[INIT] Testing uniform scale with simplified visual aids and transparent reference');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="scale-uniform"
          openscadCode="scale([2, 2, 2]) cube([5, 5, 5]);"
          referenceOpenscadCode="cube([5, 5, 5]);"
          width={800}
          height={600}
          enableDebugLogging={true}
          enableReferenceObject={true}
        />
      );

      await waitForRenderingComplete(page, 'scale-uniform');
      await expect(component).toHaveScreenshot('scale-uniform.png');

      console.log('[END] Uniform scale test completed with simplified visual aids and reference');
    });

    test('should render scaled cube non-uniformly with simplified visual aids and reference', async ({ mount, page }) => {
      console.log('[INIT] Testing non-uniform scale with simplified visual aids and transparent reference');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="scale-non-uniform"
          openscadCode="scale([3, 1.5, 0.5]) cube([5, 5, 5]);"
          referenceOpenscadCode="cube([5, 5, 5]);"
          width={800}
          height={600}
          enableDebugLogging={true}
          enableReferenceObject={true}
        />
      );

      await waitForRenderingComplete(page, 'scale-non-uniform');
      await expect(component).toHaveScreenshot('scale-non-uniform.png');

      console.log('[END] Non-uniform scale test completed with simplified visual aids and reference');
    });

    test('should render scaled cube with single factor with simplified visual aids and reference', async ({ mount, page }) => {
      console.log('[INIT] Testing scale with single factor with simplified visual aids and transparent reference');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="scale-single"
          openscadCode="scale(1.8) cube([5, 5, 5]);"
          referenceOpenscadCode="cube([5, 5, 5]);"
          width={800}
          height={600}
          enableDebugLogging={true}
          enableReferenceObject={true}
        />
      );

      await waitForRenderingComplete(page, 'scale-single');
      await expect(component).toHaveScreenshot('scale-single.png');

      console.log('[END] Single factor scale test completed with simplified visual aids and reference');
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
        <OpenSCADToMeshWrapper
          testName="mirror-x"
          openscadCode="mirror([1, 0, 0]) cube([6, 4, 3]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await waitForRenderingComplete(page, 'mirror-x');

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
        <OpenSCADToMeshWrapper
          testName="mirror-y"
          openscadCode="mirror([0, 1, 0]) cube([8, 6, 4]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await waitForRenderingComplete(page, 'mirror-y');
      await expect(component).toHaveScreenshot('mirror-y.png');

      console.log('[END] Mirror Y test completed');
    });

    test('should render mirrored cube across Z axis', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror across Z axis');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="mirror-z"
          openscadCode="mirror([0, 0, 1]) cube([8, 4, 6]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await waitForRenderingComplete(page, 'mirror-z');
      await expect(component).toHaveScreenshot('mirror-z.png');

      console.log('[END] Mirror Z test completed');
    });

    test('should render mirrored cube across diagonal plane', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror across diagonal plane');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="mirror-diagonal"
          openscadCode="mirror([1, 1, 0]) cube([6, 6, 4]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await waitForRenderingComplete(page, 'mirror-diagonal');
      await expect(component).toHaveScreenshot('mirror-diagonal.png');

      console.log('[END] Mirror diagonal test completed');
    });
  });

  test.describe('Combined Transformation Tests', () => {
    test('should render cube with translate and rotate combination', async ({ mount, page }) => {
      console.log('[INIT] Testing translate + rotate combination');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="combined-translate-rotate"
          openscadCode="translate([5, 3, 2]) rotate([0, 0, 45]) cube([6, 4, 3]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await waitForRenderingComplete(page, 'combined-translate-rotate');
      await expect(component).toHaveScreenshot('combined-translate-rotate.png');

      console.log('[END] Translate + rotate combination test completed');
    });

    test('should render cube with scale and rotate combination', async ({ mount, page }) => {
      console.log('[INIT] Testing scale + rotate combination');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="combined-scale-rotate"
          openscadCode="scale([2, 1, 1.5]) rotate([30, 0, 0]) cube([4, 4, 4]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await waitForRenderingComplete(page, 'combined-scale-rotate');
      await expect(component).toHaveScreenshot('combined-scale-rotate.png');

      console.log('[END] Scale + rotate combination test completed');
    });

    test('should render cube with all transformations combined', async ({ mount, page }) => {
      console.log('[INIT] Testing all transformations combined');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="combined-all-transforms"
          openscadCode="translate([3, 2, 1]) rotate([15, 30, 45]) scale([1.5, 1.2, 0.8]) cube([5, 5, 5]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await waitForRenderingComplete(page, 'combined-all-transforms');
      await expect(component).toHaveScreenshot('combined-all-transforms.png');

      console.log('[END] All transformations combined test completed');
    });

    test('should render nested transformations', async ({ mount, page }) => {
      console.log('[INIT] Testing nested transformations');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="nested-transforms"
          openscadCode="translate([8, 0, 0]) { rotate([0, 0, 30]) { scale([1.5, 1.5, 1.5]) cube([3, 3, 3]); } }"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await waitForRenderingComplete(page, 'nested-transforms');
      await expect(component).toHaveScreenshot('nested-transforms.png');

      console.log('[END] Nested transformations test completed');
    });
  });

  test.describe('Transformation Edge Cases', () => {
    test('should render transformation with zero values', async ({ mount, page }) => {
      console.log('[INIT] Testing transformation with zero values');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="transform-zero-values"
          openscadCode="translate([0, 0, 0]) rotate([0, 0, 0]) scale([1, 1, 1]) cube([6, 6, 6]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await waitForRenderingComplete(page, 'transform-zero-values');
      await expect(component).toHaveScreenshot('transform-zero-values.png');

      console.log('[END] Zero values transformation test completed');
    });

    test('should render transformation with negative values', async ({ mount, page }) => {
      console.log('[INIT] Testing transformation with negative values');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="transform-negative-values"
          openscadCode="translate([-5, -3, -2]) rotate([-30, -45, -60]) scale([0.5, 2, 1.5]) cube([8, 4, 6]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await waitForRenderingComplete(page, 'transform-negative-values');
      await expect(component).toHaveScreenshot('transform-negative-values.png');

      console.log('[END] Negative values transformation test completed');
    });

    test('should render transformation with large values', async ({ mount, page }) => {
      console.log('[INIT] Testing transformation with large values');

      const component = await mount(
        <OpenSCADToMeshWrapper
          testName="transform-large-values"
          openscadCode="translate([15, 12, 10]) rotate([90, 180, 270]) scale([3, 3, 3]) cube([2, 2, 2]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await waitForRenderingComplete(page, 'transform-large-values');
      await expect(component).toHaveScreenshot('transform-large-values.png');

      console.log('[END] Large values transformation test completed');
    });
  });
});
