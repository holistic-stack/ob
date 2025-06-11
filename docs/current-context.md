# Current Context: OpenSCAD AST Visitor

## Overview

This document outlines the current state of the `OpenScadAstVisitor` implementation, which is responsible for traversing an OpenSCAD Abstract Syntax Tree (AST) and converting its nodes into Babylon.js meshes.

## Core Components

### 1. `OpenScadAstVisitor`
- **File:** `src/babylon-csg2/openscad-ast-visitor/openscad-ast-visitor.ts`
- **Purpose:** A visitor class that traverses the OpenSCAD AST and generates Babylon.js meshes.
- **Features Implemented:**
    - **Primitives:** `cube`, `sphere`, `cylinder`.
    - **CSG Operations:** `union`, `difference`, `intersection`.
    - **Transformations:** `translate`.
    - **Module Support:**
        - **Definition Resolution:** Collects and stores `module` definitions from the AST.
        - **Parameter Passing:** Handles formal and actual parameters, including default values and expression evaluation.
        - **Scoping:** Manages variable scopes for module calls, allowing for proper variable isolation and shadowing.
        - **Body Execution:** Executes the children of a module definition within its defined scope.
- **Key Logic:**
    - **Dispatch:** A `visit` method dispatches to specific `visit<NodeType>` methods.
    - **CSG Operations:**
        - Children are recursively visited and converted to meshes.
        - The appropriate CSG operation (`union`, `subtract`, `intersect`) is performed.
        - Original child meshes are disposed of to prevent memory leaks.
    - **Translate Transformation:**
        - Applies an *additive* translation to its child mesh's position.
        - If multiple children exist, they are implicitly unioned before the translation is applied.

### 2. `openscad-ast-visitor.test.ts`
- **File:** `src/babylon-csg2/openscad-ast-visitor/openscad-ast-visitor.test.ts`
- **Purpose:** A comprehensive test suite using `vitest` to validate the visitor's functionality.
- **Coverage:**
    - **Primitives:** Correct creation, sizing, and centering.
    - **CSG Operations:** Correct application for zero, one, and multiple children.
    - **Translate:**
        - Correct translation of single and multiple (unioned) children.
        - Verification of additive translation behavior.
        - Handling of nested translations.

## Dependencies
- **`@babylonjs/core`**: For 3D mesh creation and scene management.
- **`@babylonjs/core`**: For performing Constructive Solid Geometry (CSG2) operations.
- **`@holistic-stack/openscad-parser`**: For AST node type definitions.
- **`ExpressionEvaluator`**: Custom utility for evaluating OpenSCAD expressions within a given scope.
- **`vitest`**: For running the test suite.

## Current Status
- The implementation is stable and fully tested for primitives, CSG operations, and transformations.
- Initial support for OpenSCAD modules, including parameter passing and scoping, has been implemented.
- All TypeScript compilation errors (117+) have been resolved, ensuring a robust and type-safe pipeline.
- The codebase adheres to the project's functional programming guidelines by isolating logic and ensuring proper memory management.

## Next Steps: Variable Support

- **Objective**: Implement variable definition and usage support in the OpenSCAD to Babylon.js CSG2 pipeline.
- **Key AST Node**: `AssignmentNode` has been identified as the primary AST node for handling variable assignments (e.g., `x = 10;`).
    - `AssignmentNode` properties include `variable` (an `IdentifierNode` for the variable name) and `value` (a `ParameterValue` representing the assigned expression).
- **Implementation Plan**:
    1. **Extend `OpenScadAstVisitor`**: Add a `visitAssignmentNode` method to handle `AssignmentNode` instances.
    2. **Utilize `ExpressionEvaluator`**: Integrate `ExpressionEvaluator` to manage variable scopes and store assigned values.
    3. **Update Documentation**: Ensure `TODO.md`, `PROGRESS.md`, and `README.md` reflect the progress and next steps for variable support.

