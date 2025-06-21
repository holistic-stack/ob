# Utilities

This document provides comprehensive documentation for utility functions and type guards in the OpenSCAD Parser library.

## Overview

The OpenSCAD Parser library includes various utility functions and type guards that help with AST manipulation, type checking, and common operations. These utilities follow functional programming principles and provide type-safe operations.

## Type Guards

Type guards provide runtime type checking for AST nodes, enabling safe type narrowing in TypeScript.

### Node Type Guards

#### `isCubeNode(node: ASTNode): node is CubeNode`

Checks if a node is a cube primitive.

**Parameters:**
- `node`: The AST node to check

**Returns:** `true` if the node is a CubeNode, `false` otherwise

**Example:**
```typescript
import { isCubeNode } from '@holistic-stack/openscad-parser';

function processCube(node: ASTNode) {
  if (isCubeNode(node)) {
    // TypeScript now knows node is CubeNode
    console.log(`Cube size: ${node.size}`);
    console.log(`Centered: ${node.center}`);
  }
}
```

#### `isSphereNode(node: ASTNode): node is SphereNode`

Checks if a node is a sphere primitive.

**Example:**
```typescript
if (isSphereNode(node)) {
  console.log(`Sphere radius: ${node.radius}`);
  if (node.fn) {
    console.log(`Resolution: ${node.fn} facets`);
  }
}
```

#### `isCylinderNode(node: ASTNode): node is CylinderNode`

Checks if a node is a cylinder primitive.

#### `isTransformNode(node: ASTNode): node is TransformNode`

Checks if a node is any type of transformation (translate, rotate, scale, mirror).

**Example:**
```typescript
function processTransforms(nodes: ASTNode[]) {
  const transforms = nodes.filter(isTransformNode);
  
  transforms.forEach(transform => {
    console.log(`Transform type: ${transform.type}`);
    console.log(`Children count: ${transform.children.length}`);
  });
}
```

#### `isCSGNode(node: ASTNode): node is CSGNode`

Checks if a node is a CSG operation (union, difference, intersection).

#### `isPrimitiveNode(node: ASTNode): node is PrimitiveNode`

Checks if a node is any primitive shape (cube, sphere, cylinder, etc.).

### Expression Type Guards

#### `isVariableNode(node: ASTNode): node is VariableNode`

Checks if a node is a variable reference.

#### `isLiteralNode(node: ASTNode): node is LiteralNode`

Checks if a node is a literal value.

#### `isBinaryExpressionNode(node: ASTNode): node is BinaryExpressionNode`

Checks if a node is a binary expression.

## AST Traversal Utilities

### `walkAST(nodes: ASTNode[], visitor: (node: ASTNode) => void): void`

Recursively walks through an AST and calls the visitor function for each node.

**Parameters:**
- `nodes`: Array of AST nodes to traverse
- `visitor`: Function called for each node

**Example:**
```typescript
import { walkAST } from '@holistic-stack/openscad-parser';

const ast = parser.parseAST(`
  translate([10, 0, 0]) {
    cube(5);
    sphere(3);
  }
`);

walkAST(ast, (node) => {
  console.log(`Node type: ${node.type}`);
  
  if (node.sourceLocation) {
    console.log(`Location: line ${node.sourceLocation.start.line}`);
  }
});
```

### `findNodes<T extends ASTNode>(nodes: ASTNode[], predicate: (node: ASTNode) => node is T): T[]`

Finds all nodes matching a predicate function.

**Parameters:**
- `nodes`: Array of AST nodes to search
- `predicate`: Type guard function to match nodes

**Returns:** Array of matching nodes

**Example:**
```typescript
import { findNodes, isCubeNode } from '@holistic-stack/openscad-parser';

const ast = parser.parseAST(`
  union() {
    cube(10);
    translate([20, 0, 0]) cube(5);
    sphere(8);
  }
`);

const cubes = findNodes(ast, isCubeNode);
console.log(`Found ${cubes.length} cubes`);

cubes.forEach(cube => {
  console.log(`Cube size: ${cube.size}`);
});
```

### `filterNodesByType(nodes: ASTNode[], type: string): ASTNode[]`

Filters nodes by their type string.

**Parameters:**
- `nodes`: Array of AST nodes to filter
- `type`: Node type to match

**Returns:** Array of matching nodes

**Example:**
```typescript
const primitives = filterNodesByType(ast, 'cube');
const transforms = filterNodesByType(ast, 'translate');
```

## Value Extraction Utilities

### `extractVector(value: any): number[] | null`

Extracts a numeric vector from various input formats.

**Parameters:**
- `value`: Input value (number, array, or parsed value object)

**Returns:** Numeric array or null if extraction fails

**Example:**
```typescript
import { extractVector } from '@holistic-stack/openscad-parser';

const vector1 = extractVector([1, 2, 3]); // [1, 2, 3]
const vector2 = extractVector(5); // [5, 5, 5] (expanded to 3D)
const vector3 = extractVector({ type: 'vector', value: [10, 20] }); // [10, 20, 0]
```

### `extractNumber(value: any): number | null`

Extracts a numeric value from various input formats.

**Example:**
```typescript
const num1 = extractNumber(42); // 42
const num2 = extractNumber("3.14"); // 3.14
const num3 = extractNumber({ type: 'number', value: '2.5' }); // 2.5
```

### `extractBoolean(value: any): boolean`

Extracts a boolean value with sensible defaults.

**Example:**
```typescript
const bool1 = extractBoolean(true); // true
const bool2 = extractBoolean("true"); // true
const bool3 = extractBoolean(1); // true
const bool4 = extractBoolean(0); // false
```

## AST Manipulation Utilities

### `cloneNode<T extends ASTNode>(node: T): T`

Creates a deep copy of an AST node.

**Parameters:**
- `node`: The AST node to clone

**Returns:** Deep copy of the node

**Example:**
```typescript
import { cloneNode } from '@holistic-stack/openscad-parser';

const originalCube: CubeNode = {
  type: 'cube',
  size: [10, 20, 30],
  center: false
};

const clonedCube = cloneNode(originalCube);
clonedCube.center = true; // Doesn't affect original
```

### `mergeNodes(nodes: ASTNode[]): ASTNode`

Merges multiple nodes into a union operation.

**Example:**
```typescript
const cube = { type: 'cube', size: 10, center: false };
const sphere = { type: 'sphere', radius: 5 };

const union = mergeNodes([cube, sphere]);
// Results in: { type: 'union', children: [cube, sphere] }
```

### `transformNode(node: ASTNode, transform: TransformNode): TransformNode`

Wraps a node with a transformation.

**Example:**
```typescript
const cube = { type: 'cube', size: 10, center: false };
const translation = {
  type: 'translate',
  vector: [5, 0, 0],
  children: []
};

const transformed = transformNode(cube, translation);
// Results in translate node with cube as child
```

## Validation Utilities

### `validateAST(nodes: ASTNode[]): ValidationResult`

Validates an AST for common issues.

**Returns:** Validation result with errors and warnings

**Example:**
```typescript
import { validateAST } from '@holistic-stack/openscad-parser';

const ast = parser.parseAST('cube([10, -5, 30]);'); // Negative dimension

const result = validateAST(ast);

if (result.errors.length > 0) {
  console.log('Validation errors:');
  result.errors.forEach(error => {
    console.log(`- ${error.message}`);
  });
}

if (result.warnings.length > 0) {
  console.log('Validation warnings:');
  result.warnings.forEach(warning => {
    console.log(`- ${warning.message}`);
  });
}
```

### `isValidNode(node: ASTNode): boolean`

Checks if a node has valid structure and properties.

**Example:**
```typescript
const isValid = isValidNode({
  type: 'cube',
  size: [10, 20, 30],
  center: false
}); // true

const isInvalid = isValidNode({
  type: 'cube',
  size: [-10, 20, 30], // Negative dimension
  center: false
}); // false
```

## Formatting Utilities

### `formatAST(nodes: ASTNode[], options?: FormatOptions): string`

Formats an AST back to OpenSCAD code.

**Parameters:**
- `nodes`: AST nodes to format
- `options`: Formatting options (indentation, spacing, etc.)

**Example:**
```typescript
import { formatAST } from '@holistic-stack/openscad-parser';

const ast = parser.parseAST('cube(10);sphere(5);');

const formatted = formatAST(ast, {
  indent: '  ',
  spacing: true
});

console.log(formatted);
// Output:
// cube(10);
// 
// sphere(5);
```

### `nodeToString(node: ASTNode): string`

Converts a single AST node to its string representation.

**Example:**
```typescript
const cube: CubeNode = {
  type: 'cube',
  size: [10, 20, 30],
  center: true
};

const str = nodeToString(cube);
console.log(str); // "cube([10, 20, 30], center=true)"
```

## Performance Utilities

### `measureParsingTime(parser: EnhancedOpenscadParser, code: string): { ast: ASTNode[], time: number }`

Measures the time taken to parse OpenSCAD code.

**Example:**
```typescript
import { measureParsingTime } from '@holistic-stack/openscad-parser';

const result = measureParsingTime(parser, 'cube(10);');
console.log(`Parsing took ${result.time}ms`);
console.log(`Generated ${result.ast.length} nodes`);
```

### `profileAST(nodes: ASTNode[]): ASTProfile`

Analyzes an AST and provides statistics.

**Example:**
```typescript
const profile = profileAST(ast);

console.log(`Total nodes: ${profile.totalNodes}`);
console.log(`Primitives: ${profile.primitiveCount}`);
console.log(`Transforms: ${profile.transformCount}`);
console.log(`Max depth: ${profile.maxDepth}`);
```

## Usage Examples

### Complete Type-Safe Processing

```typescript
import {
  EnhancedOpenscadParser,
  SimpleErrorHandler,
  isCubeNode,
  isSphereNode,
  isTransformNode,
  walkAST,
  findNodes,
  validateAST
} from '@holistic-stack/openscad-parser';

async function processOpenSCAD(code: string) {
  const errorHandler = new SimpleErrorHandler();
  const parser = new EnhancedOpenscadParser(errorHandler);
  
  try {
    await parser.init();
    
    // Parse the code
    const ast = parser.parseAST(code);
    
    // Validate the AST
    const validation = validateAST(ast);
    if (validation.errors.length > 0) {
      console.error('Validation errors:', validation.errors);
      return;
    }
    
    // Find all cubes
    const cubes = findNodes(ast, isCubeNode);
    console.log(`Found ${cubes.length} cubes`);
    
    // Process each cube
    cubes.forEach(cube => {
      console.log(`Cube: size=${cube.size}, center=${cube.center}`);
    });
    
    // Walk the entire AST
    walkAST(ast, (node) => {
      if (isTransformNode(node)) {
        console.log(`Transform: ${node.type} with ${node.children.length} children`);
      }
    });
    
  } finally {
    parser.dispose();
  }
}
```

### Custom Type Guard

```typescript
// Define custom node type
interface CustomModuleNode extends ASTNode {
  type: 'custom_module';
  name: string;
  parameters: any[];
}

// Create type guard
function isCustomModuleNode(node: ASTNode): node is CustomModuleNode {
  return node.type === 'custom_module';
}

// Use in processing
const customModules = findNodes(ast, isCustomModuleNode);
```
