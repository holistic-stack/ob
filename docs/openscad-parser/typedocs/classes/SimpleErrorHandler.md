[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Class: SimpleErrorHandler

Defined in: [openscad-parser/error-handling/simple-error-handler.ts:142](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/simple-error-handler.ts#L142)

Simple error handler implementation providing lightweight error management.

This class provides basic error handling functionality without the complex dependencies
of the full error handling system. It's designed to be a drop-in replacement that
satisfies the interface requirements while maintaining minimal overhead.

The implementation features:
- **Message Storage**: Collects all messages in memory for programmatic access
- **Console Output**: Immediate console logging for development feedback
- **Type Distinction**: Separate handling for info, warning, and error messages
- **State Management**: Methods to clear state and check for specific message types
- **Thread Safety**: Simple synchronous implementation suitable for single-threaded use

Memory management:
- Messages are stored in arrays and can grow unbounded
- Use `clear()` method periodically to prevent memory leaks in long-running processes
- Each message type is stored separately for efficient filtering

 SimpleErrorHandler

## Implements

## Since

0.1.0

## Implements

- [`IErrorHandler`](../interfaces/IErrorHandler.md)

## Constructors

### Constructor

```ts
new SimpleErrorHandler(): SimpleErrorHandler;
```

#### Returns

`SimpleErrorHandler`

## Methods

### logInfo()

```ts
logInfo(message: string): void;
```

Defined in: [openscad-parser/error-handling/simple-error-handler.ts:168](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/simple-error-handler.ts#L168)

Log an informational message.

Informational messages are used for non-critical status updates, debugging
information, and progress reporting. They don't indicate problems but provide
useful context about the parsing process.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | The informational message to log |

#### Returns

`void`

#### Example

```typescript
const handler = new SimpleErrorHandler();
handler.logInfo('Starting AST generation for cube primitive');
handler.logInfo('Successfully processed 15 nodes');
```

#### Implementation of

[`IErrorHandler`](../interfaces/IErrorHandler.md).[`logInfo`](../interfaces/IErrorHandler.md#loginfo)

***

### logWarning()

```ts
logWarning(message: string): void;
```

Defined in: [openscad-parser/error-handling/simple-error-handler.ts:188](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/simple-error-handler.ts#L188)

Log a warning message.

Warning messages indicate recoverable issues that don't prevent processing
from continuing but may result in unexpected behavior or suboptimal output.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | The warning message to log |

#### Returns

`void`

#### Example

```typescript
const handler = new SimpleErrorHandler();
handler.logWarning('Missing semicolon detected, attempting recovery');
handler.logWarning('Unknown parameter "color" ignored in cube()');
```

#### Implementation of

[`IErrorHandler`](../interfaces/IErrorHandler.md).[`logWarning`](../interfaces/IErrorHandler.md#logwarning)

***

### handleError()

```ts
handleError(error: string | Error): void;
```

Defined in: [openscad-parser/error-handling/simple-error-handler.ts:217](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/simple-error-handler.ts#L217)

Handle an error condition.

Error handling for critical issues that may prevent successful parsing or
result in invalid AST generation. Accepts both Error objects and string
messages for flexibility.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `error` | `string` \| `Error` | The error to handle (Error object or string message) |

#### Returns

`void`

#### Example

```typescript
const handler = new SimpleErrorHandler();

// Handle Error objects
try {
  parser.parse(malformedCode);
} catch (error) {
  handler.handleError(error);
}

// Handle string messages
handler.handleError('Unexpected token at line 5');
```

#### Implementation of

[`IErrorHandler`](../interfaces/IErrorHandler.md).[`handleError`](../interfaces/IErrorHandler.md#handleerror)

***

### getErrors()

```ts
getErrors(): string[];
```

Defined in: [openscad-parser/error-handling/simple-error-handler.ts:245](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/simple-error-handler.ts#L245)

Get all collected error messages.

Returns a copy of the error messages array to prevent external modification
of the internal state. Useful for testing, reporting, and post-processing.

#### Returns

`string`[]

A copy of all collected error messages

#### Example

```typescript
const handler = new SimpleErrorHandler();
// ... parsing operations that may generate errors

const errors = handler.getErrors();
if (errors.length > 0) {
  console.log(`Found ${errors.length} errors:`);
  errors.forEach((error, index) => {
    console.log(`  ${index + 1}. ${error}`);
  });
}
```

***

### getWarnings()

```ts
getWarnings(): string[];
```

Defined in: [openscad-parser/error-handling/simple-error-handler.ts:269](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/simple-error-handler.ts#L269)

Get all collected warning messages.

Returns a copy of the warning messages array to prevent external modification
of the internal state. Warnings indicate recoverable issues that don't stop processing.

#### Returns

`string`[]

A copy of all collected warning messages

#### Example

```typescript
const handler = new SimpleErrorHandler();
// ... parsing operations

const warnings = handler.getWarnings();
if (warnings.length > 0) {
  console.log('Warnings encountered:');
  warnings.forEach(warning => console.log(`  - ${warning}`));
}
```

***

### getInfos()

```ts
getInfos(): string[];
```

Defined in: [openscad-parser/error-handling/simple-error-handler.ts:290](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/simple-error-handler.ts#L290)

Get all collected informational messages.

Returns a copy of the informational messages array. Info messages provide
context about the parsing process and are useful for debugging and monitoring.

#### Returns

`string`[]

A copy of all collected informational messages

#### Example

```typescript
const handler = new SimpleErrorHandler();
// ... parsing operations with info logging

const infos = handler.getInfos();
console.log(`Processing completed with ${infos.length} info messages`);
```

***

### clear()

```ts
clear(): void;
```

Defined in: [openscad-parser/error-handling/simple-error-handler.ts:318](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/simple-error-handler.ts#L318)

Clear all collected messages.

Resets the error handler state by clearing all stored messages. Useful for
reusing the same handler instance across multiple parsing operations or
preventing memory leaks in long-running processes.

#### Returns

`void`

#### Example

```typescript
const handler = new SimpleErrorHandler();

for (const file of files) {
  handler.clear(); // Reset state for each file

  const parser = new OpenSCADParser(handler);
  parser.parseFile(file);

  // Process messages for this file
  if (handler.hasErrors()) {
    console.log(`Errors in ${file}:`, handler.getErrors());
  }
}
```

***

### hasErrors()

```ts
hasErrors(): boolean;
```

Defined in: [openscad-parser/error-handling/simple-error-handler.ts:347](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/simple-error-handler.ts#L347)

Check if there are any collected error messages.

Convenient method to quickly determine if any errors occurred during processing
without needing to retrieve and check the length of the errors array.

#### Returns

`boolean`

True if there are any error messages, false otherwise

#### Example

```typescript
const handler = new SimpleErrorHandler();
const parser = new OpenSCADParser(handler);

parser.parse(sourceCode);

if (handler.hasErrors()) {
  console.error('Parsing failed with errors');
  return null;
}

return parser.getAST();
```

***

### hasWarnings()

```ts
hasWarnings(): boolean;
```

Defined in: [openscad-parser/error-handling/simple-error-handler.ts:372](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/simple-error-handler.ts#L372)

Check if there are any collected warning messages.

Convenient method to quickly determine if any warnings occurred during processing.
Warnings don't prevent successful parsing but may indicate issues worth addressing.

#### Returns

`boolean`

True if there are any warning messages, false otherwise

#### Example

```typescript
const handler = new SimpleErrorHandler();
const result = parser.parse(sourceCode);

if (handler.hasWarnings()) {
  console.warn('Parsing completed with warnings');
  handler.getWarnings().forEach(warning => console.warn(warning));
}

return result;
```
