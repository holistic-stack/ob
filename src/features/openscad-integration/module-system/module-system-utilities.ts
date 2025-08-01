/**
 * @file module-system-utilities.ts
 * @description Reusable module system utilities for OpenSCAD integration.
 * Provides module processing pipeline, variable scope management, conditional processing,
 * and module performance tracking to eliminate code duplication and improve reusability.
 *
 * @example
 * ```typescript
 * // Module processing pipeline
 * const pipeline = new ModuleProcessingPipeline();
 * const result = await pipeline.processModuleDefinition(moduleNode);
 *
 * // Variable scope management
 * const scopeManager = new VariableScopeManager();
 * const scope = scopeManager.createScope('module-scope');
 *
 * // Conditional processing
 * const processor = new ConditionalProcessor();
 * const condResult = await processor.processConditional(ifNode, variables);
 *
 * // Performance tracking
 * const tracker = new ModulePerformanceTracker();
 * tracker.startTracking('operation', 'module_name');
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import type {
  ASTNode,
  ModuleDefinitionNode,
  ModuleInstantiationNode,
} from '@/features/openscad-parser';
import type { Result } from '@/shared';
import { error, success } from '@/shared';
import { MemoryMonitor, PerformanceTimer } from '@/shared/utils/performance';

/**
 * Processed module definition with metadata
 */
export interface ProcessedModuleDefinition {
  readonly moduleName: string;
  readonly parameters: readonly ModuleParameter[];
  readonly body: readonly ASTNode[];
  readonly processingMetadata: {
    readonly processingTime: number;
    readonly memoryUsage: number;
    readonly validationPassed: boolean;
  };
}

/**
 * Processed module call with metadata
 */
export interface ProcessedModuleCall {
  readonly moduleName: string;
  readonly arguments: readonly ModuleArgument[];
  readonly children?: readonly ASTNode[];
  readonly processingMetadata: {
    readonly processingTime: number;
    readonly memoryUsage: number;
    readonly validationPassed: boolean;
  };
}

/**
 * Module parameter definition
 */
export interface ModuleParameter {
  readonly name: string;
  readonly defaultValue?: unknown;
  readonly type?: string;
}

/**
 * Module call argument
 */
export interface ModuleArgument {
  readonly name: string;
  readonly value: unknown;
}

/**
 * Variable scope for module processing
 */
export interface VariableScope {
  readonly scopeId: string;
  readonly variables: Map<string, unknown>;
  readonly parentScope?: VariableScope;
}

/**
 * Conditional processing result
 */
export interface ConditionalProcessingResult {
  readonly conditionResult: boolean;
  readonly executedBranch: 'then' | 'else' | 'none';
  readonly resultingNodes: readonly ASTNode[];
  readonly processingMetadata: {
    readonly processingTime: number;
    readonly memoryUsage: number;
  };
}

/**
 * Module performance tracking result
 */
export interface ModulePerformanceResult {
  readonly operationName: string;
  readonly moduleName: string;
  readonly processingTime: number;
  readonly memoryUsage: {
    readonly before: number;
    readonly after: number;
    readonly delta: number;
  };
  readonly result?: unknown;
}

/**
 * Module performance metrics summary
 */
export interface ModulePerformanceMetrics {
  readonly totalOperations: number;
  readonly averageProcessingTime: number;
  readonly totalMemoryUsage: number;
  readonly operationsByModule: Record<string, number>;
  readonly slowestOperations: readonly ModulePerformanceResult[];
}

/**
 * Expression AST node types for conditional processing
 */
export interface ExpressionNode {
  readonly type: string;
  readonly value?: unknown;
  readonly name?: string;
  readonly operator?: string;
  readonly left?: ExpressionNode;
  readonly right?: ExpressionNode;
}

/**
 * Conditional AST node with typed condition
 */
export interface ConditionalNode extends ASTNode {
  readonly condition?: ExpressionNode;
  readonly then_body?: readonly ASTNode[];
  readonly else_body?: readonly ASTNode[];
}

/**
 * Module processing pipeline configuration
 */
export interface ModulePipelineConfiguration {
  readonly enableVariableScoping: boolean;
  readonly enablePerformanceTracking: boolean;
  readonly maxRecursionDepth: number;
  readonly enableValidation: boolean;
}

/**
 * Default module pipeline configuration
 */
const DEFAULT_MODULE_CONFIG: ModulePipelineConfiguration = {
  enableVariableScoping: true,
  enablePerformanceTracking: true,
  maxRecursionDepth: 100,
  enableValidation: true,
} as const;

/**
 * Module processing pipeline for coordinated module processing
 */
export class ModuleProcessingPipeline {
  private config: ModulePipelineConfiguration;
  private timer = new PerformanceTimer();
  private memoryMonitor = new MemoryMonitor();

  constructor(config: Partial<ModulePipelineConfiguration> = {}) {
    this.config = { ...DEFAULT_MODULE_CONFIG, ...config };
  }

  /**
   * Process a module definition
   *
   * @param moduleDefinition - Module definition AST node
   * @returns Processing result
   */
  async processModuleDefinition(
    moduleDefinition: ModuleDefinitionNode
  ): Promise<Result<ProcessedModuleDefinition, Error>> {
    try {
      this.timer.start();
      const memoryBefore = this.memoryMonitor.getCurrentUsageMB();

      // Validate module definition
      if (this.config.enableValidation && !this.validateModuleDefinition(moduleDefinition)) {
        return error(new Error('Invalid module definition structure'));
      }

      // Extract module name
      const moduleName =
        typeof moduleDefinition.name === 'string'
          ? moduleDefinition.name
          : moduleDefinition.name.name;

      // Extract parameters
      const parameters = this.extractModuleParameters(moduleDefinition);

      // Process body
      const body = moduleDefinition.body || [];

      const processingTime = this.timer.stop();
      const memoryAfter = this.memoryMonitor.getCurrentUsageMB();

      const result: ProcessedModuleDefinition = {
        moduleName,
        parameters,
        body,
        processingMetadata: {
          processingTime,
          memoryUsage: memoryAfter - memoryBefore,
          validationPassed: true,
        },
      };

      return success(result);
    } catch (err) {
      return error(
        new Error(
          `Failed to process module definition: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * Process a module call
   *
   * @param moduleCall - Module call AST node
   * @returns Processing result
   */
  async processModuleCall(
    moduleCall: ModuleInstantiationNode
  ): Promise<Result<ProcessedModuleCall, Error>> {
    try {
      this.timer.start();
      const memoryBefore = this.memoryMonitor.getCurrentUsageMB();

      // Validate module call
      if (this.config.enableValidation && !this.validateModuleCall(moduleCall)) {
        return error(new Error('Invalid module call structure'));
      }

      // Extract module name
      const moduleName =
        typeof moduleCall.name === 'string'
          ? moduleCall.name
          : moduleCall.name.name || moduleCall.name;

      // Extract arguments
      const moduleArguments = this.extractModuleArguments(moduleCall);

      // Extract children if present
      const children = moduleCall.children;

      const processingTime = this.timer.stop();
      const memoryAfter = this.memoryMonitor.getCurrentUsageMB();

      const result: ProcessedModuleCall = {
        moduleName,
        arguments: moduleArguments,
        children,
        processingMetadata: {
          processingTime,
          memoryUsage: memoryAfter - memoryBefore,
          validationPassed: true,
        },
      };

      return success(result);
    } catch (err) {
      return error(
        new Error(
          `Failed to process module call: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * Get current pipeline configuration
   */
  getConfiguration(): ModulePipelineConfiguration {
    return { ...this.config };
  }

  /**
   * Validate module definition structure
   */
  private validateModuleDefinition(moduleDefinition: ModuleDefinitionNode): boolean {
    return (
      moduleDefinition &&
      typeof moduleDefinition === 'object' &&
      moduleDefinition.type === 'module_definition' &&
      moduleDefinition.name &&
      Array.isArray(moduleDefinition.body)
    );
  }

  /**
   * Validate module call structure
   */
  private validateModuleCall(moduleCall: ModuleInstantiationNode): boolean {
    return (
      moduleCall &&
      typeof moduleCall === 'object' &&
      moduleCall.type === 'module_instantiation' &&
      moduleCall.name
    );
  }

  /**
   * Extract parameters from module definition
   */
  private extractModuleParameters(moduleDefinition: ModuleDefinitionNode): ModuleParameter[] {
    if (!moduleDefinition.parameters || !Array.isArray(moduleDefinition.parameters)) {
      return [];
    }

    return moduleDefinition.parameters.map((param) => ({
      name: param.name,
      defaultValue: param.defaultValue,
      type: param.type,
    }));
  }

  /**
   * Extract arguments from module call
   */
  private extractModuleArguments(moduleCall: ModuleInstantiationNode): ModuleArgument[] {
    if (!moduleCall.args || !Array.isArray(moduleCall.args)) {
      return [];
    }

    return moduleCall.args.map((arg) => ({
      name: arg.name,
      value: arg.value,
    }));
  }
}

/**
 * Variable scope manager for module variable scoping
 */
export class VariableScopeManager {
  /**
   * Create a new variable scope
   *
   * @param scopeId - Unique identifier for the scope
   * @param parentScope - Optional parent scope for hierarchical scoping
   * @returns New variable scope
   */
  createScope(scopeId: string, parentScope?: VariableScope): VariableScope {
    return {
      scopeId,
      variables: new Map<string, unknown>(),
      parentScope,
    };
  }

  /**
   * Set a variable in the scope
   *
   * @param scope - Target scope
   * @param name - Variable name
   * @param value - Variable value
   */
  setVariable(scope: VariableScope, name: string, value: unknown): void {
    scope.variables.set(name, value);
  }

  /**
   * Get a variable from the scope (with parent scope fallback)
   *
   * @param scope - Source scope
   * @param name - Variable name
   * @returns Variable value or undefined
   */
  getVariable(scope: VariableScope, name: string): unknown {
    // Check local scope first
    if (scope.variables.has(name)) {
      return scope.variables.get(name);
    }

    // Fall back to parent scope
    if (scope.parentScope) {
      return this.getVariable(scope.parentScope, name);
    }

    return undefined;
  }

  /**
   * Clean up scope and remove all variables
   *
   * @param scope - Scope to clean up
   */
  cleanupScope(scope: VariableScope): void {
    scope.variables.clear();
  }
}

/**
 * Conditional processor for if/else and loop constructs
 */
export class ConditionalProcessor {
  private timer = new PerformanceTimer();
  private memoryMonitor = new MemoryMonitor();

  /**
   * Process a conditional statement
   *
   * @param conditionalNode - Conditional AST node
   * @param variables - Variable context for evaluation
   * @returns Conditional processing result
   */
  async processConditional(
    conditionalNode: ASTNode,
    variables: Map<string, unknown>
  ): Promise<Result<ConditionalProcessingResult, Error>> {
    try {
      this.timer.start();
      const memoryBefore = this.memoryMonitor.getCurrentUsageMB();

      // Evaluate condition
      const conditionResult = this.evaluateCondition(conditionalNode, variables);

      // Determine which branch to execute
      let executedBranch: 'then' | 'else' | 'none' = 'none';
      let resultingNodes: ASTNode[] = [];

      if (conditionalNode.type === 'if_statement') {
        const condNode = conditionalNode as ConditionalNode;
        if (conditionResult) {
          executedBranch = 'then';
          resultingNodes = [...(condNode.then_body || [])];
        } else if (condNode.else_body) {
          executedBranch = 'else';
          resultingNodes = [...(condNode.else_body || [])];
        }
      }

      const processingTime = this.timer.stop();
      const memoryAfter = this.memoryMonitor.getCurrentUsageMB();

      const result: ConditionalProcessingResult = {
        conditionResult,
        executedBranch,
        resultingNodes,
        processingMetadata: {
          processingTime,
          memoryUsage: memoryAfter - memoryBefore,
        },
      };

      return success(result);
    } catch (err) {
      return error(
        new Error(
          `Failed to process conditional: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * Evaluate an expression with variable context
   *
   * @param expression - Expression AST node
   * @param variables - Variable context
   * @returns Evaluated value
   */
  evaluateExpression(expression: ExpressionNode, variables: Map<string, unknown>): unknown {
    if (!expression || typeof expression !== 'object') {
      return expression;
    }

    switch (expression.type) {
      case 'number':
        return expression.value;

      case 'string':
        return expression.value;

      case 'boolean':
        return expression.value;

      case 'identifier':
        if (!expression.name || !variables.has(expression.name)) {
          throw new Error(`Variable not found: ${expression.name || 'unknown'}`);
        }
        return variables.get(expression.name);

      case 'binary_expression':
        return this.evaluateBinaryExpression(expression, variables);

      default:
        return expression.value || expression;
    }
  }

  /**
   * Evaluate condition for conditional statements
   */
  private evaluateCondition(conditionalNode: ASTNode, variables: Map<string, unknown>): boolean {
    if (conditionalNode.type === 'if_statement') {
      const condNode = conditionalNode as ConditionalNode;
      if (condNode.condition) {
        const result = this.evaluateExpression(condNode.condition, variables);
        return Boolean(result);
      }
    }

    return false;
  }

  /**
   * Evaluate binary expressions
   */
  private evaluateBinaryExpression(
    expression: ExpressionNode,
    variables: Map<string, unknown>
  ): unknown {
    if (!expression.left || !expression.right) {
      throw new Error('Binary expression missing left or right operand');
    }

    const left = this.evaluateExpression(expression.left, variables);
    const right = this.evaluateExpression(expression.right, variables);

    switch (expression.operator) {
      case '+':
        return (left as number) + (right as number);
      case '-':
        return (left as number) - (right as number);
      case '*':
        return (left as number) * (right as number);
      case '/':
        return (left as number) / (right as number);
      case '>':
        return (left as number) > (right as number);
      case '<':
        return (left as number) < (right as number);
      case '>=':
        return (left as number) >= (right as number);
      case '<=':
        return (left as number) <= (right as number);
      case '==':
        return left === right;
      case '!=':
        return left !== right;
      case '&&':
        return Boolean(left) && Boolean(right);
      case '||':
        return Boolean(left) || Boolean(right);
      default:
        throw new Error(`Unknown binary operator: ${expression.operator}`);
    }
  }
}

/**
 * Module performance tracker for monitoring module processing performance
 */
export class ModulePerformanceTracker {
  private operations = new Map<
    string,
    { startTime: number; startMemory: number; moduleName: string }
  >();
  private completedOperations: ModulePerformanceResult[] = [];
  private memoryMonitor = new MemoryMonitor();

  /**
   * Start tracking a module operation
   *
   * @param operationName - Name of the operation
   * @param moduleName - Name of the module being processed
   */
  startTracking(operationName: string, moduleName: string): void {
    this.operations.set(operationName, {
      startTime: performance.now(),
      startMemory: this.memoryMonitor.getCurrentUsageMB(),
      moduleName,
    });
  }

  /**
   * End tracking a module operation
   *
   * @param operationName - Name of the operation
   * @returns Performance tracking result
   */
  endTracking(operationName: string): ModulePerformanceResult {
    const operation = this.operations.get(operationName);
    if (!operation) {
      throw new Error(`Operation ${operationName} was not started`);
    }

    const endTime = performance.now();
    const endMemory = this.memoryMonitor.getCurrentUsageMB();

    const result: ModulePerformanceResult = {
      operationName,
      moduleName: operation.moduleName,
      processingTime: endTime - operation.startTime,
      memoryUsage: {
        before: operation.startMemory,
        after: endMemory,
        delta: endMemory - operation.startMemory,
      },
    };

    this.completedOperations.push(result);
    this.operations.delete(operationName);

    return result;
  }

  /**
   * Get module performance metrics summary
   *
   * @returns Performance metrics
   */
  getPerformanceMetrics(): ModulePerformanceMetrics {
    const totalOperations = this.completedOperations.length;
    const averageProcessingTime =
      totalOperations > 0
        ? this.completedOperations.reduce((sum, op) => sum + op.processingTime, 0) / totalOperations
        : 0;

    const totalMemoryUsage = this.completedOperations.reduce(
      (sum, op) => sum + Math.abs(op.memoryUsage.delta),
      0
    );

    const operationsByModule: Record<string, number> = {};
    for (const operation of this.completedOperations) {
      operationsByModule[operation.moduleName] =
        (operationsByModule[operation.moduleName] || 0) + 1;
    }

    const slowestOperations = [...this.completedOperations]
      .sort((a, b) => b.processingTime - a.processingTime)
      .slice(0, 5);

    return {
      totalOperations,
      averageProcessingTime,
      totalMemoryUsage,
      operationsByModule,
      slowestOperations,
    };
  }
}

/**
 * Process module definition (standalone utility)
 *
 * @param moduleDefinition - Module definition AST node
 * @returns Processing result
 */
export async function processModuleDefinition(
  moduleDefinition: ModuleDefinitionNode
): Promise<Result<ProcessedModuleDefinition, Error>> {
  const pipeline = new ModuleProcessingPipeline();
  return pipeline.processModuleDefinition(moduleDefinition);
}

/**
 * Process module call (standalone utility)
 *
 * @param moduleCall - Module call AST node
 * @returns Processing result
 */
export async function processModuleCall(
  moduleCall: ModuleInstantiationNode
): Promise<Result<ProcessedModuleCall, Error>> {
  const pipeline = new ModuleProcessingPipeline();
  return pipeline.processModuleCall(moduleCall);
}

/**
 * Create variable scope (standalone utility)
 *
 * @param scopeId - Scope identifier
 * @param parentScope - Optional parent scope
 * @returns New variable scope
 */
export function createVariableScope(scopeId: string, parentScope?: VariableScope): VariableScope {
  const scopeManager = new VariableScopeManager();
  return scopeManager.createScope(scopeId, parentScope);
}

/**
 * Process conditional statement (standalone utility)
 *
 * @param conditionalNode - Conditional AST node
 * @param variables - Variable context
 * @returns Conditional processing result
 */
export async function processConditionalStatement(
  conditionalNode: ASTNode,
  variables: Map<string, unknown>
): Promise<Result<ConditionalProcessingResult, Error>> {
  const processor = new ConditionalProcessor();
  return processor.processConditional(conditionalNode, variables);
}

/**
 * Track module performance (standalone utility)
 *
 * @param operationName - Name of the operation
 * @param moduleName - Name of the module
 * @param operation - Function to execute and track
 * @returns Performance tracking result with operation result
 */
export function trackModulePerformance<T>(
  operationName: string,
  moduleName: string,
  operation: () => T
): ModulePerformanceResult & { result: T } {
  const tracker = new ModulePerformanceTracker();

  tracker.startTracking(operationName, moduleName);
  const result = operation();
  const perfResult = tracker.endTracking(operationName);

  return {
    ...perfResult,
    result,
  };
}
