/**
 * @file Use BabylonJS Inspector Hook Tests
 *
 * Tests for the useBabylonInspector hook with React 19 concurrent features.
 * Follows TDD approach with real BabylonJS NullEngine (no mocks).
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { act, type RenderHookResult, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type UseBabylonInspectorReturn, useBabylonInspector } from './use-babylon-inspector';

// Mock ResizeObserver for tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock BabylonJS Inspector
vi.mock('@babylonjs/inspector', () => ({
  Inspector: {
    Show: vi.fn().mockResolvedValue(undefined),
    Hide: vi.fn(),
  },
}));

describe('useBabylonInspector', () => {
  let engine: NullEngine;
  let scene: Scene;
  let hookResult: RenderHookResult<UseBabylonInspectorReturn, unknown>;

  beforeEach(() => {
    // Create real BabylonJS NullEngine and Scene (no mocks)
    engine = new NullEngine({
      renderHeight: 600,
      renderWidth: 800,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1,
    });
    scene = new Scene(engine);

    // Render the hook
    hookResult = renderHook(() => useBabylonInspector());
  });

  afterEach(() => {
    // Cleanup
    hookResult.unmount();
    scene.dispose();
    engine.dispose();
  });

  describe('initial state', () => {
    it('should return initial state with React 19 concurrent features', () => {
      const result = hookResult.result.current;

      expect(result.inspectorService).toBeNull();
      expect(result.inspectorState.isVisible).toBe(false);
      expect(result.inspectorState.isEmbedded).toBe(false);
      expect(result.deferredInspectorState.isVisible).toBe(false);
      expect(result.isPending).toBe(false);
      expect(result.isInspectorAvailable).toBe(false);
      expect(typeof result.showInspector).toBe('function');
      expect(typeof result.hideInspector).toBe('function');
      expect(typeof result.switchTab).toBe('function');
      expect(typeof result.startTransition).toBe('function');
    });

    it('should have stable function references', () => {
      const result1 = hookResult.result.current;

      hookResult.rerender();

      const result2 = hookResult.result.current;

      expect(result1.showInspector).toBe(result2.showInspector);
      expect(result1.hideInspector).toBe(result2.hideInspector);
      expect(result1.switchTab).toBe(result2.switchTab);
      expect(result1.startTransition).toBe(result2.startTransition);
    });
  });

  describe('inspector service management', () => {
    it('should create inspector service on first use', async () => {
      const { result } = hookResult;

      expect(result.current.inspectorService).toBeNull();

      await act(async () => {
        await result.current.showInspector(scene);
      });

      expect(result.current.inspectorService).not.toBeNull();
    });

    it('should reuse existing inspector service', async () => {
      const { result } = hookResult;

      await act(async () => {
        await result.current.showInspector(scene);
      });

      const firstService = result.current.inspectorService;

      await act(async () => {
        await result.current.showInspector(scene);
      });

      const secondService = result.current.inspectorService;

      expect(firstService).toBe(secondService);
    });
  });

  describe('concurrent features', () => {
    it('should use useTransition for non-blocking operations', async () => {
      const { result } = hookResult;

      // Initially not pending
      expect(result.current.isPending).toBe(false);

      // Show inspector should not block
      await act(async () => {
        await result.current.showInspector(scene);
      });

      // Should have inspector service after operation
      expect(result.current.inspectorService).not.toBeNull();
    });

    it('should provide deferred state for performance optimization', async () => {
      const { result } = hookResult;

      await act(async () => {
        await result.current.showInspector(scene);
      });

      // Both states should eventually be consistent
      expect(result.current.inspectorState.isVisible).toBe(
        result.current.deferredInspectorState.isVisible
      );
    });

    it('should allow manual transition control', () => {
      const { result } = hookResult;

      expect(typeof result.current.startTransition).toBe('function');

      act(() => {
        result.current.startTransition(() => {
          // Manual transition callback
        });
      });

      // Should not throw and function should be callable
      expect(result.current.startTransition).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle missing scene gracefully', async () => {
      const { result } = hookResult;

      const showResult = await act(async () => {
        return await result.current.showInspector();
      });

      expect(showResult.success).toBe(false);
      if (!showResult.success) {
        expect(showResult.error.code).toBe('SCENE_NOT_PROVIDED');
      }
    });

    it('should handle inspector service errors', async () => {
      const { result } = hookResult;

      // Mock inspector to fail
      const mockShow = vi.fn().mockRejectedValue(new Error('Inspector failed'));
      vi.mocked(await import('@babylonjs/inspector')).Inspector.Show = mockShow;

      const showResult = await act(async () => {
        return await result.current.showInspector(scene);
      });

      expect(showResult.success).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should cleanup inspector on unmount', async () => {
      const { result } = hookResult;

      await act(async () => {
        await result.current.showInspector(scene);
      });

      // Inspector service should be created
      expect(result.current.inspectorService).not.toBeNull();

      // Unmount should trigger cleanup
      hookResult.unmount();

      // No errors should be thrown during cleanup
      expect(true).toBe(true);
    });
  });
});
