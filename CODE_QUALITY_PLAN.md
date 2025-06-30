# Code Quality Improvement Plan for OpenSCAD 3D Visualization Application

This plan outlines a systematic approach to achieve zero Biome warnings/errors and zero TypeScript compilation errors, while adhering to the specified architectural and testing constraints.

## 1. Initial Setup and Environment Validation

*   **Goal**: Ensure the environment is ready and baseline lint/type issues are identified.
*   **Steps**:
    1.  **Verify Dependencies**: Confirm `pnpm` is installed and all project dependencies are up-to-date by running `pnpm install`.
    2.  **Baseline Lint**: Execute `pnpm biome:lint` to get an initial report of all Biome warnings and errors.
    3.  **Baseline Type Check**: Execute `pnpm type-check` to get an initial report of all TypeScript compilation errors.
    4.  **Review Reports**: Analyze the output from both commands to understand the scope and common patterns of violations.

## 2. Automated Fixes with Biome

*   **Goal**: Resolve as many Biome violations as possible automatically.
*   **Steps**:
    1.  **Run `biome:fix`**: Execute `pnpm biome:fix`. This command will attempt to automatically fix fixable Biome issues based on the rules defined in `biome.json`.
    2.  **Re-run Lint**: After `biome:fix`, run `pnpm biome:lint` again to see which issues remain.

## 3. Systematic Manual Fixes and Refactoring

*   **Goal**: Address all remaining Biome errors, TypeScript compilation errors, and perform strategic refactoring. This will be the most iterative and time-consuming phase.
*   **Approach**: I will work through the codebase systematically, likely starting with core modules or areas with the highest concentration of errors. I will prioritize TypeScript errors first, as they often reveal deeper type-related issues that Biome might not catch.

### 3.1. TypeScript Error Resolution (Prioritized)

*   **Focus**: Eliminate all TypeScript compilation errors, especially those related to `any` types and unsafe operations.
*   **Steps**:
    1.  **Iterative Type Checking**: Continuously run `pnpm type-check` after making changes to identify and resolve issues.
    2.  **Eliminate Implicit `any`**:
        *   For function parameters, return types, and variables, add explicit type annotations.
        *   For `catch` clauses, always type `error` as `unknown` and use type guards (`instanceof Error`, `typeof`) to narrow its type.
    3.  **Manage Explicit `any`**:
        *   **General Codebase**: Replace explicit `any` with specific interfaces, union types, `unknown`, or appropriate type assertions (`as unknown as TargetType`).
        *   **Three.js WebGL Components**: In files under `src/features/3d-renderer/` and `src/features/r3f-renderer/`, `any` types are allowed *only* for Three.js WebGL components and related mocking. I will ensure `any` usage in these areas is minimal and justified, and not propagated to other parts of the application.
    4.  **Address Unsafe TypeScript Operations**:
        *   `noUnsafeAssignment`, `noUnsafeMemberAccess`, `noUnsafeCall`, `noUnsafeReturn`, `noUnsafeArgument`: These will require careful type definition, type guards, and potentially refactoring of functions to ensure all data flows are type-safe.
        *   `noExtraNonNullAssertion`: Replace `!` with optional chaining (`?.`), explicit null/undefined checks, or custom type guard functions.
    5.  **Comply with `docs/typescript-guidelines.md`**:
        *   Ensure proper ESM practices (e.g., `.js` extensions in imports).
        *   Prefer `interface` over `type` for object types where applicable.
        *   Utilize utility types (`Partial`, `Pick`, `Omit`, `Record`, `NonNullable`, `ReturnType`, `Parameters`) for type transformations.
        *   Implement type guards and discriminated unions for robust type narrowing.
        *   Adopt `const` assertions for static data.

### 3.2. Biome Error Resolution (Manual)

*   **Focus**: Fix remaining Biome errors and warnings that `biome:fix` could not resolve.
*   **Steps**:
    1.  **Iterative Linting**: Continuously run `pnpm biome:lint` after making changes.
    2.  **`useOptionalChain`**: Replace `||` with `??` where the intent is to handle `null` or `undefined` specifically, rather than falsy values like `0` or `''`.
    3.  **`noUnusedVariables`**: Remove unused imports, variables, or parameters. For intentionally unused parameters (e.g., in callbacks), prefix them with an underscore (`_`).
    4.  **Other Biome Rules**: Address any other specific Biome rules flagged as errors or warnings, referring to `biome.json` for the exact rule configuration. This includes `noDuplicateImports`, `useTemplate`, `useShorthandAssign`, etc.

### 3.3. Strategic Code Refactoring

*   **Goal**: Improve code quality, readability, and maintainability while fixing lint/type issues.
*   **Principles**:
    *   **DRY (Don't Repeat Yourself)**: Identify and eliminate code duplication by extracting common logic into reusable functions or components.
    *   **SRP (Single Responsibility Principle)**: Ensure each function, class, or component has one clear purpose. Split large files or functions into smaller, more focused units if necessary.
    *   **Bulletproof-React Architecture**: Maintain the established patterns, including functional components, clear prop interfaces (preferably `readonly`), and centralized type definitions.
    *   **Functional Programming**: Preserve and enhance functional programming principles where applicable, especially for data transformations and utility functions.
    *   **Result<T,E> Error Handling**: Ensure error-prone operations return `Result<T,E>` types for robust error management, avoiding direct `throw` statements where `Result` is more appropriate.
    *   **Logging Patterns**: Adhere to `[INIT]/[DEBUG]/[ERROR]/[WARN]/[END]` logging conventions.
    *   **Performance Targets**: Ensure refactoring does not negatively impact `<16ms` render performance and `300ms` debouncing.

### 3.4. Testing Compliance

*   **Goal**: Ensure tests adhere to the specified constraints.
*   **Steps**:
    1.  **Mocks**: Verify that `vi.fn()` mocking is used *only* for Three.js geometry classes and WebGL-related functionality.
    2.  **Real Implementations**: Confirm that OpenSCAD parser, matrix services, and other core components use real implementations in tests.
    3.  **Co-located Tests**: Maintain the existing pattern of co-located tests (no `__tests__` folders).
    4.  **TDD Methodology**: Preserve the TDD approach where tests are written first and drive implementation.

## 4. Final Validation

*   **Goal**: Confirm all success criteria are met.
*   **Steps**:
    1.  **Clean `pnpm lint`**: Run `pnpm lint` and ensure it returns exit code 0 with no warnings or errors.
    2.  **Clean `pnpm type-check`**: Run `pnpm type-check` and ensure it returns exit code 0 with no errors.
    3.  **Functionality Testing**: Perform a quick manual check or run existing integration/e2e tests (if available) to ensure no functionality is broken.
    4.  **Code Review**: (Implicit, but good practice) Review the changes to ensure adherence to all architectural and quality guidelines.

## Execution Flow Diagram

```mermaid
graph TD
    A[Start Code Quality Improvement] --> B{Initial Setup & Validation};
    B --> C[Run pnpm install];
    C --> D[Run pnpm lint];
    D --> E[Run pnpm type-check];
    E --> F{Review Baseline Reports};

    F --> G[Run pnpm lint:fix];
    G --> H{Automated Fixes Applied?};
    H -- Yes --> I[Re-run pnpm lint];
    H -- No --> I;

    I --> J{Remaining Biome/TypeScript Issues?};
    J -- Yes --> K[Systematic Manual Fixes & Refactoring];

    K --> K1[Prioritize TypeScript Errors];
    K1 --> K2[Eliminate Implicit 'any'];
    K2 --> K3[Manage Explicit 'any' (WebGL exception)];
    K3 --> K4[Address Unsafe TS Operations];
    K4 --> K5[Comply with TS Guidelines];

    K --> K6[Address Remaining Biome Errors/Warnings];
    K6 --> K7[Apply useOptionalChain];
    K7 --> K8[Handle noUnusedVariables];
    K8 --> K9[Fix other Biome rules];

    K --> K10[Strategic Code Refactoring];
    K10 --> K11[Apply DRY/SRP];
    K11 --> K12[Preserve Bulletproof-React/FP/Result<T,E>];
    K12 --> K13[Maintain Logging/Performance];

    K --> K14[Ensure Testing Compliance];
    K14 --> K15[Mocks only for WebGL];
    K15 --> K16[Real Impls for Parser/Matrix];
    K16 --> K17[Co-located Tests/TDD];

    K --> J; %% Loop back to check for remaining issues

    J -- No --> L[Final Validation];
    L --> M[Run pnpm biome:check (clean)];
    M --> N[Run pnpm type-check (clean)];
    N --> O[Verify Functionality (no breakage)];
    O --> P[End Code Quality Improvement];
```

## Summary of Key Actions

*   **Automated First**: Leverage `pnpm biome:fix` to handle straightforward issues.
*   **TypeScript First**: Prioritize fixing TypeScript errors, especially `any` and unsafe operations, as they indicate deeper type safety problems.
*   **Strict Compliance**: Adhere strictly to `biome.json` and `docs/typescript-guidelines.md`.
*   **Targeted `any` Exceptions**: Only allow `any` in `src/features/3d-renderer/` and `src/features/r3f-renderer/` for Three.js WebGL components, and only when absolutely necessary.
*   **Refactor with Principles**: Apply DRY, SRP, bulletproof-react, and functional programming principles during manual fixes.
*   **Testing Integrity**: Maintain real implementations for core logic and restrict mocking to Three.js WebGL.
*   **Iterative Validation**: Continuously run `pnpm biome:check` and `pnpm type-check` until both are clean.