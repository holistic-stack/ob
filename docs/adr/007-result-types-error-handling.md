# ADR-007: Use Result Types for Error Handling

## Status
Accepted

## Date
2024-12-19

## Context

The OpenSCAD Babylon project requires robust error handling across parsing, rendering, and user interactions. The primary error handling approaches considered were:

1. **Result Types** - Functional error handling with explicit success/failure states
2. **Exception-Based** - Traditional try/catch exception handling
3. **Error Callbacks** - Callback-based error handling patterns
4. **Promise Rejection** - Promise-based error handling with .catch()

### Requirements
- Explicit error handling that cannot be ignored
- Type-safe error information with detailed context
- Composable error handling patterns
- Performance-efficient error propagation
- Clear distinction between expected and unexpected errors
- Integration with TypeScript's type system

### Evaluation Criteria
- **Type Safety**: Compile-time error handling verification
- **Explicitness**: Cannot accidentally ignore errors
- **Composability**: Easy to chain and transform operations
- **Performance**: Minimal runtime overhead
- **Developer Experience**: Clear and intuitive API
- **Maintainability**: Easy to understand and modify

## Decision

We chose **Result Types** for error handling throughout the application for the following reasons:

### 1. Explicit Error Handling
Result types make error handling explicit and impossible to ignore, preventing silent failures that are common with exception-based approaches.

```typescript
type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Usage forces error handling
const result = parseOpenSCAD(code);
if (result.success) {
  // Handle success case
  processAST(result.data);
} else {
  // Handle error case - cannot be ignored
  console.error(result.error.message);
}
```

### 2. Type-Safe Error Information
Result types provide compile-time guarantees about error handling and enable rich error information with specific error types.

```typescript
interface ParseError {
  readonly code: 'SYNTAX_ERROR' | 'INVALID_INPUT' | 'GRAMMAR_ERROR';
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
  readonly timestamp: Date;
}

type ParseResult = Result<ASTNode[], ParseError>;
```

### 3. Functional Composition
Result types enable functional composition patterns that are difficult to achieve with exceptions.

```typescript
// Chain operations with automatic error propagation
const pipeline = (code: string) =>
  parseCode(code)
    .flatMap(ast => validateAST(ast))
    .flatMap(validAst => convertToMesh(validAst))
    .map(mesh => optimizeMesh(mesh));
```

### 4. Performance Benefits
Result types avoid the performance overhead of exception throwing and stack unwinding, which is important for real-time parsing and rendering.

### 5. Predictable Control Flow
Unlike exceptions, Result types provide predictable control flow that doesn't bypass intermediate code or cleanup logic.

### 6. Integration with Functional Patterns
Result types align with our functional programming approach and integrate well with other functional patterns like Option types and immutable data structures.

## Consequences

### Positive
- **Explicit Errors**: Cannot accidentally ignore error conditions
- **Type Safety**: Compile-time verification of error handling
- **Rich Error Context**: Detailed error information with specific types
- **Composability**: Easy to chain operations with error propagation
- **Performance**: No exception throwing overhead
- **Predictability**: Clear control flow without hidden jumps
- **Testing**: Easy to test both success and error paths
- **Documentation**: Error types serve as documentation

### Negative
- **Verbosity**: More verbose than simple exception handling
- **Learning Curve**: Team needs to understand functional error handling
- **Boilerplate**: Requires utility functions for common patterns
- **Integration**: May need adapters for libraries using exceptions

### Mitigation Strategies
- **Utility Functions**: Provide helper functions for common Result operations
- **Documentation**: Comprehensive examples and patterns
- **Training**: Team training on functional error handling
- **Adapters**: Create adapters for exception-based libraries

## Implementation Notes

### Core Result Type
```typescript
export type Result<T, E = Error> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };
```

### Utility Functions
```typescript
// Create success result
export const success = <T>(data: T): Result<T, never> => ({
  success: true,
  data
});

// Create error result
export const failure = <E>(error: E): Result<never, E> => ({
  success: false,
  error
});

// Map over success value
export const map = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> => {
  return result.success 
    ? success(fn(result.data))
    : result;
};

// Chain operations
export const flatMap = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => {
  return result.success 
    ? fn(result.data)
    : result;
};
```

### Error Type Definitions
```typescript
// Base error interface
interface BaseError {
  readonly code: string;
  readonly message: string;
  readonly timestamp: Date;
}

// Specific error types
interface ParseError extends BaseError {
  readonly code: 'PARSE_FAILED' | 'INVALID_INPUT' | 'GRAMMAR_ERROR';
  readonly line?: number;
  readonly column?: number;
}

interface RenderError extends BaseError {
  readonly code: 'RENDER_FAILED' | 'MESH_CREATION_FAILED' | 'CSG_ERROR';
  readonly meshId?: string;
}

interface ExportError extends BaseError {
  readonly code: 'EXPORT_FAILED' | 'INVALID_FORMAT' | 'FILE_WRITE_ERROR';
  readonly format?: string;
  readonly filename?: string;
}
```

### Exception Adapters
```typescript
// Convert exception-throwing functions to Result types
export const tryCatch = <T>(fn: () => T): Result<T, Error> => {
  try {
    return success(fn());
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

// Async version
export const tryCatchAsync = async <T>(
  fn: () => Promise<T>
): Promise<Result<T, Error>> => {
  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};
```

### Usage Patterns

#### Basic Error Handling
```typescript
const parseResult = parser.parseASTWithResult(code);
if (parseResult.success) {
  const ast = parseResult.data;
  // Process successful result
} else {
  const error = parseResult.error;
  console.error(`Parse failed: ${error.message}`);
  // Handle specific error types
  switch (error.code) {
    case 'SYNTAX_ERROR':
      showSyntaxError(error.line, error.column);
      break;
    case 'INVALID_INPUT':
      showInputError();
      break;
  }
}
```

#### Chaining Operations
```typescript
const processCode = (code: string): Result<Mesh, ParseError | RenderError> => {
  return parseCode(code)
    .flatMap(ast => validateAST(ast))
    .flatMap(validAst => convertToMesh(validAst));
};
```

#### React Integration
```typescript
const useOpenSCADParser = () => {
  const [result, setResult] = useState<ParseResult | null>(null);
  
  const parseCode = useCallback((code: string) => {
    const parseResult = parser.parseASTWithResult(code);
    setResult(parseResult);
    
    if (!parseResult.success) {
      // Handle error in UI
      showErrorToast(parseResult.error.message);
    }
  }, []);
  
  return { parseCode, result };
};
```

## Error Categories

### Expected Errors
Errors that are part of normal operation:
- Invalid OpenSCAD syntax
- Unsupported features
- Export format limitations

### Unexpected Errors
Errors that indicate bugs or system issues:
- Memory allocation failures
- WebGL context loss
- Network connectivity issues

### Recovery Strategies
- **Graceful Degradation**: Continue with reduced functionality
- **Retry Logic**: Automatic retry for transient errors
- **User Feedback**: Clear error messages with suggested actions
- **Fallback Options**: Alternative approaches when primary method fails

## Testing Strategy

### Success Path Testing
```typescript
it('should parse valid OpenSCAD code', () => {
  const result = parser.parseASTWithResult('cube([1, 1, 1]);');
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data).toHaveLength(1);
  }
});
```

### Error Path Testing
```typescript
it('should handle invalid syntax gracefully', () => {
  const result = parser.parseASTWithResult('invalid syntax');
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.code).toBe('SYNTAX_ERROR');
    expect(result.error.message).toContain('syntax');
  }
});
```

## References
- [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/) - F# approach to Result types
- [Rust Result Type](https://doc.rust-lang.org/std/result/) - Rust's Result implementation
- [Functional Error Handling](https://blog.logrocket.com/functional-error-handling-with-express-js-and-ddd/) - Functional error handling patterns

## Related ADRs
- [ADR-008: Use Functional Programming Patterns](./008-functional-programming-patterns.md)
- [ADR-002: Use Tree-sitter for OpenSCAD Parsing](./002-tree-sitter-for-parsing.md)
