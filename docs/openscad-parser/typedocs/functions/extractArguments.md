[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Function: extractArguments()

```ts
function extractArguments(
   argsNode: Node, 
   errorHandler?: ErrorHandler, 
   sourceCode?: string): Parameter[];
```

Defined in: [openscad-parser/ast/extractors/argument-extractor.ts:270](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/extractors/argument-extractor.ts#L270)

Extracts function arguments from Tree-sitter CST nodes and converts them to AST parameters.

This function is the main entry point for argument extraction, handling both simple
and complex argument patterns found in OpenSCAD function calls. It supports:
- Positional arguments: `cube(10, 20, 30)`
- Named arguments: `cube(size=[10, 20, 30], center=true)`
- Mixed arguments: `cube(10, center=true)`
- Complex expressions: `cube(x + 5, center=condition)`
- Vector arguments: `translate([x, y, z])`
- Range arguments: `for(i = [0:10:100])`

The function handles different CST node types that can contain arguments:
- `arguments`: Standard argument container
- `argument_list`: Alternative argument container format
- `argument`: Individual argument nodes
- `named_argument`: Explicitly named arguments

**Memory Management Workaround**: This function includes workarounds for Tree-sitter
memory management issues that can cause `node.text` to be truncated. When possible,
it uses the source code directly with node position information to extract correct text.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `argsNode` | `Node` | The CST node containing the arguments to extract |
| `errorHandler?` | [`ErrorHandler`](../classes/ErrorHandler.md) | Optional error handler for enhanced expression evaluation and error reporting |
| `sourceCode?` | `string` | Optional source code string for extracting correct text when node.text is truncated |

## Returns

[`Parameter`](../interfaces/Parameter.md)[]

Array of Parameter objects with optional names and typed values

## Examples

```typescript
// For OpenSCAD code: cube(10, 20, 30)
const args = extractArguments(argumentsNode);
// Returns: [
//   { value: 10 },
//   { value: 20 },
//   { value: 30 }
// ]
```

```typescript
// For OpenSCAD code: cylinder(h=20, r=5, center=true)
const args = extractArguments(argumentsNode);
// Returns: [
//   { name: 'h', value: 20 },
//   { name: 'r', value: 5 },
//   { name: 'center', value: true }
// ]
```

```typescript
// For OpenSCAD code: cube([10, 20, 30], center=true)
const args = extractArguments(argumentsNode);
// Returns: [
//   { value: [10, 20, 30] },
//   { name: 'center', value: true }
// ]
```

```typescript
const errorHandler = new SimpleErrorHandler();
const args = extractArguments(argumentsNode, errorHandler, sourceCode);

if (errorHandler.getErrors().length > 0) {
  console.log('Argument extraction errors:', errorHandler.getErrors());
}
```

## Since

0.1.0
