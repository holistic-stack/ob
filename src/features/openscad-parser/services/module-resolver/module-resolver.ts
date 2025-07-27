/**
 * @file module-resolver.ts
 * @description Module resolution engine that expands module instantiations into their
 * constituent primitives and operations. This service processes an AST containing
 * module definitions and instantiations, and returns a resolved AST where all
 * module calls have been expanded.
 *
 * @architectural_decision
 * The ModuleResolver follows a two-pass approach:
 * 1. First pass: Collect all module definitions and register them
 * 2. Second pass: Expand all module instantiations recursively
 * This ensures that modules can be defined after they are used and supports
 * recursive module calls with proper depth limiting.
 *
 * @example
 * ```typescript
 * import { ModuleResolver } from './module-resolver';
 * import { ModuleRegistry } from '../module-registry/module-registry';
 *
 * const registry = new ModuleRegistry();
 * const resolver = new ModuleResolver(registry);
 *
 * // Input AST with module definition and instantiation
 * const inputAST = [
 *   {
 *     type: 'module_definition',
 *     name: { name: 'mycube' },
 *     body: [{ type: 'cube', size: 10 }]
 *   },
 *   {
 *     type: 'module_instantiation',
 *     name: 'mycube',
 *     args: []
 *   }
 * ];
 *
 * const result = resolver.resolveAST(inputAST);
 * if (result.success) {
 *   // result.data contains: [{ type: 'cube', size: 10 }]
 * }
 * ```
 */

import type { Result } from '../../../../shared/types/index.js';
import type { ASTNode, ModuleDefinitionNode, ModuleInstantiationNode } from '../../ast/ast-types.js';
import { ModuleRegistry, type ModuleRegistryInterface } from '../module-registry/module-registry.js';

/**
 * Error types for module resolution operations
 */
export enum ModuleResolverErrorCode {
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  MODULE_NOT_FOUND = 'MODULE_NOT_FOUND',
  MAX_RECURSION_DEPTH = 'MAX_RECURSION_DEPTH',
  INVALID_AST = 'INVALID_AST',
  PARAMETER_BINDING_ERROR = 'PARAMETER_BINDING_ERROR',
}

/**
 * Module resolver error type
 */
export interface ModuleResolverError {
  code: ModuleResolverErrorCode;
  message: string;
  moduleName?: string;
  recursionDepth?: number;
}

/**
 * Creates a module resolver error
 */
function createModuleResolverError(
  code: ModuleResolverErrorCode,
  message: string,
  moduleName?: string,
  recursionDepth?: number
): ModuleResolverError {
  return { code, message, moduleName, recursionDepth };
}

/**
 * Configuration for module resolution
 */
export interface ModuleResolverConfig {
  /** Maximum recursion depth for module calls (default: 100) */
  maxRecursionDepth: number;
  /** Whether to preserve module definitions in the output (default: false) */
  preserveModuleDefinitions: boolean;
}

/**
 * Default module resolver configuration
 */
export const DEFAULT_MODULE_RESOLVER_CONFIG: ModuleResolverConfig = {
  maxRecursionDepth: 100,
  preserveModuleDefinitions: false,
};

/**
 * Context for tracking module resolution state
 */
interface ResolutionContext {
  /** Current recursion depth */
  depth: number;
  /** Stack of module names being resolved (for circular dependency detection) */
  resolutionStack: string[];
  /** Variable scope for parameter binding */
  variableScope: Map<string, any>;
  /** Scoped module registry for nested modules */
  scopedRegistry: ModuleRegistryInterface;
}

/**
 * @interface ModuleResolverInterface
 * @description Interface for module resolution operations
 */
export interface ModuleResolverInterface {
  /**
   * Resolve an AST by expanding all module instantiations
   * @param ast The input AST containing module definitions and instantiations
   * @returns Result containing the resolved AST or error
   */
  resolveAST(ast: ASTNode[]): Result<ASTNode[], ModuleResolverError>;
}

/**
 * @class ModuleResolver
 * @description Module resolution engine for expanding module instantiations
 * @implements {ModuleResolverInterface}
 */
export class ModuleResolver implements ModuleResolverInterface {
  private readonly config: ModuleResolverConfig;

  constructor(
    private readonly moduleRegistry: ModuleRegistryInterface,
    config: Partial<ModuleResolverConfig> = {}
  ) {
    this.config = { ...DEFAULT_MODULE_RESOLVER_CONFIG, ...config };
  }

  /**
   * Resolve an AST by expanding all module instantiations
   */
  resolveAST(ast: ASTNode[]): Result<ASTNode[], ModuleResolverError> {
    if (!Array.isArray(ast)) {
      return {
        success: false,
        error: createModuleResolverError(
          ModuleResolverErrorCode.INVALID_AST,
          'Input AST must be an array'
        ),
      };
    }

    try {
      // First pass: Register all module definitions
      const registrationResult = this.registerModuleDefinitions(ast);
      if (!registrationResult.success) {
        return registrationResult;
      }

      // Second pass: Resolve all module instantiations
      const resolutionContext: ResolutionContext = {
        depth: 0,
        resolutionStack: [],
        variableScope: new Map(),
        scopedRegistry: this.moduleRegistry, // Use the main registry for top-level scope
      };

      const resolvedNodes: ASTNode[] = [];
      for (const node of ast) {
        const resolvedResult = this.resolveNode(node, resolutionContext);
        if (!resolvedResult.success) {
          return resolvedResult;
        }
        resolvedNodes.push(...resolvedResult.data);
      }

      return { success: true, data: resolvedNodes };
    } catch (error) {
      return {
        success: false,
        error: createModuleResolverError(
          ModuleResolverErrorCode.INVALID_AST,
          `Unexpected error during resolution: ${error}`
        ),
      };
    }
  }

  /**
   * Register all module definitions in the AST
   */
  private registerModuleDefinitions(ast: ASTNode[]): Result<void, ModuleResolverError> {
    for (const node of ast) {
      if (node.type === 'module_definition') {
        const moduleDefinition = node as ModuleDefinitionNode;
        const registrationResult = this.moduleRegistry.register(moduleDefinition);
        if (!registrationResult.success) {
          return {
            success: false,
            error: createModuleResolverError(
              ModuleResolverErrorCode.INVALID_AST,
              `Failed to register module: ${registrationResult.error.message}`,
              moduleDefinition.name.name
            ),
          };
        }
      }
    }
    return { success: true, data: undefined };
  }

  /**
   * Resolve a single AST node
   */
  private resolveNode(
    node: ASTNode,
    context: ResolutionContext
  ): Result<ASTNode[], ModuleResolverError> {
    // Skip module definitions unless configured to preserve them
    if (node.type === 'module_definition') {
      if (this.config.preserveModuleDefinitions) {
        return { success: true, data: [node] };
      } else {
        return { success: true, data: [] };
      }
    }

    // Expand module instantiations
    if (node.type === 'module_instantiation') {
      return this.expandModuleInstantiation(node as ModuleInstantiationNode, context);
    }

    // For other nodes, return as-is
    return { success: true, data: [node] };
  }

  /**
   * Expand a module instantiation into its constituent nodes
   */
  private expandModuleInstantiation(
    instantiation: ModuleInstantiationNode,
    context: ResolutionContext
  ): Result<ASTNode[], ModuleResolverError> {
    const moduleName = typeof instantiation.name === 'string' 
      ? instantiation.name 
      : instantiation.name.name;

    // Check recursion depth
    if (context.depth >= this.config.maxRecursionDepth) {
      return {
        success: false,
        error: createModuleResolverError(
          ModuleResolverErrorCode.MAX_RECURSION_DEPTH,
          `Maximum recursion depth (${this.config.maxRecursionDepth}) exceeded`,
          moduleName,
          context.depth
        ),
      };
    }

    // Check for circular dependencies
    if (context.resolutionStack.includes(moduleName)) {
      return {
        success: false,
        error: createModuleResolverError(
          ModuleResolverErrorCode.CIRCULAR_DEPENDENCY,
          `Circular dependency detected: ${context.resolutionStack.join(' -> ')} -> ${moduleName}`,
          moduleName
        ),
      };
    }

    // Lookup the module definition in the current scope
    const lookupResult = context.scopedRegistry.lookup(moduleName);
    if (!lookupResult.success) {
      return {
        success: false,
        error: createModuleResolverError(
          ModuleResolverErrorCode.MODULE_NOT_FOUND,
          `Module '${moduleName}' not found`,
          moduleName
        ),
      };
    }

    const moduleDefinition = lookupResult.data;

    // Create a hierarchical scoped registry that inherits from the current scope
    const localRegistry = this.createScopedRegistry(context.scopedRegistry);

    // First, register any nested module definitions in the module body
    for (const bodyNode of moduleDefinition.body) {
      if (bodyNode.type === 'module_definition') {
        const registrationResult = localRegistry.register(bodyNode as ModuleDefinitionNode);
        if (!registrationResult.success) {
          return {
            success: false,
            error: createModuleResolverError(
              ModuleResolverErrorCode.INVALID_AST,
              `Failed to register nested module: ${registrationResult.error.message}`,
              (bodyNode as ModuleDefinitionNode).name.name
            ),
          };
        }
      }
    }

    // Create new resolution context for this module with local scope
    const newContext: ResolutionContext = {
      depth: context.depth + 1,
      resolutionStack: [...context.resolutionStack, moduleName],
      variableScope: new Map(context.variableScope), // Copy parent scope
      scopedRegistry: localRegistry, // Use local registry for nested modules
    };

    // TODO: Bind parameters from instantiation.args to moduleDefinition.parameters
    // For now, we'll skip parameter binding and just expand the body

    // Recursively resolve the module body
    const resolvedBody: ASTNode[] = [];
    for (const bodyNode of moduleDefinition.body) {
      const resolvedResult = this.resolveNode(bodyNode, newContext);
      if (!resolvedResult.success) {
        return resolvedResult;
      }
      resolvedBody.push(...resolvedResult.data);
    }

    return { success: true, data: resolvedBody };
  }

  /**
   * Creates a scoped registry that inherits from a parent registry
   * Local modules are registered in the new registry, but lookups fall back to parent
   */
  private createScopedRegistry(parentRegistry: ModuleRegistryInterface): ModuleRegistryInterface {
    const localRegistry = new ModuleRegistry();

    // Create a proxy that delegates lookups to parent if not found locally
    return {
      register: (moduleDefinition: ModuleDefinitionNode) => localRegistry.register(moduleDefinition),
      lookup: (moduleName: string) => {
        // First try local registry
        const localResult = localRegistry.lookup(moduleName);
        if (localResult.success) {
          return localResult;
        }
        // Fall back to parent registry
        return parentRegistry.lookup(moduleName);
      },
      has: (moduleName: string) => localRegistry.has(moduleName) || parentRegistry.has(moduleName),
      getModuleNames: () => [...new Set([...localRegistry.getModuleNames(), ...parentRegistry.getModuleNames()])],
      clear: () => localRegistry.clear(),
      size: () => localRegistry.size() + parentRegistry.size(),
    };
  }
}
