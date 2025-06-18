/**
 * @file OpenSCAD CSG Operations Visual Regression Tests
 * 
 * Comprehensive visual regression tests for all OpenSCAD CSG (Boolean) operations
 * Tests union, difference, and intersection with various geometry combinations
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { VisualTestCanvas } from './visual-test-canvas';

test.describe('OpenSCAD CSG Operations Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[VISUAL-TEST')) {
        console.log(`Browser: ${msg.text()}`);
      }
    });
  });

  test.describe('Union Operation Tests', () => {
    test('should render union of two cubes', async ({ mount, page }) => {
      console.log('[INIT] Testing union of two cubes');
      
      const component = await mount(
        <VisualTestCanvas
          testName="union-cubes"
          openscadCode="union() { cube([10, 10, 10]); translate([5, 5, 5]) cube([10, 10, 10]); }"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000); // CSG operations may take longer
      await expect(component).toHaveScreenshot('union-cubes.png');
      
      console.log('[END] Union cubes test completed');
    });

    test('should render union of cube and sphere', async ({ mount, page }) => {
      console.log('[INIT] Testing union of cube and sphere');
      
      const component = await mount(
        <VisualTestCanvas
          testName="union-cube-sphere"
          openscadCode="union() { cube([12, 12, 12], center=true); sphere(r=8); }"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('union-cube-sphere.png');
      
      console.log('[END] Union cube-sphere test completed');
    });

    test('should render union of multiple primitives', async ({ mount, page }) => {
      console.log('[INIT] Testing union of multiple primitives');
      
      const component = await mount(
        <VisualTestCanvas
          testName="union-multiple"
          openscadCode="union() { cube([8, 8, 8]); translate([6, 0, 0]) sphere(r=5); translate([0, 6, 0]) cylinder(h=10, r=3); }"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('union-multiple.png');
      
      console.log('[END] Union multiple test completed');
    });

    test('should render implicit union (no union keyword)', async ({ mount, page }) => {
      console.log('[INIT] Testing implicit union');
      
      const component = await mount(
        <VisualTestCanvas
          testName="union-implicit"
          openscadCode="{ cube([6, 6, 6]); translate([4, 4, 4]) sphere(r=4); }"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('union-implicit.png');
      
      console.log('[END] Implicit union test completed');
    });
  });

  test.describe('Difference Operation Tests', () => {
    test('should render difference of two cubes', async ({ mount, page }) => {
      console.log('[INIT] Testing difference of two cubes');
      
      const component = await mount(
        <VisualTestCanvas
          testName="difference-cubes"
          openscadCode="difference() { cube([15, 15, 15]); translate([5, 5, 5]) cube([10, 10, 10]); }"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('difference-cubes.png');
      
      console.log('[END] Difference cubes test completed');
    });

    test('should render cube with spherical hole', async ({ mount, page }) => {
      console.log('[INIT] Testing cube with spherical hole');
      
      const component = await mount(
        <VisualTestCanvas
          testName="difference-cube-sphere"
          openscadCode="difference() { cube([16, 16, 16], center=true); sphere(r=6); }"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('difference-cube-sphere.png');
      
      console.log('[END] Cube with spherical hole test completed');
    });

    test('should render cylinder with cylindrical hole', async ({ mount, page }) => {
      console.log('[INIT] Testing cylinder with cylindrical hole');
      
      const component = await mount(
        <VisualTestCanvas
          testName="difference-cylinders"
          openscadCode="difference() { cylinder(h=20, r=8); cylinder(h=25, r=4); }"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('difference-cylinders.png');
      
      console.log('[END] Cylinder with hole test completed');
    });

    test('should render complex difference with multiple subtractions', async ({ mount, page }) => {
      console.log('[INIT] Testing complex difference');
      
      const component = await mount(
        <VisualTestCanvas
          testName="difference-complex"
          openscadCode="difference() { cube([20, 20, 20], center=true); sphere(r=6); translate([8, 0, 0]) cylinder(h=25, r=3, center=true); }"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('difference-complex.png');
      
      console.log('[END] Complex difference test completed');
    });
  });

  test.describe('Intersection Operation Tests', () => {
    test('should render intersection of two cubes', async ({ mount, page }) => {
      console.log('[INIT] Testing intersection of two cubes');
      
      const component = await mount(
        <VisualTestCanvas
          testName="intersection-cubes"
          openscadCode="intersection() { cube([15, 15, 15]); translate([5, 5, 5]) cube([15, 15, 15]); }"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('intersection-cubes.png');
      
      console.log('[END] Intersection cubes test completed');
    });

    test('should render intersection of cube and sphere', async ({ mount, page }) => {
      console.log('[INIT] Testing intersection of cube and sphere');
      
      const component = await mount(
        <VisualTestCanvas
          testName="intersection-cube-sphere"
          openscadCode="intersection() { cube([16, 16, 16], center=true); sphere(r=10); }"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('intersection-cube-sphere.png');
      
      console.log('[END] Intersection cube-sphere test completed');
    });

    test('should render intersection of cylinder and cube', async ({ mount, page }) => {
      console.log('[INIT] Testing intersection of cylinder and cube');
      
      const component = await mount(
        <VisualTestCanvas
          testName="intersection-cylinder-cube"
          openscadCode="intersection() { cylinder(h=20, r=8, center=true); cube([12, 12, 25], center=true); }"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('intersection-cylinder-cube.png');
      
      console.log('[END] Intersection cylinder-cube test completed');
    });

    test('should render intersection of three primitives', async ({ mount, page }) => {
      console.log('[INIT] Testing intersection of three primitives');
      
      const component = await mount(
        <VisualTestCanvas
          testName="intersection-three"
          openscadCode="intersection() { cube([18, 18, 18], center=true); sphere(r=12); rotate([0, 45, 0]) cylinder(h=25, r=6, center=true); }"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(3000);
      await expect(component).toHaveScreenshot('intersection-three.png');
      
      console.log('[END] Intersection three primitives test completed');
    });
  });

  test.describe('Nested CSG Operations Tests', () => {
    test('should render nested union and difference', async ({ mount, page }) => {
      console.log('[INIT] Testing nested union and difference');
      
      const component = await mount(
        <VisualTestCanvas
          testName="nested-union-difference"
          openscadCode="difference() { union() { cube([12, 12, 12]); translate([8, 0, 0]) cube([12, 12, 12]); } translate([6, 6, 6]) sphere(r=4); }"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4000); // Nested operations may take longer
      await expect(component).toHaveScreenshot('nested-union-difference.png');
      
      console.log('[END] Nested union-difference test completed');
    });

    test('should render complex nested operations', async ({ mount, page }) => {
      console.log('[INIT] Testing complex nested operations');
      
      const component = await mount(
        <VisualTestCanvas
          testName="nested-complex"
          openscadCode="intersection() { union() { cube([16, 16, 16], center=true); sphere(r=10); } difference() { cylinder(h=20, r=12, center=true); cylinder(h=25, r=6, center=true); } }"
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('nested-complex.png');
      
      console.log('[END] Complex nested operations test completed');
    });
  });
});
