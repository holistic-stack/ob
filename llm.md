# OpenSCAD Babylon Project - LLM Onboarding Guide

Welcome to the OpenSCAD Babylon project! This guide provides everything you need to get up to speed quickly.

## 1. Project Overview

**What is this project?**

A web-based 3D model editor that uses OpenSCAD syntax. It features:
- A code editor (Monaco Editor) for writing OpenSCAD code.
- Real-time parsing of the code into an Abstract Syntax Tree (AST).
- Conversion of the AST into 3D geometry using Constructive Solid Geometry (CSG).
- Rendering the 3D geometry in a web browser using React Three Fiber and three.js.

**High-Level Architecture**

```mermaid
graph TD
    A[User writes OpenSCAD code in Monaco Editor] --> B{Zustand Store};
    B --> C{OpenSCAD Parser};
    C --> D[Abstract Syntax Tree (AST)];
    D --> E{AST-to-CSG Converter};
    E --> F[3D Geometry (Meshes)];
    F --> G{React Three Fiber Renderer};
    G --> H[Interactive 3D Scene];
    B --> H;
```

## 2. Core Technologies

- **Frontend:** React 19, TypeScript 5.8, Vite
- **3D Rendering:** React Three Fiber, three.js
- **CSG:** A custom `three-csg-ts` based utility.
- **Code Editor:** Monaco Editor
- **State Management:** Zustand 5
- **Styling:** Tailwind CSS v4 (with a custom "Glass Morphism" design system)
- **Parsing:** `@holistic-stack/openscad-parser`
- **Testing:** Vitest (unit/integration), Playwright (E2E)

## 3. Key Project Rules & Conventions

- **TypeScript First:** This is a TypeScript-only project. No JavaScript is allowed.
- **Immutability:** All data structures, especially state managed by Zustand, must be immutable. Use `readonly` and `Object.freeze()`.
- **Functional Programming:** We prefer pure functions, function composition, and avoiding side effects.
- **Error Handling:** Use the custom `Result<T, E>` type for any operation that might fail. Avoid `try...catch` in business logic where `Result` is more appropriate.
- **TDD is Mandatory:** Write tests *before* you write implementation code.
- **No Mocks for the Parser:** When testing anything that involves the OpenSCAD parser, use a *real* instance of the parser, not a mock.
- **Co-location:** Tests, types, and styles are located in the same directory as the component or module they belong to.
- **File Naming:** `kebab-case.ts` (e.g., `my-utility.ts`), `kebab-case.tsx` for components, `use-kebab-case.ts` for hooks.
- **Logging:** Use the structured logger (`[INIT]`, `[DEBUG]`, etc.). See `docs/logging/tslog-integration.md`.

## 4. Project Structure (`bulletproof-react`)

The project follows the "bulletproof-react" architecture.

- `src/features`: Contains self-contained modules like the `code-editor` or `3d-renderer`. This is where most of the work happens.
- `src/shared`: Contains code that is reused across multiple features, like UI components, hooks, and utility functions.
- `src/app`: Contains application-wide setup, like layout and context providers.
- `src/test`: Contains testing utilities and mock data.

## 5. How to Get Started

**1. Install Dependencies:**
```bash
pnpm install
```

**2. Run the Development Server:**
```bash
pnpm dev
```

**3. Run Tests:**
```bash
pnpm test
```

**4. Run Linting and Type Checking:**
This is a mandatory step before committing code.
```bash
pnpm type-check
pnpm biome:check
```

## 6. The Core Workflow (A Day in the Life)

A typical task, like adding a new feature, looks like this:

1.  **Create a new feature directory:** `src/features/new-feature`.
2.  **Define state (if needed):** Add a new "slice" to the Zustand store (`src/features/store/slices`).
3.  **Write a failing test:** Create `new-feature.test.ts` and write a test that describes what the feature should do. It will fail.
4.  **Implement the feature:** Write the code for the components, hooks, and services for your new feature.
5.  **Make the test pass:** Run `pnpm test` until your new test (and all others) pass.
6.  **Verify:** Run `pnpm type-check` and `pnpm biome:check` to ensure code quality.
7.  **Commit:** Use the Conventional Commits format (e.g., `feat(new-feature): add support for XYZ`).

## 7. Key Concepts to Understand

- **Zustand Store (`src/features/store`):** This is the single source of truth for the application state. It's divided into "slices" for each feature (editor, parsing, rendering, etc.). All state changes happen through actions, and components subscribe to only the state they need for performance.

- **Code Editor (`src/features/code-editor`):** This feature provides the user interface for writing OpenSCAD code. It's built using the Monaco Editor, the same editor that powers VS Code. The `StoreConnectedEditor` component is the main entry point, and it's responsible for syncing the editor's content with the Zustand store.

- **OpenSCAD Parser (`src/features/openscad-parser`):** This feature is responsible for taking the raw OpenSCAD code (a string) and turning it into an AST. It uses the `@holistic-stack/openscad-parser` library, which is a wrapper around a `web-tree-sitter` grammar. The `UnifiedParserService` is the primary service used for parsing, and it's designed to be efficient and robust.

- **3D Renderer (`src/features/3d-renderer`):** This is where the 3D magic happens. It's a React Three Fiber-based component that takes the AST from the Zustand store and renders it. The main component is `StoreConnectedRenderer`, which ensures that all data flows through the store.

- **Rendering Pipeline:**
    1.  The `StoreConnectedRenderer` gets the latest AST from the store.
    2.  It passes the AST to the `R3FScene` component.
    3.  The `R3FScene` component uses the `primitive-renderer` and `csg-operations` services to convert each AST node into a `three.js` mesh.
    4.  The resulting meshes are rendered to the screen.

- **CSG Operations (`src/features/3d-renderer/services/csg-operations.ts`):** This service handles the core boolean operations (union, difference, intersection) that are fundamental to OpenSCAD. It uses a custom `three-csg-ts` based utility.

This guide should give you a solid foundation for contributing to the project. For more detailed information, please refer to the documents in the `/docs` directory.
