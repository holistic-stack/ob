/**
 * @file index.ts
 * @description This file serves as the barrel export for the AST node handler registry module.
 * It consolidates and exports the core components for managing and registering AST node visitors.
 *
 * @architectural_decision
 * Using a barrel export for the registry module simplifies imports and provides a clear, centralized
 * access point for managing how different AST node types are handled. This promotes modularity and
 * makes it easier to extend or modify the AST processing logic.
 *
 * @example
 * ```typescript
 * import { NodeHandlerRegistry, DefaultNodeHandlerRegistry } from './index';
 *
 * // Example of creating a registry and adding a handler
 * const registry = new NodeHandlerRegistry();
 * registry.registerHandler('cube', (node, source, language, errorHandler) => { /* ... * / });
 *
 * // Example of using the default registry
 * const defaultRegistry = new DefaultNodeHandlerRegistry();
 * ```
 */

export * from './default-node-handler-registry';
export * from './node-handler-registry';
