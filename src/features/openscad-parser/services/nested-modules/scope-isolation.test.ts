/**
 * @file scope-isolation.test.ts
 * @description Tests for scope isolation in nested OpenSCAD modules.
 * Ensures that modules with the same name in different scopes don't interfere with each other.
 *
 * @example
 * ```openscad
 * module moduleA() {
 *   module localModule() { sphere(5); }
 *   localModule();
 * }
 * module moduleB() {
 *   module localModule() { cube(10); }  // Same name, different scope
 *   localModule();
 * }
 * moduleA(); moduleB();
 * ```
 */

import { describe, expect, it } from 'vitest';
import type { ASTNode, ModuleDefinitionNode } from '../../ast/ast-types.js';
import { ModuleRegistry } from '../module-registry/module-registry.js';
import { ModuleResolver } from '../module-resolver/module-resolver.js';
import { createSourceLocation } from '../test-utils.js';

describe('Scope Isolation in Nested Modules', () => {
  describe('Same-named modules in different scopes', () => {
    it('should isolate modules with identical names in different parent scopes', () => {
      // Test case: Two parent modules each define a local module with the same name
      const localModuleA: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'localModule',
          location: {
            start: { line: 2, column: 11, offset: 0 },
            end: { line: 2, column: 20, offset: 9 },
          },
        },
        parameters: [],
        body: [
          {
            type: 'sphere',
            radius: 5,
            location: {
              start: { line: 2, column: 30, offset: 0 },
              end: { line: 2, column: 40, offset: 10 },
            },
          },
        ],
        location: {
          start: { line: 2, column: 3, offset: 0 },
          end: { line: 2, column: 12, offset: 9 },
        },
      };

      const localModuleB: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'localModule',
          location: {
            start: { line: 6, column: 11, offset: 0 },
            end: { line: 6, column: 20, offset: 9 },
          },
        },
        parameters: [],
        body: [
          {
            type: 'cube',
            size: 10,
            center: false,
            location: {
              start: { line: 6, column: 30, offset: 0 },
              end: { line: 6, column: 40, offset: 10 },
            },
          },
        ],
        location: {
          start: { line: 6, column: 3, offset: 0 },
          end: { line: 6, column: 12, offset: 9 },
        },
      };

      const moduleA: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'moduleA',
          location: {
            start: { line: 1, column: 8, offset: 0 },
            end: { line: 1, column: 17, offset: 9 },
          },
        },
        parameters: [],
        body: [
          localModuleA,
          {
            type: 'module_instantiation',
            name: 'localModule',
            args: [],
            location: {
              start: { line: 3, column: 3, offset: 0 },
              end: { line: 3, column: 12, offset: 9 },
            },
          },
        ],
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      };

      const moduleB: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'moduleB',
          location: {
            start: { line: 5, column: 8, offset: 0 },
            end: { line: 5, column: 17, offset: 9 },
          },
        },
        parameters: [],
        body: [
          localModuleB,
          {
            type: 'module_instantiation',
            name: 'localModule',
            args: [],
            location: {
              start: { line: 7, column: 3, offset: 0 },
              end: { line: 7, column: 12, offset: 9 },
            },
          },
        ],
        location: {
          start: { line: 5, column: 1, offset: 0 },
          end: { line: 5, column: 10, offset: 9 },
        },
      };

      const inputAST: ASTNode[] = [
        moduleA,
        moduleB,
        {
          type: 'module_instantiation',
          name: 'moduleA',
          args: [],
          location: {
            start: { line: 9, column: 1, offset: 0 },
            end: { line: 9, column: 10, offset: 9 },
          },
        },
        {
          type: 'module_instantiation',
          name: 'moduleB',
          args: [],
          location: {
            start: { line: 10, column: 1, offset: 0 },
            end: { line: 10, column: 10, offset: 9 },
          },
        },
      ];

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
        expect((sphereNodes[0] as any)?.radius).toBe(5);
        expect((cubeNodes[0] as any)?.size).toBe(10);
      }
    });
  });

  describe('Nested scope visibility', () => {
    it('should allow nested modules to access parent scope modules', () => {
      // Test case: Inner module calls a module defined in parent scope
      const parentHelper: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'parentHelper',
          location: {
            start: { line: 2, column: 11, offset: 0 },
            end: { line: 2, column: 20, offset: 9 },
          },
        },
        parameters: [],
        body: [
          {
            type: 'cylinder',
            height: 10,
            radius: 3,
            center: false,
            location: {
              start: { line: 2, column: 30, offset: 0 },
              end: { line: 2, column: 40, offset: 10 },
            },
          },
        ],
        location: {
          start: { line: 2, column: 3, offset: 0 },
          end: { line: 2, column: 12, offset: 9 },
        },
      };

      const nestedModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'nestedModule',
          location: {
            start: { line: 3, column: 11, offset: 0 },
            end: { line: 3, column: 20, offset: 9 },
          },
        },
        parameters: [],
        body: [
          {
            type: 'module_instantiation',
            name: 'parentHelper', // Calling parent scope module
            args: [],
            location: {
              start: { line: 4, column: 5, offset: 0 },
              end: { line: 4, column: 14, offset: 9 },
            },
          },
        ],
        location: {
          start: { line: 3, column: 3, offset: 0 },
          end: { line: 3, column: 12, offset: 9 },
        },
      };

      const parentModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'parentModule',
          location: {
            start: { line: 1, column: 8, offset: 0 },
            end: { line: 1, column: 17, offset: 9 },
          },
        },
        parameters: [],
        body: [
          parentHelper,
          nestedModule,
          {
            type: 'module_instantiation',
            name: 'nestedModule',
            args: [],
            location: {
              start: { line: 6, column: 3, offset: 0 },
              end: { line: 6, column: 12, offset: 9 },
            },
          },
        ],
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      };

      const inputAST: ASTNode[] = [
        parentModule,
        {
          type: 'module_instantiation',
          name: 'parentModule',
          args: [],
          location: {
            start: { line: 8, column: 1, offset: 0 },
            end: { line: 8, column: 10, offset: 9 },
          },
        },
      ];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0]?.type).toBe('cylinder');
        expect((result.data?.[0] as any)?.height).toBe(10);
        expect((result.data?.[0] as any)?.radius).toBe(3);
      }
    });
  });

  describe('Scope shadowing', () => {
    it('should handle local modules shadowing parent scope modules', () => {
      // Test case: Local module with same name as parent scope module should take precedence
      const globalHelper: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'helper',
          location: createSourceLocation(1, 8, 8, 1, 14, 14),
        },
        parameters: [],
        body: [
          {
            type: 'sphere',
            radius: 100, // This should NOT be used
            location: createSourceLocation(1, 20, 20, 1, 30, 30),
          },
        ],
        location: createSourceLocation(1, 1, 1, 1, 40, 40),
      };

      const localHelper: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'helper',
          location: { line: 4, column: 11 },
        },
        parameters: [],
        body: [
          {
            type: 'cube',
            size: 5, // This SHOULD be used (shadows global)
            center: false,
            location: { line: 4, column: 25 },
          },
        ],
        location: { line: 4, column: 3 },
      };

      const testModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'testModule',
          location: { line: 3, column: 8 },
        },
        parameters: [],
        body: [
          localHelper,
          {
            type: 'module_instantiation',
            name: 'helper', // Should call local helper, not global
            args: [],
            location: { line: 5, column: 3 },
          },
        ],
        location: { line: 3, column: 1 },
      };

      const inputAST: ASTNode[] = [
        globalHelper,
        testModule,
        {
          type: 'module_instantiation',
          name: 'testModule',
          args: [],
          location: { line: 7, column: 1 },
        },
      ];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0]?.type).toBe('cube'); // Should be cube, not sphere
        expect((result.data?.[0] as any)?.size).toBe(5); // Should be 5, not 100
      }
    });
  });

  describe('Complex scope hierarchies', () => {
    it('should handle complex multi-level scope hierarchies', () => {
      // Test case: 3-level hierarchy with scope inheritance and shadowing
      const level3Module: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'level3',
          location: { line: 4, column: 13 },
        },
        parameters: [],
        body: [
          {
            type: 'module_instantiation',
            name: 'sharedHelper', // Should find this in level1 scope
            args: [],
            location: { line: 5, column: 7 },
          },
        ],
        location: { line: 4, column: 5 },
      };

      const level2Module: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'level2',
          location: { line: 3, column: 11 },
        },
        parameters: [],
        body: [
          level3Module,
          {
            type: 'module_instantiation',
            name: 'level3',
            args: [],
            location: { line: 7, column: 5 },
          },
        ],
        location: { line: 3, column: 3 },
      };

      const sharedHelper: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'sharedHelper',
          location: { line: 2, column: 11 },
        },
        parameters: [],
        body: [
          {
            type: 'sphere',
            radius: 7,
            location: { line: 2, column: 30 },
          },
        ],
        location: { line: 2, column: 3 },
      };

      const level1Module: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'level1',
          location: { line: 1, column: 8 },
        },
        parameters: [],
        body: [
          sharedHelper,
          level2Module,
          {
            type: 'module_instantiation',
            name: 'level2',
            args: [],
            location: { line: 9, column: 3 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const inputAST: ASTNode[] = [
        level1Module,
        {
          type: 'module_instantiation',
          name: 'level1',
          args: [],
          location: { line: 11, column: 1 },
        },
      ];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0]?.type).toBe('sphere');
        expect((result.data?.[0] as any)?.radius).toBe(7);
      }
    });
  });
});
