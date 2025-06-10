[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Function: findDescendantOfType()

```ts
function findDescendantOfType(node: Node, type: string): null | Node;
```

Defined in: [openscad-parser/ast/utils/node-utils.ts:87](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/utils/node-utils.ts#L87)

Finds the first descendant node of a specific type using depth-first search.

This function recursively searches through the node tree to find the first node
that matches the specified type. It performs a depth-first traversal, checking
the current node first, then recursively searching through all children.

This is useful for finding specific syntax elements within a larger structure,
such as finding an array literal within an expression or locating a specific
identifier within a complex statement.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node` | `Node` | The Tree-sitter node to search within |
| `type` | `string` | The node type to search for (e.g., 'array_literal', 'identifier') |

## Returns

`null` \| `Node`

The first descendant node of the specified type, or null if not found

## Examples

```typescript
// For OpenSCAD code: cube([10, 20, 30])
const arrayNode = findDescendantOfType(cubeNode, 'array_literal');
// Returns the node representing [10, 20, 30]
```

```typescript
// For OpenSCAD code: translate([x, y, z])
const identifierNode = findDescendantOfType(translateNode, 'identifier');
// Returns the first identifier node (likely 'x')
```

```typescript
// Check if a module contains any function calls
const functionCall = findDescendantOfType(moduleNode, 'function_call');
if (functionCall) {
  console.log('Module contains function calls');
}
```

## Since

0.1.0
