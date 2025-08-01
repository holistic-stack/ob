/**
 * @file Polygon Primitive OpenSCAD Workflow Visual Regression Tests
 *
 * Simplified Playwright component tests for polygon primitive visual regression testing using
 * the complete OpenSCAD workflow: Code → AST → Manifold → BabylonJS → Screenshots.
 *
 * Tests 2D polygon shapes with:
 * - Top view only (optimal for 2D primitives)
 * - Blue shapes on white background
 * - Orientation gizmo visible
 * - 3D axis hidden
 * - Auto-centered camera
 * - Console and network logging
 *
 * @example
 * Visual tests validate:
 * - Polygon rendering with different parameters using real OpenSCAD code
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

test.describe('Polygon Primitive OpenSCAD Workflow Visual Regression', () => {
  test('polygon primitive - top view', async ({ mount, page }) => {
    const testName = 'polygon-workflow-top-view';

    await runBabylonVisualTest(page, testName, async () => {
      // Create a mock BabylonJS scene for testing
      const engine = new NullEngine();
      const scene = new Scene(engine);

      const component = await mount(
        <OpenSCADWorkflowTestScene
          openscadCode="polygon(points=[[0,0], [10,0], [5,8.66]]);"
          babylonScene={scene}
        />
      );

      await expect(component).toHaveScreenshot(
        'polygon-workflow-top-view.png',
        STANDARD_SCREENSHOT_OPTIONS
      );

      // Cleanup
      scene.dispose();
      engine.dispose();
    });
  });
});
