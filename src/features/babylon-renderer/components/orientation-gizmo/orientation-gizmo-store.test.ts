/**
 * @file Orientation Gizmo Store Integration Test Suite
 * @description Comprehensive tests for gizmo state management through Zustand store.
 * Tests all gizmo actions, selectors, and state synchronization patterns.
 *
 * @example Running Tests
 * ```bash
 * pnpm test orientation-gizmo-store.test.ts
 * ```
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { appStoreInstance } from '../../../store/app-store';
import {
  selectGizmoConfig,
  selectGizmoError,
  selectGizmoInteractionState,
  selectGizmoIsAnimating,
  selectGizmoIsInitialized,
  selectGizmoIsVisible,
  selectGizmoLastInteraction,
  selectGizmoPosition,
  selectGizmoSelectedAxis,
  selectGizmoState,
  selectGizmoStats,
} from '../../../store/selectors/store.selectors';
import type { AppStore } from '../../../store/types/store.types';
import type { GizmoConfig, GizmoError } from '../../types/orientation-gizmo.types';
import {
  AxisDirection,
  DEFAULT_GIZMO_CONFIG,
  GizmoErrorCode,
  GizmoPosition,
} from '../../types/orientation-gizmo.types';

describe('OrientationGizmo Store Integration', () => {
  let store: AppStore;

  beforeEach(() => {
    // Get fresh store instance and reset gizmo state
    store = appStoreInstance.getState();
    store.resetGizmo();
  });

  describe('Gizmo State Management', () => {
    it('should initialize with default gizmo state', () => {
      const gizmoState = selectGizmoState(appStoreInstance.getState());

      expect(gizmoState).toBeDefined();
      expect(gizmoState?.isVisible).toBe(true);
      expect(gizmoState?.position).toBe(GizmoPosition.TOP_RIGHT);
      expect(gizmoState?.config).toEqual(expect.objectContaining(DEFAULT_GIZMO_CONFIG));
      expect(gizmoState?.selectedAxis).toBeNull();
      expect(gizmoState?.isInitialized).toBe(false);
      expect(gizmoState?.error).toBeNull();
    });

    it('should update gizmo visibility', () => {
      // Initially visible
      expect(selectGizmoIsVisible(appStoreInstance.getState())).toBe(true);

      // Hide gizmo
      store.setGizmoVisibility(false);
      expect(selectGizmoIsVisible(appStoreInstance.getState())).toBe(false);

      // Show gizmo
      store.setGizmoVisibility(true);
      expect(selectGizmoIsVisible(appStoreInstance.getState())).toBe(true);
    });

    it('should update gizmo position', () => {
      // Test all positions
      const positions = [
        GizmoPosition.TOP_LEFT,
        GizmoPosition.TOP_RIGHT,
        GizmoPosition.BOTTOM_LEFT,
        GizmoPosition.BOTTOM_RIGHT,
      ];

      for (const position of positions) {
        store.setGizmoPosition(position);
        expect(selectGizmoPosition(appStoreInstance.getState())).toBe(position);
      }
    });

    it('should update gizmo configuration', () => {
      const newConfig: Partial<GizmoConfig> = {
        size: 120,
        showSecondary: false,
        colors: {
          x: ['#ff0000', '#cc0000'],
          y: ['#00ff00', '#00cc00'],
          z: ['#0000ff', '#0000cc'],
        },
      };

      store.updateGizmoConfig(newConfig);
      const config = selectGizmoConfig(appStoreInstance.getState());

      expect(config?.size).toBe(120);
      expect(config?.showSecondary).toBe(false);
      expect(config?.colors.x[0]).toBe('#ff0000');

      // Should preserve other config values
      expect(config?.padding).toBe(DEFAULT_GIZMO_CONFIG.padding);
    });

    it('should update selected axis', () => {
      // Initially no axis selected
      expect(selectGizmoSelectedAxis(appStoreInstance.getState())).toBeNull();

      // Select positive X axis
      store.setGizmoSelectedAxis(AxisDirection.POSITIVE_X);
      expect(selectGizmoSelectedAxis(appStoreInstance.getState())).toBe(AxisDirection.POSITIVE_X);

      // Test all axes
      const axes = [
        AxisDirection.POSITIVE_Y,
        AxisDirection.NEGATIVE_Y,
        AxisDirection.POSITIVE_Z,
        AxisDirection.NEGATIVE_Z,
        AxisDirection.NEGATIVE_X,
      ];

      for (const axis of axes) {
        store.setGizmoSelectedAxis(axis);
        expect(selectGizmoSelectedAxis(appStoreInstance.getState())).toBe(axis);
      }

      // Clear selection
      store.setGizmoSelectedAxis(null);
      expect(selectGizmoSelectedAxis(appStoreInstance.getState())).toBeNull();
    });

    it('should track last interaction time', () => {
      // Initially no interaction
      expect(selectGizmoLastInteraction(appStoreInstance.getState())).toBeNull();

      // Select axis should update interaction time
      const beforeTime = new Date();
      store.setGizmoSelectedAxis(AxisDirection.POSITIVE_X);
      const afterTime = new Date();

      const lastInteraction = selectGizmoLastInteraction(appStoreInstance.getState());
      expect(lastInteraction).toBeInstanceOf(Date);
      if (lastInteraction) {
        expect(lastInteraction.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(lastInteraction.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      }
    });
  });

  describe('Animation State Management', () => {
    it('should manage animation state', () => {
      // Initially not animating
      expect(selectGizmoIsAnimating(appStoreInstance.getState())).toBe(false);

      // Start animation
      store.setGizmoAnimating(true);
      expect(selectGizmoIsAnimating(appStoreInstance.getState())).toBe(true);

      // Stop animation
      store.setGizmoAnimating(false);
      expect(selectGizmoIsAnimating(appStoreInstance.getState())).toBe(false);
    });

    it('should set animation start time when starting animation', () => {
      store.setGizmoAnimating(true);

      const gizmoState = selectGizmoState(appStoreInstance.getState());
      const startTime = gizmoState?.cameraAnimation.startTime || 0;

      // Should have a valid start time
      expect(startTime).toBeGreaterThan(0);
    });
  });

  describe('Error State Management', () => {
    it('should manage error state', () => {
      // Initially no error
      expect(selectGizmoError(appStoreInstance.getState())).toBeNull();

      // Set error
      const error: GizmoError = {
        code: GizmoErrorCode.RENDER_FAILED,
        message: 'Test render error',
        timestamp: new Date(),
      };

      store.setGizmoError(error);
      expect(selectGizmoError(appStoreInstance.getState())).toEqual(error);

      // Clear error
      store.setGizmoError(null);
      expect(selectGizmoError(appStoreInstance.getState())).toBeNull();
    });

    it('should handle different error types', () => {
      const errorTypes = [
        GizmoErrorCode.INITIALIZATION_FAILED,
        GizmoErrorCode.CAMERA_NOT_SUPPORTED,
        GizmoErrorCode.CANVAS_NOT_FOUND,
        GizmoErrorCode.ANIMATION_FAILED,
        GizmoErrorCode.RENDER_FAILED,
        GizmoErrorCode.INTERACTION_FAILED,
        GizmoErrorCode.CONFIGURATION_INVALID,
      ];

      for (const errorCode of errorTypes) {
        const error: GizmoError = {
          code: errorCode,
          message: `Test ${errorCode} error`,
          timestamp: new Date(),
        };

        store.setGizmoError(error);
        const storedError = selectGizmoError(appStoreInstance.getState());
        expect(storedError?.code).toBe(errorCode);
      }
    });
  });

  describe('Initialization State', () => {
    it('should manage initialization state', () => {
      // Initially not initialized
      expect(selectGizmoIsInitialized(appStoreInstance.getState())).toBe(false);

      // Initialize
      store.initializeGizmo();
      expect(selectGizmoIsInitialized(appStoreInstance.getState())).toBe(true);

      // Should clear error on initialization
      const error: GizmoError = {
        code: GizmoErrorCode.RENDER_FAILED,
        message: 'Test error',
        timestamp: new Date(),
      };
      store.setGizmoError(error);

      store.initializeGizmo();
      expect(selectGizmoError(appStoreInstance.getState())).toBeNull();
    });

    it('should reset all state', () => {
      // Modify state
      store.setGizmoVisibility(false);
      store.setGizmoPosition(GizmoPosition.BOTTOM_LEFT);
      store.setGizmoSelectedAxis(AxisDirection.POSITIVE_X);
      store.setGizmoAnimating(true);
      store.initializeGizmo();

      // Reset should restore defaults
      store.resetGizmo();

      const gizmoState = selectGizmoState(appStoreInstance.getState());
      expect(gizmoState?.isVisible).toBe(true);
      expect(gizmoState?.position).toBe(GizmoPosition.TOP_RIGHT);
      expect(gizmoState?.selectedAxis).toBeNull();
      expect(gizmoState?.cameraAnimation.isAnimating).toBe(false);
      expect(gizmoState?.isInitialized).toBe(false);
      expect(gizmoState?.error).toBeNull();
    });
  });

  describe('Memoized Selectors', () => {
    it('should provide gizmo stats selector', () => {
      // Set up some state
      store.setGizmoVisibility(true);
      store.initializeGizmo();
      store.setGizmoSelectedAxis(AxisDirection.POSITIVE_Y);

      const stats = selectGizmoStats(appStoreInstance.getState());

      expect(stats.isVisible).toBe(true);
      expect(stats.isInitialized).toBe(true);
      expect(stats.isAnimating).toBe(false);
      expect(stats.hasError).toBe(false);
      expect(stats.selectedAxis).toBe(AxisDirection.POSITIVE_Y);
      expect(stats.lastInteraction).toBeInstanceOf(Date);
    });

    it('should provide interaction state selector', () => {
      // Set up interaction state
      store.setGizmoSelectedAxis(AxisDirection.POSITIVE_Z);
      store.setGizmoAnimating(false);

      const interactionState = selectGizmoInteractionState(appStoreInstance.getState());

      expect(interactionState.selectedAxis).toBe(AxisDirection.POSITIVE_Z);
      expect(interactionState.isAnimating).toBe(false);
      expect(interactionState.canInteract).toBe(false); // No mouse state set
    });

    it('should detect error state in stats', () => {
      const error: GizmoError = {
        code: GizmoErrorCode.ANIMATION_FAILED,
        message: 'Animation failed',
        timestamp: new Date(),
      };

      store.setGizmoError(error);

      // Get fresh state after setting error
      const freshState = appStoreInstance.getState();
      const stats = selectGizmoStats(freshState);
      expect(stats.hasError).toBe(true);
    });
  });

  describe('State Immutability', () => {
    it('should maintain immutable state updates', () => {
      const initialState = selectGizmoState(appStoreInstance.getState());
      const initialConfig = selectGizmoConfig(appStoreInstance.getState());

      // Update configuration
      store.updateGizmoConfig({ size: 150 });

      // Get fresh state after updates
      const freshState = appStoreInstance.getState();
      const newState = selectGizmoState(freshState);
      const newConfig = selectGizmoConfig(freshState);

      // State objects should be different (immutable)
      expect(newState).not.toBe(initialState);
      expect(newConfig).not.toBe(initialConfig);

      // But unchanged properties should be preserved
      expect(newConfig?.padding).toBe(initialConfig?.padding);
      expect(newConfig?.size).toBe(150);
    });

    it('should preserve state structure during updates', () => {
      const _initialState = selectGizmoState(appStoreInstance.getState());

      // Perform various updates
      store.setGizmoVisibility(false);
      store.setGizmoPosition(GizmoPosition.BOTTOM_RIGHT);
      store.setGizmoSelectedAxis(AxisDirection.NEGATIVE_X);

      // Get fresh state after updates
      const freshState = appStoreInstance.getState();
      const updatedState = selectGizmoState(freshState);

      // Structure should remain consistent
      expect(updatedState).toHaveProperty('isVisible');
      expect(updatedState).toHaveProperty('position');
      expect(updatedState).toHaveProperty('config');
      expect(updatedState).toHaveProperty('selectedAxis');
      expect(updatedState).toHaveProperty('mouseState');
      expect(updatedState).toHaveProperty('cameraAnimation');
      expect(updatedState).toHaveProperty('lastInteraction');
      expect(updatedState).toHaveProperty('isInitialized');
      expect(updatedState).toHaveProperty('error');

      // Values should be updated
      expect(updatedState?.isVisible).toBe(false);
      expect(updatedState?.position).toBe(GizmoPosition.BOTTOM_RIGHT);
      expect(updatedState?.selectedAxis).toBe(AxisDirection.NEGATIVE_X);
    });
  });

  describe('Store Performance', () => {
    it('should handle rapid state updates efficiently', () => {
      const startTime = performance.now();

      // Perform many rapid updates
      for (let i = 0; i < 1000; i++) {
        store.setGizmoSelectedAxis(
          i % 2 === 0 ? AxisDirection.POSITIVE_X : AxisDirection.NEGATIVE_X
        );
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly (under 100ms for 1000 updates)
      expect(duration).toBeLessThan(100);
    });

    it('should maintain selector performance', () => {
      // Set up complex state
      store.updateGizmoConfig({
        size: 120,
        colors: {
          x: ['#ff0000', '#cc0000'],
          y: ['#00ff00', '#00cc00'],
          z: ['#0000ff', '#0000cc'],
        },
      });

      const startTime = performance.now();

      // Call selectors many times
      for (let i = 0; i < 1000; i++) {
        selectGizmoStats(appStoreInstance.getState());
        selectGizmoInteractionState(appStoreInstance.getState());
        selectGizmoConfig(appStoreInstance.getState());
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Selectors should be fast (under 50ms for 1000 calls)
      expect(duration).toBeLessThan(50);
    });
  });
});
