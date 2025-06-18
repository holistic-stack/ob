/**
 * @file OpenSCAD Complex Scenarios Visual Regression Tests
 * 
 * Comprehensive visual regression tests for complex OpenSCAD scenarios
 * Combines multiple primitives, transformations, and CSG operations
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { VisualTestCanvas } from './visual-test-canvas';

test.describe('OpenSCAD Complex Scenarios Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[VISUAL-TEST')) {
        console.log(`Browser: ${msg.text()}`);
      }
    });
  });

  test.describe('Architectural Models', () => {
    test('should render simple house model', async ({ mount, page }) => {
      console.log('[INIT] Testing simple house model');
      
      const houseCode = `
        // Base of house
        cube([20, 15, 10]);
        
        // Roof
        translate([0, 0, 10])
        rotate([0, 0, 0])
        linear_extrude(height=2)
        polygon([[0, 0], [20, 0], [10, 8], [0, 8]]);
        
        // Door
        translate([8, -1, 0])
        cube([4, 2, 7]);
        
        // Windows
        translate([2, -1, 6])
        cube([3, 2, 2]);
        
        translate([15, -1, 6])
        cube([3, 2, 2]);
      `;
      
      const component = await mount(
        <VisualTestCanvas
          testName="house-model"
          openscadCode={houseCode}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('house-model.png');
      
      console.log('[END] House model test completed');
    });

    test('should render tower with multiple levels', async ({ mount, page }) => {
      console.log('[INIT] Testing tower model');
      
      const towerCode = `
        // Base level
        cylinder(h=8, r=6);
        
        // Second level
        translate([0, 0, 8])
        cylinder(h=6, r=4);
        
        // Third level
        translate([0, 0, 14])
        cylinder(h=4, r=2.5);
        
        // Top cone
        translate([0, 0, 18])
        cylinder(h=4, r1=2.5, r2=0);
        
        // Windows on base level
        for(i = [0:3]) {
          rotate([0, 0, i*90])
          translate([4, 0, 4])
          cube([1, 2, 2], center=true);
        }
      `;
      
      const component = await mount(
        <VisualTestCanvas
          testName="tower-model"
          openscadCode={towerCode}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('tower-model.png');
      
      console.log('[END] Tower model test completed');
    });
  });

  test.describe('Mechanical Parts', () => {
    test('should render gear-like object', async ({ mount, page }) => {
      console.log('[INIT] Testing gear model');
      
      const gearCode = `
        difference() {
          // Main gear body
          cylinder(h=4, r=10);
          
          // Center hole
          cylinder(h=6, r=3);
          
          // Gear teeth (simplified)
          for(i = [0:11]) {
            rotate([0, 0, i*30])
            translate([8, 0, 0])
            cylinder(h=6, r=1.5);
          }
        }
      `;
      
      const component = await mount(
        <VisualTestCanvas
          testName="gear-model"
          openscadCode={gearCode}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('gear-model.png');
      
      console.log('[END] Gear model test completed');
    });

    test('should render bracket with holes', async ({ mount, page }) => {
      console.log('[INIT] Testing bracket model');
      
      const bracketCode = `
        difference() {
          // Main bracket body
          union() {
            cube([20, 8, 4]);
            translate([0, 0, 4])
            cube([8, 8, 12]);
          }
          
          // Mounting holes in base
          translate([4, 4, -1])
          cylinder(h=6, r=1.5);
          
          translate([16, 4, -1])
          cylinder(h=6, r=1.5);
          
          // Side hole
          translate([-1, 4, 10])
          rotate([0, 90, 0])
          cylinder(h=10, r=2);
        }
      `;
      
      const component = await mount(
        <VisualTestCanvas
          testName="bracket-model"
          openscadCode={bracketCode}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('bracket-model.png');
      
      console.log('[END] Bracket model test completed');
    });
  });

  test.describe('Artistic Objects', () => {
    test('should render decorative vase', async ({ mount, page }) => {
      console.log('[INIT] Testing decorative vase');
      
      const vaseCode = `
        // Vase body using scaled cylinders
        union() {
          // Base
          cylinder(h=2, r=6);
          
          // Lower body
          translate([0, 0, 2])
          cylinder(h=8, r1=6, r2=4);
          
          // Middle section
          translate([0, 0, 10])
          cylinder(h=6, r1=4, r2=5);
          
          // Upper section
          translate([0, 0, 16])
          cylinder(h=4, r1=5, r2=3);
          
          // Neck
          translate([0, 0, 20])
          cylinder(h=3, r=3);
          
          // Rim
          translate([0, 0, 23])
          cylinder(h=1, r1=3, r2=4);
        }
      `;
      
      const component = await mount(
        <VisualTestCanvas
          testName="vase-model"
          openscadCode={vaseCode}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('vase-model.png');
      
      console.log('[END] Vase model test completed');
    });

    test('should render abstract sculpture', async ({ mount, page }) => {
      console.log('[INIT] Testing abstract sculpture');
      
      const sculptureCode = `
        union() {
          // Central sphere
          sphere(r=5);
          
          // Intersecting cubes at different angles
          rotate([45, 0, 0])
          cube([8, 8, 8], center=true);
          
          rotate([0, 45, 0])
          cube([6, 6, 6], center=true);
          
          rotate([0, 0, 45])
          cube([10, 10, 4], center=true);
          
          // Cylindrical elements
          translate([0, 0, 8])
          cylinder(h=6, r=2);
          
          translate([0, 0, -8])
          cylinder(h=6, r=2);
        }
      `;
      
      const component = await mount(
        <VisualTestCanvas
          testName="sculpture-model"
          openscadCode={sculptureCode}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('sculpture-model.png');
      
      console.log('[END] Sculpture model test completed');
    });
  });

  test.describe('Stress Test Scenarios', () => {
    test('should render model with many small details', async ({ mount, page }) => {
      console.log('[INIT] Testing detailed model');
      
      const detailedCode = `
        difference() {
          // Main body
          cube([15, 15, 8]);
          
          // Grid of small holes
          for(x = [2:3:13]) {
            for(y = [2:3:13]) {
              translate([x, y, -1])
              cylinder(h=10, r=0.8);
            }
          }
          
          // Larger central hole
          translate([7.5, 7.5, -1])
          cylinder(h=10, r=2);
        }
      `;
      
      const component = await mount(
        <VisualTestCanvas
          testName="detailed-model"
          openscadCode={detailedCode}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(5000); // More time for complex geometry
      await expect(component).toHaveScreenshot('detailed-model.png');
      
      console.log('[END] Detailed model test completed');
    });

    test('should render nested transformations', async ({ mount, page }) => {
      console.log('[INIT] Testing nested transformations');
      
      const nestedCode = `
        translate([0, 0, 5])
        rotate([30, 0, 0])
        scale([1.2, 0.8, 1.5])
        difference() {
          union() {
            cube([10, 10, 10], center=true);
            rotate([0, 0, 45])
            cube([8, 8, 12], center=true);
          }
          sphere(r=6);
        }
      `;
      
      const component = await mount(
        <VisualTestCanvas
          testName="nested-transformations"
          openscadCode={nestedCode}
          width={800}
          height={600}
          enableDebugLogging={true}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('nested-transformations.png');
      
      console.log('[END] Nested transformations test completed');
    });
  });
});
