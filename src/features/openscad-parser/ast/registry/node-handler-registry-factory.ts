import { DefaultNodeHandlerRegistry } from './default-node-handler-registry.js';
// NodeHandler is not used directly in this file
import type { NodeHandlerRegistry } from './node-handler-registry.js';
import { Node as TSNode } from 'web-tree-sitter';
import type { ExpressionNode, IdentifierNode } from '../ast-types.js';

/**
 * Factory for creating and configuring NodeHandlerRegistry instances.
 */
export class NodeHandlerRegistryFactory {
  /**
   * Creates a fully configured NodeHandlerRegistry with all handlers registered.
   * @returns A NodeHandlerRegistry with all handlers registered.
   */
  public static createRegistry(): NodeHandlerRegistry {
    const registry = new DefaultNodeHandlerRegistry();

    // Register primitive handlers
    this.registerPrimitiveHandlers(registry);

    // Register transformation handlers
    this.registerTransformationHandlers(registry);

    // Register CSG operation handlers
    this.registerCSGOperationHandlers(registry);

    // Register module and function handlers
    this.registerModuleAndFunctionHandlers(registry);

    return registry;
  }

  /**
   * Registers handlers for primitive shapes.
   * @param registry The registry to register handlers with.
   */
  private static registerPrimitiveHandlers(
    registry: NodeHandlerRegistry
  ): void {
    // 3D primitives
    registry.register('cube', (_node: TSNode) => {
      return { type: 'cube', size: 1, center: false };
    });

    registry.register('sphere', (_node: TSNode) => {
      return { type: 'sphere', r: 1 };
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
   * Registers handlers for transformations.
   * @param registry The registry to register handlers with.
   */
  private static registerTransformationHandlers(
    registry: NodeHandlerRegistry
  ): void {
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
   * Registers handlers for CSG operations.
   * @param registry The registry to register handlers with.
   */
  private static registerCSGOperationHandlers(
    registry: NodeHandlerRegistry
  ): void {
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
   * Registers handlers for modules and functions.
   * @param registry The registry to register handlers with.
   */
  private static registerModuleAndFunctionHandlers(
    registry: NodeHandlerRegistry
  ): void {
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
}
