# Range Expression Visitor API

## Overview

The `RangeExpressionVisitor` is a specialized visitor that handles OpenSCAD range expressions like `[0:5]` and `[0:2:10]`. It implements a hybrid approach to solve Tree-sitter grammar precedence issues by detecting range patterns within `array_literal` nodes.

**✨ Integration Status**: **FULLY INTEGRATED** with ExpressionVisitor - Range expressions work seamlessly in all contexts including for loops, list comprehensions, and variable assignments.

## Class: RangeExpressionVisitor

### Constructor

```typescript
constructor(source: string, errorHandler: ErrorHandler)
```

**Parameters:**
- `source: string` - The source OpenSCAD code being parsed
- `errorHandler: ErrorHandler` - Error handler for logging and error management

### Methods

#### visit(node: TSNode): ast.ExpressionNode | null

Main entry point for visiting nodes. Handles both `range_expression` and `array_literal` nodes.

**Parameters:**
- `node: TSNode` - The Tree-sitter node to visit

**Returns:**
- `ast.RangeExpressionNode | null` - The generated AST node or null if not a range expression

**Example:**
```typescript
const visitor = new RangeExpressionVisitor(source, errorHandler);
const result = visitor.visit(arrayLiteralNode);
// Returns: { type: 'expression', expressionType: 'range_expression', start: ..., end: ..., step?: ... }
```

#### visitArrayLiteralAsRange(node: TSNode): ast.RangeExpressionNode | null

Detects and converts range patterns within `array_literal` nodes using regex-based pattern matching.

**Supported Patterns:**
- Simple ranges: `[0:5]`, `[-5:5]`, `[1.5:10.5]`
- Stepped ranges: `[0:2:10]`, `[1:0.5:5]`, `[10:-1:0]`
- Variable ranges: `[x:y]`, `[start:end]`
- Expression ranges: `[a+1:b*2]` (with warnings)

**Parameters:**
- `node: TSNode` - Array literal node to analyze

**Returns:**
- `ast.RangeExpressionNode | null` - Range expression AST node or null if not a range pattern

#### visitRangeExpression(node: TSNode): ast.RangeExpressionNode | null

Handles actual `range_expression` nodes from the Tree-sitter grammar.

**Parameters:**
- `node: TSNode` - Range expression node

**Returns:**
- `ast.RangeExpressionNode | null` - Range expression AST node

## Range Expression AST Node

The visitor generates `RangeExpressionNode` objects with the following structure:

```typescript
interface RangeExpressionNode extends ExpressionNode {
  type: 'expression';
  expressionType: 'range_expression';
  start: ExpressionNode;
  end: ExpressionNode;
  step?: ExpressionNode;
  location: SourceLocation;
}
```

## Usage Examples

### Basic Range Parsing

```typescript
import { OpenSCADParser } from '@holistic-stack/openscad-parser';

const parser = new OpenSCADParser();
await parser.init();

// Simple range
const ast1 = parser.parseAST('[0:5]');
// Result: RangeExpressionNode with start=0, end=5

// Stepped range
const ast2 = parser.parseAST('[0:2:10]');
// Result: RangeExpressionNode with start=0, step=2, end=10

// Variable range
const ast3 = parser.parseAST('[start:end]');
// Result: RangeExpressionNode with start=identifier, end=identifier
```

### Integration with For Loops

```typescript
const forLoopCode = `
for (i = [0:2:10]) {
  cube(i);
}
`;

const ast = parser.parseAST(forLoopCode);
// The range [0:2:10] is properly parsed as a RangeExpressionNode
```

## Integration with ExpressionVisitor

### Seamless Integration Architecture

The RangeExpressionVisitor is fully integrated into the main ExpressionVisitor system:

```typescript
// In ExpressionVisitor.createExpressionNode()
case 'range_expression':
  return this.rangeExpressionVisitor.visitRangeExpression(node);

// In ExpressionVisitor.dispatchSpecificExpression()
case 'range_expression':
  return this.rangeExpressionVisitor.visitRangeExpression(node);
```

**Integration Benefits**:
- ✅ **No "Unhandled expression type" warnings**: Range expressions are properly dispatched
- ✅ **List comprehension support**: Ranges work seamlessly in `[for (i = [0:5]) ...]`
- ✅ **For loop support**: Ranges work in `for (i = [0:2:10]) { ... }`
- ✅ **Variable assignment support**: Ranges work in `range = [1:0.5:5];`
- ✅ **Type safety**: Full TypeScript support with proper AST node types

### Integration Evidence

**Before Integration**:
```
[WARN] [ExpressionVisitor.createExpressionNode] Unhandled expression type: range_expression
```

**After Integration**:
```
[INFO] [RangeExpressionVisitor.visitRangeExpression] Processing range expression: 1:5
[INFO] [RangeExpressionVisitor.visitRangeExpression] Successfully created range expression AST node
```

## Technical Implementation

### Hybrid Approach

The visitor uses a hybrid approach to handle Tree-sitter grammar precedence issues:

1. **Primary Handler**: Attempts to handle `range_expression` nodes directly
2. **Fallback Handler**: Detects range patterns within `array_literal` nodes using regex
3. **Pattern Detection**: Uses robust regex patterns to identify range syntax
4. **ExpressionVisitor Integration**: Works through the main expression visitor dispatch system

### Pattern Detection Regex

```typescript
// Simple range: start:end
const simpleRangePattern = /^([^:]+):([^:]+)$/;

// Stepped range: start:step:end  
const steppedRangePattern = /^([^:]+):([^:]+):([^:]+)$/;
```

### Error Handling

The visitor provides comprehensive error handling:

- **Invalid Node Types**: Warns when receiving unexpected node types
- **Malformed Patterns**: Logs info when array literals don't match range patterns
- **Complex Expressions**: Warns when treating complex expressions as identifiers
- **Null Safety**: Proper null checks for regex matches and node creation

## Best Practices

### Testing

Always use the Real Parser Pattern for testing:

```typescript
describe('RangeExpressionVisitor', () => {
  let parser: OpenSCADParser;
  let visitor: RangeExpressionVisitor;
  let errorHandler: ErrorHandler;

  beforeEach(async () => {
    parser = new OpenSCADParser();
    await parser.init();
    errorHandler = new ErrorHandler();
    visitor = new RangeExpressionVisitor('', errorHandler);
  });

  afterEach(() => {
    parser.dispose();
  });
});
```

### Error Handling

Always provide an ErrorHandler instance:

```typescript
const errorHandler = new ErrorHandler();
const visitor = new RangeExpressionVisitor(source, errorHandler);
```

### Performance

The visitor is optimized for performance:
- Regex patterns are compiled once
- Early returns for non-matching patterns
- Minimal string processing overhead

## Related Documentation

- [Expression Visitor System](./expression-visitor.md)
- [AST Types Reference](./ast-types.md)
- [Error Handling Guide](./error-handling.md)
- [Testing Guidelines](../testing.md)
