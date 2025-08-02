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

import type { Result } from '@/shared';
import type {
  ASTNode,
  ModuleDefinitionNode,
  ModuleInstantiationNode,
  ModuleParameter,
  Parameter,
  ParameterValue,
} from '../../ast/ast-types.js';
import type { ModuleRegistryInterface } from '../module-registry/module-registry.js';
import { ScopedRegistryService } from '../scoped-registry/scoped-registry.service.js';

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
  const error: ModuleResolverError = { code, message };
  if (moduleName !== undefined) {
    error.moduleName = moduleName;
  }
  if (recursionDepth !== undefined) {
    error.recursionDepth = recursionDepth;
  }
  return error;
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
  variableScope: Map<string, unknown>;
  /** Scoped module registry for nested modules */
  scopedRegistry: ModuleRegistryInterface;
  /** Source code for Tree-sitter text extraction */
  sourceCode?: string;
}

/**
 * @interface ModuleResolverInterface
 * @description Interface for module resolution operations
 */
export interface ModuleResolverInterface {
  /**
   * Resolve an AST by expanding all module instantiations
   * @param ast The input AST containing module definitions and instantiations
   * @param sourceCode Optional source code for Tree-sitter text extraction
   * @returns Result containing the resolved AST or error
   */
  resolveAST(ast: ASTNode[], sourceCode?: string): Result<ASTNode[], ModuleResolverError>;
}

/**
 * @class ModuleResolver
 * @description Module resolution engine for expanding module instantiations
 * @implements {ModuleResolverInterface}
 */
export class ModuleResolver implements ModuleResolverInterface {
  private readonly config: ModuleResolverConfig;
  private readonly scopedRegistryService: ScopedRegistryService;

  constructor(
    private readonly moduleRegistry: ModuleRegistryInterface,
    config: Partial<ModuleResolverConfig> = {}
  ) {
    this.config = { ...DEFAULT_MODULE_RESOLVER_CONFIG, ...config };
    this.scopedRegistryService = new ScopedRegistryService();
  }

  /**
   * @method resolveAST
   * @description Resolves an AST by expanding all module instantiations into their constituent operations.
   *
   * This method implements a two-pass resolution strategy:
   * 1. **Registration Pass**: Registers all top-level module definitions in the registry
   * 2. **Resolution Pass**: Recursively expands all module instantiations using hierarchical scoped registries
   *
   * The resolution process handles:
   * - Nested module definitions within module bodies
   * - Hierarchical scope inheritance (nested modules can access parent scope modules)
   * - Circular dependency detection to prevent infinite recursion
   * - Proper scope isolation (parent scopes cannot access child scope modules)
   *
   * @param {ASTNode[]} ast - The input AST containing module definitions and instantiations
   * @returns {Result<ASTNode[], ModuleResolverError>} Result containing the resolved AST with all modules expanded, or error details
   *
   * @example Basic module resolution
   * ```typescript
   * const resolver = new ModuleResolver(registry);
   * const ast = [
   *   { type: 'module_definition', name: 'box', body: [{ type: 'cube', size: 10 }] },
   *   { type: 'module_instantiation', name: 'box' }
   * ];
   * const result = resolver.resolveAST(ast);
   * // result.data = [{ type: 'cube', size: 10 }]
   * ```
   *
   * @example Nested module resolution
   * ```typescript
   * const ast = [
   *   {
   *     type: 'module_definition',
   *     name: 'outer',
   *     body: [
   *       { type: 'module_definition', name: 'inner', body: [{ type: 'sphere', radius: 5 }] },
   *       { type: 'module_instantiation', name: 'inner' }
   *     ]
   *   },
   *   { type: 'module_instantiation', name: 'outer' }
   * ];
   * const result = resolver.resolveAST(ast);
   * // result.data = [{ type: 'sphere', radius: 5 }]
   * ```
   *
   * @throws {ModuleResolverError} When circular dependencies are detected
   * @throws {ModuleResolverError} When referenced modules are not found
   * @throws {ModuleResolverError} When maximum recursion depth is exceeded
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
        variableScope: new Map<string, unknown>(),
        scopedRegistry: this.moduleRegistry, // Use the main registry for top-level scope
      };

      const resolvedNodes: ASTNode[] = [];
      for (const node of ast) {
        const resolvedResult = this.resolveNode(node, resolutionContext);
        if (resolvedResult.success) {
          resolvedNodes.push(...resolvedResult.data);
        } else {
          return resolvedResult;
        }
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
  private registerModuleDefinitions(ast: ASTNode[]): Result<ASTNode[], ModuleResolverError> {
    for (const node of ast) {
      if (node.type === 'module_definition') {
        const moduleDefinition = node as ModuleDefinitionNode;
        const registrationResult = this.moduleRegistry.register(moduleDefinition);
        if (!registrationResult.success) {
          const errorMessage =
            'error' in registrationResult
              ? registrationResult.error.message
              : 'Unknown registration error';
          return {
            success: false,
            error: createModuleResolverError(
              ModuleResolverErrorCode.INVALID_AST,
              `Failed to register module: ${errorMessage}`,
              moduleDefinition.name.name
            ),
          };
        }
      }
    }
    return { success: true, data: [] };
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

    // For other nodes, recursively resolve any child nodes that might contain module instantiations
    return this.resolveNodeRecursively(node, context);
  }

  /**
   * Recursively resolve child nodes that might contain module instantiations
   */
  private resolveNodeRecursively(
    node: ASTNode,
    context: ResolutionContext
  ): Result<ASTNode[], ModuleResolverError> {
    console.log(`[ModuleResolver] DEBUG - Recursively resolving node: ${node.type}`);

    // Create a copy of the node to avoid mutation
    const resolvedNode = { ...node };

    // Handle nodes that can contain child nodes
    if (this.hasChildNodes(node)) {
      console.log(`[ModuleResolver] DEBUG - Node ${node.type} has child nodes`);
      const childNodes = this.getChildNodes(node);
      console.log(`[ModuleResolver] DEBUG - Found ${childNodes.length} child nodes`);

      const resolvedChildren: ASTNode[] = [];

      // Recursively resolve each child node
      for (const childNode of childNodes) {
        console.log(`[ModuleResolver] DEBUG - Resolving child node: ${childNode.type}`);
        const childResult = this.resolveNode(childNode, context);
        if (childResult.success) {
          console.log(
            `[ModuleResolver] DEBUG - Child resolved to ${childResult.data.length} nodes`
          );
          resolvedChildren.push(...childResult.data);
        } else {
          return childResult;
        }
      }

      // Update the resolved node with the resolved children
      this.setChildNodes(resolvedNode, resolvedChildren);
      console.log(
        `[ModuleResolver] DEBUG - Updated node ${node.type} with ${resolvedChildren.length} resolved children`
      );
    } else {
      console.log(`[ModuleResolver] DEBUG - Node ${node.type} has no child nodes`);
    }

    return { success: true, data: [resolvedNode] };
  }

  /**
   * Check if a node can contain child nodes
   */
  private hasChildNodes(node: ASTNode): boolean {
    return (
      node.type === 'translate' ||
      node.type === 'rotate' ||
      node.type === 'scale' ||
      node.type === 'mirror' ||
      node.type === 'multmatrix' ||
      node.type === 'color' ||
      node.type === 'union' ||
      node.type === 'difference' ||
      node.type === 'intersection' ||
      node.type === 'hull' ||
      node.type === 'minkowski' ||
      node.type === 'group'
    );
  }

  /**
   * Get child nodes from a composite node
   */
  private getChildNodes(node: ASTNode): ASTNode[] {
    // Most transform and CSG nodes have a 'children' property
    const nodeWithChildren = node as ASTNode & {
      children?: ASTNode[];
      body?: ASTNode[];
    };
    if (nodeWithChildren.children && Array.isArray(nodeWithChildren.children)) {
      return nodeWithChildren.children;
    }

    // Some nodes might have different property names
    if (nodeWithChildren.body && Array.isArray(nodeWithChildren.body)) {
      return nodeWithChildren.body;
    }

    return [];
  }

  /**
   * Set child nodes on a composite node
   */
  private setChildNodes(node: ASTNode, children: ASTNode[]): void {
    // Use type assertion to ensure the node has children or body properties
    const nodeWithChildren = node as ASTNode & {
      children?: ASTNode[];
      body?: ASTNode[];
    };

    // Most transform and CSG nodes use 'children' property
    if ('children' in nodeWithChildren) {
      nodeWithChildren.children = children;
    }
    // Some nodes might use 'body' property
    else if ('body' in nodeWithChildren) {
      nodeWithChildren.body = children;
    }
  }

  /**
   * Expand a module instantiation into its constituent nodes
   */
  private expandModuleInstantiation(
    instantiation: ModuleInstantiationNode,
    context: ResolutionContext
  ): Result<ASTNode[], ModuleResolverError> {
    const moduleName =
      typeof instantiation.name === 'string' ? instantiation.name : instantiation.name.name;

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
    const localRegistry = this.scopedRegistryService.createScopedRegistry(context.scopedRegistry);

    // First, register any nested module definitions in the module body
    for (const bodyNode of moduleDefinition.body) {
      if (bodyNode.type === 'module_definition') {
        const registrationResult = localRegistry.register(bodyNode as ModuleDefinitionNode);
        if (!registrationResult.success) {
          const errorMessage =
            'error' in registrationResult
              ? registrationResult.error.message
              : 'Unknown registration error';
          return {
            success: false,
            error: createModuleResolverError(
              ModuleResolverErrorCode.INVALID_AST,
              `Failed to register nested module: ${errorMessage}`,
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
      variableScope: new Map<string, unknown>(context.variableScope), // Copy parent scope
      scopedRegistry: localRegistry, // Use local registry for nested modules
      sourceCode: context.sourceCode ?? undefined, // Pass through the source code
    };

    // Bind parameters from instantiation.args to moduleDefinition.parameters
    console.log(`[ModuleResolver] DEBUG - Binding parameters for module ${instantiation.name}`);
    console.log(`[ModuleResolver] DEBUG - Args:`, JSON.stringify(instantiation.args, null, 2));
    console.log(
      `[ModuleResolver] DEBUG - Parameters:`,
      JSON.stringify(moduleDefinition.parameters, null, 2)
    );

    const parameterBindingResult = this.bindParameters(
      instantiation.args,
      moduleDefinition.parameters || [],
      newContext
    );
    if (!parameterBindingResult.success) {
      return parameterBindingResult;
    }

    console.log(`[ModuleResolver] DEBUG - Parameter bindings:`, parameterBindingResult.data);

    // Debug: Log module body before substitution
    console.log(
      `[ModuleResolver] DEBUG - Module body before substitution (${moduleDefinition.body.length} nodes):`
    );
    for (let i = 0; i < moduleDefinition.body.length; i++) {
      const bodyNode = moduleDefinition.body[i];
      if (bodyNode) {
        console.log(`  [${i}] type=${bodyNode.type}`, JSON.stringify(bodyNode, null, 2));
      }
    }

    // Apply parameter substitution to module body
    const substitutedBody = this.substituteParameters(
      moduleDefinition.body,
      parameterBindingResult.data
    );

    // Debug: Log module body after substitution
    console.log(
      `[ModuleResolver] DEBUG - Module body after substitution (${substitutedBody.length} nodes):`
    );
    for (let i = 0; i < substitutedBody.length; i++) {
      const bodyNode = substitutedBody[i];
      if (bodyNode) {
        console.log(`  [${i}] type=${bodyNode.type}`, JSON.stringify(bodyNode, null, 2));
      }
    }

    // Recursively resolve the substituted module body
    const resolvedBody: ASTNode[] = [];
    for (const bodyNode of substitutedBody) {
      const resolvedResult = this.resolveNode(bodyNode, newContext);
      if (resolvedResult.success) {
        resolvedBody.push(...resolvedResult.data);
      } else {
        return resolvedResult;
      }
    }

    return { success: true, data: resolvedBody };
  }

  /**
   * Bind arguments from module instantiation to module definition parameters
   */
  private bindParameters(
    args: Parameter[],
    parameters: ModuleParameter[],
    context: ResolutionContext
  ): Result<Map<string, ParameterValue>, ModuleResolverError> {
    const bindings = new Map<string, ParameterValue>();

    // Create a map of parameter names to their definitions for easy lookup
    const parameterMap = new Map<string, ModuleParameter>();
    for (const param of parameters) {
      parameterMap.set(param.name, param);
    }

    // Track which parameters have been bound
    const boundParameters = new Set<string>();

    // First pass: Bind named arguments
    for (const arg of args) {
      if (arg.name) {
        const parameter = parameterMap.get(arg.name);
        if (!parameter) {
          return {
            success: false,
            error: createModuleResolverError(
              ModuleResolverErrorCode.PARAMETER_BINDING_ERROR,
              `Unknown parameter '${arg.name}'`,
              context.resolutionStack[context.resolutionStack.length - 1] || 'unknown'
            ),
          };
        }
        bindings.set(arg.name, arg.value);
        boundParameters.add(arg.name);
      }
    }

    // Second pass: Bind positional arguments
    const positionalArgs = args.filter((arg) => !arg.name);
    const unnamedParameters = parameters.filter((param) => !boundParameters.has(param.name));

    for (let i = 0; i < positionalArgs.length; i++) {
      if (i >= unnamedParameters.length) {
        return {
          success: false,
          error: createModuleResolverError(
            ModuleResolverErrorCode.PARAMETER_BINDING_ERROR,
            `Too many positional arguments. Expected ${unnamedParameters.length}, got ${positionalArgs.length}`,
            context.resolutionStack[context.resolutionStack.length - 1] || 'unknown'
          ),
        };
      }
      const parameter = unnamedParameters[i];
      const positionalArg = positionalArgs[i];
      if (parameter && positionalArg) {
        console.log(`[ModuleResolver] DEBUG - Binding positional arg ${i}:`);
        console.log(`  Parameter: ${parameter.name}`);
        console.log(`  Arg value:`, JSON.stringify(positionalArg.value, null, 2));
        bindings.set(parameter.name, positionalArg.value);
        boundParameters.add(parameter.name);
      }
    }

    // Third pass: Apply default values for unbound parameters
    for (const parameter of parameters) {
      if (!boundParameters.has(parameter.name)) {
        if (parameter.defaultValue) {
          // Extract the value from the default value AST node
          const defaultValue = this.extractValueFromASTNode(parameter.defaultValue);
          bindings.set(parameter.name, defaultValue);
        } else {
          return {
            success: false,
            error: createModuleResolverError(
              ModuleResolverErrorCode.PARAMETER_BINDING_ERROR,
              `Required parameter '${parameter.name}' not provided and has no default value`,
              context.resolutionStack[context.resolutionStack.length - 1] || 'unknown'
            ),
          };
        }
      }
    }

    return { success: true, data: bindings };
  }

  /**
   * Substitute parameter values in AST nodes
   */
  private substituteParameters(nodes: ASTNode[], bindings: Map<string, ParameterValue>): ASTNode[] {
    return nodes.map((node) => this.substituteParametersInNode(node, bindings));
  }

  /**
   * Substitute parameter values in a single AST node
   */
  private substituteParametersInNode(
    node: ASTNode,
    bindings: Map<string, ParameterValue>
  ): ASTNode {
    console.log(
      `[ModuleResolver] DEBUG - substituteParametersInNode BEFORE deep copy: type=${node.type}`
    );
    console.log(`[ModuleResolver] DEBUG - Original node:`, JSON.stringify(node, null, 2));

    // Create a deep copy of the node to avoid mutating the original
    const substitutedNode = JSON.parse(JSON.stringify(node)) as ASTNode;

    console.log(
      `[ModuleResolver] DEBUG - substituteParametersInNode AFTER deep copy: type=${substitutedNode.type}`
    );
    console.log(`[ModuleResolver] DEBUG - Copied node:`, JSON.stringify(substitutedNode, null, 2));

    // Recursively substitute parameters in the node
    this.substituteParametersRecursive(substitutedNode, bindings);

    console.log(
      `[ModuleResolver] DEBUG - substituteParametersInNode AFTER substitution: type=${substitutedNode.type}`
    );
    console.log(`[ModuleResolver] DEBUG - Final node:`, JSON.stringify(substitutedNode, null, 2));

    return substitutedNode;
  }

  /**
   * Recursively substitute parameters in an AST node and its children
   */
  private substituteParametersRecursive(
    node: unknown,
    bindings: Map<string, ParameterValue>
  ): void {
    if (!node || typeof node !== 'object') {
      return;
    }

    // Handle arrays
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        const item = node[i];
        if (typeof item === 'string' && bindings.has(item)) {
          // Direct string parameter reference in array
          node[i] = bindings.get(item);
        } else {
          this.substituteParametersRecursive(item, bindings);
        }
      }
      return;
    }

    // Handle primitive nodes with parameter references FIRST
    // This must be done before checking for identifier nodes to ensure
    // that nodes like cube, sphere, etc. have their properties substituted
    // Only process nodes that have a valid type field (not expression elements)
    if (node.type && node.type !== 'expression') {
      this.substituteParametersInPrimitiveProperties(node, bindings);
    }

    // Handle identifier nodes that might be parameter references
    if (node.type === 'identifier' && typeof node.name === 'string' && bindings.has(node.name)) {
      // Replace the identifier with the bound value
      const value = bindings.get(node.name);
      if (value !== undefined) {
        this.replaceNodeWithValue(node, value);
      }
      return;
    }

    // Recursively process all properties
    for (const key in node) {
      if (Object.hasOwn(node, key) && key !== 'type') {
        const value = node[key];

        // Skip properties that are handled by substituteParametersInPrimitiveProperties
        const primitiveProperties = ['size', 'radius', 'height', 'diameter', 'r', 'h', 'd', 'v'];
        if (primitiveProperties.includes(key)) {
          // Skip - already handled by substituteParametersInPrimitiveProperties
          continue;
        }

        if (typeof value === 'string' && bindings.has(value)) {
          // Direct string parameter reference in property
          node[key] = bindings.get(value);
        } else {
          this.substituteParametersRecursive(value, bindings);
        }
      }
    }
  }

  /**
   * Substitute parameters in primitive node properties (size, radius, etc.)
   */
  private substituteParametersInPrimitiveProperties(
    node: Record<string, unknown>,
    bindings: Map<string, ParameterValue>
  ): void {
    // Skip if node is null or undefined
    if (!node || typeof node !== 'object') {
      return;
    }

    // Handle common primitive properties that might contain parameter references
    const propertiesToCheck = ['size', 'radius', 'height', 'diameter', 'r', 'h', 'd', 'v'];

    console.log(
      `[ModuleResolver] DEBUG - substituteParametersInPrimitiveProperties for node type: ${node.type || 'undefined'}`
    );
    console.log(`[ModuleResolver] DEBUG - Available bindings:`, Array.from(bindings.entries()));

    for (const prop of propertiesToCheck) {
      if (node[prop] !== undefined) {
        console.log(
          `[ModuleResolver] DEBUG - Processing property '${prop}':`,
          JSON.stringify(node[prop], null, 2)
        );

        if (typeof node[prop] === 'string' && bindings.has(node[prop])) {
          // Direct parameter reference (string)
          const boundValue = bindings.get(node[prop]);
          console.log(
            `[ModuleResolver] DEBUG - Replacing string '${node[prop]}' with:`,
            boundValue
          );
          node[prop] = this.extractActualValue(boundValue);
        } else if (
          typeof node[prop] === 'object' &&
          node[prop] !== null &&
          node[prop].type === 'expression' &&
          node[prop].expressionType === 'vector'
        ) {
          // Handle VectorExpressionNode with elements array
          const vectorExpr = node[prop];
          console.log(
            `[ModuleResolver] DEBUG - Processing VectorExpressionNode '${prop}' with ${vectorExpr.elements?.length || 0} elements`
          );
          console.log(
            `[ModuleResolver] DEBUG - VectorExpr structure:`,
            JSON.stringify(vectorExpr, null, 2)
          );

          if (vectorExpr.elements && Array.isArray(vectorExpr.elements)) {
            const resolvedElements: number[] = [];

            for (let i = 0; i < vectorExpr.elements.length; i++) {
              const element = vectorExpr.elements[i];
              console.log(
                `[ModuleResolver] DEBUG - Vector element ${i}:`,
                JSON.stringify(element, null, 2)
              );

              if (typeof element === 'object' && element.type === 'expression') {
                if (element.expressionType === 'identifier' && bindings.has(element.name)) {
                  const boundValue = bindings.get(element.name);
                  console.log(
                    `[ModuleResolver] DEBUG - Replacing vector identifier '${element.name}' with:`,
                    boundValue
                  );

                  // Extract numeric value from bound parameter using extractActualValue
                  const actualValue = this.extractActualValue(boundValue);
                  console.log(`[ModuleResolver] DEBUG - Extracted actual value:`, actualValue);
                  resolvedElements.push(typeof actualValue === 'number' ? actualValue : 0);
                } else if (element.expressionType === 'literal') {
                  const literalValue = element.value;
                  resolvedElements.push(typeof literalValue === 'number' ? literalValue : 0);
                } else {
                  console.log(
                    `[ModuleResolver] DEBUG - Unhandled vector element expression type: ${element.expressionType}`
                  );
                  resolvedElements.push(0);
                }
              } else {
                console.log(
                  `[ModuleResolver] DEBUG - Vector element ${i} not processed (type: ${typeof element}, element.type: ${element?.type})`
                );
                resolvedElements.push(0);
              }
            }

            // Replace the VectorExpressionNode with a simple numeric array
            node[prop] = resolvedElements;
            console.log(
              `[ModuleResolver] DEBUG - Resolved VectorExpressionNode '${prop}' to:`,
              resolvedElements
            );
          }
        } else if (typeof node[prop] === 'object' && node[prop] !== null) {
          // Handle different types of object references
          if (node[prop].type === 'identifier' && bindings.has(node[prop].name)) {
            // Identifier node reference
            const boundValue = bindings.get(node[prop].name);
            console.log(
              `[ModuleResolver] DEBUG - Replacing identifier '${node[prop].name}' with:`,
              boundValue
            );
            node[prop] = this.extractActualValue(boundValue);
          } else if (
            node[prop].type === 'expression' &&
            node[prop].expressionType === 'identifier' &&
            bindings.has(node[prop].name)
          ) {
            // Expression identifier reference
            const boundValue = bindings.get(node[prop].name);
            console.log(
              `[ModuleResolver] DEBUG - Replacing expression identifier '${node[prop].name}' with:`,
              boundValue
            );
            node[prop] = this.extractActualValue(boundValue);
          }
        } else if (Array.isArray(node[prop])) {
          // Handle arrays (like translate vectors)
          console.log(
            `[ModuleResolver] DEBUG - Processing array property '${prop}' with ${node[prop].length} elements`
          );
          for (let i = 0; i < node[prop].length; i++) {
            const element = node[prop][i];
            console.log(
              `[ModuleResolver] DEBUG - Array element ${i}:`,
              JSON.stringify(element, null, 2)
            );

            if (typeof element === 'string' && bindings.has(element)) {
              console.log(
                `[ModuleResolver] DEBUG - Replacing array string '${element}' with:`,
                bindings.get(element)
              );
              node[prop][i] = bindings.get(element);
            } else if (typeof element === 'object' && element.type === 'identifier') {
              if (bindings.has(element.name)) {
                console.log(
                  `[ModuleResolver] DEBUG - Replacing array identifier '${element.name}' with:`,
                  bindings.get(element.name)
                );
                node[prop][i] = bindings.get(element.name);
              } else {
                console.log(
                  `[ModuleResolver] DEBUG - No binding found for identifier '${element.name}'`
                );
              }
            } else {
              console.log(
                `[ModuleResolver] DEBUG - Element ${i} not processed (type: ${typeof element}, element.type: ${element?.type})`
              );
            }
          }
          console.log(
            `[ModuleResolver] DEBUG - Final array for '${prop}':`,
            JSON.stringify(node[prop], null, 2)
          );
        }
      }
    }
  }

  /**
   * Replace a node with a parameter value
   */
  private replaceNodeWithValue(node: Record<string, unknown>, value: ParameterValue): void {
    console.log(`[ModuleResolver] DEBUG - replaceNodeWithValue:`, JSON.stringify(value, null, 2));

    // Preserve the original node type if it exists
    const originalType = node.type;

    // Clear all existing properties except type
    for (const key in node) {
      if (Object.hasOwn(node, key) && key !== 'type') {
        delete node[key];
      }
    }

    // Handle expression nodes with literal values
    if (
      typeof value === 'object' &&
      value !== null &&
      (value as Record<string, unknown>).type === 'expression'
    ) {
      const expr = value as Record<string, unknown>;
      if (expr.expressionType === 'literal') {
        // Extract the actual value from the literal expression
        const actualValue = expr.value;
        if (typeof actualValue === 'number') {
          // Keep original type if it exists, otherwise set to 'number'
          if (!originalType) {
            node.type = 'number';
          }
          node.value = actualValue;
          return;
        } else if (typeof actualValue === 'string') {
          // Try to parse as number first
          const numValue = Number(actualValue);
          if (!Number.isNaN(numValue)) {
            // Keep original type if it exists, otherwise set to 'number'
            if (!originalType) {
              node.type = 'number';
            }
            node.value = numValue;
            return;
          }
          // Keep original type if it exists, otherwise set to 'string'
          if (!originalType) {
            node.type = 'string';
          }
          node.value = actualValue;
          return;
        } else if (typeof actualValue === 'boolean') {
          // Keep original type if it exists, otherwise set to 'boolean'
          if (!originalType) {
            node.type = 'boolean';
          }
          node.value = actualValue;
          return;
        }
      }
      // For other expression types, keep as-is but preserve original type
      Object.assign(node, value);
      if (originalType) {
        node.type = originalType;
      }
      return;
    }

    // Set the value based on its type, but preserve original node type
    if (typeof value === 'number') {
      if (!originalType) {
        node.type = 'number';
      }
      node.value = value;
    } else if (typeof value === 'boolean') {
      if (!originalType) {
        node.type = 'boolean';
      }
      node.value = value;
    } else if (typeof value === 'string') {
      if (!originalType) {
        node.type = 'string';
      }
      node.value = value;
    } else if (Array.isArray(value)) {
      if (!originalType) {
        node.type = 'vector';
      }
      node.elements = value;
    } else {
      // For complex values, keep as-is but preserve original type
      Object.assign(node, value);
      if (originalType) {
        node.type = originalType;
      }
    }
  }

  /**
   * Extract the actual value from a bound parameter, handling expression objects
   */
  private extractActualValue(boundValue: ParameterValue): string | number | boolean | null {
    // Handle expression nodes with literal values
    if (
      typeof boundValue === 'object' &&
      boundValue !== null &&
      (boundValue as Record<string, unknown>).type === 'expression'
    ) {
      const expr = boundValue as Record<string, unknown>;
      if (expr.expressionType === 'literal') {
        // Extract the actual value from the literal expression
        const actualValue = expr.value;
        if (typeof actualValue === 'string') {
          // Try to parse as number first
          const numValue = Number(actualValue);
          if (!Number.isNaN(numValue)) {
            return numValue;
          }
          // Return as string if not a number
          return actualValue;
        }
        return actualValue;
      }
      // For other expression types, return the expression object
      return boundValue;
    }

    // For primitive values, return as-is
    return boundValue;
  }

  /**
   * Extract a parameter value from an AST node (for default values)
   */
  private extractValueFromASTNode(node: ASTNode): ParameterValue {
    if (!node) {
      return undefined;
    }

    console.log(`[ModuleResolver] DEBUG - extractValueFromASTNode:`, JSON.stringify(node, null, 2));

    // Handle different node types
    switch (node.type) {
      case 'number':
        return (node as { value?: number }).value || 0;
      case 'boolean':
        return (node as { value?: boolean }).value || false;
      case 'string':
        return (node as { value?: string }).value || '';
      case 'vector':
        return (node as { elements?: unknown[] }).elements || [];
      case 'identifier':
        // For identifiers in default values, return the name as a string
        // This will be resolved later if it's a variable reference
        return (node as { name?: string }).name || '';
      case 'expression': {
        // Handle expression nodes - check if it's a literal expression
        const expr = node as Record<string, unknown>;
        if (expr.expressionType === 'literal') {
          // Try to parse the literal value
          const value = expr.value;
          if (typeof value === 'string') {
            // Try to parse as number first
            const numValue = Number(value);
            if (!Number.isNaN(numValue)) {
              return numValue;
            }
            // Return as string if not a number
            return value;
          }
          return value;
        }
        // For other expression types, return the node itself
        return node as ParameterValue;
      }
      default:
        console.log(`[ModuleResolver] DEBUG - Unknown node type: ${node.type}`);
        // For complex expressions, return the node itself
        // This allows for more complex default value expressions
        return node as ParameterValue;
    }
  }
}
