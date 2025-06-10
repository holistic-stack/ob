[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Function: printNodeStructure()

```ts
function printNodeStructure(
   node: Node, 
   depth: number, 
   maxDepth: number, 
   maxChildren: number): void;
```

Defined in: [openscad-parser/ast/utils/debug-utils.ts:135](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/utils/debug-utils.ts#L135)

Print the structure of a tree-sitter node for debugging purposes.

This function provides a hierarchical view of a Tree-sitter node and its children,
showing the node types, field names, and text content. It's invaluable for
understanding how the Tree-sitter grammar parses OpenSCAD code and for debugging
issues in the parsing process.

The output includes:
- Node type and truncated text content
- Named fields (if any) for the node
- Hierarchical display of child nodes with proper indentation
- Distinction between regular children and named children
- Configurable depth and child count limits to manage output size

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `node` | `Node` | `undefined` | The Tree-sitter node to inspect and print |
| `depth` | `number` | `0` | The current depth in the tree (used for indentation, starts at 0) |
| `maxDepth` | `number` | `3` | The maximum depth to traverse (prevents infinite recursion) |
| `maxChildren` | `number` | `5` | The maximum number of children to display at each level |

## Returns

`void`

## Examples

```typescript
// Print a node with default settings (depth 3, max 5 children)
printNodeStructure(rootNode);
```

```typescript
// Print with deeper traversal and more children
printNodeStructure(rootNode, 0, 5, 10);

// Print with shallow traversal for overview
printNodeStructure(rootNode, 0, 1, 3);
```

```typescript
// Find and debug a specific node type
const moduleNode = rootNode.descendantForType('module_instantiation');
if (moduleNode) {
  console.log('Module instantiation structure:');
  printNodeStructure(moduleNode, 0, 3, 5);
}
```

## Since

0.1.0
