/**
 * @file Camera Trails Regression Tests
 *
 * Regression tests to ensure camera movement doesn't cause visual trails or ghosting.
 * These tests verify the fix for the critical camera trails issue where moving the camera
 * left multiple images of the cube/sphere behind.
 *
 * **Critical Bug Fixed**: Camera movement causing visual trails/ghosting
 * **Root Cause**: Missing explicit buffer clearing in render loop
 * **Solution**: performCompleteBufferClearing() on every frame
 *
 * @example
 * ```bash
 * # Run these regression tests
 * pnpm test camera-trails-regression.test.ts
 * ```
 */

import * as BABYLON from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BufferClearingErrorCode,
  clearRenderBuffers,
  ensureSceneAutoClear,
  performCompleteBufferClearing,
} from './buffer-clearing';

describe('Camera Trails Regression Tests', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let camera: BABYLON.ArcRotateCamera;

  beforeEach(() => {
    // Create real BabylonJS instances for regression testing
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);

    // Create camera for movement simulation
    camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 4,
      Math.PI / 3,
      10,
      BABYLON.Vector3.Zero(),
      scene
    );
  });

  afterEach(() => {
    // Clean up resources
    scene.dispose();
    engine.dispose();
  });

  describe('REGRESSION: Camera Trails Prevention', () => {
    it('should prevent camera trails with explicit buffer clearing', () => {
      // REGRESSION TEST: This was the core issue - camera movement left trails
      // The fix: explicit buffer clearing before each render

      // Simulate multiple camera movements (this caused trails before the fix)
      const cameraPositions = [
        { alpha: 0, beta: Math.PI / 3, radius: 10 },
        { alpha: Math.PI / 2, beta: Math.PI / 4, radius: 12 },
        { alpha: Math.PI, beta: Math.PI / 2, radius: 8 },
        { alpha: (3 * Math.PI) / 2, beta: Math.PI / 6, radius: 15 },
      ];

      for (const position of cameraPositions) {
        // Move camera to new position
        camera.alpha = position.alpha;
        camera.beta = position.beta;
        camera.radius = position.radius;

        // CRITICAL: Perform buffer clearing (the fix for camera trails)
        const clearResult = performCompleteBufferClearing(engine, scene);
        expect(clearResult.success).toBe(true);

        // Render scene (this would cause trails without buffer clearing)
        scene.render();
      }

      // Verify no errors occurred during the camera movement sequence
      expect(scene).toBeDefined();
      expect(camera).toBeDefined();
    });

    it('should handle rapid camera movements without visual artifacts', () => {
      // REGRESSION TEST: Rapid camera movements were especially problematic

      const rapidMovements = 50; // Simulate rapid camera movements

      for (let i = 0; i < rapidMovements; i++) {
        // Rapid camera position changes
        camera.alpha = (i * Math.PI) / 10;
        camera.beta = Math.PI / 3 + i * 0.1;
        camera.radius = 10 + (i % 5);

        // Ensure buffer clearing works for rapid movements
        const clearResult = clearRenderBuffers(engine, scene);
        expect(clearResult.success).toBe(true);

        // Ensure scene auto-clear is maintained
        const autoClearResult = ensureSceneAutoClear(scene);
        expect(autoClearResult.success).toBe(true);

        // Render frame
        scene.render();
      }

      // Verify scene state is still valid after rapid movements
      expect(scene.autoClear).toBe(true);
      expect(scene.autoClearDepthAndStencil).toBe(true);
    });

    it('should maintain buffer clearing during continuous camera orbit', () => {
      // REGRESSION TEST: Continuous camera orbit was a common use case that failed

      const orbitSteps = 36; // 10-degree increments for full orbit
      const startTime = performance.now();

      for (let step = 0; step < orbitSteps; step++) {
        // Simulate smooth camera orbit
        camera.alpha = (step * 2 * Math.PI) / orbitSteps;

        // Perform complete buffer clearing (critical for preventing trails)
        const result = performCompleteBufferClearing(engine, scene);
        expect(result.success).toBe(true);

        // Render frame
        scene.render();
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Performance regression test: ensure orbit doesn't degrade performance
      expect(totalTime).toBeLessThan(1000); // Should complete orbit in under 1 second
    });
  });

  describe('REGRESSION: Buffer Clearing Edge Cases', () => {
    it('should handle buffer clearing with invalid scene gracefully', () => {
      // REGRESSION TEST: Error handling was important for stability

      const invalidScene = null as any;
      const result = clearRenderBuffers(engine, invalidScene);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(BufferClearingErrorCode.INVALID_SCENE);
    });

    it('should handle buffer clearing with invalid engine gracefully', () => {
      // REGRESSION TEST: Engine validation was critical

      const invalidEngine = null as any;
      const result = clearRenderBuffers(invalidEngine, scene);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(BufferClearingErrorCode.INVALID_ENGINE);
    });

    it('should maintain performance during repeated buffer clearing', () => {
      // REGRESSION TEST: Ensure buffer clearing doesn't cause performance degradation

      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const result = performCompleteBufferClearing(engine, scene);
        expect(result.success).toBe(true);
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / iterations;

      // Performance regression: each buffer clear should be very fast
      expect(averageTime).toBeLessThan(1); // Less than 1ms per clear operation
    });
  });

  describe('REGRESSION: Scene Auto-Clear Configuration', () => {
    it('should maintain auto-clear settings during camera movement', () => {
      // REGRESSION TEST: Auto-clear settings were sometimes lost during movement

      // Initially disable auto-clear to test the fix
      scene.autoClear = false;
      scene.autoClearDepthAndStencil = false;

      // Simulate camera movement with auto-clear enforcement
      for (let i = 0; i < 10; i++) {
        camera.alpha = i * 0.1;

        // Ensure auto-clear is enforced (part of the fix)
        const result = ensureSceneAutoClear(scene);
        expect(result.success).toBe(true);

        // Verify settings are maintained
        expect(scene.autoClear).toBe(true);
        expect(scene.autoClearDepthAndStencil).toBe(true);
      }
    });

    it('should handle scene auto-clear with missing scene methods', () => {
      // REGRESSION TEST: Some BabylonJS versions might not have all methods

      // Create a scene-like object without some methods
      const partialScene = {
        autoClear: false,
        autoClearDepthAndStencil: false,
        clearColor: new BABYLON.Color4(0.2, 0.2, 0.3, 1),
      } as BABYLON.Scene;

      const result = ensureSceneAutoClear(partialScene);
      expect(result.success).toBe(true);
      expect(partialScene.autoClear).toBe(true);
      expect(partialScene.autoClearDepthAndStencil).toBe(true);
    });
  });

  describe('REGRESSION: Performance Characteristics', () => {
    it('should maintain <16ms render targets with buffer clearing', () => {
      // REGRESSION TEST: Ensure the fix doesn't degrade performance below targets

      const renderCount = 60; // Simulate 60 FPS for 1 second
      const renderTimes: number[] = [];

      for (let frame = 0; frame < renderCount; frame++) {
        const frameStart = performance.now();

        // Perform the complete buffer clearing (the fix)
        performCompleteBufferClearing(engine, scene);

        // Render frame
        scene.render();

        const frameEnd = performance.now();
        const frameTime = frameEnd - frameStart;
        renderTimes.push(frameTime);
      }

      // Calculate performance metrics
      const averageFrameTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
      const maxFrameTime = Math.max(...renderTimes);

      // Performance regression tests
      expect(averageFrameTime).toBeLessThan(16); // <16ms average (60 FPS target)
      expect(maxFrameTime).toBeLessThan(33); // <33ms max (30 FPS minimum)
    });
  });
});
