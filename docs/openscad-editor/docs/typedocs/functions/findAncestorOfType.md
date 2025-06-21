[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Function: findAncestorOfType()

```ts
function findAncestorOfType(node: Node, type: string): null | Node;
```

Defined in: [openscad-parser/ast/utils/node-utils.ts:207](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/utils/node-utils.ts#L207)

Finds the first ancestor node of a specific type by traversing up the tree.

This function walks up the parent chain from the given node to find the first
ancestor that matches the specified type. It starts with the immediate parent
and continues upward until it finds a match or reaches the root of the tree.

This is useful for finding the containing context of a node, such as finding
the module definition that contains a particular statement, or finding the
function call that contains a specific parameter.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node` | `Node` | The Tree-sitter node to start the search from |
| `type` | `string` | The ancestor node type to search for (e.g., 'module_definition') |

## Returns

`null` \| `Node`

The first ancestor node of the specified type, or null if not found

## Examples

```typescript
// For a node inside: module myModule() { cube(10); }
const moduleNode = findAncestorOfType(cubeNode, 'module_definition');
// Returns the module_definition node for myModule
```

```typescript
// For a parameter inside: translate([10, 20, 30])
const callNode = findAncestorOfType(numberNode, 'function_call');
// Returns the function_call node for translate
```

```typescript
// Check if we're inside a conditional block
const ifNode = findAncestorOfType(currentNode, 'if_statement');
if (ifNode) {
  console.log('Processing node within conditional context');
}
```

## Since

0.1.0
