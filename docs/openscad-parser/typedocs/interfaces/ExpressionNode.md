[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: ExpressionNode

Defined in: [openscad-parser/ast/ast-types.ts:273](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L273)

Base interface for expression nodes

## Extends

- [`BaseNode`](BaseNode.md)

## Extended by

- [`IdentifierExpressionNode`](IdentifierExpressionNode.md)
- [`LiteralNode`](LiteralNode.md)
- [`VariableNode`](VariableNode.md)
- [`ArrayExpressionNode`](ArrayExpressionNode.md)
- [`EachExpressionNode`](EachExpressionNode.md)
- [`LiteralExpressionNode`](LiteralExpressionNode.md)
- [`IdentifierNode`](IdentifierNode.md)
- [`VectorExpressionNode`](VectorExpressionNode.md)
- [`IndexExpressionNode`](IndexExpressionNode.md)
- [`AccessorExpressionNode`](AccessorExpressionNode.md)
- [`RangeExpressionNode`](RangeExpressionNode.md)
- [`LetExpressionNode`](LetExpressionNode.md)
- [`ListComprehensionExpressionNode`](ListComprehensionExpressionNode.md)
- [`BinaryExpressionNode`](BinaryExpressionNode.md)
- [`UnaryExpressionNode`](UnaryExpressionNode.md)
- [`ConditionalExpressionNode`](ConditionalExpressionNode.md)

## Properties

| Property | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="location"></a> `location?` | [`SourceLocation`](SourceLocation.md) | The source location of the node | - | [`BaseNode`](BaseNode.md).[`location`](BaseNode.md#location) | [openscad-parser/ast/ast-types.ts:58](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L58) |
| <a id="type"></a> `type` | `"expression"` | The type of the node | [`BaseNode`](BaseNode.md).[`type`](BaseNode.md#type) | - | [openscad-parser/ast/ast-types.ts:274](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L274) |
| <a id="expressiontype"></a> `expressionType` | `string` | - | - | - | [openscad-parser/ast/ast-types.ts:275](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L275) |
| <a id="value"></a> `value?` | `string` \| `number` \| `boolean` | - | - | - | [openscad-parser/ast/ast-types.ts:293](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L293) |
| <a id="name"></a> `name?` | `string` | - | - | - | [openscad-parser/ast/ast-types.ts:294](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L294) |
| <a id="operator"></a> `operator?` | `string` | - | - | - | [openscad-parser/ast/ast-types.ts:295](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L295) |
| <a id="left"></a> `left?` | `ExpressionNode` | - | - | - | [openscad-parser/ast/ast-types.ts:296](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L296) |
| <a id="right"></a> `right?` | `ExpressionNode` | - | - | - | [openscad-parser/ast/ast-types.ts:297](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L297) |
| <a id="condition"></a> `condition?` | `ExpressionNode` | - | - | - | [openscad-parser/ast/ast-types.ts:298](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L298) |
| <a id="thenbranch"></a> `thenBranch?` | `ExpressionNode` | - | - | - | [openscad-parser/ast/ast-types.ts:299](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L299) |
| <a id="elsebranch"></a> `elseBranch?` | `ExpressionNode` | - | - | - | [openscad-parser/ast/ast-types.ts:300](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L300) |
| <a id="items"></a> `items?` | `ExpressionNode`[] | - | - | - | [openscad-parser/ast/ast-types.ts:301](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L301) |
| <a id="operand"></a> `operand?` | `ExpressionNode` | - | - | - | [openscad-parser/ast/ast-types.ts:302](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L302) |
| <a id="args"></a> `args?` | [`Parameter`](Parameter.md)[] | - | - | - | [openscad-parser/ast/ast-types.ts:303](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L303) |
