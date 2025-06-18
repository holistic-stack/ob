/**
 * @file Comprehensive Mirror Transformation Visual Tests
 * 
 * Comprehensive visual regression tests for mirror transformations
 * Following TDD, DRY, KISS, and SRP principles
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { TransformationComparisonCanvas } from '../transformation-comparison-canvas';
import { generateTestCasesForTypes } from '../transformation-test-data';

test.describe('Comprehensive Mirror Transformation Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    console.log('[INIT] Setting up mirror transformation test environment');
    
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
    
    console.log('[DEBUG] Mirror test environment setup complete');
  });

  test.describe('Mirror with Cube Primitives', () => {
    const cubeMirrorTests = generateTestCasesForTypes('mirror', 'cube');
    
    console.log(`[INIT] Generated ${cubeMirrorTests.length} cube mirror test cases`);

    // Test a subset for initial TDD verification
    const basicCubeTests = cubeMirrorTests.filter(test => test.category === 'basic').slice(0, 5);

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

  test.describe('Mirror with Sphere Primitives', () => {
    const sphereMirrorTests = generateTestCasesForTypes('mirror', 'sphere');
    
    console.log(`[INIT] Generated ${sphereMirrorTests.length} sphere mirror test cases`);

    // Test a subset for initial TDD verification
    const basicSphereTests = sphereMirrorTests.filter(test => test.category === 'basic').slice(0, 3);

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

  test.describe('Mirror with Cylinder Primitives', () => {
    const cylinderMirrorTests = generateTestCasesForTypes('mirror', 'cylinder');
    
    console.log(`[INIT] Generated ${cylinderMirrorTests.length} cylinder mirror test cases`);

    // Test a subset for initial TDD verification
    const basicCylinderTests = cylinderMirrorTests.filter(test => test.category === 'basic').slice(0, 3);

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

  test.describe('Mirror Edge Cases', () => {
    test('should handle mirror across X axis (YZ plane)', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror X axis edge case');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="mirror-x-axis-edge-case"
          baseOpenscadCode="cube([8, 6, 4]);"
          transformedOpenscadCode="mirror([1, 0, 0]) cube([8, 6, 4]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('mirror-x-axis-edge-case.png');

      console.log('[END] Mirror X axis edge case completed');
    });

    test('should handle mirror across Y axis (XZ plane)', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror Y axis edge case');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="mirror-y-axis-edge-case"
          baseOpenscadCode="cube([6, 8, 4]);"
          transformedOpenscadCode="mirror([0, 1, 0]) cube([6, 8, 4]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('mirror-y-axis-edge-case.png');

      console.log('[END] Mirror Y axis edge case completed');
    });

    test('should handle mirror across Z axis (XY plane)', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror Z axis edge case');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="mirror-z-axis-edge-case"
          baseOpenscadCode="cube([6, 4, 8]);"
          transformedOpenscadCode="mirror([0, 0, 1]) cube([6, 4, 8]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('mirror-z-axis-edge-case.png');

      console.log('[END] Mirror Z axis edge case completed');
    });

    test('should handle mirror across diagonal plane', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror diagonal plane edge case');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="mirror-diagonal-edge-case"
          baseOpenscadCode="cube([8, 6, 4]);"
          transformedOpenscadCode="mirror([1, 1, 0]) cube([8, 6, 4]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={35}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('mirror-diagonal-edge-case.png');

      console.log('[END] Mirror diagonal plane edge case completed');
    });

    test('should handle mirror with normalized vector', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror normalized vector edge case');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="mirror-normalized-vector-edge-case"
          baseOpenscadCode="cube([8, 6, 4]);"
          transformedOpenscadCode="mirror([0.707, 0.707, 0]) cube([8, 6, 4]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={35}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('mirror-normalized-vector-edge-case.png');

      console.log('[END] Mirror normalized vector edge case completed');
    });

    test('should handle mirror with large vector components', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror large vector edge case');
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="mirror-large-vector-edge-case"
          baseOpenscadCode="cube([6, 6, 6]);"
          transformedOpenscadCode="mirror([100, 0, 0]) cube([6, 6, 6]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('mirror-large-vector-edge-case.png');

      console.log('[END] Mirror large vector edge case completed');
    });
  });

  test.describe('Mirror Performance Tests', () => {
    test('should handle multiple mirror operations efficiently', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror performance with multiple operations');
      
      const startTime = Date.now();
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="mirror-performance-multiple"
          baseOpenscadCode="cube([4, 4, 4]);"
          transformedOpenscadCode="mirror([1, 0, 0]) mirror([0, 1, 0]) cube([4, 4, 4]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('mirror-performance-multiple.png');

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`[DEBUG] Multiple mirror operations completed in ${duration}ms`);
      
      // Performance assertion: should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds max
      
      console.log('[END] Mirror performance test completed');
    });

    test('should handle complex 3D diagonal mirroring efficiently', async ({ mount, page }) => {
      console.log('[INIT] Testing mirror performance with 3D diagonal');
      
      const startTime = Date.now();
      
      const component = await mount(
        <TransformationComparisonCanvas
          testName="mirror-performance-3d-diagonal"
          baseOpenscadCode="cube([6, 4, 8]);"
          transformedOpenscadCode="mirror([1, 1, 1]) cube([6, 4, 8]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={35}
        />
      );

      await page.waitForTimeout(4000);
      await expect(component).toHaveScreenshot('mirror-performance-3d-diagonal.png');

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`[DEBUG] 3D diagonal mirror completed in ${duration}ms`);
      
      // Performance assertion: should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds max
      
      console.log('[END] Mirror 3D diagonal performance test completed');
    });
  });
});
