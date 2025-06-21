# Parser Classes

This document provides comprehensive documentation for all parser classes in the OpenSCAD Parser library.

## EnhancedOpenscadParser

Enhanced OpenSCAD parser that provides AST generation and comprehensive error handling.

### Overview

The `EnhancedOpenscadParser` extends the basic parser functionality with:
- Structured AST generation using visitor pattern
- Comprehensive error handling and reporting
- Incremental parsing support
- Type-safe AST nodes

### Constructor

```typescript
const parser = new EnhancedOpenscadParser(errorHandler?: IErrorHandler);
```

**Parameters:**
- `errorHandler` (optional): Error handler instance for collecting errors and warnings

**Example:**
```typescript
import { EnhancedOpenscadParser, SimpleErrorHandler } from '@holistic-stack/openscad-parser';

const errorHandler = new SimpleErrorHandler();
const parser = new EnhancedOpenscadParser(errorHandler);
```

### Methods

#### `init(wasmPath?: string, treeSitterWasmPath?: string): Promise<void>`

Initializes the enhanced OpenSCAD parser by loading the WASM grammar for OpenSCAD and Tree-sitter itself.

**Parameters:**
- `wasmPath` (optional): Path to the `tree-sitter-openscad.wasm` file. Defaults to `'./tree-sitter-openscad.wasm'` (resolved relative to the library or application). The parser attempts multiple strategies to locate this file if not provided or if a relative path is given.
- `treeSitterWasmPath` (optional): Path to the `tree-sitter.wasm` file (the core Tree-sitter engine). Defaults to `'./tree-sitter.wasm'` (resolved relative to the library or application). Similar resolution strategies are applied.

**Returns:** Promise that resolves when initialization is complete.

**Throws:** Error if WASM loading fails for either WASM file or if the OpenSCAD grammar cannot be loaded.

**Example (Default Paths):**
```typescript
const parser = new EnhancedOpenscadParser();
try {
  await parser.init();
  console.log('Parser initialized successfully with default WASM paths.');
} catch (error) {
  console.error('Failed to initialize parser:', error);
}
```

**Example (Custom Paths):**
```typescript
const parser = new EnhancedOpenscadParser();
try {
  // Ensure these paths are accessible from your application's context
  await parser.init('/custom/path/to/tree-sitter-openscad.wasm', '/custom/path/to/tree-sitter.wasm');
  console.log('Parser initialized successfully with custom WASM paths.');
} catch (error) {
  console.error('Failed to initialize parser:', error);
}
```

#### `parseAST(code: string): ASTNode[]`

Parse OpenSCAD code and generate a structured AST.

**Parameters:**
- `code`: The OpenSCAD source code to parse

**Returns:** Array of AST nodes representing the parsed code

**Example:**
```typescript
const ast = parser.parseAST('cube([10, 20, 30]);');

console.log(ast[0].type); // 'cube'
console.log(ast[0].size); // [10, 20, 30]
```

#### `parseCST(code: string): TreeSitter.Tree | null`

Parse OpenSCAD code to a Concrete Syntax Tree (CST).

**Parameters:**
- `code`: The OpenSCAD source code to parse

**Returns:** Tree-sitter Tree object or null if parsing fails

#### `update(code: string, startIndex: number, oldEndIndex: number, newEndIndex: number): TreeSitter.Tree | null`

Incrementally update the CST with code changes.

**Parameters:**
- `newCode`: Updated source code
- `startIndex`: Start position of the change
- `oldEndIndex`: End position of the old content
- `newEndIndex`: End position of the new content

**Returns:** Updated Tree-sitter Tree object

**Example:**
```typescript
const originalCode = 'cube(10);';
const originalTree = parser.parseCST(originalCode);

const newCode = 'cube(20);'; // Changed parameter
const startIndex = originalCode.indexOf('10');
const oldEndIndex = startIndex + 2; // '10' is 2 characters
const newEndIndex = startIndex + 2; // '20' is also 2 characters

const updatedTree = parser.update(newCode, startIndex, oldEndIndex, newEndIndex);
```

#### `updateAST(code: string, startIndex: number, oldEndIndex: number, newEndIndex: number): ASTNode[]`

Incrementally update the AST with code changes.

**Parameters:**
- `newCode`: Updated source code
- `startIndex`: Start position of the change
- `oldEndIndex`: End position of the old content
- `newEndIndex`: End position of the new content

**Returns:** Updated AST nodes

#### `dispose(): void`

Dispose the parser and free associated resources.

#### `getErrorHandler(): IErrorHandler`

Returns the error handler instance used by this parser.

This can be useful for accessing parser errors or configuring error handling behavior. The returned error handler follows the `IErrorHandler` interface.

**Returns:** The `IErrorHandler` instance associated with the parser.

**Example:**
```typescript
const errorHandler = new SimpleErrorHandler();
const parser = new EnhancedOpenscadParser(errorHandler);
await parser.init();

const code = 'cube(10;'; // Syntax error
try {
  parser.parseAST(code);
} catch (e) {
  // Error already handled by the errorHandler instance
}

const retrievedHandler = parser.getErrorHandler();
console.log('Errors:', retrievedHandler.getErrors()); // Access errors via the retrieved handler
```

### Properties

#### `isInitialized: boolean` (Read-only)

Indicates whether the parser has been successfully initialized (i.e., WASM files loaded and grammar set).

**Returns:** `true` if the parser is initialized, `false` otherwise.

**Example:**
```typescript
const parser = new EnhancedOpenscadParser();
console.log(parser.isInitialized); // false

await parser.init();
console.log(parser.isInitialized); // true
```

### Error Handling

The enhanced parser integrates with error handlers to provide comprehensive error reporting:

```typescript
const errorHandler = new SimpleErrorHandler();
const parser = new EnhancedOpenscadParser(errorHandler);

const invalidCode = 'cube([10, 20, 30);'; // Missing closing bracket

try {
  const ast = parser.parseAST(invalidCode);
  
  // Check collected errors and warnings
  const errors = errorHandler.getErrors();
  const warnings = errorHandler.getWarnings();
  
  console.log('Errors:', errors);
  console.log('Warnings:', warnings);
} catch (error) {
  console.error('Parsing failed:', error);
}
```

## Real Parser Pattern

Both parser classes follow the "Real Parser Pattern" for testing - no mocks are used. Instead, real parser instances are created with proper lifecycle management:

```typescript
describe('Parser Tests', () => {
  let parser: EnhancedOpenscadParser;
  let errorHandler: SimpleErrorHandler;

  beforeEach(async () => {
    errorHandler = new SimpleErrorHandler();
    parser = new EnhancedOpenscadParser(errorHandler);
    await parser.init();
  });

  afterEach(() => {
    parser.dispose();
  });

  it('should parse OpenSCAD code', () => {
    const ast = parser.parseAST('sphere(5);');
    expect(ast[0].type).toBe('sphere');
  });
});
```

## Performance Considerations

General best practices for performance include reusing parser instances and ensuring proper disposal to prevent memory leaks.

### Memory Usage
- Each parser instance uses approximately 5-10MB of memory.
- AST generation adds minimal overhead, typically around 10-20% of the Concrete Syntax Tree (CST) size.
- **Proper Disposal is Key**: Always call `dispose()` on the parser instance when it's no longer needed to free up resources and prevent memory leaks.

```typescript
const parser = new EnhancedOpenscadParser();
try {
  await parser.init();
  // Use the parser for one or more operations...
  const ast = parser.parseAST('cube(10);');
} finally {
  parser.dispose(); // Essential for releasing memory
}
```

### Parsing Speed
Typical parsing speeds (including AST generation) are:
- Small files (<1KB): ~2ms
- Medium files (10KB): ~15ms
- Large files (100KB): ~120ms

*(Performance can vary based on system specifications and code complexity.)*

### Best Practices for Performance

1.  **Reuse Parser Instances**: Creating a new parser instance involves overhead (e.g., loading WASM, initializing state). For multiple parsing operations (e.g., parsing several files or re-parsing on changes), reuse a single `EnhancedOpenscadParser` instance.

    ```typescript
    const parser = new EnhancedOpenscadParser();
    await parser.init(); // Initialize once

    const codesToParse = ['cube(10);', 'sphere(5);', 'translate([1,2,3]) cylinder(h=10, r=2);'];
    const astResults = codesToParse.map(code => parser.parseAST(code));

    // ... use astResults ...

    parser.dispose(); // Dispose when all operations are done
    ```

2.  **Proper Cleanup (Dispose)**: As highlighted in Memory Usage, always call `dispose()` when the parser is no longer needed. This is crucial in long-running applications or servers to prevent resource leaks.

3.  **Incremental Parsing for Edits**: When dealing with small changes to existing code (e.g., in a code editor), use `update()` or `updateAST()` for incremental parsing. This is significantly faster than re-parsing the entire file from scratch.

    ```typescript
    // Assume 'parser' is an initialized EnhancedOpenscadParser instance
    const originalCode = 'cube(10);';
    parser.parseAST(originalCode); // Initial parse

    const updatedCode = 'cube(20);'; // User changes '10' to '20'
    const startIndex = originalCode.indexOf('10');
    const oldEndIndex = startIndex + 2;
    const newEndIndex = startIndex + 2;

    // Use incremental update for the AST
    const updatedAST = parser.updateAST(updatedCode, startIndex, oldEndIndex, newEndIndex);
    ```

4.  **Error Handling**: While not directly a performance tip for speed, robust error handling (using the provided `IErrorHandler` mechanism or wrapping calls in `try-catch`) prevents crashes and allows applications to recover gracefully, contributing to overall application performance and stability.
