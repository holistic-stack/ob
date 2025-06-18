/**
 * @file Comprehensive Scale Transformation Visual Tests
 * 
 * Comprehensive visual regression tests for scale transformations
 * Following TDD, DRY, KISS, and SRP principles
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { TransformationComparisonCanvas } from '../transformation-comparison-canvas';
import { generateTestCasesForTypes } from '../transformation-test-data';

test.describe('Comprehensive Scale Transformation Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    console.log('[INIT] Setting up scale transformation test environment');
    
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
    
    console.log('[DEBUG] Scale test environment setup complete');
  });

  test.describe('Scale with Cube Primitives', () => {
    const cubeScaleTests = generateTestCasesForTypes('scale', 'cube');
    
    console.log(`[INIT] Generated ${cubeScaleTests.length} cube scale test cases`);

    // Test a subset for initial TDD verification
    const basicCubeTests = cubeScaleTests.filter(test => test.category === 'basic').slice(0, 5);

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
            objectSeparation={testCase.objectSeparation || 35}
          />
        );

        // Wait for rendering completion based on test complexity
        const waitTime = testCase.timeout || 4000;
        console.log(`[DEBUG] Waiting ${waitTime}ms for rendering completion`);
        await page.waitForTimeout(waitTime);

        // Capture screenshot for visual regression
        await expect(component).toHaveScreenshot(`${testCase.name}.png`);

        console.log(`[END] ${testCase.name} test completed successfully`);
      });
    });
  });

  test.describe('Scale with Sphere Primitives', () => {
    const sphereScaleTests = generateTestCasesForTypes('scale', 'sphere');
    
    console.log(`[INIT] Generated ${sphereScaleTests.length} sphere scale test cases`);

    // Test a subset for initial TDD verification
    const basicSphereTests = sphereScaleTests.filter(test => test.category === 'basic').slice(0, 3);

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
            objectSeparation={testCase.objectSeparation || 35}
          />
        );

        // Wait for rendering completion
        const waitTime = testCase.timeout || 5000; // Spheres need more time
        console.log(`[DEBUG] Waiting ${waitTime}ms for sphere rendering completion`);
        await page.waitForTimeout(waitTime);

        // Capture screenshot for visual regression
        await expect(component).toHaveScreenshot(`${testCase.name}.png`);

        console.log(`[END] ${testCase.name} test completed successfully`);
      });
    });
  });

  test.describe('Scale with Cylinder Primitives', () => {
    const cylinderScaleTests = generateTestCasesForTypes('scale', 'cylinder');
    
    console.log(`[INIT] Generated ${cylinderScaleTests.length} cylinder scale test cases`);

    // Test a subset for initial TDD verification
    const basicCylinderTests = cylinderScaleTests.filter(test => test.category === 'basic').slice(0, 3);

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
            objectSeparation={testCase.objectSeparation || 35}
          />
        );

        // Wait for rendering completion
        const waitTime = testCase.timeout || 5000; // Cylinders need more time
        console.log(`[DEBUG] Waiting ${waitTime}ms for cylinder rendering completion`);
        await page.waitForTimeout(waitTime);

        // Capture screenshot for visual regression
        await expect(component).toHaveScreenshot(`${testCase.name}.png`);

        console.log(`[END] ${testCase.name} test completed successfully`);
      });
    });
  });

  test.describe('Scale Edge Cases', () => {
    test('should handle uniform scale by factor of 2', async ({ mount, page }) => {
      console.log('[INIT] Testing uniform scale 2x edge case');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="scale-uniform-2x-edge-case"
          baseOpenscadCode="cube([4, 4, 4]);"
          transformedOpenscadCode="scale([2, 2, 2]) cube([4, 4, 4]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={40}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('scale-uniform-2x-edge-case.png');

      console.log('[END] Uniform scale 2x edge case completed');
    });

    test('should handle scale with zero factor (degenerate)', async ({ mount, page }) => {
      console.log('[INIT] Testing scale zero factor edge case');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="scale-zero-factor-edge-case"
          baseOpenscadCode="cube([6, 6, 6]);"
          transformedOpenscadCode="scale([0, 1, 1]) cube([6, 6, 6]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={35}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('scale-zero-factor-edge-case.png');

      console.log('[END] Scale zero factor edge case completed');
    });

    test('should handle scale with negative factors (mirror + scale)', async ({ mount, page }) => {
      console.log('[INIT] Testing scale negative factors edge case');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="scale-negative-factors-edge-case"
          baseOpenscadCode="cube([6, 4, 8]);"
          transformedOpenscadCode="scale([-1, 2, -0.5]) cube([6, 4, 8]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={40}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('scale-negative-factors-edge-case.png');

      console.log('[END] Scale negative factors edge case completed');
    });

    test('should handle scale with very large factors', async ({ mount, page }) => {
      console.log('[INIT] Testing scale large factors edge case');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="scale-large-factors-edge-case"
          baseOpenscadCode="cube([1, 1, 1]);"
          transformedOpenscadCode="scale([10, 10, 10]) cube([1, 1, 1]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={80}
        />
      );

      await page.waitForTimeout(5000);
      await expect(component).toHaveScreenshot('scale-large-factors-edge-case.png');

      console.log('[END] Scale large factors edge case completed');
    });

    test('should handle non-uniform scale with extreme ratios', async ({ mount, page }) => {
      console.log('[INIT] Testing scale extreme ratios edge case');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="scale-extreme-ratios-edge-case"
          baseOpenscadCode="cube([4, 4, 4]);"
          transformedOpenscadCode="scale([10, 0.1, 1]) cube([4, 4, 4]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={50}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('scale-extreme-ratios-edge-case.png');

      console.log('[END] Scale extreme ratios edge case completed');
    });
  });

  test.describe('Scale Performance Tests', () => {
    test('should handle multiple scale operations efficiently', async ({ mount, page }) => {
      console.log('[INIT] Testing scale performance with multiple operations');
      
      const startTime = Date.now();
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="scale-performance-multiple"
          baseOpenscadCode="cube([3, 3, 3]);"
          transformedOpenscadCode="scale([2, 1, 1]) scale([1, 2, 1]) scale([1, 1, 2]) cube([3, 3, 3]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={40}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('scale-performance-multiple.png');

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`[DEBUG] Multiple scale operations completed in ${duration}ms`);
      
      // Performance assertion: should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds max
      
      console.log('[END] Scale performance test completed');
    });

    test('should handle complex non-uniform scaling efficiently', async ({ mount, page }) => {
      console.log('[INIT] Testing scale performance with complex non-uniform scaling');
      
      const startTime = Date.now();
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="scale-performance-complex"
          baseOpenscadCode="cube([4, 6, 3]);"
          transformedOpenscadCode="scale([2.5, 0.8, 1.6]) cube([4, 6, 3]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={45}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('scale-performance-complex.png');

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`[DEBUG] Complex non-uniform scaling completed in ${duration}ms`);
      
      // Performance assertion: should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds max
      
      console.log('[END] Scale complex performance test completed');
    });
  });
});
