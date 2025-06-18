/**
 * @file OpenSCAD 3D Primitives Visual Regression Tests
 * 
 * Comprehensive visual regression tests for all 3D OpenSCAD primitives
 * Tests cube, sphere, and cylinder with various parameter combinations
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { VisualTestCanvas } from './visual-test-canvas';

test.describe('OpenSCAD 3D Primitives Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[VISUAL-TEST')) {
        console.log(`Browser: ${msg.text()}`);
      }
    });
  });

  test.describe('Cube Primitive Tests', () => {
    test('should render basic cube with default size', async ({ mount, page }) => {
      console.log('[INIT] Testing basic cube rendering');
      
      const component = await mount(
        <VisualTestCanvas
          testName="cube-basic"
          openscadCode="cube();"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      // Wait for canvas to be ready and rendering to complete
      await page.waitForTimeout(3000);

      // Take screenshot for visual regression
      await expect(component).toHaveScreenshot('cube-basic.png');
      
      console.log('[END] Basic cube test completed');
    });

    test('should render cube with specific dimensions', async ({ mount, page }) => {
      console.log('[INIT] Testing cube with specific dimensions');
      
      const component = await mount(
        <VisualTestCanvas
          testName="cube-dimensions"
          openscadCode="cube([10, 20, 30]);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('cube-dimensions.png');
      
      console.log('[END] Cube dimensions test completed');
    });

    test('should render centered cube', async ({ mount, page }) => {
      console.log('[INIT] Testing centered cube');
      
      const component = await mount(
        <VisualTestCanvas
          testName="cube-centered"
          openscadCode="cube([15, 15, 15], center=true);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('cube-centered.png');
      
      console.log('[END] Centered cube test completed');
    });

    test('should render cube with single dimension', async ({ mount, page }) => {
      console.log('[INIT] Testing cube with single dimension');
      
      const component = await mount(
        <VisualTestCanvas
          testName="cube-single-dimension"
          openscadCode="cube(25);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('cube-single-dimension.png');
      
      console.log('[END] Single dimension cube test completed');
    });
  });

  test.describe('Sphere Primitive Tests', () => {
    test('should render basic sphere with default radius', async ({ mount, page }) => {
      console.log('[INIT] Testing basic sphere rendering');
      
      const component = await mount(
        <VisualTestCanvas
          testName="sphere-basic"
          openscadCode="sphere();"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('sphere-basic.png');
      
      console.log('[END] Basic sphere test completed');
    });

    test('should render sphere with specific radius', async ({ mount, page }) => {
      console.log('[INIT] Testing sphere with specific radius');
      
      const component = await mount(
        <VisualTestCanvas
          testName="sphere-radius"
          openscadCode="sphere(r=15);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('sphere-radius.png');
      
      console.log('[END] Sphere radius test completed');
    });

    test('should render sphere with diameter parameter', async ({ mount, page }) => {
      console.log('[INIT] Testing sphere with diameter parameter');
      
      const component = await mount(
        <VisualTestCanvas
          testName="sphere-diameter"
          openscadCode="sphere(d=30);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('sphere-diameter.png');

      console.log('[END] Sphere diameter test completed');
    });

    test('should render sphere with tessellation parameters', async ({ mount, page }) => {
      console.log('[INIT] Testing sphere with tessellation parameters');

      const component = await mount(
        <VisualTestCanvas
          testName="sphere-tessellation"
          openscadCode="sphere(r=12, $fn=16);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('sphere-tessellation.png');
      
      console.log('[END] Sphere tessellation test completed');
    });
  });

  test.describe('Cylinder Primitive Tests', () => {
    test('should render basic cylinder with default parameters', async ({ mount, page }) => {
      console.log('[INIT] Testing basic cylinder rendering');
      
      const component = await mount(
        <VisualTestCanvas
          testName="cylinder-basic"
          openscadCode="cylinder();"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('cylinder-basic.png');

      console.log('[END] Basic cylinder test completed');
    });

    test('should render cylinder with height and radius', async ({ mount, page }) => {
      console.log('[INIT] Testing cylinder with height and radius');

      const component = await mount(
        <VisualTestCanvas
          testName="cylinder-height-radius"
          openscadCode="cylinder(h=20, r=8);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('cylinder-height-radius.png');
      
      console.log('[END] Cylinder height-radius test completed');
    });

    test('should render cone with different top and bottom radii', async ({ mount, page }) => {
      console.log('[INIT] Testing cone with different radii');
      
      const component = await mount(
        <VisualTestCanvas
          testName="cylinder-cone"
          openscadCode="cylinder(h=25, r1=10, r2=2);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('cylinder-cone.png');

      console.log('[END] Cone test completed');
    });

    test('should render cylinder with diameter parameter', async ({ mount, page }) => {
      console.log('[INIT] Testing cylinder with diameter parameter');

      const component = await mount(
        <VisualTestCanvas
          testName="cylinder-diameter"
          openscadCode="cylinder(h=15, d=20);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('cylinder-diameter.png');

      console.log('[END] Cylinder diameter test completed');
    });

    test('should render centered cylinder', async ({ mount, page }) => {
      console.log('[INIT] Testing centered cylinder');

      const component = await mount(
        <VisualTestCanvas
          testName="cylinder-centered"
          openscadCode="cylinder(h=18, r=6, center=true);"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('cylinder-centered.png');
      
      console.log('[END] Centered cylinder test completed');
    });
  });
});
