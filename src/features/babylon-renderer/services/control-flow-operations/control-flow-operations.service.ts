/**
 * @file Control Flow Operations Service
 *
 * Service for processing OpenSCAD control flow constructs (for, if, let).
 * Handles loop expansion, conditional rendering, and variable scoping
 * with GenericMeshData integration.
 *
 * @example
 * ```typescript
 * const controlFlowService = new ControlFlowOperationsService();
 * const forResult = await controlFlowService.expandForLoop({
 *   variable: 'i',
 *   range: { start: 0, end: 10, step: 1 },
 *   body: meshGeneratorFunction
 * });
 * ```
 */

import { BoundingBox, Vector3 } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';
import type { GenericMeshCollection, GenericMeshData } from '../../types/generic-mesh-data.types';
import { createMeshCollection } from '../../utils/generic-mesh-utils';

const logger = createLogger('ControlFlowOperations');

/**
 * OpenSCAD for loop parameters
 */
export interface OpenSCADForLoopParams {
  readonly variable: string;
  readonly range?: {
    readonly start: number;
    readonly end: number;
    readonly step?: number;
  };
  readonly list?: readonly unknown[];
  readonly body: (
    value: unknown,
    context: VariableContext
  ) => Promise<Result<GenericMeshData | GenericMeshCollection, ControlFlowError>>;
}

/**
 * OpenSCAD if statement parameters
 */
export interface OpenSCADIfParams {
  readonly condition: boolean | ((context: VariableContext) => boolean);
  readonly thenBody: (
    context: VariableContext
  ) => Promise<Result<GenericMeshData | GenericMeshCollection, ControlFlowError>>;
  readonly elseBody?: (
    context: VariableContext
  ) => Promise<Result<GenericMeshData | GenericMeshCollection, ControlFlowError>>;
}

/**
 * OpenSCAD let statement parameters
 */
export interface OpenSCADLetParams {
  readonly bindings: Record<string, unknown>;
  readonly body: (
    context: VariableContext
  ) => Promise<Result<GenericMeshData | GenericMeshCollection, ControlFlowError>>;
}

/**
 * OpenSCAD intersection_for parameters
 */
export interface OpenSCADIntersectionForParams {
  readonly variable: string;
  readonly range?: {
    readonly start: number;
    readonly end: number;
    readonly step?: number;
  };
  readonly list?: readonly unknown[];
  readonly body: (
    value: unknown,
    context: VariableContext
  ) => Promise<Result<GenericMeshData, ControlFlowError>>;
}

/**
 * Variable context for scoping
 */
export interface VariableContext {
  readonly variables: Record<string, unknown>;
  readonly parent?: VariableContext;
}

/**
 * Control flow operation error
 */
export interface ControlFlowError {
  readonly code:
    | 'INVALID_PARAMETERS'
    | 'EVALUATION_FAILED'
    | 'SCOPE_ERROR'
    | 'ITERATION_FAILED'
    | 'CONDITION_ERROR';
  readonly message: string;
  readonly operationType: string;
  readonly timestamp: Date;
  readonly context?: VariableContext;
  readonly details?: Record<string, unknown>;
}

/**
 * Control Flow Operations Service
 *
 * Processes OpenSCAD control flow constructs with proper variable scoping
 * and mesh collection management.
 */
export class ControlFlowOperationsService {
  constructor() {
    logger.init('[INIT] ControlFlowOperations service initialized');
  }

  /**
   * Expand for loop with range or list iteration
   */
  async expandForLoop(
    params: OpenSCADForLoopParams,
    context: VariableContext = { variables: {} }
  ): Promise<Result<GenericMeshCollection, ControlFlowError>> {
    logger.debug('[FOR_LOOP] Expanding for loop...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Validate parameters
        if (!params.variable || (!params.range && !params.list)) {
          throw this.createError(
            'INVALID_PARAMETERS',
            'for_loop',
            'For loop requires variable and range or list'
          );
        }

        // Generate iteration values
        const iterationValues = this.generateIterationValues(params);
        const meshes: GenericMeshData[] = [];

        // Execute body for each iteration
        for (const value of iterationValues) {
          const iterationContext = this.createChildContext(context, { [params.variable]: value });

          try {
            const bodyResult = await params.body(value, iterationContext);
            if (bodyResult.success) {
              if (this.isGenericMeshData(bodyResult.data)) {
                meshes.push(bodyResult.data);
              } else {
                // If body returns a collection, flatten it
                meshes.push(...bodyResult.data.meshes);
              }
            } else {
              logger.warn(
                `[FOR_LOOP] Iteration failed for value ${value}: ${bodyResult.error.message}`
              );
            }
          } catch (error) {
            logger.warn(`[FOR_LOOP] Iteration error for value ${value}: ${error}`);
          }
        }

        // Create mesh collection (handle empty collections)
        if (meshes.length === 0) {
          // Create empty collection manually
          const emptyCollection: GenericMeshCollection = {
            id: `for_loop_${Date.now()}`,
            meshes: [],
            metadata: {
              collectionType: 'control_flow_result',
              totalVertices: 0,
              totalTriangles: 0,
              generationTime: performance.now() - startTime,
              boundingBox: new BoundingBox(Vector3.Zero(), Vector3.Zero()),
            },
          };

          logger.debug(
            `[FOR_LOOP] Empty for loop expanded in ${(performance.now() - startTime).toFixed(2)}ms`
          );
          return emptyCollection;
        }

        const collectionResult = createMeshCollection(
          `for_loop_${Date.now()}`,
          meshes,
          'control_flow_result'
        );

        if (!collectionResult.success) {
          throw new Error(`Failed to create mesh collection: ${collectionResult.error.message}`);
        }

        logger.debug(
          `[FOR_LOOP] For loop expanded in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return collectionResult.data;
      },
      (error) =>
        this.createError('EVALUATION_FAILED', 'for_loop', `For loop expansion failed: ${error}`, {
          context,
        })
    );
  }

  /**
   * Process if statement with conditional rendering
   */
  async processIf(
    params: OpenSCADIfParams,
    context: VariableContext = { variables: {} }
  ): Promise<Result<GenericMeshData | GenericMeshCollection | null, ControlFlowError>> {
    logger.debug('[IF] Processing if statement...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Evaluate condition
        const conditionResult = this.evaluateCondition(params.condition, context);

        if (conditionResult) {
          // Execute then body
          const thenResult = await params.thenBody(context);
          if (thenResult.success) {
            logger.debug(
              `[IF] Then branch executed in ${(performance.now() - startTime).toFixed(2)}ms`
            );
            return thenResult.data;
          } else {
            throw new Error(`Then branch failed: ${thenResult.error.message}`);
          }
        } else if (params.elseBody) {
          // Execute else body
          const elseResult = await params.elseBody(context);
          if (elseResult.success) {
            logger.debug(
              `[IF] Else branch executed in ${(performance.now() - startTime).toFixed(2)}ms`
            );
            return elseResult.data;
          } else {
            throw new Error(`Else branch failed: ${elseResult.error.message}`);
          }
        } else {
          // No else branch and condition is false
          logger.debug(
            `[IF] Condition false, no else branch in ${(performance.now() - startTime).toFixed(2)}ms`
          );
          return null;
        }
      },
      (error) =>
        this.createError('EVALUATION_FAILED', 'if_statement', `If statement failed: ${error}`, {
          context,
        })
    );
  }

  /**
   * Process let statement with variable binding
   */
  async processLet(
    params: OpenSCADLetParams,
    context: VariableContext = { variables: {} }
  ): Promise<Result<GenericMeshData | GenericMeshCollection, ControlFlowError>> {
    logger.debug('[LET] Processing let statement...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Create new context with bindings
        const letContext = this.createChildContext(context, params.bindings);

        // Execute body with new context
        const bodyResult = await params.body(letContext);
        if (!bodyResult.success) {
          throw new Error(`Let body failed: ${bodyResult.error.message}`);
        }

        logger.debug(
          `[LET] Let statement processed in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return bodyResult.data;
      },
      (error) =>
        this.createError('EVALUATION_FAILED', 'let_statement', `Let statement failed: ${error}`, {
          context,
        })
    );
  }

  /**
   * Process intersection_for operation
   */
  async processIntersectionFor(
    params: OpenSCADIntersectionForParams,
    context: VariableContext = { variables: {} }
  ): Promise<Result<GenericMeshData, ControlFlowError>> {
    logger.debug('[INTERSECTION_FOR] Processing intersection_for...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Validate parameters
        if (!params.variable || (!params.range && !params.list)) {
          throw this.createError(
            'INVALID_PARAMETERS',
            'intersection_for',
            'Intersection_for requires variable and range or list'
          );
        }

        // Generate iteration values
        const iterationValues = this.generateIterationValues(params);
        const meshes: GenericMeshData[] = [];

        // Execute body for each iteration
        for (const value of iterationValues) {
          const iterationContext = this.createChildContext(context, { [params.variable]: value });

          const bodyResult = await params.body(value, iterationContext);
          if (bodyResult.success) {
            meshes.push(bodyResult.data);
          } else {
            logger.warn(
              `[INTERSECTION_FOR] Iteration failed for value ${value}: ${bodyResult.error.message}`
            );
          }
        }

        if (meshes.length === 0) {
          throw this.createError(
            'ITERATION_FAILED',
            'intersection_for',
            'No valid meshes generated for intersection'
          );
        }

        // Perform intersection of all meshes
        // Note: This would require integration with CSGOperationsService
        // For now, return the first mesh as a placeholder
        const resultMesh = meshes[0]!;

        logger.debug(
          `[INTERSECTION_FOR] Intersection_for processed in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return resultMesh;
      },
      (error) =>
        this.createError(
          'EVALUATION_FAILED',
          'intersection_for',
          `Intersection_for failed: ${error}`,
          { context }
        )
    );
  }

  /**
   * Generate iteration values from range or list
   */
  private generateIterationValues(params: {
    range?: { start: number; end: number; step?: number };
    list?: readonly unknown[];
  }): unknown[] {
    if (params.range) {
      const { start, end, step = 1 } = params.range;
      const values: number[] = [];

      if (step > 0) {
        for (let i = start; i <= end; i += step) {
          values.push(i);
        }
      } else if (step < 0) {
        for (let i = start; i >= end; i += step) {
          values.push(i);
        }
      }

      return values;
    }

    if (params.list) {
      return [...params.list];
    }

    return [];
  }

  /**
   * Evaluate boolean condition
   */
  private evaluateCondition(
    condition: boolean | ((context: VariableContext) => boolean),
    context: VariableContext
  ): boolean {
    if (typeof condition === 'boolean') {
      return condition;
    }

    try {
      return condition(context);
    } catch (error) {
      logger.warn(`[CONDITION] Condition evaluation failed: ${error}`);
      return false;
    }
  }

  /**
   * Create child context with new variables
   */
  private createChildContext(
    parent: VariableContext,
    newVariables: Record<string, unknown>
  ): VariableContext {
    return {
      variables: { ...parent.variables, ...newVariables },
      parent,
    };
  }

  /**
   * Type guard for GenericMeshData
   */
  private isGenericMeshData(obj: unknown): obj is GenericMeshData {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'id' in obj &&
      'geometry' in obj &&
      'material' in obj &&
      'transform' in obj &&
      'metadata' in obj
    );
  }

  /**
   * Create a control flow error
   */
  private createError(
    code: ControlFlowError['code'],
    operationType: string,
    message: string,
    details?: Record<string, unknown>
  ): ControlFlowError {
    const error: ControlFlowError = {
      code,
      message,
      operationType,
      timestamp: new Date(),
    };

    if (details) {
      (error as any).details = details;
    }

    return error;
  }
}
