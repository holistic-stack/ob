[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: Position

Defined in: [openscad-parser/ast/ast-types.ts:149](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L149)

Represents a specific position in the source code.

This interface defines a point location within source code using three
coordinate systems: line/column (for human readability) and byte offset
(for efficient string operations). All coordinates are zero-based.

## Examples

```typescript
const position: Position = {
  line: 0,     // First line (0-based)
  column: 5,   // Sixth character on the line (0-based)
  offset: 5    // Sixth character in the entire file (0-based)
};
```

```typescript
const startPosition: Position = {
  line: 0,
  column: 0,
  offset: 0
};
```

## Since

0.1.0

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="line"></a> `line` | `number` | The zero-based line number in the source code. Line numbers start at 0 for the first line of the file. This follows the Tree-sitter convention and is commonly used in programming tools and editors. **Example** `// For code on the first line: line = 0 // For code on the second line: line = 1 // etc.` | [openscad-parser/ast/ast-types.ts:164](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L164) |
| <a id="column"></a> `column` | `number` | The zero-based column number within the line. Column numbers start at 0 for the first character of each line. This represents the horizontal position within the line. **Example** `// For the first character on a line: column = 0 // For the second character on a line: column = 1 // etc.` | [openscad-parser/ast/ast-types.ts:179](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L179) |
| <a id="offset"></a> `offset` | `number` | The zero-based byte offset from the start of the source code. This represents the absolute position in the source code as a character count from the beginning of the file. Useful for efficient string operations and text manipulation. **Example** `// For the first character in the file: offset = 0 // For the second character in the file: offset = 1 // etc. const sourceCode = "cube(10);"; const position: Position = { line: 0, column: 4, offset: 4 // Points to the '(' character };` | [openscad-parser/ast/ast-types.ts:201](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/ast/ast-types.ts#L201) |
