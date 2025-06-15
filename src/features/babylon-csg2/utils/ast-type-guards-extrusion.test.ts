/**
 * Test suite for extrusion AST type guards and parameter extraction utilities
 * 
 * Tests the type guards and parameter extraction functions for LinearExtrudeNode
 * and RotateExtrudeNode to ensure robust parameter handling and validation.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import type { LinearExtrudeNode, RotateExtrudeNode, ASTNode } from '@holistic-stack/openscad-parser';
import {
  isExtrusionNode,
  isLinearExtrudeNode,
  isRotateExtrudeNode,
  extractLinearExtrudeHeight,
  extractLinearExtrudeScale,
  extractLinearExtrudeParams,
  extractRotateExtrudeParams,
  getExtrusionDescription,
  validateExtrusionChildren
} from './ast-type-guards-extrusion';

describe('[INIT] Extrusion Type Guards and Parameter Extraction', () => {
  console.log('[INIT] Starting extrusion type guard tests');

  describe('Type Guards', () => {
    it('should identify LinearExtrudeNode correctly', () => {
      console.log('[TEST] Testing LinearExtrudeNode identification');
      
      const linearExtrudeNode: LinearExtrudeNode = {
        type: 'linear_extrude',
        height: 10,
        children: [],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 20 } }
      };

      expect(isLinearExtrudeNode(linearExtrudeNode)).toBe(true);
      expect(isExtrusionNode(linearExtrudeNode)).toBe(true);
      expect(isRotateExtrudeNode(linearExtrudeNode)).toBe(false);
      
      console.log('[TEST] LinearExtrudeNode identification test passed');
    });

    it('should identify RotateExtrudeNode correctly', () => {
      console.log('[TEST] Testing RotateExtrudeNode identification');
      
      const rotateExtrudeNode: RotateExtrudeNode = {
        type: 'rotate_extrude',
        children: [],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 20 } }
      };

      expect(isRotateExtrudeNode(rotateExtrudeNode)).toBe(true);
      expect(isExtrusionNode(rotateExtrudeNode)).toBe(true);
      expect(isLinearExtrudeNode(rotateExtrudeNode)).toBe(false);
      
      console.log('[TEST] RotateExtrudeNode identification test passed');
    });

    it('should reject non-extrusion nodes', () => {
      console.log('[TEST] Testing non-extrusion node rejection');
      
      const cubeNode: ASTNode = {
        type: 'cube',
        size: [1, 1, 1],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } }
      };

      expect(isLinearExtrudeNode(cubeNode)).toBe(false);
      expect(isRotateExtrudeNode(cubeNode)).toBe(false);
      expect(isExtrusionNode(cubeNode)).toBe(false);
      
      console.log('[TEST] Non-extrusion node rejection test passed');
    });
  });

  describe('LinearExtrude Parameter Extraction', () => {
    it('should extract height parameter correctly', () => {
      console.log('[TEST] Testing linear extrude height extraction');
      
      const linearExtrudeNode: LinearExtrudeNode = {
        type: 'linear_extrude',
        height: 15,
        children: [],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 20 } }
      };

      const result = extractLinearExtrudeHeight(linearExtrudeNode);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(15);
      }
      
      console.log('[TEST] Linear extrude height extraction test passed');
    });

    it('should handle invalid height values', () => {
      console.log('[TEST] Testing invalid height handling');
      
      const invalidHeightNode = {
        type: 'linear_extrude' as const,
        height: -5,
        children: [],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 20 } }
      } as LinearExtrudeNode;

      const result = extractLinearExtrudeHeight(invalidHeightNode);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('must be positive');
      }
      
      console.log('[TEST] Invalid height handling test passed');
    });

    it('should extract scale parameter correctly', () => {
      console.log('[TEST] Testing linear extrude scale extraction');
      
      const linearExtrudeWithScale: LinearExtrudeNode = {
        type: 'linear_extrude',
        height: 10,
        scale: [2, 3],
        children: [],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 20 } }
      };

      const result = extractLinearExtrudeScale(linearExtrudeWithScale);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual([2, 3]);
      }
      
      console.log('[TEST] Linear extrude scale extraction test passed');
    });

    it('should handle uniform scale parameter', () => {
      console.log('[TEST] Testing uniform scale parameter');
      
      const linearExtrudeWithUniformScale: LinearExtrudeNode = {
        type: 'linear_extrude',
        height: 10,
        scale: 2.5,
        children: [],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 20 } }
      };

      const result = extractLinearExtrudeScale(linearExtrudeWithUniformScale);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual([2.5, 2.5]);
      }
      
      console.log('[TEST] Uniform scale parameter test passed');
    });

    it('should use default scale when not specified', () => {
      console.log('[TEST] Testing default scale handling');
      
      const linearExtrudeWithoutScale: LinearExtrudeNode = {
        type: 'linear_extrude',
        height: 10,
        children: [],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 20 } }
      };

      const result = extractLinearExtrudeScale(linearExtrudeWithoutScale);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual([1, 1]);
      }
      
      console.log('[TEST] Default scale handling test passed');
    });

    it('should extract complete parameter set', () => {
      console.log('[TEST] Testing complete parameter extraction');
      
      const linearExtrudeNode: LinearExtrudeNode = {
        type: 'linear_extrude',
        height: 20,
        center: true,
        convexity: 5,
        twist: 45,
        slices: 30,
        scale: [1.5, 2],
        $fn: 64,
        children: [],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 30, offset: 30 } }
      };

      const result = extractLinearExtrudeParams(linearExtrudeNode);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.height).toBe(20);
        expect(result.value.center).toBe(true);
        expect(result.value.convexity).toBe(5);
        expect(result.value.twist).toBe(45);
        expect(result.value.slices).toBe(30);
        expect(result.value.scale).toEqual([1.5, 2]);
        expect(result.value.fn).toBe(64);
      }
      
      console.log('[TEST] Complete parameter extraction test passed');
    });
  });

  describe('RotateExtrude Parameter Extraction', () => {
    it('should extract parameters with defaults', () => {
      console.log('[TEST] Testing rotate extrude parameter extraction');
      
      const rotateExtrudeNode: RotateExtrudeNode = {
        type: 'rotate_extrude',
        children: [],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 20 } }
      };

      const result = extractRotateExtrudeParams(rotateExtrudeNode);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.angle).toBe(360); // Default full rotation
        expect(result.value.convexity).toBe(1); // Default convexity
        expect(result.value.fn).toBeUndefined();
        expect(result.value.fa).toBeUndefined();
        expect(result.value.fs).toBeUndefined();
      }
      
      console.log('[TEST] Rotate extrude parameter extraction test passed');
    });

    it('should extract custom parameters', () => {
      console.log('[TEST] Testing custom rotate extrude parameters');
      
      const rotateExtrudeNode: RotateExtrudeNode = {
        type: 'rotate_extrude',
        angle: 180,
        convexity: 3,
        $fn: 32,
        $fa: 12,
        $fs: 2,
        children: [],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 25, offset: 25 } }
      };

      const result = extractRotateExtrudeParams(rotateExtrudeNode);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.angle).toBe(180);
        expect(result.value.convexity).toBe(3);
        expect(result.value.fn).toBe(32);
        expect(result.value.fa).toBe(12);
        expect(result.value.fs).toBe(2);
      }
      
      console.log('[TEST] Custom rotate extrude parameters test passed');
    });

    it('should handle invalid angle values', () => {
      console.log('[TEST] Testing invalid angle handling');
      
      const invalidAngleNode = {
        type: 'rotate_extrude' as const,
        angle: 400, // Invalid: > 360
        children: [],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 20 } }
      } as RotateExtrudeNode;

      const result = extractRotateExtrudeParams(invalidAngleNode);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('between 0 and 360');
      }
      
      console.log('[TEST] Invalid angle handling test passed');
    });
  });

  describe('Utility Functions', () => {
    it('should generate descriptive strings for extrusion nodes', () => {
      console.log('[TEST] Testing extrusion description generation');
      
      const linearExtrudeNode: LinearExtrudeNode = {
        type: 'linear_extrude',
        height: 10,
        center: true,
        twist: 30,
        children: [],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 20 } }
      };

      const rotateExtrudeNode: RotateExtrudeNode = {
        type: 'rotate_extrude',
        angle: 270,
        convexity: 2,
        children: [],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 20 } }
      };

      const linearDesc = getExtrusionDescription(linearExtrudeNode);
      const rotateDesc = getExtrusionDescription(rotateExtrudeNode);

      expect(linearDesc).toContain('LinearExtrude');
      expect(linearDesc).toContain('height=10');
      expect(linearDesc).toContain('center=true');
      expect(linearDesc).toContain('twist=30');

      expect(rotateDesc).toContain('RotateExtrude');
      expect(rotateDesc).toContain('angle=270');
      expect(rotateDesc).toContain('convexity=2');
      
      console.log('[TEST] Extrusion description generation test passed');
    });

    it('should validate extrusion children', () => {
      console.log('[TEST] Testing extrusion children validation');
      
      const nodeWithChildren: LinearExtrudeNode = {
        type: 'linear_extrude',
        height: 10,
        children: [
          { type: 'circle', r: 5, location: { start: { line: 2, column: 2, offset: 10 }, end: { line: 2, column: 15, offset: 25 } } }
        ],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 3, column: 1, offset: 30 } }
      };

      const nodeWithoutChildren = {
        type: 'linear_extrude' as const,
        height: 10,
        children: [],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 20 } }
      } as LinearExtrudeNode;

      const validResult = validateExtrusionChildren(nodeWithChildren);
      const invalidResult = validateExtrusionChildren(nodeWithoutChildren);

      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
      if (!invalidResult.success) {
        expect(invalidResult.error).toContain('requires at least one child');
      }
      
      console.log('[TEST] Extrusion children validation test passed');
    });
  });

  console.log('[END] Extrusion type guard tests completed successfully');
});
