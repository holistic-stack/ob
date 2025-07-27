/**
 * @file openscad-globals-slice.test.ts
 * @description Comprehensive tests for OpenSCAD global variables slice ensuring type safety,
 * validation, immutable state updates, and proper error handling following TDD principles.
 *
 * @test_strategy
 * **Validation Testing**: Tests all validation rules for each OpenSCAD variable type
 * **State Management**: Verifies immutable state updates and change tracking
 * **Error Handling**: Tests Result<T,E> patterns and comprehensive error reporting
 * **Integration**: Tests slice integration with Zustand store patterns
 *
 * @coverage_requirements
 * - All validation functions (100% branch coverage)
 * - All slice actions (success and error paths)
 * - State immutability and change detection
 * - Default values and reset functionality
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { createOpenSCADGlobalsSlice, OPENSCAD_DEFAULTS } from './openscad-globals-slice.js';
import type {
  OpenSCADGlobalsActions,
  OpenSCADGlobalsState,
} from './openscad-globals-slice.types.js';

// Mock store state structure
interface MockStoreState {
  openscadGlobals: OpenSCADGlobalsState;
}

type MockStore = MockStoreState & OpenSCADGlobalsActions;

describe('OpenSCADGlobalsSlice', () => {
  let store: ReturnType<typeof create<MockStore>>;

  beforeEach(() => {
    store = create<MockStore>((set, get) => ({
      openscadGlobals: { ...OPENSCAD_DEFAULTS },
      ...createOpenSCADGlobalsSlice(set, get),
    }));
  });

  describe('Initial State', () => {
    it('should initialize with OpenSCAD default values', () => {
      const state = store.getState();

      expect(state.openscadGlobals.$fn).toBe(undefined);
      expect(state.openscadGlobals.$fa).toBe(12);
      expect(state.openscadGlobals.$fs).toBe(2);
      expect(state.openscadGlobals.$t).toBe(0);
      expect(state.openscadGlobals.$vpr).toEqual([55, 0, 25]);
      expect(state.openscadGlobals.$vpt).toEqual([0, 0, 0]);
      expect(state.openscadGlobals.$vpd).toBe(140);
      expect(state.openscadGlobals.$children).toBe(0);
      expect(state.openscadGlobals.$preview).toBe(true);
      expect(state.openscadGlobals.isModified).toBe(false);
    });

    it('should have lastUpdated timestamp', () => {
      const state = store.getState();
      expect(typeof state.openscadGlobals.lastUpdated).toBe('number');
      expect(state.openscadGlobals.lastUpdated).toBe(0);
    });
  });

  describe('Geometry Resolution Validation', () => {
    it('should accept valid $fn values', () => {
      const { updateGeometryResolution } = store.getState();

      const result1 = updateGeometryResolution({ $fn: undefined });
      expect(result1.success).toBe(true);

      const result2 = updateGeometryResolution({ $fn: 0 });
      expect(result2.success).toBe(true);

      const result3 = updateGeometryResolution({ $fn: 32 });
      expect(result3.success).toBe(true);
    });

    it('should reject invalid $fn values', () => {
      const { updateGeometryResolution } = store.getState();

      const result = updateGeometryResolution({ $fn: -1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toHaveLength(1);
        expect(result.error[0].variable).toBe('$fn');
        expect(result.error[0].message).toContain('non-negative number');
      }
    });

    it('should accept valid $fa values', () => {
      const { updateGeometryResolution } = store.getState();

      const result1 = updateGeometryResolution({ $fa: 0.1 });
      expect(result1.success).toBe(true);

      const result2 = updateGeometryResolution({ $fa: 12 });
      expect(result2.success).toBe(true);

      const result3 = updateGeometryResolution({ $fa: 180 });
      expect(result3.success).toBe(true);
    });

    it('should reject invalid $fa values', () => {
      const { updateGeometryResolution } = store.getState();

      const result1 = updateGeometryResolution({ $fa: 0 });
      expect(result1.success).toBe(false);

      const result2 = updateGeometryResolution({ $fa: -5 });
      expect(result2.success).toBe(false);

      const result3 = updateGeometryResolution({ $fa: 181 });
      expect(result3.success).toBe(false);
    });

    it('should accept valid $fs values', () => {
      const { updateGeometryResolution } = store.getState();

      const result1 = updateGeometryResolution({ $fs: 0.1 });
      expect(result1.success).toBe(true);

      const result2 = updateGeometryResolution({ $fs: 2 });
      expect(result2.success).toBe(true);

      const result3 = updateGeometryResolution({ $fs: 100 });
      expect(result3.success).toBe(true);
    });

    it('should reject invalid $fs values', () => {
      const { updateGeometryResolution } = store.getState();

      const result1 = updateGeometryResolution({ $fs: 0 });
      expect(result1.success).toBe(false);

      const result2 = updateGeometryResolution({ $fs: -1 });
      expect(result2.success).toBe(false);
    });
  });

  describe('Animation Validation', () => {
    it('should accept valid $t values', () => {
      const { updateAnimation } = store.getState();

      const result1 = updateAnimation({ $t: 0 });
      expect(result1.success).toBe(true);

      const result2 = updateAnimation({ $t: 0.5 });
      expect(result2.success).toBe(true);

      const result3 = updateAnimation({ $t: 1 });
      expect(result3.success).toBe(true);
    });

    it('should reject invalid $t values', () => {
      const { updateAnimation } = store.getState();

      const result1 = updateAnimation({ $t: -0.1 });
      expect(result1.success).toBe(false);

      const result2 = updateAnimation({ $t: 1.1 });
      expect(result2.success).toBe(false);
    });
  });

  describe('Viewport Validation', () => {
    it('should accept valid viewport values', () => {
      const { updateViewport } = store.getState();

      const result1 = updateViewport({ $vpr: [0, 0, 0] });
      expect(result1.success).toBe(true);

      const result2 = updateViewport({ $vpt: [10, -5, 20] });
      expect(result2.success).toBe(true);

      const result3 = updateViewport({ $vpd: 100 });
      expect(result3.success).toBe(true);
    });

    it('should reject invalid viewport values', () => {
      const { updateViewport } = store.getState();

      const result1 = updateViewport({ $vpr: [1, 2] as any });
      expect(result1.success).toBe(false);

      const result2 = updateViewport({ $vpt: 'invalid' as any });
      expect(result2.success).toBe(false);

      const result3 = updateViewport({ $vpd: 0 });
      expect(result3.success).toBe(false);

      const result4 = updateViewport({ $vpd: -10 });
      expect(result4.success).toBe(false);
    });
  });

  describe('Module System Validation', () => {
    it('should accept valid $children values', () => {
      const { updateModuleSystem } = store.getState();

      const result1 = updateModuleSystem({ $children: 0 });
      expect(result1.success).toBe(true);

      const result2 = updateModuleSystem({ $children: 5 });
      expect(result2.success).toBe(true);
    });

    it('should reject invalid $children values', () => {
      const { updateModuleSystem } = store.getState();

      const result1 = updateModuleSystem({ $children: -1 });
      expect(result1.success).toBe(false);

      const result2 = updateModuleSystem({ $children: 1.5 });
      expect(result2.success).toBe(false);
    });
  });

  describe('Debug Validation', () => {
    it('should accept valid $preview values', () => {
      const { updateDebug } = store.getState();

      const result1 = updateDebug({ $preview: true });
      expect(result1.success).toBe(true);

      const result2 = updateDebug({ $preview: false });
      expect(result2.success).toBe(true);
    });

    it('should reject invalid $preview values', () => {
      const { updateDebug } = store.getState();

      const result = updateDebug({ $preview: 'true' as any });
      expect(result.success).toBe(false);
    });
  });

  describe('State Updates', () => {
    it('should update state and track modifications', () => {
      const { updateGeometryResolution } = store.getState();

      const result = updateGeometryResolution({ $fn: 32 });
      expect(result.success).toBe(true);

      const state = store.getState();
      expect(state.openscadGlobals.$fn).toBe(32);
      expect(state.openscadGlobals.isModified).toBe(true);
      expect(state.openscadGlobals.lastUpdated).toBeGreaterThan(0);
    });

    it('should maintain immutability', () => {
      const initialState = store.getState();
      const { updateGeometryResolution } = store.getState();

      updateGeometryResolution({ $fn: 16 });

      const newState = store.getState();
      expect(newState).not.toBe(initialState);
      expect(newState.openscadGlobals.$fn).toBe(16);
      expect(initialState.openscadGlobals.$fn).toBe(undefined);
    });
  });

  describe('Individual Variable Updates', () => {
    it('should update individual variables', () => {
      const { updateVariable } = store.getState();

      const result = updateVariable('$fn', 24);
      expect(result.success).toBe(true);

      const state = store.getState();
      expect(state.openscadGlobals.$fn).toBe(24);
    });

    it('should validate individual variable updates', () => {
      const { updateVariable } = store.getState();

      const result = updateVariable('$fa', -1);
      expect(result.success).toBe(false);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to defaults', () => {
      const { updateGeometryResolution, resetToDefaults } = store.getState();

      // Modify state
      updateGeometryResolution({ $fn: 32, $fa: 6 });
      expect(store.getState().openscadGlobals.$fn).toBe(32);
      expect(store.getState().openscadGlobals.isModified).toBe(true);

      // Reset
      resetToDefaults();
      const state = store.getState();
      expect(state.openscadGlobals.$fn).toBe(OPENSCAD_DEFAULTS.$fn);
      expect(state.openscadGlobals.$fa).toBe(OPENSCAD_DEFAULTS.$fa);
      expect(state.openscadGlobals.isModified).toBe(false);
    });

    it('should reset specific categories', () => {
      const { updateGeometryResolution, updateAnimation, resetCategory } = store.getState();

      // Modify multiple categories
      updateGeometryResolution({ $fn: 32 });
      updateAnimation({ $t: 0.5 });

      // Reset only geometry
      resetCategory('geometry');

      const state = store.getState();
      expect(state.openscadGlobals.$fn).toBe(OPENSCAD_DEFAULTS.$fn);
      expect(state.openscadGlobals.$t).toBe(0.5); // Should remain unchanged
    });
  });

  describe('Multiple Validation Errors', () => {
    it('should return multiple validation errors', () => {
      const { updateGeometryResolution } = store.getState();

      const result = updateGeometryResolution({ $fn: -1, $fa: 0, $fs: -2 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toHaveLength(3);
        expect(result.error.map((e) => e.variable)).toEqual(['$fn', '$fa', '$fs']);
      }
    });
  });
});
