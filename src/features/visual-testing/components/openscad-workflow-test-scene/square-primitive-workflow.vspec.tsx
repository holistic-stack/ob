/**
 * @file Square Primitive OpenSCAD Workflow Visual Regression Tests
 *
 * Simplified Playwright component tests for square primitive visual regression testing using
 * the complete OpenSCAD workflow: Code → AST → Manifold → BabylonJS → Screenshots.
 *
 * Tests 2D square shapes with:
 * - Top view only (optimal for 2D primitives)
 * - Blue shapes on white background
 * - Orientation gizmo visible
 * - 3D axis hidden
 * - Auto-centered camera
 * - Console and network logging
 *
 * @example
 * Visual tests validate:
 * - Square rendering with different parameters using real OpenSCAD code
 * - Single shape per test for clear visual validation
 * - Complete workflow from OpenSCAD code to 3D visualization
 */

import { Color3 } from '@babylonjs/core';
import { expect, test } from '@playwright/experimental-ct-react';
import {
  runBabylonVisualTest,
  STANDARD_SCREENSHOT_OPTIONS,
} from '../../utils/shared-test-setup/shared-test-setup';
import { OpenSCADWorkflowTestScene } from './openscad-workflow-test-scene';

test.describe('Square Primitive OpenSCAD Workflow Visual Regression', () => {
  test('square primitive - top view', async ({ mount, page }) => {
    const testName = 'square-workflow-top-view';

    await runBabylonVisualTest(page, testName, async () => {
      const component = await mount(
        <OpenSCADWorkflowTestScene
          openscadCode="square(size=10);"
          cameraAngle="top"
          showOrientationGizmo={true}
          show3DAxis={false}
          backgroundColor={new Color3(1.0, 1.0, 1.0)}
          autoCenterCamera={true}
          enableLogging={true}
        />
      );

      await expect(component).toHaveScreenshot(
        'square-workflow-top-view.png',
        STANDARD_SCREENSHOT_OPTIONS
      );
    });
  });
});
