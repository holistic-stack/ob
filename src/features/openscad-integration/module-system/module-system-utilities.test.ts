/**
 * @file module-system-utilities.test.ts
 * @description Tests for reusable module system utilities following TDD methodology.
 * Tests module processing pipeline, variable scope management, conditional processing, and module performance tracking.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ASTNode,
  ModuleDefinitionNode,
  ModuleInstantiationNode,
} from '@/features/openscad-parser';
import {
  ConditionalProcessor,
  createVariableScope,
  ModulePerformanceTracker,
  ModuleProcessingPipeline,
  processConditionalStatement,
  processModuleCall,
  processModuleDefinition,
  trackModulePerformance,
  VariableScopeManager,
} from './module-system-utilities';

// Mock module definition for testing
const createMockModuleDefinition = (): ModuleDefinitionNode => ({
  type: 'module_definition',
  name: {
    type: 'identifier',
    name: 'test_module',
    location: {
      start: { line: 1, column: 0, offset: 0 },
      end: { line: 1, column: 11, offset: 11 },
      text: 'test_module',
    },
  },
  parameters: [
    { name: 'size', defaultValue: 10 },
    { name: 'center', defaultValue: false },
  ],
  body: [
    {
      type: 'cube',
      location: {
        start: { line: 2, column: 2, offset: 20 },
        end: { line: 2, column: 12, offset: 30 },
        text: 'cube(size)',
      },
      parameters: [{ name: 'size', value: 'size' }],
    },
  ],
  location: {
    start: { line: 1, column: 0, offset: 0 },
    end: { line: 3, column: 1, offset: 40 },
    text: 'module test_module(size=10, center=false) { cube(size); }',
  },
});

// Mock module instantiation for testing
const createMockModuleCall = (): ModuleInstantiationNode => ({
  type: 'module_instantiation',
  name: 'test_module',
  args: [
    { name: 'size', value: 20 },
    { name: 'center', value: true },
  ],
  location: {
    start: { line: 5, column: 0, offset: 50 },
    end: { line: 5, column: 25, offset: 75 },
    text: 'test_module(size=20, center=true);',
  },
});

// Mock conditional statement for testing
const createMockConditionalStatement = (): ASTNode => ({
  type: 'if_statement',
  condition: {
    type: 'binary_expression',
    operator: '>',
    left: { type: 'identifier', name: 'size' },
    right: { type: 'number', value: 10 },
  },
  then_body: [
    {
      type: 'cube',
      parameters: [{ name: 'size', value: 'size' }],
    },
  ],
  else_body: [
    {
      type: 'sphere',
      parameters: [{ name: 'r', value: 5 }],
    },
  ],
  location: {
    start: { line: 1, column: 0, offset: 0 },
    end: { line: 5, column: 1, offset: 50 },
    text: 'if (size > 10) { cube(size); } else { sphere(r=5); }',
  },
});

describe('ModuleProcessingPipeline', () => {
  let pipeline: ModuleProcessingPipeline;

  beforeEach(() => {
    pipeline = new ModuleProcessingPipeline();
  });

  describe('module definition processing', () => {
    it('should process module definition correctly', async () => {
      const moduleDefinition = createMockModuleDefinition();
      const result = await pipeline.processModuleDefinition(moduleDefinition);

      expect(result.success).toBe(true);
      expect(result.data.moduleName).toBe('test_module');
      expect(result.data.parameters).toHaveLength(2);
      expect(result.data.body).toHaveLength(1);
      expect(result.data.processingMetadata.processingTime).toBeGreaterThan(0);
    });

    it('should validate module definition structure', async () => {
      const invalidModule = { type: 'module_definition' } as ModuleDefinitionNode;
      const result = await pipeline.processModuleDefinition(invalidModule);

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Invalid module definition');
    });

    it('should extract module parameters correctly', async () => {
      const moduleDefinition = createMockModuleDefinition();
      const result = await pipeline.processModuleDefinition(moduleDefinition);

      expect(result.success).toBe(true);
      expect(result.data.parameters[0].name).toBe('size');
      expect(result.data.parameters[0].defaultValue).toBe(10);
      expect(result.data.parameters[1].name).toBe('center');
      expect(result.data.parameters[1].defaultValue).toBe(false);
    });
  });

  describe('module call processing', () => {
    it('should process module call correctly', async () => {
      const moduleCall = createMockModuleCall();
      const result = await pipeline.processModuleCall(moduleCall);

      expect(result.success).toBe(true);
      expect(result.data.moduleName).toBe('test_module');
      expect(result.data.arguments).toHaveLength(2);
      expect(result.data.processingMetadata.processingTime).toBeGreaterThan(0);
    });

    it('should bind arguments to parameters', async () => {
      const moduleCall = createMockModuleCall();
      const result = await pipeline.processModuleCall(moduleCall);

      expect(result.success).toBe(true);
      expect(result.data.arguments[0].name).toBe('size');
      expect(result.data.arguments[0].value).toBe(20);
      expect(result.data.arguments[1].name).toBe('center');
      expect(result.data.arguments[1].value).toBe(true);
    });

    it('should handle module call without arguments', async () => {
      const moduleCall = { ...createMockModuleCall(), args: [] };
      const result = await pipeline.processModuleCall(moduleCall);

      expect(result.success).toBe(true);
      expect(result.data.arguments).toHaveLength(0);
    });
  });

  describe('pipeline configuration', () => {
    it('should allow custom pipeline configuration', () => {
      const customConfig = {
        enableVariableScoping: true,
        enablePerformanceTracking: true,
        maxRecursionDepth: 50,
      };

      const customPipeline = new ModuleProcessingPipeline(customConfig);
      expect(customPipeline.getConfiguration().enableVariableScoping).toBe(true);
      expect(customPipeline.getConfiguration().maxRecursionDepth).toBe(50);
    });
  });
});

describe('VariableScopeManager', () => {
  let scopeManager: VariableScopeManager;

  beforeEach(() => {
    scopeManager = new VariableScopeManager();
  });

  describe('scope creation and management', () => {
    it('should create new variable scope', () => {
      const scope = scopeManager.createScope('test-scope');

      expect(scope.scopeId).toBe('test-scope');
      expect(scope.variables.size).toBe(0);
      expect(scope.parentScope).toBeUndefined();
    });

    it('should create nested scope with parent', () => {
      const parentScope = scopeManager.createScope('parent');
      const childScope = scopeManager.createScope('child', parentScope);

      expect(childScope.parentScope).toBe(parentScope);
      expect(childScope.scopeId).toBe('child');
    });

    it('should set and get variables in scope', () => {
      const scope = scopeManager.createScope('test');

      scopeManager.setVariable(scope, 'size', 10);
      scopeManager.setVariable(scope, 'center', true);

      expect(scopeManager.getVariable(scope, 'size')).toBe(10);
      expect(scopeManager.getVariable(scope, 'center')).toBe(true);
      expect(scopeManager.getVariable(scope, 'nonexistent')).toBeUndefined();
    });

    it('should resolve variables from parent scope', () => {
      const parentScope = scopeManager.createScope('parent');
      const childScope = scopeManager.createScope('child', parentScope);

      scopeManager.setVariable(parentScope, 'global_var', 'parent_value');
      scopeManager.setVariable(childScope, 'local_var', 'child_value');

      expect(scopeManager.getVariable(childScope, 'local_var')).toBe('child_value');
      expect(scopeManager.getVariable(childScope, 'global_var')).toBe('parent_value');
    });

    it('should override parent variables in child scope', () => {
      const parentScope = scopeManager.createScope('parent');
      const childScope = scopeManager.createScope('child', parentScope);

      scopeManager.setVariable(parentScope, 'size', 10);
      scopeManager.setVariable(childScope, 'size', 20);

      expect(scopeManager.getVariable(childScope, 'size')).toBe(20);
      expect(scopeManager.getVariable(parentScope, 'size')).toBe(10);
    });
  });

  describe('scope cleanup', () => {
    it('should clean up scope and remove variables', () => {
      const scope = scopeManager.createScope('test');
      scopeManager.setVariable(scope, 'temp_var', 'temp_value');

      expect(scopeManager.getVariable(scope, 'temp_var')).toBe('temp_value');

      scopeManager.cleanupScope(scope);

      expect(scope.variables.size).toBe(0);
    });
  });
});

describe('ConditionalProcessor', () => {
  let processor: ConditionalProcessor;

  beforeEach(() => {
    processor = new ConditionalProcessor();
  });

  describe('conditional statement processing', () => {
    it('should process if statement correctly', async () => {
      const conditionalStatement = createMockConditionalStatement();
      const variables = new Map([['size', 15]]);

      const result = await processor.processConditional(conditionalStatement, variables);

      expect(result.success).toBe(true);
      expect(result.data.conditionResult).toBe(true); // size (15) > 10
      expect(result.data.executedBranch).toBe('then');
      expect(result.data.resultingNodes).toHaveLength(1);
      expect(result.data.resultingNodes[0].type).toBe('cube');
    });

    it('should process else branch when condition is false', async () => {
      const conditionalStatement = createMockConditionalStatement();
      const variables = new Map([['size', 5]]);

      const result = await processor.processConditional(conditionalStatement, variables);

      expect(result.success).toBe(true);
      expect(result.data.conditionResult).toBe(false); // size (5) > 10
      expect(result.data.executedBranch).toBe('else');
      expect(result.data.resultingNodes).toHaveLength(1);
      expect(result.data.resultingNodes[0].type).toBe('sphere');
    });

    it('should handle missing variables in condition', async () => {
      const conditionalStatement = createMockConditionalStatement();
      const variables = new Map(); // No 'size' variable

      const result = await processor.processConditional(conditionalStatement, variables);

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Variable not found');
    });
  });

  describe('expression evaluation', () => {
    it('should evaluate binary expressions correctly', () => {
      const variables = new Map([
        ['a', 10],
        ['b', 5],
      ]);

      expect(processor.evaluateExpression({ type: 'number', value: 42 }, variables)).toBe(42);
      expect(processor.evaluateExpression({ type: 'identifier', name: 'a' }, variables)).toBe(10);

      const binaryExpr = {
        type: 'binary_expression',
        operator: '+',
        left: { type: 'identifier', name: 'a' },
        right: { type: 'identifier', name: 'b' },
      };
      expect(processor.evaluateExpression(binaryExpr, variables)).toBe(15);
    });

    it('should handle comparison operators', () => {
      const variables = new Map([
        ['x', 10],
        ['y', 20],
      ]);

      const gtExpr = {
        type: 'binary_expression',
        operator: '>',
        left: { type: 'identifier', name: 'y' },
        right: { type: 'identifier', name: 'x' },
      };
      expect(processor.evaluateExpression(gtExpr, variables)).toBe(true);

      const ltExpr = {
        type: 'binary_expression',
        operator: '<',
        left: { type: 'identifier', name: 'x' },
        right: { type: 'identifier', name: 'y' },
      };
      expect(processor.evaluateExpression(ltExpr, variables)).toBe(true);
    });
  });
});

describe('ModulePerformanceTracker', () => {
  let tracker: ModulePerformanceTracker;

  beforeEach(() => {
    tracker = new ModulePerformanceTracker();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('performance tracking', () => {
    it('should track module processing performance', () => {
      const moduleDefinition = createMockModuleDefinition();

      tracker.startTracking('process-module', moduleDefinition.name.name);
      // Simulate processing
      const result = tracker.endTracking('process-module');

      expect(result.operationName).toBe('process-module');
      expect(result.moduleName).toBe('test_module');
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.memoryUsage).toBeDefined();
    });

    it('should track multiple module operations', () => {
      const moduleDefinition = createMockModuleDefinition();
      const moduleCall = createMockModuleCall();

      tracker.startTracking('define-module', moduleDefinition.name.name);
      tracker.endTracking('define-module');

      tracker.startTracking('call-module', moduleCall.name as string);
      tracker.endTracking('call-module');

      const metrics = tracker.getPerformanceMetrics();

      expect(metrics.totalOperations).toBe(2);
      expect(metrics.operationsByModule.test_module).toBe(2);
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);
    });

    it('should identify slowest module operations', () => {
      tracker.startTracking('fast-op', 'fast_module');
      tracker.endTracking('fast-op');

      // Simulate slower operation
      tracker.startTracking('slow-op', 'slow_module');
      // Add small delay to make it slower
      const start = performance.now();
      while (performance.now() - start < 1) {
        /* wait */
      }
      tracker.endTracking('slow-op');

      const metrics = tracker.getPerformanceMetrics();
      expect(metrics.slowestOperations).toHaveLength(2);
      expect(metrics.slowestOperations[0].moduleName).toBe('slow_module');
    });
  });
});

describe('utility functions', () => {
  describe('processModuleDefinition', () => {
    it('should process module definition using standalone function', async () => {
      const moduleDefinition = createMockModuleDefinition();
      const result = await processModuleDefinition(moduleDefinition);

      expect(result.success).toBe(true);
      expect(result.data.moduleName).toBe('test_module');
    });
  });

  describe('processModuleCall', () => {
    it('should process module call using standalone function', async () => {
      const moduleCall = createMockModuleCall();
      const result = await processModuleCall(moduleCall);

      expect(result.success).toBe(true);
      expect(result.data.moduleName).toBe('test_module');
    });
  });

  describe('createVariableScope', () => {
    it('should create variable scope using standalone function', () => {
      const scope = createVariableScope('test-scope');

      expect(scope.scopeId).toBe('test-scope');
      expect(scope.variables).toBeInstanceOf(Map);
    });
  });

  describe('processConditionalStatement', () => {
    it('should process conditional statement using standalone function', async () => {
      const conditionalStatement = createMockConditionalStatement();
      const variables = new Map([['size', 15]]);

      const result = await processConditionalStatement(conditionalStatement, variables);

      expect(result.success).toBe(true);
      expect(result.data.conditionResult).toBe(true);
    });
  });

  describe('trackModulePerformance', () => {
    it('should track module performance using standalone function', () => {
      const result = trackModulePerformance('test-operation', 'test_module', () => {
        return { processed: true };
      });

      expect(result.operationName).toBe('test-operation');
      expect(result.moduleName).toBe('test_module');
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.result).toEqual({ processed: true });
    });
  });
});
