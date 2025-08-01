/**
 * @file Circle Primitive OpenSCAD Workflow Visual Regression Tests
 *
 * Simplified Playwright component tests for circle primitive visual regression testing using
 * the complete OpenSCAD workflow: Code → AST → Manifold → BabylonJS → Screenshots.
 *
 * Tests 2D circle shapes with:
 * - Top view only (optimal for 2D primitives)
 * - Blue shapes on white background
 * - Orientation gizmo visible
 * - 3D axis hidden
 * - Auto-centered camera
 * - Console and network logging
 *
 * @example
 * Visual tests validate:
 * - Circle rendering with different parameters using real OpenSCAD code
 * - Single shape per test for clear visual validation
 * - Complete workflow from OpenSCAD code to 3D visualization
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { expect, test } from '@playwright/experimental-ct-react';
import {
  runBabylonVisualTest,
  STANDARD_SCREENSHOT_OPTIONS,
} from '../../utils/shared-test-setup/shared-test-setup';
import { OpenSCADWorkflowTestScene } from './openscad-workflow-test-scene';

test.describe('Circle Primitive OpenSCAD Workflow Visual Regression', () => {
  test('circle primitive - top view', async ({ mount, page }) => {
    const testName = 'circle-workflow-top-view';

    await runBabylonVisualTest(page, testName, async () => {
      // Create a mock BabylonJS scene for testing
      const engine = new NullEngine();
      const scene = new Scene(engine);

      const component = await mount(
        <OpenSCADWorkflowTestScene openscadCode="circle(r=10);" babylonScene={scene} />
      );

      await expect(component).toHaveScreenshot(
        'circle-workflow-top-view.png',
        STANDARD_SCREENSHOT_OPTIONS
      );

      // Cleanup
      scene.dispose();
      engine.dispose();
    });
  });

  test('circle with fn parameter - top view', async ({ mount, page }) => {
    const testName = 'circle-fn8-workflow-top-view';

    await runBabylonVisualTest(page, testName, async () => {
      // Create a mock BabylonJS scene for testing
      const engine = new NullEngine();
      const scene = new Scene(engine);

      const component = await mount(
        <OpenSCADWorkflowTestScene openscadCode="$fn=8; circle(r=10);" babylonScene={scene} />
      );

      await expect(component).toHaveScreenshot(
        'circle-fn8-workflow-top-view.png',
        STANDARD_SCREENSHOT_OPTIONS
      );

      // Cleanup
      scene.dispose();
      engine.dispose();
    });
  });
});
