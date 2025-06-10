[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: ForLoopVariable

Defined in: [openscad-parser/ast/ast-types.ts:597](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L597)

Represents a for loop variable with its range

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="variable"></a> `variable` | `string` | [openscad-parser/ast/ast-types.ts:598](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L598) |
| <a id="range"></a> `range` | [`ExpressionNode`](ExpressionNode.md) \| [`ErrorNode`](ErrorNode.md) | [openscad-parser/ast/ast-types.ts:599](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L599) |
| <a id="step"></a> `step?` | [`ExpressionNode`](ExpressionNode.md) \| [`ErrorNode`](ErrorNode.md) | [openscad-parser/ast/ast-types.ts:600](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L600) |
