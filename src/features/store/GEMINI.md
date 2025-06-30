## Gemini Guidelines for Store

- **Technology**: Zustand 5 with Immer middleware for immutable state updates.
- **Structure**: The store is divided into slices for each feature (`editor`, `parsing`, `scene`).
- **State**: All state is immutable and should be updated only through actions. Use `readonly` for all state properties. Prioritize immutability by using `Object.freeze()` for static objects and `Readonly<T>` for types.
- **Actions**: Actions that perform asynchronous operations should return a `Result<T, E>` object. Use `Result<T, E>` for all operations that can fail.
- **Debouncing**: The store implements a 300ms debounce for parsing code to optimize performance.
- **Type Safety**: Adhere to the strict TypeScript configuration. Avoid `any` and use `unknown` for type-safe handling of unpredictable data. Always use `.js` extensions in imports.
- **Functional Programming**: Prioritize pure functions and function composition. Avoid side effects in utility functions and data transformations.
- **DRY, KISS, SRP**: Apply DRY (Don't Repeat Yourself), KISS (Keep It Simple, Stupid), and SRP (Single Responsibility Principle) to store design and actions.
- **Performance**: Optimize for readability first, then performance. Use appropriate data structures and memoization.
- **Error Handling**: Provide meaningful error messages with context. Handle edge cases explicitly and validate input data.
- **Code Readability**: Prioritize readability over clever code.
- **TypeScript First**: This project is TypeScript-first; no JavaScript is allowed.
