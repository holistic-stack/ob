[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: FunctionDefinitionNode

Defined in: [openscad-parser/ast/ast-types.ts:833](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L833)

Represents a function definition

## Extends

- [`BaseNode`](BaseNode.md)

## Properties

| Property | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="location"></a> `location?` | [`SourceLocation`](SourceLocation.md) | The source location of the node | - | [`BaseNode`](BaseNode.md).[`location`](BaseNode.md#location) | [openscad-parser/ast/ast-types.ts:58](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L58) |
| <a id="type"></a> `type` | `"function_definition"` | The type of the node | [`BaseNode`](BaseNode.md).[`type`](BaseNode.md#type) | - | [openscad-parser/ast/ast-types.ts:834](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L834) |
| <a id="name"></a> `name` | [`IdentifierNode`](IdentifierNode.md) | - | - | - | [openscad-parser/ast/ast-types.ts:835](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L835) |
| <a id="parameters"></a> `parameters` | [`ModuleParameter`](ModuleParameter.md)[] | - | - | - | [openscad-parser/ast/ast-types.ts:836](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L836) |
| <a id="expression"></a> `expression` | [`ExpressionNode`](ExpressionNode.md) | - | - | - | [openscad-parser/ast/ast-types.ts:837](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L837) |
