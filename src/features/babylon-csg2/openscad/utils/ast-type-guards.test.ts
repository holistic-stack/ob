/**
 * AST Type Guards and Utilities Tests
 * 
 * Comprehensive tests for OpenSCAD AST node type guards, parameter extraction,
 * and validation utilities. Tests cover all supported node types and edge cases.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  CubeNode,
  SphereNode,
  CylinderNode,
  TranslateNode,
  RotateNode,
  ScaleNode,
  UnionNode,
  DifferenceNode,
  ErrorNode,
  ExpressionNode,
  BinaryExpressionNode,
  IntersectionNode,
  ParameterValue,
  SourceLocation,
  ASTNode
} from '@holistic-stack/openscad-parser';

import {
  // Type guards
  isCubeNode,
  isSphereNode,
  isCylinderNode,
  isPrimitiveNode,
  isTranslateNode,
  isRotateNode as _isRotateNode,
  isScaleNode as _isScaleNode,
  isTransformNode,
  isUnionNode,
  isDifferenceNode,
  isIntersectionNode,
  isCSGOperationNode,
  
  // Parameter extractors
  extractNumber,
  extractBoolean,
  extractVector3D,
  extractVector2D,
  extractCubeSize,
  extractSphereRadius,
  extractCylinderParams,
  extractTranslationVector,
  
  // Validation utilities
  hasValidLocation,
  hasChildren,
  hasValidChildren,
  
  // Utility functions
  getNodeDescription,
  isExpressionParameter,
  isErrorParameter,
  
  type ExtractionResult as _ExtractionResult
} from './ast-type-guards';

describe('AST Type Guards and Utilities', () => {
  let mockLocation: SourceLocation;
  
  beforeEach(() => {
    mockLocation = {
      start: { line: 0, column: 0, offset: 0 },
      end: { line: 0, column: 10, offset: 10 },
      text: 'cube(10);'
    };
  });

  describe('Primitive Node Type Guards', () => {
    it('should identify cube nodes correctly', () => {
      const cubeNode: CubeNode = {
        type: 'cube',
        size: [10, 20, 30],
        center: true,
        location: mockLocation
      };
      
      const sphereNode: SphereNode = {
        type: 'sphere',
        radius: 5,
        location: mockLocation
      };

      expect(isCubeNode(cubeNode)).toBe(true);
      expect(isCubeNode(sphereNode)).toBe(false);
    });

    it('should identify sphere nodes correctly', () => {
      const sphereNode: SphereNode = {
        type: 'sphere',
        radius: 5,
        location: mockLocation
      };
      
      const cubeNode: CubeNode = {
        type: 'cube',
        size: 10,
        location: mockLocation
      };

      expect(isSphereNode(sphereNode)).toBe(true);
      expect(isSphereNode(cubeNode)).toBe(false);
    });

    it('should identify cylinder nodes correctly', () => {
      const cylinderNode: CylinderNode = {
        type: 'cylinder',
        h: 10,
        r: 5,
        location: mockLocation
      };
      
      const cubeNode: CubeNode = {
        type: 'cube',
        size: 10,
        location: mockLocation
      };

      expect(isCylinderNode(cylinderNode)).toBe(true);
      expect(isCylinderNode(cubeNode)).toBe(false);
    });

    it('should identify primitive nodes correctly', () => {
      const cubeNode: CubeNode = { type: 'cube', size: 10, location: mockLocation };
      const sphereNode: SphereNode = { type: 'sphere', radius: 5, location: mockLocation };
      const cylinderNode: CylinderNode = { type: 'cylinder', h: 10, r: 5, location: mockLocation };
      const translateNode: TranslateNode = { type: 'translate', v: [1, 2, 3], children: [], location: mockLocation };

      expect(isPrimitiveNode(cubeNode)).toBe(true);
      expect(isPrimitiveNode(sphereNode)).toBe(true);
      expect(isPrimitiveNode(cylinderNode)).toBe(true);
      expect(isPrimitiveNode(translateNode)).toBe(false);
    });
  });

  describe('Transform Node Type Guards', () => {
    it('should identify translate nodes correctly', () => {
      const translateNode: TranslateNode = {
        type: 'translate',
        v: [1, 2, 3],
        children: [],
        location: mockLocation
      };
      
      const cubeNode: CubeNode = {
        type: 'cube',
        size: 10,
        location: mockLocation
      };

      expect(isTranslateNode(translateNode)).toBe(true);
      expect(isTranslateNode(cubeNode)).toBe(false);
    });

    it('should identify transform nodes correctly', () => {
      const translateNode: TranslateNode = { type: 'translate', v: [1, 2, 3], children: [], location: mockLocation };
      const rotateNode: RotateNode = { type: 'rotate', a: 45, children: [], location: mockLocation };
      const scaleNode: ScaleNode = { type: 'scale', v: [2, 2, 2], children: [], location: mockLocation };
      const cubeNode: CubeNode = { type: 'cube', size: 10, location: mockLocation };

      expect(isTransformNode(translateNode)).toBe(true);
      expect(isTransformNode(rotateNode)).toBe(true);
      expect(isTransformNode(scaleNode)).toBe(true);
      expect(isTransformNode(cubeNode)).toBe(false);
    });
  });

  describe('CSG Operation Type Guards', () => {
    it('should identify CSG operation nodes correctly', () => {
      const unionNode: UnionNode = { type: 'union', children: [], location: mockLocation };
      const differenceNode: DifferenceNode = { type: 'difference', children: [], location: mockLocation };
      const intersectionNode: IntersectionNode = { type: 'intersection', children: [], location: mockLocation };
      const cubeNode: CubeNode = { type: 'cube', size: 10, location: mockLocation };

      expect(isUnionNode(unionNode)).toBe(true);
      expect(isDifferenceNode(differenceNode)).toBe(true);
      expect(isIntersectionNode(intersectionNode)).toBe(true);
      
      expect(isCSGOperationNode(unionNode)).toBe(true);
      expect(isCSGOperationNode(differenceNode)).toBe(true);
      expect(isCSGOperationNode(intersectionNode)).toBe(true);
      expect(isCSGOperationNode(cubeNode)).toBe(false);
    });
  });

  describe('Parameter Extraction Utilities', () => {
    describe('extractNumber', () => {
      it('should extract number values correctly', () => {
        const result1 = extractNumber(42);
        expect(result1.success).toBe(true);
        if (result1.success) {
          expect(result1.value).toBe(42);
        }

        const result2 = extractNumber('3.14');
        expect(result2.success).toBe(true);
        if (result2.success) {
          expect(result2.value).toBe(3.14);
        }
      });

      it('should handle invalid number extraction', () => {
        const result1 = extractNumber('invalid');
        expect(result1.success).toBe(false);
        if (!result1.success) {
          expect(result1.error).toContain('Cannot extract number');
        }

        const result2 = extractNumber(null);
        expect(result2.success).toBe(false);
      });
    });

    describe('extractBoolean', () => {      it('should extract boolean values correctly', () => {
        expect(extractBoolean(true).success).toBe(true);
        expect(extractBoolean('true').success).toBe(true);
        expect(extractBoolean('false').success).toBe(true);
        expect(extractBoolean(1).success).toBe(true);
        expect(extractBoolean(0).success).toBe(true);
      });

      it('should handle invalid boolean extraction', () => {
        const result = extractBoolean('invalid');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Cannot extract boolean');
        }
      });
    });

    describe('extractVector3D', () => {
      it('should extract Vector3D correctly', () => {
        const result1 = extractVector3D([1, 2, 3]);
        expect(result1.success).toBe(true);
        if (result1.success) {
          expect(result1.value).toEqual([1, 2, 3]);
        }

        const result2 = extractVector3D(5);
        expect(result2.success).toBe(true);
        if (result2.success) {
          expect(result2.value).toEqual([5, 5, 5]);
        }
      });

      it('should handle invalid Vector3D extraction', () => {
        const result = extractVector3D('invalid');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Cannot extract Vector3D');
        }
      });
    });

    describe('extractVector2D', () => {
      it('should extract Vector2D correctly', () => {
        const result1 = extractVector2D([1, 2]);
        expect(result1.success).toBe(true);
        if (result1.success) {
          expect(result1.value).toEqual([1, 2]);
        }

        const result2 = extractVector2D(5);
        expect(result2.success).toBe(true);
        if (result2.success) {
          expect(result2.value).toEqual([5, 5]);
        }
      });
    });
  });

  describe('Specialized Parameter Extractors', () => {
    describe('extractCubeSize', () => {
      it('should extract cube size correctly', () => {
        const cubeNode: CubeNode = {
          type: 'cube',
          size: [10, 20, 30],
          location: mockLocation
        };

        const result = extractCubeSize(cubeNode);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toEqual([10, 20, 30]);
        }
      });

      it('should handle missing cube size', () => {
        const cubeNode: CubeNode = {
          type: 'cube',
          size: undefined,
          location: mockLocation
        };

        const result = extractCubeSize(cubeNode);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('missing size parameter');
        }
      });
    });

    describe('extractSphereRadius', () => {
      it('should extract sphere radius correctly', () => {
        const sphereNode: SphereNode = {
          type: 'sphere',
          radius: 5,
          location: mockLocation
        };

        const result = extractSphereRadius(sphereNode);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toBe(5);
        }
      });

      it('should extract radius from diameter', () => {
        const sphereNode: SphereNode = {
          type: 'sphere',
          diameter: 10,
          location: mockLocation
        };

        const result = extractSphereRadius(sphereNode);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toBe(5);
        }
      });

      it('should handle missing radius and diameter', () => {
        const sphereNode: SphereNode = {
          type: 'sphere',
          location: mockLocation
        };

        const result = extractSphereRadius(sphereNode);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('missing radius/diameter parameter');
        }
      });
    });

    describe('extractCylinderParams', () => {
      it('should extract cylinder parameters correctly', () => {
        const cylinderNode: CylinderNode = {
          type: 'cylinder',
          h: 10,
          r: 5,
          location: mockLocation
        };

        const result = extractCylinderParams(cylinderNode);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.height).toBe(10);
          expect(result.value.radius).toBe(5);
        }
      });

      it('should extract radius from diameter', () => {
        const cylinderNode: CylinderNode = {
          type: 'cylinder',
          h: 10,
          d: 10,
          location: mockLocation
        };

        const result = extractCylinderParams(cylinderNode);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.height).toBe(10);
          expect(result.value.radius).toBe(5);
        }
      });

      it('should handle missing height', () => {
        // To test missing 'h', we create a node that omits 'h' if the type allows,
        // or use a type assertion if we are specifically testing runtime behavior
        // against a loosely typed object that might come from a less strict source.
        // Assuming CylinderNode requires 'h', but we test the extractor's robustness.
        const cylinderNode = { // Removed 'h' property entirely to test extractor's handling of absence
          type: 'cylinder',
          r: 5,
          location: mockLocation
        } as unknown as CylinderNode; // Use 'as unknown as CylinderNode' to bypass strict checks for test setup

        const result = extractCylinderParams(cylinderNode);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('missing height parameter');
        }
      });
    });

    describe('extractTranslationVector', () => {
      it('should extract translation vector correctly', () => {
        const translateNode: TranslateNode = {
          type: 'translate',
          v: [1, 2, 3],
          children: [],
          location: mockLocation
        };

        const result = extractTranslationVector(translateNode);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toEqual([1, 2, 3]);
        }
      });

      it('should handle missing translation vector', () => {
        // Similar to above, omit 'v' to test extractor's handling of its absence.
        const translateNode = { // Removed 'v' property
          type: 'translate',
          children: [],
          location: mockLocation
        } as unknown as TranslateNode; // Use 'as unknown as TranslateNode' for test setup

        const result = extractTranslationVector(translateNode);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('missing vector parameter');
        }
      });
    });
  });

  describe('Validation Utilities', () => {
    it('should validate node location correctly', () => {
      const nodeWithLocation = {
        type: 'cube',
        location: mockLocation
      };

      const nodeWithoutLocation = {
        type: 'cube'
      };

      expect(hasValidLocation(nodeWithLocation)).toBe(true);
      expect(hasValidLocation(nodeWithoutLocation)).toBe(false);
    });    it('should validate node children correctly', () => {
      const nodeWithChildren: UnionNode = {
        type: 'union',
        children: [{ type: 'cube', size: 10 } as CubeNode, { type: 'sphere', radius: 5 } as SphereNode],
        location: mockLocation
      };

      const nodeWithoutChildren: CubeNode = {
        type: 'cube',
        size: 10,
        location: mockLocation
      };

      expect(hasChildren(nodeWithChildren)).toBe(true);
      expect(hasChildren(nodeWithoutChildren)).toBe(false);
    });

    it('should validate children validity correctly', () => {
      const nodeWithValidChildren: UnionNode = {
        type: 'union',
        children: [{ type: 'cube', size: 10 } as CubeNode, { type: 'sphere', radius: 5 } as SphereNode],
        location: mockLocation
      };

      // If ASTNode[] is strictly an array of ASTNode, then null/undefined are not allowed by type.
      // To test hasValidChildren's filtering, the input array must be typed to allow these.
      // The 'children' property of UnionNode is ASTNode[].
      // If the goal is to test a scenario where the parser *might* produce this,
      // we cast the specific children array for this test case.
      const invalidChildrenArray: Array<ASTNode | null | undefined> = [
        { type: 'cube', size: 10 } as CubeNode,
        null,
        undefined
      ];
      const nodeWithInvalidChildren: UnionNode = {
        type: 'union',
        children: invalidChildrenArray as ASTNode[], // Cast for the test, hasValidChildren should handle it
        location: mockLocation
      };

      const nodeWithEmptyChildren: UnionNode = {
        type: 'union',
        children: [],
        location: mockLocation
      };

      expect(hasValidChildren(nodeWithValidChildren)).toBe(true);
      expect(hasValidChildren(nodeWithInvalidChildren)).toBe(false);
      expect(hasValidChildren(nodeWithEmptyChildren)).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    it('should provide human-readable node descriptions', () => {
      const cubeNode: CubeNode = { type: 'cube', size: 10, location: mockLocation };
      const sphereNode: SphereNode = { type: 'sphere', radius: 5, location: mockLocation };
      const unionNode: UnionNode = { type: 'union', children: [], location: mockLocation };

      expect(getNodeDescription(cubeNode)).toContain('Cube primitive');
      expect(getNodeDescription(sphereNode)).toContain('Sphere primitive');
      expect(getNodeDescription(unionNode)).toContain('Union CSG operation');
    });

    it('should identify expression parameters correctly', () => {
      const numberParam: ParameterValue = 42;
      // Using a minimal mock for ExpressionNode if specific properties of left/right are not tested
      const mockExpressionNode = { type: 'expression', expressionType: 'literal_expression', value: 0 } as ExpressionNode;
      const expressionParam: BinaryExpressionNode = { type: 'expression', expressionType: 'binary_expression', left: mockExpressionNode, right: mockExpressionNode, operator: '+' } as BinaryExpressionNode;
      const nullParam: ParameterValue = null;

      expect(isExpressionParameter(numberParam)).toBe(false);
      expect(isExpressionParameter(expressionParam)).toBe(true);
      expect(isExpressionParameter(nullParam)).toBe(false);
    });

    it('should identify error parameters correctly', () => {
      const numberParam: ParameterValue = 42;
      const errorParam: ErrorNode = { type: 'error', errorCode: 'TEST_ERROR', message: 'Test error message' };
      // Using a minimal mock for ExpressionNode
      const mockExpressionNode = { type: 'expression', expressionType: 'literal_expression', value: 0 } as ExpressionNode;
      const expressionParam: BinaryExpressionNode = { type: 'expression', expressionType: 'binary_expression', left: mockExpressionNode, right: mockExpressionNode, operator: '+' };

      expect(isErrorParameter(numberParam)).toBe(false);
      expect(isErrorParameter(errorParam)).toBe(true);
      expect(isErrorParameter(expressionParam)).toBe(false);
    });
  });

  describe('Result Type Safety', () => {
    it('should maintain type safety with Result discriminated unions', () => {
      const successResult = extractNumber(42);
      const errorResult = extractNumber('invalid');

      // TypeScript type narrowing should work correctly
      if (successResult.success) {
        // In success branch, should have 'value' property
        expect(typeof successResult.value).toBe('number');
        expect('error' in successResult).toBe(false);
      }

      if (!errorResult.success) {
        // In error branch, should have 'error' property
        expect(typeof errorResult.error).toBe('string');
        expect('value' in errorResult).toBe(false);
      }
    });    it('should provide immutable results', () => {
      const result = extractVector3D([1, 2, 3]);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.isFrozen(result.value)).toBe(true);
        
        const originalValue = [...result.value];
        try {
          // Cast to unknown first, then to number[] to bypass stricter type checking for this runtime test
          (result.value as unknown as number[])[0] = 999;
        } catch (_e) {
          // Expected in strict mode or if the object is truly frozen.
        }
        expect(result.value).toEqual(originalValue);
      }
    });
  });
});
