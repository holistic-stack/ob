/**
 * @file BabylonJS Integration Tests
 *
 * Comprehensive integration tests for BabylonJS renderer using real NullEngine.
 * Tests core functionality without mocks following TDD principles.
 */

import * as BABYLON from '@babylonjs/core';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { BabylonEngineService } from '@/features/babylon-renderer';
import { createLogger } from '@/shared';

const logger = createLogger('BabylonIntegrationTest');

describe('BabylonJS Integration Tests', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let engineService: BabylonEngineService;

  beforeAll(async () => {
    logger.debug('[DEBUG][BabylonIntegrationTest] Setting up BabylonJS integration tests...');
  });

  beforeEach(async () => {
    // Create a null engine (headless) for testing
    engine = new BABYLON.NullEngine({
      renderWidth: 800,
      renderHeight: 600,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1,
    });

    // Create a real scene
    scene = new BABYLON.Scene(engine);

    // Create engine service
    engineService = new BabylonEngineService();

    logger.debug('[DEBUG][BabylonIntegrationTest] Test environment initialized');
  });

  afterEach(() => {
    // Clean up after each test
    if (scene) {
      scene.dispose();
    }
    if (engine) {
      engine.dispose();
    }
    if (engineService) {
      // Note: engineService.dispose() might not exist yet
    }
    logger.debug('[DEBUG][BabylonIntegrationTest] Test environment cleaned up');
  });

  describe('Engine Service Integration', () => {
    it('should create engine service successfully', () => {
      expect(engineService).toBeDefined();
      expect(engineService).toBeInstanceOf(BabylonEngineService);
    });

    it('should have proper service methods', () => {
      // Test that the service has the expected methods
      expect(typeof engineService.getState).toBe('function');

      // Note: Other methods might not be implemented yet
      // This test verifies the basic service structure
    });
  });

  describe('BabylonJS Core Functionality', () => {
    it('should create NullEngine successfully', () => {
      expect(engine).toBeDefined();
      expect(engine).toBeInstanceOf(BABYLON.NullEngine);
      expect(engine.getRenderWidth()).toBe(800);
      expect(engine.getRenderHeight()).toBe(600);
    });

    it('should create Scene successfully', () => {
      expect(scene).toBeDefined();
      expect(scene).toBeInstanceOf(BABYLON.Scene);
      expect(scene.getEngine()).toBe(engine);
    });

    it('should create basic meshes', () => {
      // Test basic mesh creation
      const box = BABYLON.MeshBuilder.CreateBox('testBox', { size: 2 }, scene);
      expect(box).toBeDefined();
      expect(box.name).toBe('testBox');
      expect(scene.meshes).toContain(box);

      const sphere = BABYLON.MeshBuilder.CreateSphere('testSphere', { diameter: 2 }, scene);
      expect(sphere).toBeDefined();
      expect(sphere.name).toBe('testSphere');
      expect(scene.meshes).toContain(sphere);

      const cylinder = BABYLON.MeshBuilder.CreateCylinder(
        'testCylinder',
        { height: 3, diameter: 2 },
        scene
      );
      expect(cylinder).toBeDefined();
      expect(cylinder.name).toBe('testCylinder');
      expect(scene.meshes).toContain(cylinder);
    });

    it('should handle basic transformations', () => {
      const box = BABYLON.MeshBuilder.CreateBox('transformBox', { size: 1 }, scene);

      // Test position
      box.position.x = 5;
      box.position.y = 3;
      box.position.z = -2;
      expect(box.position.x).toBe(5);
      expect(box.position.y).toBe(3);
      expect(box.position.z).toBe(-2);

      // Test rotation
      box.rotation.x = Math.PI / 4;
      box.rotation.y = Math.PI / 2;
      expect(box.rotation.x).toBeCloseTo(Math.PI / 4);
      expect(box.rotation.y).toBeCloseTo(Math.PI / 2);

      // Test scaling
      box.scaling.x = 2;
      box.scaling.y = 0.5;
      box.scaling.z = 1.5;
      expect(box.scaling.x).toBe(2);
      expect(box.scaling.y).toBe(0.5);
      expect(box.scaling.z).toBe(1.5);
    });

    it('should handle materials', () => {
      const box = BABYLON.MeshBuilder.CreateBox('materialBox', { size: 1 }, scene);

      // Create a standard material
      const material = new BABYLON.StandardMaterial('testMaterial', scene);
      material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red

      // Apply material to mesh
      box.material = material;

      expect(box.material).toBe(material);
      expect(material.diffuseColor.r).toBe(1);
      expect(material.diffuseColor.g).toBe(0);
      expect(material.diffuseColor.b).toBe(0);
    });

    it('should handle lighting', () => {
      // Create directional light
      const light = new BABYLON.DirectionalLight(
        'testLight',
        new BABYLON.Vector3(-1, -1, -1),
        scene
      );
      light.intensity = 1.0;

      expect(light).toBeDefined();
      expect(light.intensity).toBe(1.0);
      expect(scene.lights).toContain(light);
    });

    it('should handle cameras', () => {
      // Create arc rotate camera
      const camera = new BABYLON.ArcRotateCamera(
        'testCamera',
        -Math.PI / 2,
        Math.PI / 2.5,
        10,
        BABYLON.Vector3.Zero(),
        scene
      );

      expect(camera).toBeDefined();
      expect(camera.alpha).toBeCloseTo(-Math.PI / 2);
      expect(camera.beta).toBeCloseTo(Math.PI / 2.5);
      expect(camera.radius).toBe(10);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle multiple mesh creation and disposal', () => {
      const meshes: BABYLON.Mesh[] = [];

      // Create multiple meshes
      for (let i = 0; i < 100; i++) {
        const mesh = BABYLON.MeshBuilder.CreateBox(`box${i}`, { size: 1 }, scene);
        meshes.push(mesh);
      }

      expect(scene.meshes.length).toBeGreaterThanOrEqual(100);

      // Dispose all meshes
      meshes.forEach((mesh) => mesh.dispose());

      // Note: Scene might still have references, but meshes should be disposed
      meshes.forEach((mesh) => {
        expect(mesh.isDisposed()).toBe(true);
      });
    });

    it('should handle render loop without errors', () => {
      // Create a simple scene
      const _box = BABYLON.MeshBuilder.CreateBox('renderBox', { size: 1 }, scene);
      const _light = new BABYLON.DirectionalLight(
        'renderLight',
        new BABYLON.Vector3(-1, -1, -1),
        scene
      );

      // Create a camera (required for rendering)
      const _camera = new BABYLON.ArcRotateCamera(
        'renderCamera',
        -Math.PI / 2,
        Math.PI / 2.5,
        10,
        BABYLON.Vector3.Zero(),
        scene
      );

      // Test that render doesn't throw errors
      expect(() => {
        scene.render();
      }).not.toThrow();

      // Test multiple renders
      for (let i = 0; i < 10; i++) {
        expect(() => {
          scene.render();
        }).not.toThrow();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid mesh creation gracefully', () => {
      // Test with invalid parameters
      expect(() => {
        BABYLON.MeshBuilder.CreateBox('invalidBox', { size: -1 }, scene);
      }).not.toThrow(); // BabylonJS should handle this gracefully
    });

    it('should handle scene disposal', () => {
      const _box = BABYLON.MeshBuilder.CreateBox('disposeBox', { size: 1 }, scene);

      expect(() => {
        scene.dispose();
      }).not.toThrow();

      expect(scene.isDisposed).toBe(true);
    });

    it('should handle engine disposal', () => {
      expect(() => {
        engine.dispose();
      }).not.toThrow();

      // Create new engine for cleanup
      engine = new BABYLON.NullEngine({
        renderWidth: 800,
        renderHeight: 600,
        textureSize: 512,
        deterministicLockstep: false,
        lockstepMaxSteps: 1,
      });
      scene = new BABYLON.Scene(engine);
    });
  });

  describe('OpenSCAD Integration Readiness', () => {
    it('should support basic OpenSCAD primitives', () => {
      // Test cube (OpenSCAD cube)
      const cube = BABYLON.MeshBuilder.CreateBox(
        'openscadCube',
        {
          width: 2,
          height: 2,
          depth: 2,
        },
        scene
      );
      expect(cube).toBeDefined();

      // Test sphere (OpenSCAD sphere)
      const sphere = BABYLON.MeshBuilder.CreateSphere(
        'openscadSphere',
        {
          diameter: 2,
          segments: 16,
        },
        scene
      );
      expect(sphere).toBeDefined();

      // Test cylinder (OpenSCAD cylinder)
      const cylinder = BABYLON.MeshBuilder.CreateCylinder(
        'openscadCylinder',
        {
          height: 3,
          diameter: 2,
          tessellation: 16,
        },
        scene
      );
      expect(cylinder).toBeDefined();
    });

    it('should support transformations for OpenSCAD operations', () => {
      const cube = BABYLON.MeshBuilder.CreateBox('transformCube', { size: 1 }, scene);

      // Test translate (OpenSCAD translate)
      cube.position = new BABYLON.Vector3(5, 3, -2);
      expect(cube.position.x).toBe(5);
      expect(cube.position.y).toBe(3);
      expect(cube.position.z).toBe(-2);

      // Test rotate (OpenSCAD rotate)
      cube.rotation = new BABYLON.Vector3(Math.PI / 4, Math.PI / 2, 0);
      expect(cube.rotation.x).toBeCloseTo(Math.PI / 4);
      expect(cube.rotation.y).toBeCloseTo(Math.PI / 2);

      // Test scale (OpenSCAD scale)
      cube.scaling = new BABYLON.Vector3(2, 0.5, 1.5);
      expect(cube.scaling.x).toBe(2);
      expect(cube.scaling.y).toBe(0.5);
      expect(cube.scaling.z).toBe(1.5);
    });
  });
});
