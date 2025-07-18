/**
 * @file Buffer Clearing Utilities Tests
 *
 * Tests for BabylonJS buffer clearing utilities using real BabylonJS instances.
 * Uses NullEngine for headless testing without mocks.
 */

import * as BABYLON from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BufferClearingErrorCode,
  clearRenderBuffers,
  ensureSceneAutoClear,
  performCompleteBufferClearing,
} from './buffer-clearing';

describe('Buffer Clearing Utilities', () => {
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

  describe('clearRenderBuffers', () => {
    it('should successfully clear render buffers with valid engine and scene', () => {
      const result = clearRenderBuffers(engine, scene);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it('should return error for invalid engine', () => {
      const result = clearRenderBuffers(null as any, scene);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(BufferClearingErrorCode.INVALID_ENGINE);
        expect(result.error.message).toContain('Invalid or missing BabylonJS engine');
      }
    });

    it('should return error for invalid scene', () => {
      const result = clearRenderBuffers(engine, null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(BufferClearingErrorCode.INVALID_SCENE);
        expect(result.error.message).toContain('Invalid or missing BabylonJS scene');
      }
    });

    it('should return error for engine without clear method', () => {
      const invalidEngine = {} as BABYLON.Engine;
      const result = clearRenderBuffers(invalidEngine, scene);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(BufferClearingErrorCode.INVALID_ENGINE);
      }
    });
  });

  describe('ensureSceneAutoClear', () => {
    it('should successfully configure scene auto-clear settings', () => {
      // Initially set to false to test the function
      scene.autoClear = false;
      scene.autoClearDepthAndStencil = false;

      const result = ensureSceneAutoClear(scene);

      expect(result.success).toBe(true);
      expect(scene.autoClear).toBe(true);
      expect(scene.autoClearDepthAndStencil).toBe(true);
    });

    it('should return error for invalid scene', () => {
      const result = ensureSceneAutoClear(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(BufferClearingErrorCode.INVALID_SCENE);
        expect(result.error.message).toContain('Invalid or missing BabylonJS scene');
      }
    });

    it('should maintain existing auto-clear settings if already true', () => {
      // Set initial values
      scene.autoClear = true;
      scene.autoClearDepthAndStencil = true;

      const result = ensureSceneAutoClear(scene);

      expect(result.success).toBe(true);
      expect(scene.autoClear).toBe(true);
      expect(scene.autoClearDepthAndStencil).toBe(true);
    });
  });

  describe('performCompleteBufferClearing', () => {
    it('should successfully perform complete buffer clearing', () => {
      // Initially set auto-clear to false
      scene.autoClear = false;
      scene.autoClearDepthAndStencil = false;

      const result = performCompleteBufferClearing(engine, scene);

      expect(result.success).toBe(true);
      expect(scene.autoClear).toBe(true);
      expect(scene.autoClearDepthAndStencil).toBe(true);
    });

    it('should return error for invalid engine', () => {
      const result = performCompleteBufferClearing(null as any, scene);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(BufferClearingErrorCode.INVALID_ENGINE);
      }
    });

    it('should return error for invalid scene', () => {
      const result = performCompleteBufferClearing(engine, null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(BufferClearingErrorCode.INVALID_SCENE);
      }
    });
  });

  describe('Error handling', () => {
    it('should include timestamp in error objects', () => {
      const result = clearRenderBuffers(null as any, scene);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should provide meaningful error messages', () => {
      const result = ensureSceneAutoClear(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBeTruthy();
        expect(result.error.message.length).toBeGreaterThan(0);
      }
    });
  });
});
