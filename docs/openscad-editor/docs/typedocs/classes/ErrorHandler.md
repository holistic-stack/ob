[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Class: ErrorHandler

Defined in: [openscad-parser/error-handling/error-handler.ts:98](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L98)

Central error error-handling for managing errors and recovery in the OpenSCAD parser.

The ErrorHandler provides:
- Error collection and reporting
- Error recovery using registered strategies
- Configurable error handling behavior
- Integration with logging system

## Example

```typescript
const errorHandler = new ErrorHandler({
  throwErrors: false,
  minSeverity: Severity.WARNING,
  attemptRecovery: true
});

// Create and report an error
const error = errorHandler.createSyntaxError('Missing semicolon', {
  line: 10,
  column: 5
});

// Attempt recovery
const recoveredCode = errorHandler.attemptRecovery(error, originalCode);
```

## Constructors

### Constructor

```ts
new ErrorHandler(options: ErrorHandlerOptions): ErrorHandler;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:110](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L110)

Creates a new ErrorHandler

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | `ErrorHandlerOptions` | Configuration options |

#### Returns

`ErrorHandler`

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="options"></a> `options` | `readonly` | `Required`\<`ErrorHandlerOptions`\> | Configuration options for the error error-handling | [openscad-parser/error-handling/error-handler.ts:104](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L104) |

## Methods

### createParserError()

```ts
createParserError(message: string, context: ErrorContext): ParserError;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:129](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L129)

Creates a generic parser error

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Error message |
| `context` | `ErrorContext` | Error context |

#### Returns

`ParserError`

New ParserError instance

***

### createSyntaxError()

```ts
createSyntaxError(message: string, context: ErrorContext): SyntaxError;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:139](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L139)

Creates a syntax error

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Error message |
| `context` | `ErrorContext` | Error context |

#### Returns

`SyntaxError`

New SyntaxError instance

***

### createTypeError()

```ts
createTypeError(message: string, context: ErrorContext): TypeError;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:149](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L149)

Creates a type error

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Error message |
| `context` | `ErrorContext` | Error context |

#### Returns

`TypeError`

New TypeError instance

***

### createValidationError()

```ts
createValidationError(message: string, context: ErrorContext): ValidationError;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:159](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L159)

Creates a validation error

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Error message |
| `context` | `ErrorContext` | Error context |

#### Returns

`ValidationError`

New ValidationError instance

***

### createReferenceError()

```ts
createReferenceError(message: string, context: ErrorContext): ReferenceError;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:169](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L169)

Creates a reference error

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Error message |
| `context` | `ErrorContext` | Error context |

#### Returns

`ReferenceError`

New ReferenceError instance

***

### createInternalError()

```ts
createInternalError(message: string, context: ErrorContext): InternalError;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:179](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L179)

Creates an internal error

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | Error message |
| `context` | `ErrorContext` | Error context |

#### Returns

`InternalError`

New InternalError instance

***

### report()

```ts
report(error: ParserError): void;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:187](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L187)

Reports an error to the error-handling

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `error` | `ParserError` | The error to report |

#### Returns

`void`

***

### attemptRecovery()

```ts
attemptRecovery(error: ParserError, code: string): null | string;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:206](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L206)

Attempts to recover from an error using registered strategies

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `error` | `ParserError` | The error to recover from |
| `code` | `string` | The original source code |

#### Returns

`null` \| `string`

The recovered code if successful, null otherwise

***

### getErrors()

```ts
getErrors(): readonly ParserError[];
```

Defined in: [openscad-parser/error-handling/error-handler.ts:228](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L228)

Gets all collected errors

#### Returns

readonly `ParserError`[]

Array of collected errors

***

### getErrorsBySeverity()

```ts
getErrorsBySeverity(minSeverity: Severity): ParserError[];
```

Defined in: [openscad-parser/error-handling/error-handler.ts:237](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L237)

Gets errors filtered by severity level

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `minSeverity` | `Severity` | Minimum severity level to include |

#### Returns

`ParserError`[]

Array of filtered errors

***

### clearErrors()

```ts
clearErrors(): void;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:245](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L245)

Clears all collected errors

#### Returns

`void`

***

### hasErrors()

```ts
hasErrors(): boolean;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:253](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L253)

Checks if there are any errors

#### Returns

`boolean`

True if there are collected errors

***

### hasCriticalErrors()

```ts
hasCriticalErrors(): boolean;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:261](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L261)

Checks if there are any critical errors

#### Returns

`boolean`

True if there are critical errors

***

### getRecoveryRegistry()

```ts
getRecoveryRegistry(): RecoveryStrategyRegistry;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:269](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L269)

Gets the recovery strategy registry

#### Returns

`RecoveryStrategyRegistry`

The recovery strategy registry

***

### getLogger()

```ts
getLogger(): Logger;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:277](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L277)

Gets the logger instance

#### Returns

`Logger`

The logger instance

***

### logInfo()

```ts
logInfo(
   message: string, 
   _context?: string, 
   _node?: any): void;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:287](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L287)

Logs an info message

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | The message to log |
| `_context?` | `string` | - |
| `_node?` | `any` | - |

#### Returns

`void`

***

### logDebug()

```ts
logDebug(
   message: string, 
   _context?: string, 
   _node?: any): void;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:297](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L297)

Logs a debug message

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | The message to log |
| `_context?` | `string` | - |
| `_node?` | `any` | - |

#### Returns

`void`

***

### logWarning()

```ts
logWarning(
   message: string, 
   _context?: string, 
   _node?: any): void;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:330](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L330)

Logs a warning message with optional context information.

Warning messages indicate potential issues that might not prevent parsing but
could lead to unexpected behavior or AST structure. These warnings are useful for
diagnostic purposes and can help identify problematic code patterns.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | The warning message to log |
| `_context?` | `string` | - |
| `_node?` | `any` | - |

#### Returns

`void`

#### Example

```typescript
// Log a simple warning
errorHandler.logWarning('Deprecated syntax detected');

// Log a warning with context
errorHandler.logWarning('Missing parentheses in expression', 'visitExpression');

// Log a warning with both context and node information
errorHandler.logWarning(
  'Ambiguous operator precedence', 
  'ExpressionVisitor.visitBinaryExpression',
  node
);
```

#### Since

0.1.0

***

### logError()

```ts
logError(
   message: string, 
   _context?: string, 
   _node?: any): void;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:366](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L366)

Logs an error message with optional context information.

Error messages indicate significant issues that may prevent successful parsing or
result in an incomplete/incorrect AST. These errors are critical for understanding
parsing failures and should provide clear information about what went wrong and where.

This method should be used instead of console.log/error throughout the parser codebase
to ensure consistent error handling and logging.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | The error message to log |
| `_context?` | `string` | - |
| `_node?` | `any` | - |

#### Returns

`void`

#### Example

```typescript
// Log a simple error
errorHandler.logError('Failed to parse expression');

// Log an error with context
errorHandler.logError('Invalid parameter type', 'ModuleVisitor.processCube');

// Log an error with both context and node information for location tracking
errorHandler.logError(
  'Unexpected token in module instantiation', 
  'CompositeVisitor.visitModuleInstantiation',
  node
);
```

#### Since

0.1.0

***

### handleError()

```ts
handleError(
   error: Error, 
   context?: string, 
   node?: any): void;
```

Defined in: [openscad-parser/error-handling/error-handler.ts:408](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/error-handler.ts#L408)

Handles an error by logging it and optionally reporting it to the error collection system.

This method serves as the central error handling mechanism in the parser, providing
consistent error processing for both standard JavaScript errors and specialized
parser errors. It can optionally convert generic errors to parser-specific errors
and adds them to the error collection if appropriate.

The context parameter allows providing information about where the error occurred,
which is particularly useful for debugging complex parsing scenarios.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `error` | `Error` | The error to handle (can be a standard Error or a ParserError) |
| `context?` | `string` | Optional context information (e.g., class and method where error occurred) |
| `node?` | `any` | Optional tree-sitter node for additional context such as location information |

#### Returns

`void`

#### Examples

```typescript
try {
  // Some parsing operation that might fail
  processNode(node);
} catch (err) {
  // Handle any generic error
  errorHandler.handleError(err, 'VisitorASTGenerator.generate', node);
}
```

```typescript
// Creating and handling a specific parser error
const syntaxError = errorHandler.createSyntaxError(
  'Unexpected closing brace',
  { line: 42, column: 10 }
);
errorHandler.handleError(syntaxError, 'BlockVisitor.processBlock');
```

#### Since

0.1.0
