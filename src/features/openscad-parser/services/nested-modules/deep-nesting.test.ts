/**
 * @file deep-nesting.test.ts
 * @description Tests for deep nested module scenarios in OpenSCAD.
 * Focuses on multiple levels of nesting and performance with deep hierarchies.
 *
 * @example
 * ```openscad
 * module level1() {
 *   module level2() {
 *     module level3() { cube(5); }
 *     level3();
 *   }
 *   level2();
 * }
 * level1();
 * ```
 */

import { describe, expect, it } from 'vitest';
import type {
  ASTNode,
  ModuleDefinitionNode,
  ModuleInstantiationNode,
} from '../../ast/ast-types.js';
import { ModuleRegistry } from '../module-registry/module-registry.js';
import { ModuleResolver } from '../module-resolver/module-resolver.js';
import { createSourceLocation } from '../test-utils.js';

describe('Deep Nested Module Support', () => {
  describe('Three-level nesting', () => {
    it('should handle 3 levels of nested modules', () => {
      // Test case: module outer() { module middle() { module inner() { cube(5); } inner(); } middle(); } outer();
      const innerModuleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'inner',
          location: createSourceLocation(3, 13, 113, 3, 23, 123),
        },
        parameters: [],
        body: [
          {
            type: 'cube',
            size: 5,
            center: false,
            location: createSourceLocation(4, 7, 157, 4, 17, 167),
          },
        ],
        location: createSourceLocation(3, 5, 105, 3, 15, 115),
      };

      const innerModuleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'inner',
        args: [],
        location: createSourceLocation(6, 5, 255, 6, 15, 265),
      };

      const middleModuleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'middle',
          location: createSourceLocation(2, 11, 61, 2, 21, 71),
        },
        parameters: [],
        body: [innerModuleDefinition, innerModuleCall],
        location: createSourceLocation(2, 3, 53, 2, 13, 63),
      };

      const middleModuleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'middle',
        args: [],
        location: createSourceLocation(8, 3, 353, 8, 13, 363),
      };

      const outerModuleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'outer',
          location: createSourceLocation(1, 8, 8, 1, 18, 18),
        },
        parameters: [],
        body: [middleModuleDefinition, middleModuleCall],
        location: createSourceLocation(1, 1, 1, 1, 11, 11),
      };

      const outerModuleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'outer',
        args: [],
        location: createSourceLocation(10, 1, 451, 10, 11, 461),
      };

      const inputAST: ASTNode[] = [outerModuleDefinition, outerModuleCall];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0]?.type).toBe('cube');
        expect((result.data?.[0] as any)?.size).toBe(5);
      }
    });
  });

  describe('Four-level nesting', () => {
    it('should handle 4 levels of nested modules', () => {
      // Test case: level1 -> level2 -> level3 -> level4 -> sphere(3)
      const level4Definition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'level4',
          location: createSourceLocation(4, 15, 165, 4, 25, 175),
        },
        parameters: [],
        body: [
          {
            type: 'sphere',
            radius: 3,
            location: createSourceLocation(5, 9, 209, 5, 19, 219),
          },
        ],
        location: createSourceLocation(4, 7, 157, 4, 17, 167),
      };

      const level4Call: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'level4',
        args: [],
        location: createSourceLocation(7, 7, 307, 7, 17, 317),
      };

      const level3Definition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'level3',
          location: createSourceLocation(3, 13, 113, 3, 23, 123),
        },
        parameters: [],
        body: [level4Definition, level4Call],
        location: createSourceLocation(3, 5, 105, 3, 15, 115),
      };

      const level3Call: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'level3',
        args: [],
        location: createSourceLocation(9, 5, 405, 9, 15, 415),
      };

      const level2Definition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'level2',
          location: createSourceLocation(2, 11, 61, 2, 21, 71),
        },
        parameters: [],
        body: [level3Definition, level3Call],
        location: createSourceLocation(2, 3, 53, 2, 13, 63),
      };

      const level2Call: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'level2',
        args: [],
        location: createSourceLocation(11, 3, 503, 11, 13, 513),
      };

      const level1Definition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'level1',
          location: createSourceLocation(1, 8, 8, 1, 18, 18),
        },
        parameters: [],
        body: [level2Definition, level2Call],
        location: createSourceLocation(1, 1, 1, 1, 11, 11),
      };

      const level1Call: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'level1',
        args: [],
        location: createSourceLocation(13, 1, 601, 13, 11, 611),
      };

      const inputAST: ASTNode[] = [level1Definition, level1Call];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0]?.type).toBe('sphere');
        expect((result.data?.[0] as any)?.radius).toBe(3);
      }
    });
  });

  describe('Performance with deep nesting', () => {
    it('should handle reasonable nesting depth without performance issues', () => {
      // Create a 5-level deep nesting structure
      const createNestedModule = (level: number, maxLevel: number): ModuleDefinitionNode => {
        const isLeaf = level === maxLevel;
        const body: ASTNode[] = [];

        if (isLeaf) {
          // Leaf level: add a primitive
          body.push({
            type: 'cylinder',
            height: level,
            radius: level,
            center: false,
            location: { line: level * 2, column: level * 2 + 1 },
          });
        } else {
          // Non-leaf: add nested module definition and call
          const nestedModule = createNestedModule(level + 1, maxLevel);
          body.push(nestedModule);
          body.push({
            type: 'module_instantiation',
            name: `level${level + 1}`,
            args: [],
            location: { line: level * 2 + 1, column: level * 2 + 1 },
          });
        }

        return {
          type: 'module_definition',
          name: {
            type: 'expression',
            expressionType: 'identifier',
            name: `level${level}`,
            location: { line: level * 2, column: level * 2 },
          },
          parameters: [],
          body,
          location: { line: level * 2, column: level * 2 },
        };
      };

      const maxDepth = 5;
      const rootModule = createNestedModule(1, maxDepth);
      const rootCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'level1',
        args: [],
        location: createSourceLocation(20, 1, 951, 20, 11, 961),
      };

      const inputAST: ASTNode[] = [rootModule, rootCall];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);

      // Measure performance
      const startTime = performance.now();
      const result = resolver.resolveAST(inputAST);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0]?.type).toBe('cylinder');
        expect((result.data?.[0] as any)?.height).toBe(maxDepth);
        expect((result.data?.[0] as any)?.radius).toBe(maxDepth);
      }

      // Performance assertion: should complete within reasonable time (100ms)
      expect(executionTime).toBeLessThan(100);
    });
  });

  describe('Complex deep nesting with multiple branches', () => {
    it('should handle deep nesting with multiple modules at each level', () => {
      // Test case: Each level has 2 nested modules, creating a tree structure
      const leaf1: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'leaf1',
          location: createSourceLocation(3, 13, 113, 3, 23, 123),
        },
        parameters: [],
        body: [
          {
            type: 'sphere',
            radius: 1,
            location: createSourceLocation(4, 7, 157, 4, 17, 167),
          },
        ],
        location: createSourceLocation(3, 5, 105, 3, 15, 115),
      };

      const leaf2: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'leaf2',
          location: createSourceLocation(5, 13, 213, 5, 23, 223),
        },
        parameters: [],
        body: [
          {
            type: 'cube',
            size: 2,
            center: false,
            location: createSourceLocation(6, 7, 257, 6, 17, 267),
          },
        ],
        location: createSourceLocation(5, 5, 205, 5, 15, 215),
      };

      const leaf1Call: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'leaf1',
        args: [],
        location: createSourceLocation(7, 5, 305, 7, 15, 315),
      };

      const leaf2Call: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'leaf2',
        args: [],
        location: createSourceLocation(8, 5, 355, 8, 15, 365),
      };

      const middleModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'middle',
          location: createSourceLocation(2, 11, 61, 2, 21, 71),
        },
        parameters: [],
        body: [leaf1, leaf2, leaf1Call, leaf2Call],
        location: createSourceLocation(2, 3, 53, 2, 13, 63),
      };

      const middleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'middle',
        args: [],
        location: createSourceLocation(10, 3, 453, 10, 13, 463),
      };

      const rootModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'root',
          location: createSourceLocation(1, 8, 8, 1, 18, 18),
        },
        parameters: [],
        body: [middleModule, middleCall],
        location: createSourceLocation(1, 1, 1, 1, 11, 11),
      };

      const rootCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'root',
        args: [],
        location: createSourceLocation(12, 1, 551, 12, 11, 561),
      };

      const inputAST: ASTNode[] = [rootModule, rootCall];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);

        const sphereNodes = result.data?.filter((node: ASTNode) => node.type === 'sphere') || [];
        const cubeNodes = result.data?.filter((node: ASTNode) => node.type === 'cube') || [];

        expect(sphereNodes).toHaveLength(1);
        expect(cubeNodes).toHaveLength(1);
        expect((sphereNodes[0] as any)?.radius).toBe(1);
        expect((cubeNodes[0] as any)?.size).toBe(2);
      }
    });
  });
});
