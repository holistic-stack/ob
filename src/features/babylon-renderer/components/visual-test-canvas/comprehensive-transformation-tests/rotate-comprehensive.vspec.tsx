/**
 * @file Comprehensive Rotate Transformation Visual Tests
 * 
 * Comprehensive visual regression tests for rotate transformations
 * Following TDD, DRY, KISS, and SRP principles
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { TransformationComparisonCanvas } from '../transformation-comparison-canvas';
import { generateTestCasesForTypes } from '../transformation-test-data';

test.describe('Comprehensive Rotate Transformation Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    console.log('[INIT] Setting up rotate transformation test environment');
    
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
    
    console.log('[DEBUG] Rotate test environment setup complete');
  });

  test.describe('Rotate with Cube Primitives', () => {
    const cubeRotateTests = generateTestCasesForTypes('rotate', 'cube');
    
    console.log(`[INIT] Generated ${cubeRotateTests.length} cube rotate test cases`);

    // Test a subset for initial TDD verification
    const basicCubeTests = cubeRotateTests.filter(test => test.category === 'basic').slice(0, 5);

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
            objectSeparation={testCase.objectSeparation || 30}
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

  test.describe('Rotate with Sphere Primitives', () => {
    const sphereRotateTests = generateTestCasesForTypes('rotate', 'sphere');
    
    console.log(`[INIT] Generated ${sphereRotateTests.length} sphere rotate test cases`);

    // Test a subset for initial TDD verification
    const basicSphereTests = sphereRotateTests.filter(test => test.category === 'basic').slice(0, 3);

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
            objectSeparation={testCase.objectSeparation || 30}
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

  test.describe('Rotate with Cylinder Primitives', () => {
    const cylinderRotateTests = generateTestCasesForTypes('rotate', 'cylinder');
    
    console.log(`[INIT] Generated ${cylinderRotateTests.length} cylinder rotate test cases`);

    // Test a subset for initial TDD verification
    const basicCylinderTests = cylinderRotateTests.filter(test => test.category === 'basic').slice(0, 3);

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
            objectSeparation={testCase.objectSeparation || 30}
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

  test.describe('Rotate Edge Cases', () => {
    test('should handle rotate with 360 degrees (full rotation)', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate 360 degrees edge case');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="rotate-360-edge-case"
          baseOpenscadCode="cube([6, 4, 2]);"
          transformedOpenscadCode="rotate([0, 0, 360]) cube([6, 4, 2]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('rotate-360-edge-case.png');

      console.log('[END] Rotate 360 degrees edge case completed');
    });

    test('should handle rotate with negative angles', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate negative angles edge case');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="rotate-negative-edge-case"
          baseOpenscadCode="cube([8, 6, 4]);"
          transformedOpenscadCode="rotate([-45, -30, -60]) cube([8, 6, 4]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={35}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('rotate-negative-edge-case.png');

      console.log('[END] Rotate negative angles edge case completed');
    });

    test('should handle rotate with large angles (>360)', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate large angles edge case');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="rotate-large-angles-edge-case"
          baseOpenscadCode="cube([6, 6, 3]);"
          transformedOpenscadCode="rotate([450, 720, 1080]) cube([6, 6, 3]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={35}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('rotate-large-angles-edge-case.png');

      console.log('[END] Rotate large angles edge case completed');
    });

    test('should handle rotate with zero angles (identity)', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate zero angles edge case');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="rotate-zero-edge-case"
          baseOpenscadCode="cube([5, 5, 5]);"
          transformedOpenscadCode="rotate([0, 0, 0]) cube([5, 5, 5]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('rotate-zero-edge-case.png');

      console.log('[END] Rotate zero angles edge case completed');
    });
  });

  test.describe('Rotate Performance Tests', () => {
    test('should handle multiple rotate operations efficiently', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate performance with multiple operations');
      
      const startTime = Date.now();
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="rotate-performance-multiple"
          baseOpenscadCode="cube([4, 4, 4]);"
          transformedOpenscadCode="rotate([15, 0, 0]) rotate([0, 30, 0]) rotate([0, 0, 45]) cube([4, 4, 4]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={35}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('rotate-performance-multiple.png');

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`[DEBUG] Multiple rotate operations completed in ${duration}ms`);
      
      // Performance assertion: should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds max
      
      console.log('[END] Rotate performance test completed');
    });

    test('should handle complex Euler angle combinations', async ({ mount, page }) => {
      console.log('[INIT] Testing rotate performance with complex Euler angles');
      
      const startTime = Date.now();
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="rotate-performance-euler"
          baseOpenscadCode="cube([6, 4, 8]);"
          transformedOpenscadCode="rotate([37.5, 67.3, 123.7]) cube([6, 4, 8]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={40}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('rotate-performance-euler.png');

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`[DEBUG] Complex Euler angle rotation completed in ${duration}ms`);
      
      // Performance assertion: should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds max
      
      console.log('[END] Rotate Euler performance test completed');
    });
  });
});
