/**
 * @file scoped-registry.service.ts
 * @description Service for creating hierarchical scoped module registries in OpenSCAD.
 * Provides functionality to create child registries that inherit from parent registries
 * while maintaining proper scope isolation for nested modules.
 *
 * @architectural_decision
 * The ScopedRegistryService implements a hierarchical registry pattern where:
 * - Local modules are registered in child registries
 * - Module lookups fall back to parent registries if not found locally
 * - Parent registries cannot see child registry modules (proper encapsulation)
 * - Multiple inheritance levels are supported for deep nesting scenarios
 *
 * @example
 * ```typescript
 * import { ScopedRegistryService } from './scoped-registry.service';
 * import { ModuleRegistry } from '../module-registry/module-registry';
 *
 * const parentRegistry = new ModuleRegistry();
 * const scopedService = new ScopedRegistryService();
 *
 * // Create a child registry that inherits from parent
 * const childRegistry = scopedService.createScopedRegistry(parentRegistry);
 *
 * // Register modules in child scope
 * childRegistry.register(nestedModuleDefinition);
 *
 * // Lookups check child first, then fall back to parent
 * const result = childRegistry.lookup('moduleName');
 * ```
 */

import type { Result } from '../../../../shared/types/index.js';
import type { ModuleDefinitionNode } from '../../ast/ast-types.js';
import {
  ModuleRegistry,
  type ModuleRegistryError,
  type ModuleRegistryInterface,
} from '../module-registry/module-registry.js';

/**
 * @interface ScopedRegistryInterface
 * @description Interface for scoped registry operations.
 * Extends the base ModuleRegistryInterface with scoping-specific functionality.
 */
export interface ScopedRegistryInterface extends ModuleRegistryInterface {
  /** Reference to the parent registry for inheritance */
  readonly parentRegistry: ModuleRegistryInterface | null;
  /** Reference to the local registry for this scope */
  readonly localRegistry: ModuleRegistryInterface;
}

/**
 * @interface ScopedRegistryConfig
 * @description Configuration options for scoped registry creation.
 */
export interface ScopedRegistryConfig {
  /** Whether to enable debug logging for registry operations */
  enableDebugLogging?: boolean;
  /** Maximum inheritance depth to prevent infinite recursion */
  maxInheritanceDepth?: number;
}

/**
 * @class ScopedRegistryService
 * @description Service for creating and managing hierarchical scoped module registries.
 *
 * This service implements the factory pattern to create scoped registries that provide
 * proper inheritance and encapsulation for nested OpenSCAD modules. Each scoped registry
 * maintains a local registry for its own modules while providing fallback access to
 * parent registry modules.
 *
 * @example Basic usage
 * ```typescript
 * const service = new ScopedRegistryService();
 * const parentRegistry = new ModuleRegistry();
 * const childRegistry = service.createScopedRegistry(parentRegistry);
 *
 * // Child can access parent modules
 * const parentResult = childRegistry.lookup('parentModule');
 *
 * // Parent cannot access child modules
 * childRegistry.register(childModuleDefinition);
 * const childResult = parentRegistry.lookup('childModule'); // Returns not found
 * ```
 *
 * @example Multi-level inheritance
 * ```typescript
 * const service = new ScopedRegistryService();
 * const grandparent = new ModuleRegistry();
 * const parent = service.createScopedRegistry(grandparent);
 * const child = service.createScopedRegistry(parent);
 *
 * // Child can access modules from grandparent through parent
 * const result = child.lookup('grandparentModule');
 * ```
 */
export class ScopedRegistryService {
  private readonly config: Required<ScopedRegistryConfig>;

  /**
   * @constructor
   * @param {ScopedRegistryConfig} config - Configuration options for the service
   */
  constructor(config: ScopedRegistryConfig = {}) {
    this.config = {
      enableDebugLogging: config.enableDebugLogging ?? false,
      maxInheritanceDepth: config.maxInheritanceDepth ?? 10,
    };
  }

  /**
   * @method createScopedRegistry
   * @description Creates a new scoped registry that inherits from a parent registry.
   *
   * The created registry implements a hierarchical lookup strategy:
   * 1. First checks the local registry for the requested module
   * 2. If not found locally, delegates to the parent registry
   * 3. Continues up the inheritance chain until found or exhausted
   *
   * @param {ModuleRegistryInterface} parentRegistry - The parent registry to inherit from
   * @returns {ScopedRegistryInterface} A new scoped registry with inheritance
   *
   * @throws {Error} If maximum inheritance depth is exceeded
   *
   * @example
   * ```typescript
   * const service = new ScopedRegistryService();
   * const parent = new ModuleRegistry();
   * const child = service.createScopedRegistry(parent);
   *
   * // Register a module in parent
   * parent.register(parentModuleDefinition);
   *
   * // Child can access parent module
   * const result = child.lookup('parentModule'); // Success
   *
   * // Register a module in child
   * child.register(childModuleDefinition);
   *
   * // Parent cannot access child module
   * const childResult = parent.lookup('childModule'); // Not found
   * ```
   */
  createScopedRegistry(parentRegistry: ModuleRegistryInterface): ScopedRegistryInterface {
    // Check inheritance depth to prevent infinite recursion
    const depth = this.calculateInheritanceDepth(parentRegistry);
    if (depth >= this.config.maxInheritanceDepth) {
      throw new Error(
        `Maximum inheritance depth (${this.config.maxInheritanceDepth}) exceeded. ` +
          `Current depth: ${depth}`
      );
    }

    const localRegistry = new ModuleRegistry();

    if (this.config.enableDebugLogging) {
      console.debug(`[ScopedRegistryService] Creating scoped registry with depth ${depth + 1}`);
    }

    // Create the scoped registry implementation
    const scopedRegistry: ScopedRegistryInterface = {
      parentRegistry,
      localRegistry,

      /**
       * Register a module in the local scope
       */
      register: (moduleDefinition: ModuleDefinitionNode): Result<void, ModuleRegistryError> => {
        if (this.config.enableDebugLogging) {
          const moduleName = moduleDefinition.name.name;
          console.debug(
            `[ScopedRegistryService] Registering module '${moduleName}' in local scope`
          );
        }
        return localRegistry.register(moduleDefinition);
      },

      /**
       * Lookup a module with hierarchical fallback
       */
      lookup: (moduleName: string): Result<ModuleDefinitionNode, ModuleRegistryError> => {
        if (this.config.enableDebugLogging) {
          console.debug(`[ScopedRegistryService] Looking up module '${moduleName}'`);
        }

        // First try local registry
        const localResult = localRegistry.lookup(moduleName);
        if (localResult.success) {
          if (this.config.enableDebugLogging) {
            console.debug(`[ScopedRegistryService] Found '${moduleName}' in local scope`);
          }
          return localResult;
        }

        // Fall back to parent registry
        if (this.config.enableDebugLogging) {
          console.debug(
            `[ScopedRegistryService] Module '${moduleName}' not found locally, checking parent`
          );
        }
        return parentRegistry.lookup(moduleName);
      },

      /**
       * Check if a module exists in this scope or parent scopes
       */
      has: (moduleName: string): boolean => {
        return localRegistry.has(moduleName) || parentRegistry.has(moduleName);
      },

      /**
       * Get all module names from this scope and parent scopes
       */
      getModuleNames: (): string[] => {
        const localNames = localRegistry.getModuleNames();
        const parentNames = parentRegistry.getModuleNames();
        return Array.from(new Set([...localNames, ...parentNames]));
      },

      /**
       * Clear only the local registry (parent remains unchanged)
       */
      clear: (): void => {
        if (this.config.enableDebugLogging) {
          console.debug('[ScopedRegistryService] Clearing local registry');
        }
        localRegistry.clear();
      },

      /**
       * Get total size including parent registries
       */
      size: (): number => {
        return localRegistry.size() + parentRegistry.size();
      },
    };

    return scopedRegistry;
  }

  /**
   * @method calculateInheritanceDepth
   * @description Calculates the inheritance depth of a registry chain.
   * Used to prevent infinite recursion in deeply nested scopes.
   *
   * @param {ModuleRegistryInterface} registry - The registry to calculate depth for
   * @returns {number} The inheritance depth (0 for root registries)
   *
   * @private
   */
  private calculateInheritanceDepth(registry: ModuleRegistryInterface): number {
    let depth = 0;
    let current = registry;

    // Walk up the inheritance chain
    while ('parentRegistry' in current && current.parentRegistry) {
      depth++;
      current = current.parentRegistry as ModuleRegistryInterface;

      // Safety check to prevent infinite loops
      if (depth > this.config.maxInheritanceDepth) {
        break;
      }
    }

    return depth;
  }

  /**
   * @method validateRegistryChain
   * @description Validates that a registry chain is properly formed without cycles.
   *
   * @param {ModuleRegistryInterface} registry - The registry to validate
   * @returns {boolean} True if the chain is valid, false if cycles are detected
   *
   * @example
   * ```typescript
   * const service = new ScopedRegistryService();
   * const isValid = service.validateRegistryChain(someRegistry);
   * if (!isValid) {
   *   throw new Error('Circular registry inheritance detected');
   * }
   * ```
   */
  validateRegistryChain(registry: ModuleRegistryInterface): boolean {
    const visited = new Set<ModuleRegistryInterface>();
    let current = registry;

    while ('parentRegistry' in current && current.parentRegistry) {
      if (visited.has(current)) {
        return false; // Cycle detected
      }
      visited.add(current);
      current = current.parentRegistry as ModuleRegistryInterface;
    }

    return true;
  }
}
