/**
 * @file Comprehensive Combined Transformation Visual Tests
 * 
 * Comprehensive visual regression tests for combined transformations
 * Following TDD, DRY, KISS, and SRP principles
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { TransformationComparisonCanvas } from '../transformation-comparison-canvas';
import { generateTestCasesForTypes } from '../transformation-test-data';

test.describe('Comprehensive Combined Transformation Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    console.log('[INIT] Setting up combined transformation test environment');
    
    // Enable console logging for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'log' && (
        msg.text().includes('[TRANSFORM-TEST') ||
        msg.text().includes('[INIT]') ||
        msg.text().includes('[DEBUG]') ||
        msg.text().includes('[ERROR]') ||
        msg.text().includes('[WARN]') ||
        msg.text().includes('[END]')
      )) {
        console.log(`Browser: ${msg.text()}`);
      }
    });
    
    console.log('[DEBUG] Combined transformation test environment setup complete');
  });

  test.describe('Combined Transformations with Cube Primitives', () => {
    const cubeCombinedTests = generateTestCasesForTypes('combined', 'cube');
    
    console.log(`[INIT] Generated ${cubeCombinedTests.length} cube combined test cases`);

    // Test a subset for initial TDD verification
    const basicCubeTests = cubeCombinedTests.filter(test => test.category === 'basic').slice(0, 3);

    basicCubeTests.forEach((testCase) => {
      test(`should render ${testCase.name}`, async ({ mount, page }) => {
        console.log(`[INIT] Testing ${testCase.name}: ${testCase.description}`);
        
        const component = await mount(
          <TransformationComparisonCanvas
            testName={testCase.name}
            baseOpenscadCode={testCase.baseOpenscadCode}
            transformedOpenscadCode={testCase.transformedOpenscadCode}
            width={1200}
            height={800}
            enableDebugLogging={true}
            objectSeparation={testCase.objectSeparation || 40}
          />
        );

        // Wait for rendering completion based on test complexity
        const waitTime = testCase.timeout || 5000; // Combined transformations need more time
        console.log(`[DEBUG] Waiting ${waitTime}ms for rendering completion`);
        await page.waitForTimeout(waitTime);

        // Capture screenshot for visual regression
        await expect(component).toHaveScreenshot(`${testCase.name}.png`);

        console.log(`[END] ${testCase.name} test completed successfully`);
      });
    });
  });

  test.describe('Combined Transformations with Sphere Primitives', () => {
    const sphereCombinedTests = generateTestCasesForTypes('combined', 'sphere');
    
    console.log(`[INIT] Generated ${sphereCombinedTests.length} sphere combined test cases`);

    // Test a subset for initial TDD verification
    const basicSphereTests = sphereCombinedTests.filter(test => test.category === 'basic').slice(0, 2);

    basicSphereTests.forEach((testCase) => {
      test(`should render ${testCase.name}`, async ({ mount, page }) => {
        console.log(`[INIT] Testing ${testCase.name}: ${testCase.description}`);
        
        const component = await mount(
          <TransformationComparisonCanvas
            testName={testCase.name}
            baseOpenscadCode={testCase.baseOpenscadCode}
            transformedOpenscadCode={testCase.transformedOpenscadCode}
            width={1200}
            height={800}
            enableDebugLogging={true}
            objectSeparation={testCase.objectSeparation || 40}
          />
        );

        // Wait for rendering completion
        const waitTime = testCase.timeout || 6000; // Spheres with combined transformations need more time
        console.log(`[DEBUG] Waiting ${waitTime}ms for sphere rendering completion`);
        await page.waitForTimeout(waitTime);

        // Capture screenshot for visual regression
        await expect(component).toHaveScreenshot(`${testCase.name}.png`);

        console.log(`[END] ${testCase.name} test completed successfully`);
      });
    });
  });

  test.describe('Combined Transformations with Cylinder Primitives', () => {
    const cylinderCombinedTests = generateTestCasesForTypes('combined', 'cylinder');
    
    console.log(`[INIT] Generated ${cylinderCombinedTests.length} cylinder combined test cases`);

    // Test a subset for initial TDD verification
    const basicCylinderTests = cylinderCombinedTests.filter(test => test.category === 'basic').slice(0, 2);

    basicCylinderTests.forEach((testCase) => {
      test(`should render ${testCase.name}`, async ({ mount, page }) => {
        console.log(`[INIT] Testing ${testCase.name}: ${testCase.description}`);
        
        const component = await mount(
          <TransformationComparisonCanvas
            testName={testCase.name}
            baseOpenscadCode={testCase.baseOpenscadCode}
            transformedOpenscadCode={testCase.transformedOpenscadCode}
            width={1200}
            height={800}
            enableDebugLogging={true}
            objectSeparation={testCase.objectSeparation || 40}
          />
        );

        // Wait for rendering completion
        const waitTime = testCase.timeout || 6000; // Cylinders with combined transformations need more time
        console.log(`[DEBUG] Waiting ${waitTime}ms for cylinder rendering completion`);
        await page.waitForTimeout(waitTime);

        // Capture screenshot for visual regression
        await expect(component).toHaveScreenshot(`${testCase.name}.png`);

        console.log(`[END] ${testCase.name} test completed successfully`);
      });
    });
  });

  test.describe('Complex Combined Transformation Scenarios', () => {
    test('should handle translate + rotate combination', async ({ mount, page }) => {
      console.log('[INIT] Testing translate + rotate combination');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="translate-rotate-combination"
          baseOpenscadCode="cube([6, 4, 3]);"
          transformedOpenscadCode="translate([5, 3, 2]) rotate([0, 0, 45]) cube([6, 4, 3]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={40}
        />
      );

      await page.waitForTimeout(5000);
      await expect(component).toHaveScreenshot('translate-rotate-combination.png');

      console.log('[END] Translate + rotate combination completed');
    });

    test('should handle scale + rotate combination', async ({ mount, page }) => {
      console.log('[INIT] Testing scale + rotate combination');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="scale-rotate-combination"
          baseOpenscadCode="cube([4, 4, 4]);"
          transformedOpenscadCode="scale([2, 1, 1.5]) rotate([30, 0, 0]) cube([4, 4, 4]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={45}
        />
      );

      await page.waitForTimeout(5000);
      await expect(component).toHaveScreenshot('scale-rotate-combination.png');

      console.log('[END] Scale + rotate combination completed');
    });

    test('should handle translate + scale + rotate combination', async ({ mount, page }) => {
      console.log('[INIT] Testing translate + scale + rotate combination');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="translate-scale-rotate-combination"
          baseOpenscadCode="cube([4, 4, 4]);"
          transformedOpenscadCode="translate([3, 2, 1]) scale([1.5, 1.2, 0.8]) rotate([15, 30, 45]) cube([4, 4, 4]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={50}
        />
      );

      await page.waitForTimeout(5000);
      await expect(component).toHaveScreenshot('translate-scale-rotate-combination.png');

      console.log('[END] Translate + scale + rotate combination completed');
    });

    test('should handle all transformations combined', async ({ mount, page }) => {
      console.log('[INIT] Testing all transformations combined');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="all-transformations-combined"
          baseOpenscadCode="cube([3, 3, 3]);"
          transformedOpenscadCode="translate([5, 3, 2]) rotate([15, 30, 45]) scale([1.5, 1.2, 0.8]) mirror([1, 0, 0]) cube([3, 3, 3]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={60}
        />
      );

      await page.waitForTimeout(6000);
      await expect(component).toHaveScreenshot('all-transformations-combined.png');

      console.log('[END] All transformations combined completed');
    });

    test('should handle nested transformation blocks', async ({ mount, page }) => {
      console.log('[INIT] Testing nested transformation blocks');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="nested-transformation-blocks"
          baseOpenscadCode="cube([3, 3, 3]);"
          transformedOpenscadCode="translate([8, 0, 0]) { rotate([0, 0, 30]) { scale([1.5, 1.5, 1.5]) cube([3, 3, 3]); } }"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={50}
        />
      );

      await page.waitForTimeout(5000);
      await expect(component).toHaveScreenshot('nested-transformation-blocks.png');

      console.log('[END] Nested transformation blocks completed');
    });
  });

  test.describe('Combined Transformation Edge Cases', () => {
    test('should handle transformations with extreme values', async ({ mount, page }) => {
      console.log('[INIT] Testing combined transformations with extreme values');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="combined-extreme-values"
          baseOpenscadCode="cube([2, 2, 2]);"
          transformedOpenscadCode="translate([20, 15, 10]) rotate([90, 180, 270]) scale([3, 0.5, 2]) cube([2, 2, 2]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={80}
        />
      );

      await page.waitForTimeout(6000);
      await expect(component).toHaveScreenshot('combined-extreme-values.png');

      console.log('[END] Combined extreme values completed');
    });

    test('should handle identity transformations combined', async ({ mount, page }) => {
      console.log('[INIT] Testing combined identity transformations');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="combined-identity-transformations"
          baseOpenscadCode="cube([5, 5, 5]);"
          transformedOpenscadCode="translate([0, 0, 0]) rotate([0, 0, 0]) scale([1, 1, 1]) cube([5, 5, 5]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('combined-identity-transformations.png');

      console.log('[END] Combined identity transformations completed');
    });
  });

  test.describe('Combined Transformation Performance Tests', () => {
    test('should handle complex transformation chains efficiently', async ({ mount, page }) => {
      console.log('[INIT] Testing combined transformation performance');
      
      const startTime = Date.now();
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="combined-performance-chain"
          baseOpenscadCode="cube([3, 3, 3]);"
          transformedOpenscadCode="translate([2, 0, 0]) rotate([15, 0, 0]) translate([0, 2, 0]) rotate([0, 15, 0]) translate([0, 0, 2]) rotate([0, 0, 15]) cube([3, 3, 3]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={45}
        />
      );

      await page.waitForTimeout(6000);
      await expect(component).toHaveScreenshot('combined-performance-chain.png');

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`[DEBUG] Complex transformation chain completed in ${duration}ms`);
      
      // Performance assertion: should complete within reasonable time
      expect(duration).toBeLessThan(12000); // 12 seconds max for complex chains
      
      console.log('[END] Combined transformation performance test completed');
    });
  });
});
