[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: ErrorNode

Defined in: [openscad-parser/ast/ast-types.ts:961](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L961)

Represents a parsing error encountered during AST construction.
This node is used when a visitor cannot successfully convert a CST node
into a valid AST node due to structural issues, missing parts, or
unparsable sub-expressions.

## Since

0.2.0

## Extends

- [`BaseNode`](BaseNode.md)

## Properties

| Property | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="location"></a> `location?` | [`SourceLocation`](SourceLocation.md) | The source location of the node | - | [`BaseNode`](BaseNode.md).[`location`](BaseNode.md#location) | [openscad-parser/ast/ast-types.ts:58](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L58) |
| <a id="type"></a> `type` | `"error"` | The type of the node | [`BaseNode`](BaseNode.md).[`type`](BaseNode.md#type) | - | [openscad-parser/ast/ast-types.ts:962](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L962) |
| <a id="errorcode"></a> `errorCode` | `string` | - | - | - | [openscad-parser/ast/ast-types.ts:963](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L963) |
| <a id="message"></a> `message` | `string` | - | - | - | [openscad-parser/ast/ast-types.ts:964](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L964) |
| <a id="originalnodetype"></a> `originalNodeType?` | `string` | - | - | - | [openscad-parser/ast/ast-types.ts:965](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L965) |
| <a id="cstnodetext"></a> `cstNodeText?` | `string` | - | - | - | [openscad-parser/ast/ast-types.ts:966](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L966) |
| <a id="cause"></a> `cause?` | `ErrorNode` | - | - | - | [openscad-parser/ast/ast-types.ts:967](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L967) |
