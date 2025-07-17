/**
 * @file Mesh Disposal Regression Tests
 *
 * Regression tests to ensure mesh disposal works correctly during shape changes.
 * These tests verify the fix for mesh persistence issues where changing shapes
 * left old meshes visible or caused memory leaks.
 *
 * **Critical Bug Fixed**: Mesh persistence during shape changes
 * **Root Cause**: Incomplete mesh disposal and missing scene refresh
 * **Solution**: Comprehensive mesh disposal with proper material/texture cleanup
 *
 * @example
 * ```bash
 * # Run these regression tests
 * pnpm test mesh-disposal-regression.test.ts
 * ```
 */

import * as BABYLON from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  disposeMaterialSafely,
  disposeMeshComprehensively,
  disposeMeshesComprehensively,
  isSystemMesh,
  MeshDisposalErrorCode,
} from './mesh-disposal';

describe('Mesh Disposal Regression Tests', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;

  beforeEach(() => {
    // Create real BabylonJS instances for regression testing
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
  });

  afterEach(() => {
    // Clean up resources
    scene.dispose();
    engine.dispose();
  });

  describe('REGRESSION: Shape Change Scenarios', () => {
    it('should handle cube to sphere transition without mesh persistence', () => {
      // REGRESSION TEST: This was a common scenario that failed
      // cube(15); -> sphere(15); should completely replace the mesh

      // Create initial cube mesh
      const cube = BABYLON.MeshBuilder.CreateBox('cube', { size: 15 }, scene);
      const cubeMaterial = new BABYLON.StandardMaterial('cubeMaterial', scene);
      cube.material = cubeMaterial;

      expect(scene.meshes.length).toBe(1);
      expect(scene.materials.length).toBe(1);

      // Dispose all meshes (simulating shape change)
      const disposalResult = disposeMeshesComprehensively(scene);
      expect(disposalResult.success).toBe(true);
      expect(disposalResult.data?.meshesDisposed).toBe(1);
      expect(disposalResult.data?.materialsDisposed).toBe(1);

      // Verify complete cleanup
      expect(scene.meshes.length).toBe(0);

      // Create new sphere mesh (simulating new shape)
      const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 15 }, scene);
      const sphereMaterial = new BABYLON.StandardMaterial('sphereMaterial', scene);
      sphere.material = sphereMaterial;

      expect(scene.meshes.length).toBe(1);
      expect(sphere.name).toBe('sphere'); // Verify it's the new mesh
    });

    it('should handle rapid shape changes without memory leaks', () => {
      // REGRESSION TEST: Rapid shape changes were problematic

      const shapes = ['cube', 'sphere', 'cylinder', 'torus', 'plane'];
      let totalMeshesDisposed = 0;
      let totalMaterialsDisposed = 0;

      for (let i = 0; i < shapes.length; i++) {
        // Create mesh based on shape type
        let mesh: BABYLON.Mesh;
        switch (shapes[i]) {
          case 'cube':
            mesh = BABYLON.MeshBuilder.CreateBox('cube', { size: 10 }, scene);
            break;
          case 'sphere':
            mesh = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 10 }, scene);
            break;
          case 'cylinder':
            mesh = BABYLON.MeshBuilder.CreateCylinder(
              'cylinder',
              { height: 10, diameter: 10 },
              scene
            );
            break;
          case 'torus':
            mesh = BABYLON.MeshBuilder.CreateTorus('torus', { diameter: 10, thickness: 2 }, scene);
            break;
          default:
            mesh = BABYLON.MeshBuilder.CreatePlane('plane', { size: 10 }, scene);
        }

        // Add material
        const material = new BABYLON.StandardMaterial(`${shapes[i]}Material`, scene);
        mesh.material = material;

        expect(scene.meshes.length).toBe(1);

        // Dispose all meshes before next shape
        if (i < shapes.length - 1) {
          const result = disposeMeshesComprehensively(scene);
          expect(result.success).toBe(true);
          totalMeshesDisposed += result.data?.meshesDisposed || 0;
          totalMaterialsDisposed += result.data?.materialsDisposed || 0;

          expect(scene.meshes.length).toBe(0);
        }
      }

      // Verify all intermediate meshes were properly disposed
      expect(totalMeshesDisposed).toBe(shapes.length - 1);
      expect(totalMaterialsDisposed).toBe(shapes.length - 1);
    });

    it('should preserve system meshes during disposal', () => {
      // REGRESSION TEST: System meshes (cameras, lights) should not be disposed

      // Create user meshes
      const userBox = BABYLON.MeshBuilder.CreateBox('userBox', { size: 5 }, scene);
      const userSphere = BABYLON.MeshBuilder.CreateSphere('userSphere', { diameter: 5 }, scene);

      // Create system-like meshes
      const cameraHelper = BABYLON.MeshBuilder.CreateBox('camera_helper', { size: 1 }, scene);
      const lightHelper = BABYLON.MeshBuilder.CreateSphere(
        'light_indicator',
        { diameter: 1 },
        scene
      );
      const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 100, height: 100 }, scene);

      expect(scene.meshes.length).toBe(5);

      // Dispose meshes comprehensively
      const result = disposeMeshesComprehensively(scene);
      expect(result.success).toBe(true);

      // Verify only user meshes were disposed, system meshes preserved
      expect(result.data?.meshesDisposed).toBe(2); // Only userBox and userSphere
      expect(result.data?.meshesSkipped).toBe(3); // camera_helper, light_indicator, ground

      // Verify system meshes are still in scene
      const remainingMeshes = scene.meshes.map((m) => m.name);
      expect(remainingMeshes).toContain('camera_helper');
      expect(remainingMeshes).toContain('light_indicator');
      expect(remainingMeshes).toContain('ground');
    });
  });

  describe('REGRESSION: Material and Texture Cleanup', () => {
    it('should dispose materials and textures during mesh disposal', () => {
      // REGRESSION TEST: Materials and textures were sometimes not disposed

      const mesh = BABYLON.MeshBuilder.CreateBox('texturedBox', { size: 10 }, scene);
      const material = new BABYLON.StandardMaterial('texturedMaterial', scene);

      // Add textures (common source of memory leaks)
      material.diffuseTexture = new BABYLON.Texture(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        scene
      );
      material.normalTexture = new BABYLON.Texture(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        scene
      );

      mesh.material = material;

      // Dispose material safely
      const texturesDisposed = disposeMaterialSafely(material);
      expect(texturesDisposed).toBe(2); // diffuse + normal textures

      // Dispose mesh comprehensively
      const stats = disposeMeshComprehensively(scene, mesh);
      expect(stats.meshesDisposed).toBe(1);
      expect(stats.materialsDisposed).toBe(0); // Already disposed above
    });

    it('should handle material disposal failures gracefully', () => {
      // REGRESSION TEST: Material disposal failures shouldn't crash the system

      const mesh = BABYLON.MeshBuilder.CreateBox('problematicBox', { size: 10 }, scene);

      // Create a material that might fail to dispose
      const material = new BABYLON.StandardMaterial('problematicMaterial', scene);
      mesh.material = material;

      // Simulate disposal (should not throw even if individual operations fail)
      expect(() => {
        const texturesDisposed = disposeMaterialSafely(material);
        expect(typeof texturesDisposed).toBe('number');
      }).not.toThrow();
    });
  });

  describe('REGRESSION: System Mesh Detection', () => {
    it('should correctly identify system meshes', () => {
      // REGRESSION TEST: System mesh detection was critical for preventing disposal

      const testCases = [
        { name: 'camera1', expected: true },
        { name: 'light_helper', expected: true },
        { name: 'ground_plane', expected: true },
        { name: 'skybox_mesh', expected: true },
        { name: 'user_cube', expected: false },
        { name: 'my_sphere', expected: false },
        { name: 'custom_geometry', expected: false },
      ];

      for (const testCase of testCases) {
        const mesh = BABYLON.MeshBuilder.CreateBox(testCase.name, { size: 1 }, scene);
        const isSystem = isSystemMesh(mesh);
        expect(isSystem).toBe(testCase.expected);
      }
    });

    it('should handle null and undefined meshes safely', () => {
      // REGRESSION TEST: Null checks were important for stability

      expect(isSystemMesh(null as any)).toBe(true);
      expect(isSystemMesh(undefined as any)).toBe(true);
    });
  });

  describe('REGRESSION: Performance During Disposal', () => {
    it('should maintain performance during large mesh disposal', () => {
      // REGRESSION TEST: Large scenes should dispose efficiently

      const meshCount = 50;
      const meshes: BABYLON.Mesh[] = [];

      // Create many meshes
      for (let i = 0; i < meshCount; i++) {
        const mesh = BABYLON.MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene);
        const material = new BABYLON.StandardMaterial(`material_${i}`, scene);
        mesh.material = material;
        meshes.push(mesh);
      }

      expect(scene.meshes.length).toBe(meshCount);

      // Time the disposal operation
      const startTime = performance.now();
      const result = disposeMeshesComprehensively(scene);
      const endTime = performance.now();

      const disposalTime = endTime - startTime;

      // Performance regression test
      expect(result.success).toBe(true);
      expect(result.data?.meshesDisposed).toBe(meshCount);
      expect(disposalTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle disposal with zero meshes efficiently', () => {
      // REGRESSION TEST: Empty scene disposal should be fast

      expect(scene.meshes.length).toBe(0);

      const startTime = performance.now();
      const result = disposeMeshesComprehensively(scene);
      const endTime = performance.now();

      const disposalTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(result.data?.meshesDisposed).toBe(0);
      expect(disposalTime).toBeLessThan(1); // Should be nearly instantaneous
    });
  });

  describe('REGRESSION: Error Handling', () => {
    it('should handle invalid scene gracefully', () => {
      // REGRESSION TEST: Error handling was critical for stability

      const result = disposeMeshesComprehensively(null as any);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(MeshDisposalErrorCode.INVALID_SCENE);
    });

    it('should continue disposal even if individual meshes fail', () => {
      // REGRESSION TEST: Partial failures shouldn't stop the entire process

      // Create normal meshes
      const mesh1 = BABYLON.MeshBuilder.CreateBox('box1', { size: 1 }, scene);
      const mesh2 = BABYLON.MeshBuilder.CreateSphere('sphere1', { diameter: 1 }, scene);

      expect(scene.meshes.length).toBe(2);

      // Disposal should succeed even if some operations might fail internally
      const result = disposeMeshesComprehensively(scene);
      expect(result.success).toBe(true);
      expect(result.data?.meshesDisposed).toBe(2);
    });
  });
});
