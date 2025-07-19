/**
 * @file node-handler-registry-factory.ts
 * @description This file provides factory functions for creating and configuring `NodeHandlerRegistry` instances.
 * It centralizes the registration of default AST node handlers for various OpenSCAD constructs,
 * including primitives, transformations, CSG operations, and module/function definitions.
 *
 * @architectural_decision
 * The use of a factory pattern (`createNodeHandlerRegistry`) allows for a clean separation between the
 * definition of node handlers and their registration. This makes the registry easily configurable and extensible.
 * By grouping related handlers (primitives, transformations, etc.) into dedicated registration functions,
 * the code remains organized and maintainable. This factory ensures that a fully populated registry
 * with all standard OpenSCAD AST handlers is readily available for the parser.
 *
 * @example
 * ```typescript
 * import { createNodeHandlerRegistry } from './node-handler-registry-factory';
 * import * as TreeSitter from 'web-tree-sitter';
 * import { SimpleErrorHandler } from '../../error-handling/simple-error-handler';
 * import type { ASTNode } from '../ast-types';
 *
 * // Create a fully configured registry
 * const registry = createNodeHandlerRegistry();
 *
 * // Example of using a handler from the registry
 * // Assume you have a Tree-sitter node for a cube
 * const mockCubeNode: TreeSitter.Node = { type: 'cube', text: 'cube(10)' } as TreeSitter.Node;
 * const errorHandler = new SimpleErrorHandler();
 * const language = {} as TreeSitter.Language; // Mock language
 *
 * const cubeHandler = registry.getHandler('cube');
 * if (cubeHandler) {
 *   const cubeAST: ASTNode | null = cubeHandler(mockCubeNode, 'cube(10);', language, errorHandler);
 *   console.log('Generated Cube AST:', cubeAST); // Expected: { type: 'cube', size: 1, center: false, ... }
 * }
 *
 * // You can also create a default registry directly
 * import { createDefaultNodeHandlerRegistry } from './node-handler-registry-factory';
 * const defaultRegistry = createDefaultNodeHandlerRegistry();
 * console.log('Default registry has cube handler:', defaultRegistry.hasHandler('cube')); // Expected: true
 * ```
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type { ExpressionNode, IdentifierNode } from '../ast-types.js';
import { DefaultNodeHandlerRegistry } from './default-node-handler-registry.js';
import type { NodeHandlerRegistry } from './node-handler-registry.js';

/**
 * @function createNodeHandlerRegistry
 * @description Creates and returns a fully configured `NodeHandlerRegistry` instance
 * with all default OpenSCAD primitive, transformation, CSG, and module/function handlers registered.
 *
 * @returns {NodeHandlerRegistry} A new `NodeHandlerRegistry` instance populated with default handlers.
 */
export function createNodeHandlerRegistry(): NodeHandlerRegistry {
  const registry = new DefaultNodeHandlerRegistry();

  // Register primitive handlers
  registerPrimitiveHandlers(registry);

  // Register transformation handlers
  registerTransformationHandlers(registry);

  // Register CSG operation handlers
  registerCSGOperationHandlers(registry);

  // Register module and function handlers
  registerModuleAndFunctionHandlers(registry);

  return registry;
}

/**
 * @function createDefaultNodeHandlerRegistry
 * @description Creates and returns a new, empty `DefaultNodeHandlerRegistry` instance.
 * This function is useful if you want to build a custom registry from scratch or extend it selectively.
 *
 * @returns {NodeHandlerRegistry} A new, empty `DefaultNodeHandlerRegistry` instance.
 */
export function createDefaultNodeHandlerRegistry(): NodeHandlerRegistry {
  return new DefaultNodeHandlerRegistry();
}

/**
 * @function registerPrimitiveHandlers
 * @description Registers `NodeHandler` functions for OpenSCAD primitive shapes (e.g., `cube`, `sphere`, `cylinder`).
 * Each handler creates a basic AST node for the corresponding primitive with default values.
 *
 * @param {NodeHandlerRegistry} registry - The registry to which handlers will be registered.
 *
 * @limitations
 * - The handlers registered here provide only basic AST nodes with default parameters.
 *   Actual parameter extraction (size, radius, center, etc.) is handled by specialized extractors
 *   and visitors during the full AST generation process.
 * - The `_node: TSNode` parameter is currently unused in these simplified handlers, as they return
 *   fixed default AST structures. In a complete implementation, it would be used to extract parameters.
 */
function registerPrimitiveHandlers(registry: NodeHandlerRegistry): void {
  // 3D primitives
  registry.register('cube', (_node: TSNode) => {
    return { type: 'cube', size: 1, center: false };
  });

  registry.register('sphere', (_node: TSNode) => {
    return { type: 'sphere', radius: 1 };
  });

  registry.register('cylinder', (_node: TSNode) => {
    return { type: 'cylinder', h: 1, r: 1, center: false };
  });

  registry.register('polyhedron', (_node: TSNode) => {
    return { type: 'polyhedron', points: [], faces: [] };
  });

  // 2D primitives
  registry.register('circle', (_node: TSNode) => {
    return { type: 'circle', r: 1 };
  });

  registry.register('square', (_node: TSNode) => {
    return { type: 'square', size: 1, center: false };
  });

  registry.register('polygon', (_node: TSNode) => {
    return { type: 'polygon', points: [] };
  });

  registry.register('text', (_node: TSNode) => {
    return { type: 'text', text: '' };
  });

  // Extrusions
  registry.register('linear_extrude', (_node: TSNode) => {
    return { type: 'linear_extrude', height: 1, center: false, children: [] };
  });

  registry.register('rotate_extrude', (_node: TSNode) => {
    return { type: 'rotate_extrude', angle: 360, children: [] };
  });
}

/**
 * @function registerTransformationHandlers
 * @description Registers `NodeHandler` functions for OpenSCAD transformation modules
 * (e.g., `translate`, `rotate`, `scale`, `mirror`, `multmatrix`, `color`, `offset`).
 * Each handler creates a basic AST node for the corresponding transformation with default values.
 *
 * @param {NodeHandlerRegistry} registry - The registry to which handlers will be registered.
 *
 * @limitations
 * - Similar to primitive handlers, these provide only basic AST nodes. Actual parameter extraction
 *   (vectors, angles, colors) and child processing are handled by specialized visitors.
 */
function registerTransformationHandlers(registry: NodeHandlerRegistry): void {
  registry.register('translate', (_node: TSNode) => {
    return { type: 'translate', v: [0, 0, 0], children: [] };
  });

  registry.register('rotate', (_node: TSNode) => {
    return { type: 'rotate', a: 0, children: [] };
  });

  registry.register('scale', (_node: TSNode) => {
    return { type: 'scale', v: [1, 1, 1], children: [] };
  });

  registry.register('mirror', (_node: TSNode) => {
    return { type: 'mirror', v: [0, 0, 0], children: [] };
  });

  registry.register('multmatrix', (_node: TSNode) => {
    return {
      type: 'multmatrix',
      m: [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ],
      children: [],
    };
  });

  registry.register('color', (_node: TSNode) => {
    return { type: 'color', c: [1, 1, 1, 1], children: [] };
  });

  registry.register('offset', (_node: TSNode) => {
    return { type: 'offset', r: 0, delta: 0, chamfer: false, children: [] };
  });
}

/**
 * @function registerCSGOperationHandlers
 * @description Registers `NodeHandler` functions for OpenSCAD CSG (Constructive Solid Geometry) operations
 * (e.g., `union`, `difference`, `intersection`, `hull`, `minkowski`).
 * Each handler creates a basic AST node for the corresponding CSG operation.
 *
 * @param {NodeHandlerRegistry} registry - The registry to which handlers will be registered.
 *
 * @limitations
 * - These handlers only create the basic CSG node. The processing of child modules/primitives
 *   within the CSG block is handled by other visitors.
 */
function registerCSGOperationHandlers(registry: NodeHandlerRegistry): void {
  registry.register('union', (_node: TSNode) => {
    return { type: 'union', children: [] };
  });

  registry.register('difference', (_node: TSNode) => {
    return { type: 'difference', children: [] };
  });

  registry.register('intersection', (_node: TSNode) => {
    return { type: 'intersection', children: [] };
  });

  registry.register('hull', (_node: TSNode) => {
    return { type: 'hull', children: [] };
  });

  registry.register('minkowski', (_node: TSNode) => {
    return { type: 'minkowski', children: [] };
  });
}

/**
 * @function registerModuleAndFunctionHandlers
 * @description Registers `NodeHandler` functions for OpenSCAD module and function definitions,
 * as well as the `children()` special function.
 * These handlers create basic AST nodes for the corresponding definitions.
 *
 * @param {NodeHandlerRegistry} registry - The registry to which handlers will be registered.
 *
 * @limitations
 * - The handlers for `module` and `function` create dummy `IdentifierNode` and `ExpressionNode`
 *   for name and expression respectively. Actual parsing of parameters and body content
 *   is performed by specialized visitors.
 */
function registerModuleAndFunctionHandlers(registry: NodeHandlerRegistry): void {
  registry.register('module', (_node: TSNode) => {
    const dummyName: IdentifierNode = {
      type: 'expression',
      expressionType: 'identifier',
      name: '',
      location: {
        start: { line: 0, column: 0, offset: 0 },
        end: { line: 0, column: 0, offset: 0 },
      },
    };
    return {
      type: 'module_definition',
      name: dummyName,
      parameters: [],
      body: [],
    };
  });

  registry.register('function', (_node: TSNode) => {
    // Create a minimal valid expression node
    const dummyExpression: ExpressionNode = {
      type: 'expression',
      expressionType: 'literal',
    };
    const dummyName: IdentifierNode = {
      type: 'expression',
      expressionType: 'identifier',
      name: '',
      location: {
        start: { line: 0, column: 0, offset: 0 },
        end: { line: 0, column: 0, offset: 0 },
      },
    };
    return {
      type: 'function_definition',
      name: dummyName,
      parameters: [],
      expression: dummyExpression,
    };
  });

  registry.register('children', (_node: TSNode) => {
    return { type: 'children', index: -1 };
  });
}
