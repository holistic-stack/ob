[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: SpecialVariableAssignment

Defined in: [openscad-parser/ast/ast-types.ts:773](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L773)

Represents a special variable assignment

## Extends

- [`BaseNode`](BaseNode.md)

## Properties

| Property | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="location"></a> `location?` | [`SourceLocation`](SourceLocation.md) | The source location of the node | - | [`BaseNode`](BaseNode.md).[`location`](BaseNode.md#location) | [openscad-parser/ast/ast-types.ts:58](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L58) |
| <a id="type"></a> `type` | `"specialVariableAssignment"` | The type of the node | [`BaseNode`](BaseNode.md).[`type`](BaseNode.md#type) | - | [openscad-parser/ast/ast-types.ts:774](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L774) |
| <a id="variable"></a> `variable` | [`SpecialVariable`](../type-aliases/SpecialVariable.md) | - | - | - | [openscad-parser/ast/ast-types.ts:775](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L775) |
| <a id="value"></a> `value` | `number` \| `boolean` \| [`Vector3D`](../type-aliases/Vector3D.md) | - | - | - | [openscad-parser/ast/ast-types.ts:776](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L776) |
