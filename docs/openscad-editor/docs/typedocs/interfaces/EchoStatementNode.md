[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: EchoStatementNode

Defined in: [openscad-parser/ast/ast-types.ts:691](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L691)

Represents an echo statement for debugging and output

Echo statements provide a way to output values and messages to the console
during OpenSCAD execution. They are commonly used for debugging and
displaying intermediate values during script execution.

## Examples

```openscad
echo("Hello World");
```

```openscad
echo("Value:", x, "Result:", x + y);
```

```openscad
echo(value);
```

## Since

0.1.0

## Extends

- [`BaseNode`](BaseNode.md)

## Properties

| Property | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="location"></a> `location?` | [`SourceLocation`](SourceLocation.md) | The source location of the node | - | [`BaseNode`](BaseNode.md).[`location`](BaseNode.md#location) | [openscad-parser/ast/ast-types.ts:58](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L58) |
| <a id="type"></a> `type` | `"echo"` | The type of the node | [`BaseNode`](BaseNode.md).[`type`](BaseNode.md#type) | - | [openscad-parser/ast/ast-types.ts:692](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L692) |
| <a id="arguments"></a> `arguments` | [`ExpressionNode`](ExpressionNode.md)[] | The arguments/expressions to output | - | - | [openscad-parser/ast/ast-types.ts:694](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L694) |
