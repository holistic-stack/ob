/**
 * @file Symbol Table Tests
 *
 * Comprehensive tests for symbol table functionality including
 * scope management, symbol resolution, and built-in symbols.
 *
 * Following TDD methodology with real implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { FunctionDefinitionNode, ModuleDefinitionNode, SourceLocation } from '../ast-types.js';
import { SymbolTable } from './symbol-table.js';

const logger = createLogger('SymbolTableTest');

describe('[INIT][SymbolTable] Symbol Table Tests', () => {
  let symbolTable: SymbolTable;

  beforeEach(() => {
    logger.debug('Setting up symbol table test');
    symbolTable = new SymbolTable();
  });

  describe('Basic Functionality', () => {
    it('should initialize with global scope', () => {
      const globalScope = symbolTable.getGlobalScope();
      const currentScope = symbolTable.getCurrentScope();

      expect(globalScope).toBeDefined();
      expect(currentScope).toBe(globalScope);
      expect(globalScope.name).toBe('global');
      expect(globalScope.level).toBe(0);
      expect(globalScope.parent).toBeUndefined();

      logger.debug('Global scope initialization test completed');
    });

    it('should have built-in functions and modules', () => {
      const globalScope = symbolTable.getGlobalScope();

      // Check for some built-in functions
      expect(globalScope.symbols.has('sin')).toBe(true);
      expect(globalScope.symbols.has('cos')).toBe(true);
      expect(globalScope.symbols.has('sqrt')).toBe(true);
      expect(globalScope.symbols.has('str')).toBe(true);

      // Check for some built-in modules
      expect(globalScope.symbols.has('cube')).toBe(true);
      expect(globalScope.symbols.has('sphere')).toBe(true);
      expect(globalScope.symbols.has('translate')).toBe(true);
      expect(globalScope.symbols.has('union')).toBe(true);

      logger.debug('Built-in symbols test completed');
    });

    it('should get statistics correctly', () => {
      const stats = symbolTable.getStatistics();

      expect(stats.totalScopes).toBe(1); // Only global scope
      expect(stats.currentScopeLevel).toBe(0);
      expect(stats.totalSymbols).toBeGreaterThan(0);
      expect(stats.symbolsByType.builtin_function).toBeGreaterThan(0);
      expect(stats.symbolsByType.builtin_module).toBeGreaterThan(0);

      logger.debug('Statistics test completed');
    });
  });

  describe('Scope Management', () => {
    it('should enter and exit scopes correctly', () => {
      const initialScope = symbolTable.getCurrentScope();

      // Enter new scope
      const newScope = symbolTable.enterScope('test_scope');
      expect(newScope.name).toBe('test_scope');
      expect(newScope.level).toBe(1);
      expect(newScope.parent).toBe(initialScope);
      expect(symbolTable.getCurrentScope()).toBe(newScope);

      // Exit scope
      const exitedScope = symbolTable.exitScope();
      expect(exitedScope).toBe(newScope);
      expect(symbolTable.getCurrentScope()).toBe(initialScope);

      logger.debug('Scope enter/exit test completed');
    });

    it('should handle nested scopes', () => {
      const globalScope = symbolTable.getCurrentScope();

      // Enter first level
      const level1 = symbolTable.enterScope('level1');
      expect(level1.level).toBe(1);

      // Enter second level
      const level2 = symbolTable.enterScope('level2');
      expect(level2.level).toBe(2);
      expect(level2.parent).toBe(level1);

      // Enter third level
      const level3 = symbolTable.enterScope('level3');
      expect(level3.level).toBe(3);
      expect(level3.parent).toBe(level2);

      // Exit back to global
      symbolTable.exitScope(); // level3 -> level2
      symbolTable.exitScope(); // level2 -> level1
      symbolTable.exitScope(); // level1 -> global

      expect(symbolTable.getCurrentScope()).toBe(globalScope);

      logger.debug('Nested scopes test completed');
    });

    it('should not exit global scope', () => {
      const globalScope = symbolTable.getCurrentScope();

      const result = symbolTable.exitScope();
      expect(result).toBeNull();
      expect(symbolTable.getCurrentScope()).toBe(globalScope);

      logger.debug('Global scope exit prevention test completed');
    });
  });

  describe('Symbol Definition', () => {
    it('should define function symbols', () => {
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

      const result = symbolTable.defineFunction(functionNode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('test_function');
        expect(result.data.type).toBe('function');
        expect(result.data.parameters).toEqual(['x', 'y']);
        expect(result.data.isBuiltIn).toBe(false);
      }

      logger.debug('Function symbol definition test completed');
    });

    it('should define module symbols', () => {
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

      const result = symbolTable.defineModule(moduleNode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('test_module');
        expect(result.data.type).toBe('module');
        expect(result.data.parameters).toEqual(['size', 'center']);
        expect(result.data.isBuiltIn).toBe(false);
      }

      logger.debug('Module symbol definition test completed');
    });

    it('should define variable symbols', () => {
      const result = symbolTable.defineVariable('test_var', createTestLocation(), 42);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('test_var');
        expect(result.data.type).toBe('variable');
        expect(result.data.value).toBe(42);
        expect(result.data.isBuiltIn).toBe(false);
      }

      logger.debug('Variable symbol definition test completed');
    });

    it('should define parameter symbols', () => {
      const result = symbolTable.defineParameter('test_param', createTestLocation());

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('test_param');
        expect(result.data.type).toBe('parameter');
        expect(result.data.isBuiltIn).toBe(false);
      }

      logger.debug('Parameter symbol definition test completed');
    });

    it('should prevent duplicate symbol definitions in same scope', () => {
      // Define first symbol
      const result1 = symbolTable.defineVariable('duplicate_var', createTestLocation(), 1);
      expect(result1.success).toBe(true);

      // Try to define duplicate
      const result2 = symbolTable.defineVariable('duplicate_var', createTestLocation(), 2);
      expect(result2.success).toBe(false);
      if (!result2.success) {
        expect(result2.error.code).toBe('SYMBOL_ALREADY_DEFINED');
        expect(result2.error.message).toContain('duplicate_var');
      }

      logger.debug('Duplicate symbol prevention test completed');
    });
  });

  describe('Symbol Resolution', () => {
    it('should resolve symbols in current scope', () => {
      // Define a symbol
      symbolTable.defineVariable('local_var', createTestLocation(), 'test_value');

      // Resolve it
      const resolution = symbolTable.resolveSymbol('local_var');
      expect(resolution).toBeDefined();
      expect(resolution?.symbol.name).toBe('local_var');
      expect(resolution?.distance).toBe(0);

      logger.debug('Local symbol resolution test completed');
    });

    it('should resolve symbols in parent scopes', () => {
      // Define symbol in global scope
      symbolTable.defineVariable('global_var', createTestLocation(), 'global_value');

      // Enter nested scope
      symbolTable.enterScope('nested');

      // Resolve symbol from parent scope
      const resolution = symbolTable.resolveSymbol('global_var');
      expect(resolution).toBeDefined();
      expect(resolution?.symbol.name).toBe('global_var');
      expect(resolution?.distance).toBe(1);

      logger.debug('Parent scope resolution test completed');
    });

    it('should resolve built-in symbols', () => {
      const resolution = symbolTable.resolveSymbol('sin');
      expect(resolution).toBeDefined();
      expect(resolution?.symbol.name).toBe('sin');
      expect(resolution?.symbol.isBuiltIn).toBe(true);
      expect(resolution?.symbol.type).toBe('builtin_function');

      logger.debug('Built-in symbol resolution test completed');
    });

    it('should return null for non-existent symbols', () => {
      const resolution = symbolTable.resolveSymbol('non_existent_symbol');
      expect(resolution).toBeNull();

      logger.debug('Non-existent symbol resolution test completed');
    });

    it('should shadow symbols correctly', () => {
      // Define symbol in global scope
      symbolTable.defineVariable('shadowed_var', createTestLocation(), 'global_value');

      // Enter nested scope and define same symbol
      symbolTable.enterScope('nested');
      symbolTable.defineVariable('shadowed_var', createTestLocation(), 'local_value');

      // Resolve should find local symbol
      const resolution = symbolTable.resolveSymbol('shadowed_var');
      expect(resolution).toBeDefined();
      expect(resolution?.symbol.value).toBe('local_value');
      expect(resolution?.distance).toBe(0);

      // Exit scope and resolve again
      symbolTable.exitScope();
      const globalResolution = symbolTable.resolveSymbol('shadowed_var');
      expect(globalResolution?.symbol.value).toBe('global_value');

      logger.debug('Symbol shadowing test completed');
    });
  });

  describe('Symbol Queries', () => {
    beforeEach(() => {
      // Set up test symbols
      symbolTable.defineVariable('var1', createTestLocation(), 1);
      symbolTable.defineVariable('var2', createTestLocation(), 2);

      const functionNode: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'func1',
        parameters: ['x'],
        body: { type: 'literal', value: 42, location: createTestLocation() },
        location: createTestLocation(),
      };
      symbolTable.defineFunction(functionNode);
    });

    it('should check symbol existence in current scope', () => {
      expect(symbolTable.hasSymbolInCurrentScope('var1')).toBe(true);
      expect(symbolTable.hasSymbolInCurrentScope('func1')).toBe(true);
      expect(symbolTable.hasSymbolInCurrentScope('non_existent')).toBe(false);

      logger.debug('Symbol existence check test completed');
    });

    it('should get symbols in current scope', () => {
      const symbols = symbolTable.getSymbolsInCurrentScope();
      const symbolNames = symbols.map((s) => s.name);

      expect(symbolNames).toContain('var1');
      expect(symbolNames).toContain('var2');
      expect(symbolNames).toContain('func1');

      logger.debug('Current scope symbols test completed');
    });

    it('should get accessible symbols', () => {
      // Enter nested scope
      symbolTable.enterScope('nested');
      symbolTable.defineVariable('nested_var', createTestLocation(), 'nested');

      const accessibleSymbols = symbolTable.getAccessibleSymbols();
      const symbolNames = accessibleSymbols.map((s) => s.name);

      // Should include symbols from current and parent scopes
      expect(symbolNames).toContain('nested_var'); // Current scope
      expect(symbolNames).toContain('var1'); // Parent scope
      expect(symbolNames).toContain('sin'); // Built-in from global

      logger.debug('Accessible symbols test completed');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle function with parameters', () => {
      const functionNode: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'complex_function',
        parameters: ['a', 'b', 'c'],
        body: { type: 'literal', value: 0, location: createTestLocation() },
        location: createTestLocation(),
      };

      // Define function
      const result = symbolTable.defineFunction(functionNode);
      expect(result.success).toBe(true);

      // Enter function scope and define parameters
      symbolTable.enterScope('complex_function');
      for (const param of functionNode.parameters) {
        const paramResult = symbolTable.defineParameter(param, createTestLocation());
        expect(paramResult.success).toBe(true);
      }

      // Check parameters are accessible
      expect(symbolTable.hasSymbolInCurrentScope('a')).toBe(true);
      expect(symbolTable.hasSymbolInCurrentScope('b')).toBe(true);
      expect(symbolTable.hasSymbolInCurrentScope('c')).toBe(true);

      // Exit function scope
      symbolTable.exitScope();

      logger.debug('Complex function test completed');
    });

    it('should handle nested module definitions', () => {
      // Define outer module
      const outerModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: 'outer_module',
        parameters: ['size'],
        body: [],
        location: createTestLocation(),
      };

      symbolTable.defineModule(outerModule);
      symbolTable.enterScope('outer_module');

      // Define inner module
      const innerModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: 'inner_module',
        parameters: ['offset'],
        body: [],
        location: createTestLocation(),
      };

      symbolTable.defineModule(innerModule);
      symbolTable.enterScope('inner_module');

      // Check scope levels
      expect(symbolTable.getCurrentScope().level).toBe(2);
      expect(symbolTable.getCurrentScope().name).toBe('inner_module');

      // Exit both scopes
      symbolTable.exitScope(); // inner_module
      symbolTable.exitScope(); // outer_module

      expect(symbolTable.getCurrentScope().name).toBe('global');

      logger.debug('Nested modules test completed');
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
