# Result and Error Types

Pattern
```ts
export type Result<T, E> = { success: true; data: T } | { success: false; error: E };
```

Guidelines
- Use Result for expected failures
- Provide code + message on errors
- No any; use readonly data

Example
```ts
interface ParseError { readonly code: 'PARSE_FAILED'; readonly message: string }
function parse(code: string): Result<object, ParseError> { /* ... */ }
```

