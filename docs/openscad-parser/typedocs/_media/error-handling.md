# Error Handling

This document provides comprehensive documentation for error handling in the OpenSCAD Parser library.

## Overview

The OpenSCAD Parser provides robust error handling through a flexible error handler system. Error handlers collect and manage parsing errors, warnings, and other diagnostic information during the parsing process.

## Error Handler Interface

### IErrorHandler

Base interface for all error handlers.

```typescript
interface IErrorHandler {
  handleError(error: ParseError): void;
  handleWarning(warning: ParseWarning): void;
  getErrors(): ParseError[];
  getWarnings(): ParseWarning[];
  clear(): void;
}
```

**Methods:**
- `handleError(error)`: Process a parsing error
- `handleWarning(warning)`: Process a parsing warning
- `getErrors()`: Retrieve all collected errors
- `getWarnings()`: Retrieve all collected warnings
- `clear()`: Clear all collected errors and warnings

## SimpleErrorHandler

Basic implementation of the error handler interface.

### Constructor

```typescript
const errorHandler = new SimpleErrorHandler();
```

Creates a new error handler instance that collects errors and warnings in memory.

### Methods

#### `handleError(error: ParseError): void`

Handle a parsing error by adding it to the internal collection.

**Parameters:**
- `error`: The parsing error to handle

#### `handleWarning(warning: ParseWarning): void`

Handle a parsing warning by adding it to the internal collection.

**Parameters:**
- `warning`: The parsing warning to handle

#### `getErrors(): ParseError[]`

Get all collected parsing errors.

**Returns:** Array of ParseError objects

#### `getWarnings(): ParseWarning[]`

Get all collected parsing warnings.

**Returns:** Array of ParseWarning objects

#### `clear(): void`

Clear all collected errors and warnings.

### Example Usage

```typescript
import { EnhancedOpenscadParser, SimpleErrorHandler } from '@holistic-stack/openscad-parser';

// Functional approach with explicit resource management and immutable error handling
const parseOpenSCADWithValidation = async (source: string): Promise<{
  readonly ast: ReadonlyArray<unknown> | null;
  readonly errors: ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
  readonly success: boolean;
}> => {
  // Create parser with explicit dependencies
  const errorHandler = new SimpleErrorHandler();
  const parser = new EnhancedOpenscadParser(errorHandler);
  
  // Proper async initialization with await
  await parser.init();
  
  try {
    // Pure operation: String input -> AST output
    const ast = parser.parseAST(source);
    
    // Create immutable copies of all collections
    const errors = Object.freeze([...errorHandler.getErrors()]);  
    const warnings = Object.freeze([...errorHandler.getWarnings()]);
    const infos = Object.freeze([...errorHandler.getInfos()]);
    
    // Derive success state from errors immutably
    const success = errors.length === 0;
    
    // Pure function for error logging
    const logResults = (): void => {
      if (errors.length > 0) {
        console.log('Parsing errors found:');
        errors.forEach(error => console.log(`- ${error}`));
      }
      
      if (warnings.length > 0) {
        console.log('Parsing warnings:');
        warnings.forEach(warning => console.log(`- ${warning}`));
      }
      
      if (infos.length > 0 && errors.length === 0) {
        console.log('Processing info:');
        infos.forEach(info => console.log(`- ${info}`));
      }
    };
    
    // Apply pure function to produce side effects
    logResults();
    
    // Return immutable result object
    return Object.freeze({
      ast: Object.freeze(ast),
      errors,
      warnings,
      success
    });
  } catch (error) {
    // Create error message with functional transformation
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Return immutable result object for error case
    return Object.freeze({
      ast: null,
      errors: Object.freeze([errorMessage]),
      warnings: Object.freeze([]),
      success: false
    });
  } finally {
    // Explicit resource disposal - functional resource management
    parser.dispose();
  }
};

// Usage example with pure function processing
const analyzeParseResult = async (source: string): Promise<void> => {
  // Immutable result object
  const result = await parseOpenSCADWithValidation(source);
  
  // Pure function to generate summary
  const getSummary = (result: {
    readonly success: boolean;
    readonly errors: ReadonlyArray<string>;
  }): string => {
    return result.success
      ? 'Parsing completed successfully'
      : `Parsing failed with ${result.errors.length} errors`;
  };
  
  // Apply pure function to create output
  console.log(getSummary(result));
  
  // Conditionally process AST with pattern matching-like approach
  if (result.ast) {
    const moduleCount = result.ast.filter(node => 
      typeof node === 'object' && node && 'type' in node && node.type === 'module_definition'
    ).length;
    
    console.log(`Found ${moduleCount} module definitions`);
  }
};

// Process example code
await analyzeParseResult('cube([10, 20, 30);'); // Missing closing bracket
```

## Error Types

### ParseError

Represents a parsing error.

```typescript
interface ParseError {
  message: string;
  line: number;
  column: number;
  severity: 'error';
  code?: string;
  source?: string;
}
```

**Properties:**
- `message`: Human-readable error description
- `line`: Line number where error occurred (1-based)
- `column`: Column number where error occurred (1-based)
- `severity`: Always 'error' for ParseError
- `code` (optional): Error code for programmatic handling
- `source` (optional): Source code snippet where error occurred

### ParseWarning

Represents a parsing warning.

```typescript
interface ParseWarning {
  message: string;
  line?: number;
  column?: number;
  severity: 'warning';
  code?: string;
  source?: string;
}
```

**Properties:**
- `message`: Human-readable warning description
- `line` (optional): Line number where warning occurred
- `column` (optional): Column number where warning occurred
- `severity`: Always 'warning' for ParseWarning
- `code` (optional): Warning code for programmatic handling
- `source` (optional): Source code snippet where warning occurred

## Custom Error Handlers

You can create custom error handlers by implementing the `IErrorHandler` interface:

```typescript
import { type IErrorHandler } from '@holistic-stack/openscad-parser';

/**
 * Functional error handler implementation with immutable state management
 * and explicit pure functions for error processing
 */
class FunctionalErrorHandler implements IErrorHandler {
  // Private readonly state with immutable collections
  private readonly state: {
    readonly errors: ReadonlyArray<string>;
    readonly warnings: ReadonlyArray<string>;
    readonly infos: ReadonlyArray<string>;
  };

  constructor() {
    // Initialize with empty immutable collections
    this.state = {
      errors: Object.freeze([]),
      warnings: Object.freeze([]),
      infos: Object.freeze([])
    };
  }

  // Pure function: logs info and updates state immutably
  logInfo(message: string): void {
    console.info(`[INFO] ${message}`);
    
    // Create new immutable state - no mutation
    this.state = {
      ...this.state,
      infos: Object.freeze([...this.state.infos, message])
    };
  }

  // Pure function: logs warning and updates state immutably
  logWarning(message: string): void {
    console.warn(`[WARNING] ${message}`);
    
    // Create new immutable state - no mutation
    this.state = {
      ...this.state,
      warnings: Object.freeze([...this.state.warnings, message])
    };
  }

  // Pure function: logs error and updates state immutably
  handleError(error: Error | string): void {
    // Extract message using pure transformation
    const errorMessage = error instanceof Error ? error.message : error;
    
    console.error(`[ERROR] ${errorMessage}`);
    
    // Create new immutable state - no mutation
    this.state = {
      ...this.state,
      errors: Object.freeze([...this.state.errors, errorMessage])
    };
  }

  // Pure getters - return immutable collections
  getErrors(): ReadonlyArray<string> {
    return this.state.errors;
  }

  getWarnings(): ReadonlyArray<string> {
    return this.state.warnings;
  }

  getInfos(): ReadonlyArray<string> {
    return this.state.infos;
  }

  // Pure predicate function
  hasErrors(): boolean {
    return this.state.errors.length > 0;
  }

  // Creates a new empty state instance - functional reset pattern
  clear(): void {
    this.state = {
      errors: Object.freeze([]),
      warnings: Object.freeze([]),
      infos: Object.freeze([])
    };
  }
}
```

## Error Recovery

The parser attempts to recover from errors and continue parsing when possible:

```typescript
const errorHandler = new SimpleErrorHandler();
const parser = new EnhancedOpenscadParser(errorHandler);

await parser.init();

const codeWithErrors = `
  cube(10);           // Valid
  sphere([5, 10);     // Error: invalid sphere parameters
  cylinder(h=20, r=5); // Valid - parser recovers
`;

const ast = parser.parseAST(codeWithErrors);

// AST may contain partial results
console.log(`Generated ${ast.length} AST nodes`);

// Check errors
const errors = errorHandler.getErrors();
console.log(`Found ${errors.length} errors`);

errors.forEach(error => {
  console.log(`Error: ${error.message} at line ${error.line}`);
});
```

## Error Codes

Common error codes that may be encountered:

### Syntax Errors
- `SYNTAX_ERROR`: General syntax error
- `MISSING_BRACKET`: Missing opening or closing bracket
- `MISSING_SEMICOLON`: Missing semicolon
- `UNEXPECTED_TOKEN`: Unexpected token in input

### Semantic Errors
- `INVALID_PARAMETER`: Invalid parameter value
- `MISSING_PARAMETER`: Required parameter missing
- `TYPE_MISMATCH`: Parameter type doesn't match expected type
- `UNDEFINED_VARIABLE`: Reference to undefined variable

### Warning Codes
- `DEPRECATED_SYNTAX`: Use of deprecated syntax
- `UNUSED_VARIABLE`: Variable defined but not used
- `PERFORMANCE_WARNING`: Code that may have performance implications

## Testing Error Handling

When testing error handling, use the Real Parser Pattern:

```typescript
describe('Error Handling', () => {
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

  it('should handle syntax errors gracefully', () => {
    const invalidCode = 'cube([10, 20, 30);'; // Missing closing bracket
    
    // Parser should not throw, but collect errors
    const ast = parser.parseAST(invalidCode);
    
    const errors = errorHandler.getErrors();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('bracket');
  });

  it('should collect multiple errors', () => {
    const multipleErrors = `
      cube([10, 20);     // Error 1: incomplete vector
      sphere(;           // Error 2: missing parameter
      cylinder(h=20, r=; // Error 3: incomplete parameter
    `;
    
    parser.parseAST(multipleErrors);
    
    const errors = errorHandler.getErrors();
    expect(errors.length).toBe(3);
  });

  it('should clear errors between parses', () => {
    parser.parseAST('invalid(');
    expect(errorHandler.getErrors().length).toBeGreaterThan(0);
    
    errorHandler.clear();
    expect(errorHandler.getErrors().length).toBe(0);
    expect(errorHandler.getWarnings().length).toBe(0);
  });
});
```

## Best Practices

### Error Handler Lifecycle

1. **Create error handler** before parser initialization
2. **Pass to parser** during construction
3. **Check for errors** after parsing operations
4. **Clear errors** between parsing sessions if reusing handler
5. **Handle errors appropriately** based on application needs

### Error Reporting

```typescript
function reportErrors(errorHandler: IErrorHandler): void {
  const errors = errorHandler.getErrors();
  const warnings = errorHandler.getWarnings();

  if (errors.length > 0) {
    console.group('Parsing Errors:');
    errors.forEach((error, index) => {
      console.error(`${index + 1}. ${error.message}`);
      if (error.line && error.column) {
        console.error(`   Location: line ${error.line}, column ${error.column}`);
      }
      if (error.source) {
        console.error(`   Source: ${error.source}`);
      }
    });
    console.groupEnd();
  }

  if (warnings.length > 0) {
    console.group('Parsing Warnings:');
    warnings.forEach((warning, index) => {
      console.warn(`${index + 1}. ${warning.message}`);
    });
    console.groupEnd();
  }
}
```

### Error Recovery Strategies

1. **Continue parsing** after recoverable errors
2. **Provide partial results** when possible
3. **Collect all errors** in a single pass
4. **Offer suggestions** for common mistakes
5. **Maintain source location** information for debugging
