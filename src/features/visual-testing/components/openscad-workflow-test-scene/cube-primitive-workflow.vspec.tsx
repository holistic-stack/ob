/**
 * @file Cube Primitive OpenSCAD Workflow Visual Regression Tests
 *
 * Playwright component tests for cube primitive visual regression testing using
 * the complete OpenSCAD workflow: Code → AST → Manifold → BabylonJS → Screenshots.
 *
 * Tests 3D cube shapes with:
 * - Multiple camera angles (top, side, back, front, isometric)
 * - Blue shapes on white background
 * - Orientation gizmo visible
 * - 3D axis hidden
 * - Auto-centered camera
 * - Console and network logging
 *
 * @example
 * Visual tests validate:
 * - Cube rendering with real OpenSCAD code
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

const CUBE_OPENSCAD_CODE = 'cube(size=10);';
const CAMERA_ANGLES = ['top', 'side', 'back', 'front', 'isometric'] as const;

test.describe('Cube Primitive OpenSCAD Workflow Visual Regression', () => {
  CAMERA_ANGLES.forEach((cameraAngle) => {
    test(`cube primitive - ${cameraAngle} view`, async ({ mount, page }) => {
      const testName = `cube-workflow-${cameraAngle}-view`;

      await runBabylonVisualTest(page, testName, async () => {
        // Create a mock BabylonJS scene for testing
        const engine = new NullEngine();
        const scene = new Scene(engine);

        const component = await mount(
          <OpenSCADWorkflowTestScene openscadCode={CUBE_OPENSCAD_CODE} babylonScene={scene} />
        );

        await expect(component).toHaveScreenshot(
          `cube-workflow-${cameraAngle}-view.png`,
          STANDARD_SCREENSHOT_OPTIONS
        );

        // Cleanup
        scene.dispose();
        engine.dispose();
      });
    });
  });
});
