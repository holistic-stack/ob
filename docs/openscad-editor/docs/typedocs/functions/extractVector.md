[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Function: extractVector()

```ts
function extractVector(node: Node): 
  | undefined
  | Vector3D
  | Vector2D;
```

Defined in: [openscad-parser/ast/utils/vector-utils.ts:101](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/utils/vector-utils.ts#L101)

Extracts a vector (2D or 3D) from various Tree-sitter node types.

This is the main entry point for vector extraction, handling multiple node types
and extraction strategies. It automatically detects the appropriate extraction
method based on the node type and structure.

The function supports several extraction strategies:
- Direct array literal processing for nodes like `[1, 2, 3]`
- Descendant search for array literals within expression nodes
- Text-based parsing as a fallback mechanism
- Automatic type detection for 2D vs 3D vectors

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node` | `Node` | The Tree-sitter node to extract vector data from |

## Returns

  \| `undefined`
  \| [`Vector3D`](../type-aliases/Vector3D.md)
  \| [`Vector2D`](../type-aliases/Vector2D.md)

A typed Vector2D or Vector3D object, or undefined if extraction fails

## Examples

```typescript
// For OpenSCAD code: [10, 20, 30]
const vector = extractVector(arrayLiteralNode);
// Returns: [10, 20, 30] as Vector3D
```

```typescript
// For complex expressions containing vectors
const vector = extractVector(expressionNode);
// Automatically finds and extracts the array literal within
```

```typescript
const vector = extractVector(node);
if (!vector) {
  console.warn('Failed to extract vector from node');
  return defaultVector;
}
```

## Since

0.1.0
