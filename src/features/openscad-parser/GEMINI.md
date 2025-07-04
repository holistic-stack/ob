## OpenSCAD Parser Source File Structure

This document outlines the structure of the `openscad-parser` feature, explaining the purpose of each directory and key file.

### Root Directory (`src/features/openscad-parser/`)

This directory contains the main parser class and top-level test files.

- **`openscad-parser.ts`**: The main entry point for the parser. The `OpenscadParser` class integrates Tree-sitter for CST parsing, the visitor for AST generation, and the error handling mechanism.
- **`*.test.ts`**: These files contain Vitest unit and integration tests for the parser, covering aspects like AST generation, error handling, and incremental parsing.

### `ast/`

This directory is responsible for the Abstract Syntax Tree (AST). The AST is a high-level, semantic representation of the OpenSCAD code, which is easier to work with than the raw CST.

- **`ast-types.ts`**: Defines the TypeScript interfaces for all AST nodes (e.g., `CubeNode`, `TranslateNode`, `BinaryExpressionNode`). This file is crucial for type safety when working with the AST.
- **`visitor-ast-generator.ts`**: Contains the `VisitorASTGenerator` class, which walks the CST and uses a visitor pattern to construct the AST.
- **`visitors/`**: This subdirectory contains the individual visitor classes for each type of CST node. Each visitor is responsible for transforming a specific CST node into its corresponding AST node.
- **`extractors/`**: Utility functions for extracting specific information from the AST, such as parameter values.
- **`utils/`**: Helper functions for working with the AST.
- **`registry/`**: A registry for mapping CST node types to their corresponding AST visitor.
- **`index.ts`**: Exports all the necessary components from the `ast` directory.

### `cst/`

This directory handles the Concrete Syntax Tree (CST), which is the direct output from the Tree-sitter parser. The CST is a more literal representation of the source code, including all syntax details.

- **`query-utils.ts`**: The `QueryManager` class provides utilities for querying the CST using Tree-sitter queries. This is useful for finding specific nodes or patterns in the syntax tree.
- **`queries/`**: Contains `.scm` files with Tree-sitter queries for identifying specific language constructs (e.g., module definitions, function calls).

### `error-handling/`

This directory contains a comprehensive system for error handling, reporting, and recovery.

- **`simple-error-handler.ts`**: A basic implementation of the `IErrorHandler` interface that logs errors to the console. It's used in tests and simple scenarios.
- **`error-handler.ts`**: The main `ErrorHandler` class that manages error recovery and logging.
- **`logger.ts`**: A flexible `Logger` class for structured logging with different levels (INFO, WARN, ERROR).
- **`types/`**: Defines custom error types for different kinds of parsing and semantic errors.
- **`strategies/`**: Contains different error recovery strategies (e.g., for missing semicolons or unclosed brackets).
- **`index.ts`**: Exports the public API of the error handling system.