[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: SourceLocation

Defined in: [openscad-parser/ast/ast-types.ts:90](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L90)

Represents a source code location range with start and end positions.

This interface provides precise location information for AST nodes, enabling
features like error reporting, syntax highlighting, and editor integration.
The location includes both start and end positions, and optionally the
original source text for the node.

## Examples

```typescript
const location: SourceLocation = {
  start: { line: 1, column: 0, offset: 0 },
  end: { line: 1, column: 8, offset: 8 },
  text: 'cube(10)'
};
```

```typescript
const multiLineLocation: SourceLocation = {
  start: { line: 1, column: 0, offset: 0 },
  end: { line: 3, column: 1, offset: 25 },
  text: 'difference() {\n  cube(10);\n}'
};
```

## Since

0.1.0

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="start"></a> `start` | [`Position`](Position.md) | The starting position of the node in the source code. Includes line number (0-based), column number (0-based), and byte offset. | [openscad-parser/ast/ast-types.ts:95](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L95) |
| <a id="end"></a> `end` | [`Position`](Position.md) | The ending position of the node in the source code. Includes line number (0-based), column number (0-based), and byte offset. The end position is exclusive (points to the character after the last character of the node). | [openscad-parser/ast/ast-types.ts:102](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L102) |
| <a id="text"></a> `text?` | `string` | The original source code text that this location represents. This is optional but useful for debugging and error reporting. **Example** `// For a cube(10) node, text would be "cube(10)" const location: SourceLocation = { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 8, offset: 8 }, text: "cube(10)" };` | [openscad-parser/ast/ast-types.ts:118](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L118) |
