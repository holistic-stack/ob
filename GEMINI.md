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

SRC\FEATURES\OPENSCAD-PARSER
│   argument-debug.test.ts
│   debug-accessor.test.ts
│   debug-cst.test.ts
│   GEMINI.md
│   incremental-parsing.test.ts
│   index.ts
│   node-types-debug.test.ts
│   node-types.test.ts
│   openscad-ast.test.ts
│   openscad-parser-error-handling.test.ts
│   openscad-parser-visitor.test.ts
│   openscad-parser.test.ts
│   openscad-parser.ts
│
├───ast
│   │   ast-generator.integration.test.ts
│   │   ast-types.ts
│   │   index.ts
│   │   visitor-ast-generator.test.ts
│   │   visitor-ast-generator.ts
│   │
│   ├───changes
│   │       change-tracker.test.ts
│   │       change-tracker.ts
│   │
│   ├───errors
│   │       index.ts
│   │       parser-error.test.ts
│   │       parser-error.ts
│   │       recovery-strategy.test.ts
│   │       recovery-strategy.ts
│   │       semantic-error.ts
│   │       syntax-error.test.ts
│   │       syntax-error.ts
│   │
│   ├───evaluation
│   │   │   binary-expression-evaluator.ts
│   │   │   expression-evaluation-context.ts
│   │   │   expression-evaluation.test.ts
│   │   │   expression-evaluator-registry.ts
│   │   │   expression-evaluator.ts
│   │   │
│   │   └───binary-expression-evaluator
│   │           binary-expression-evaluator-cube.test.ts
│   │           binary-expression-evaluator.test.ts
│   │           binary-expression-evaluator.ts
│   │
│   ├───extractors
│   │       argument-extractor.ts
│   │       color-extractor.ts
│   │       cube-extractor.test.ts
│   │       cube-extractor.ts
│   │       cylinder-extractor.ts
│   │       direct-binary-expression-test.ts
│   │       index.ts
│   │       minimal-cube-test.ts
│   │       module-parameter-extractor.test.ts
│   │       module-parameter-extractor.ts
│   │       offset-extractor.ts
│   │       parameter-extractor.ts
│   │       sphere-extractor.ts
│   │       value-extractor.ts
│   │       vector-extractor.ts
│   │
│   ├───nodes
│   │   │   ast-node.ts
│   │   │   expression.ts
│   │   │
│   │   └───expressions
│   │           binary-expression.ts
│   │
│   ├───query
│   │       index.ts
│   │       lru-query-cache.test.ts
│   │       lru-query-cache.ts
│   │       query-cache.test.ts
│   │       query-cache.ts
│   │       query-manager.test.ts
│   │       query-manager.ts
│   │
│   ├───registry
│   │       default-node-handler-registry.ts
│   │       index.ts
│   │       node-handler-registry-factory.ts
│   │       node-handler-registry.test.ts
│   │       node-handler-registry.ts
│   │
│   ├───test-utils
│   │       real-node-generator.test.ts
│   │       real-node-generator.ts
│   │
│   ├───tests
│   │       control-structures.test.ts
│   │       cube-extractor.test.ts
│   │       cube.test.ts
│   │       cylinder-extractor.test.ts
│   │       difference.test.ts
│   │       intersection.test.ts
│   │       minkowski.test.ts
│   │       module-function.test.ts
│   │       primitive-visitor.test.ts
│   │       rotate.test.ts
│   │       scale.test.ts
│   │       sphere-extractor.test.ts
│   │       sphere.test.ts
│   │       transformations.test.ts
│   │       union.test.ts
│   │
│   ├───utils
│   │       ast-error-utils.ts
│   │       debug-utils.ts
│   │       index.ts
│   │       location-utils.ts
│   │       node-utils.ts
│   │       variable-utils.ts
│   │       vector-utils.ts
│   │
│   └───visitors
│       │   ast-visitor.ts
│       │   base-ast-visitor.test.ts
│       │   base-ast-visitor.ts
│       │   composite-visitor-real.test.ts
│       │   composite-visitor.test.ts
│       │   composite-visitor.ts
│       │   control-structure-visitor.test.ts
│       │   control-structure-visitor.ts
│       │   csg-visitor.test.ts
│       │   csg-visitor.ts
│       │   expression-visitor.debug.test.ts
│       │   expression-visitor.integration.test.ts
│       │   expression-visitor.simple.test.ts
│       │   expression-visitor.test.ts
│       │   expression-visitor.ts
│       │   function-visitor.test.ts
│       │   function-visitor.ts
│       │   index.ts
│       │   module-visitor.test.ts
│       │   module-visitor.ts
│       │   primitive-visitor.test.ts
│       │   primitive-visitor.ts
│       │   query-visitor.test.ts
│       │   query-visitor.ts
│       │   transform-visitor.test.ts
│       │   transform-visitor.ts
│       │   variable-visitor.ts
│       │
│       ├───assert-statement-visitor
│       │       assert-statement-visitor.test.ts
│       │       assert-statement-visitor.ts
│       │
│       ├───assign-statement-visitor
│       │       assign-statement-visitor.test.ts
│       │       assign-statement-visitor.ts
│       │
│       ├───binary-expression-visitor
│       │       binary-expression-visitor.test.ts
│       │
│       ├───control-structure-visitor
│       │       for-loop-visitor.test.ts
│       │       for-loop-visitor.ts
│       │       if-else-visitor.test.ts
│       │       if-else-visitor.ts
│       │
│       ├───echo-statement-visitor
│       │       echo-statement-visitor.test.ts
│       │       echo-statement-visitor.ts
│       │
│       └───expression-visitor
│           │   function-call-visitor.test.ts
│           │   function-call-visitor.ts
│           │   i-parent-expression-visitor.ts
│           │   index.ts
│           │
│           ├───binary-expression-visitor
│           │       binary-expression-visitor.test.ts
│           │       binary-expression-visitor.ts
│           │       simple-binary.test.ts
│           │
│           ├───conditional-expression-visitor
│           │       conditional-expression-visitor.test.ts
│           │       conditional-expression-visitor.ts
│           │
│           ├───list-comprehension-visitor
│           │       list-comprehension-visitor.test.ts
│           │       list-comprehension-visitor.ts
│           │
│           ├───parenthesized-expression-visitor
│           │       parenthesized-expression-visitor.test.ts
│           │       parenthesized-expression-visitor.ts
│           │
│           ├───range-expression-visitor
│           │       range-expression-visitor.test.ts
│           │       range-expression-visitor.ts
│           │
│           └───unary-expression-visitor
│                   unary-expression-visitor.test.ts
│                   unary-expression-visitor.ts
│
├───cst
│   │   query-utils.test.ts
│   │   query-utils.ts
│   │
│   ├───cursor-utils
│   │       cstTreeCursorWalkLog.test.ts
│   │       cstTreeCursorWalkLog.ts
│   │       cursor-utils.integration.test.ts
│   │       cursor-utils.test.ts
│   │       cursor-utils.ts
│   │       README.md
│   │
│   └───queries
│           dependencies.scm
│           find-function-calls.scm
│           highlights.scm
│
└───error-handling
    │   error-handler.ts
    │   error-handling-integration.test.ts
    │   index.ts
    │   logger.ts
    │   recovery-strategy-registry.ts
    │   simple-error-handler.ts
    │
    ├───strategies
    │       missing-semicolon-strategy.test.ts
    │       missing-semicolon-strategy.ts
    │       recovery-strategy.ts
    │       type-mismatch-strategy.test.ts
    │       type-mismatch-strategy.ts
    │       unclosed-bracket-strategy.test.ts
    │       unclosed-bracket-strategy.ts
    │       unknown-identifier-strategy.test.ts
    │       unknown-identifier-strategy.ts
    │
    ├───types
    │       error-types.ts
    │
    └───utils
