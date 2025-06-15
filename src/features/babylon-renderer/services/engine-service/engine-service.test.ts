/**
 * @file Engine Service Tests
 * 
 * TDD tests for Babylon.js engine service
 * Following functional programming and SRP principles
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { createEngineService } from './engine-service';
import type { BabylonEngineConfig } from '../../types/babylon-types';

// Mock canvas for testing
const createMockCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  return canvas;
};

// Create NullEngine for headless testing (following project patterns)
const createNullEngine = (): BABYLON.NullEngine => {
  return new BABYLON.NullEngine({
    renderWidth: 800,
    renderHeight: 600,
    textureSize: 512,
    deterministicLockstep: false,
    lockstepMaxSteps: 1
  });
};

describe('EngineService', () => {
  let canvas: HTMLCanvasElement;
  let engineService: ReturnType<typeof createEngineService>;

  beforeEach(() => {
    console.log('[INIT] Setting up engine service tests');
    canvas = createMockCanvas();
    engineService = createEngineService();
  });

  afterEach(() => {
    console.log('[END] Cleaning up engine service tests');
    // Cleanup will be handled by individual tests
  });

  describe('createEngine', () => {
    it('should create NullEngine in test environment', () => {
      console.log('[DEBUG] Testing engine creation with defaults (NullEngine expected)');

      const result = engineService.createEngine(canvas);

      expect(result.success).toBe(true);
      if (result.success) {
        // In test environment, should create NullEngine
        expect(result.data).toBeInstanceOf(BABYLON.NullEngine);
        expect(result.data.isDisposed).toBe(false);

        // Cleanup
        engineService.disposeEngine(result.data);
      }
    });

    it('should create NullEngine with custom configuration', () => {
      console.log('[DEBUG] Testing engine creation with custom config (NullEngine expected)');

      const config: BabylonEngineConfig = {
        antialias: false,
        preserveDrawingBuffer: false,
        stencil: false,
        powerPreference: 'low-power'
      };

      const result = engineService.createEngine(canvas, config);

      expect(result.success).toBe(true);
      if (result.success) {
        // In test environment, should create NullEngine regardless of config
        expect(result.data).toBeInstanceOf(BABYLON.NullEngine);
        expect(result.data.isDisposed).toBe(false);

        // Cleanup
        engineService.disposeEngine(result.data);
      }
    });

    it('should create NullEngine for null canvas (test environment)', () => {
      console.log('[DEBUG] Testing engine creation with null canvas');

      // In test environment, null canvas should create NullEngine
      const result = engineService.createEngine(null as any);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(BABYLON.NullEngine);
        expect(result.data.isDisposed).toBe(false);

        // Cleanup
        engineService.disposeEngine(result.data);
      }
    });

    it('should return error for invalid canvas', () => {
      console.log('[DEBUG] Testing invalid canvas handling');
      
      const invalidCanvas = {} as HTMLCanvasElement;
      const result = engineService.createEngine(invalidCanvas);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Failed to create engine');
      }
    });
  });

  describe('disposeEngine', () => {
    it('should dispose NullEngine safely', () => {
      console.log('[DEBUG] Testing engine disposal');

      const result = engineService.createEngine(canvas);
      expect(result.success).toBe(true);

      if (result.success) {
        const engine = result.data;
        expect(engine.isDisposed).toBe(false);

        engineService.disposeEngine(engine);
        expect(engine.isDisposed).toBe(true);
      }
    });

    it('should handle disposal of already disposed engine', () => {
      console.log('[DEBUG] Testing disposal of already disposed engine');

      const result = engineService.createEngine(canvas);
      expect(result.success).toBe(true);

      if (result.success) {
        const engine = result.data;

        // Dispose twice
        engineService.disposeEngine(engine);
        expect(engine.isDisposed).toBe(true);

        // Should not throw error
        expect(() => engineService.disposeEngine(engine)).not.toThrow();
      }
    });

    it('should handle disposal of null engine', () => {
      console.log('[DEBUG] Testing disposal of null engine');
      
      // Should not throw error
      expect(() => engineService.disposeEngine(null as any)).not.toThrow();
    });
  });

  describe('handleResize', () => {
    it('should resize NullEngine successfully', () => {
      console.log('[DEBUG] Testing engine resize');

      const result = engineService.createEngine(canvas);
      expect(result.success).toBe(true);

      if (result.success) {
        const engine = result.data;
        const resizeSpy = vi.spyOn(engine, 'resize');

        engineService.handleResize(engine);

        expect(resizeSpy).toHaveBeenCalled();

        // Cleanup
        engineService.disposeEngine(engine);
      }
    });

    it('should handle resize of disposed engine', () => {
      console.log('[DEBUG] Testing resize of disposed engine');

      const result = engineService.createEngine(canvas);
      expect(result.success).toBe(true);

      if (result.success) {
        const engine = result.data;
        engineService.disposeEngine(engine);

        // Should not throw error
        expect(() => engineService.handleResize(engine)).not.toThrow();
      }
    });

    it('should handle resize of null engine', () => {
      console.log('[DEBUG] Testing resize of null engine');
      
      // Should not throw error
      expect(() => engineService.handleResize(null as any)).not.toThrow();
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle NullEngine context gracefully', () => {
      console.log('[DEBUG] Testing NullEngine context handling');

      const result = engineService.createEngine(canvas);
      expect(result.success).toBe(true);

      if (result.success) {
        const engine = result.data;

        // NullEngine should be stable
        expect(engine.isDisposed).toBe(false);
        expect(engine).toBeInstanceOf(BABYLON.NullEngine);

        // Cleanup
        engineService.disposeEngine(engine);
      }
    });

    it('should maintain NullEngine state consistency', () => {
      console.log('[DEBUG] Testing engine state consistency');

      const result = engineService.createEngine(canvas);
      expect(result.success).toBe(true);

      if (result.success) {
        const engine = result.data;

        // Check initial state
        expect(engine.isDisposed).toBe(false);
        expect(engine).toBeInstanceOf(BABYLON.NullEngine);

        // NullEngine doesn't have getRenderingCanvas method
        // This is expected behavior for headless testing

        // Cleanup
        engineService.disposeEngine(engine);
        expect(engine.isDisposed).toBe(true);
      }
    });
  });
});
