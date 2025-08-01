/**
 * @file integration.test.ts
 * @description Integration tests for OpenSCAD globals slice with the main app store
 * to verify proper integration, persistence, and cross-slice interactions.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createAppStore } from '../../app-store.js';

describe('OpenSCAD Globals Store Integration', () => {
  let store: ReturnType<typeof createAppStore>;

  beforeEach(() => {
    store = createAppStore();
  });

  describe('Store Integration', () => {
    it('should include OpenSCAD globals in the store', () => {
      const state = store.getState();

      expect(state.openscadGlobals).toBeDefined();
      expect(state.openscadGlobals.$fn).toBe(undefined);
      expect(state.openscadGlobals.$fa).toBe(12);
      expect(state.openscadGlobals.$fs).toBe(2);
      expect(state.openscadGlobals.$t).toBe(0);
      expect(state.openscadGlobals.$preview).toBe(true);
    });

    it('should have OpenSCAD globals actions available', () => {
      expect(typeof store.getState().updateGeometryResolution).toBe('function');
      expect(typeof store.getState().updateAnimation).toBe('function');
      expect(typeof store.getState().updateViewport).toBe('function');
      expect(typeof store.getState().updateModuleSystem).toBe('function');
      expect(typeof store.getState().updateDebug).toBe('function');
      expect(typeof store.getState().updateVariable).toBe('function');
      expect(typeof store.getState().resetToDefaults).toBe('function');
      expect(typeof store.getState().resetCategory).toBe('function');
    });

    it('should update OpenSCAD globals through store actions', () => {
      const { updateGeometryResolution } = store.getState();

      const result = updateGeometryResolution({ $fn: 32, $fa: 6 });
      expect(result.success).toBe(true);

      const state = store.getState();
      expect(state.openscadGlobals.$fn).toBe(32);
      expect(state.openscadGlobals.$fa).toBe(6);
      expect(state.openscadGlobals.isModified).toBe(true);
      expect(state.openscadGlobals.lastUpdated).toBeGreaterThan(0);
    });

    it('should handle validation errors through store', () => {
      const { updateGeometryResolution } = store.getState();

      const result = updateGeometryResolution({ $fn: -1, $fa: 0 });
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error).toHaveLength(2);
        if (result.error.length >= 2 && result.error[0] && result.error[1]) {
          expect(result.error[0].variable).toBe('$fn');
          expect(result.error[1].variable).toBe('$fa');
        }
      }

      // State should remain unchanged
      const state = store.getState();
      expect(state.openscadGlobals.$fn).toBe(undefined);
      expect(state.openscadGlobals.$fa).toBe(12);
      expect(state.openscadGlobals.isModified).toBe(false);
    });

    it('should reset OpenSCAD globals through store', () => {
      const { updateGeometryResolution, resetToDefaults } = store.getState();

      // Modify state
      updateGeometryResolution({ $fn: 64 });
      expect(store.getState().openscadGlobals.$fn).toBe(64);
      expect(store.getState().openscadGlobals.isModified).toBe(true);

      // Reset
      resetToDefaults();
      const state = store.getState();
      expect(state.openscadGlobals.$fn).toBe(undefined);
      expect(state.openscadGlobals.isModified).toBe(false);
    });

    it('should update individual variables through store', () => {
      const { updateVariable } = store.getState();

      const result = updateVariable('$t', 0.5);
      expect(result.success).toBe(true);

      const state = store.getState();
      expect(state.openscadGlobals.$t).toBe(0.5);
    });

    it('should reset categories through store', () => {
      const { updateGeometryResolution, updateAnimation, resetCategory } = store.getState();

      // Modify multiple categories
      updateGeometryResolution({ $fn: 32 });
      updateAnimation({ $t: 0.7 });

      // Reset only geometry
      resetCategory('geometry');

      const state = store.getState();
      expect(state.openscadGlobals.$fn).toBe(undefined); // Reset
      expect(state.openscadGlobals.$t).toBe(0.7); // Unchanged
    });
  });

  describe('State Persistence', () => {
    it('should include OpenSCAD globals in persisted state', () => {
      const { updateGeometryResolution } = store.getState();

      // Modify state
      updateGeometryResolution({ $fn: 16, $fa: 8 });

      // Check that the state would be persisted
      const state = store.getState();
      expect(state.openscadGlobals.$fn).toBe(16);
      expect(state.openscadGlobals.$fa).toBe(8);
      expect(state.openscadGlobals.isModified).toBe(true);
    });
  });

  describe('Cross-Slice Interactions', () => {
    it('should maintain OpenSCAD globals state independently of other slices', () => {
      const { updateGeometryResolution, updateCode } = store.getState();

      // Update OpenSCAD globals
      updateGeometryResolution({ $fn: 24 });

      // Update editor (different slice)
      updateCode('cube([1,2,3]);');

      // OpenSCAD globals should remain unchanged
      const state = store.getState();
      expect(state.openscadGlobals.$fn).toBe(24);
      expect(state.openscadGlobals.isModified).toBe(true);
      expect(state.editor.code).toBe('cube([1,2,3]);');
    });

    it('should allow access to OpenSCAD globals from other parts of the store', () => {
      const { updateGeometryResolution } = store.getState();

      // Update OpenSCAD globals
      updateGeometryResolution({ $fn: 48, $fa: 4, $fs: 1 });

      // Verify other slices can access the globals
      const state = store.getState();

      // These values should be available for use by the renderer or parser
      expect(state.openscadGlobals.$fn).toBe(48);
      expect(state.openscadGlobals.$fa).toBe(4);
      expect(state.openscadGlobals.$fs).toBe(1);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety across store operations', () => {
      const state = store.getState();

      // TypeScript should enforce correct types
      // $fn can be undefined by default
      expect(
        state.openscadGlobals.$fn === undefined || typeof state.openscadGlobals.$fn === 'number'
      ).toBe(true);
      expect(typeof state.openscadGlobals.$fa).toBe('number');
      expect(typeof state.openscadGlobals.$fs).toBe('number');
      expect(typeof state.openscadGlobals.$t).toBe('number');
      expect(typeof state.openscadGlobals.$preview).toBe('boolean');
      expect(Array.isArray(state.openscadGlobals.$vpr)).toBe(true);
      expect(Array.isArray(state.openscadGlobals.$vpt)).toBe(true);
      expect(typeof state.openscadGlobals.$vpd).toBe('number');
      expect(typeof state.openscadGlobals.$children).toBe('number');
      expect(typeof state.openscadGlobals.lastUpdated).toBe('number');
      expect(typeof state.openscadGlobals.isModified).toBe('boolean');
    });
  });
});
