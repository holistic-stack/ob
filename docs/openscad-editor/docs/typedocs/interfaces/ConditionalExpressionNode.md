[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: ConditionalExpressionNode

Defined in: [openscad-parser/ast/ast-types.ts:945](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L945)

Represents a conditional expression (ternary operator: condition ? then : else)

## Extends

- [`ExpressionNode`](ExpressionNode.md)

## Properties

| Property | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="location"></a> `location?` | [`SourceLocation`](SourceLocation.md) | The source location of the node | - | [`ExpressionNode`](ExpressionNode.md).[`location`](ExpressionNode.md#location) | [openscad-parser/ast/ast-types.ts:58](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L58) |
| <a id="type"></a> `type` | `"expression"` | The type of the node | - | [`ExpressionNode`](ExpressionNode.md).[`type`](ExpressionNode.md#type) | [openscad-parser/ast/ast-types.ts:274](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L274) |
| <a id="value"></a> `value?` | `string` \| `number` \| `boolean` | - | - | [`ExpressionNode`](ExpressionNode.md).[`value`](ExpressionNode.md#value) | [openscad-parser/ast/ast-types.ts:293](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L293) |
| <a id="name"></a> `name?` | `string` | - | - | [`ExpressionNode`](ExpressionNode.md).[`name`](ExpressionNode.md#name) | [openscad-parser/ast/ast-types.ts:294](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L294) |
| <a id="operator"></a> `operator?` | `string` | - | - | [`ExpressionNode`](ExpressionNode.md).[`operator`](ExpressionNode.md#operator) | [openscad-parser/ast/ast-types.ts:295](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L295) |
| <a id="left"></a> `left?` | [`ExpressionNode`](ExpressionNode.md) | - | - | [`ExpressionNode`](ExpressionNode.md).[`left`](ExpressionNode.md#left) | [openscad-parser/ast/ast-types.ts:296](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L296) |
| <a id="right"></a> `right?` | [`ExpressionNode`](ExpressionNode.md) | - | - | [`ExpressionNode`](ExpressionNode.md).[`right`](ExpressionNode.md#right) | [openscad-parser/ast/ast-types.ts:297](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L297) |
| <a id="items"></a> `items?` | [`ExpressionNode`](ExpressionNode.md)[] | - | - | [`ExpressionNode`](ExpressionNode.md).[`items`](ExpressionNode.md#items) | [openscad-parser/ast/ast-types.ts:301](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L301) |
| <a id="operand"></a> `operand?` | [`ExpressionNode`](ExpressionNode.md) | - | - | [`ExpressionNode`](ExpressionNode.md).[`operand`](ExpressionNode.md#operand) | [openscad-parser/ast/ast-types.ts:302](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L302) |
| <a id="args"></a> `args?` | [`Parameter`](Parameter.md)[] | - | - | [`ExpressionNode`](ExpressionNode.md).[`args`](ExpressionNode.md#args) | [openscad-parser/ast/ast-types.ts:303](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L303) |
| <a id="expressiontype"></a> `expressionType` | `"conditional"` \| `"conditional_expression"` | - | [`ExpressionNode`](ExpressionNode.md).[`expressionType`](ExpressionNode.md#expressiontype) | - | [openscad-parser/ast/ast-types.ts:946](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L946) |
| <a id="condition"></a> `condition` | [`ExpressionNode`](ExpressionNode.md) | - | [`ExpressionNode`](ExpressionNode.md).[`condition`](ExpressionNode.md#condition) | - | [openscad-parser/ast/ast-types.ts:947](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L947) |
| <a id="thenbranch"></a> `thenBranch` | [`ExpressionNode`](ExpressionNode.md) | - | [`ExpressionNode`](ExpressionNode.md).[`thenBranch`](ExpressionNode.md#thenbranch) | - | [openscad-parser/ast/ast-types.ts:948](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L948) |
| <a id="elsebranch"></a> `elseBranch` | [`ExpressionNode`](ExpressionNode.md) | - | [`ExpressionNode`](ExpressionNode.md).[`elseBranch`](ExpressionNode.md#elsebranch) | - | [openscad-parser/ast/ast-types.ts:949](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L949) |
