/**
 * @file openscad-globals.constants.test.ts
 * @description Comprehensive tests for OpenSCAD global variable constants and utility functions.
 * Validates that constants match OpenSCAD specification and utility functions work correctly.
 */

import { describe, expect, it } from 'vitest';
import {
  calculateFragments,
  isValidTessellationValue,
  OPENSCAD_DEBUG,
  OPENSCAD_GLOBALS,
  OPENSCAD_MODULE_SYSTEM,
  OPENSCAD_TESSELLATION,
  OPENSCAD_VIEWPORT,
  type OpenSCADGlobalsConstants,
  type OpenSCADTessellationConstants,
  type OpenSCADViewportConstants,
} from './openscad-globals.constants';

describe('OpenSCAD Global Constants', () => {
  describe('OPENSCAD_GLOBALS', () => {
    it('should have correct default values matching OpenSCAD specification', () => {
      expect(OPENSCAD_GLOBALS.DEFAULT_FN).toBe(0);
      expect(OPENSCAD_GLOBALS.DEFAULT_FA).toBe(12);
      expect(OPENSCAD_GLOBALS.DEFAULT_FS).toBe(2);
      expect(OPENSCAD_GLOBALS.DEFAULT_T).toBe(0);
    });

    it('should be immutable (frozen)', () => {
      expect(Object.isFrozen(OPENSCAD_GLOBALS)).toBe(true);

      // Attempt to modify should throw in strict mode (which is enabled in our project)
      expect(() => {
        (OPENSCAD_GLOBALS as any).DEFAULT_FA = 999;
      }).toThrow();

      // Value should remain unchanged
      expect(OPENSCAD_GLOBALS.DEFAULT_FA).toBe(12);
    });

    it('should have correct TypeScript types', () => {
      // Type assertions to ensure proper typing
      const globals: OpenSCADGlobalsConstants = OPENSCAD_GLOBALS;
      expect(globals.DEFAULT_FN).toBe(0);
      expect(globals.DEFAULT_FA).toBe(12);
      expect(globals.DEFAULT_FS).toBe(2);
      expect(globals.DEFAULT_T).toBe(0);
    });
  });

  describe('OPENSCAD_TESSELLATION', () => {
    it('should contain tessellation-specific constants', () => {
      expect(OPENSCAD_TESSELLATION.FN).toBe(0);
      expect(OPENSCAD_TESSELLATION.FA).toBe(12);
      expect(OPENSCAD_TESSELLATION.FS).toBe(2);
    });

    it('should match values from main OPENSCAD_GLOBALS', () => {
      expect(OPENSCAD_TESSELLATION.FN).toBe(OPENSCAD_GLOBALS.DEFAULT_FN);
      expect(OPENSCAD_TESSELLATION.FA).toBe(OPENSCAD_GLOBALS.DEFAULT_FA);
      expect(OPENSCAD_TESSELLATION.FS).toBe(OPENSCAD_GLOBALS.DEFAULT_FS);
    });

    it('should be immutable', () => {
      expect(Object.isFrozen(OPENSCAD_TESSELLATION)).toBe(true);
    });

    it('should have correct TypeScript types', () => {
      const tessellation: OpenSCADTessellationConstants = OPENSCAD_TESSELLATION;
      expect(tessellation.FN).toBe(0);
      expect(tessellation.FA).toBe(12);
      expect(tessellation.FS).toBe(2);
    });
  });

  describe('OPENSCAD_VIEWPORT', () => {
    it('should have correct viewport default values', () => {
      expect(OPENSCAD_VIEWPORT.ROTATION).toEqual([55, 0, 25]);
      expect(OPENSCAD_VIEWPORT.TRANSLATION).toEqual([0, 0, 0]);
      expect(OPENSCAD_VIEWPORT.DISTANCE).toBe(140);
    });

    it('should be immutable', () => {
      expect(Object.isFrozen(OPENSCAD_VIEWPORT)).toBe(true);

      // Arrays are readonly via TypeScript but not frozen at runtime
      // This is expected behavior with 'as const' assertions
      expect(Array.isArray(OPENSCAD_VIEWPORT.ROTATION)).toBe(true);
      expect(Array.isArray(OPENSCAD_VIEWPORT.TRANSLATION)).toBe(true);
    });

    it('should have correct TypeScript types', () => {
      const viewport: OpenSCADViewportConstants = OPENSCAD_VIEWPORT;
      expect(viewport.ROTATION).toEqual([55, 0, 25]);
      expect(viewport.TRANSLATION).toEqual([0, 0, 0]);
      expect(viewport.DISTANCE).toBe(140);
    });
  });

  describe('OPENSCAD_MODULE_SYSTEM', () => {
    it('should have correct module system defaults', () => {
      expect(OPENSCAD_MODULE_SYSTEM.CHILDREN).toBe(0);
    });

    it('should be immutable', () => {
      expect(Object.isFrozen(OPENSCAD_MODULE_SYSTEM)).toBe(true);
    });
  });

  describe('OPENSCAD_DEBUG', () => {
    it('should have correct debug defaults', () => {
      expect(OPENSCAD_DEBUG.PREVIEW).toBe(true);
    });

    it('should be immutable', () => {
      expect(Object.isFrozen(OPENSCAD_DEBUG)).toBe(true);
    });
  });
});

describe('calculateFragments utility function', () => {
  describe('with $fn specified (overrides $fa and $fs)', () => {
    it('should use $fn when >= 3', () => {
      expect(calculateFragments(10, 5, 12, 2)).toBe(5);
      expect(calculateFragments(10, 8, 30, 5)).toBe(8);
      expect(calculateFragments(100, 16, 6, 1)).toBe(16);
    });

    it('should ignore $fn when < 3 and use $fa/$fs calculation', () => {
      expect(calculateFragments(10, 0, 12, 2)).toBe(30); // min(30, 32) = 30
      expect(calculateFragments(10, 1, 12, 2)).toBe(30); // min(30, 32) = 30
      expect(calculateFragments(10, 2, 12, 2)).toBe(30); // min(30, 32) = 30
    });
  });

  describe('with $fa and $fs calculation', () => {
    it('should use minimum of $fa and $fs calculations', () => {
      // Test case where $fa gives fewer fragments
      // $fa: 360/30 = 12, $fs: ceil(2π*10/2) = ceil(31.42) = 32
      expect(calculateFragments(10, 0, 30, 2)).toBe(12); // min(12, 32) = 12

      // Test case where $fs gives fewer fragments
      // $fa: 360/12 = 30, $fs: ceil(2π*10/5) = ceil(12.57) = 13
      expect(calculateFragments(10, 0, 12, 5)).toBe(13); // min(30, 13) = 13

      // Test with OpenSCAD defaults
      // $fa: 360/12 = 30, $fs: ceil(2π*10/2) = ceil(31.42) = 32
      expect(calculateFragments(10, 0, 12, 2)).toBe(30); // min(30, 32) = 30
    });
  });

  describe('with default parameters', () => {
    it('should use OpenSCAD defaults when no parameters provided', () => {
      const result = calculateFragments(10);
      const expected = calculateFragments(10, 0, 12, 2); // Using explicit defaults
      expect(result).toBe(expected);
      expect(result).toBe(30); // min(360/12, 2π*10/2) = min(30, 32) = 30
    });
  });

  describe('edge cases and validation', () => {
    it('should ensure minimum of 3 fragments', () => {
      // Very large $fa and $fs should still give at least 3 fragments
      expect(calculateFragments(0.1, 0, 180, 10)).toBe(3);
      expect(calculateFragments(0.01, 0, 360, 100)).toBe(3);
    });

    it('should handle very small radii', () => {
      expect(calculateFragments(0.1, 0, 12, 2)).toBeGreaterThanOrEqual(3);
      expect(calculateFragments(0.01, 0, 12, 2)).toBeGreaterThanOrEqual(3);
    });

    it('should handle very large radii', () => {
      // For large radius with small $fs, $fs calculation should dominate
      const result = calculateFragments(1000, 0, 12, 2);
      // $fa gives 30 fragments (360/12), $fs gives ~3142 fragments (2π*1000/2)
      // min(30, 3142) = 30, so $fa dominates for this case
      expect(result).toBe(30);
      expect(Number.isInteger(result)).toBe(true);

      // Test case where $fs dominates with smaller $fs
      const resultFs = calculateFragments(1000, 0, 360, 10);
      // $fa gives 1 fragment (360/360), $fs gives ~629 fragments (2π*1000/10)
      // min(1, 629) = 1, but minimum is 3, so result should be 3
      expect(resultFs).toBe(3);
    });
  });
});

describe('isValidTessellationValue utility function', () => {
  describe('$fn validation', () => {
    it('should accept valid $fn values', () => {
      expect(isValidTessellationValue(0, 'fn')).toBe(true);
      expect(isValidTessellationValue(3, 'fn')).toBe(true);
      expect(isValidTessellationValue(16, 'fn')).toBe(true);
      expect(isValidTessellationValue(100, 'fn')).toBe(true);
    });

    it('should reject invalid $fn values', () => {
      expect(isValidTessellationValue(-1, 'fn')).toBe(false);
      expect(isValidTessellationValue(3.5, 'fn')).toBe(false);
      expect(isValidTessellationValue(NaN, 'fn')).toBe(false);
      expect(isValidTessellationValue(Infinity, 'fn')).toBe(false);
    });
  });

  describe('$fa validation', () => {
    it('should accept valid $fa values', () => {
      expect(isValidTessellationValue(0.1, 'fa')).toBe(true);
      expect(isValidTessellationValue(12, 'fa')).toBe(true);
      expect(isValidTessellationValue(360, 'fa')).toBe(true);
    });

    it('should reject invalid $fa values', () => {
      expect(isValidTessellationValue(0, 'fa')).toBe(false);
      expect(isValidTessellationValue(-1, 'fa')).toBe(false);
      expect(isValidTessellationValue(361, 'fa')).toBe(false);
      expect(isValidTessellationValue(NaN, 'fa')).toBe(false);
    });
  });

  describe('$fs validation', () => {
    it('should accept valid $fs values', () => {
      expect(isValidTessellationValue(0.1, 'fs')).toBe(true);
      expect(isValidTessellationValue(2, 'fs')).toBe(true);
      expect(isValidTessellationValue(100, 'fs')).toBe(true);
    });

    it('should reject invalid $fs values', () => {
      expect(isValidTessellationValue(0, 'fs')).toBe(false);
      expect(isValidTessellationValue(-1, 'fs')).toBe(false);
      expect(isValidTessellationValue(NaN, 'fs')).toBe(false);
    });
  });
});
