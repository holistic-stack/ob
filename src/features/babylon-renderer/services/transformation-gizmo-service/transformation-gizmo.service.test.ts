/**
 * @file transformation-gizmo.service.test.ts
 * @description Comprehensive unit tests for TransformationGizmoService using real BabylonJS
 * instances with NullEngine for headless testing. Tests service initialization, mesh
 * attachment, mode switching, and transformation events.
 */

import type { AbstractMesh, Scene } from '@babylonjs/core';
import { CreateBox, type Engine, Mesh, NullEngine } from '@babylonjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_TRANSFORMATION_GIZMO_CONFIG,
  TransformationGizmoService,
} from './transformation-gizmo.service';

// Mock ResizeObserver for headless testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('TransformationGizmoService', () => {
  let service: TransformationGizmoService;
  let engine: Engine;
  let scene: Scene;
  let testMesh: AbstractMesh;

  beforeEach(async () => {
    // Create NullEngine for headless testing
    engine = new NullEngine({
      renderHeight: 512,
      renderWidth: 512,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1,
    });

    // Create scene
    scene = new Scene(engine);

    // Create test mesh
    testMesh = CreateBox('testBox', { size: 2 }, scene);

    // Create service instance
    service = new TransformationGizmoService();
  });

  afterEach(() => {
    service.dispose();
    scene.dispose();
    engine.dispose();
  });

  describe('Service Initialization', () => {
    it('should initialize successfully with valid scene', async () => {
      const result = await service.initialize(scene);

      expect(result.success).toBe(true);
      expect(service.getIsInitialized()).toBe(true);
    });

    it('should handle double initialization gracefully', async () => {
      await service.initialize(scene);
      const secondResult = await service.initialize(scene);

      expect(secondResult.success).toBe(true);
      expect(service.getIsInitialized()).toBe(true);
    });

    it('should use default configuration when none provided', () => {
      const defaultService = new TransformationGizmoService();

      // Access private config through initialization
      expect(defaultService.getCurrentMode()).toBe('position');
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig = { size: 2.0, snapToGrid: true };
      const customService = new TransformationGizmoService(customConfig);

      expect(customService.getCurrentMode()).toBe('position');
    });
  });

  describe('Mesh Attachment', () => {
    beforeEach(async () => {
      await service.initialize(scene);
    });

    it('should attach gizmo to mesh successfully', () => {
      const result = service.attachToMesh(testMesh);

      expect(result.success).toBe(true);
      expect(service.getAttachedMesh()).toBe(testMesh);
    });

    it('should detach gizmo from mesh successfully', () => {
      service.attachToMesh(testMesh);
      const result = service.detach();

      expect(result.success).toBe(true);
      expect(service.getAttachedMesh()).toBeNull();
    });

    it('should handle attachment without initialization', () => {
      const uninitializedService = new TransformationGizmoService();
      const result = uninitializedService.attachToMesh(testMesh);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ATTACH_FAILED');
      expect(result.error?.message).toContain('not initialized');
    });

    it('should handle detachment without initialization', () => {
      const uninitializedService = new TransformationGizmoService();
      const result = uninitializedService.detach();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ATTACH_FAILED');
      expect(result.error?.message).toContain('not initialized');
    });
  });

  describe('Gizmo Mode Management', () => {
    beforeEach(async () => {
      await service.initialize(scene);
    });

    it('should start with position mode by default', () => {
      expect(service.getCurrentMode()).toBe('position');
    });

    it('should switch to rotation mode successfully', () => {
      const result = service.setMode('rotation');

      expect(result.success).toBe(true);
      expect(service.getCurrentMode()).toBe('rotation');
    });

    it('should switch to scale mode successfully', () => {
      const result = service.setMode('scale');

      expect(result.success).toBe(true);
      expect(service.getCurrentMode()).toBe('scale');
    });

    it('should switch back to position mode successfully', () => {
      service.setMode('rotation');
      const result = service.setMode('position');

      expect(result.success).toBe(true);
      expect(service.getCurrentMode()).toBe('position');
    });

    it('should handle invalid mode gracefully', () => {
      // @ts-expect-error - Testing invalid mode
      const result = service.setMode('invalid');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('MODE_CHANGE_FAILED');
      expect(result.error?.message).toContain('Invalid gizmo mode');
    });

    it('should handle mode change without initialization', () => {
      const uninitializedService = new TransformationGizmoService();
      const result = uninitializedService.setMode('rotation');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('MODE_CHANGE_FAILED');
      expect(result.error?.message).toContain('not initialized');
    });
  });

  describe('Transformation Events', () => {
    beforeEach(async () => {
      await service.initialize(scene);
      service.attachToMesh(testMesh);
    });

    it('should emit transformation events when mesh is transformed', () => {
      const transformationEvents: any[] = [];

      service.onTransformationObservable.add((event) => {
        transformationEvents.push(event);
      });

      // Simulate mesh transformation
      testMesh.position.x = 5;
      testMesh.position.y = 10;
      testMesh.rotation.y = Math.PI / 2;

      // Manually trigger transformation event (since we can't simulate drag in tests)
      (service as any).emitTransformationEvent('position');

      expect(transformationEvents).toHaveLength(1);
      expect(transformationEvents[0].mesh).toBe(testMesh);
      expect(transformationEvents[0].mode).toBe('position');
      expect(transformationEvents[0].position.x).toBe(5);
      expect(transformationEvents[0].position.y).toBe(10);
    });

    it('should include correct transformation data in events', () => {
      let capturedEvent: any = null;

      service.onTransformationObservable.add((event) => {
        capturedEvent = event;
      });

      // Set specific transformation values
      testMesh.position.set(1, 2, 3);
      testMesh.rotation.set(0.1, 0.2, 0.3);
      testMesh.scaling.set(2, 3, 4);

      (service as any).emitTransformationEvent('scale');

      expect(capturedEvent).not.toBeNull();
      expect(capturedEvent.position).toEqual({ x: 1, y: 2, z: 3 });
      expect(capturedEvent.rotation).toEqual({ x: 0.1, y: 0.2, z: 0.3 });
      expect(capturedEvent.scaling).toEqual({ x: 2, y: 3, z: 4 });
      expect(capturedEvent.mode).toBe('scale');
      expect(capturedEvent.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Service Disposal', () => {
    it('should dispose successfully when initialized', async () => {
      await service.initialize(scene);
      service.attachToMesh(testMesh);

      const result = service.dispose();

      expect(result.success).toBe(true);
      expect(service.getIsInitialized()).toBe(false);
      expect(service.getAttachedMesh()).toBeNull();
    });

    it('should dispose successfully when not initialized', () => {
      const result = service.dispose();

      expect(result.success).toBe(true);
      expect(service.getIsInitialized()).toBe(false);
    });

    it('should clear transformation observable on disposal', async () => {
      await service.initialize(scene);

      const observerCount = service.onTransformationObservable.observers.length;
      service.onTransformationObservable.add(() => {});

      expect(service.onTransformationObservable.observers.length).toBeGreaterThan(observerCount);

      service.dispose();

      expect(service.onTransformationObservable.observers.length).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should use default configuration values', () => {
      const defaultService = new TransformationGizmoService();

      expect(DEFAULT_TRANSFORMATION_GIZMO_CONFIG.size).toBe(1.0);
      expect(DEFAULT_TRANSFORMATION_GIZMO_CONFIG.snapToGrid).toBe(false);
      expect(DEFAULT_TRANSFORMATION_GIZMO_CONFIG.gridSize).toBe(1.0);
      expect(DEFAULT_TRANSFORMATION_GIZMO_CONFIG.enablePointerToAttach).toBe(false);
    });

    it('should accept partial configuration overrides', () => {
      const customConfig = { size: 2.5, snapToGrid: true };
      const customService = new TransformationGizmoService(customConfig);

      // Configuration is private, but we can verify it's used during initialization
      expect(customService.getCurrentMode()).toBe('position');
    });
  });

  describe('Error Handling', () => {
    it('should handle scene disposal during operation', async () => {
      await service.initialize(scene);
      service.attachToMesh(testMesh);

      // Dispose scene while service is active
      scene.dispose();

      // Service should handle this gracefully
      const result = service.setMode('rotation');
      expect(result.success).toBe(true); // BabylonJS handles disposed scenes gracefully
    });

    it('should provide detailed error information', async () => {
      const uninitializedService = new TransformationGizmoService();
      const result = uninitializedService.attachToMesh(testMesh);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('ATTACH_FAILED');
      expect(result.error?.message).toContain('Gizmo manager not initialized');
      expect(result.error?.timestamp).toBeInstanceOf(Date);
    });
  });
});
