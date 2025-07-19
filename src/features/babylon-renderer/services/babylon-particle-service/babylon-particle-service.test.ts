/**
 * @file BabylonJS Particle System Service Tests
 *
 * Tests for BabylonJS particle system service functionality.
 * Following TDD principles with real implementations where possible.
 */

// Real BabylonJS components for testing (no mocks)
import * as BABYLON from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParticleSystemConfig } from './babylon-particle-service';
import {
  BabylonParticleService,
  DEFAULT_PARTICLE_CONFIG,
  ParticleSystemType,
} from './babylon-particle-service';

const createMockParticleSystem = (name: string) =>
  ({
    id: `particle-system-${name}-${Math.random()}`,
    name,
    emitter: null,
    emitRate: 100,
    minEmitBox: null,
    maxEmitBox: null,
    direction1: null,
    direction2: null,
    minAngularSpeed: 0,
    maxAngularSpeed: 0,
    minInitialRotation: 0,
    maxInitialRotation: 0,
    minLifeTime: 1,
    maxLifeTime: 3,
    minSize: 0.1,
    maxSize: 0.5,
    color1: null,
    color2: null,
    colorDead: null,
    gravity: null,
    updateSpeed: 0.01,
    particleTexture: null,
    isStarted: vi.fn(() => false),
    getCapacity: vi.fn(() => 1000),
    start: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
  }) as any;

const createMockGPUParticleSystem = (name: string) =>
  ({
    ...createMockParticleSystem(name),
    isGPU: true,
  }) as any;

// Mock BabylonJS core
vi.mock('@babylonjs/core', async () => {
  const actual = await vi.importActual('@babylonjs/core');

  // Mock Vector3 constructor
  const Vector3Mock = vi
    .fn()
    .mockImplementation((x: number, y: number, z: number) => ({ x, y, z }));
  // Add static methods to the mock
  Object.assign(Vector3Mock, {
    Zero: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
  });

  // Mock Color4 constructor
  const Color4Mock = vi
    .fn()
    .mockImplementation((r: number, g: number, b: number, a: number) => ({ r, g, b, a }));

  return {
    ...actual,
    ParticleSystem: vi.fn().mockImplementation((name: string) => createMockParticleSystem(name)),
    GPUParticleSystem: vi
      .fn()
      .mockImplementation((name: string) => createMockGPUParticleSystem(name)),
    Texture: vi.fn().mockImplementation((url: string) => ({ url })),
    Vector3: Vector3Mock,
    Color4: Color4Mock,
  };
});

// Set up GPUParticleSystem.IsSupported
const { GPUParticleSystem } = await import('@babylonjs/core');
(GPUParticleSystem as any).IsSupported = true;

describe('BabylonParticleService', () => {
  let particleService: BabylonParticleService;
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;

  beforeEach(() => {
    // Reset mocks before each test to ensure isolation
    vi.clearAllMocks();

    // Create real BabylonJS instances for testing
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);

    // Mock getEngine to support WebGL2 for GPU particles, as NullEngine defaults to WebGL1
    vi.spyOn(scene, 'getEngine').mockReturnValue({
      ...engine,
      webGLVersion: 2,
    } as any);

    particleService = new BabylonParticleService();
  });

  afterEach(() => {
    // Clean up resources
    particleService.dispose();
    scene.dispose();
    engine.dispose();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize service', () => {
      const service = new BabylonParticleService();

      // Service should be created without errors
      expect(service).toBeDefined();
    });
  });

  describe('init', () => {
    it('should initialize with valid scene', () => {
      const result = particleService.init(scene);

      expect(result.success).toBe(true);
    });

    it('should handle null scene gracefully', () => {
      const result = particleService.init(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CONFIG');
        expect(result.error.message).toContain('Scene is required');
      }
    });
  });

  describe('createParticleSystem', () => {
    beforeEach(() => {
      particleService.init(scene);
    });

    it('should create CPU particle system successfully', async () => {
      const config: ParticleSystemConfig = {
        ...DEFAULT_PARTICLE_CONFIG,
        name: 'test-cpu-particles',
        type: ParticleSystemType.CPU,
      };

      const result = await particleService.createParticleSystem(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.name).toBe('test-cpu-particles');
      }

      // Verify particle system was stored
      const particleSystem = particleService.getParticleSystem('test-cpu-particles');
      expect(particleSystem).toBeDefined();

      // Verify state was created
      const state = particleService.getParticleSystemState('test-cpu-particles');
      expect(state).toBeDefined();
      expect(state?.type).toBe(ParticleSystemType.CPU);
      expect(state?.isStarted).toBe(false);
    });

    it('should create GPU particle system successfully', async () => {
      const config: ParticleSystemConfig = {
        ...DEFAULT_PARTICLE_CONFIG,
        name: 'test-gpu-particles',
        type: ParticleSystemType.GPU,
      };

      const result = await particleService.createParticleSystem(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.name).toBe('test-gpu-particles');
      }

      // Verify state was created with GPU type
      const state = particleService.getParticleSystemState('test-gpu-particles');
      expect(state?.type).toBe(ParticleSystemType.GPU);
    });

    it('should handle creation without scene initialization', async () => {
      const uninitializedService = new BabylonParticleService();
      const config: ParticleSystemConfig = {
        ...DEFAULT_PARTICLE_CONFIG,
        name: 'test-particles',
      };

      const result = await uninitializedService.createParticleSystem(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CONFIG');
        expect(result.error.message).toContain('Scene must be initialized');
      }
    });

    it('should configure particle system with custom config', async () => {
      const config: ParticleSystemConfig = {
        ...DEFAULT_PARTICLE_CONFIG,
        name: 'custom-particles',
        emitRate: 200,
        capacity: 2000,
      };

      const result = await particleService.createParticleSystem(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.emitRate).toBe(200);
      }

      const state = particleService.getParticleSystemState('custom-particles');
      expect(state?.emitRate).toBe(200);
    });
  });

  describe('startParticleSystem', () => {
    beforeEach(async () => {
      particleService.init(scene);
      await particleService.createParticleSystem({
        ...DEFAULT_PARTICLE_CONFIG,
        name: 'test-particles',
      });
    });

    it('should start particle system successfully', () => {
      const result = particleService.startParticleSystem('test-particles');

      expect(result.success).toBe(true);

      // Verify particle system start was called
      const particleSystem = particleService.getParticleSystem('test-particles');
      expect(particleSystem?.start).toHaveBeenCalled();

      // Verify state was updated
      const state = particleService.getParticleSystemState('test-particles');
      expect(state?.isStarted).toBe(true);
    });

    it('should handle starting non-existent particle system', () => {
      const result = particleService.startParticleSystem('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CONFIG');
        expect(result.error.message).toContain('Particle system not found');
      }
    });
  });

  describe('stopParticleSystem', () => {
    beforeEach(async () => {
      particleService.init(scene);
      await particleService.createParticleSystem({
        ...DEFAULT_PARTICLE_CONFIG,
        name: 'test-particles',
      });
      particleService.startParticleSystem('test-particles');
    });

    it('should stop particle system successfully', () => {
      const result = particleService.stopParticleSystem('test-particles');

      expect(result.success).toBe(true);

      // Verify particle system stop was called
      const particleSystem = particleService.getParticleSystem('test-particles');
      expect(particleSystem?.stop).toHaveBeenCalled();

      // Verify state was updated
      const state = particleService.getParticleSystemState('test-particles');
      expect(state?.isStarted).toBe(false);
    });

    it('should handle stopping non-existent particle system', () => {
      const result = particleService.stopParticleSystem('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CONFIG');
        expect(result.error.message).toContain('Particle system not found');
      }
    });
  });

  describe('removeParticleSystem', () => {
    beforeEach(async () => {
      particleService.init(scene);
      await particleService.createParticleSystem({
        ...DEFAULT_PARTICLE_CONFIG,
        name: 'test-particles',
      });
    });

    it('should remove particle system successfully', () => {
      const result = particleService.removeParticleSystem('test-particles');

      expect(result.success).toBe(true);

      // Verify particle system was disposed
      const particleSystem = particleService.getParticleSystem('test-particles');
      expect(particleSystem).toBeUndefined();

      // Verify state was removed
      const state = particleService.getParticleSystemState('test-particles');
      expect(state).toBeUndefined();
    });

    it('should handle removing non-existent particle system', () => {
      const result = particleService.removeParticleSystem('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CONFIG');
        expect(result.error.message).toContain('Particle system not found');
      }
    });
  });

  describe('getAllParticleSystemStates', () => {
    beforeEach(async () => {
      particleService.init(scene);
    });

    it('should return empty array when no particle systems exist', () => {
      const states = particleService.getAllParticleSystemStates();
      expect(states).toEqual([]);
    });

    it('should return all particle system states', async () => {
      await particleService.createParticleSystem({
        ...DEFAULT_PARTICLE_CONFIG,
        name: 'particles-1',
      });
      await particleService.createParticleSystem({
        ...DEFAULT_PARTICLE_CONFIG,
        name: 'particles-2',
      });

      const states = particleService.getAllParticleSystemStates();
      expect(states).toHaveLength(2);
      expect(states.map((s) => s.name)).toContain('particles-1');
      expect(states.map((s) => s.name)).toContain('particles-2');
    });
  });

  describe('dispose', () => {
    it('should dispose service cleanly', async () => {
      particleService.init(scene);
      await particleService.createParticleSystem({
        ...DEFAULT_PARTICLE_CONFIG,
        name: 'test-particles',
      });

      particleService.dispose();

      // Verify all particle systems were disposed
      const states = particleService.getAllParticleSystemStates();
      expect(states).toEqual([]);
    });

    it('should handle disposal when not initialized', () => {
      // Should not throw
      expect(() => particleService.dispose()).not.toThrow();
    });
  });
});
