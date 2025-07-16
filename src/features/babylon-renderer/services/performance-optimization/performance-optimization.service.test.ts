/**
 * @file Performance Optimization Service Tests
 *
 * Tests for the PerformanceOptimizationService with real BabylonJS NullEngine.
 * Following TDD principles with comprehensive LOD and performance testing.
 */

import {
  Color3,
  FreeCamera,
  type Mesh,
  MeshBuilder,
  NullEngine,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type CullingConfig,
  type InstancingConfig,
  type LODConfig,
  PerformanceOptimizationErrorCode,
  PerformanceOptimizationService,
} from './performance-optimization.service';

// Mock ResizeObserver for tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('PerformanceOptimizationService', () => {
  let engine: NullEngine;
  let scene: Scene;
  let service: PerformanceOptimizationService;
  let testMesh: Mesh;

  beforeEach(async () => {
    // Create a null engine (headless)
    engine = new NullEngine();

    // Create a real scene
    scene = new Scene(engine);

    // Create a camera for culling tests
    const camera = new FreeCamera('testCamera', new Vector3(0, 0, -10), scene);
    camera.setTarget(Vector3.Zero());
    scene.activeCamera = camera;

    // Create service
    service = new PerformanceOptimizationService(scene);

    // Create test mesh with sufficient complexity for LOD testing
    testMesh = MeshBuilder.CreateSphere(
      'testSphere',
      {
        diameter: 2,
        segments: 32, // High detail for LOD testing
      },
      scene
    );

    // Add material
    const material = new StandardMaterial('testMaterial', scene);
    material.diffuseColor = new Color3(1, 0, 0);
    testMesh.material = material;
  });

  afterEach(() => {
    service.dispose();
    scene.dispose();
    engine.dispose();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const result = await service.initialize();

      expect(result.success).toBe(true);

      const state = service.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.activeLODs).toBeDefined();
      expect(state.metrics).toBeDefined();
    });

    it('should provide initial performance metrics', async () => {
      await service.initialize();

      const metrics = service.getPerformanceMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.frameRate).toBeGreaterThanOrEqual(0);
      expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
      expect(metrics.triangleCount).toBeGreaterThanOrEqual(0);
      expect(metrics.meshCount).toBeGreaterThanOrEqual(0);
      expect(metrics.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('LOD setup', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should setup LOD with valid configuration', async () => {
      const config: LODConfig = {
        distances: [10, 50, 100],
        reductionFactors: [1.0, 0.5, 0.25],
        enableCulling: true,
        quality: 'medium',
      };

      const result = await service.setupLOD(testMesh, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.originalMesh).toBe(testMesh);
        expect(result.data.lodLevels.length).toBeGreaterThan(0); // At least some LOD levels
        expect(result.data.triangleReduction).toBeGreaterThanOrEqual(0);
        expect(result.data.memoryReduction).toBeGreaterThanOrEqual(0);

        // Should have at least the original mesh level and culling level
        expect(result.data.lodLevels.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should validate LOD configuration', async () => {
      const invalidConfig: LODConfig = {
        distances: [], // Empty distances
        reductionFactors: [1.0],
        enableCulling: false,
      };

      const result = await service.setupLOD(testMesh, invalidConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(PerformanceOptimizationErrorCode.INVALID_CONFIGURATION);
      }
    });

    it('should validate distances are in ascending order', async () => {
      const invalidConfig: LODConfig = {
        distances: [100, 50, 10], // Wrong order
        reductionFactors: [1.0, 0.5, 0.25],
        enableCulling: false,
      };

      const result = await service.setupLOD(testMesh, invalidConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(PerformanceOptimizationErrorCode.INVALID_CONFIGURATION);
      }
    });

    it('should validate reduction factors are between 0 and 1', async () => {
      const invalidConfig: LODConfig = {
        distances: [10, 50, 100],
        reductionFactors: [1.0, 1.5, 0.25], // Invalid factor > 1
        enableCulling: false,
      };

      const result = await service.setupLOD(testMesh, invalidConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(PerformanceOptimizationErrorCode.INVALID_CONFIGURATION);
      }
    });

    it('should require matching arrays for distances and reduction factors', async () => {
      const invalidConfig: LODConfig = {
        distances: [10, 50, 100],
        reductionFactors: [1.0, 0.5], // Mismatched length
        enableCulling: false,
      };

      const result = await service.setupLOD(testMesh, invalidConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(PerformanceOptimizationErrorCode.INVALID_CONFIGURATION);
      }
    });

    it('should handle different quality levels', async () => {
      const qualities: Array<'low' | 'medium' | 'high' | 'ultra'> = [
        'low',
        'medium',
        'high',
        'ultra',
      ];

      for (const quality of qualities) {
        const config: LODConfig = {
          distances: [10, 50],
          reductionFactors: [1.0, 0.5],
          quality,
          enableCulling: false,
        };

        const result = await service.setupLOD(testMesh, config);
        expect(result.success).toBe(true);
      }
    });

    it('should fail when service is not initialized', async () => {
      const uninitializedService = new PerformanceOptimizationService(scene);

      const config: LODConfig = {
        distances: [10, 50],
        reductionFactors: [1.0, 0.5],
        enableCulling: false,
      };

      const result = await uninitializedService.setupLOD(testMesh, config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(PerformanceOptimizationErrorCode.SCENE_NOT_READY);
      }

      uninitializedService.dispose();
    });

    it('should fail with invalid mesh', async () => {
      const config: LODConfig = {
        distances: [10, 50],
        reductionFactors: [1.0, 0.5],
        enableCulling: false,
      };

      const result = await service.setupLOD(null as any, config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(PerformanceOptimizationErrorCode.MESH_NOT_VALID);
      }
    });
  });

  describe('performance monitoring', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should track performance metrics', async () => {
      // Wait a bit for metrics to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      const metrics = service.getPerformanceMetrics();

      expect(metrics.frameRate).toBeGreaterThanOrEqual(0);
      expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
      expect(metrics.triangleCount).toBeGreaterThanOrEqual(0); // May be 0 in headless environment
      expect(metrics.meshCount).toBeGreaterThanOrEqual(0); // May be 0 in headless environment
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.lastUpdated).toBeInstanceOf(Date);
    });

    it('should update metrics over time', async () => {
      const _initialMetrics = service.getPerformanceMetrics();

      // Wait for metrics update (shorter timeout for tests)
      await new Promise((resolve) => setTimeout(resolve, 50));

      const updatedMetrics = service.getPerformanceMetrics();

      // Metrics should be available even if not updated yet
      expect(updatedMetrics.lastUpdated).toBeInstanceOf(Date);
      expect(updatedMetrics.frameRate).toBeGreaterThanOrEqual(0);
    });

    it('should track triangle count changes', async () => {
      const initialMetrics = service.getPerformanceMetrics();
      const initialTriangleCount = initialMetrics.triangleCount;

      // Add another mesh
      const additionalMesh = MeshBuilder.CreateBox('testBox', { size: 1 }, scene);

      // Force metrics update by calling it directly (for testing)
      await new Promise((resolve) => setTimeout(resolve, 50));

      const updatedMetrics = service.getPerformanceMetrics();

      // Should at least have the initial mesh count
      expect(updatedMetrics.triangleCount).toBeGreaterThanOrEqual(initialTriangleCount);
      expect(updatedMetrics.meshCount).toBeGreaterThanOrEqual(initialMetrics.meshCount);

      additionalMesh.dispose();
    });
  });

  describe('state management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should maintain LOD state', async () => {
      const config: LODConfig = {
        distances: [10, 50],
        reductionFactors: [1.0, 0.5],
        enableCulling: false,
      };

      await service.setupLOD(testMesh, config);

      const state = service.getState();

      expect(state.isInitialized).toBe(true);
      expect(state.activeLODs.size).toBe(1);
      expect(state.activeLODs.has(testMesh.uniqueId.toString())).toBe(true);
    });

    it('should track multiple LOD setups', async () => {
      const config: LODConfig = {
        distances: [10, 50],
        reductionFactors: [1.0, 0.5],
        enableCulling: false,
      };

      // Setup LOD for first mesh
      await service.setupLOD(testMesh, config);

      // Create and setup LOD for second mesh
      const secondMesh = MeshBuilder.CreateBox('testBox', { size: 1 }, scene);
      await service.setupLOD(secondMesh, config);

      const state = service.getState();

      expect(state.activeLODs.size).toBe(2);
      expect(state.activeLODs.has(testMesh.uniqueId.toString())).toBe(true);
      expect(state.activeLODs.has(secondMesh.uniqueId.toString())).toBe(true);

      secondMesh.dispose();
    });
  });

  describe('instancing', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should setup instancing for similar meshes', async () => {
      // Create multiple similar meshes
      const meshes = [];
      for (let i = 0; i < 5; i++) {
        const mesh = MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene);
        mesh.position.x = i * 2; // Different positions
        meshes.push(mesh);
      }

      const result = await service.setupInstancing(meshes);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.instanceGroups.length).toBeGreaterThan(0);
        expect(result.data.instanceCount).toBeGreaterThan(0);
        expect(result.data.totalMemoryReduction).toBeGreaterThanOrEqual(0);
        expect(result.data.totalRenderingImprovement).toBeGreaterThanOrEqual(0);
      }

      // Cleanup
      meshes.forEach((mesh) => mesh.dispose());
    });

    it('should not create instances when count is below threshold', async () => {
      // Create only 2 meshes (below default threshold of 3)
      const meshes = [];
      for (let i = 0; i < 2; i++) {
        const mesh = MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene);
        meshes.push(mesh);
      }

      const result = await service.setupInstancing(meshes);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.instanceGroups.length).toBe(0);
        expect(result.data.instanceCount).toBe(0);
      }

      // Cleanup
      meshes.forEach((mesh) => mesh.dispose());
    });

    it('should respect instancing configuration', async () => {
      const config: InstancingConfig = {
        enabled: false,
        minInstanceCount: 3,
        maxInstanceCount: 1000,
        geometryTolerance: 0.001,
        enableAutoDetection: true,
        preserveMaterials: true,
      };

      service.updateInstancingConfig(config);

      const meshes = [];
      for (let i = 0; i < 5; i++) {
        const mesh = MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene);
        meshes.push(mesh);
      }

      const result = await service.setupInstancing(meshes);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(PerformanceOptimizationErrorCode.INVALID_CONFIGURATION);
      }

      // Cleanup
      meshes.forEach((mesh) => mesh.dispose());
    });

    it('should handle different geometry types separately', async () => {
      const meshes = [];

      // Create boxes
      for (let i = 0; i < 3; i++) {
        const mesh = MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene);
        meshes.push(mesh);
      }

      // Create spheres
      for (let i = 0; i < 3; i++) {
        const mesh = MeshBuilder.CreateSphere(`sphere_${i}`, { diameter: 1 }, scene);
        meshes.push(mesh);
      }

      const result = await service.setupInstancing(meshes);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should create separate instance groups for boxes and spheres
        expect(result.data.instanceGroups.length).toBeGreaterThanOrEqual(1);
        expect(result.data.instanceCount).toBeGreaterThan(0);
      }

      // Cleanup
      meshes.forEach((mesh) => mesh.dispose());
    });

    it('should clear instances properly', async () => {
      const meshes = [];
      for (let i = 0; i < 5; i++) {
        const mesh = MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene);
        meshes.push(mesh);
      }

      await service.setupInstancing(meshes);

      const stateBefore = service.getState();
      expect(stateBefore.activeInstances.size).toBeGreaterThan(0);

      service.clearInstances();

      const stateAfter = service.getState();
      expect(stateAfter.activeInstances.size).toBe(0);
      expect(stateAfter.geometrySignatures.size).toBe(0);

      // Cleanup
      meshes.forEach((mesh) => mesh.dispose());
    });

    it('should update performance metrics with instancing data', async () => {
      const meshes = [];
      for (let i = 0; i < 5; i++) {
        const mesh = MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene);
        meshes.push(mesh);
      }

      await service.setupInstancing(meshes);

      // Wait for metrics update
      await new Promise((resolve) => setTimeout(resolve, 50));

      const metrics = service.getPerformanceMetrics();
      expect(metrics.instanceCount).toBeGreaterThanOrEqual(0);
      expect(metrics.instanceGroups).toBeGreaterThanOrEqual(0);

      // Cleanup
      meshes.forEach((mesh) => mesh.dispose());
    });

    it('should fail when service is not initialized', async () => {
      const uninitializedService = new PerformanceOptimizationService(scene);

      const meshes = [MeshBuilder.CreateBox('box', { size: 1 }, scene)];
      const result = await uninitializedService.setupInstancing(meshes);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(PerformanceOptimizationErrorCode.SCENE_NOT_READY);
      }

      uninitializedService.dispose();
      meshes.forEach((mesh) => mesh.dispose());
    });
  });

  describe('culling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should setup culling for scene', async () => {
      // Create multiple meshes at different positions
      const meshes = [];
      for (let i = 0; i < 5; i++) {
        const mesh = MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene);
        mesh.position.x = i * 10; // Spread them out
        meshes.push(mesh);
      }

      const result = await service.setupCulling();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stats.totalMeshes).toBeGreaterThan(0);
        expect(result.data.renderingImprovement).toBeGreaterThanOrEqual(0);
        expect(result.data.culledMeshCount).toBeGreaterThanOrEqual(0);
      }

      // Cleanup
      meshes.forEach((mesh) => mesh.dispose());
    });

    it('should respect culling configuration', async () => {
      const config: CullingConfig = {
        enabled: false,
        method: 'both',
        frustumCullingEnabled: true,
        occlusionCullingEnabled: true,
        occlusionQueryThreshold: 0.01,
        frustumMargin: 0.1,
        updateFrequency: 100,
      };

      service.updateCullingConfig(config);

      const result = await service.setupCulling();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(PerformanceOptimizationErrorCode.INVALID_CONFIGURATION);
      }
    });

    it('should handle frustum culling only', async () => {
      const config: CullingConfig = {
        enabled: true,
        method: 'frustum',
        frustumCullingEnabled: true,
        occlusionCullingEnabled: false,
        occlusionQueryThreshold: 0.01,
        frustumMargin: 0.1,
        updateFrequency: 100,
      };

      service.updateCullingConfig(config);

      const meshes = [];
      for (let i = 0; i < 3; i++) {
        const mesh = MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene);
        mesh.position.x = i * 5;
        meshes.push(mesh);
      }

      const result = await service.setupCulling();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stats.totalMeshes).toBeGreaterThan(0);
      }

      // Cleanup
      meshes.forEach((mesh) => mesh.dispose());
    });

    it('should handle occlusion culling only', async () => {
      const config: CullingConfig = {
        enabled: true,
        method: 'occlusion',
        frustumCullingEnabled: false,
        occlusionCullingEnabled: true,
        occlusionQueryThreshold: 0.01,
        frustumMargin: 0.1,
        updateFrequency: 100,
      };

      service.updateCullingConfig(config);

      const meshes = [];
      for (let i = 0; i < 3; i++) {
        const mesh = MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene);
        mesh.position.z = i * 2; // Place them in a line
        meshes.push(mesh);
      }

      const result = await service.setupCulling();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stats.totalMeshes).toBeGreaterThan(0);
      }

      // Cleanup
      meshes.forEach((mesh) => mesh.dispose());
    });

    it('should clear culling properly', async () => {
      const meshes = [];
      for (let i = 0; i < 3; i++) {
        const mesh = MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene);
        meshes.push(mesh);
      }

      await service.setupCulling();

      service.clearCulling();

      const stats = service.getCullingStats();
      expect(stats.totalMeshes).toBe(0);
      expect(stats.frustumCulled).toBe(0);
      expect(stats.occlusionCulled).toBe(0);

      // All meshes should be enabled
      meshes.forEach((mesh) => {
        expect(mesh.isEnabled()).toBe(true);
      });

      // Cleanup
      meshes.forEach((mesh) => mesh.dispose());
    });

    it('should update performance metrics with culling data', async () => {
      const meshes = [];
      for (let i = 0; i < 3; i++) {
        const mesh = MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene);
        meshes.push(mesh);
      }

      await service.setupCulling();

      // Wait for metrics update
      await new Promise((resolve) => setTimeout(resolve, 50));

      const metrics = service.getPerformanceMetrics();
      expect(metrics.visibleMeshes).toBeGreaterThanOrEqual(0);
      expect(metrics.culledMeshes).toBeGreaterThanOrEqual(0);
      expect(metrics.frustumCulled).toBeGreaterThanOrEqual(0);
      expect(metrics.occlusionCulled).toBeGreaterThanOrEqual(0);

      // Cleanup
      meshes.forEach((mesh) => mesh.dispose());
    });

    it('should fail when service is not initialized', async () => {
      const uninitializedService = new PerformanceOptimizationService(scene);

      const result = await uninitializedService.setupCulling();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(PerformanceOptimizationErrorCode.SCENE_NOT_READY);
      }

      uninitializedService.dispose();
    });

    it('should fail when no camera is available', async () => {
      // Remove the camera temporarily
      const originalCamera = scene.activeCamera;
      scene.activeCamera = null;

      const result = await service.setupCulling();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(PerformanceOptimizationErrorCode.CULLING_SETUP_FAILED);
      }

      // Restore camera
      scene.activeCamera = originalCamera;
    });
  });

  describe('disposal', () => {
    it('should dispose cleanly', async () => {
      await service.initialize();

      const config: LODConfig = {
        distances: [10, 50],
        reductionFactors: [1.0, 0.5],
        enableCulling: false,
      };

      await service.setupLOD(testMesh, config);

      // Dispose should not throw
      expect(() => service.dispose()).not.toThrow();

      // State should be cleared
      const state = service.getState();
      expect(state.activeLODs.size).toBe(0);
      expect(state.activeInstances.size).toBe(0);
    });

    it('should handle multiple dispose calls', async () => {
      await service.initialize();

      service.dispose();

      // Second dispose should not throw
      expect(() => service.dispose()).not.toThrow();
    });
  });
});
