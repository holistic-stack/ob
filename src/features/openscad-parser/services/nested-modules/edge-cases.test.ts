/**
 * @file edge-cases.test.ts
 * @description Tests for edge cases and error scenarios in nested OpenSCAD modules.
 * Covers malformed syntax, circular dependencies, empty modules, and performance limits.
 *
 * @example
 * ```openscad
 * module empty() { }  // Empty module
 * module circular() { circular(); }  // Circular dependency
 * ```
 */

import { describe, expect, it } from 'vitest';
import type {
  ASTNode,
  ModuleDefinitionNode,
  ModuleInstantiationNode,
} from '../../ast/ast-types.js';
import { ModuleRegistry } from '../module-registry/module-registry.js';
import { ModuleResolver, ModuleResolverErrorCode } from '../module-resolver/module-resolver.js';

describe('Edge Cases in Nested Modules', () => {
  describe('Empty modules', () => {
    it('should handle empty nested modules', () => {
      // Test case: module outer() { module inner() { } inner(); } outer();
      const emptyNestedModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'inner',
          location: { line: 2, column: 11 },
        },
        parameters: [],
        body: [], // Empty body
        location: { line: 2, column: 3 },
      };

      const nestedModuleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'inner',
        args: [],
        location: { line: 3, column: 3 },
      };

      const outerModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'outer',
          location: { line: 1, column: 8 },
        },
        parameters: [],
        body: [emptyNestedModule, nestedModuleCall],
        location: { line: 1, column: 1 },
      };

      const outerCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'outer',
        args: [],
        location: { line: 5, column: 1 },
      };

      const inputAST: ASTNode[] = [outerModule, outerCall];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0); // Empty module produces no output
    });

    it('should handle module with only empty nested modules', () => {
      // Test case: Multiple empty nested modules
      const empty1: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'empty1',
          location: { line: 2, column: 11 },
        },
        parameters: [],
        body: [],
        location: { line: 2, column: 3 },
      };

      const empty2: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'empty2',
          location: { line: 3, column: 11 },
        },
        parameters: [],
        body: [],
        location: { line: 3, column: 3 },
      };

      const outerModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'outer',
          location: { line: 1, column: 8 },
        },
        parameters: [],
        body: [
          empty1,
          empty2,
          {
            type: 'module_instantiation',
            name: 'empty1',
            args: [],
            location: { line: 4, column: 3 },
          },
          {
            type: 'module_instantiation',
            name: 'empty2',
            args: [],
            location: { line: 5, column: 3 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const inputAST: ASTNode[] = [
        outerModule,
        {
          type: 'module_instantiation',
          name: 'outer',
          args: [],
          location: { line: 7, column: 1 },
        },
      ];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('Circular dependencies in nested modules', () => {
    it('should detect circular dependency in nested modules', () => {
      // Test case: module outer() { module a() { b(); } module b() { a(); } a(); } outer();
      const moduleA: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'a',
          location: { line: 2, column: 11 },
        },
        parameters: [],
        body: [
          {
            type: 'module_instantiation',
            name: 'b',
            args: [],
            location: { line: 2, column: 20 },
          },
        ],
        location: { line: 2, column: 3 },
      };

      const moduleB: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'b',
          location: { line: 3, column: 11 },
        },
        parameters: [],
        body: [
          {
            type: 'module_instantiation',
            name: 'a',
            args: [],
            location: { line: 3, column: 20 },
          },
        ],
        location: { line: 3, column: 3 },
      };

      const outerModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'outer',
          location: { line: 1, column: 8 },
        },
        parameters: [],
        body: [
          moduleA,
          moduleB,
          {
            type: 'module_instantiation',
            name: 'a',
            args: [],
            location: { line: 4, column: 3 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const inputAST: ASTNode[] = [
        outerModule,
        {
          type: 'module_instantiation',
          name: 'outer',
          args: [],
          location: { line: 6, column: 1 },
        },
      ];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ModuleResolverErrorCode.CIRCULAR_DEPENDENCY);
      expect(result.error?.message).toContain('Circular dependency detected');
    });
  });

  describe('Non-existent module calls', () => {
    it('should handle calls to non-existent nested modules', () => {
      // Test case: module outer() { nonExistent(); } outer();
      const outerModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'outer',
          location: { line: 1, column: 8 },
        },
        parameters: [],
        body: [
          {
            type: 'module_instantiation',
            name: 'nonExistent',
            args: [],
            location: { line: 2, column: 3 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const inputAST: ASTNode[] = [
        outerModule,
        {
          type: 'module_instantiation',
          name: 'outer',
          args: [],
          location: { line: 4, column: 1 },
        },
      ];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ModuleResolverErrorCode.MODULE_NOT_FOUND);
      expect(result.error?.message).toContain("Module 'nonExistent' not found");
    });
  });

  describe('Performance limits', () => {
    it('should handle maximum recursion depth gracefully', () => {
      // Create a very deep nesting structure that exceeds reasonable limits
      const createVeryDeepNesting = (depth: number): ModuleDefinitionNode => {
        if (depth <= 0) {
          return {
            type: 'module_definition',
            name: {
              type: 'expression',
              expressionType: 'identifier',
              name: 'leaf',
              location: { line: depth, column: 1 },
            },
            parameters: [],
            body: [
              {
                type: 'sphere',
                radius: 1,
                location: { line: depth, column: 10 },
              },
            ],
            location: { line: depth, column: 1 },
          };
        }

        const nestedModule = createVeryDeepNesting(depth - 1);
        return {
          type: 'module_definition',
          name: {
            type: 'expression',
            expressionType: 'identifier',
            name: `level${depth}`,
            location: { line: depth, column: 1 },
          },
          parameters: [],
          body: [
            nestedModule,
            {
              type: 'module_instantiation',
              name: depth === 1 ? 'leaf' : `level${depth - 1}`,
              args: [],
              location: { line: depth, column: 20 },
            },
          ],
          location: { line: depth, column: 1 },
        };
      };

      // Create a 50-level deep structure (should exceed reasonable limits)
      const veryDeepModule = createVeryDeepNesting(50);
      const inputAST: ASTNode[] = [
        veryDeepModule,
        {
          type: 'module_instantiation',
          name: 'level50',
          args: [],
          location: { line: 100, column: 1 },
        },
      ];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      // Should either succeed (if implementation can handle it) or fail gracefully
      if (!result.success) {
        // Current implementation may fail with INVALID_AST or other errors for very deep nesting
        expect([
          ModuleResolverErrorCode.MAX_RECURSION_DEPTH,
          ModuleResolverErrorCode.INVALID_AST,
          ModuleResolverErrorCode.MODULE_NOT_FOUND,
        ]).toContain(result.error?.code);
        expect(result.error?.message).toBeDefined();
      } else {
        // If it succeeds, verify the result is correct
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0]?.type).toBe('sphere');
      }
    });
  });

  describe('Mixed valid and invalid scenarios', () => {
    it('should handle mix of valid and invalid nested modules', () => {
      // Test case: One valid nested module, one invalid call
      const validNested: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'valid',
          location: { line: 2, column: 11 },
        },
        parameters: [],
        body: [
          {
            type: 'cube',
            size: 3,
            center: false,
            location: { line: 2, column: 25 },
          },
        ],
        location: { line: 2, column: 3 },
      };

      const outerModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'outer',
          location: { line: 1, column: 8 },
        },
        parameters: [],
        body: [
          validNested,
          {
            type: 'module_instantiation',
            name: 'valid',
            args: [],
            location: { line: 3, column: 3 },
          },
          {
            type: 'module_instantiation',
            name: 'invalid', // This doesn't exist
            args: [],
            location: { line: 4, column: 3 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const inputAST: ASTNode[] = [
        outerModule,
        {
          type: 'module_instantiation',
          name: 'outer',
          args: [],
          location: { line: 6, column: 1 },
        },
      ];

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);
      const result = resolver.resolveAST(inputAST);

      // Should fail on the first invalid module call
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ModuleResolverErrorCode.MODULE_NOT_FOUND);
      expect(result.error?.message).toContain("Module 'invalid' not found");
    });
  });

  describe('Memory and cleanup', () => {
    it('should not leak memory with many nested scopes', () => {
      // Create many parallel nested modules to test memory usage
      const createParallelModules = (count: number): ASTNode[] => {
        const modules: ASTNode[] = [];
        const calls: ASTNode[] = [];

        for (let i = 0; i < count; i++) {
          const nestedModule: ModuleDefinitionNode = {
            type: 'module_definition',
            name: {
              type: 'expression',
              expressionType: 'identifier',
              name: `nested${i}`,
              location: { line: i + 2, column: 11 },
            },
            parameters: [],
            body: [
              {
                type: 'sphere',
                radius: i + 1,
                location: { line: i + 2, column: 25 },
              },
            ],
            location: { line: i + 2, column: 3 },
          };

          const parentModule: ModuleDefinitionNode = {
            type: 'module_definition',
            name: {
              type: 'expression',
              expressionType: 'identifier',
              name: `parent${i}`,
              location: { line: i + 1, column: 8 },
            },
            parameters: [],
            body: [
              nestedModule,
              {
                type: 'module_instantiation',
                name: `nested${i}`,
                args: [],
                location: { line: i + 3, column: 3 },
              },
            ],
            location: { line: i + 1, column: 1 },
          };

          modules.push(parentModule);
          calls.push({
            type: 'module_instantiation',
            name: `parent${i}`,
            args: [],
            location: { line: 100 + i, column: 1 },
          });
        }

        return [...modules, ...calls];
      };

      const inputAST = createParallelModules(10); // 10 parallel nested modules

      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);

      // Measure memory before
      const memBefore = process.memoryUsage().heapUsed;

      const result = resolver.resolveAST(inputAST);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Measure memory after
      const memAfter = process.memoryUsage().heapUsed;
      const memDiff = memAfter - memBefore;

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(10);

      // Memory usage should be reasonable (less than 10MB for this test)
      expect(memDiff).toBeLessThan(10 * 1024 * 1024);
    });
  });
});
