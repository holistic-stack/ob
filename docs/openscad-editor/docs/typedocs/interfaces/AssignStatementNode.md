[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: ~~AssignStatementNode~~

Defined in: [openscad-parser/ast/ast-types.ts:722](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L722)

Represents an assign statement for variable scoping (deprecated in OpenSCAD).

Assign statements in OpenSCAD are deprecated but still supported for legacy code.
They provide a way to assign variables within a specific scope and follow the
pattern: `assign(var1 = value1, var2 = value2, ...) { statements }`

## Examples

```openscad
assign(x = 5) cube(x);
```

```openscad
assign(x = 5, y = 10) cube([x, y, 1]);
```

```openscad
assign(r = 10) { sphere(r); translate([r*2, 0, 0]) sphere(r); }
```

## Since

1.0.0

## Deprecated

Assign statements are deprecated in OpenSCAD. Use regular variable assignments instead.

## Extends

- [`BaseNode`](BaseNode.md)

## Properties

| Property | Type | Description | Overrides | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="location"></a> ~~`location?`~~ | [`SourceLocation`](SourceLocation.md) | The source location of the node | - | [`BaseNode`](BaseNode.md).[`location`](BaseNode.md#location) | [openscad-parser/ast/ast-types.ts:58](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L58) |
| <a id="type"></a> ~~`type`~~ | `"assign"` | The type of the node | [`BaseNode`](BaseNode.md).[`type`](BaseNode.md#type) | - | [openscad-parser/ast/ast-types.ts:723](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L723) |
| <a id="assignments"></a> ~~`assignments`~~ | [`AssignmentNode`](AssignmentNode.md)[] | The variable assignments within the assign statement | - | - | [openscad-parser/ast/ast-types.ts:725](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L725) |
| <a id="body"></a> ~~`body`~~ | [`ASTNode`](../type-aliases/ASTNode.md) | The body statement or block to execute with the assigned variables | - | - | [openscad-parser/ast/ast-types.ts:727](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L727) |
