/**
 * @file Cube Center Parameter OpenSCAD Workflow Visual Regression Tests
 *
 * Playwright component tests for cube center parameter validation using
 * the complete OpenSCAD workflow: Code → AST → OpenSCAD Geometry Builder → BabylonJS → Screenshots.
 *
 * This test validates the critical center parameter handling for cubes,
 * ensuring proper positioning and bounds calculation.
 *
 * Tests critical cube scenarios:
 * - center=true (cube centered at origin)
 * - center=false (cube with corner at origin)
 * - Non-uniform dimensions with center parameter
 * - Various size configurations
 *
 * @example
 * Visual tests validate:
 * - Cube positioning with center parameter
 * - Proper bounds calculation and camera centering
 * - Complete workflow from OpenSCAD code to 3D visualization
 * - Uniform and non-uniform cube dimensions
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { expect, test } from '@playwright/experimental-ct-react';
import {
  runBabylonVisualTest,
  STANDARD_SCREENSHOT_OPTIONS,
} from '../../utils/shared-test-setup/shared-test-setup';
import { OpenSCADWorkflowTestScene } from './openscad-workflow-test-scene';

// Critical test cases for cube center parameter validation
const CUBE_TEST_CASES = [
  {
    name: 'cube-centered',
    code: 'cube([6, 6, 6], center=true);',
    description: 'Cube centered at origin - critical parameter test',
  },
  {
    name: 'cube-not-centered',
    code: 'cube([6, 6, 6], center=false);',
    description: 'Cube with corner at origin - default behavior',
  },
  {
    name: 'cube-non-uniform-centered',
    code: 'cube([2, 4, 6], center=true);',
    description: 'Non-uniform cube centered at origin',
  },
  {
    name: 'cube-non-uniform-not-centered',
    code: 'cube([2, 4, 6], center=false);',
    description: 'Non-uniform cube with corner at origin',
  },
  {
    name: 'cube-uniform-size',
    code: 'cube(8, center=true);',
    description: 'Uniform cube using single size parameter',
  },
  {
    name: 'cube-large-centered',
    code: 'cube([20, 20, 20], center=true);',
    description: 'Large cube for bounds and camera testing',
  },
] as const;

const CAMERA_ANGLES = ['isometric', 'front', 'top'] as const;

test.describe('Cube Center Parameter OpenSCAD Workflow Visual Regression', () => {
  CUBE_TEST_CASES.forEach((testCase) => {
    CAMERA_ANGLES.forEach((cameraAngle) => {
      test(`${testCase.name} - ${cameraAngle} view`, async ({ mount, page }) => {
        const testName = `cube-${testCase.name}-${cameraAngle}-view`;

        await runBabylonVisualTest(page, testName, async () => {
          // Create a mock BabylonJS scene for testing
          const engine = new NullEngine();
          const scene = new Scene(engine);

          const component = await mount(
            <OpenSCADWorkflowTestScene openscadCode={testCase.code} babylonScene={scene} />
          );

          await expect(component).toHaveScreenshot(`${testName}.png`, STANDARD_SCREENSHOT_OPTIONS);

          // Cleanup
          scene.dispose();
          engine.dispose();
        });
      });
    });
  });

  // Special test for center parameter comparison with 3D axis visible
  test('cube center parameter comparison with axis', async ({ mount, page }) => {
    const testName = 'cube-center-comparison-with-axis';

    await runBabylonVisualTest(page, testName, async () => {
      // Create a mock BabylonJS scene for testing
      const engine = new NullEngine();
      const scene = new Scene(engine);

      const component = await mount(
        <OpenSCADWorkflowTestScene
          openscadCode="cube([8, 8, 8], center=true);"
          babylonScene={scene}
        />
      );

      // This test specifically validates the center parameter with axis reference
      await expect(component).toHaveScreenshot(`${testName}.png`, {
        ...STANDARD_SCREENSHOT_OPTIONS,
        threshold: 0.1, // Slightly more strict for this critical test
      });

      // Cleanup
      scene.dispose();
      engine.dispose();
    });
  });

  // Edge case test: very small cube
  test('cube small size edge case', async ({ mount, page }) => {
    const testName = 'cube-small-size-edge-case';

    await runBabylonVisualTest(page, testName, async () => {
      // Create a mock BabylonJS scene for testing
      const engine = new NullEngine();
      const scene = new Scene(engine);

      const component = await mount(
        <OpenSCADWorkflowTestScene
          openscadCode="cube([1, 1, 1], center=true);"
          babylonScene={scene}
        />
      );

      await expect(component).toHaveScreenshot(`${testName}.png`, STANDARD_SCREENSHOT_OPTIONS);

      // Cleanup
      scene.dispose();
      engine.dispose();
    });
  });

  // Bounds calculation test: extreme dimensions
  test('cube extreme dimensions bounds test', async ({ mount, page }) => {
    const testName = 'cube-extreme-dimensions-bounds';

    await runBabylonVisualTest(page, testName, async () => {
      // Create a mock BabylonJS scene for testing
      const engine = new NullEngine();
      const scene = new Scene(engine);

      const component = await mount(
        <OpenSCADWorkflowTestScene
          openscadCode="cube([1, 10, 20], center=true);"
          babylonScene={scene}
        />
      );

      await expect(component).toHaveScreenshot(`${testName}.png`, STANDARD_SCREENSHOT_OPTIONS);

      // Cleanup
      scene.dispose();
      engine.dispose();
    });
  });
});
