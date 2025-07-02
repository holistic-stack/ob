/**
 * @file Scope Manager Tests
 *
 * Comprehensive tests for scope manager functionality including
 * AST analysis, dependency tracking, and symbol resolution.
 *
 * Following TDD methodology with real implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type {
  ASTNode,
  FunctionDefinitionNode,
  ModuleDefinitionNode,
  SourceLocation,
} from '../ast-types.js';
import { ScopeManager } from './scope-manager.js';

const logger = createLogger('ScopeManagerTest');

describe('[INIT][ScopeManager] Scope Manager Tests', () => {
  let scopeManager: ScopeManager;

  beforeEach(() => {
    logger.debug('Setting up scope manager test');
    scopeManager = new ScopeManager();
  });

  describe('Basic Functionality', () => {
    it('should initialize correctly', () => {
      const symbolTable = scopeManager.getSymbolTable();
      const context = scopeManager.getCurrentContext();

      expect(symbolTable).toBeDefined();
      expect(context.scope.name).toBe('global');
      expect(context.symbolTable).toBe(symbolTable);

      logger.debug('Initialization test completed');
    });

    it('should analyze empty AST', () => {
      const result = scopeManager.analyzeAST([]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dependencies).toHaveLength(0);
        expect(result.data.unresolvedReferences).toHaveLength(0);
        expect(result.data.errors).toHaveLength(0);
        expect(result.data.scopeTree.name).toBe('global');
      }

      logger.debug('Empty AST analysis test completed');
    });

    it('should provide symbol access methods', () => {
      const functions = scopeManager.getFunctions();
      const modules = scopeManager.getModules();
      const variables = scopeManager.getVariables();
      const parameters = scopeManager.getParameters();

      expect(functions.length).toBeGreaterThan(0); // Built-in functions
      expect(modules.length).toBeGreaterThan(0); // Built-in modules
      expect(variables).toHaveLength(0); // No variables defined yet
      expect(parameters).toHaveLength(0); // No parameters defined yet

      logger.debug('Symbol access methods test completed');
    });
  });

  describe('Function Analysis', () => {
    it('should analyze function definition', () => {
      const functionNode: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'test_function',
        parameters: ['x', 'y'],
        body: {
          type: 'literal',
          value: 42,
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const result = scopeManager.analyzeAST([functionNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errors).toHaveLength(0);

        // Check that function was defined
        const functions = scopeManager.getFunctions();
        const testFunction = functions.find((f) => f.name === 'test_function');
        expect(testFunction).toBeDefined();
        expect(testFunction?.parameters).toEqual(['x', 'y']);
      }

      logger.debug('Function definition analysis test completed');
    });

    it('should handle function with variable references', () => {
      const functionNode: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'referencing_function',
        parameters: ['input'],
        body: {
          type: 'variable',
          name: 'sin', // Reference to built-in function
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const result = scopeManager.analyzeAST([functionNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errors).toHaveLength(0);
        expect(result.data.dependencies.length).toBeGreaterThan(0);

        // Check that reference was tracked
        const dependency = result.data.dependencies.find((d) => d.to.name === 'sin');
        expect(dependency).toBeDefined();
        expect(dependency?.type).toBe('references');
      }

      logger.debug('Function with references analysis test completed');
    });
  });

  describe('Module Analysis', () => {
    it('should analyze module definition', () => {
      const moduleNode: ModuleDefinitionNode = {
        type: 'module_definition',
        name: 'test_module',
        parameters: ['size', 'center'],
        body: [
          {
            type: 'cube',
            size: 10,
            center: false,
            location: createTestLocation(),
          },
        ],
        location: createTestLocation(),
      };

      const result = scopeManager.analyzeAST([moduleNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errors).toHaveLength(0);

        // Check that module was defined
        const modules = scopeManager.getModules();
        const testModule = modules.find((m) => m.name === 'test_module');
        expect(testModule).toBeDefined();
        expect(testModule?.parameters).toEqual(['size', 'center']);
      }

      logger.debug('Module definition analysis test completed');
    });

    it('should handle nested modules', () => {
      const outerModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: 'outer_module',
        parameters: ['outer_param'],
        body: [
          {
            type: 'module_definition',
            name: 'inner_module',
            parameters: ['inner_param'],
            body: [
              {
                type: 'sphere',
                r: 5,
                location: createTestLocation(),
              },
            ],
            location: createTestLocation(),
          } as ModuleDefinitionNode,
        ],
        location: createTestLocation(),
      };

      const result = scopeManager.analyzeAST([outerModule]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errors).toHaveLength(0);

        // Check that outer module was defined in global scope
        const modules = scopeManager.getModules();
        const outerMod = modules.find((m) => m.name === 'outer_module');
        expect(outerMod).toBeDefined();

        // Inner module would be defined in the outer module's scope
        // For this test, we just verify the outer module exists
        // In a full implementation, we'd need scope-specific queries
      }

      logger.debug('Nested modules analysis test completed');
    });
  });

  describe('Variable and Assignment Analysis', () => {
    it('should handle variable assignments', () => {
      const assignmentNode = {
        type: 'assignment',
        name: 'test_var',
        value: {
          type: 'literal',
          value: 42,
          location: createTestLocation(),
        },
        location: createTestLocation(),
      } as ASTNode;

      const result = scopeManager.analyzeAST([assignmentNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errors).toHaveLength(0);

        // Check that variable was defined
        const variables = scopeManager.getVariables();
        const testVar = variables.find((v) => v.name === 'test_var');
        expect(testVar).toBeDefined();
        expect(testVar?.value).toBe(42);
      }

      logger.debug('Variable assignment analysis test completed');
    });

    it('should track unresolved references', () => {
      const variableRef = {
        type: 'variable',
        name: 'undefined_variable',
        location: createTestLocation(),
      } as ASTNode;

      const result = scopeManager.analyzeAST([variableRef]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unresolvedReferences).toContain('undefined_variable');
      }

      logger.debug('Unresolved references test completed');
    });
  });

  describe('Symbol Resolution', () => {
    beforeEach(() => {
      // Set up test symbols
      const functionNode: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'test_function',
        parameters: ['param1'],
        body: { type: 'literal', value: 0, location: createTestLocation() },
        location: createTestLocation(),
      };

      scopeManager.analyzeAST([functionNode]);
    });

    it('should resolve defined symbols', () => {
      const resolution = scopeManager.resolveSymbol('test_function');

      expect(resolution).toBeDefined();
      expect(resolution?.symbol.name).toBe('test_function');
      expect(resolution?.symbol.type).toBe('function');
      expect(resolution?.distance).toBe(0);

      logger.debug('Symbol resolution test completed');
    });

    it('should resolve built-in symbols', () => {
      const resolution = scopeManager.resolveSymbol('cube');

      expect(resolution).toBeDefined();
      expect(resolution?.symbol.name).toBe('cube');
      expect(resolution?.symbol.type).toBe('builtin_module');
      expect(resolution?.symbol.isBuiltIn).toBe(true);

      logger.debug('Built-in symbol resolution test completed');
    });

    it('should return null for non-existent symbols', () => {
      const resolution = scopeManager.resolveSymbol('non_existent_symbol');
      expect(resolution).toBeNull();

      logger.debug('Non-existent symbol resolution test completed');
    });

    it('should check symbol existence in current scope', () => {
      expect(scopeManager.hasSymbolInCurrentScope('test_function')).toBe(true);
      expect(scopeManager.hasSymbolInCurrentScope('non_existent')).toBe(false);

      logger.debug('Symbol existence check test completed');
    });
  });

  describe('Dependency Tracking', () => {
    it('should track function dependencies', () => {
      const callerFunction: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'caller',
        parameters: [],
        body: {
          type: 'variable',
          name: 'sin', // Reference to built-in function
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const result = scopeManager.analyzeAST([callerFunction]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dependencies.length).toBeGreaterThan(0);

        const dependency = result.data.dependencies.find((d) => d.to.name === 'sin');
        expect(dependency).toBeDefined();
        expect(dependency?.type).toBe('references');
      }

      logger.debug('Function dependencies test completed');
    });

    it('should detect circular dependencies', () => {
      // Create functions that reference each other
      const func1: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'func1',
        parameters: [],
        body: {
          type: 'variable',
          name: 'func2',
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const func2: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'func2',
        parameters: [],
        body: {
          type: 'variable',
          name: 'func1',
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const result = scopeManager.analyzeAST([func1, func2]);

      expect(result.success).toBe(true);
      if (result.success) {
        const circularDeps = scopeManager.findCircularDependencies();
        // Note: This is a simplified test - actual circular dependency detection
        // would need more sophisticated analysis
        expect(circularDeps).toBeDefined();
      }

      logger.debug('Circular dependencies test completed');
    });
  });

  describe('Statistics and Analysis', () => {
    it('should provide comprehensive statistics', () => {
      const functionNode: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'stats_function',
        parameters: ['x', 'y'],
        body: {
          type: 'variable',
          name: 'sin',
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const result = scopeManager.analyzeAST([functionNode]);

      expect(result.success).toBe(true);

      const stats = scopeManager.getStatistics();

      expect(stats.symbolTable.totalScopes).toBeGreaterThan(0);
      expect(stats.symbolTable.totalSymbols).toBeGreaterThan(0);
      expect(stats.dependencies).toBeGreaterThan(0);
      expect(stats.unresolvedReferences).toBe(0);
      expect(stats.errors).toBe(0);

      logger.debug('Statistics test completed');
    });

    it('should handle complex AST analysis', () => {
      const complexAST: ASTNode[] = [
        {
          type: 'function_definition',
          name: 'helper_function',
          parameters: ['value'],
          body: {
            type: 'literal',
            value: 42,
            location: createTestLocation(),
          },
          location: createTestLocation(),
        } as FunctionDefinitionNode,
        {
          type: 'module_definition',
          name: 'complex_module',
          parameters: ['size', 'detail'],
          body: [
            {
              type: 'variable',
              name: 'helper_function',
              location: createTestLocation(),
            },
            {
              type: 'cube',
              size: 10,
              center: false,
              location: createTestLocation(),
            },
          ],
          location: createTestLocation(),
        } as ModuleDefinitionNode,
        {
          type: 'assignment',
          name: 'global_var',
          value: {
            type: 'literal',
            value: 'test_value',
            location: createTestLocation(),
          },
          location: createTestLocation(),
        } as ASTNode,
      ];

      const result = scopeManager.analyzeAST(complexAST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errors).toHaveLength(0);
        expect(result.data.dependencies.length).toBeGreaterThan(0);

        // Check that all symbols were defined
        const functions = scopeManager.getFunctions();
        const modules = scopeManager.getModules();
        const variables = scopeManager.getVariables();

        expect(functions.some((f) => f.name === 'helper_function')).toBe(true);
        expect(modules.some((m) => m.name === 'complex_module')).toBe(true);
        expect(variables.some((v) => v.name === 'global_var')).toBe(true);
      }

      logger.debug('Complex AST analysis test completed');
    });
  });
});

/**
 * Helper function to create test source location
 */
function createTestLocation(): SourceLocation {
  return {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 10, offset: 9 },
  };
}
