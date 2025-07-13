/**
 * @file Transformation Optimizer Tests
 * @description TDD tests for optimizing multiple transformations into single matrix operations
 * Following project guidelines: no mocks, real implementations, Result<T,E> patterns
 */

import { describe, test, expect } from 'vitest';
import {
  optimizeTransformationChain,
  combineTransformationMatrices,
  extractTransformationChain,
} from './transformation-optimizer';
import type { Result } from '../../../../shared/types/result.types';
import type { TranslateNode, RotateNode, ScaleNode } from '../../../openscad-parser/ast/ast-types';

describe('TransformationOptimizer', () => {
  // Following project guidelines: no mocks, real implementations

  describe('extractTransformationChain', () => {
    test('should extract simple transformation chain', () => {
      // translate([1, 2, 3]) rotate([0, 0, 45]) scale([2, 1, 0.5]) cube([1, 1, 1])
      const transformationChain: TranslateNode = {
        type: 'translate',
        v: [1, 2, 3],
        children: [{
          type: 'rotate',
          a: [0, 0, 45],
          children: [{
            type: 'scale',
            v: [2, 1, 0.5],
            children: [{
              type: 'cube',
              size: [1, 1, 1],
              center: false,
              children: [],
            }],
          }],
        }],
      };

      const result = extractTransformationChain(transformationChain);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.transformations).toHaveLength(3);
        expect(result.data.transformations[0].type).toBe('translate');
        expect(result.data.transformations[1].type).toBe('rotate');
        expect(result.data.transformations[2].type).toBe('scale');
        expect(result.data.primitiveNode.type).toBe('cube');
      }
    });

    test('should handle single transformation', () => {
      const singleTransform: RotateNode = {
        type: 'rotate',
        a: 90,
        children: [{
          type: 'sphere',
          r: 1,
          children: [],
        }],
      };

      const result = extractTransformationChain(singleTransform);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.transformations).toHaveLength(1);
        expect(result.data.transformations[0].type).toBe('rotate');
        expect(result.data.primitiveNode.type).toBe('sphere');
      }
    });

    test('should handle no transformations', () => {
      const primitiveOnly = {
        type: 'cube',
        size: [1, 1, 1],
        center: false,
        children: [],
      };

      const result = extractTransformationChain(primitiveOnly);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.transformations).toHaveLength(0);
        expect(result.data.primitiveNode.type).toBe('cube');
      }
    });
  });

  describe('combineTransformationMatrices', () => {
    test('should combine translation and rotation matrices', () => {
      const transformations = [
        { type: 'translate', v: [1, 2, 3] },
        { type: 'rotate', a: [0, 0, 90] }, // 90 degrees around Z
      ];

      const result = combineTransformationMatrices(transformations);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toHaveLength(16); // 4x4 matrix in column-major format
        // Should have translation components
        expect(result.data[12]).toBe(1); // X translation
        expect(result.data[13]).toBe(2); // Y translation
        expect(result.data[14]).toBe(3); // Z translation
      }
    });

    test('should combine scale and translation matrices', () => {
      const transformations = [
        { type: 'scale', v: [2, 3, 4] },
        { type: 'translate', v: [5, 6, 7] },
      ];

      const result = combineTransformationMatrices(transformations);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toHaveLength(16);
        // Should have scale components
        expect(result.data[0]).toBe(2);  // X scale
        expect(result.data[5]).toBe(3);  // Y scale
        expect(result.data[10]).toBe(4); // Z scale
        // Translation components will be scaled when scale is applied first
        // This is correct mathematical behavior: scale then translate means translate by scaled amount
        expect(result.data[12]).toBe(10); // X translation (5 * 2)
        expect(result.data[13]).toBe(18); // Y translation (6 * 3)
        expect(result.data[14]).toBe(28); // Z translation (7 * 4)
      }
    });

    test('should handle complex transformation chain', () => {
      const transformations = [
        { type: 'translate', v: [1, 0, 0] },
        { type: 'rotate', a: [0, 0, 45] },
        { type: 'scale', v: [2, 1, 1] },
        { type: 'translate', v: [0, 1, 0] },
      ];

      const result = combineTransformationMatrices(transformations);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toHaveLength(16);
        // Should be a valid transformation matrix
        expect(result.data[15]).toBe(1); // Homogeneous coordinate
      }
    });

    test('should handle empty transformation list', () => {
      const result = combineTransformationMatrices([]);
      expect(result.success).toBe(true);

      if (result.success) {
        // Should return identity matrix
        const identityMatrix = [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        ];
        expect(result.data).toEqual(identityMatrix);
      }
    });
  });

  describe('optimizeTransformationChain', () => {
    test('should optimize simple transformation chain', async () => {
      const transformationChain: TranslateNode = {
        type: 'translate',
        v: [1, 0, 0],
        children: [{
          type: 'rotate',
          a: 45,
          children: [{
            type: 'cube',
            size: [1, 1, 1],
            center: false,
            children: [],
          }],
        }],
      };

      const result = await optimizeTransformationChain(transformationChain);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.optimizedMatrix).toHaveLength(16);
        expect(result.data.primitiveNode.type).toBe('cube');
        expect(result.data.transformationCount).toBe(2);
      }
    });

    test('should handle optimization of complex chain', async () => {
      const complexChain: TranslateNode = {
        type: 'translate',
        v: [1, 2, 3],
        children: [{
          type: 'rotate',
          a: [45, 0, 90],
          children: [{
            type: 'scale',
            v: [2, 1, 0.5],
            children: [{
              type: 'translate',
              v: [0, 1, 0],
              children: [{
                type: 'sphere',
                r: 1,
                children: [],
              }],
            }],
          }],
        }],
      };

      const result = await optimizeTransformationChain(complexChain);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.optimizedMatrix).toHaveLength(16);
        expect(result.data.primitiveNode.type).toBe('sphere');
        expect(result.data.transformationCount).toBe(4);
      }
    });

    test('should handle single primitive without optimization', async () => {
      const primitiveOnly = {
        type: 'cube',
        size: [2, 2, 2],
        center: true,
        children: [],
      };

      const result = await optimizeTransformationChain(primitiveOnly);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.optimizedMatrix).toBeNull(); // No optimization needed
        expect(result.data.primitiveNode.type).toBe('cube');
        expect(result.data.transformationCount).toBe(0);
      }
    });
  });
});
