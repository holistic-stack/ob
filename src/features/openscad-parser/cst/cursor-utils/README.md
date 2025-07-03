# Cursor Utilities

This module provides utility functions for working with Tree-sitter cursors in a type-safe and convenient way.

## API Reference

### Types

- `SourcePosition`: Represents a position (line and column) in the source code.
- `SourceRange`: Represents a range between two positions in the source code.

### Functions

#### `isNodeType(cursor: TreeCursor, type: string): boolean`

Checks if the cursor's current node is of the specified type.

#### `getNodeRange(cursor: TreeCursor): SourceRange`

Gets the source range of the current node.

#### `getNodeText(cursor: TreeCursor, source: string): string`

Gets the text content of the current node from the source code.

#### `findFirstChildOfType(cursor: TreeCursor, type: string): boolean`

Finds the first child node of the specified type.

#### `getChildren(cursor: TreeCursor): SyntaxNode[]`

Gets all direct children of the current node.

## Usage Example

```typescript
import { Parser } from 'web-tree-sitter';
import * as cursorUtils from './cursor-utils';

// Initialize parser and parse code
const parser = new Parser();
const tree = parser.parse('cube(10);');
const cursor = tree.walk();

// Use cursor utilities
if (cursorUtils.isNodeType(cursor, 'call_expression')) {
  const range = cursorUtils.getNodeRange(cursor);
  const text = cursorUtils.getNodeText(cursor, 'cube(10);');
  console.log(
    `Found call expression at ${range.start.row}:${range.start.column}: ${text}`
  );
}
```

## Testing

Run tests with:

```bash
pnpm test
```

## Dependencies

- `web-tree-sitter`: For TreeCursor and SyntaxNode types
