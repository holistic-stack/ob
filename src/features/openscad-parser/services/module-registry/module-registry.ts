/**
 * @file module-registry.ts
 * @description Centralized registry for storing and retrieving OpenSCAD module definitions.
 * This service provides a type-safe interface for managing user-defined modules during
 * AST processing and module resolution.
 *
 * @architectural_decision
 * The ModuleRegistry follows the Registry pattern to provide a centralized store for
 * module definitions. It uses immutable data structures and Result<T,E> error handling
 * patterns consistent with the project's functional programming approach.
 *
 * @example
 * ```typescript
 * import { ModuleRegistry } from './module-registry';
 * import type { ModuleDefinitionNode } from '../../ast/ast-types';
 *
 * const registry = new ModuleRegistry();
 *
 * // Register a module definition
 * const moduleDefinition: ModuleDefinitionNode = {
 *   type: 'module_definition',
 *   name: { type: 'expression', expressionType: 'identifier', name: 'mycube' },
 *   parameters: [],
 *   body: [{ type: 'cube', size: 10 }],
 *   location: { line: 1, column: 1 }
 * };
 *
 * const registerResult = registry.register(moduleDefinition);
 * if (registerResult.success) {
 *   console.log('Module registered successfully');
 * }
 *
 * // Lookup a module
 * const lookupResult = registry.lookup('mycube');
 * if (lookupResult.success) {
 *   console.log('Found module:', lookupResult.data);
 * }
 * ```
 */

import type { Result } from '../../../../shared/types/index.js';
import type { ModuleDefinitionNode } from '../../ast/ast-types.js';

/**
 * Error types for module registry operations
 */
export enum ModuleRegistryErrorCode {
  MODULE_ALREADY_EXISTS = 'MODULE_ALREADY_EXISTS',
  MODULE_NOT_FOUND = 'MODULE_NOT_FOUND',
  INVALID_MODULE_NAME = 'INVALID_MODULE_NAME',
  INVALID_MODULE_DEFINITION = 'INVALID_MODULE_DEFINITION',
}

/**
 * Module registry error type
 */
export interface ModuleRegistryError {
  code: ModuleRegistryErrorCode;
  message: string;
  moduleName?: string | undefined;
}

/**
 * Creates a module registry error
 */
function createModuleRegistryError(
  code: ModuleRegistryErrorCode,
  message: string,
  moduleName?: string
): ModuleRegistryError {
  return {
    code,
    message,
    moduleName: moduleName ?? undefined
  };
}

/**
 * @interface ModuleRegistryInterface
 * @description Interface for module registry operations
 */
export interface ModuleRegistryInterface {
  /**
   * Register a module definition
   * @param definition The module definition to register
   * @returns Result indicating success or failure
   */
  register(definition: ModuleDefinitionNode): Result<void, ModuleRegistryError>;

  /**
   * Lookup a module definition by name
   * @param name The module name to lookup
   * @returns Result containing the module definition or error
   */
  lookup(name: string): Result<ModuleDefinitionNode, ModuleRegistryError>;

  /**
   * Check if a module is registered
   * @param name The module name to check
   * @returns True if the module is registered
   */
  has(name: string): boolean;

  /**
   * Get all registered module names
   * @returns Array of registered module names
   */
  getModuleNames(): readonly string[];

  /**
   * Clear all registered modules
   */
  clear(): void;

  /**
   * Get the number of registered modules
   * @returns Number of registered modules
   */
  size(): number;
}

/**
 * @class ModuleRegistry
 * @description Centralized registry for OpenSCAD module definitions
 * @implements {ModuleRegistryInterface}
 */
export class ModuleRegistry implements ModuleRegistryInterface {
  private readonly modules = new Map<string, ModuleDefinitionNode>();

  /**
   * Register a module definition
   */
  register(definition: ModuleDefinitionNode): Result<void, ModuleRegistryError> {
    // Validate the module definition
    if (!definition) {
      return {
        success: false,
        error: createModuleRegistryError(
          ModuleRegistryErrorCode.INVALID_MODULE_DEFINITION,
          'Module definition is null or undefined'
        ),
      };
    }

    if (!definition.name || !definition.name.name) {
      return {
        success: false,
        error: createModuleRegistryError(
          ModuleRegistryErrorCode.INVALID_MODULE_NAME,
          'Module definition must have a valid name'
        ),
      };
    }

    const moduleName = definition.name.name;

    // Validate module name
    if (typeof moduleName !== 'string' || moduleName.trim().length === 0) {
      return {
        success: false,
        error: createModuleRegistryError(
          ModuleRegistryErrorCode.INVALID_MODULE_NAME,
          'Module name must be a non-empty string',
          moduleName
        ),
      };
    }

    // Check if module already exists
    if (this.modules.has(moduleName)) {
      return {
        success: false,
        error: createModuleRegistryError(
          ModuleRegistryErrorCode.MODULE_ALREADY_EXISTS,
          `Module '${moduleName}' is already registered`,
          moduleName
        ),
      };
    }

    // Register the module
    this.modules.set(moduleName, Object.freeze(definition));

    return { success: true, data: undefined };
  }

  /**
   * Lookup a module definition by name
   */
  lookup(name: string): Result<ModuleDefinitionNode, ModuleRegistryError> {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return {
        success: false,
        error: createModuleRegistryError(
          ModuleRegistryErrorCode.INVALID_MODULE_NAME,
          'Module name must be a non-empty string',
          name
        ),
      };
    }

    const module = this.modules.get(name);
    if (!module) {
      return {
        success: false,
        error: createModuleRegistryError(
          ModuleRegistryErrorCode.MODULE_NOT_FOUND,
          `Module '${name}' not found`,
          name
        ),
      };
    }

    return { success: true, data: module };
  }

  /**
   * Check if a module is registered
   */
  has(name: string): boolean {
    return this.modules.has(name);
  }

  /**
   * Get all registered module names
   */
  getModuleNames(): readonly string[] {
    return Object.freeze(Array.from(this.modules.keys()));
  }

  /**
   * Clear all registered modules
   */
  clear(): void {
    this.modules.clear();
  }

  /**
   * Get the number of registered modules
   */
  size(): number {
    return this.modules.size;
  }
}

/**
 * Default module registry instance
 */
export const defaultModuleRegistry = new ModuleRegistry();
