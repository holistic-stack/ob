# Shared Utilities Guide

## Overview

This guide documents the shared utilities patterns established during Phase 2-3 refactoring of the OpenSCAD-Babylon pipeline. These utilities provide consistent, reusable functionality across components while following functional programming principles and DRY/KISS/SRP best practices.

## Shared Utilities Architecture

### AST Utilities (`src/features/ui-components/shared/ast-utils.ts`)

The AST utilities module provides standardized functions for AST processing, error handling, and performance monitoring across the application.

#### Core Functions

##### Error Handling Functions

```typescript
/**
 * Creates a standardized ParseError object with consistent formatting
 * @param message - Error message
 * @param severity - Error severity level (default: 'error')
 * @returns Formatted ParseError object
 */
createParseError(message: string, severity?: 'error' | 'warning'): ParseError

/**
 * Wraps operations with standardized error handling
 * @param operation - Operation name for logging
 * @param fn - Function to execute with error handling
 * @returns Result<T, string> with consistent error formatting
 */
withASTErrorHandling<T>(operation: string, fn: () => T): ASTResult<T>
```

##### Performance Functions

```typescript
/**
 * Formats performance time consistently across components
 * @param timeMs - Time in milliseconds
 * @returns Formatted time string (e.g., "150.00ms")
 */
formatPerformanceTime(timeMs: number): string

/**
 * Checks if performance time is within target
 * @param timeMs - Time in milliseconds
 * @param targetMs - Target time (default: 300ms)
 * @returns Boolean indicating if within target
 */
isWithinPerformanceTarget(timeMs: number, targetMs?: number): boolean
```

##### Validation Functions

```typescript
/**
 * Validates AST structure and content
 * @param ast - AST nodes to validate
 * @returns ASTResult<readonly ASTNode[]>
 */
validateAST(ast: readonly ASTNode[]): ASTResult<readonly ASTNode[]>

/**
 * Validates individual AST node
 * @param node - AST node to validate
 * @returns ASTResult<ASTNode>
 */
validateASTNode(node: ASTNode): ASTResult<ASTNode>
```

##### Logging Functions

```typescript
/**
 * Logs AST operations with structured data
 * @param operation - Operation name
 * @param nodes - AST nodes involved
 * @param additionalInfo - Additional logging data
 */
logASTOperation(operation: string, nodes: readonly ASTNode[], additionalInfo?: Record<string, unknown>): void

/**
 * Logs AST operation results with consistent formatting
 * @param operation - Operation name
 * @param result - Operation result
 * @param additionalInfo - Additional logging data
 */
logASTResult<T>(operation: string, result: ASTResult<T>, additionalInfo?: Record<string, unknown>): void
```

### Camera Utilities (`src/features/ui-components/shared/camera-utils.ts`)

The camera utilities module provides standardized camera operations for 3D scene management.

#### Core Functions

```typescript
/**
 * Creates standardized camera configuration
 * @param options - Camera configuration options
 * @returns CameraConfig object
 */
createCameraConfig(options: CameraConfigOptions): CameraConfig

/**
 * Validates camera position and orientation
 * @param position - Camera position
 * @param target - Camera target
 * @returns CameraResult<boolean>
 */
validateCameraPosition(position: Vector3, target: Vector3): CameraResult<boolean>

/**
 * Formats camera position for logging
 * @param position - Camera position
 * @returns Formatted position string
 */
formatCameraPosition(position: Vector3): string
```

## Usage Patterns

### Error Handling Pattern

**Before Refactoring (Duplicated Code)**:
```typescript
// In multiple components
try {
  const result = await parseAST(code);
  return { success: true, data: result };
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const parseError = {
    message: errorMessage,
    line: 1,
    column: 1,
    severity: 'error'
  };
  return { success: false, error: [parseError] };
}
```

**After Refactoring (Shared Utilities)**:
```typescript
// Using shared utilities
import { createParseError, withASTErrorHandling } from '../../shared/ast-utils';

try {
  const result = await parseAST(code);
  return { success: true, data: result };
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
  const parseError = createParseError(errorMessage);
  return { success: false, error: [parseError] };
}
```

### Performance Logging Pattern

**Before Refactoring (Inconsistent Formatting)**:
```typescript
// Different formatting in different components
console.log(`Parse completed in ${parseTime.toFixed(2)}ms`);
console.log(`Operation took ${time}ms`);
console.log(`Duration: ${duration.toFixed(1)} milliseconds`);
```

**After Refactoring (Consistent Formatting)**:
```typescript
import { formatPerformanceTime } from '../../shared/ast-utils';

console.log(`Parse completed in ${formatPerformanceTime(parseTime)}`);
console.log(`Operation took ${formatPerformanceTime(time)}`);
console.log(`Duration: ${formatPerformanceTime(duration)}`);
```

## Integration Examples

### OpenSCAD AST Store Integration

The `openscad-ast-store.ts` demonstrates proper integration of shared utilities:

```typescript
import { createParseError, formatPerformanceTime } from '../../shared/ast-utils';

// Error handling in parseAST method
catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
  const parseError = createParseError(errorMessage);
  
  set({
    parseErrors: [parseError],
    parseStatus: 'error',
    isParsing: false,
    isASTValid: false
  });
  
  return { success: false, error: [parseError] };
}

// Performance logging
console.log(`AST parsing completed successfully in ${formatPerformanceTime(result.parseTime)}`);
```

### OpenSCAD AST Service Integration

The `openscad-ast-service.ts` shows service-level integration:

```typescript
import { createParseError, logASTOperation, validateAST } from '../../shared/ast-utils';

// Validation with shared utilities
const validationResult = validateAST(parsedAST);
if (!validationResult.success) {
  return { success: false, errors: [createParseError(validationResult.error)] };
}

// Logging with shared utilities
logASTOperation('PARSE_OPENSCAD', parsedAST, { codeLength: code.length });
```

## Best Practices

### 1. Always Use Shared Utilities

**✅ DO**: Use shared utilities for consistent behavior
```typescript
import { createParseError } from '../../shared/ast-utils';
const error = createParseError('Syntax error at line 5');
```

**❌ DON'T**: Create error objects manually
```typescript
const error = { message: 'Syntax error', line: 1, column: 1, severity: 'error' };
```

### 2. Import Only What You Need

**✅ DO**: Import specific functions
```typescript
import { createParseError, formatPerformanceTime } from '../../shared/ast-utils';
```

**❌ DON'T**: Import entire modules
```typescript
import * as astUtils from '../../shared/ast-utils';
```

### 3. Follow Functional Programming Patterns

**✅ DO**: Use pure functions and Result types
```typescript
const result = validateAST(nodes);
if (result.success) {
  processValidAST(result.data);
}
```

**❌ DON'T**: Use imperative patterns with side effects
```typescript
let isValid = true;
try {
  validateAST(nodes);
} catch (error) {
  isValid = false;
}
```

### 4. Maintain Backward Compatibility

When adding new shared utilities:
- Keep existing function signatures unchanged
- Add new parameters as optional with sensible defaults
- Provide migration guides for breaking changes
- Test thoroughly with existing components

### 5. Document Usage Examples

Always provide clear usage examples in JSDoc comments:

```typescript
/**
 * Creates a standardized ParseError object
 * 
 * @param message - Error message
 * @param severity - Error severity (default: 'error')
 * @returns Formatted ParseError object
 * 
 * @example
 * ```typescript
 * const error = createParseError('Syntax error at line 5');
 * console.log(error); // { message: 'Syntax error at line 5', line: 1, column: 1, severity: 'error' }
 * ```
 */
```

## Testing Shared Utilities

### Unit Testing Pattern

Each shared utility should have comprehensive unit tests:

```typescript
describe('createParseError', () => {
  it('should create error with default severity', () => {
    const error = createParseError('Test error');
    expect(error.severity).toBe('error');
  });
  
  it('should create error with custom severity', () => {
    const error = createParseError('Test warning', 'warning');
    expect(error.severity).toBe('warning');
  });
});
```

### Integration Testing Pattern

Test shared utilities integration in consuming components:

```typescript
describe('OpenSCAD Store with Shared Utilities', () => {
  it('should use createParseError for exception handling', async () => {
    mockParseFunction.mockRejectedValue(new Error('Custom error'));
    
    const result = await parseAST(code);
    
    expect(mockCreateParseError).toHaveBeenCalledWith('Custom error');
    expect(result.success).toBe(false);
  });
});
```

## Migration Guide

### Migrating Existing Components

1. **Identify Duplication**: Look for repeated error handling, logging, or validation patterns
2. **Extract to Shared Utilities**: Move common functionality to appropriate shared utility modules
3. **Update Imports**: Replace local implementations with shared utility imports
4. **Test Integration**: Ensure existing functionality works with shared utilities
5. **Update Documentation**: Add JSDoc comments explaining shared utility usage

### Example Migration

**Before**:
```typescript
// Duplicated in multiple files
const formatTime = (ms: number) => `${ms.toFixed(2)}ms`;
```

**After**:
```typescript
// In shared/ast-utils.ts
export const formatPerformanceTime = (timeMs: number): string => `${timeMs.toFixed(2)}ms`;

// In consuming components
import { formatPerformanceTime } from '../../shared/ast-utils';
```

## Quality Gates

### Automated Validation

The following quality gates ensure shared utilities are used consistently:

1. **ESLint Rules**: Prevent direct error object creation when shared utilities are available
2. **Type Checking**: Ensure consistent Result<T,E> patterns across components
3. **Test Coverage**: Require 90%+ coverage for all shared utilities
4. **Integration Tests**: Validate shared utilities work correctly in consuming components

### Code Review Checklist

- [ ] Are shared utilities used instead of duplicated code?
- [ ] Are imports specific rather than wildcard imports?
- [ ] Are Result<T,E> patterns used consistently?
- [ ] Are JSDoc comments complete with examples?
- [ ] Are unit tests comprehensive with edge cases?
- [ ] Is backward compatibility maintained?

## Future Enhancements

### Planned Additions

1. **Validation Utilities**: Enhanced AST validation with detailed error reporting
2. **Logging Utilities**: Structured logging with configurable levels
3. **Performance Utilities**: Advanced performance monitoring and profiling
4. **Testing Utilities**: Shared test helpers and mock factories

### Extension Points

The shared utilities architecture is designed for easy extension:

- Add new utility modules following the established patterns
- Extend existing utilities with backward-compatible enhancements
- Create domain-specific utilities for specialized functionality
- Implement cross-cutting concerns like caching and memoization

## Conclusion

The shared utilities system provides a solid foundation for consistent, maintainable code across the OpenSCAD-Babylon pipeline. By following these patterns and best practices, developers can ensure code quality while reducing duplication and improving maintainability.

For questions or suggestions about shared utilities, please refer to the development team or create an issue in the project repository.
