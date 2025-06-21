[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Function: extractVariableName()

```ts
function extractVariableName(node: Node): null | string;
```

Defined in: [openscad-parser/ast/utils/variable-utils.ts:117](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/utils/variable-utils.ts#L117)

Extract variable name from an identifier node

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `node` | `Node` | The identifier node |

## Returns

`null` \| `string`

The variable name or null if invalid
