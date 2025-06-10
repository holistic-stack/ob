[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Function: pointToPosition()

```ts
function pointToPosition(point: Point, offset: number): Position;
```

Defined in: [openscad-parser/ast/utils/location-utils.ts:97](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/utils/location-utils.ts#L97)

Converts a Tree-sitter Point object to an AST Position object.

This function bridges the gap between Tree-sitter's native Point format
and the AST's Position format. It preserves line and column information
while adding character offset support for precise positioning.

The conversion maintains zero-based indexing for both line and column
numbers, consistent with Tree-sitter's coordinate system. The offset
parameter allows for accurate character-based positioning within the
source text.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `point` | `Point` | `undefined` | The Tree-sitter Point object containing row and column |
| `offset` | `number` | `0` | Optional character offset from the beginning of the source (default: 0) |

## Returns

[`Position`](../interfaces/Position.md)

AST Position object with line, column, and offset information

## Examples

```typescript
// Convert Tree-sitter point to AST position
const position = pointToPosition(node.startPosition, 150);
// Returns: { line: 10, column: 5, offset: 150 }
```

```typescript
const errorPosition = pointToPosition(errorNode.startPosition, errorNode.startIndex);
console.log(`Error at line ${errorPosition.line + 1}, column ${errorPosition.column + 1}`);
```

```typescript
const startPos = pointToPosition(node.startPosition, node.startIndex);
const endPos = pointToPosition(node.endPosition, node.endIndex);
const range = { start: startPos, end: endPos };
```

## Since

0.1.0
