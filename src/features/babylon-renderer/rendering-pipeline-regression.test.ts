/**
 * @file Rendering Pipeline Integration Regression Tests
 *
 * Comprehensive regression tests for the complete rendering pipeline integration.
 * These tests verify the end-to-end fix for camera trails, mesh disposal, and scene refresh
 * working together in the complete OpenSCAD → AST → BabylonJS → Visual rendering pipeline.
 *
 * **Critical Integration Bugs Fixed**:
 * 1. Camera trails during movement (buffer clearing)
 * 2. Mesh persistence during shape changes (comprehensive disposal)
 * 3. Canvas not updating visually (scene refresh)
 * 4. Memory leaks during rapid changes (proper cleanup)
 *
 * @example
 * ```bash
 * # Run these integration regression tests
 * pnpm test rendering-pipeline-regression.test.ts
 * ```
 */

import * as BABYLON from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { performCompleteBufferClearing } from './utils/buffer-clearing/buffer-clearing';
import { disposeMeshesComprehensively } from './utils/mesh-disposal/mesh-disposal';
import { forceSceneRefresh } from './utils/scene-refresh/scene-refresh';

describe('Rendering Pipeline Integration Regression Tests', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let camera: BABYLON.ArcRotateCamera;

  beforeEach(() => {
    // Create real BabylonJS instances for integration testing
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

    // Add basic lighting
    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
  });

  afterEach(() => {
    // Clean up resources
    scene.dispose();
    engine.dispose();
  });

  describe('REGRESSION: Complete Shape Change Pipeline', () => {
    it('should handle cube to sphere transition with camera movement', () => {
      // REGRESSION TEST: This was the exact scenario that failed originally
      // User types "cube(15);" → moves camera → changes to "sphere(15);" → moves camera

      // Step 1: Create initial cube (simulating cube(15);)
      const cube = BABYLON.MeshBuilder.CreateBox('cube', { size: 15 }, scene);
      const cubeMaterial = new BABYLON.StandardMaterial('cubeMaterial', scene);
      cube.material = cubeMaterial;

      expect(scene.meshes.filter((m) => !m.name.includes('light')).length).toBe(1);

      // Step 2: Simulate camera movement (this caused trails before the fix)
      for (let i = 0; i < 5; i++) {
        camera.alpha = i * 0.2;
        camera.beta = Math.PI / 3 + i * 0.1;

        // Apply buffer clearing fix
        const clearResult = performCompleteBufferClearing(engine, scene);
        expect(clearResult.success).toBe(true);

        // Render frame
        scene.render();
      }

      // Step 3: Change shape (simulating sphere(15);)
      // Dispose existing meshes
      const disposalResult = disposeMeshesComprehensively(scene);
      expect(disposalResult.success).toBe(true);
      expect(disposalResult.data?.meshesDisposed).toBe(1);

      // Force scene refresh after disposal
      const refreshResult = forceSceneRefresh(engine, scene);
      // May succeed or fail gracefully in NullEngine
      if (!refreshResult.success) {
        expect(refreshResult.error?.message).toBeTruthy();
      }

      // Create new sphere
      const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 15 }, scene);
      const sphereMaterial = new BABYLON.StandardMaterial('sphereMaterial', scene);
      sphere.material = sphereMaterial;

      // Step 4: More camera movement (should not cause trails)
      for (let i = 0; i < 5; i++) {
        camera.alpha = Math.PI + i * 0.2;
        camera.beta = Math.PI / 4 + i * 0.1;

        // Apply buffer clearing fix
        const clearResult = performCompleteBufferClearing(engine, scene);
        expect(clearResult.success).toBe(true);

        // Render frame
        scene.render();
      }

      // Verify final state
      const userMeshes = scene.meshes.filter((m) => !m.name.includes('light'));
      expect(userMeshes.length).toBe(1);
      expect(userMeshes[0].name).toBe('sphere');
    });

    it('should handle rapid shape changes with continuous camera movement', () => {
      // REGRESSION TEST: Rapid changes + camera movement was especially problematic

      const shapes = [
        { type: 'cube', size: 10 },
        { type: 'sphere', diameter: 10 },
        { type: 'cylinder', height: 10, diameter: 8 },
        { type: 'torus', diameter: 10, thickness: 2 },
      ];

      for (let shapeIndex = 0; shapeIndex < shapes.length; shapeIndex++) {
        const shape = shapes[shapeIndex];

        // Create mesh based on shape type
        let mesh: BABYLON.Mesh;
        switch (shape.type) {
          case 'cube':
            mesh = BABYLON.MeshBuilder.CreateBox('cube', { size: shape.size }, scene);
            break;
          case 'sphere':
            mesh = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: shape.diameter }, scene);
            break;
          case 'cylinder':
            mesh = BABYLON.MeshBuilder.CreateCylinder(
              'cylinder',
              {
                height: shape.height,
                diameter: shape.diameter,
              },
              scene
            );
            break;
          default:
            mesh = BABYLON.MeshBuilder.CreateTorus(
              'torus',
              {
                diameter: shape.diameter,
                thickness: shape.thickness,
              },
              scene
            );
        }

        const material = new BABYLON.StandardMaterial(`${shape.type}Material`, scene);
        mesh.material = material;

        // Simulate camera movement while shape is visible
        for (let camMove = 0; camMove < 3; camMove++) {
          camera.alpha = (shapeIndex * Math.PI) / 2 + camMove * 0.3;
          camera.beta = Math.PI / 3 + camMove * 0.2;

          // Apply complete buffer clearing
          const clearResult = performCompleteBufferClearing(engine, scene);
          expect(clearResult.success).toBe(true);

          scene.render();
        }

        // Dispose current shape before next one (except last)
        if (shapeIndex < shapes.length - 1) {
          const disposalResult = disposeMeshesComprehensively(scene);
          expect(disposalResult.success).toBe(true);
          expect(disposalResult.data?.meshesDisposed).toBe(1);

          // Force scene refresh
          forceSceneRefresh(engine, scene);

          // Verify cleanup
          const userMeshes = scene.meshes.filter((m) => !m.name.includes('light'));
          expect(userMeshes.length).toBe(0);
        }
      }
    });
  });

  describe('REGRESSION: Performance Under Load', () => {
    it('should maintain performance during intensive shape/camera operations', () => {
      // REGRESSION TEST: Performance shouldn't degrade with the fixes

      const operationCount = 20;
      const startTime = performance.now();

      for (let i = 0; i < operationCount; i++) {
        // Create mesh
        const mesh = BABYLON.MeshBuilder.CreateBox(`box_${i}`, { size: 5 }, scene);
        const material = new BABYLON.StandardMaterial(`mat_${i}`, scene);
        mesh.material = material;

        // Camera movement with buffer clearing
        camera.alpha = i * 0.3;
        const clearResult = performCompleteBufferClearing(engine, scene);
        expect(clearResult.success).toBe(true);
        scene.render();

        // Dispose mesh
        const disposalResult = disposeMeshesComprehensively(scene);
        expect(disposalResult.success).toBe(true);

        // Scene refresh
        forceSceneRefresh(engine, scene);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTimePerOperation = totalTime / operationCount;

      // Performance regression test
      expect(averageTimePerOperation).toBeLessThan(50); // Less than 50ms per complete operation
    });

    it('should handle memory efficiently during extended operations', () => {
      // REGRESSION TEST: Memory usage should remain stable

      const extendedOperations = 100;
      let totalMeshesCreated = 0;
      let totalMeshesDisposed = 0;

      for (let i = 0; i < extendedOperations; i++) {
        // Create mesh
        const mesh = BABYLON.MeshBuilder.CreateSphere(`sphere_${i}`, { diameter: 3 }, scene);
        totalMeshesCreated++;

        // Brief camera movement
        camera.alpha = i * 0.1;
        performCompleteBufferClearing(engine, scene);
        scene.render();

        // Dispose every few iterations
        if (i % 5 === 4) {
          const disposalResult = disposeMeshesComprehensively(scene);
          if (disposalResult.success) {
            totalMeshesDisposed += disposalResult.data?.meshesDisposed || 0;
          }
          forceSceneRefresh(engine, scene);
        }
      }

      // Verify memory management
      expect(totalMeshesCreated).toBe(extendedOperations);
      expect(totalMeshesDisposed).toBeGreaterThan(0);

      // Final cleanup
      const finalDisposal = disposeMeshesComprehensively(scene);
      if (finalDisposal.success) {
        totalMeshesDisposed += finalDisposal.data?.meshesDisposed || 0;
      }

      // All created meshes should eventually be disposed
      expect(totalMeshesDisposed).toBe(totalMeshesCreated);
    });
  });

  describe('REGRESSION: Error Recovery and Stability', () => {
    it('should recover gracefully from disposal errors during pipeline', () => {
      // REGRESSION TEST: Pipeline should be resilient to individual failures

      // Create meshes with potential disposal issues
      const mesh1 = BABYLON.MeshBuilder.CreateBox('box1', { size: 5 }, scene);
      const mesh2 = BABYLON.MeshBuilder.CreateSphere('sphere1', { diameter: 5 }, scene);

      // Simulate camera movement
      camera.alpha = Math.PI / 4;
      const clearResult = performCompleteBufferClearing(engine, scene);
      expect(clearResult.success).toBe(true);

      // Attempt disposal (should handle any internal errors gracefully)
      const disposalResult = disposeMeshesComprehensively(scene);
      expect(disposalResult.success).toBe(true);

      // Scene refresh should continue working
      const refreshResult = forceSceneRefresh(engine, scene);
      // May succeed or fail gracefully
      if (!refreshResult.success) {
        expect(refreshResult.error?.message).toBeTruthy();
      }
    });

    it('should maintain pipeline integrity with invalid operations', () => {
      // REGRESSION TEST: Invalid operations shouldn't break the pipeline

      // Try operations with invalid inputs
      const invalidClearResult = performCompleteBufferClearing(null as any, scene);
      expect(invalidClearResult.success).toBe(false);

      const invalidDisposalResult = disposeMeshesComprehensively(null as any);
      expect(invalidDisposalResult.success).toBe(false);

      const invalidRefreshResult = forceSceneRefresh(engine, null as any);
      expect(invalidRefreshResult.success).toBe(false);

      // Valid operations should still work after invalid ones
      const mesh = BABYLON.MeshBuilder.CreateBox('validBox', { size: 5 }, scene);

      const validClearResult = performCompleteBufferClearing(engine, scene);
      expect(validClearResult.success).toBe(true);

      const validDisposalResult = disposeMeshesComprehensively(scene);
      expect(validDisposalResult.success).toBe(true);
    });
  });

  describe('REGRESSION: Real-World Usage Patterns', () => {
    it('should handle typical OpenSCAD editing workflow', () => {
      // REGRESSION TEST: Simulate real user editing workflow

      const editingSteps = [
        'cube(10);',
        'cube(15);', // Size change
        'sphere(15);', // Shape change
        'cylinder(h=15, r=7.5);', // Different shape
        'cube(20);', // Back to cube, different size
      ];

      for (let step = 0; step < editingSteps.length; step++) {
        const code = editingSteps[step];

        // Dispose previous mesh (except first step)
        if (step > 0) {
          const disposalResult = disposeMeshesComprehensively(scene);
          expect(disposalResult.success).toBe(true);
          forceSceneRefresh(engine, scene);
        }

        // Create new mesh based on code
        let mesh: BABYLON.Mesh;
        if (code.includes('cube')) {
          const size = parseInt(code.match(/\d+/)?.[0] || '10');
          mesh = BABYLON.MeshBuilder.CreateBox('cube', { size }, scene);
        } else if (code.includes('sphere')) {
          const diameter = parseInt(code.match(/\d+/)?.[0] || '10');
          mesh = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter }, scene);
        } else {
          // cylinder
          mesh = BABYLON.MeshBuilder.CreateCylinder(
            'cylinder',
            { height: 15, diameter: 15 },
            scene
          );
        }

        const material = new BABYLON.StandardMaterial(`material_${step}`, scene);
        mesh.material = material;

        // User examines the shape (camera movement)
        for (let view = 0; view < 3; view++) {
          camera.alpha = (view * Math.PI) / 3;
          camera.beta = Math.PI / 4 + view * 0.1;

          const clearResult = performCompleteBufferClearing(engine, scene);
          expect(clearResult.success).toBe(true);

          scene.render();
        }

        // Verify only one user mesh exists
        const userMeshes = scene.meshes.filter((m) => !m.name.includes('light'));
        expect(userMeshes.length).toBe(1);
      }
    });
  });
});
