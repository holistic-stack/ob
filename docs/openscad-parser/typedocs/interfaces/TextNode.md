[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: TextNode

Defined in: [openscad-parser/ast/ast-types.ts:521](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L521)

Represents a text node

## Extends

- [`BaseNode`](BaseNode.md)

## Properties

| Property | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="location"></a> `location?` | [`SourceLocation`](SourceLocation.md) | The source location of the node | - | [`BaseNode`](BaseNode.md).[`location`](BaseNode.md#location) | [openscad-parser/ast/ast-types.ts:58](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L58) |
| <a id="type"></a> `type` | `"text"` | The type of the node | [`BaseNode`](BaseNode.md).[`type`](BaseNode.md#type) | - | [openscad-parser/ast/ast-types.ts:522](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L522) |
| <a id="text"></a> `text` | `string` | - | - | - | [openscad-parser/ast/ast-types.ts:523](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L523) |
| <a id="size"></a> `size?` | `number` | - | - | - | [openscad-parser/ast/ast-types.ts:524](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L524) |
| <a id="font"></a> `font?` | `string` | - | - | - | [openscad-parser/ast/ast-types.ts:525](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L525) |
| <a id="halign"></a> `halign?` | `"left"` \| `"center"` \| `"right"` | - | - | - | [openscad-parser/ast/ast-types.ts:526](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L526) |
| <a id="valign"></a> `valign?` | `"center"` \| `"baseline"` \| `"bottom"` \| `"top"` | - | - | - | [openscad-parser/ast/ast-types.ts:527](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L527) |
| <a id="spacing"></a> `spacing?` | `number` | - | - | - | [openscad-parser/ast/ast-types.ts:528](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L528) |
| <a id="direction"></a> `direction?` | `"ltr"` \| `"rtl"` \| `"ttb"` \| `"btt"` | - | - | - | [openscad-parser/ast/ast-types.ts:529](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L529) |
| <a id="language"></a> `language?` | `string` | - | - | - | [openscad-parser/ast/ast-types.ts:530](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L530) |
| <a id="script"></a> `script?` | `string` | - | - | - | [openscad-parser/ast/ast-types.ts:531](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L531) |
| <a id="fn"></a> `$fn?` | `number` | - | - | - | [openscad-parser/ast/ast-types.ts:532](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L532) |
