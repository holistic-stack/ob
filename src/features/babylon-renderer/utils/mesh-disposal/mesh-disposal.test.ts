/**
 * @file Mesh Disposal Utilities Tests
 *
 * Tests for BabylonJS mesh disposal utilities using real BabylonJS instances.
 * Uses NullEngine for headless testing without mocks.
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

describe('Mesh Disposal Utilities', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;

  beforeEach(() => {
    // Create real BabylonJS instances for testing
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
  });

  afterEach(() => {
    // Clean up resources
    scene.dispose();
    engine.dispose();
  });

  describe('isSystemMesh', () => {
    it('should identify camera meshes as system meshes', () => {
      const camera = new BABYLON.ArcRotateCamera(
        'camera1',
        0,
        0,
        10,
        BABYLON.Vector3.Zero(),
        scene
      );

      expect(isSystemMesh(camera as any)).toBe(true);
    });

    it('should identify light meshes as system meshes', () => {
      const mesh = BABYLON.MeshBuilder.CreateBox('lightHelper', { size: 1 }, scene);
      mesh.name = 'light_helper';

      expect(isSystemMesh(mesh)).toBe(true);
    });

    it('should identify ground meshes as system meshes', () => {
      const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, scene);

      expect(isSystemMesh(ground)).toBe(true);
    });

    it('should not identify regular meshes as system meshes', () => {
      const box = BABYLON.MeshBuilder.CreateBox('regularBox', { size: 1 }, scene);

      expect(isSystemMesh(box)).toBe(false);
    });

    it('should handle null/undefined meshes safely', () => {
      expect(isSystemMesh(null as any)).toBe(true);
      expect(isSystemMesh(undefined as any)).toBe(true);
    });
  });

  describe('disposeMaterialSafely', () => {
    it('should dispose material without textures', () => {
      const material = new BABYLON.StandardMaterial('testMaterial', scene);

      const texturesDisposed = disposeMaterialSafely(material);

      expect(texturesDisposed).toBe(0);
    });

    it('should dispose material with diffuse texture', () => {
      const material = new BABYLON.StandardMaterial('testMaterial', scene);
      material.diffuseTexture = new BABYLON.Texture(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        scene
      );

      const texturesDisposed = disposeMaterialSafely(material);

      expect(texturesDisposed).toBe(1);
    });

    it('should handle null material safely', () => {
      const texturesDisposed = disposeMaterialSafely(null as any);

      expect(texturesDisposed).toBe(0);
    });

    it('should continue disposal even if texture disposal fails', () => {
      const material = new BABYLON.StandardMaterial('testMaterial', scene);
      // Create a texture that might fail to dispose
      material.diffuseTexture = new BABYLON.Texture('invalid-url', scene);

      // Should not throw and should return some count
      expect(() => disposeMaterialSafely(material)).not.toThrow();
    });
  });

  describe('disposeMeshComprehensively', () => {
    it('should dispose mesh without material', () => {
      const box = BABYLON.MeshBuilder.CreateBox('testBox', { size: 1 }, scene);

      const stats = disposeMeshComprehensively(scene, box);

      expect(stats.meshesDisposed).toBe(1);
      expect(stats.materialsDisposed).toBe(0);
      expect(stats.texturesDisposed).toBe(0);
    });

    it('should dispose mesh with material', () => {
      const box = BABYLON.MeshBuilder.CreateBox('testBox', { size: 1 }, scene);
      box.material = new BABYLON.StandardMaterial('testMaterial', scene);

      const stats = disposeMeshComprehensively(scene, box);

      expect(stats.meshesDisposed).toBe(1);
      expect(stats.materialsDisposed).toBe(1);
      expect(stats.texturesDisposed).toBe(0);
    });

    it('should handle null mesh safely', () => {
      const stats = disposeMeshComprehensively(scene, null as any);

      expect(stats.meshesDisposed).toBe(0);
      expect(stats.materialsDisposed).toBe(0);
      expect(stats.texturesDisposed).toBe(0);
    });

    it('should handle null scene safely', () => {
      const box = BABYLON.MeshBuilder.CreateBox('testBox', { size: 1 }, scene);

      const stats = disposeMeshComprehensively(null as any, box);

      expect(stats.meshesDisposed).toBe(0);
      expect(stats.materialsDisposed).toBe(0);
      expect(stats.texturesDisposed).toBe(0);
    });
  });

  describe('disposeMeshesComprehensively', () => {
    it('should dispose all non-system meshes', () => {
      // Create regular meshes
      const box1 = BABYLON.MeshBuilder.CreateBox('box1', { size: 1 }, scene);
      const box2 = BABYLON.MeshBuilder.CreateBox('box2', { size: 1 }, scene);

      // Create system mesh
      const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, scene);

      const result = disposeMeshesComprehensively(scene);

      expect(result.success).toBe(true);
      expect(result.data?.meshesDisposed).toBe(2); // Only the boxes
      expect(result.data?.meshesSkipped).toBe(1); // The ground
    });

    it('should handle empty scene', () => {
      const result = disposeMeshesComprehensively(scene);

      expect(result.success).toBe(true);
      expect(result.data?.meshesDisposed).toBe(0);
      expect(result.data?.materialsDisposed).toBe(0);
      expect(result.data?.texturesDisposed).toBe(0);
      expect(result.data?.meshesSkipped).toBe(0);
    });

    it('should return error for null scene', () => {
      const result = disposeMeshesComprehensively(null as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(MeshDisposalErrorCode.INVALID_SCENE);
      expect(result.error?.message).toContain('Invalid or missing BabylonJS scene');
    });

    it('should dispose meshes with materials and textures', () => {
      const box = BABYLON.MeshBuilder.CreateBox('testBox', { size: 1 }, scene);
      const material = new BABYLON.StandardMaterial('testMaterial', scene);
      material.diffuseTexture = new BABYLON.Texture(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        scene
      );
      box.material = material;

      const result = disposeMeshesComprehensively(scene);

      expect(result.success).toBe(true);
      expect(result.data?.meshesDisposed).toBe(1);
      expect(result.data?.materialsDisposed).toBe(1);
      expect(result.data?.texturesDisposed).toBe(1);
    });
  });

  describe('Error handling', () => {
    it('should include timestamp in error objects', () => {
      const result = disposeMeshesComprehensively(null as any);

      expect(result.success).toBe(false);
      expect(result.error?.timestamp).toBeInstanceOf(Date);
    });

    it('should provide meaningful error messages', () => {
      const result = disposeMeshesComprehensively(null as any);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBeTruthy();
      expect(result.error?.message.length).toBeGreaterThan(0);
    });
  });
});
