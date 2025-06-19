/**
 * @file Comprehensive Translate Transformation Visual Tests
 * 
 * Comprehensive visual regression tests for translate transformations
 * Following TDD, DRY, KISS, and SRP principles
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { test, expect } from '@playwright/experimental-ct-react';
import { TransformationComparisonCanvas } from '../transformation-comparison-canvas';
import { generateTestCasesForTypes } from '../transformation-test-data';
import { createRenderingWaitPromise, assertRenderingSuccess } from '../test-utilities';

test.describe('Comprehensive Translate Transformation Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    console.log('[INIT] Setting up translate transformation test environment');
    
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
    
    console.log('[DEBUG] Translate test environment setup complete');
  });

  test.describe('Translate with Cube Primitives', () => {
    const cubeTranslateTests = generateTestCasesForTypes('translate', 'cube');
    
    console.log(`[INIT] Generated ${cubeTranslateTests.length} cube translate test cases`);

    cubeTranslateTests.forEach((testCase) => {
      test(`should render ${testCase.name}`, async ({ mount, page }) => {
        console.log(`[INIT] Testing ${testCase.name}: ${testCase.description}`);

        // Create rendering wait promise with callback-based approach
        const { promise, onRenderingComplete, onRenderingError } = createRenderingWaitPromise({
          timeoutMs: testCase.timeout || 8000, // Increased default timeout for safety
          enableLogging: true,
          testName: testCase.name
        });

        const component = await mount(
          <TransformationComparisonCanvas
            testName={testCase.name}
            baseOpenscadCode={testCase.baseOpenscadCode}
            transformedOpenscadCode={testCase.transformedOpenscadCode}
            width={1200}
            height={800}
            enableDebugLogging={true}
            objectSeparation={testCase.objectSeparation || 30}
            onRenderingComplete={onRenderingComplete}
            onRenderingError={onRenderingError}
          />
        );

        // Wait for rendering completion using callback-based approach
        console.log(`[DEBUG] Waiting for rendering completion callback...`);
        const result = await promise;

        // Assert rendering was successful
        assertRenderingSuccess(result, testCase.name);
        console.log(`[DEBUG] Rendering completed successfully in ${result.duration}ms`);

        // Capture screenshot for visual regression
        await expect(component).toHaveScreenshot(`${testCase.name}.png`);

        console.log(`[END] ${testCase.name} test completed successfully`);
      });
    });
  });

  test.describe('Translate with Sphere Primitives', () => {
    const sphereTranslateTests = generateTestCasesForTypes('translate', 'sphere');
    
    console.log(`[INIT] Generated ${sphereTranslateTests.length} sphere translate test cases`);

    sphereTranslateTests.forEach((testCase) => {
      test(`should render ${testCase.name}`, async ({ mount, page }) => {
        console.log(`[INIT] Testing ${testCase.name}: ${testCase.description}`);

        // Create rendering wait promise with callback-based approach
        const { promise, onRenderingComplete, onRenderingError } = createRenderingWaitPromise({
          timeoutMs: testCase.timeout || 9000, // Spheres may need more time
          enableLogging: true,
          testName: testCase.name
        });

        const component = await mount(
          <TransformationComparisonCanvas
            testName={testCase.name}
            baseOpenscadCode={testCase.baseOpenscadCode}
            transformedOpenscadCode={testCase.transformedOpenscadCode}
            width={1200}
            height={800}
            enableDebugLogging={true}
            objectSeparation={testCase.objectSeparation || 30}
            onRenderingComplete={onRenderingComplete}
            onRenderingError={onRenderingError}
          />
        );

        // Wait for rendering completion using callback-based approach
        console.log(`[DEBUG] Waiting for sphere rendering completion callback...`);
        const result = await promise;

        // Assert rendering was successful
        assertRenderingSuccess(result, testCase.name);
        console.log(`[DEBUG] Sphere rendering completed successfully in ${result.duration}ms`);

        // Capture screenshot for visual regression
        await expect(component).toHaveScreenshot(`${testCase.name}.png`);

        console.log(`[END] ${testCase.name} test completed successfully`);
      });
    });
  });

  test.describe('Translate with Cylinder Primitives', () => {
    const cylinderTranslateTests = generateTestCasesForTypes('translate', 'cylinder');
    
    console.log(`[INIT] Generated ${cylinderTranslateTests.length} cylinder translate test cases`);

    cylinderTranslateTests.forEach((testCase) => {
      test(`should render ${testCase.name}`, async ({ mount, page }) => {
        console.log(`[INIT] Testing ${testCase.name}: ${testCase.description}`);

        // Create rendering wait promise with callback-based approach
        const { promise, onRenderingComplete, onRenderingError } = createRenderingWaitPromise({
          timeoutMs: testCase.timeout || 9000, // Cylinders may need more time
          enableLogging: true,
          testName: testCase.name
        });

        const component = await mount(
          <TransformationComparisonCanvas
            testName={testCase.name}
            baseOpenscadCode={testCase.baseOpenscadCode}
            transformedOpenscadCode={testCase.transformedOpenscadCode}
            width={1200}
            height={800}
            enableDebugLogging={true}
            objectSeparation={testCase.objectSeparation || 30}
            onRenderingComplete={onRenderingComplete}
            onRenderingError={onRenderingError}
          />
        );

        // Wait for rendering completion using callback-based approach
        console.log(`[DEBUG] Waiting for cylinder rendering completion callback...`);
        const result = await promise;

        // Assert rendering was successful
        assertRenderingSuccess(result, testCase.name);
        console.log(`[DEBUG] Cylinder rendering completed successfully in ${result.duration}ms`);

        // Capture screenshot for visual regression
        await expect(component).toHaveScreenshot(`${testCase.name}.png`);

        console.log(`[END] ${testCase.name} test completed successfully`);
      });
    });
  });

  test.describe('Translate Edge Cases', () => {
    test('should handle translate with zero values', async ({ mount, page }) => {
      console.log('[INIT] Testing translate zero values edge case');

      // Create rendering wait promise with callback-based approach
      const { promise, onRenderingComplete, onRenderingError } = createRenderingWaitPromise({
        timeoutMs: 8000,
        enableLogging: true,
        testName: 'translate-zero-edge-case'
      });

      const component = await mount(
        <TransformationComparisonCanvas
          testName="translate-zero-edge-case"
          baseOpenscadCode="cube([5, 5, 5]);"
          transformedOpenscadCode="translate([0, 0, 0]) cube([5, 5, 5]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={30}
          onRenderingComplete={onRenderingComplete}
          onRenderingError={onRenderingError}
        />
      );

      // Wait for rendering completion using callback-based approach
      const result = await promise;
      assertRenderingSuccess(result, 'translate-zero-edge-case');
      console.log(`[DEBUG] Zero values edge case completed in ${result.duration}ms`);

      await expect(component).toHaveScreenshot('translate-zero-edge-case.png');

      console.log('[END] Translate zero values edge case completed');
    });

    test('should handle translate with very large values', async ({ mount, page }) => {
      console.log('[INIT] Testing translate large values edge case');

      // Create rendering wait promise with callback-based approach
      const { promise, onRenderingComplete, onRenderingError } = createRenderingWaitPromise({
        timeoutMs: 10000, // Large values may need more time
        enableLogging: true,
        testName: 'translate-large-values-edge-case'
      });

      const component = await mount(
        <TransformationComparisonCanvas
          testName="translate-large-values-edge-case"
          baseOpenscadCode="cube([3, 3, 3]);"
          transformedOpenscadCode="translate([100, 80, 60]) cube([3, 3, 3]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={120}
          onRenderingComplete={onRenderingComplete}
          onRenderingError={onRenderingError}
        />
      );

      // Wait for rendering completion using callback-based approach
      const result = await promise;
      assertRenderingSuccess(result, 'translate-large-values-edge-case');
      console.log(`[DEBUG] Large values edge case completed in ${result.duration}ms`);

      await expect(component).toHaveScreenshot('translate-large-values-edge-case.png');

      console.log('[END] Translate large values edge case completed');
    });

    test('should handle translate with negative values', async ({ mount, page }) => {
      console.log('[INIT] Testing translate negative values edge case');

      // Create rendering wait promise with callback-based approach
      const { promise, onRenderingComplete, onRenderingError } = createRenderingWaitPromise({
        timeoutMs: 8000,
        enableLogging: true,
        testName: 'translate-negative-values-edge-case'
      });

      const component = await mount(
        <TransformationComparisonCanvas
          testName="translate-negative-values-edge-case"
          baseOpenscadCode="cube([6, 4, 8]);"
          transformedOpenscadCode="translate([-15, -12, -10]) cube([6, 4, 8]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={40}
          onRenderingComplete={onRenderingComplete}
          onRenderingError={onRenderingError}
        />
      );

      // Wait for rendering completion using callback-based approach
      const result = await promise;
      assertRenderingSuccess(result, 'translate-negative-values-edge-case');
      console.log(`[DEBUG] Negative values edge case completed in ${result.duration}ms`);

      await expect(component).toHaveScreenshot('translate-negative-values-edge-case.png');

      console.log('[END] Translate negative values edge case completed');
    });

    test('should handle translate with decimal precision', async ({ mount, page }) => {
      console.log('[INIT] Testing translate decimal precision edge case');

      // Create rendering wait promise with callback-based approach
      const { promise, onRenderingComplete, onRenderingError } = createRenderingWaitPromise({
        timeoutMs: 8000,
        enableLogging: true,
        testName: 'translate-decimal-precision-edge-case'
      });

      const component = await mount(
        <TransformationComparisonCanvas
          testName="translate-decimal-precision-edge-case"
          baseOpenscadCode="cube([4, 4, 4]);"
          transformedOpenscadCode="translate([3.14159, 2.71828, 1.41421]) cube([4, 4, 4]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={35}
          onRenderingComplete={onRenderingComplete}
          onRenderingError={onRenderingError}
        />
      );

      // Wait for rendering completion using callback-based approach
      const result = await promise;
      assertRenderingSuccess(result, 'translate-decimal-precision-edge-case');
      console.log(`[DEBUG] Decimal precision edge case completed in ${result.duration}ms`);

      await expect(component).toHaveScreenshot('translate-decimal-precision-edge-case.png');

      console.log('[END] Translate decimal precision edge case completed');
    });
  });

  test.describe('Translate Performance Tests', () => {
    test('should handle multiple translate operations efficiently', async ({ mount, page }) => {
      console.log('[INIT] Testing translate performance with multiple operations');

      const startTime = Date.now();

      // Create rendering wait promise with callback-based approach
      const { promise, onRenderingComplete, onRenderingError } = createRenderingWaitPromise({
        timeoutMs: 12000, // Performance tests may need more time
        enableLogging: true,
        testName: 'translate-performance-multiple'
      });

      const component = await mount(
        <TransformationComparisonCanvas
          testName="translate-performance-multiple"
          baseOpenscadCode="cube([2, 2, 2]);"
          transformedOpenscadCode="translate([5, 0, 0]) translate([0, 5, 0]) translate([0, 0, 5]) cube([2, 2, 2]);"
          width={1200}
          height={800}
          enableDebugLogging={true}
          objectSeparation={40}
          onRenderingComplete={onRenderingComplete}
          onRenderingError={onRenderingError}
        />
      );

      // Wait for rendering completion using callback-based approach
      const result = await promise;
      assertRenderingSuccess(result, 'translate-performance-multiple');

      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      console.log(`[DEBUG] Multiple translate operations completed in ${totalDuration}ms (rendering: ${result.duration}ms)`);

      await expect(component).toHaveScreenshot('translate-performance-multiple.png');

      // Performance assertion: should complete within reasonable time
      expect(totalDuration).toBeLessThan(15000); // 15 seconds max for total test time
      expect(result.duration).toBeLessThan(12000); // 12 seconds max for rendering

      console.log('[END] Translate performance test completed');
    });
  });
});
