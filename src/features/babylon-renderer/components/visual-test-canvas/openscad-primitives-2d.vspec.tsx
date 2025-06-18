/**
 * @file OpenSCAD 2D Primitives Visual Regression Tests
 * 
 * Comprehensive visual regression tests for all 2D OpenSCAD primitives
 * Tests circle, square, and polygon with various parameter combinations
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { VisualTestCanvas } from './visual-test-canvas';

test.describe('OpenSCAD 2D Primitives Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[VISUAL-TEST')) {
        console.log(`Browser: ${msg.text()}`);
      }
    });
  });

  test.describe('Circle Primitive Tests', () => {
    test('should render basic circle with default radius', async ({ mount, page }) => {
      console.log('[INIT] Testing basic circle rendering');
      
      const component = await mount(
        <VisualTestCanvas
          testName="circle-basic"
          openscadCode="circle();"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      // Wait for canvas to be ready
      await page.waitForTimeout(2000);
      
      // Take screenshot for visual regression
      await expect(component).toHaveScreenshot('circle-basic.png');
      
      console.log('[END] Basic circle test completed');
    });

    test('should render circle with specific radius', async ({ mount, page }) => {
      console.log('[INIT] Testing circle with specific radius');
      
      const component = await mount(
        <VisualTestCanvas
          testName="circle-radius"
          openscadCode="circle(r=15);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(2000);
      await expect(component).toHaveScreenshot('circle-radius.png');
      
      console.log('[END] Circle radius test completed');
    });

    test('should render circle with diameter parameter', async ({ mount, page }) => {
      console.log('[INIT] Testing circle with diameter parameter');
      
      const component = await mount(
        <VisualTestCanvas
          testName="circle-diameter"
          openscadCode="circle(d=25);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(2000);
      await expect(component).toHaveScreenshot('circle-diameter.png');
      
      console.log('[END] Circle diameter test completed');
    });

    test('should render circle with tessellation parameters', async ({ mount, page }) => {
      console.log('[INIT] Testing circle with tessellation parameters');
      
      const component = await mount(
        <VisualTestCanvas
          testName="circle-tessellation"
          openscadCode="circle(r=12, $fn=8);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(2000);
      await expect(component).toHaveScreenshot('circle-tessellation.png');
      
      console.log('[END] Circle tessellation test completed');
    });
  });

  test.describe('Square Primitive Tests', () => {
    test('should render basic square with default size', async ({ mount, page }) => {
      console.log('[INIT] Testing basic square rendering');
      
      const component = await mount(
        <VisualTestCanvas
          testName="square-basic"
          openscadCode="square();"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(2000);
      await expect(component).toHaveScreenshot('square-basic.png');
      
      console.log('[END] Basic square test completed');
    });

    test('should render square with specific dimensions', async ({ mount, page }) => {
      console.log('[INIT] Testing square with specific dimensions');
      
      const component = await mount(
        <VisualTestCanvas
          testName="square-dimensions"
          openscadCode="square([20, 15]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(2000);
      await expect(component).toHaveScreenshot('square-dimensions.png');
      
      console.log('[END] Square dimensions test completed');
    });

    test('should render centered square', async ({ mount, page }) => {
      console.log('[INIT] Testing centered square');
      
      const component = await mount(
        <VisualTestCanvas
          testName="square-centered"
          openscadCode="square([18, 18], center=true);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(2000);
      await expect(component).toHaveScreenshot('square-centered.png');
      
      console.log('[END] Centered square test completed');
    });

    test('should render square with single dimension', async ({ mount, page }) => {
      console.log('[INIT] Testing square with single dimension');
      
      const component = await mount(
        <VisualTestCanvas
          testName="square-single-dimension"
          openscadCode="square(22);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(2000);
      await expect(component).toHaveScreenshot('square-single-dimension.png');
      
      console.log('[END] Single dimension square test completed');
    });
  });

  test.describe('Polygon Primitive Tests', () => {
    test('should render triangle polygon', async ({ mount, page }) => {
      console.log('[INIT] Testing triangle polygon rendering');
      
      const component = await mount(
        <VisualTestCanvas
          testName="polygon-triangle"
          openscadCode="polygon([[0,0], [10,0], [5,10]]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(2000);
      await expect(component).toHaveScreenshot('polygon-triangle.png');
      
      console.log('[END] Triangle polygon test completed');
    });

    test('should render pentagon polygon', async ({ mount, page }) => {
      console.log('[INIT] Testing pentagon polygon rendering');
      
      const component = await mount(
        <VisualTestCanvas
          testName="polygon-pentagon"
          openscadCode="polygon([[0,0], [8,0], [10,6], [5,12], [-2,6]]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(2000);
      await expect(component).toHaveScreenshot('polygon-pentagon.png');
      
      console.log('[END] Pentagon polygon test completed');
    });

    test('should render star polygon', async ({ mount, page }) => {
      console.log('[INIT] Testing star polygon rendering');
      
      const component = await mount(
        <VisualTestCanvas
          testName="polygon-star"
          openscadCode="polygon([[0,10], [3,3], [10,3], [5,-2], [8,-8], [0,-5], [-8,-8], [-5,-2], [-10,3], [-3,3]]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(2000);
      await expect(component).toHaveScreenshot('polygon-star.png');
      
      console.log('[END] Star polygon test completed');
    });

    test('should render polygon with paths', async ({ mount, page }) => {
      console.log('[INIT] Testing polygon with paths');
      
      const component = await mount(
        <VisualTestCanvas
          testName="polygon-paths"
          openscadCode="polygon([[0,0], [10,0], [10,10], [0,10], [2,2], [8,2], [8,8], [2,8]], [[0,1,2,3], [4,5,6,7]]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(2000);
      await expect(component).toHaveScreenshot('polygon-paths.png');
      
      console.log('[END] Polygon with paths test completed');
    });
  });
});
