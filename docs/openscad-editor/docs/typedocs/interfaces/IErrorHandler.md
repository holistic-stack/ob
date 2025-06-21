[**OpenSCAD Parser API Documentation v0.1.0**](../README.md)

***

# Interface: IErrorHandler

Defined in: [openscad-parser/error-handling/simple-error-handler.ts:96](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/simple-error-handler.ts#L96)

Simple error handler interface defining the minimal contract for error handling.

This interface provides the essential methods needed by parser visitors and other
components for logging and error reporting. It's designed to be lightweight while
maintaining compatibility with the full error handling system.

 IErrorHandler

## Since

0.1.0

## Methods

### logInfo()

```ts
logInfo(message: string): void;
```

Defined in: [openscad-parser/error-handling/simple-error-handler.ts:102](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/simple-error-handler.ts#L102)

Log an informational message.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | The informational message to log |

#### Returns

`void`

***

### logWarning()

```ts
logWarning(message: string): void;
```

Defined in: [openscad-parser/error-handling/simple-error-handler.ts:109](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/simple-error-handler.ts#L109)

Log a warning message.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | The warning message to log |

#### Returns

`void`

***

### handleError()

```ts
handleError(error: string | Error): void;
```

Defined in: [openscad-parser/error-handling/simple-error-handler.ts:116](https://github.com/holistic-stack/openscad-tree-sitter/blob/57470856b239e8ae819e2b2fa40ff65d8c04912f/packages/openscad-parser/src/lib/openscad-parser/error-handling/simple-error-handler.ts#L116)

Handle an error condition.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `error` | `string` \| `Error` | The error to handle (Error object or string message) |

#### Returns

`void`
