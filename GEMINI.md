# Gemini Code Assistant - Project Guidelines

This document provides guidelines for the Gemini code assistant to ensure its contributions align with the project's standards, architecture, and conventions.

## 1. Core Principles

- **Functional Programming**: Prioritize pure functions, immutable data structures, and function composition. Avoid side effects in utility functions and data transformations. Enforce immutability and use higher-order functions. Compose functions and use declarative programming. Handle nullable values with option/maybe types.
- **Immutability**: All state managed by Zustand and all data structures should be treated as immutable. Use `Object.freeze()` for static objects and `Readonly<T>` for types.
- **Type Safety**: Adhere to the strict TypeScript configuration. Avoid `any` and use `unknown` for type-safe handling of unpredictable data. Use the `Result<T, E>` type for all operations that can fail. Leverage advanced types (unions, intersections, generics). Prefer interfaces for APIs and readonly for immutable data. Use type guards instead of type assertions. Utilize utility types and discriminated unions. Always use `.js` extensions in imports.
- **TDD (Test-Driven Development)**: All new features or bug fixes must be accompanied by comprehensive tests. Follow the Red-Green-Refactor cycle. Implement changes incrementally with files under 500 lines.
- **Co-location**: Tests, styles, and types should be co-located with their corresponding components or modules. Each SRP file must have its own folder and its tests should be in the same folder.
- **DRY, KISS, SRP**: Always use DRY (Don't Repeat Yourself) and KISS (Keep It Simple, Stupid) rules. Apply SRP (Single Responsibility Principle) for any function and utilities. Split the code into smaller and manageable parts.
- **TypeScript First**: This project is TypeScript-first; no JavaScript is allowed.
- **No Mocks for OpenscadParser**: Do not use mocks for `OpenscadParser`. Use real parser instances for testing.
- **Performance**: Optimize for readability first, then performance. Profile to identify actual bottlenecks. Use appropriate data structures and memoization. Minimize DOM manipulations and optimize 3D operations.
- **Error Handling**: Use structured error handling with specific types. Provide meaningful error messages with context. Handle edge cases explicitly and validate input data. Use `Result<T, E>` for operations that can fail, and traditional `try...catch` blocks only when necessary in business logic.
- **Code Readability**: Prioritize readability over clever code.
- **Incremental Changes**: Make small incremental changes.
- **Verification**: Always run tests, TypeScript checks, and linting after changes.
- **E2E Tests**: Must create e2e tests for features using the latest Playwright best practices.
- **Debugging**: When debugging code or tests, add log checkpoints (e.g., `[INIT]`, `[DEBUG]`, `[ERROR]`, `[WARN]`, `[END]`).
- **Contextual Search**: Always search online for updated context information and reason multiple approaches, focusing on TypeScript best practices.
- **Documentation**: Add documentation comments in the edited files explaining the reason behind the edit. Remove old comments if you refactored the previous edit. Document why code works a certain way, not just what it does. Include architectural decisions, limitations, and edge cases. Use JSDoc comments for all code elements with descriptions and examples.
- **Code Review**: Provide constructive feedback focused on code, not the developer.
- **Continuous Integration**: Use feature branches and maintain a clean commit history.

## 2. Technology Stack

- **Frontend**: React 19, TypeScript 5.8, Vite
- **State Management**: Zustand 5
- **3D Rendering**: React Three Fiber, three.js, and a custom CSG utility.
- **Code Editor**: Monaco Editor
- **Parsing**: `@holistic-stack/openscad-parser`
- **Styling**: Tailwind CSS v4 with a custom Glass Morphism design system.
- **Testing**: Vitest for unit/integration tests, Playwright for E2E tests.

## 3. Project Structure (Bulletproof-React)

- `src/features`: Self-contained feature modules (e.g., `code-editor`, `3d-renderer`).
- `src/shared`: Reusable components, hooks, types, and utils.
- `src/app`: Application-level setup (providers, layout).
- `src/test`: Testing utilities and fixtures.

## 4. Coding Conventions

- **File Naming**: `kebab-case.ts` for services/utils, `kebab-case.tsx` for components, `use-kebab-case.ts` for hooks. Test files are named `*.test.ts` or `*.test.tsx`.
- **Component Style**: Use functional components with React Hooks. Props interfaces should be `readonly`.
- **Error Handling**: Use the `Result<T, E>` type for functions that can fail. Avoid traditional `try...catch` blocks in business logic where `Result` is more appropriate.
- **Imports**: Use absolute paths (`@/`) for imports within the `src` directory.

## 5. Commit Messages

Follow the Conventional Commits specification. Example: `feat(renderer): add support for sphere primitive`.

## 6. How to Approach Common Tasks

- **Adding a new feature**:
    1. Create a new directory under `src/features`.
    2. Define the feature's state and actions in a new Zustand slice (or extend an existing one).
    3. Write failing tests for the new functionality.
    4. Implement the components, hooks, and services.
    5. Ensure all tests pass and linting rules are met.
- **Fixing a bug**:
    1. Write a failing test that reproduces the bug.
    2. Fix the bug.
    3. Ensure all tests pass.
- **Refactoring**:
    1. Ensure existing tests cover the code to be refactored.
    2. Perform the refactoring.
    3. Verify that all tests still pass.
