
# OpenSCAD Tree-sitter Grammar: LLM Development Guide

This guide provides a developer-focused overview of the OpenSCAD Tree-sitter grammar project, designed to quickly onboard new contributors.

## 1. Project Overview

- **Purpose**: To provide a robust, high-performance, and accurate Tree-sitter grammar for the OpenSCAD language.
- **Key Features**:
    - **Complete Language Support**: Parses all OpenSCAD syntax, including list comprehensions, `let` expressions, and function literals.
    - **Error Recovery**: Gracefully handles syntax errors.
    - **IDE Integration**: Includes queries for syntax highlighting, code folding, and symbol navigation.
    - **Multi-platform**: Supports Node.js, web (WASM), and native bindings.
- **Status**: Production-ready with 100% test coverage.

## 2. Core Concepts & Rules

### 2.1. OpenSCAD Language Basics

- **Modules**: Reusable blocks of code, defined with `module` and instantiated by name (e.g., `cube()`).
- **Functions**: Return values, defined with `function`.
- **Variables**: Assigned with `=`. Special variables start with `$` (e.g., `$fn`).
- **Transformations**: Modules like `translate()`, `rotate()`, `scale()` that modify child elements.
- **Control Flow**: `if/else`, `for` loops.
- **Data Structures**:
    - **Vectors**: Ordered lists of values, e.g., `[1, 2, 3]`.
    - **Ranges**: e.g., `[0:10]` or `[0:2:10]`.
- **List Comprehensions**: Generate lists programmatically, e.g., `[for (i = [0:4]) i*2]`.

### 2.2. Project-Specific Conventions

- **TypeScript First**: All new code should be in TypeScript.
- **Testing**: Co-located tests are preferred. Mocks are generally avoided, except for Three.js components.
- **Commits**: Follow conventional commit standards. Use feature branches.
- **Code Style**: Adhere to the existing style found in the codebase (ESLint is configured).

## 3. Project Structure

```
/
├── grammar.js            # The core Tree-sitter grammar definition.
├── package.json          # Project metadata, scripts, and dependencies.
├── queries/              # Tree-sitter queries for IDE features.
│   ├── highlights.scm    # Syntax highlighting.
│   ├── folds.scm         # Code folding.
│   ├── indents.scm       # Auto-indentation.
│   ├── locals.scm        # Local variable analysis.
│   └── tags.scm          # Symbol navigation (Go to Definition).
├── src/                  # C source code for the parser.
├── bindings/             # Bindings for different environments (Node, web).
├── test/                 # Test files.
│   └── corpus/           # Test cases in the form of .txt files.
└── README.md             # Detailed project documentation.
```

## 4. How to Work with the Code

### 4.1. The Grammar (`grammar.js`)

The grammar is defined using a JavaScript DSL. Key elements include:

- `rules`: Define the language syntax.
- `conflicts`: Resolve parsing ambiguities.
- `extras`: Define elements that can appear anywhere (e.g., whitespace, comments).

### 4.2. Testing (`test/corpus/`)

Tests are written in `.txt` files. Each file contains one or more test cases, separated by `==================`. A test case consists of:

1.  A description.
2.  A snippet of OpenSCAD code.
3.  `---` separator.
4.  The expected CST (Concrete Syntax Tree) output.

To run tests: `npm test`

### 4.3. Queries (`queries/`)

These files use a Lisp-like syntax to query the CST. They are essential for IDE integrations.

- `highlights.scm`: Assigns capture names (e.g., `@keyword`, `@string`) to nodes in the tree.
- `tags.scm`: Identifies definitions (modules, functions, variables) for symbol navigation.

## 5. Example CST (Concrete Syntax Tree)

For the following OpenSCAD code:

```openscad
module box(size) {
  cube(size);
}
```

The corresponding CST structure is:

```
(source_file
  (statement
    (module_definition
      name: (identifier)
      parameters: (parameter_list
        (parameter_declarations
          (parameter_declaration (identifier))))
      body: (block
        (statement
          (module_instantiation
            name: (identifier)
            arguments: (argument_list
              (arguments
                (argument (identifier))))))))))
```

This structure is what the grammar produces and what the query files operate on. Understanding this is key to modifying the grammar or writing new queries.

## 6. Advanced Examples

### 6.1. Nested List Comprehension

This example demonstrates a list comprehension nested within another, which is a powerful feature for generating complex data structures.

**Code:**
```openscad
data = [for (i = [0:2]) [for (j = [0:2]) i + j]];
```

**CST:**
```
(source_file
  (statement
    (assignment_statement
      name: (identifier)
      value: (list_comprehension
        (list_comprehension_for
          iterator: (identifier)
          range: (range_expression
            start: (number)
            end: (number)))
        expr: (list_comprehension
          (list_comprehension_for
            iterator: (identifier)
            range: (range_expression
              start: (number)
              end: (number)))
          expr: (binary_expression
            left: (identifier)
            operator: (addition_operator)
            right: (identifier))))))))
```

### 6.2. Function Literals (Anonymous Functions)

OpenSCAD supports anonymous functions, which can be assigned to variables and passed as arguments.

**Code:**
```openscad
add = function(a, b) a + b;
result = add(5, 10);
```

**CST:**
```
(source_file
  (statement
    (assignment_statement
      name: (identifier)
      value: (function_literal
        parameters: (parameter_list
          (parameter_declarations
            (parameter_declaration (identifier))
            (parameter_declaration (identifier))))
        body: (binary_expression
          left: (identifier)
          operator: (addition_operator)
          right: (identifier)))))
  (statement
    (assignment_statement
      name: (identifier)
      value: (call_expression
        function: (identifier)
        arguments: (argument_list
          (arguments
            (argument (number))
            (argument (number))))))))
```

### 6.3. `let` Expression with a `for` loop

The `let` expression can be used to create local variables within a specific scope, which is often combined with loops.

**Code:**
```openscad
module test() {
    for (i = [0:4]) {
        let(x = i * 10) {
            translate([x, 0, 0]) cube(5);
        }
    }
}
```

**CST:**
```
(source_file
  (statement
    (module_definition
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (statement
          (for_statement
            iterator: (identifier)
            range: (range_expression
              start: (number)
              end: (number))
            (block
              (statement
                (let_expression
                  (let_assignment
                    name: (identifier)
                    value: (binary_expression
                      left: (identifier)
                      operator: (multiplication_operator)
                      right: (number)))
                  body: (block
                    (statement
                      (module_instantiation
                        name: (identifier)
                        arguments: (argument_list
                          (arguments
                            (argument
                              (vector_expression
                                (identifier)
                                (number)
                                (number)))))
                        (statement
                          (module_instantiation
                            name: (identifier)
                            arguments: (argument_list
                              (arguments
                                (argument (number))))))))))))))))))
```
