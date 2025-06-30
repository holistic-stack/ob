## Gemini Guidelines for Code Editor

- **Technology**: Monaco Editor via `@monaco-editor/react`.
- **Language**: OpenSCAD syntax highlighting is provided by `src/features/code-editor/services/openscad-language.ts`.
- **Parsing**: Real-time parsing is handled by the `useOpenSCADParsing` hook, which debounces input and uses the `@holistic-stack/openscad-parser`.
- **State**: The editor's content and state are managed by the `editor` slice in the Zustand store. All state is immutable and should be updated only through actions. Use `readonly` for all state properties.
- **Type Safety**: Adhere to the strict TypeScript configuration. Avoid `any` and use `unknown` for type-safe handling of unpredictable data. Use the `Result<T, E>` type for all operations that can fail. Always use `.js` extensions in imports.
- **Functional Programming**: Prioritize pure functions, immutable data structures, and function composition. Avoid side effects in utility functions and data transformations.
- **DRY, KISS, SRP**: Apply DRY (Don't Repeat Yourself), KISS (Keep It Simple, Stupid), and SRP (Single Responsibility Principle) to editor components, hooks, and services.
- **Performance**: Optimize for readability first, then performance. Profile to identify actual bottlenecks. Use appropriate data structures and memoization.
- **Error Handling**: Use structured error handling with specific types. Provide meaningful error messages with context. Handle edge cases explicitly and validate input data.
- **Code Readability**: Prioritize readability over clever code.
- **TypeScript First**: This project is TypeScript-first; no JavaScript is allowed.
