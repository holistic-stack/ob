[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: CylinderNode

Defined in: [openscad-parser/ast/ast-types.ts:462](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L462)

Represents a cylinder primitive

## Extends

- [`BaseNode`](BaseNode.md)

## Properties

| Property | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="location"></a> `location?` | [`SourceLocation`](SourceLocation.md) | The source location of the node | - | [`BaseNode`](BaseNode.md).[`location`](BaseNode.md#location) | [openscad-parser/ast/ast-types.ts:58](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L58) |
| <a id="type"></a> `type` | `"cylinder"` | The type of the node | [`BaseNode`](BaseNode.md).[`type`](BaseNode.md#type) | - | [openscad-parser/ast/ast-types.ts:463](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L463) |
| <a id="h"></a> `h` | `number` | - | - | - | [openscad-parser/ast/ast-types.ts:464](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L464) |
| <a id="r1"></a> `r1?` | `number` | - | - | - | [openscad-parser/ast/ast-types.ts:465](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L465) |
| <a id="r2"></a> `r2?` | `number` | - | - | - | [openscad-parser/ast/ast-types.ts:466](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L466) |
| <a id="r"></a> `r?` | `number` | - | - | - | [openscad-parser/ast/ast-types.ts:467](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L467) |
| <a id="d1"></a> `d1?` | `number` | - | - | - | [openscad-parser/ast/ast-types.ts:468](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L468) |
| <a id="d2"></a> `d2?` | `number` | - | - | - | [openscad-parser/ast/ast-types.ts:469](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L469) |
| <a id="d"></a> `d?` | `number` | - | - | - | [openscad-parser/ast/ast-types.ts:470](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L470) |
| <a id="center"></a> `center?` | `boolean` | - | - | - | [openscad-parser/ast/ast-types.ts:471](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L471) |
| <a id="fn"></a> `$fn?` | `number` | - | - | - | [openscad-parser/ast/ast-types.ts:472](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L472) |
| <a id="fa"></a> `$fa?` | `number` | - | - | - | [openscad-parser/ast/ast-types.ts:473](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L473) |
| <a id="fs"></a> `$fs?` | `number` | - | - | - | [openscad-parser/ast/ast-types.ts:474](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L474) |
