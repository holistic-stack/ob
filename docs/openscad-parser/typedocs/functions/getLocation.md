[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Function: getLocation()

```ts
function getLocation(node: Node): SourceLocation;
```

Defined in: [openscad-parser/ast/utils/location-utils.ts:169](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/utils/location-utils.ts#L169)

Extracts complete source location information from a Tree-sitter node.

This function creates a comprehensive SourceLocation object that includes both
start and end positions for a Tree-sitter node. It handles the conversion from
Tree-sitter's native position format to the AST's structured location format,
including character offset calculation.

The function provides robust handling for different node types:
- Real Tree-sitter nodes with complete position information
- Mock nodes used in test environments (returns default location)
- Nodes with missing position data (graceful fallback)

Location information is essential for:
- Error reporting with precise source positions
- IDE features like go-to-definition and hover
- Syntax highlighting and code analysis
- Debugging and development tools

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node` | `Node` | The Tree-sitter node to extract location information from |

## Returns

[`SourceLocation`](../interfaces/SourceLocation.md)

Complete SourceLocation object with start and end positions

## Examples

```typescript
// Extract location from a function call node
const location = getLocation(cubeNode);
// Returns: {
//   start: { line: 5, column: 0, offset: 120 },
//   end: { line: 5, column: 10, offset: 130 }
// }
```

```typescript
const location = getLocation(errorNode);
const message = `Syntax error at line ${location.start.line + 1}, ` +
               `column ${location.start.column + 1}`;
console.error(message);
```

```typescript
// Create LSP-compatible range for IDE features
const location = getLocation(identifierNode);
const lspRange = {
  start: { line: location.start.line, character: location.start.column },
  end: { line: location.end.line, character: location.end.column }
};
```

```typescript
// Works with both real and mock nodes
const realLocation = getLocation(realTreeSitterNode);
const testLocation = getLocation(mockNodeForTesting);
// Both return valid SourceLocation objects
```

## Since

0.1.0
