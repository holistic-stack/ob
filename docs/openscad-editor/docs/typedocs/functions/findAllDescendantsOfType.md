[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Function: findAllDescendantsOfType()

```ts
function findAllDescendantsOfType(node: Node, type: string): Node[];
```

Defined in: [openscad-parser/ast/utils/node-utils.ts:148](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/utils/node-utils.ts#L148)

Finds all descendant nodes of a specific type using depth-first search.

This function recursively searches through the entire node tree and collects
all nodes that match the specified type. Unlike findDescendantOfType which
returns only the first match, this function returns all matching nodes in
the order they are encountered during depth-first traversal.

This is particularly useful for collecting all instances of a particular
syntax element, such as all variable references, all function calls, or
all numeric literals within a complex expression or module.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node` | `Node` | The Tree-sitter node to search within |
| `type` | `string` | The node type to search for (e.g., 'number', 'identifier') |

## Returns

`Node`[]

An array of all descendant nodes of the specified type (may be empty)

## Examples

```typescript
// For OpenSCAD code: cube([10, 20, 30])
const numbers = findAllDescendantsOfType(cubeNode, 'number');
// Returns array of nodes representing: 10, 20, 30
```

```typescript
// For OpenSCAD code: translate([x, y, z]) cube(size)
const identifiers = findAllDescendantsOfType(moduleNode, 'identifier');
// Returns array of nodes for: x, y, z, size
```

```typescript
// Count how many function calls are in a module
const functionCalls = findAllDescendantsOfType(moduleNode, 'function_call');
console.log(`Found ${functionCalls.length} function calls`);
```

## Since

0.1.0
