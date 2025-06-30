## Gemini Guidelines for 3D Renderer

- **Technology**: React Three Fiber, three.js, and our custom CSG utility.
- **CSG Operations**: All CSG operations (union, difference, intersection) are handled by the functions in `src/features/3d-renderer/services/csg-operations.ts`. Do not use any other CSG library.
- **State**: The 3D scene state is managed by the `scene` slice in the Zustand store. All updates to the scene should be done through actions. Use `readonly` for all state properties.
- **Performance**: Prioritize performance. Use `React.memo`, `useMemo`, and `useCallback` to prevent unnecessary re-renders. WebGL2 features are enabled. Optimize for readability first, then performance. Profile to identify actual bottlenecks. Use appropriate data structures and memoization. Minimize DOM manipulations and optimize 3D operations.
- **Type Safety**: Adhere to the strict TypeScript configuration. Avoid `any` and use `unknown` for type-safe handling of unpredictable data. Use the `Result<T, E>` type for all operations that can fail. Always use `.js` extensions in imports.
- **Functional Programming**: Prioritize pure functions, immutable data structures, and function composition. Avoid side effects in utility functions and data transformations.
- **DRY, KISS, SRP**: Apply DRY (Don't Repeat Yourself), KISS (Keep It Simple, Stupid), and SRP (Single Responsibility Principle) to 3D renderer components, hooks, and services.
- **TypeScript First**: This project is TypeScript-first; no JavaScript is allowed.
- **Error Handling**: Use structured error handling with specific types. Provide meaningful error messages with context. Handle edge cases explicitly and validate input data.
- **Code Readability**: Prioritize readability over clever code.
