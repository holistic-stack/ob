# Copilot Instructions

This document provides guidance for AI agents working on the `openscad-babylon` project.

## Core Commands

- **Build:** `pnpm build` - Compiles the TypeScript code.
- **Lint:** `pnpm lint` - Lints the codebase using ESLint.
- **Test:** `pnpm test` - Runs all tests using Vitest.
- **Run single test:** `pnpm test -- <test_file_name>`
- **Type Check:** `pnpm typecheck` - Runs the TypeScript compiler to check for type errors.
- **Storybook:** `pnpm storybook` - Starts the Storybook development server.
- **Build Storybook:** `pnpm build-storybook` - Builds the static Storybook site.

## High-Level Architecture

This project is a web-based 3D model editor using OpenSCAD, React (with React Three Fiber), and Babylon.js.

- **Frontend:** React 19 with TypeScript.
- **3D Rendering:** `react-three-fiber` on top of `Babylon.js`.
- **UI Components:** Custom components, potentially with a library like `shadcn/ui` in the future.
- **State Management:** Zustand.
- **Styling:** Tailwind CSS v4.
- **Bundler:** Vite.
- **Testing:** Vitest for unit and integration tests, Playwright for end-to-end tests.
- **Linting & Formatting:** ESLint and Prettier.

## Coding Style and Conventions

### TypeScript

- **Strict Mode:** The project uses strict TypeScript settings.
- **ESM Modules:** Use ESM syntax (`import`/`export`). Always include the `.js` extension in relative import paths, even for `.ts` files.
- **Type Safety:**
    - Avoid `any` where possible. Use `unknown` for data of unknown type and perform type checking.
    - Use `const` assertions for immutable data structures.
    - Prefer named exports over default exports.
- **File Naming:** Use kebab-case for file names.

### React

- **Functional Components:** Use functional components with hooks.
- **React 19 Features:** Utilize features from React 19 where applicable.
- **Component Structure:** Follow the "bulletproof-react" structure guidelines (see `docs/bulletproof-react-structure.md`).

### Linting

- The ESLint configuration is in `eslint.config.mjs`.
- It's optimized for TypeScript 5.8 and React 19.
- Many rules are set to `warn` during development to avoid blocking, but should be addressed before merging.
- Pay attention to warnings related to promises (`@typescript-eslint/no-floating-promises`) and unused variables.

## Agent Instructions from `.augment-guidelines`

The following are key principles adapted from the `.augment-guidelines` file:

### Core Principles

- **DRY (Don't Repeat Yourself):** Minimize code duplication.
- **SRP (Single Responsibility Principle):** Each component should have one reason to change.
- **TDD (Test-Driven Development):** Write tests before implementation.
- **Functional Programming:** Emphasize immutability and pure functions.
- **Appropriate Complexity:** Employ the minimum necessary complexity for a robust solution. Avoid both over-engineering and under-engineering.
- **Consistency:** Reuse existing patterns, architecture, and code.

### Heuristics

- **SOLID:** Apply SOLID principles for maintainable and modular code.
- **SMART:** Formulate goals that are Specific, Measurable, Assignable, Realistic, and Time-related.
- **Responsive UI:** Ensure user interfaces are responsive.

### General Rules

- **Purity and Cleanliness:** Remove obsolete or redundant code.
- **Perceptivity:** Be aware of the impact of changes (security, performance, etc.).
- **Resilience:** Implement necessary error handling and boundary checks.
- **Task Management:**
    - Use task lists for any work requiring 3+ distinct steps.
    - Create tasks *before* starting work.
    - Mark tasks as in-progress when starting and complete them immediately after finishing.
