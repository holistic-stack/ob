/**
 * @file OpenSCAD Extrusion Operations Visual Regression Tests
 * 
 * Comprehensive visual regression tests for OpenSCAD extrusion operations
 * Tests linear_extrude and rotate_extrude with various parameter combinations
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { VisualTestCanvas } from './visual-test-canvas';

/**
 * Helper function to wait for rendering completion using Babylon.js scene.executeWhenReady()
 */
async function waitForRenderingComplete(page: any, testName: string) {
  console.log(`[DEBUG] Waiting for rendering completion for test: ${testName}`);

  // Wait for the canvas to have data-rendering-complete="true"
  await page.waitForFunction(
    (testName: string) => {
      const canvas = document.querySelector(`[data-testid="visual-test-canvas-${testName}"]`);
      return canvas && canvas.getAttribute('data-rendering-complete') === 'true';
    },
    testName,
    { timeout: 30000 } // 30 second timeout as fallback
  );

  console.log(`[DEBUG] Rendering completion detected for test: ${testName}`);
}

test.describe('OpenSCAD Extrusion Operations Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'log' && (msg.text().includes('[VISUAL-TEST') || msg.text().includes('[INIT]') || msg.text().includes('[DEBUG]') || msg.text().includes('[ERROR]'))) {
        console.log(`Browser: ${msg.text()}`);
      }
    });
  });

  test.describe('Linear Extrude Operations', () => {
    test('should render basic linear extrude of circle', async ({ mount, page }) => {
      console.log('[INIT] Testing basic linear extrude of circle');
      
      const component = await mount(
        <VisualTestCanvas
          testName="linear-extrude-circle-basic"
          openscadCode={`
            linear_extrude(height=10) {
              circle(r=5);
            }
          `}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      // Wait for rendering to complete using callback
      await waitForRenderingComplete(page, 'linear-extrude-circle-basic');
      await expect(component).toHaveScreenshot('linear-extrude-circle-basic.png');
      
      console.log('[END] Basic linear extrude circle test completed');
    });

    test('should render linear extrude of square with twist', async ({ mount, page }) => {
      console.log('[INIT] Testing linear extrude with twist');
      
      const component = await mount(
        <VisualTestCanvas
          testName="linear-extrude-square-twist"
          openscadCode={`
            linear_extrude(height=15, twist=45) {
              square([4, 4]);
            }
          `}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await waitForRenderingComplete(page, 'linear-extrude-square-twist');
      await expect(component).toHaveScreenshot('linear-extrude-square-twist.png');
      
      console.log('[END] Linear extrude with twist test completed');
    });

    test('should render linear extrude with scale parameter', async ({ mount, page }) => {
      console.log('[INIT] Testing linear extrude with scale');
      
      const component = await mount(
        <VisualTestCanvas
          testName="linear-extrude-scale"
          openscadCode={`
            linear_extrude(height=12, scale=[1.5, 0.5]) {
              square([6, 6], center=true);
            }
          `}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4500);
      await expect(component).toHaveScreenshot('linear-extrude-scale.png');
      
      console.log('[END] Linear extrude with scale test completed');
    });

    test('should render centered linear extrude', async ({ mount, page }) => {
      console.log('[INIT] Testing centered linear extrude');
      
      const component = await mount(
        <VisualTestCanvas
          testName="linear-extrude-centered"
          openscadCode={`
            linear_extrude(height=8, center=true) {
              circle(r=3);
            }
          `}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4500);
      await expect(component).toHaveScreenshot('linear-extrude-centered.png');
      
      console.log('[END] Centered linear extrude test completed');
    });

    test('should render complex linear extrude with twist and scale', async ({ mount, page }) => {
      console.log('[INIT] Testing complex linear extrude');
      
      const component = await mount(
        <VisualTestCanvas
          testName="linear-extrude-complex"
          openscadCode={`
            linear_extrude(height=20, center=true, twist=90, scale=[2, 0.5]) {
              square([3, 8], center=true);
            }
          `}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4500);
      await expect(component).toHaveScreenshot('linear-extrude-complex.png');
      
      console.log('[END] Complex linear extrude test completed');
    });
  });

  test.describe('Rotate Extrude Operations', () => {
    test('should render basic rotate extrude of circle', async ({ mount, page }) => {
      console.log('[INIT] Testing basic rotate extrude of circle');
      
      const component = await mount(
        <VisualTestCanvas
          testName="rotate-extrude-circle-basic"
          openscadCode={`
            rotate_extrude() {
              translate([10, 0, 0]) circle(r=3);
            }
          `}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4500);
      await expect(component).toHaveScreenshot('rotate-extrude-circle-basic.png');
      
      console.log('[END] Basic rotate extrude circle test completed');
    });

    test('should render rotate extrude with partial angle', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate extrude with partial angle');
      
      const component = await mount(
        <VisualTestCanvas
          testName="rotate-extrude-partial"
          openscadCode={`
            rotate_extrude(angle=180) {
              translate([8, 0, 0]) square([2, 6]);
            }
          `}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4500);
      await expect(component).toHaveScreenshot('rotate-extrude-partial.png');
      
      console.log('[END] Rotate extrude partial angle test completed');
    });

    test('should render rotate extrude of square profile', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate extrude of square');
      
      const component = await mount(
        <VisualTestCanvas
          testName="rotate-extrude-square"
          openscadCode={`
            rotate_extrude() {
              translate([12, 0, 0]) square([4, 8], center=true);
            }
          `}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4500);
      await expect(component).toHaveScreenshot('rotate-extrude-square.png');
      
      console.log('[END] Rotate extrude square test completed');
    });

    test('should render rotate extrude with 270 degree angle', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate extrude with 270 degrees');
      
      const component = await mount(
        <VisualTestCanvas
          testName="rotate-extrude-270"
          openscadCode={`
            rotate_extrude(angle=270) {
              translate([6, 0, 0]) circle(r=2);
            }
          `}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4500);
      await expect(component).toHaveScreenshot('rotate-extrude-270.png');
      
      console.log('[END] Rotate extrude 270 degrees test completed');
    });
  });

  test.describe('Combined Extrusion Operations', () => {
    test('should render multiple extrusion operations', async ({ mount, page }) => {
      console.log('[INIT] Testing multiple extrusion operations');
      
      const component = await mount(
        <VisualTestCanvas
          testName="extrusion-multiple"
          openscadCode={`
            union() {
              translate([-15, 0, 0]) {
                linear_extrude(height=8, twist=30) {
                  square([4, 4], center=true);
                }
              }
              translate([15, 0, 0]) {
                rotate_extrude(angle=180) {
                  translate([5, 0, 0]) circle(r=2);
                }
              }
            }
          `}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4500);
      await expect(component).toHaveScreenshot('extrusion-multiple.png');
      
      console.log('[END] Multiple extrusion operations test completed');
    });

    test('should render nested extrusion with transformations', async ({ mount, page }) => {
      console.log('[INIT] Testing nested extrusion with transformations');
      
      const component = await mount(
        <VisualTestCanvas
          testName="extrusion-nested"
          openscadCode={`
            rotate([0, 0, 45]) {
              linear_extrude(height=10, center=true, scale=[1.5, 1.5]) {
                difference() {
                  circle(r=6);
                  circle(r=3);
                }
              }
            }
          `}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4500);
      await expect(component).toHaveScreenshot('extrusion-nested.png');
      
      console.log('[END] Nested extrusion test completed');
    });
  });
});
