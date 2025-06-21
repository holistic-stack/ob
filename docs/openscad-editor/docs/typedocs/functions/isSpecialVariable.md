[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Function: isSpecialVariable()

```ts
function isSpecialVariable(node: Node): boolean;
```

Defined in: [openscad-parser/ast/utils/variable-utils.ts:107](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/utils/variable-utils.ts#L107)

Determines if a Tree-sitter node represents a special OpenSCAD variable.

Special variables in OpenSCAD are system variables that start with a dollar sign ($)
and control various aspects of rendering and behavior. This function identifies
nodes that contain such variables by checking the text content and validating
the variable name format.

Special variables include:
- Resolution control: `$fn`, `$fa`, `$fs`
- Animation: `$t`
- Viewport: `$vpr`, `$vpt`, `$vpd`
- Module system: `$children`
- User-defined special variables

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node` | `Node` | The Tree-sitter node to examine |

## Returns

`boolean`

True if the node represents a special variable, false otherwise

## Examples

```typescript
// For OpenSCAD code: cylinder($fn=20, r=5)
const isSpecial = isSpecialVariable(fnNode); // Returns: true

// For OpenSCAD code: cube(size)
const isNormal = isSpecialVariable(sizeNode); // Returns: false
```

```typescript
if (isSpecialVariable(parameterNode)) {
  // Handle special variable with system-specific logic
  return processSpecialVariable(parameterNode);
} else {
  // Handle regular user variable
  return processUserVariable(parameterNode);
}
```

## Since

0.1.0
