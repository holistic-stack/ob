## OpenSCAD Parser Infrastructure Documentation

This document outlines the comprehensive structure of the `openscad-parser` feature, explaining the purpose of each directory and key file. This feature provides a complete parsing, AST manipulation, and error handling infrastructure for OpenSCAD code.

## 🏗️ Architecture Overview

The OpenSCAD parser follows a **bulletproof-react** architecture with feature-based organization, implementing:

- **Tree-sitter Integration**: Web-based CST parsing with OpenSCAD grammar
- **AST Generation**: Visitor pattern for semantic tree construction
- **Error Recovery**: Chain of Responsibility pattern with built-in strategies
- **Comprehensive Testing**: 100+ test files with real parser instances (no mocks)
- **Performance Optimization**: LRU caching, query management, and debounced parsing
- **Type Safety**: Strict TypeScript with Result<T,E> error patterns

## 📁 Directory Structure

### Root Directory (`src/features/openscad-parser/`)

**Core Parser Implementation**
- **`openscad-parser.ts`**: Main `OpenscadParser` class integrating Tree-sitter CST parsing, visitor-based AST generation, and error handling
- **`openscad-parser.test.ts`**: Comprehensive integration tests with real OpenSCAD code examples
- **`incremental-parsing.test.ts`**: Tests for incremental parsing and performance optimization
- **`node-location.ts`**: Source location tracking utilities for error reporting and IDE integration

### `ast/` - Abstract Syntax Tree Infrastructure

**Core AST Components**
- **`ast-types.ts`**: Complete TypeScript interfaces for all AST nodes (`CubeNode`, `TranslateNode`, `BinaryExpressionNode`, etc.)
- **`visitor-ast-generator.ts`**: `VisitorASTGenerator` class implementing visitor pattern for CST→AST transformation
- **`ast-generator.integration.test.ts`**: Integration tests for complete AST generation pipeline

#### `ast/visitors/` - Specialized AST Visitors (20+ Visitors)

**Core Visitors**
- **`primitive-visitor.ts`**: Handles cube, sphere, cylinder, and other primitive shapes
- **`transform-visitor.ts`**: Processes translate, rotate, scale transformations
- **`csg-visitor.ts`**: Manages union, difference, intersection boolean operations
- **`expression-visitor.ts`**: Evaluates mathematical and logical expressions
- **`function-visitor.ts`**: Handles function definitions and calls
- **`module-visitor.ts`**: Processes module definitions and instantiations
- **`control-structure-visitor.ts`**: Manages for loops, if-else statements

**Specialized Expression Visitors**
- **`binary-expression-visitor/`**: Binary operations (+, -, *, /, ==, !=, etc.)
- **`conditional-expression-visitor/`**: Ternary operators and conditional logic
- **`list-comprehension-visitor/`**: List comprehensions and generators
- **`range-expression-visitor/`**: Range expressions [start:step:end]
- **`unary-expression-visitor/`**: Unary operations (!, -, +)

**Statement Visitors**
- **`assign-statement-visitor/`**: Variable assignments
- **`assert-statement-visitor/`**: Assert statements for validation
- **`echo-statement-visitor/`**: Echo statements for debugging

#### `ast/extractors/` - Parameter Extraction System

**Primitive Extractors**
- **`cube-extractor.ts`**: Extracts size, center parameters from cube() calls
- **`sphere-extractor.ts`**: Extracts radius, center parameters from sphere() calls
- **`cylinder-extractor.ts`**: Extracts height, radius parameters from cylinder() calls

**Utility Extractors**
- **`parameter-extractor.ts`**: Generic parameter extraction framework
- **`value-extractor.ts`**: Type-safe value extraction with validation
- **`vector-extractor.ts`**: 3D vector parameter extraction
- **`color-extractor.ts`**: Color parameter extraction and validation
- **`module-parameter-extractor.ts`**: Module parameter extraction with defaults

#### `ast/evaluation/` - Expression Evaluation Engine

- **`expression-evaluator.ts`**: Main expression evaluation interface
- **`binary-expression-evaluator.ts`**: Binary expression evaluation with context
- **`expression-evaluation-context.ts`**: Evaluation context management
- **`expression-evaluator-registry.ts`**: Registry for custom evaluators

#### `ast/query/` - Performance Optimization

- **`query-manager.ts`**: Centralized query management for AST traversal
- **`lru-query-cache.ts`**: LRU cache for frequently accessed AST queries
- **`query-cache.ts`**: Generic caching interface for query results

#### `ast/registry/` - Visitor Management

- **`node-handler-registry.ts`**: Registry mapping CST node types to AST visitors
- **`default-node-handler-registry.ts`**: Default visitor mappings for OpenSCAD constructs
- **`node-handler-registry-factory.ts`**: Factory for creating configured registries

#### `ast/utils/` - AST Utilities

- **`ast-evaluator.ts`**: High-level AST evaluation utilities
- **`debug-utils.ts`**: Debugging helpers for AST inspection
- **`location-utils.ts`**: Source location manipulation utilities
- **`node-utils.ts`**: Generic AST node manipulation functions
- **`variable-utils.ts`**: Variable resolution and scope management
- **`vector-utils.ts`**: 3D vector mathematics utilities

### `cst/` - Concrete Syntax Tree Handling

**CST Processing**
- **`query-utils.ts`**: `QueryManager` class for Tree-sitter query execution
- **`cursor-utils/`**: Advanced CST traversal using tree cursors with logging
- **`queries/`**: Pre-defined `.scm` files for Tree-sitter queries (highlights, dependencies, function calls)

### `error-handling/` - Comprehensive Error Recovery System

**Core Error Handling**
- **`recovery-strategy-registry.ts`**: Central registry implementing Chain of Responsibility pattern for automatic error recovery
- **`error-handler.ts`**: Main `ErrorHandler` class managing recovery and logging
- **`simple-error-handler.ts`**: Lightweight error handler for basic scenarios
- **`logger.ts`**: Structured logging with levels (INFO, WARN, ERROR, DEBUG)

#### `error-handling/strategies/` - Built-in Recovery Strategies

**Automatic Recovery Strategies**
- **`missing-semicolon-strategy.ts`**: Automatically adds missing semicolons after statements
- **`unclosed-bracket-strategy.ts`**: Closes unmatched brackets, parentheses, and braces
- **`unknown-identifier-strategy.ts`**: Suggests corrections for misspelled identifiers
- **`type-mismatch-strategy.ts`**: Provides guidance for type-related errors
- **`recovery-strategy.ts`**: Base interface and factory for custom strategies

#### `error-handling/types/` - Error Type System

- **`error-types.ts`**: Comprehensive error type definitions for parsing and semantic errors

### `services/` - Parser Services

- **`parser-initialization.service.ts`**: Singleton service for Tree-sitter parser initialization with proper lifecycle management

### `types/` - Type Definitions

- **`ast.types.ts`**: Core AST type definitions and interfaces

## 🔧 Key Features & Capabilities

### 1. **Automatic Error Recovery**
- **Chain of Responsibility**: Sequential strategy evaluation until successful recovery
- **Built-in Strategies**: Missing semicolons, unclosed brackets, unknown identifiers
- **Human-readable Suggestions**: User-friendly error correction guidance
- **Extensible Architecture**: Support for custom recovery strategies

### 2. **Comprehensive AST Infrastructure**
- **20+ Specialized Visitors**: Each OpenSCAD construct has dedicated visitor
- **Parameter Extraction**: Type-safe extraction for all primitive shapes
- **Expression Evaluation**: Full mathematical and logical expression support
- **Performance Optimization**: LRU caching and query management

### 3. **Production-Ready Architecture**
- **Real Parser Testing**: 100+ test files using actual parser instances
- **Memory Management**: Proper Tree-sitter lifecycle management
- **Type Safety**: Strict TypeScript with Result<T,E> patterns
- **Performance Monitoring**: Debounced parsing with <16ms render targets

### 4. **Integration Points**
- **Zustand Store**: Seamless integration with application state management
- **Monaco Editor**: Real-time syntax highlighting and error reporting
- **React Three Fiber**: Direct AST→3D mesh conversion pipeline
- **Error Recovery**: Automatic code correction with user feedback

## 🚀 Usage Patterns

### Error Recovery Integration
```typescript
// Use existing recovery registry instead of custom Zustand logic
import { RecoveryStrategyRegistry } from './error-handling/recovery-strategy-registry';

const registry = new RecoveryStrategyRegistry();
const recoveredCode = registry.attemptRecovery(error, originalCode);
```

### AST Extraction
```typescript
// Use specialized extractors for parameter extraction
import { CubeExtractor } from './ast/extractors/cube-extractor';

const cubeParams = CubeExtractor.extractParameters(cubeNode);
```

### Custom Visitor Implementation
```typescript
// Extend base visitor for custom AST nodes
import { BaseASTVisitor } from './ast/visitors/base-ast-visitor';

class CustomVisitor extends BaseASTVisitor<CustomNode> {
  // Implementation
}
```

This infrastructure provides everything needed for robust OpenSCAD parsing, error recovery, and AST manipulation while maintaining high performance and type safety standards.