/**
 * @file test-utils.ts
 * @description Utility functions for creating test data in OpenSCAD parser tests.
 * Provides factory functions for creating properly typed AST nodes with valid SourceLocation objects.
 */

import type {
  ASTNode,
  ModuleDefinitionNode,
  ModuleInstantiationNode,
  ParameterValue,
  Position,
  SourceLocation,
} from '../ast/ast-types.js';

/**
 * @function createPosition
 * @description Creates a Position object with proper typing.
 *
 * @param {number} line - Zero-based line number
 * @param {number} column - Zero-based column number
 * @param {number} offset - Zero-based character offset
 * @returns {Position} Properly typed Position object
 */
export const createPosition = (line: number, column: number, offset: number): Position => ({
  line,
  column,
  offset,
});

/**
 * @function createSourceLocation
 * @description Creates a SourceLocation object with proper typing.
 *
 * @param {number} startLine - Starting line number
 * @param {number} startColumn - Starting column number
 * @param {number} startOffset - Starting character offset
 * @param {number} endLine - Ending line number
 * @param {number} endColumn - Ending column number
 * @param {number} endOffset - Ending character offset
 * @param {string} [text] - Optional source text
 * @returns {SourceLocation} Properly typed SourceLocation object
 */
export const createSourceLocation = (
  startLine: number,
  startColumn: number,
  startOffset: number,
  endLine: number,
  endColumn: number,
  endOffset: number,
  text?: string
): SourceLocation => ({
  start: createPosition(startLine, startColumn, startOffset),
  end: createPosition(endLine, endColumn, endOffset),
  ...(text && { text }),
});

/**
 * @function createTestModule
 * @description Creates a test ModuleDefinitionNode with proper typing and locations.
 *
 * @param {string} name - Module name
 * @param {ASTNode[]} [body] - Module body (defaults to a simple cube)
 * @returns {ModuleDefinitionNode} Properly typed module definition
 *
 * @example
 * ```typescript
 * const module = createTestModule('myModule');
 * const customModule = createTestModule('custom', [
 *   { type: 'sphere', radius: 10, location: createSourceLocation(2, 3, 20, 2, 13, 30) }
 * ]);
 * ```
 */
export const createTestModule = (name: string, body?: ASTNode[]): ModuleDefinitionNode => {
  const defaultBody: ASTNode[] = [
    {
      type: 'cube',
      size: 10,
      center: false,
      location: createSourceLocation(2, 3, 20, 2, 13, 30),
    },
  ];

  return {
    type: 'module_definition',
    name: {
      type: 'expression',
      expressionType: 'identifier',
      name,
      location: createSourceLocation(1, 8, 8, 1, 8 + name.length, 8 + name.length),
    },
    parameters: [],
    body: body || defaultBody,
    location: createSourceLocation(1, 1, 1, 3, 1, 40),
  };
};

/**
 * @function createTestModuleCall
 * @description Creates a test ModuleInstantiationNode with proper typing and locations.
 *
 * @param {string} name - Module name to call
 * @param {any[]} [args] - Module arguments (defaults to empty)
 * @returns {ModuleInstantiationNode} Properly typed module instantiation
 *
 * @example
 * ```typescript
 * const call = createTestModuleCall('myModule');
 * const callWithArgs = createTestModuleCall('myModule', [10, true]);
 * ```
 */
export const createTestModuleCall = (
  name: string,
  args: unknown[] = []
): ModuleInstantiationNode => ({
  type: 'module_instantiation',
  name,
  args: args.map((value, _index) => ({
    name: undefined,
    value: value as ParameterValue,
  })),
  location: createSourceLocation(5, 1, 50, 5, name.length + 3, 50 + name.length + 3),
});

/**
 * @function createTestSphere
 * @description Creates a test sphere node with proper typing and locations.
 *
 * @param {number} radius - Sphere radius
 * @returns {ASTNode} Properly typed sphere node
 */
export const createTestSphere = (radius: number): ASTNode => ({
  type: 'sphere',
  radius,
  location: createSourceLocation(1, 1, 1, 1, 10, 10),
});

/**
 * @function createTestCube
 * @description Creates a test cube node with proper typing and locations.
 *
 * @param {number} size - Cube size
 * @param {boolean} [center] - Whether cube is centered (defaults to false)
 * @returns {ASTNode} Properly typed cube node
 */
export const createTestCube = (size: number, center: boolean = false): ASTNode => ({
  type: 'cube',
  size,
  center,
  location: createSourceLocation(1, 1, 1, 1, 10, 10),
});

/**
 * @function createTestCylinder
 * @description Creates a test cylinder node with proper typing and locations.
 *
 * @param {number} height - Cylinder height
 * @param {number} radius - Cylinder radius
 * @param {boolean} [center] - Whether cylinder is centered (defaults to false)
 * @returns {ASTNode} Properly typed cylinder node
 */
export const createTestCylinder = (
  height: number,
  radius: number,
  center: boolean = false
): ASTNode => ({
  type: 'cylinder',
  h: height,
  r: radius,
  center,
  location: createSourceLocation(1, 1, 1, 1, 15, 15),
});

/**
 * @function createTestTranslate
 * @description Creates a test translate node with proper typing and locations.
 *
 * @param {number[]} vector - Translation vector [x, y, z]
 * @param {ASTNode[]} children - Child nodes to translate
 * @returns {ASTNode} Properly typed translate node
 */
export const createTestTranslate = (vector: number[], children: ASTNode[]): ASTNode => ({
  type: 'translate',
  v: vector,
  children,
  location: createSourceLocation(1, 1, 1, 1, 20, 20),
});

/**
 * @function createNestedTestModule
 * @description Creates a test module with nested module definitions for testing hierarchical scenarios.
 *
 * @param {string} outerName - Name of the outer module
 * @param {string} innerName - Name of the inner module
 * @param {ASTNode} innerBody - Body of the inner module
 * @returns {ModuleDefinitionNode} Module with nested module definition and call
 *
 * @example
 * ```typescript
 * const nested = createNestedTestModule('outer', 'inner', createTestSphere(5));
 * // Creates: module outer() { module inner() { sphere(5); } inner(); }
 * ```
 */
export const createNestedTestModule = (
  outerName: string,
  innerName: string,
  innerBody: ASTNode
): ModuleDefinitionNode => {
  const innerModule = createTestModule(innerName, [innerBody]);
  const innerCall = createTestModuleCall(innerName);

  return createTestModule(outerName, [innerModule, innerCall]);
};

/**
 * @function createComplexNestedModule
 * @description Creates a complex nested module structure for testing deep hierarchies.
 *
 * @param {number} depth - Nesting depth
 * @param {string} baseName - Base name for modules (will be suffixed with level number)
 * @param {ASTNode} leafNode - Node to place at the deepest level
 * @returns {ModuleDefinitionNode} Complex nested module structure
 *
 * @example
 * ```typescript
 * const complex = createComplexNestedModule(3, 'level', createTestCube(5));
 * // Creates: level1 -> level2 -> level3 -> cube(5)
 * ```
 */
export const createComplexNestedModule = (
  depth: number,
  baseName: string,
  leafNode: ASTNode
): ModuleDefinitionNode => {
  if (depth <= 1) {
    return createTestModule(`${baseName}1`, [leafNode]);
  }

  const innerModule = createComplexNestedModule(depth - 1, baseName, leafNode);
  const innerCall = createTestModuleCall(`${baseName}${depth - 1}`);

  return createTestModule(`${baseName}${depth}`, [innerModule, innerCall]);
};
