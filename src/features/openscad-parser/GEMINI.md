## Gemini Guidelines for OpenSCAD Parser

- **Technology**: `@holistic-stack/openscad-parser`.
- **Usage**: The parser is managed by the `ParserManager` service to ensure a single instance is used throughout the application for performance.
- **Error Handling**: The parser uses a `SimpleErrorHandler` to collect errors and warnings. These are then propagated into the Zustand store using the `Result<T, E>` type. Use structured error handling with specific types and provide meaningful error messages with context. Handle edge cases explicitly and validate input data.
- **Type Safety**: Adhere to the strict TypeScript configuration. Avoid `any` and use `unknown` for type-safe handling of unpredictable data. Use the `Result<T, E>` type for all operations that can fail. Always use `.js` extensions in imports.
- **Functional Programming**: Prioritize pure functions, immutable data structures, and function composition. Avoid side effects in utility functions and data transformations.
- **DRY, KISS, SRP**: Apply DRY (Don't Repeat Yourself), KISS (Keep It Simple, Stupid), and SRP (Single Responsibility Principle) to parser services and utilities.
- **TypeScript First**: This project is TypeScript-first; no JavaScript is allowed.
- **No Mocks for OpenscadParser**: Do not use mocks for `OpenscadParser`. Use real parser instances for testing.
- **Performance**: Optimize for readability first, then performance. Profile to identify actual bottlenecks. Use appropriate data structures and memoization.
- **Code Readability**: Prioritize readability over clever code.
