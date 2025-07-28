/**
 * @file Cylinder Primitive OpenSCAD Workflow Visual Regression Tests
 *
 * Playwright component tests for cylinder primitive visual regression testing using
 * the complete OpenSCAD workflow: Code → AST → Manifold → BabylonJS → Screenshots.
 *
 * Tests 3D cylinder shapes with:
 * - Multiple camera angles (top, side, back, front, isometric)
 * - Blue shapes on white background
 * - Orientation gizmo visible
 * - 3D axis hidden
 * - Auto-centered camera
 * - Console and network logging
 *
 * @example
 * Visual tests validate:
 * - Cylinder rendering with real OpenSCAD code
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

const CYLINDER_OPENSCAD_CODE = 'cylinder(r=5, h=10);';
const CAMERA_ANGLES = ['top', 'side', 'back', 'front', 'isometric'] as const;

test.describe('Cylinder Primitive OpenSCAD Workflow Visual Regression', () => {
  CAMERA_ANGLES.forEach((cameraAngle) => {
    test(`cylinder primitive - ${cameraAngle} view`, async ({ mount, page }) => {
      const testName = `cylinder-workflow-${cameraAngle}-view`;

      await runBabylonVisualTest(page, testName, async () => {
        const component = await mount(
          <OpenSCADWorkflowTestScene
            openscadCode={CYLINDER_OPENSCAD_CODE}
            cameraAngle={cameraAngle}
            showOrientationGizmo={true}
            show3DAxis={false}
            backgroundColor={new Color3(1.0, 1.0, 1.0)}
            autoCenterCamera={true}
            enableLogging={true}
          />
        );

        await expect(component).toHaveScreenshot(
          `cylinder-workflow-${cameraAngle}-view.png`,
          STANDARD_SCREENSHOT_OPTIONS
        );
      });
    });
  });
});
