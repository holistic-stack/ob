[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: RangeValue

Defined in: [openscad-parser/ast/ast-types.ts:241](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L241)

Represents a range value

## Extends

- [`Value`](Value.md)

## Properties

| Property | Type | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="value"></a> `value` | `string` \| `number` \| `boolean` \| [`Value`](Value.md)[] | - | [`Value`](Value.md).[`value`](Value.md#value) | [openscad-parser/ast/ast-types.ts:224](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L224) |
| <a id="type"></a> `type` | `"range"` | [`Value`](Value.md).[`type`](Value.md#type) | - | [openscad-parser/ast/ast-types.ts:242](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L242) |
| <a id="start"></a> `start?` | `string` | [`Value`](Value.md).[`start`](Value.md#start) | - | [openscad-parser/ast/ast-types.ts:243](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L243) |
| <a id="end"></a> `end?` | `string` | [`Value`](Value.md).[`end`](Value.md#end) | - | [openscad-parser/ast/ast-types.ts:244](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L244) |
| <a id="step"></a> `step?` | `string` | [`Value`](Value.md).[`step`](Value.md#step) | - | [openscad-parser/ast/ast-types.ts:245](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L245) |
