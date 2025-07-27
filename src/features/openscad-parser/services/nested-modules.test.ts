/**
 * @file nested-modules.test.ts
 * @description Tests for nested module support in OpenSCAD module resolution.
 * This test suite verifies that modules defined within other modules are correctly
 * parsed, resolved, and expanded with proper scoping rules.
 */

import { describe, expect, it } from 'vitest';
import type { ASTNode, ModuleDefinitionNode, ModuleInstantiationNode } from '../ast/ast-types.js';
import { ModuleRegistry } from './module-registry/module-registry.js';
import { ModuleResolver } from './module-resolver/module-resolver.js';

describe('Nested Module Support', () => {
  describe('Simple nested module', () => {
    it('should resolve nested module definition and call', () => {
      // Simulate the AST that would be generated from:
      // module moduleName() {
      //   module nestedModule() { 
      //     sphere(10);
      //   }
      //   nestedModule();
      // }
      // moduleName();

      const nestedModuleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'nestedModule',
          location: { line: 2, column: 11 },
        },
        parameters: [],
        body: [
          {
            type: 'sphere',
            radius: 10,
            location: { line: 3, column: 5 },
          },
        ],
        location: { line: 2, column: 3 },
      };

      const nestedModuleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'nestedModule',
        args: [],
        location: { line: 5, column: 3 },
      };

      const outerModuleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'moduleName',
          location: { line: 1, column: 8 },
        },
        parameters: [],
        body: [
          nestedModuleDefinition,
          nestedModuleCall,
        ],
        location: { line: 1, column: 1 },
      };

      const outerModuleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'moduleName',
        args: [],
        location: { line: 7, column: 1 },
      };

      const inputAST: ASTNode[] = [outerModuleDefinition, outerModuleCall];

      // Test the current module system (this should fail initially)
      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolveAST(inputAST);

      console.log('Nested module resolution result:', JSON.stringify(result, null, 2));

      // Nested modules should now work correctly
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.type).toBe('sphere');
      expect((result.data?.[0] as any)?.radius).toBe(10);
      console.log('✅ Nested modules working correctly!');
    });
  });

  describe('Multiple nesting levels', () => {
    it('should handle deeply nested modules', () => {
      // module outer() {
      //   module middle() {
      //     module inner() {
      //       cube(5);
      //     }
      //     inner();
      //   }
      //   middle();
      // }
      // outer();

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
        body: [
          innerModuleDefinition,
          innerModuleCall,
        ],
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
        body: [
          middleModuleDefinition,
          middleModuleCall,
        ],
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

      console.log('Deep nesting result:', JSON.stringify(result, null, 2));

      // Deep nesting should now work correctly
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.type).toBe('cube');
      expect((result.data?.[0] as any)?.size).toBe(5);
      console.log('✅ Deep nesting working correctly!');
    });
  });

  describe('Scope isolation', () => {
    it('should isolate nested module scope from parent', () => {
      // module moduleA() {
      //   module localModule() { sphere(5); }
      //   localModule();
      // }
      // module moduleB() {
      //   module localModule() { cube(10); }
      //   localModule();
      // }
      // moduleA();
      // moduleB();

      // This test verifies that modules with the same name in different scopes
      // don't interfere with each other

      const localModuleA: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'localModule',
          location: { line: 2, column: 11 },
        },
        parameters: [],
        body: [
          {
            type: 'sphere',
            radius: 5,
            location: { line: 2, column: 30 },
          },
        ],
        location: { line: 2, column: 3 },
      };

      const localModuleB: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'localModule',
          location: { line: 6, column: 11 },
        },
        parameters: [],
        body: [
          {
            type: 'cube',
            size: 10,
            center: false,
            location: { line: 6, column: 30 },
          },
        ],
        location: { line: 6, column: 3 },
      };

      const moduleA: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'moduleA',
          location: { line: 1, column: 8 },
        },
        parameters: [],
        body: [
          localModuleA,
          {
            type: 'module_instantiation',
            name: 'localModule',
            args: [],
            location: { line: 3, column: 3 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const moduleB: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'moduleB',
          location: { line: 5, column: 8 },
        },
        parameters: [],
        body: [
          localModuleB,
          {
            type: 'module_instantiation',
            name: 'localModule',
            args: [],
            location: { line: 7, column: 3 },
          },
        ],
        location: { line: 5, column: 1 },
      };

      const inputAST: ASTNode[] = [
        moduleA,
        moduleB,
        {
          type: 'module_instantiation',
          name: 'moduleA',
          args: [],
          location: { line: 9, column: 1 },
        },
        {
          type: 'module_instantiation',
          name: 'moduleB',
          args: [],
          location: { line: 10, column: 1 },
        },
      ];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolveAST(inputAST);

      console.log('Scope isolation result:', JSON.stringify(result, null, 2));

      // Scope isolation should now work correctly
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);

      const sphereNodes = result.data?.filter((node: ASTNode) => node.type === 'sphere') || [];
      const cubeNodes = result.data?.filter((node: ASTNode) => node.type === 'cube') || [];

      expect(sphereNodes).toHaveLength(1);
      expect(cubeNodes).toHaveLength(1);
      expect((sphereNodes[0] as any)?.radius).toBe(5);
      expect((cubeNodes[0] as any)?.size).toBe(10);
      console.log('✅ Scope isolation working correctly!');
    });
  });
});
