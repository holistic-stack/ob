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
          location: { line: 3, column: 13 },
        },
        parameters: [],
        body: [
          {
            type: 'cube',
            size: 5,
            center: false,
            location: { line: 4, column: 7 },
          },
        ],
        location: { line: 3, column: 5 },
      };

      const innerModuleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'inner',
        args: [],
        location: { line: 6, column: 5 },
      };

      const middleModuleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'middle',
          location: { line: 2, column: 11 },
        },
        parameters: [],
        body: [innerModuleDefinition, innerModuleCall],
        location: { line: 2, column: 3 },
      };

      const middleModuleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'middle',
        args: [],
        location: { line: 8, column: 3 },
      };

      const outerModuleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'outer',
          location: { line: 1, column: 8 },
        },
        parameters: [],
        body: [middleModuleDefinition, middleModuleCall],
        location: { line: 1, column: 1 },
      };

      const outerModuleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'outer',
        args: [],
        location: { line: 10, column: 1 },
      };

      const inputAST: ASTNode[] = [outerModuleDefinition, outerModuleCall];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.type).toBe('cube');
      expect((result.data?.[0] as any)?.size).toBe(5);
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
          location: { line: 4, column: 15 },
        },
        parameters: [],
        body: [
          {
            type: 'sphere',
            radius: 3,
            location: { line: 5, column: 9 },
          },
        ],
        location: { line: 4, column: 7 },
      };

      const level4Call: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'level4',
        args: [],
        location: { line: 7, column: 7 },
      };

      const level3Definition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'level3',
          location: { line: 3, column: 13 },
        },
        parameters: [],
        body: [level4Definition, level4Call],
        location: { line: 3, column: 5 },
      };

      const level3Call: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'level3',
        args: [],
        location: { line: 9, column: 5 },
      };

      const level2Definition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'level2',
          location: { line: 2, column: 11 },
        },
        parameters: [],
        body: [level3Definition, level3Call],
        location: { line: 2, column: 3 },
      };

      const level2Call: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'level2',
        args: [],
        location: { line: 11, column: 3 },
      };

      const level1Definition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'level1',
          location: { line: 1, column: 8 },
        },
        parameters: [],
        body: [level2Definition, level2Call],
        location: { line: 1, column: 1 },
      };

      const level1Call: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'level1',
        args: [],
        location: { line: 13, column: 1 },
      };

      const inputAST: ASTNode[] = [level1Definition, level1Call];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.type).toBe('sphere');
      expect((result.data?.[0] as any)?.radius).toBe(3);
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
        location: { line: 20, column: 1 },
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
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.type).toBe('cylinder');
      expect((result.data?.[0] as any)?.height).toBe(maxDepth);
      expect((result.data?.[0] as any)?.radius).toBe(maxDepth);

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
          location: { line: 3, column: 13 },
        },
        parameters: [],
        body: [
          {
            type: 'sphere',
            radius: 1,
            location: { line: 4, column: 7 },
          },
        ],
        location: { line: 3, column: 5 },
      };

      const leaf2: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'leaf2',
          location: { line: 5, column: 13 },
        },
        parameters: [],
        body: [
          {
            type: 'cube',
            size: 2,
            center: false,
            location: { line: 6, column: 7 },
          },
        ],
        location: { line: 5, column: 5 },
      };

      const leaf1Call: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'leaf1',
        args: [],
        location: { line: 7, column: 5 },
      };

      const leaf2Call: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'leaf2',
        args: [],
        location: { line: 8, column: 5 },
      };

      const middleModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'middle',
          location: { line: 2, column: 11 },
        },
        parameters: [],
        body: [leaf1, leaf2, leaf1Call, leaf2Call],
        location: { line: 2, column: 3 },
      };

      const middleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'middle',
        args: [],
        location: { line: 10, column: 3 },
      };

      const rootModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'root',
          location: { line: 1, column: 8 },
        },
        parameters: [],
        body: [middleModule, middleCall],
        location: { line: 1, column: 1 },
      };

      const rootCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'root',
        args: [],
        location: { line: 12, column: 1 },
      };

      const inputAST: ASTNode[] = [rootModule, rootCall];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);

      const sphereNodes = result.data?.filter((node: ASTNode) => node.type === 'sphere') || [];
      const cubeNodes = result.data?.filter((node: ASTNode) => node.type === 'cube') || [];

      expect(sphereNodes).toHaveLength(1);
      expect(cubeNodes).toHaveLength(1);
      expect((sphereNodes[0] as any)?.radius).toBe(1);
      expect((cubeNodes[0] as any)?.size).toBe(2);
    });
  });
});
