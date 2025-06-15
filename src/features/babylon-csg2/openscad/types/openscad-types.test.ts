/**
 * @file Tests for OpenSCAD type definitions and type guards
 * 
 * This test suite validates the OpenSCAD type definitions, type guards,
 * and utility functions following TDD principles with comprehensive
 * edge case coverage.
 */

import { describe, it, expect } from 'vitest';
import {
  isOpenSCADPrimitive,
  isOpenSCADTransform,
  isOpenSCADCSG,
  isOpenSCADModuleCall,
  createSuccess,
  createFailure,
  type OpenSCADPrimitiveNode,
  type OpenSCADTransform,
  type OpenSCADCSG,
  type OpenSCADModuleCall,
  type ConversionResult
} from './openscad-types.js';

describe('[INIT] OpenSCAD Types', () => {
  const mockLocation = {
    start: { line: 1, column: 0, offset: 0 },
    end: { line: 1, column: 10, offset: 10 }
  };

  describe('Type Guards', () => {
    describe('isOpenSCADPrimitive', () => {
      it('[DEBUG] should identify valid primitive nodes', () => {
        const cubeNode: OpenSCADPrimitiveNode = {
          type: 'cube',
          size: [10, 10, 10],
          location: mockLocation
        };

        const sphereNode: OpenSCADPrimitiveNode = {
          type: 'sphere',
          radius: 5,
          location: mockLocation
        };

        expect(isOpenSCADPrimitive(cubeNode)).toBe(true);
        expect(isOpenSCADPrimitive(sphereNode)).toBe(true);
      });

      it('[DEBUG] should reject invalid primitive nodes', () => {
        expect(isOpenSCADPrimitive(null)).toBe(false);
        expect(isOpenSCADPrimitive(undefined)).toBe(false);
        expect(isOpenSCADPrimitive({})).toBe(false);
        expect(isOpenSCADPrimitive({ type: 'invalid' })).toBe(false);
        expect(isOpenSCADPrimitive({ type: 'translate' })).toBe(false);
      });

      it('[DEBUG] should handle edge cases', () => {
        expect(isOpenSCADPrimitive('cube')).toBe(false);
        expect(isOpenSCADPrimitive(123)).toBe(false);
        expect(isOpenSCADPrimitive([])).toBe(false);
        expect(isOpenSCADPrimitive({ type: null })).toBe(false);
      });
    });

    describe('isOpenSCADTransform', () => {
      it('[DEBUG] should identify valid transform nodes', () => {
        const translateNode: OpenSCADTransform = {
          type: 'translate',
          parameters: { vector: [1, 2, 3] },
          children: [],
          location: mockLocation
        };

        const rotateNode: OpenSCADTransform = {
          type: 'rotate',
          parameters: { angles: [0, 0, 45] },
          children: [],
          location: mockLocation
        };

        expect(isOpenSCADTransform(translateNode)).toBe(true);
        expect(isOpenSCADTransform(rotateNode)).toBe(true);
      });

      it('[DEBUG] should reject invalid transform nodes', () => {
        expect(isOpenSCADTransform(null)).toBe(false);
        expect(isOpenSCADTransform({ type: 'cube' })).toBe(false);
        expect(isOpenSCADTransform({ type: 'union' })).toBe(false);
      });
    });

    describe('isOpenSCADCSG', () => {
      it('[DEBUG] should identify valid CSG nodes', () => {
        const unionNode: OpenSCADCSG = {
          type: 'union',
          children: [],
          location: mockLocation
        };

        const differenceNode: OpenSCADCSG = {
          type: 'difference',
          children: [],
          location: mockLocation
        };

        expect(isOpenSCADCSG(unionNode)).toBe(true);
        expect(isOpenSCADCSG(differenceNode)).toBe(true);
      });

      it('[DEBUG] should reject invalid CSG nodes', () => {
        expect(isOpenSCADCSG(null)).toBe(false);
        expect(isOpenSCADCSG({ type: 'cube' })).toBe(false);
        expect(isOpenSCADCSG({ type: 'translate' })).toBe(false);
      });
    });

    describe('isOpenSCADModuleCall', () => {
      it('[DEBUG] should identify valid module call nodes', () => {
        const moduleCallNode: OpenSCADModuleCall = {
          type: 'module_call',
          name: 'myModule',
          parameters: { param1: 10 },
          children: [],
          location: mockLocation
        };

        expect(isOpenSCADModuleCall(moduleCallNode)).toBe(true);
      });

      it('[DEBUG] should reject invalid module call nodes', () => {
        expect(isOpenSCADModuleCall(null)).toBe(false);
        expect(isOpenSCADModuleCall({ type: 'cube' })).toBe(false);
        expect(isOpenSCADModuleCall({ type: 'function_call' })).toBe(false);
      });
    });
  });

  describe('Result Helpers', () => {
    describe('createSuccess', () => {
      it('[DEBUG] should create successful result with data', () => {
        const data = { value: 42 };
        const result = createSuccess(data);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(data);
        }
        expect(Object.isFrozen(result)).toBe(true);
      });

      it('[DEBUG] should handle different data types', () => {
        const stringResult = createSuccess('test');
        const numberResult = createSuccess(123);
        const arrayResult = createSuccess([1, 2, 3]);
        const objectResult = createSuccess({ key: 'value' });

        expect(stringResult.success).toBe(true);
        if (stringResult.success) expect(stringResult.data).toBe('test');
        if (numberResult.success) expect(numberResult.data).toBe(123);
        if (arrayResult.success) expect(arrayResult.data).toEqual([1, 2, 3]);
        if (objectResult.success) expect(objectResult.data).toEqual({ key: 'value' });
      });
    });

    describe('createFailure', () => {
      it('[DEBUG] should create failed result with error', () => {
        const error = 'Something went wrong';
        const result = createFailure(error);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe(error);
        }
        expect(Object.isFrozen(result)).toBe(true);
      });

      it('[DEBUG] should handle different error types', () => {
        const stringError = createFailure('String error');
        const detailedError = createFailure('Detailed error message');

        expect(stringError.success).toBe(false);
        if (!stringError.success) expect(stringError.error).toBe('String error');
        if (!detailedError.success) expect(detailedError.error).toBe('Detailed error message');
      });
    });
  });

  describe('Type Safety and Immutability', () => {
    it('[DEBUG] should ensure result objects are immutable', () => {
      const successResult = createSuccess({ value: 42 });
      const failureResult = createFailure('error');

      expect(Object.isFrozen(successResult)).toBe(true);
      expect(Object.isFrozen(failureResult)).toBe(true);

      // Attempting to modify should throw in strict mode (which is good!)
      expect(() => {
        (successResult as any).success = false;
      }).toThrow(); // In strict mode, assignment throws TypeError

      expect(successResult.success).toBe(true); // Value should remain unchanged
    });

    it('[DEBUG] should maintain type discrimination', () => {
      const successResult: ConversionResult<number> = createSuccess(42);
      const failureResult: ConversionResult<number> = createFailure('error');

      if (successResult.success) {
        // TypeScript should know this is the success case
        expect(typeof successResult.data).toBe('number');
        expect(successResult.data).toBe(42);
      }

      if (!failureResult.success) {
        // TypeScript should know this is the failure case
        expect(typeof failureResult.error).toBe('string');
        expect(failureResult.error).toBe('error');
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('[DEBUG] should handle null and undefined inputs gracefully', () => {
      expect(isOpenSCADPrimitive(null)).toBe(false);
      expect(isOpenSCADPrimitive(undefined)).toBe(false);
      expect(isOpenSCADTransform(null)).toBe(false);
      expect(isOpenSCADTransform(undefined)).toBe(false);
      expect(isOpenSCADCSG(null)).toBe(false);
      expect(isOpenSCADCSG(undefined)).toBe(false);
      expect(isOpenSCADModuleCall(null)).toBe(false);
      expect(isOpenSCADModuleCall(undefined)).toBe(false);
    });

    it('[DEBUG] should handle malformed objects', () => {
      const malformedObjects = [
        {},
        { type: null },
        { type: undefined },
        { type: 123 },
        { type: [] },
        { type: {} },
        { notType: 'cube' }
      ];

      malformedObjects.forEach(obj => {
        expect(isOpenSCADPrimitive(obj)).toBe(false);
        expect(isOpenSCADTransform(obj)).toBe(false);
        expect(isOpenSCADCSG(obj)).toBe(false);
        expect(isOpenSCADModuleCall(obj)).toBe(false);
      });
    });
  });
});

console.log('[END] OpenSCAD types test suite completed successfully');
