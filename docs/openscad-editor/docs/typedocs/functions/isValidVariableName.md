[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Function: isValidVariableName()

```ts
function isValidVariableName(name: string): boolean;
```

Defined in: [openscad-parser/ast/utils/variable-utils.ts:131](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/utils/variable-utils.ts#L131)

Check if a variable name is valid according to OpenSCAD rules

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The variable name to validate |

## Returns

`boolean`

True if the name is valid
