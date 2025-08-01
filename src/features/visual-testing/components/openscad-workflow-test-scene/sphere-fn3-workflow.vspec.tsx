/**
 * @file Sphere $fn=3 OpenSCAD Workflow Visual Regression Tests
 *
 * Playwright component tests for the critical $fn=3 sphere fix validation using
 * the complete OpenSCAD workflow: Code → AST → OpenSCAD Geometry Builder → BabylonJS → Screenshots.
 *
 * This test validates the main fix for the $fn=3 sphere rendering issue where
 * spheres with 3 fragments should render as triangular pyramids.
 *
 * Tests critical sphere scenarios:
 * - $fn=3 sphere (main fix validation)
 * - $fn=8 sphere (standard comparison)
 * - $fn=32 sphere (high detail)
 * - Multiple camera angles for comprehensive validation
 *
 * @example
 * Visual tests validate:
 * - Sphere rendering with exact OpenSCAD $fn parameter
 * - Triangular pyramid shape for $fn=3
 * - Complete workflow from OpenSCAD code to 3D visualization
 * - Performance and visual quality
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { expect, test } from '@playwright/experimental-ct-react';
import {
  runBabylonVisualTest,
  STANDARD_SCREENSHOT_OPTIONS,
} from '../../utils/shared-test-setup/shared-test-setup';
import { OpenSCADWorkflowTestScene } from './openscad-workflow-test-scene';

// Critical test cases for sphere geometry validation
const SPHERE_TEST_CASES = [
  {
    name: 'fn3-sphere',
    code: '$fn=3; sphere(5);',
    description: 'Critical fix validation - should render as triangular pyramid',
  },
  {
    name: 'fn8-sphere',
    code: '$fn=8; sphere(5);',
    description: 'Standard sphere with 8 fragments',
  },
  {
    name: 'fn32-sphere',
    code: '$fn=32; sphere(5);',
    description: 'High detail sphere with 32 fragments',
  },
] as const;

const CAMERA_ANGLES = ['isometric', 'front', 'top'] as const;

test.describe('Sphere $fn Parameter OpenSCAD Workflow Visual Regression', () => {
  SPHERE_TEST_CASES.forEach((testCase) => {
    CAMERA_ANGLES.forEach((cameraAngle) => {
      test(`${testCase.name} - ${cameraAngle} view`, async ({ mount, page }) => {
        const testName = `sphere-${testCase.name}-${cameraAngle}-view`;

        await runBabylonVisualTest(
          page,
          testName,
          async () => {
            // Create a mock BabylonJS scene for testing
            const engine = new NullEngine();
            const scene = new Scene(engine);

            const component = await mount(
              <OpenSCADWorkflowTestScene openscadCode={testCase.code} babylonScene={scene} />
            );

            await expect(component).toHaveScreenshot(
              `${testName}.png`,
              STANDARD_SCREENSHOT_OPTIONS
            );

            // Cleanup
            scene.dispose();
            engine.dispose();

            // Cleanup
            scene.dispose();
            engine.dispose();
          },
          {
            // Increase timeout for edge rendering complexity
            canvasOptions: {
              timeout: 25000, // 25 seconds for complex OpenSCAD workflow with edge rendering
              stabilizationTime: 3000, // 3 seconds stabilization for mesh rendering
            },
          }
        );
      });
    });
  });

  // Special test for $fn=3 sphere with detailed validation
  test('fn3-sphere detailed validation - isometric view', async ({ mount, page }) => {
    const testName = 'sphere-fn3-detailed-validation';

    await runBabylonVisualTest(
      page,
      testName,
      async () => {
        // Create a mock BabylonJS scene for testing
        const engine = new NullEngine();
        const scene = new Scene(engine);

        const component = await mount(
          <OpenSCADWorkflowTestScene openscadCode="$fn=3; sphere(5);" babylonScene={scene} />
        );

        // This test specifically validates the triangular pyramid shape
        await expect(component).toHaveScreenshot(`${testName}.png`, {
          ...STANDARD_SCREENSHOT_OPTIONS,
          threshold: 0.1, // Slightly more strict for this critical test
        });

        // Cleanup
        scene.dispose();
        engine.dispose();

        // Cleanup
        scene.dispose();
        engine.dispose();
      },
      {
        // Increase timeout and stabilization for complex mesh generation
        canvasOptions: {
          timeout: 25000, // 25 seconds for complex OpenSCAD workflow
          stabilizationTime: 3000, // 3 seconds stabilization for mesh rendering
        },
      }
    );
  });

  // Test with edge highlighting enabled
  test('fn3-sphere with edge highlighting - isometric view', async ({ mount, page }) => {
    const testName = 'sphere-fn3-edges';

    await runBabylonVisualTest(
      page,
      testName,
      async () => {
        // Create a mock BabylonJS scene for testing

        const engine = new NullEngine();

        const scene = new Scene(engine);

        const component = await mount(
          <OpenSCADWorkflowTestScene openscadCode="$fn=3; sphere(5);" babylonScene={scene} />
        );

        await expect(component).toHaveScreenshot(`${testName}.png`, {
          ...STANDARD_SCREENSHOT_OPTIONS,
          threshold: 0.15, // Slightly more tolerance for edge effects
        });

        // Cleanup
        scene.dispose();
        engine.dispose();
      },
      {
        canvasOptions: {
          timeout: 25000,
          stabilizationTime: 3000,
        },
      }
    );
  });

  // Performance validation test
  test('sphere generation performance validation', async ({ mount, page }) => {
    const testName = 'sphere-performance-validation';

    const startTime = Date.now();

    await runBabylonVisualTest(
      page,
      testName,
      async () => {
        // Create a mock BabylonJS scene for testing

        const engine = new NullEngine();

        const scene = new Scene(engine);

        const component = await mount(
          <OpenSCADWorkflowTestScene openscadCode="$fn=16; sphere(10);" babylonScene={scene} />
        );

        await expect(component).toHaveScreenshot(`${testName}.png`, STANDARD_SCREENSHOT_OPTIONS);

        // Cleanup
        scene.dispose();
        engine.dispose();
      },
      {
        // Increase timeout for edge rendering complexity
        canvasOptions: {
          timeout: 25000, // 25 seconds for complex OpenSCAD workflow with edge rendering
          stabilizationTime: 3000, // 3 seconds stabilization for mesh rendering
        },
      }
    );

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    // Validate performance target (<16ms for geometry generation, but allow more for full workflow with edge rendering)
    expect(renderTime).toBeLessThan(15000); // 15 seconds for full workflow including browser rendering and edge highlighting
  });

  // Test edge highlighting with a cube for better edge visibility
  test('cube with green edge highlighting - isometric view', async ({ mount, page }) => {
    const testName = 'cube-green-edges';

    await runBabylonVisualTest(
      page,
      testName,
      async () => {
        // Create a mock BabylonJS scene for testing

        const engine = new NullEngine();

        const scene = new Scene(engine);

        const component = await mount(
          <OpenSCADWorkflowTestScene openscadCode="cube([10, 10, 10]);" babylonScene={scene} />
        );

        await expect(component).toHaveScreenshot(`${testName}.png`, {
          ...STANDARD_SCREENSHOT_OPTIONS,
          threshold: 0.15, // Tolerance for edge effects
        });

        // Cleanup
        scene.dispose();
        engine.dispose();
      },
      {
        canvasOptions: {
          timeout: 25000,
          stabilizationTime: 3000,
        },
      }
    );
  });
});
