[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Function: getFunctionName()

```ts
function getFunctionName(node: Node): null | string;
```

Defined in: [openscad-parser/ast/utils/node-utils.ts:274](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/utils/node-utils.ts#L274)

Extracts the function name from a module instantiation node.

This function specifically handles module instantiation nodes (function calls
in OpenSCAD) and extracts the name of the function being called. It uses
Tree-sitter's field-based access to get the 'name' field from the module
instantiation node structure.

Module instantiation nodes represent function calls like cube(), sphere(),
translate(), etc. This utility makes it easy to identify which function
is being called without manually parsing the node structure.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node` | `Node` | The Tree-sitter node representing a module instantiation |

## Returns

`null` \| `string`

The function name as a string, or null if not a module instantiation or name not found

## Examples

```typescript
// For OpenSCAD code: cube(10)
const functionName = getFunctionName(moduleInstantiationNode);
// Returns: "cube"

// For OpenSCAD code: translate([1, 2, 3])
const transformName = getFunctionName(translateNode);
// Returns: "translate"
```

```typescript
visitModuleInstantiation(node: TSNode): ASTNode | null {
  const functionName = getFunctionName(node);

  switch (functionName) {
    case 'cube':
      return this.processCube(node);
    case 'sphere':
      return this.processSphere(node);
    default:
      return this.processGenericFunction(node, functionName);
  }
}
```

```typescript
const functionName = getFunctionName(node);
if (!functionName) {
  console.warn('Could not extract function name from node');
  return null;
}
```

## Since

0.1.0
