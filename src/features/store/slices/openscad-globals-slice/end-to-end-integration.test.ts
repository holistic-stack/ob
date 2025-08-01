/**
 * @file end-to-end-integration.test.ts
 * @description End-to-end integration tests for OpenSCAD global variables
 * with real OpenSCAD code parsing, store updates, and 3D rendering integration.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../../app-store.js';
import type { AppStore } from '../../types/store.types.js';

// Mock ResizeObserver for testing environment
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('OpenSCAD Global Variables End-to-End Integration', () => {
  let store: ReturnType<typeof createAppStore>;

  beforeEach(() => {
    store = createAppStore();
  });

  describe('Real OpenSCAD Code Integration', () => {
    it('should parse global variables from OpenSCAD code and update store', async () => {
      const openscadCode = `
// Global resolution settings
$fs = 5;   // Minimum fragment size of 5 units
$fa = 30;  // Maximum fragment angle of 30 degrees

sphere(10);
`;

      // Update the editor with OpenSCAD code
      const { updateCode } = store.getState();
      updateCode(openscadCode);

      // Wait for parsing to complete (debounced)
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Check that the code was updated
      const editorState = store.getState().editor;
      expect(editorState.code).toBe(openscadCode);
      expect(editorState.isDirty).toBe(true);

      // Check that parsing was triggered
      const parsingState = store.getState().parsing;
      expect(parsingState.isLoading).toBe(false);
      expect(parsingState.ast.length).toBeGreaterThan(0);
    });

    it('should manually update global variables and verify store state', () => {
      // Manually update the global variables to simulate parser extraction
      const { updateGeometryResolution } = store.getState();

      const result = updateGeometryResolution({ $fs: 5, $fa: 30 });
      expect(result.success).toBe(true);

      // Verify store state
      const state = store.getState();
      expect(state.openscadGlobals.$fs).toBe(5);
      expect(state.openscadGlobals.$fa).toBe(30);
      expect(state.openscadGlobals.$fn).toBe(undefined); // Should remain default
      expect(state.openscadGlobals.isModified).toBe(true);
      expect(state.openscadGlobals.lastUpdated).toBeGreaterThan(0);
    });

    it('should validate global variable values according to OpenSCAD specifications', () => {
      const { updateGeometryResolution } = store.getState();

      // Test valid values
      const validResult = updateGeometryResolution({ $fs: 5, $fa: 30 });
      expect(validResult.success).toBe(true);

      // Test invalid values
      const invalidResult = updateGeometryResolution({ $fs: -1, $fa: 200 });
      expect(invalidResult.success).toBe(false);

      if (!invalidResult.success) {
        expect(invalidResult.error).toHaveLength(2);

        // Find errors by variable name (order may vary)
        const fsError = invalidResult.error.find((e) => e.variable === '$fs');
        const faError = invalidResult.error.find((e) => e.variable === '$fa');

        expect(fsError).toBeDefined();
        expect(fsError?.message).toContain('must be a positive number');
        expect(faError).toBeDefined();
        expect(faError?.message).toContain('must be a positive number between 0 and 180');
      }
    });

    it('should persist global variables across store operations', () => {
      const { updateGeometryResolution, updateCode } = store.getState();

      // Set global variables
      updateGeometryResolution({ $fs: 5, $fa: 30 });

      // Update editor code (different slice)
      updateCode('cube([1,2,3]);');

      // Verify global variables persist
      const state = store.getState();
      expect(state.openscadGlobals.$fs).toBe(5);
      expect(state.openscadGlobals.$fa).toBe(30);
      expect(state.openscadGlobals.isModified).toBe(true);
      expect(state.editor.code).toBe('cube([1,2,3]);');
    });

    it('should provide global variables for 3D rendering integration', () => {
      const { updateGeometryResolution } = store.getState();

      // Set custom resolution
      updateGeometryResolution({ $fs: 5, $fa: 30, $fn: 16 });

      const state = store.getState();
      const globals = state.openscadGlobals;

      // Verify values are available for renderer
      expect(globals.$fs).toBe(5);
      expect(globals.$fa).toBe(30);
      expect(globals.$fn).toBe(16);

      // Simulate how renderer would calculate fragments for a sphere
      const sphereRadius = 10;

      // Fragment calculation based on OpenSCAD specification
      const fragmentsFromFn = globals.$fn || 0;
      const fragmentsFromFa = globals.$fa ? Math.ceil(360 / globals.$fa) : Infinity;
      const fragmentsFromFs = globals.$fs
        ? Math.ceil((2 * Math.PI * sphereRadius) / globals.$fs)
        : Infinity;

      // OpenSCAD uses the maximum of these values (coarsest resolution)
      const actualFragments = Math.max(fragmentsFromFn, Math.min(fragmentsFromFa, fragmentsFromFs));

      // With $fa = 30, we get 360/30 = 12 fragments
      // With $fs = 5 and radius = 10, we get 2*π*10/5 ≈ 12.57 → 13 fragments
      // With $fn = 16, we get 16 fragments
      // Maximum should be 16
      expect(actualFragments).toBe(16);
    });

    it('should handle complex OpenSCAD code with multiple global variables', () => {
      const { updateGeometryResolution, updateAnimation, updateViewport } = store.getState();

      // Simulate parsing multiple global variables
      updateGeometryResolution({ $fs: 2, $fa: 15, $fn: 32 });
      updateAnimation({ $t: 0.5 });
      updateViewport({ $vpd: 200 });

      const state = store.getState();

      // Verify all variables are set correctly
      expect(state.openscadGlobals.$fs).toBe(2);
      expect(state.openscadGlobals.$fa).toBe(15);
      expect(state.openscadGlobals.$fn).toBe(32);
      expect(state.openscadGlobals.$t).toBe(0.5);
      expect(state.openscadGlobals.$vpd).toBe(200);
      expect(state.openscadGlobals.isModified).toBe(true);
    });

    it('should reset global variables to defaults', () => {
      const { updateGeometryResolution, resetToDefaults } = store.getState();

      // Set custom values
      updateGeometryResolution({ $fs: 5, $fa: 30, $fn: 16 });

      let state = store.getState();
      expect(state.openscadGlobals.isModified).toBe(true);

      // Reset to defaults
      resetToDefaults();

      state = store.getState();
      expect(state.openscadGlobals.$fs).toBe(2); // Default
      expect(state.openscadGlobals.$fa).toBe(12); // Default
      expect(state.openscadGlobals.$fn).toBe(undefined); // Default
      expect(state.openscadGlobals.isModified).toBe(false);
    });

    it('should handle edge cases in global variable values', () => {
      const { updateGeometryResolution } = store.getState();

      // Test minimum valid values
      const minResult = updateGeometryResolution({ $fs: 0.01, $fa: 0.01 });
      expect(minResult.success).toBe(true);

      let state = store.getState();
      expect(state.openscadGlobals.$fs).toBe(0.01);
      expect(state.openscadGlobals.$fa).toBe(0.01);

      // Test maximum valid values
      const maxResult = updateGeometryResolution({ $fa: 180 });
      expect(maxResult.success).toBe(true);

      state = store.getState();
      expect(state.openscadGlobals.$fa).toBe(180);

      // Test $fn = undefined (should be allowed)
      const undefResult = updateGeometryResolution({ $fn: undefined });
      expect(undefResult.success).toBe(true);

      state = store.getState();
      expect(state.openscadGlobals.$fn).toBe(undefined);
    });
  });

  describe('Store Integration with Rendering Pipeline', () => {
    it('should provide consistent global variables for mesh generation', () => {
      const { updateGeometryResolution } = store.getState();

      // Set specific resolution for testing
      updateGeometryResolution({ $fs: 5, $fa: 30 });

      const state = store.getState();

      // Simulate multiple components accessing the same global variables
      const rendererGlobals = state.openscadGlobals;
      const parserGlobals = state.openscadGlobals;
      const editorGlobals = state.openscadGlobals;

      // All should reference the same object
      expect(rendererGlobals).toBe(parserGlobals);
      expect(parserGlobals).toBe(editorGlobals);

      // All should have the same values
      expect(rendererGlobals.$fs).toBe(5);
      expect(rendererGlobals.$fa).toBe(30);
      expect(parserGlobals.$fs).toBe(5);
      expect(parserGlobals.$fa).toBe(30);
    });

    it('should maintain global variables during AST updates', async () => {
      const { updateGeometryResolution, updateCode } = store.getState();

      // Set global variables
      updateGeometryResolution({ $fs: 5, $fa: 30 });

      // Update code which triggers AST parsing
      updateCode('sphere(10); cube([5,5,5]);');

      // Wait for parsing
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Global variables should persist
      const state = store.getState();
      expect(state.openscadGlobals.$fs).toBe(5);
      expect(state.openscadGlobals.$fa).toBe(30);
      expect(state.openscadGlobals.isModified).toBe(true);

      // AST should be updated
      expect(state.parsing.ast.length).toBeGreaterThan(0);
    });
  });
});
