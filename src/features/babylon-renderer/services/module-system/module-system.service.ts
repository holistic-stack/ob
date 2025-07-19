/**
 * @file Module System Service
 *
 * Service for managing OpenSCAD module definitions and instantiations.
 * Handles module registry, parameter binding, children() directive support,
 * and scope management for user-defined modules.
 *
 * @example
 * ```typescript
 * const moduleService = new ModuleSystemService();
 *
 * // Register a module definition
 * await moduleService.registerModule(moduleDefNode);
 *
 * // Instantiate a module
 * const result = await moduleService.instantiateModule(moduleInstNode, context);
 * ```
 */

import { BoundingBox, Vector3 } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { isError, tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';
import type {
  ASTNode,
  ChildrenNode,
  ModuleDefinitionNode,
  ModuleInstantiationNode,
  ModuleParameter,
  Parameter,
  SourceLocation,
} from '../../../openscad-parser/ast/ast-types';
import type { GenericMeshCollection, GenericMeshData } from '../../types/generic-mesh-data.types';
import { createMeshCollection } from '../../utils/generic-mesh-utils';
import type { VariableContext } from '../control-flow-operations';

const logger = createLogger('ModuleSystem');

/**
 * Module definition with resolved parameters
 */
export interface ResolvedModuleDefinition {
  readonly name: string;
  readonly parameters: readonly ModuleParameter[];
  readonly body: readonly ASTNode[];
  readonly sourceLocation?: SourceLocation;
}

/**
 * Module instantiation context
 */
export interface ModuleInstantiationContext {
  readonly moduleDefinition: ResolvedModuleDefinition;
  readonly arguments: readonly Parameter[];
  readonly children: readonly ASTNode[];
  readonly parentContext: VariableContext;
}

/**
 * Module execution context
 */
export interface ModuleExecutionContext extends VariableContext {
  readonly moduleParameters: Record<string, unknown>;
  readonly childrenNodes: readonly ASTNode[];
  readonly childrenIndex?: number;
}

/**
 * Module system error
 */
export interface ModuleSystemError {
  readonly code:
    | 'MODULE_NOT_FOUND'
    | 'PARAMETER_MISMATCH'
    | 'EXECUTION_FAILED'
    | 'INVALID_CHILDREN'
    | 'REGISTRATION_FAILED';
  readonly message: string;
  readonly moduleName?: string;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
}

/**
 * Module System Service
 *
 * Manages OpenSCAD module definitions and instantiations with proper
 * parameter binding, children() support, and scope management.
 */
export class ModuleSystemService {
  private readonly moduleRegistry = new Map<string, ResolvedModuleDefinition>();

  constructor() {
    logger.init('[INIT] ModuleSystem service initialized');
  }

  /**
   * Register a module definition
   */
  async registerModule(
    moduleDefNode: ModuleDefinitionNode
  ): Promise<Result<void, ModuleSystemError>> {
    logger.debug(`[REGISTER] Registering module: ${moduleDefNode.name.name}`);

    return tryCatch(
      () => {
        const resolvedModule: ResolvedModuleDefinition = {
          name: moduleDefNode.name.name,
          parameters: moduleDefNode.parameters ?? [],
          body: moduleDefNode.body,
          ...(moduleDefNode.location && { sourceLocation: moduleDefNode.location }),
        };

        this.moduleRegistry.set(moduleDefNode.name.name, resolvedModule);

        logger.debug(
          `[REGISTER] Module ${moduleDefNode.name.name} registered with ${moduleDefNode.parameters?.length ?? 0} parameters`
        );
      },
      (error) =>
        this.createError(
          'REGISTRATION_FAILED',
          `Failed to register module: ${error}`,
          moduleDefNode.name.name
        )
    );
  }

  /**
   * Instantiate a module with arguments and children
   */
  async instantiateModule(
    moduleInstNode: ModuleInstantiationNode,
    parentContext: VariableContext,
    bodyExecutor: (
      body: readonly ASTNode[],
      context: ModuleExecutionContext
    ) => Promise<Result<GenericMeshData | GenericMeshCollection, ModuleSystemError>>
  ): Promise<Result<GenericMeshData | GenericMeshCollection, ModuleSystemError>> {
    const moduleName =
      typeof moduleInstNode.name === 'string' ? moduleInstNode.name : moduleInstNode.name.name;
    logger.debug(`[INSTANTIATE] Instantiating module: ${moduleName}`);
    const startTime = performance.now();

    // Find module definition first (outside tryCatchAsync to preserve specific error codes)
    const moduleDefinition = this.moduleRegistry.get(moduleName);
    if (!moduleDefinition) {
      return {
        success: false,
        error: this.createError('MODULE_NOT_FOUND', `Module '${moduleName}' not found`, moduleName),
      };
    }

    return tryCatchAsync(
      async () => {
        // Bind parameters
        const parameterBindings = this.bindParameters(
          moduleDefinition.parameters,
          moduleInstNode.args,
          parentContext
        );

        // Create module execution context
        const moduleContext: ModuleExecutionContext = {
          variables: { ...parentContext.variables, ...parameterBindings },
          parent: parentContext,
          moduleParameters: parameterBindings,
          childrenNodes: moduleInstNode.children ?? [],
        };

        // Execute module body
        const result = await bodyExecutor(moduleDefinition.body, moduleContext);
        if (isError(result)) {
          throw new Error(`Module execution failed: ${result.error.message}`);
        }

        logger.debug(
          `[INSTANTIATE] Module ${moduleName} instantiated in ${(performance.now() - startTime).toFixed(2)}ms`
        );
        return result.data;
      },
      (error) =>
        this.createError('EXECUTION_FAILED', `Module instantiation failed: ${error}`, moduleName)
    );
  }

  /**
   * Process children() directive
   */
  async processChildren(
    childrenNode: ChildrenNode,
    context: ModuleExecutionContext,
    childExecutor: (
      child: ASTNode,
      context: ModuleExecutionContext
    ) => Promise<Result<GenericMeshData | GenericMeshCollection, ModuleSystemError>>
  ): Promise<Result<GenericMeshData | GenericMeshCollection, ModuleSystemError>> {
    logger.debug('[CHILDREN] Processing children directive...');

    const { childrenNodes } = context;

    // Validate child index first (outside tryCatchAsync to preserve specific error codes)
    if (childrenNode.indices?.[0] !== undefined && childrenNode.indices[0] >= 0) {
      if (childrenNodes && childrenNode.indices[0] >= childrenNodes.length) {
        return {
          success: false,
          error: this.createError(
            'INVALID_CHILDREN',
            `Child index ${childrenNode.indices?.[0]} out of bounds (${childrenNodes.length} children)`
          ),
        };
      }
    }

    return tryCatchAsync(
      async () => {
        if (!childrenNodes || childrenNodes.length === 0) {
          // Create empty collection manually since createMeshCollection doesn't handle empty arrays
          const emptyCollection: GenericMeshCollection = {
            id: `children_empty_${Date.now()}`,
            meshes: [],
            metadata: {
              collectionType: 'control_flow_result',
              totalVertices: 0,
              totalTriangles: 0,
              generationTime: 0,
              boundingBox: new BoundingBox(Vector3.Zero(), Vector3.Zero()),
            },
          };

          return emptyCollection;
        }

        // Handle specific child index
        if (childrenNode.indices?.[0] !== undefined && childrenNode.indices[0] >= 0) {
          const childContext = { ...context, childrenIndex: childrenNode.indices[0] };
          const childResult = await childExecutor(
            childrenNodes[childrenNode.indices[0]]!,
            childContext
          );

          if (isError(childResult)) {
            throw new Error(`Child execution failed: ${childResult.error.message}`);
          }

          return childResult.data;
        }

        // Process all children
        const childResults: GenericMeshData[] = [];

        for (let i = 0; i < childrenNodes.length; i++) {
          const childContext = { ...context, childrenIndex: i };
          const childResult = await childExecutor(childrenNodes[i]!, childContext);

          if (childResult.success) {
            if (this.isGenericMeshData(childResult.data)) {
              childResults.push(childResult.data);
            } else {
              // If child returns a collection, flatten it
              childResults.push(...childResult.data.meshes);
            }
          } else {
            logger.warn(`[CHILDREN] Child ${i} execution failed: ${childResult.error.message}`);
          }
        }

        // Create collection of all children
        const childrenCollection = createMeshCollection(
          `children_${Date.now()}`,
          childResults,
          'control_flow_result'
        );

        if (isError(childrenCollection)) {
          throw new Error(
            `Failed to create children collection: ${childrenCollection.error.message}`
          );
        }

        logger.debug(`[CHILDREN] Processed ${childResults.length} children`);
        return childrenCollection.data;
      },
      (error) => this.createError('EXECUTION_FAILED', `Children processing failed: ${error}`)
    );
  }

  /**
   * Get registered module names
   */
  getRegisteredModules(): readonly string[] {
    return Array.from(this.moduleRegistry.keys());
  }

  /**
   * Check if module is registered
   */
  isModuleRegistered(moduleName: string): boolean {
    return this.moduleRegistry.has(moduleName);
  }

  /**
   * Get module definition
   */
  getModuleDefinition(moduleName: string): ResolvedModuleDefinition | undefined {
    return this.moduleRegistry.get(moduleName);
  }

  /**
   * Clear all registered modules
   */
  clearModules(): void {
    this.moduleRegistry.clear();
    logger.debug('[CLEAR] All modules cleared from registry');
  }

  /**
   * Bind module parameters to argument values
   */
  private bindParameters(
    parameters: readonly ModuleParameter[],
    args: readonly Parameter[],
    context: VariableContext
  ): Record<string, unknown> {
    const bindings: Record<string, unknown> = {};

    // Create a map of argument names to values for named arguments
    const namedArgs = new Map<string, unknown>();
    const positionalArgs: unknown[] = [];

    for (const arg of args) {
      if (arg.name) {
        namedArgs.set(arg.name, this.evaluateParameterValue(arg.value, context));
      } else {
        positionalArgs.push(this.evaluateParameterValue(arg.value, context));
      }
    }

    // Bind parameters
    for (let i = 0; i < parameters.length; i++) {
      const param = parameters[i]!;
      let value: unknown;

      // Check for named argument first
      if (namedArgs.has(param.name)) {
        value = namedArgs.get(param.name);
      }
      // Then check positional arguments
      else if (i < positionalArgs.length) {
        value = positionalArgs[i];
      }
      // Finally use default value
      else if (param.defaultValue !== undefined) {
        value = this.evaluateParameterValue(param.defaultValue, context);
      }
      // No value provided and no default
      else {
        value = undefined;
      }

      bindings[param.name] = value;
    }

    return bindings;
  }

  /**
   * Evaluate parameter value in context
   */
  private evaluateParameterValue(value: unknown, _context: VariableContext): unknown {
    // For now, return the value as-is
    // In a full implementation, this would evaluate expressions and resolve variables
    return value;
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
   * Create a module system error
   */
  private createError(
    code: ModuleSystemError['code'],
    message: string,
    moduleName?: string,
    details?: Record<string, unknown>
  ): ModuleSystemError {
    const error: ModuleSystemError = {
      code,
      message,
      timestamp: new Date(),
      ...(moduleName && { moduleName }),
      ...(details && { details }),
    };

    return error;
  }
}
