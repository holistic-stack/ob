[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: AssertStatementNode

Defined in: [openscad-parser/ast/ast-types.ts:658](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L658)

Represents an assert statement in OpenSCAD

Assert statements validate conditions during compilation and halt execution
if the condition is false. They are essential for input validation and
ensuring code correctness.

## Examples

```openscad
assert(true);
```

```openscad
assert(x > 0);
```

```openscad
assert(x > 0, "x must be positive");
```

```openscad
assert(len(points) >= 3, "Need at least 3 points for polygon");
```

## Since

0.1.0

## Extends

- [`BaseNode`](BaseNode.md)

## Properties

| Property | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="location"></a> `location?` | [`SourceLocation`](SourceLocation.md) | The source location of the node | - | [`BaseNode`](BaseNode.md).[`location`](BaseNode.md#location) | [openscad-parser/ast/ast-types.ts:58](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L58) |
| <a id="type"></a> `type` | `"assert"` | The type of the node | [`BaseNode`](BaseNode.md).[`type`](BaseNode.md#type) | - | [openscad-parser/ast/ast-types.ts:659](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L659) |
| <a id="condition"></a> `condition` | [`ExpressionNode`](ExpressionNode.md) | The condition expression to evaluate | - | - | [openscad-parser/ast/ast-types.ts:661](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L661) |
| <a id="message"></a> `message?` | [`ExpressionNode`](ExpressionNode.md) | Optional error message to display if assertion fails | - | - | [openscad-parser/ast/ast-types.ts:663](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L663) |
