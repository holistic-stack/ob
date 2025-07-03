/**
 * Variable Scope Service Tests
 *
 * Tests for the variable scope service that manages variable assignments
 * and scope resolution during AST-to-CSG conversion.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import { VariableScopeService } from './variable-scope.service.js';

const logger = createLogger('VariableScopeServiceTest');

describe('VariableScopeService', () => {
  let variableScope: VariableScopeService;

  beforeEach(() => {
    logger.init('Setting up VariableScopeService test');
    variableScope = new VariableScopeService();
  });

  afterEach(() => {
    logger.end('VariableScopeService test completed');
  });

  describe('Scope Management', () => {
    it('should initialize with global scope', () => {
      expect(variableScope.getCurrentScopeName()).toBe('global');
      expect(variableScope.getCurrentScopeLevel()).toBe(0);
      expect(variableScope.getScopeDepth()).toBe(1);
    });

    it('should enter and exit scopes correctly', () => {
      variableScope.enterScope('test_scope');

      expect(variableScope.getCurrentScopeName()).toBe('test_scope');
      expect(variableScope.getCurrentScopeLevel()).toBe(1);
      expect(variableScope.getScopeDepth()).toBe(2);

      const exitResult = variableScope.exitScope();
      expect(exitResult.success).toBe(true);
      expect(variableScope.getCurrentScopeName()).toBe('global');
      expect(variableScope.getCurrentScopeLevel()).toBe(0);
    });

    it('should prevent exiting global scope', () => {
      const exitResult = variableScope.exitScope();
      expect(exitResult.success).toBe(false);
      if (!exitResult.success) {
        expect(exitResult.error).toContain('Cannot exit global scope');
      }
    });

    it('should handle nested scopes', () => {
      variableScope.enterScope('outer');
      variableScope.enterScope('inner');

      expect(variableScope.getCurrentScopeName()).toBe('inner');
      expect(variableScope.getCurrentScopeLevel()).toBe(2);
      expect(variableScope.getScopeDepth()).toBe(3);

      variableScope.exitScope();
      expect(variableScope.getCurrentScopeName()).toBe('outer');
      expect(variableScope.getCurrentScopeLevel()).toBe(1);

      variableScope.exitScope();
      expect(variableScope.getCurrentScopeName()).toBe('global');
      expect(variableScope.getCurrentScopeLevel()).toBe(0);
    });
  });

  describe('Variable Definition', () => {
    it('should define variables in current scope', () => {
      const result = variableScope.defineVariable('test_var', 42);

      expect(result.success).toBe(true);

      const binding = variableScope.resolveVariable('test_var');
      expect(binding).not.toBeNull();
      expect(binding?.name).toBe('test_var');
      expect(binding?.value).toBe(42);
      expect(binding?.scopeLevel).toBe(0);
    });

    it('should prevent duplicate variable definition in same scope', () => {
      variableScope.defineVariable('duplicate_var', 'first');
      const result = variableScope.defineVariable('duplicate_var', 'second');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('already defined');
      }
    });

    it('should allow same variable name in different scopes', () => {
      variableScope.defineVariable('scoped_var', 'global_value');

      variableScope.enterScope('inner');
      const result = variableScope.defineVariable('scoped_var', 'inner_value');

      expect(result.success).toBe(true);

      const innerBinding = variableScope.resolveVariable('scoped_var');
      expect(innerBinding?.value).toBe('inner_value');

      variableScope.exitScope();
      const globalBinding = variableScope.resolveVariable('scoped_var');
      expect(globalBinding?.value).toBe('global_value');
    });

    it('should store variable location information', () => {
      const location = { line: 10, column: 5 };
      variableScope.defineVariable('located_var', 'value', location);

      const binding = variableScope.resolveVariable('located_var');
      expect(binding?.location).toEqual(location);
    });
  });

  describe('Variable Resolution', () => {
    it('should resolve variables from current scope', () => {
      variableScope.defineVariable('current_var', 'current_value');

      const binding = variableScope.resolveVariable('current_var');
      expect(binding?.value).toBe('current_value');
    });

    it('should resolve variables from parent scopes', () => {
      variableScope.defineVariable('parent_var', 'parent_value');

      variableScope.enterScope('child');
      const binding = variableScope.resolveVariable('parent_var');

      expect(binding?.value).toBe('parent_value');
      expect(binding?.scopeLevel).toBe(0);
    });

    it('should prioritize inner scope variables', () => {
      variableScope.defineVariable('shadowed_var', 'outer_value');

      variableScope.enterScope('inner');
      variableScope.defineVariable('shadowed_var', 'inner_value');

      const binding = variableScope.resolveVariable('shadowed_var');
      expect(binding?.value).toBe('inner_value');
      expect(binding?.scopeLevel).toBe(1);
    });

    it('should return null for non-existent variables', () => {
      const binding = variableScope.resolveVariable('non_existent');
      expect(binding).toBeNull();
    });
  });

  describe('Scope Introspection', () => {
    it('should get current scope variables', () => {
      variableScope.defineVariable('scope_var1', 'value1');
      variableScope.defineVariable('scope_var2', 'value2');

      const scopeVars = variableScope.getCurrentScopeVariables();
      expect(scopeVars.size).toBe(2);
      expect(scopeVars.get('scope_var1')?.value).toBe('value1');
      expect(scopeVars.get('scope_var2')?.value).toBe('value2');
    });

    it('should get all accessible variables', () => {
      variableScope.defineVariable('global_var', 'global_value');

      variableScope.enterScope('inner');
      variableScope.defineVariable('inner_var', 'inner_value');
      variableScope.defineVariable('global_var', 'shadowed_value'); // Shadow global var

      const allVars = variableScope.getAllAccessibleVariables();
      expect(allVars.size).toBe(2);
      expect(allVars.get('global_var')?.value).toBe('shadowed_value'); // Inner scope takes precedence
      expect(allVars.get('inner_var')?.value).toBe('inner_value');
    });

    it('should reset to global scope', () => {
      variableScope.defineVariable('global_var', 'value');
      variableScope.enterScope('scope1');
      variableScope.defineVariable('scope1_var', 'value');
      variableScope.enterScope('scope2');
      variableScope.defineVariable('scope2_var', 'value');

      expect(variableScope.getScopeDepth()).toBe(3);

      variableScope.reset();

      expect(variableScope.getCurrentScopeName()).toBe('global');
      expect(variableScope.getCurrentScopeLevel()).toBe(0);
      expect(variableScope.getScopeDepth()).toBe(1);
      expect(variableScope.resolveVariable('global_var')).toBeNull();
      expect(variableScope.resolveVariable('scope1_var')).toBeNull();
      expect(variableScope.resolveVariable('scope2_var')).toBeNull();
    });
  });
});
