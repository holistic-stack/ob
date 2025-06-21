# Parser Classes

> **IMPORTANT**: This document focuses on functional programming patterns for using parser classes. For complete API references including method signatures, parameters, and return types, please refer to the [auto-generated TypeDocs](../typedocs/classes/enhanced_parser_js.EnhancedOpenscadParser.html).

## EnhancedOpenscadParser

Enhanced OpenSCAD parser that provides AST generation and comprehensive error handling following functional programming principles.

### Overview

The `EnhancedOpenscadParser` follows functional principles with:

- **Immutability**: Parsed AST structures are immutable
- **Pure Functions**: Transformation functions operate without side effects
- **Explicit Resource Management**: Clear initialization and disposal lifecycle
- **Functional Composition**: Integrated with pure functional visitor patterns

### Constructor & Resource Management

The parser follows functional resource management patterns with explicit initialization and disposal.

```typescript
const parser = new EnhancedOpenscadParser(errorHandler?: IErrorHandler);
```

**Parameters:**
- `errorHandler` (optional): Error handler instance for collecting errors and warnings

**Functional Resource Management Pattern:**

```typescript
import { EnhancedOpenscadParser, SimpleErrorHandler } from '@openscad/parser';

// Pure function for parser lifecycle management
const withParser = async <T>(fn: (parser: EnhancedOpenscadParser) => Promise<T>): Promise<T> => {
  // Pure initialization of resources
  const errorHandler = new SimpleErrorHandler();
  const parser = new EnhancedOpenscadParser(errorHandler);
  
  try {
    // Initialize parser
    await parser.init();
    
    // Execute function with parser
    return await fn(parser);
  } finally {
    // Guaranteed resource cleanup
    parser.dispose();
  }
};

// Usage example
const result = await withParser(async (parser) => {
  // Use parser within this scope
  return parser.parseAST('cube(10);');
});
```

### Methods

#### `init(wasmPath?: string, treeSitterWasmPath?: string): Promise<void>`

Initializes the enhanced OpenSCAD parser by loading the WASM grammar for OpenSCAD and Tree-sitter itself.

For complete API details, see the [TypeDocs for init method](../typedocs/classes/enhanced_parser_js.EnhancedOpenscadParser.html#init).

**Functional Initialization Pattern with Result Type:**

```typescript
import { EnhancedOpenscadParser, SimpleErrorHandler } from '@openscad/parser';

// Define Result type for pure error handling
type Result<T, E = Error> = 
  | { readonly success: true; readonly value: T } 
  | { readonly success: false; readonly error: E };

// Pure function for parser initialization
const initParser = async (
  wasmPath?: string,
  treeSitterWasmPath?: string
): Promise<Result<EnhancedOpenscadParser, Error>> => {
  const errorHandler = new SimpleErrorHandler();
  const parser = new EnhancedOpenscadParser(errorHandler);
  
  try {
    await parser.init(wasmPath, treeSitterWasmPath);
    return { 
      success: true, 
      value: parser 
    };
  } catch (error) {
    // Clean up resources on failure
    parser.dispose();
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error)) 
    };
  }
};

// Functional pattern usage
const result = await initParser();

// Pattern matching through discriminated unions
if (result.success) {
  const parser = result.value;
  try {
    // Use the initialized parser
    const ast = parser.parseAST('cube(10);');
    console.log('AST:', Object.freeze(ast)); // Ensure immutability
  } finally {
    // Guaranteed cleanup
    parser.dispose();
  }
} else {
  // Pure error handling
  console.error('Initialization failed:', result.error.message);
}
```

#### `parseAST(code: string): ASTNode[]`

Parse OpenSCAD code and generate a structured AST following functional programming principles.

For complete API details, see the [TypeDocs for parseAST method](../typedocs/classes/enhanced_parser_js.EnhancedOpenscadParser.html#parseAST).

**Functional Parsing Pattern:**

```typescript
import { EnhancedOpenscadParser, SimpleErrorHandler, ASTNode } from '@openscad/parser';

// Pure function for parsing that guarantees immutability
const parseOpenSCAD = async (code: string): Promise<ReadonlyArray<ASTNode>> => {
  const errorHandler = new SimpleErrorHandler();
  const parser = new EnhancedOpenscadParser(errorHandler);
  
  try {
    await parser.init();
    
    // Parse and immediately freeze the result for guaranteed immutability
    const ast = parser.parseAST(code);
    return Object.freeze([...ast]); // Return immutable copy
  } finally {
    // Guaranteed resource cleanup
    parser.dispose();
  }
};

// Functional transformation of AST using pure functions
const processAST = (ast: ReadonlyArray<ASTNode>): void => {
  // Pure function for node analysis (no side effects)
  const analyzeCube = (node: ASTNode): string => {
    if (node.type !== 'cube') return 'Not a cube';
    
    // Pure transformation of node properties
    const dimensions = Array.isArray(node.size) 
      ? node.size.join(' × ')
      : String(node.size);
      
    return `Cube with dimensions: ${dimensions}`;
  };
  
  // Process the AST nodes with pure functions
  const descriptions = ast.map(node => analyzeCube(node));
  
  // Log results (side effect isolated to end of function)
  console.log(descriptions.join('\n'));
};

// Usage
const ast = await parseOpenSCAD('cube([10, 20, 30]);');
processAST(ast); // "Cube with dimensions: 10 × 20 × 30"
```

#### `parseCST(code: string): TreeSitter.Tree | null`

Parse OpenSCAD code to a Concrete Syntax Tree (CST).

**Parameters:**
- `code`: The OpenSCAD source code to parse

**Returns:** Tree-sitter Tree object or null if parsing fails

#### `update` and `updateAST` - Incremental Parsing with Functional Programming

For incremental parsing operations, functional programming principles dictate treating each parse state as an immutable value and applying transformations as pure functions.

For complete API details, see the [TypeDocs for update](../typedocs/classes/enhanced_parser_js.EnhancedOpenscadParser.html#update) and [updateAST](../typedocs/classes/enhanced_parser_js.EnhancedOpenscadParser.html#updateAST) methods.

**Functional Incremental Parsing Pattern:**

```typescript
import { EnhancedOpenscadParser, SimpleErrorHandler, ASTNode } from '@openscad/parser';

// Immutable document state type
type DocumentState = Readonly<{
  code: string;
  ast: ReadonlyArray<ASTNode>;
}>;

// Pure function for applying code changes
const applyChange = async (
  state: DocumentState,
  newCode: string,
  changeRange: Readonly<{start: number; oldEnd: number; newEnd: number}>
): Promise<DocumentState> => {
  const errorHandler = new SimpleErrorHandler();
  const parser = new EnhancedOpenscadParser(errorHandler);
  
  try {
    await parser.init();
    
    // First parse to initialize the parser state
    parser.parseAST(state.code);
    
    // Apply incremental update (pure transformation)
    const newAst = parser.updateAST(
      newCode,
      changeRange.start,
      changeRange.oldEnd,
      changeRange.newEnd
    );
    
    // Return new immutable state
    return Object.freeze({
      code: newCode,
      ast: Object.freeze([...newAst])
    });
  } finally {
    // Resource cleanup
    parser.dispose();
  }
};

// Usage example with immutable state management
const documentState: DocumentState = Object.freeze({
  code: 'cube(10);',
  ast: [] // Initial empty AST
});

// Calculate change parameters in a pure way
const calculateChange = (oldCode: string, newValue: string): Readonly<{start: number; oldEnd: number; newEnd: number; newCode: string}> => {
  const searchValue = '10';
  const start = oldCode.indexOf(searchValue);
  const oldEnd = start + searchValue.length;
  const newCode = oldCode.substring(0, start) + newValue + oldCode.substring(oldEnd);
  const newEnd = start + newValue.length;
  
  return Object.freeze({ start, oldEnd, newEnd, newCode });
};

// Apply a change immutably
const change = calculateChange(documentState.code, '20');
const newState = await applyChange(documentState, change.newCode, { 
  start: change.start, 
  oldEnd: change.oldEnd, 
  newEnd: change.newEnd 
});

// newState now contains the updated code and AST as immutable values
console.log(newState.code); // 'cube(20);'

#### `dispose(): void` - Functional Resource Management

Dispose of the parser and free associated resources, following functional resource management principles.

For complete API details, see the [TypeDocs for dispose method](../typedocs/classes/enhanced_parser_js.EnhancedOpenscadParser.html#dispose).

**Functional Resource Lifecycle Pattern:**

```typescript
import { EnhancedOpenscadParser, SimpleErrorHandler } from '@openscad/parser';

// Resource acquisition is initialization (RAII) pattern adapted to functional JS/TS
const withResourceSafely = async <T, R extends { dispose(): void }>(
  acquire: () => Promise<R>,  // Resource acquisition function
  use: (resource: R) => Promise<T>  // Resource usage function
): Promise<T> => {
  // Acquire the resource
  const resource = await acquire();
  
  try {
    // Use the resource
    return await use(resource);
  } finally {
    // Guaranteed cleanup regardless of success/failure
    resource.dispose();
  }
};

// Example usage with parser
const parseResult = await withResourceSafely(
  // Resource acquisition - returns initialized parser
  async () => {
    const errorHandler = new SimpleErrorHandler();
    const parser = new EnhancedOpenscadParser(errorHandler);
    await parser.init();
    return parser;
  },
  // Resource usage - returns parsing result
  async (parser) => {
    return Object.freeze(parser.parseAST('cube(10);'));
  }
);

// parseResult is available, parser is guaranteed to be disposed
console.log(parseResult);
```

#### `getErrorHandler(): IErrorHandler` - Accessing Diagnostics

Returns the error handler instance used by this parser.

For complete API details, see the [TypeDocs for getErrorHandler method](../typedocs/classes/enhanced_parser_js.EnhancedOpenscadParser.html#getErrorHandler).

**Functional Error Collection Pattern:**

```typescript
import { EnhancedOpenscadParser, SimpleErrorHandler } from '@openscad/parser';

// Pure function for error collection
const collectParsingDiagnostics = async (code: string): Promise<{
  errors: ReadonlyArray<string>;
  warnings: ReadonlyArray<string>;
}> => {
  const errorHandler = new SimpleErrorHandler();
  const parser = new EnhancedOpenscadParser(errorHandler);
  
  try {
    await parser.init();
    
    // Parse code
    parser.parseAST(code);
    
    // Get immutable collections of errors and warnings
    const errors = [...errorHandler.getErrors()];
    const warnings = [...errorHandler.getWarnings()];
    
    // Return immutable result object
    return Object.freeze({
      errors: Object.freeze(errors),
      warnings: Object.freeze(warnings)
    });
    
  } finally {
    parser.dispose();
  }
};

// Example usage
const diagnostics = await collectParsingDiagnostics('cube(;');
console.log(`Found ${diagnostics.errors.length} errors and ${diagnostics.warnings.length} warnings`);

// Additional example showing error retrieval
const functionalErrorCheck = async (code: string): Promise<number> => {
  const errorHandler = new SimpleErrorHandler();
  const parser = new EnhancedOpenscadParser(errorHandler);
  
  try {
    await parser.init();
    parser.parseAST(code); // Parse potentially erroneous code
    
    // Get error handler and retrieve errors immutably
    const handler = parser.getErrorHandler();
    const errors = [...handler.getErrors()];
    
    // Return error count (a pure computation)
    return errors.length;
  } finally {
    parser.dispose(); // Guaranteed cleanup
  }
};

// Usage
const errorCount = await functionalErrorCheck('cube(10;'); // Syntax error
console.log(`Found ${errorCount} parsing errors`);
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
