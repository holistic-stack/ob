/**
 * @file simple-nesting.test.ts
 * @description Tests for simple nested module scenarios in OpenSCAD.
 * Focuses on basic one-level nesting with single module definitions and calls.
 *
 * @example
 * ```openscad
 * module outer() {
 *   module inner() { sphere(10); }
 *   inner();
 * }
 * outer();
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
import {
  createTestModule,
  createTestModuleCall,
  createTestSphere,
  createTestCube,
  createTestTranslate,
  createNestedTestModule,
} from '../test-utils.js';

describe('Simple Nested Module Support', () => {
  describe('Basic nested module with primitive', () => {
    it('should resolve nested module with sphere', () => {
      // Test case: module moduleName() { module nestedModule() { sphere(10); } nestedModule(); } moduleName();
      const sphereNode = createTestSphere(10);
      const nestedModule = createNestedTestModule('moduleName', 'nestedModule', sphereNode);
      const outerCall = createTestModuleCall('moduleName');

      const inputAST: ASTNode[] = [nestedModule, outerCall];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.type).toBe('sphere');
      expect((result.data?.[0] as any)?.radius).toBe(10);
    });

    it('should resolve nested module with cube', () => {
      // Test case: module outer() { module inner() { cube(5); } inner(); } outer();
      const cubeNode = createTestCube(5);
      const nestedModule = createNestedTestModule('outer', 'inner', cubeNode);
      const outerCall = createTestModuleCall('outer');

      const inputAST: ASTNode[] = [nestedModule, outerCall];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.type).toBe('cube');
      expect((result.data?.[0] as any)?.size).toBe(5);
    });
  });

  describe('Nested module with transformations', () => {
    it('should resolve nested module with translate', () => {
      // Test case: module outer() { module inner() { translate([1,2,3]) cube(5); } inner(); } outer();
      const nestedModuleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'inner',
          location: { line: 2, column: 11 },
        },
        parameters: [],
        body: [
          {
            type: 'translate',
            vector: [1, 2, 3],
            children: [
              {
                type: 'cube',
                size: 5,
                center: false,
                location: { line: 3, column: 25 },
              },
            ],
            location: { line: 3, column: 5 },
          },
        ],
        location: { line: 2, column: 3 },
      };

      const nestedModuleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'inner',
        args: [],
        location: { line: 5, column: 3 },
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
        body: [nestedModuleDefinition, nestedModuleCall],
        location: { line: 1, column: 1 },
      };

      const outerModuleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'outer',
        args: [],
        location: { line: 7, column: 1 },
      };

      const inputAST: ASTNode[] = [outerModuleDefinition, outerModuleCall];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.type).toBe('translate');
      expect((result.data?.[0] as any)?.vector).toEqual([1, 2, 3]);
      expect((result.data?.[0] as any)?.children).toHaveLength(1);
      expect((result.data?.[0] as any)?.children[0]?.type).toBe('cube');
    });
  });

  describe('Multiple nested modules in same scope', () => {
    it('should resolve multiple nested modules', () => {
      // Test case: module outer() { module inner1() { sphere(5); } module inner2() { cube(10); } inner1(); inner2(); } outer();
      const inner1Definition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'inner1',
          location: { line: 2, column: 11 },
        },
        parameters: [],
        body: [
          {
            type: 'sphere',
            radius: 5,
            location: { line: 2, column: 25 },
          },
        ],
        location: { line: 2, column: 3 },
      };

      const inner2Definition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'inner2',
          location: { line: 3, column: 11 },
        },
        parameters: [],
        body: [
          {
            type: 'cube',
            size: 10,
            center: false,
            location: { line: 3, column: 25 },
          },
        ],
        location: { line: 3, column: 3 },
      };

      const inner1Call: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'inner1',
        args: [],
        location: { line: 4, column: 3 },
      };

      const inner2Call: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'inner2',
        args: [],
        location: { line: 5, column: 3 },
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
        body: [inner1Definition, inner2Definition, inner1Call, inner2Call],
        location: { line: 1, column: 1 },
      };

      const outerModuleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'outer',
        args: [],
        location: { line: 7, column: 1 },
      };

      const inputAST: ASTNode[] = [outerModuleDefinition, outerModuleCall];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);

      const sphereNodes = result.data?.filter((node: ASTNode) => node.type === 'sphere') || [];
      const cubeNodes = result.data?.filter((node: ASTNode) => node.type === 'cube') || [];

      expect(sphereNodes).toHaveLength(1);
      expect(cubeNodes).toHaveLength(1);
      expect((sphereNodes[0] as any)?.radius).toBe(5);
      expect((cubeNodes[0] as any)?.size).toBe(10);
    });
  });
});
