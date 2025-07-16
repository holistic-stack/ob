# OpenSCAD Parser API Documentation

## Overview

The OpenSCAD Parser provides comprehensive parsing capabilities for OpenSCAD code, converting it into Abstract Syntax Trees (AST) that can be processed by the BabylonJS renderer. The parser supports the core OpenSCAD language features including primitives, transformations, and boolean operations.

## Core Classes

### `OpenscadParser`

The main parser class that handles OpenSCAD code parsing and AST generation.

#### Constructor

```typescript
constructor()
```

Creates a new OpenSCAD parser instance. Must be initialized before use.

#### Methods

##### `init(): Promise<void>`

Initializes the parser with the Tree-sitter grammar and prepares it for parsing operations.

**Example:**
```typescript
const parser = new OpenscadParser();
await parser.init();
```

**Throws:**
- `Error` if initialization fails

---

##### `parseASTWithResult(code: string): Result<ASTNode[], ParseError>`

Parses OpenSCAD code and returns an AST with comprehensive error handling.

**Parameters:**
- `code: string` - The OpenSCAD code to parse

**Returns:**
- `Result<ASTNode[], ParseError>` - Success with AST nodes or failure with error details

**Example:**
```typescript
const result = parser.parseASTWithResult(`
  cube([2, 3, 4]);
  translate([5, 0, 0]) sphere(r=1.5);
`);

if (result.success) {
  console.log('Parsed nodes:', result.data);
} else {
  console.error('Parse error:', result.error.message);
}
```

**Error Codes:**
- `PARSE_FAILED` - Syntax error in OpenSCAD code
- `INVALID_INPUT` - Empty or invalid input
- `GRAMMAR_ERROR` - Tree-sitter grammar issue

---

##### `parse(code: string): Tree`

Low-level parsing method that returns a Tree-sitter Tree object.

**Parameters:**
- `code: string` - The OpenSCAD code to parse

**Returns:**
- `Tree` - Tree-sitter parse tree

**Example:**
```typescript
const tree = parser.parse('cube([1, 1, 1]);');
console.log('Parse tree:', tree.rootNode);
```

---

##### `dispose(): void`

Cleans up parser resources and disposes of the Tree-sitter parser.

**Example:**
```typescript
parser.dispose();
```

## AST Node Types

### `ASTNode`

Base interface for all AST nodes.

```typescript
interface ASTNode {
  readonly type: string;
  readonly startPosition: Position;
  readonly endPosition: Position;
  readonly children?: readonly ASTNode[];
  readonly metadata?: Record<string, unknown>;
}
```

### `PrimitiveNode`

Represents OpenSCAD primitive objects (cube, sphere, cylinder).

```typescript
interface PrimitiveNode extends ASTNode {
  readonly type: 'primitive';
  readonly primitive: 'cube' | 'sphere' | 'cylinder';
  readonly parameters: PrimitiveParameters;
}
```

**Example:**
```typescript
// cube([2, 3, 4], center=true);
{
  type: 'primitive',
  primitive: 'cube',
  parameters: {
    size: [2, 3, 4],
    center: true
  }
}
```

### `TransformNode`

Represents transformation operations (translate, rotate, scale).

```typescript
interface TransformNode extends ASTNode {
  readonly type: 'transform';
  readonly transform: 'translate' | 'rotate' | 'scale';
  readonly parameters: number[];
  readonly children: readonly ASTNode[];
}
```

**Example:**
```typescript
// translate([1, 2, 3]) cube([1, 1, 1]);
{
  type: 'transform',
  transform: 'translate',
  parameters: [1, 2, 3],
  children: [/* cube node */]
}
```

### `BooleanNode`

Represents boolean operations (union, difference, intersection).

```typescript
interface BooleanNode extends ASTNode {
  readonly type: 'boolean';
  readonly operation: 'union' | 'difference' | 'intersection';
  readonly children: readonly ASTNode[];
}
```

**Example:**
```typescript
// difference() { cube([2, 2, 2]); sphere(r=1); }
{
  type: 'boolean',
  operation: 'difference',
  children: [/* cube node, sphere node */]
}
```

## Parameter Types

### `CubeParameters`

Parameters for cube primitives.

```typescript
interface CubeParameters {
  readonly size: number | readonly [number, number, number];
  readonly center?: boolean;
}
```

### `SphereParameters`

Parameters for sphere primitives.

```typescript
interface SphereParameters {
  readonly r?: number;
  readonly d?: number;
  readonly $fn?: number;
  readonly $fa?: number;
  readonly $fs?: number;
}
```

### `CylinderParameters`

Parameters for cylinder primitives.

```typescript
interface CylinderParameters {
  readonly h: number;
  readonly r?: number;
  readonly r1?: number;
  readonly r2?: number;
  readonly d?: number;
  readonly d1?: number;
  readonly d2?: number;
  readonly center?: boolean;
  readonly $fn?: number;
  readonly $fa?: number;
  readonly $fs?: number;
}
```

## Error Handling

### `ParseError`

Error information for parsing failures.

```typescript
interface ParseError {
  readonly code: 'PARSE_FAILED' | 'INVALID_INPUT' | 'GRAMMAR_ERROR';
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
  readonly timestamp: Date;
}
```

## Usage Patterns

### Basic Parsing

```typescript
import { OpenscadParser } from './openscad-parser';

async function parseOpenSCAD(code: string) {
  const parser = new OpenscadParser();
  await parser.init();
  
  try {
    const result = parser.parseASTWithResult(code);
    
    if (result.success) {
      return result.data;
    } else {
      console.error('Parse failed:', result.error.message);
      return null;
    }
  } finally {
    parser.dispose();
  }
}
```

### Error Recovery

```typescript
function parseWithRecovery(code: string) {
  const result = parser.parseASTWithResult(code);
  
  if (!result.success) {
    switch (result.error.code) {
      case 'PARSE_FAILED':
        console.log('Syntax error at line', result.error.line);
        break;
      case 'INVALID_INPUT':
        console.log('Invalid or empty input');
        break;
      case 'GRAMMAR_ERROR':
        console.log('Parser grammar issue');
        break;
    }
    return [];
  }
  
  return result.data;
}
```

### AST Processing

```typescript
function processAST(nodes: ASTNode[]) {
  for (const node of nodes) {
    switch (node.type) {
      case 'primitive':
        console.log(`Found ${node.primitive} with parameters:`, node.parameters);
        break;
      case 'transform':
        console.log(`Found ${node.transform} transformation:`, node.parameters);
        break;
      case 'boolean':
        console.log(`Found ${node.operation} with ${node.children.length} children`);
        break;
    }
  }
}
```

## Performance Considerations

- **Initialization**: Call `init()` once per parser instance
- **Memory**: Always call `dispose()` to prevent memory leaks
- **Parsing**: Large files may take longer; consider chunking for very large models
- **AST Size**: Complex nested operations produce larger ASTs

## Limitations

- **Module Definitions**: Custom modules are parsed but not executed
- **Function Definitions**: Custom functions are parsed but not evaluated
- **Include/Import**: External file references are not resolved
- **Variables**: Variable assignments are parsed but not evaluated in expressions

## Migration Notes

When migrating from previous parser versions:

1. Replace `parse()` calls with `parseASTWithResult()` for better error handling
2. Update error handling to use Result types instead of try/catch
3. Use the new AST node interfaces for type safety
4. Initialize parser with `await init()` before use
