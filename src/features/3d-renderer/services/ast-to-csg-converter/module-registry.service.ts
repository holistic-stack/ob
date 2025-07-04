/**
 * Module Registry Service
 *
 * Service for managing OpenSCAD module definitions and instantiations
 * with support for parameter binding and scope management.
 */

import { createLogger } from '../../../../shared/services/logger.service.js';
import type { Result } from '../../../../shared/types/result.types.js';
import { error, success } from '../../../../shared/utils/functional/result.js';
import type { ASTNode, ModuleDefinitionNode } from '../../../openscad-parser/core/ast-types.js';

const logger = createLogger('ModuleRegistryService');

/**
 * Module instance with parameter bindings
 */
export interface ModuleInstance {
  readonly definition: ModuleDefinitionNode;
  readonly parameters: ReadonlyMap<string, unknown>;
  readonly body: ReadonlyArray<ASTNode>;
}

/**
 * Module registry for storing and retrieving module definitions
 */
export class ModuleRegistryService {
  private readonly modules = new Map<string, ModuleDefinitionNode>();

  constructor() {
    logger.init('ModuleRegistryService initialized');
  }

  /**
   * Register a module definition
   */
  registerModule(moduleNode: ModuleDefinitionNode): Result<void, string> {
    const moduleName = moduleNode.name.name;
    logger.debug(`Registering module: ${moduleName}`);

    if (this.modules.has(moduleName)) {
      return error(`Module '${moduleName}' is already defined`);
    }

    this.modules.set(moduleName, moduleNode);
    logger.debug(`Module '${moduleName}' registered successfully`);
    return success(undefined);
  }

  /**
   * Get a module definition by name
   */
  getModule(name: string): ModuleDefinitionNode | null {
    const module = this.modules.get(name);
    if (module) {
      logger.debug(`Retrieved module definition: ${name}`);
      return module;
    }

    logger.debug(`Module not found: ${name}`);
    return null;
  }

  /**
   * Check if a module is registered
   */
  hasModule(name: string): boolean {
    return this.modules.has(name);
  }

  /**
   * Create a module instance with parameter bindings
   */
  createModuleInstance(
    moduleName: string,
    args: ReadonlyArray<unknown>
  ): Result<ModuleInstance, string> {
    logger.debug(`Creating module instance: ${moduleName} with ${args.length} arguments`);

    const definition = this.getModule(moduleName);
    if (!definition) {
      return error(`Module '${moduleName}' is not defined`);
    }

    // Bind parameters to arguments
    const parameters = new Map<string, unknown>();
    for (let i = 0; i < definition.parameters.length; i++) {
      const param = definition.parameters[i];
      const argValue = i < args.length ? args[i] : undefined;

      if (param && param.name) {
        parameters.set(param.name, argValue);
      }
    }

    const instance: ModuleInstance = {
      definition,
      parameters,
      body: definition.body,
    };

    logger.debug(
      `Module instance created for '${moduleName}' with ${parameters.size} parameter bindings`
    );
    return success(instance);
  }

  /**
   * Get all registered module names
   */
  getModuleNames(): ReadonlyArray<string> {
    return Array.from(this.modules.keys());
  }

  /**
   * Clear all registered modules
   */
  clear(): void {
    logger.debug('Clearing all registered modules');
    this.modules.clear();
  }

  /**
   * Get the number of registered modules
   */
  getModuleCount(): number {
    return this.modules.size;
  }
}

/**
 * Default module registry instance
 */
export const moduleRegistry = new ModuleRegistryService();
