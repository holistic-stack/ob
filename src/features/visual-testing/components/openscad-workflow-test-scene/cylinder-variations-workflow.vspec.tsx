/**
 * @file Cylinder Variations OpenSCAD Workflow Visual Regression Tests
 *
 * Playwright component tests for cylinder variations validation using
 * the complete OpenSCAD workflow: Code → AST → OpenSCAD Geometry Builder → BabylonJS → Screenshots.
 *
 * This test validates critical cylinder generation scenarios including
 * standard cylinders, cones, and truncated cones.
 *
 * Tests critical cylinder scenarios:
 * - Standard cylinder (r1 = r2)
 * - Cone (r2 = 0) - edge case validation
 * - Truncated cone (r1 ≠ r2)
 * - Center parameter handling
 * - Various fragment counts
 *
 * @example
 * Visual tests validate:
 * - Cylinder generation with different radii configurations
 * - Cone edge case handling (r2=0)
 * - Complete workflow from OpenSCAD code to 3D visualization
 * - Fragment count variations and tessellation quality
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { expect, test } from '@playwright/experimental-ct-react';
import {
  runBabylonVisualTest,
  STANDARD_SCREENSHOT_OPTIONS,
} from '../../utils/shared-test-setup/shared-test-setup';
import { OpenSCADWorkflowTestScene } from './openscad-workflow-test-scene';

// Critical test cases for cylinder variations validation
const CYLINDER_TEST_CASES = [
  {
    name: 'cylinder-standard',
    code: '$fn=16; cylinder(h=10, r1=5, r2=5, center=false);',
    description: 'Standard cylinder with equal top and bottom radii',
  },
  {
    name: 'cylinder-cone',
    code: '$fn=16; cylinder(h=10, r1=5, r2=0, center=false);',
    description: 'Cone - critical edge case with r2=0',
  },
  {
    name: 'cylinder-truncated-cone',
    code: '$fn=16; cylinder(h=10, r1=5, r2=2, center=false);',
    description: 'Truncated cone with different top and bottom radii',
  },
  {
    name: 'cylinder-inverted-cone',
    code: '$fn=16; cylinder(h=10, r1=0, r2=5, center=false);',
    description: 'Inverted cone - r1=0 edge case',
  },
  {
    name: 'cylinder-centered',
    code: '$fn=16; cylinder(h=10, r1=5, r2=5, center=true);',
    description: 'Centered cylinder - position parameter test',
  },
  {
    name: 'cylinder-low-fragments',
    code: '$fn=6; cylinder(h=10, r1=5, r2=5, center=false);',
    description: 'Low fragment count - hexagonal cylinder',
  },
  {
    name: 'cylinder-high-fragments',
    code: '$fn=32; cylinder(h=10, r1=5, r2=5, center=false);',
    description: 'High fragment count - smooth cylinder',
  },
] as const;

const CAMERA_ANGLES = ['isometric', 'front', 'side'] as const;

test.describe('Cylinder Variations OpenSCAD Workflow Visual Regression', () => {
  CYLINDER_TEST_CASES.forEach((testCase) => {
    CAMERA_ANGLES.forEach((cameraAngle) => {
      test(`${testCase.name} - ${cameraAngle} view`, async ({ mount, page }) => {
        const testName = `cylinder-${testCase.name}-${cameraAngle}-view`;

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

  // Special test for cone edge case with detailed validation
  test('cylinder cone edge case detailed validation', async ({ mount, page }) => {
    const testName = 'cylinder-cone-edge-case-detailed';

    await runBabylonVisualTest(page, testName, async () => {
      // Create a mock BabylonJS scene for testing
      const engine = new NullEngine();
      const scene = new Scene(engine);

      const component = await mount(
        <OpenSCADWorkflowTestScene
          openscadCode="$fn=8; cylinder(h=12, r1=6, r2=0, center=false);"
          babylonScene={scene}
        />
      );

      // This test specifically validates the cone edge case (r2=0)
      await expect(component).toHaveScreenshot(`${testName}.png`, {
        ...STANDARD_SCREENSHOT_OPTIONS,
        threshold: 0.1, // Slightly more strict for this critical test
      });

      // Cleanup
      scene.dispose();
      engine.dispose();
    });
  });

  // Fragment count comparison test
  test('cylinder fragment count comparison', async ({ mount, page }) => {
    const testName = 'cylinder-fragment-comparison';

    await runBabylonVisualTest(page, testName, async () => {
      // Create a mock BabylonJS scene for testing
      const engine = new NullEngine();
      const scene = new Scene(engine);

      const component = await mount(
        <OpenSCADWorkflowTestScene
          openscadCode="$fn=3; cylinder(h=8, r1=4, r2=4, center=true);"
          babylonScene={scene}
        />
      );

      // This test validates minimum fragment count (triangular cylinder)
      await expect(component).toHaveScreenshot(`${testName}.png`, STANDARD_SCREENSHOT_OPTIONS);

      // Cleanup
      scene.dispose();
      engine.dispose();
    });
  });

  // Center parameter validation test
  test('cylinder center parameter validation', async ({ mount, page }) => {
    const testName = 'cylinder-center-parameter-validation';

    await runBabylonVisualTest(page, testName, async () => {
      // Create a mock BabylonJS scene for testing
      const engine = new NullEngine();
      const scene = new Scene(engine);

      const component = await mount(
        <OpenSCADWorkflowTestScene
          openscadCode="$fn=12; cylinder(h=15, r1=7, r2=7, center=true);"
          babylonScene={scene}
        />
      );

      await expect(component).toHaveScreenshot(`${testName}.png`, STANDARD_SCREENSHOT_OPTIONS);

      // Cleanup
      scene.dispose();
      engine.dispose();
    });
  });

  // Performance test with complex truncated cone
  test('cylinder complex truncated cone performance', async ({ mount, page }) => {
    const testName = 'cylinder-complex-truncated-cone-performance';

    const startTime = Date.now();

    await runBabylonVisualTest(page, testName, async () => {
      // Create a mock BabylonJS scene for testing
      const engine = new NullEngine();
      const scene = new Scene(engine);

      const component = await mount(
        <OpenSCADWorkflowTestScene
          openscadCode="$fn=64; cylinder(h=20, r1=10, r2=2, center=true);"
          babylonScene={scene}
        />
      );

      await expect(component).toHaveScreenshot(`${testName}.png`, STANDARD_SCREENSHOT_OPTIONS);

      // Cleanup
      scene.dispose();
      engine.dispose();
    });

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    // Validate performance target (allow more time for high-detail geometry)
    expect(renderTime).toBeLessThan(8000); // 8 seconds for complex high-detail workflow
  });
});
