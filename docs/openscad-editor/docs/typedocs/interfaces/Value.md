[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: Value

Defined in: [openscad-parser/ast/ast-types.ts:222](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L222)

Represents a value type used in argument extraction

## Extended by

- [`VectorValue`](VectorValue.md)
- [`RangeValue`](RangeValue.md)

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="type"></a> `type` | `"string"` \| `"number"` \| `"boolean"` \| `"identifier"` \| `"vector"` \| `"range"` | [openscad-parser/ast/ast-types.ts:223](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L223) |
| <a id="value"></a> `value` | `string` \| `number` \| `boolean` \| `Value`[] | [openscad-parser/ast/ast-types.ts:224](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L224) |
| <a id="start"></a> `start?` | `string` | [openscad-parser/ast/ast-types.ts:225](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L225) |
| <a id="end"></a> `end?` | `string` | [openscad-parser/ast/ast-types.ts:226](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L226) |
| <a id="step"></a> `step?` | `string` | [openscad-parser/ast/ast-types.ts:227](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L227) |
