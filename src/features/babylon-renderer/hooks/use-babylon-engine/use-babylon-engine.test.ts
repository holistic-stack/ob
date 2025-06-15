/**
 * @file Babylon Engine Hook Tests
 * 
 * TDD tests for refactored Babylon.js engine hook
 * Following React 19 best practices and functional programming principles
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as BABYLON from '@babylonjs/core';
import { useBabylonEngine } from './use-babylon-engine';
import type { BabylonEngineConfig } from '../../types/babylon-types';

// Mock canvas for testing
const createMockCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  return canvas;
};

describe('useBabylonEngine', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    console.log('[INIT] Setting up engine hook tests');
    canvas = createMockCanvas();
  });

  afterEach(() => {
    console.log('[END] Cleaning up engine hook tests');
    // Cleanup will be handled by the hook's dispose function
  });

  describe('engine creation and lifecycle', () => {
    it('should create engine with default configuration', () => {
      console.log('[DEBUG] Testing engine hook with defaults');
      
      const { result } = renderHook(() => useBabylonEngine(canvas));
      
      expect(result.current.engine).toBeInstanceOf(BABYLON.NullEngine);
      expect(result.current.isReady).toBe(true);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.dispose).toBe('function');
    });

    it('should create engine with custom configuration', () => {
      console.log('[DEBUG] Testing engine hook with custom config');
      
      const config: BabylonEngineConfig = {
        antialias: false,
        preserveDrawingBuffer: false,
        stencil: false,
        powerPreference: 'low-power'
      };
      
      const { result } = renderHook(() => useBabylonEngine(canvas, config));
      
      expect(result.current.engine).toBeInstanceOf(BABYLON.NullEngine);
      expect(result.current.isReady).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle null canvas gracefully', () => {
      console.log('[DEBUG] Testing engine hook with null canvas');
      
      const { result } = renderHook(() => useBabylonEngine(null));
      
      // In test environment, should still create NullEngine
      expect(result.current.engine).toBeInstanceOf(BABYLON.NullEngine);
      expect(result.current.isReady).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle canvas changes', () => {
      console.log('[DEBUG] Testing engine hook with canvas changes');
      
      const { result, rerender } = renderHook(
        ({ canvas }) => useBabylonEngine(canvas),
        { initialProps: { canvas } }
      );
      
      const firstEngine = result.current.engine;
      expect(firstEngine).toBeInstanceOf(BABYLON.NullEngine);
      
      // Change canvas
      const newCanvas = createMockCanvas();
      rerender({ canvas: newCanvas });
      
      // Should create new engine
      expect(result.current.engine).toBeInstanceOf(BABYLON.NullEngine);
      expect(result.current.engine).not.toBe(firstEngine);
    });
  });

  describe('dispose functionality', () => {
    it('should dispose engine when dispose is called', () => {
      console.log('[DEBUG] Testing engine disposal');
      
      const { result } = renderHook(() => useBabylonEngine(canvas));
      
      const engine = result.current.engine;
      expect(engine?.isDisposed).toBeFalsy();
      
      act(() => {
        result.current.dispose();
      });
      
      expect(engine?.isDisposed).toBe(true);
      expect(result.current.engine).toBeNull();
      expect(result.current.isReady).toBe(false);
    });

    it('should dispose engine on unmount', () => {
      console.log('[DEBUG] Testing engine disposal on unmount');
      
      const { result, unmount } = renderHook(() => useBabylonEngine(canvas));
      
      const engine = result.current.engine;
      expect(engine?.isDisposed).toBeFalsy();
      
      unmount();
      
      expect(engine?.isDisposed).toBe(true);
    });

    it('should handle multiple dispose calls safely', () => {
      console.log('[DEBUG] Testing multiple dispose calls');
      
      const { result } = renderHook(() => useBabylonEngine(canvas));
      
      act(() => {
        result.current.dispose();
        result.current.dispose(); // Should not throw
      });
      
      expect(result.current.engine).toBeNull();
      expect(result.current.isReady).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle engine creation errors gracefully', () => {
      console.log('[DEBUG] Testing engine creation error handling');

      // Create invalid canvas object
      const invalidCanvas = {} as HTMLCanvasElement;

      const { result } = renderHook(() => useBabylonEngine(invalidCanvas));

      // Should handle error gracefully
      expect(result.current.engine).toBeNull();
      expect(result.current.isReady).toBe(false);
      expect(result.current.error).toContain('Failed to create engine');
    });

    it('should maintain consistent state during errors', () => {
      console.log('[DEBUG] Testing state consistency during errors');
      
      const { result } = renderHook(() => useBabylonEngine(canvas));
      
      // Initial state should be consistent
      expect(result.current.engine).toBeInstanceOf(BABYLON.NullEngine);
      expect(result.current.isReady).toBe(true);
      expect(result.current.error).toBeNull();
      
      // Dispose and check state
      act(() => {
        result.current.dispose();
      });
      
      expect(result.current.engine).toBeNull();
      expect(result.current.isReady).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('resize handling', () => {
    it('should handle window resize events', () => {
      console.log('[DEBUG] Testing resize handling');
      
      const { result } = renderHook(() => useBabylonEngine(canvas));
      
      const engine = result.current.engine;
      expect(engine).toBeInstanceOf(BABYLON.NullEngine);
      
      // Simulate window resize
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      // Engine should still be valid
      expect(result.current.engine).toBe(engine);
      expect(result.current.isReady).toBe(true);
    });

    it('should not handle resize after disposal', () => {
      console.log('[DEBUG] Testing resize after disposal');
      
      const { result } = renderHook(() => useBabylonEngine(canvas));
      
      act(() => {
        result.current.dispose();
      });
      
      // Simulate window resize after disposal
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      // Should remain disposed
      expect(result.current.engine).toBeNull();
      expect(result.current.isReady).toBe(false);
    });
  });

  describe('configuration changes', () => {
    it('should recreate engine when configuration changes', () => {
      console.log('[DEBUG] Testing configuration changes');
      
      const initialConfig: BabylonEngineConfig = { antialias: true };
      
      const { result, rerender } = renderHook(
        ({ config }) => useBabylonEngine(canvas, config),
        { initialProps: { config: initialConfig } }
      );
      
      const firstEngine = result.current.engine;
      expect(firstEngine).toBeInstanceOf(BABYLON.NullEngine);
      
      // Change configuration
      const newConfig: BabylonEngineConfig = { antialias: false };
      rerender({ config: newConfig });
      
      // Should create new engine with new config
      expect(result.current.engine).toBeInstanceOf(BABYLON.NullEngine);
      expect(result.current.engine).not.toBe(firstEngine);
      expect(firstEngine?.isDisposed).toBe(true);
    });

    it('should not recreate engine for same configuration', () => {
      console.log('[DEBUG] Testing same configuration stability');
      
      const config: BabylonEngineConfig = { antialias: true };
      
      const { result, rerender } = renderHook(
        ({ config }) => useBabylonEngine(canvas, config),
        { initialProps: { config } }
      );
      
      const firstEngine = result.current.engine;
      
      // Rerender with same config
      rerender({ config });
      
      // Should keep same engine
      expect(result.current.engine).toBe(firstEngine);
      expect(result.current.engine?.isDisposed).toBeFalsy();
    });
  });
});
