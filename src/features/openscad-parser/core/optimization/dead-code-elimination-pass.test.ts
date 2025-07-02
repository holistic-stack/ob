/**
 * @file Dead Code Elimination Pass Tests
 *
 * Comprehensive tests for dead code elimination optimization including
 * unused functions, modules, variables, and unreachable code detection.
 *
 * Following TDD methodology with real implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type {
  ASTNode,
  FunctionCallNode,
  FunctionDefinitionNode,
  ModuleCallNode,
  ModuleDefinitionNode,
  SourceLocation,
  VariableNode,
} from '../ast-types.js';
import { DeadCodeEliminationPass } from './dead-code-elimination-pass.js';
import { DEFAULT_OPTIMIZATION_CONFIG } from './optimization-pass.js';

const logger = createLogger('DeadCodeEliminationPassTest');

describe('[INIT][DeadCodeEliminationPass] Dead Code Elimination Tests', () => {
  let pass: DeadCodeEliminationPass;

  beforeEach(() => {
    logger.debug('Setting up dead code elimination pass test');
    pass = new DeadCodeEliminationPass(DEFAULT_OPTIMIZATION_CONFIG);
  });

  describe('Basic Functionality', () => {
    it('should initialize correctly', () => {
      expect(pass.getName()).toBe('Dead Code Elimination');
      expect(pass.getOptimizationTypes()).toContain('dead_code_elimination');
      expect(pass.shouldApply()).toBe(true);

      logger.debug('Initialization test completed');
    });

    it('should handle empty AST', () => {
      const result = pass.optimize([]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST).toHaveLength(0);
        expect(result.data.optimizationsApplied).toHaveLength(0);
        expect(result.data.errors).toHaveLength(0);
      }

      logger.debug('Empty AST test completed');
    });
  });

  describe('Function Elimination', () => {
    it('should remove unused functions', () => {
      const unusedFunction: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'unused_function',
        parameters: ['x'],
        body: {
          type: 'literal',
          value: 42,
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const result = pass.optimize([unusedFunction]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST).toHaveLength(0);
        expect(result.data.optimizationsApplied).toHaveLength(1);
        expect(result.data.optimizationsApplied[0]?.type).toBe('dead_code_elimination');
        expect(result.data.optimizationsApplied[0]?.description).toContain('unused_function');
      }

      logger.debug('Unused function elimination test completed');
    });

    it('should keep used functions', () => {
      const usedFunction: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'used_function',
        parameters: ['x'],
        body: {
          type: 'literal',
          value: 42,
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const functionCall: FunctionCallNode = {
        type: 'function_call',
        name: 'used_function',
        arguments: [
          {
            type: 'literal',
            value: 10,
            location: createTestLocation(),
          },
        ],
        location: createTestLocation(),
      };

      const result = pass.optimize([usedFunction, functionCall]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST).toHaveLength(2);
        expect(result.data.optimizationsApplied).toHaveLength(0); // No eliminations
      }

      logger.debug('Used function preservation test completed');
    });
  });

  describe('Module Elimination', () => {
    it('should remove unused modules', () => {
      const unusedModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: 'unused_module',
        parameters: ['size'],
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

      const result = pass.optimize([unusedModule]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST).toHaveLength(0);
        expect(result.data.optimizationsApplied).toHaveLength(1);
        expect(result.data.optimizationsApplied[0]?.description).toContain('unused_module');
      }

      logger.debug('Unused module elimination test completed');
    });

    it('should keep used modules', () => {
      const usedModule: ModuleDefinitionNode = {
        type: 'module_definition',
        name: 'used_module',
        parameters: ['size'],
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

      const moduleCall: ModuleCallNode = {
        type: 'module_call',
        name: 'used_module',
        arguments: [
          {
            type: 'literal',
            value: 20,
            location: createTestLocation(),
          },
        ],
        location: createTestLocation(),
      };

      const result = pass.optimize([usedModule, moduleCall]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST).toHaveLength(2);
        expect(result.data.optimizationsApplied).toHaveLength(0); // No eliminations
      }

      logger.debug('Used module preservation test completed');
    });
  });

  describe('Variable Elimination', () => {
    it('should remove unused variable assignments', () => {
      const unusedVariable: ASTNode = {
        type: 'assignment',
        name: 'unused_var',
        value: {
          type: 'literal',
          value: 42,
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const result = pass.optimize([unusedVariable]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST).toHaveLength(0);
        expect(result.data.optimizationsApplied).toHaveLength(1);
        expect(result.data.optimizationsApplied[0]?.description).toContain('unused_var');
      }

      logger.debug('Unused variable elimination test completed');
    });

    it('should keep used variables', () => {
      const usedVariable: ASTNode = {
        type: 'assignment',
        name: 'used_var',
        value: {
          type: 'literal',
          value: 42,
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const variableReference: VariableNode = {
        type: 'variable',
        name: 'used_var',
        location: createTestLocation(),
      };

      const result = pass.optimize([usedVariable, variableReference]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST).toHaveLength(2);
        expect(result.data.optimizationsApplied).toHaveLength(0); // No eliminations
      }

      logger.debug('Used variable preservation test completed');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle mixed used and unused symbols', () => {
      const usedFunction: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'used_function',
        parameters: ['x'],
        body: {
          type: 'literal',
          value: 42,
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const unusedFunction: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'unused_function',
        parameters: ['y'],
        body: {
          type: 'literal',
          value: 24,
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const functionCall: FunctionCallNode = {
        type: 'function_call',
        name: 'used_function',
        arguments: [
          {
            type: 'literal',
            value: 10,
            location: createTestLocation(),
          },
        ],
        location: createTestLocation(),
      };

      const result = pass.optimize([usedFunction, unusedFunction, functionCall]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST).toHaveLength(2); // Used function + call
        expect(result.data.optimizationsApplied).toHaveLength(1); // Unused function removed
        expect(result.data.optimizationsApplied[0]?.description).toContain('unused_function');
      }

      logger.debug('Mixed symbols test completed');
    });

    it('should handle nested references', () => {
      const outerFunction: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'outer_function',
        parameters: ['x'],
        body: {
          type: 'function_call',
          name: 'inner_function',
          arguments: [
            {
              type: 'variable',
              name: 'x',
              location: createTestLocation(),
            },
          ],
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const innerFunction: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'inner_function',
        parameters: ['y'],
        body: {
          type: 'literal',
          value: 42,
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const mainCall: FunctionCallNode = {
        type: 'function_call',
        name: 'outer_function',
        arguments: [
          {
            type: 'literal',
            value: 10,
            location: createTestLocation(),
          },
        ],
        location: createTestLocation(),
      };

      const result = pass.optimize([outerFunction, innerFunction, mainCall]);

      expect(result.success).toBe(true);
      if (result.success) {
        // All functions should be kept because they're transitively used
        expect(result.data.optimizedAST).toHaveLength(3);
        expect(result.data.optimizationsApplied).toHaveLength(0);
      }

      logger.debug('Nested references test completed');
    });

    it('should handle recursive functions', () => {
      const recursiveFunction: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'factorial',
        parameters: ['n'],
        body: {
          type: 'conditional_expression',
          condition: {
            type: 'binary_expression',
            operator: '<=',
            left: {
              type: 'variable',
              name: 'n',
              location: createTestLocation(),
            },
            right: {
              type: 'literal',
              value: 1,
              location: createTestLocation(),
            },
            location: createTestLocation(),
          },
          trueExpression: {
            type: 'literal',
            value: 1,
            location: createTestLocation(),
          },
          falseExpression: {
            type: 'binary_expression',
            operator: '*',
            left: {
              type: 'variable',
              name: 'n',
              location: createTestLocation(),
            },
            right: {
              type: 'function_call',
              name: 'factorial', // Recursive call
              arguments: [
                {
                  type: 'binary_expression',
                  operator: '-',
                  left: {
                    type: 'variable',
                    name: 'n',
                    location: createTestLocation(),
                  },
                  right: {
                    type: 'literal',
                    value: 1,
                    location: createTestLocation(),
                  },
                  location: createTestLocation(),
                },
              ],
              location: createTestLocation(),
            },
            location: createTestLocation(),
          },
          location: createTestLocation(),
        },
        location: createTestLocation(),
      };

      const functionCall: FunctionCallNode = {
        type: 'function_call',
        name: 'factorial',
        arguments: [
          {
            type: 'literal',
            value: 5,
            location: createTestLocation(),
          },
        ],
        location: createTestLocation(),
      };

      const result = pass.optimize([recursiveFunction, functionCall]);

      expect(result.success).toBe(true);
      if (result.success) {
        // Recursive function should be kept because it's used
        expect(result.data.optimizedAST).toHaveLength(2);
        expect(result.data.optimizationsApplied).toHaveLength(0);
      }

      logger.debug('Recursive function test completed');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed nodes gracefully', () => {
      const malformedNode = {
        type: 'unknown_type' as 'literal', // Use a valid type for testing
        location: createTestLocation(),
      } as ASTNode;

      const result = pass.optimize([malformedNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should pass through unknown nodes without error
        expect(result.data.optimizedAST).toHaveLength(1);
        expect(result.data.errors).toHaveLength(0);
      }

      logger.debug('Malformed node test completed');
    });

    it('should preserve source locations', () => {
      const location = {
        start: { line: 5, column: 10, offset: 50 },
        end: { line: 5, column: 20, offset: 60 },
      };

      const unusedFunction: FunctionDefinitionNode = {
        type: 'function_definition',
        name: 'test_function',
        parameters: [],
        body: {
          type: 'literal',
          value: 42,
          location: createTestLocation(),
        },
        location,
      };

      const result = pass.optimize([unusedFunction]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizationsApplied).toHaveLength(1);
        expect(result.data.optimizationsApplied[0]?.location).toEqual(location);
      }

      logger.debug('Source location preservation test completed');
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
