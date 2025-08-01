# OpenSCAD Babylon Project - Gemini Development Guide

Welcome to the OpenSCAD Babylon project! This guide provides instructions for using Gemini to assist with development.

## 1. Project Overview

**OpenSCAD Babylon** is a production-ready, web-based 3D model editor that uses OpenSCAD syntax for real-time 3D visualization. The project is built with React, TypeScript, and Babylon.js, and it follows the "bulletproof-react" architecture.

For a comprehensive understanding of the project, please refer to the detailed documentation in the `.gemini-ide.md` file.

## 2. How to Use Gemini

Gemini is here to help you with various development tasks, such as:

*   **Answering questions about the codebase:** Ask Gemini about the project's architecture, coding patterns, or any other aspect of the code.
*   **Generating code:** Ask Gemini to generate new components, services, or tests based on the project's conventions.
*   **Refactoring code:** Ask Gemini to refactor existing code to improve its readability, performance, or maintainability.
*   **Debugging code:** Ask Gemini to help you debug issues in your code.

To get started, simply ask Gemini a question or give it a task in plain English.

## 3. Key Project Rules & Conventions

When using Gemini, please adhere to the following project rules and conventions:

*   **TypeScript First:** This is a TypeScript-only project. No JavaScript is allowed.
*   **Immutability:** All data structures, especially state managed by Zustand, must be immutable.
*   **Functional Programming:** We prefer pure functions, function composition, and avoiding side effects.
*   **Error Handling:** Use the custom `Result<T, E>` type for any operation that might fail.
*   **TDD is Mandatory:** Write tests *before* you write implementation code.
*   **No Mocks for the Parser:** When testing anything that involves the OpenSCAD parser, use a *real* instance of the parser, not a mock.
*   **Co-location:** Tests, types, and styles are located in the same directory as the component or module they belong to.

For a complete list of rules and conventions, please refer to the `.gemini-ide.md` file.

## 4. Development Workflow

The development workflow is as follows:

1.  **Create a new feature directory:** `src/features/new-feature`.
2.  **Define state (if needed):** Add a new "slice" to the Zustand store (`src/features/store/slices`).
3.  **Write a failing test:** Create `new-feature.test.ts` and write a test that describes what the feature should do.
4.  **Implement the feature:** Write the code for the components, hooks, and services for your new feature.
5.  **Make the test pass:** Run `pnpm test` until your new test (and all others) pass.
6.  **Verify:** Run `pnpm type-check` and `pnpm biome:check` to ensure code quality.
7.  **Commit:** Use the Conventional Commits format (e.g., `feat(new-feature): add support for XYZ`).

For more details on the development workflow, please refer to the `.gemini-ide.md` file.
