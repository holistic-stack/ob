# Architecture

This document provides a comprehensive technical deep dive into the OpenSCAD Parser architecture, design patterns, and implementation details.

## Overview

The OpenSCAD Parser follows a layered architecture that separates concerns and provides flexibility for different use cases. The design emphasizes type safety, performance, and maintainability.

## High-Level Architecture

```mermaid
graph TD
    A[OpenSCAD Source Code] --> B[Tree-sitter Parser]
    B --> C[Concrete Syntax Tree]
    C --> D[Enhanced Parser]
    D --> E[Visitor Chain]
    E --> F[PrimitiveVisitor]
    E --> G[TransformVisitor]
    E --> H[CSGVisitor]
    E --> I[ExpressionVisitor]
    F --> J[Structured AST]
    G --> J
    H --> J
    I --> J
    J --> K[Type-Safe AST Nodes]
    
    L[Error Handler] --> D
    L --> M[Error Collection]
    L --> N[Warning Collection]
    
    style A fill:#e1f5fe
    style K fill:#e8f5e8
    style L fill:#fff3e0
```

## Core Components

### 1. Core Parser and AST Generation

```mermaid
classDiagram
    class EnhancedOpenscadParser {
        +parseAST(code: string): ASTNode[]
        +parseCST(code: string): Tree
        +getLanguage(): Language
        +setErrorHandler(handler: IErrorHandler)
        +createErrorHandlerAdapter(): IErrorHandler
    }
    class VisitorASTGenerator {
      +constructor(cst: Tree, code: string, language: Language, errorHandler: IErrorHandler)
      +generate(): ASTNode[]
    }
    EnhancedOpenscadParser ..> VisitorASTGenerator : creates and uses
    VisitorASTGenerator o-- IErrorHandler : uses
    note for EnhancedOpenscadParser "Primary user-facing parser. Manages Tree-sitter parsing and delegates AST generation."
```

### 2. Visitor Pattern Classes

```mermaid
classDiagram
    class BaseASTVisitor {
        <<abstract>>
        +visitNode(node: CSTNode): ASTNode | null
        +visitStatement(node: CSTNode): ASTNode | null
        +createASTNodeForFunction(node: CSTNode, name: string, args: any[]): ASTNode | null
        #source: string
        #errorHandler: IErrorHandler
        +constructor(source: string, errorHandler: IErrorHandler)
    }
    class QueryVisitor {
        +constructor(source: string, tree: Tree, language: Language, compositeVisitor: CompositeVisitor, errorHandler: IErrorHandler)
        +visitNode(node: CSTNode): ASTNode | null
    }
    class CompositeVisitor {
        +visitors: ASTVisitor[]
        +visitNode(node: CSTNode): ASTNode | null
    }
    class ExpressionVisitor {
        +constructor(source: string, errorHandler: IErrorHandler)
        +dispatchSpecificExpression(node: CSTNode): ExpressionNode | ErrorNode | null
        +createExpressionNode(node: CSTNode): ExpressionNode | ErrorNode | null
        +visitRangeExpression(node: CSTNode): RangeExpressionNode | ErrorNode  // Delegates to RangeExpressionVisitor instance
    }
    class RangeExpressionVisitor {
        +constructor(parentVisitor: ExpressionVisitor, errorHandler: IErrorHandler)
        +visitRangeExpression(node: CSTNode): RangeExpressionNode | ErrorNode
        +visitNode(node: CSTNode): ASTNode | null
    }
    class PrimitiveVisitor { +constructor(source: string, errorHandler: IErrorHandler) }
    class TransformVisitor { +constructor(source: string, compositeVisitor: CompositeVisitor, errorHandler: IErrorHandler) }
    class CSGVisitor { +constructor(source: string, errorHandler: IErrorHandler) }
    class ModuleVisitor { +constructor(source: string, errorHandler: IErrorHandler) }
    class FunctionVisitor { +constructor(source: string, errorHandler: IErrorHandler) }
    class ControlStructureVisitor { +constructor(source: string, errorHandler: IErrorHandler) }
    class AssignStatementVisitor { +constructor(source: string, errorHandler: IErrorHandler) }
    class AssertStatementVisitor { +constructor(source: string, errorHandler: IErrorHandler) }
    class EchoStatementVisitor { +constructor(source: string, errorHandler: IErrorHandler) }
    class VariableVisitor { +constructor(source: string, errorHandler: IErrorHandler) }

    QueryVisitor --|> BaseASTVisitor
    CompositeVisitor --|> BaseASTVisitor
    ExpressionVisitor --|> BaseASTVisitor
    RangeExpressionVisitor --|> BaseASTVisitor
    PrimitiveVisitor --|> BaseASTVisitor
    TransformVisitor --|> BaseASTVisitor
    CSGVisitor --|> BaseASTVisitor
    ModuleVisitor --|> BaseASTVisitor
    FunctionVisitor --|> BaseASTVisitor
    ControlStructureVisitor --|> BaseASTVisitor
    AssignStatementVisitor --|> BaseASTVisitor
    AssertStatementVisitor --|> BaseASTVisitor
    EchoStatementVisitor --|> BaseASTVisitor
    VariableVisitor --|> BaseASTVisitor

    QueryVisitor o-- CompositeVisitor : uses
    CompositeVisitor o-- ExpressionVisitor : has-a (part of visitors list)
    CompositeVisitor o-- PrimitiveVisitor : has-a
    CompositeVisitor o-- TransformVisitor : has-a
    CompositeVisitor o-- CSGVisitor : has-a
    CompositeVisitor o-- ModuleVisitor : has-a
    CompositeVisitor o-- FunctionVisitor : has-a
    CompositeVisitor o-- ControlStructureVisitor : has-a
    CompositeVisitor o-- AssignStatementVisitor : has-a
    CompositeVisitor o-- AssertStatementVisitor : has-a
    CompositeVisitor o-- EchoStatementVisitor : has-a
    CompositeVisitor o-- VariableVisitor : has-a

    ExpressionVisitor o-- RangeExpressionVisitor : creates and uses
    note for VisitorASTGenerator "Orchestrates AST generation using QueryVisitor and CompositeVisitor."
```

### 3. Visitor Chain Processing

```mermaid
sequenceDiagram
    participant EV as ExpressionVisitor
    participant REV as RangeExpressionVisitor
    participant AST as AST Generator

    EV->>EV: createExpressionNode(node)
    EV->>EV: Check node.type
    alt node.type === 'range_expression'
        EV->>REV: visitRangeExpression(node)
        REV->>REV: Process range_expression node
        REV->>AST: Create RangeExpressionNode
    else node.type === 'array_literal'
        EV->>REV: visitRangeExpression(node)
        REV->>REV: visitArrayLiteralAsRange(node)
        REV->>REV: Regex pattern detection
        alt Pattern matches range
            REV->>AST: Create RangeExpressionNode
        else No range pattern
            REV->>EV: Return null
        end
    end
    AST-->>EV: RangeExpressionNode | null
    EV-->>EV: Continue processing
```

### 4. Error Handling System

```mermaid
classDiagram
    class IErrorHandler {
        <<Interface>>
        +logInfo(message: string): void
        +logWarning(message: string): void
        +handleError(error: Error | string): void
    }
    class SimpleErrorHandler {
        +logInfo(message: string): void
        +logWarning(message: string): void
        +handleError(error: Error | string): void
        +getErrors(): string[]
        +getWarnings(): string[]
        +getInfos(): string[]
        +hasErrors(): boolean
        +hasWarnings(): boolean
        +clear(): void
    }
    class ErrorHandler { // Main, more comprehensive handler
        +constructor(options?: ErrorHandlerOptions)
        +report(error: ParserError): void
        +attemptRecovery(error: ParserError, code: string): string | null
        +getErrors(): readonly ParserError[]
        +getErrorsBySeverity(minSeverity: Severity): ParserError[]
        +clearErrors(): void
        +hasErrors(): boolean
        +hasCriticalErrors(): boolean
        +logError(message: string, context?: string, node?: any): void
        +logWarning(message: string, context?: string, node?: any): void
        +logInfo(message: string, context?: string, node?: any): void
        +handleError(error: Error, context?: string, node?: any): void
        +createParserError(...): ParserError
        +createSyntaxError(...): SyntaxError
        +createTypeError(...): TypeError
    }
    class ParserError { // Base error type from ./types/error-types.js
        +message: string
        +errorCode: string
        +location?: SourceLocation
        +severity: Severity
        +originalError?: Error
    }
    class SyntaxError extends ParserError {}
    class TypeError extends ParserError {}
    class RuntimeError extends ParserError {}
    class SemanticError extends ParserError {}

    SimpleErrorHandler ..|> IErrorHandler : implements
    ErrorHandler ..> IErrorHandler : (can be adapted via EnhancedOpenscadParser.createErrorHandlerAdapter)
    ErrorHandler o-- ParserError : creates
    note for IErrorHandler "Minimal interface typically used by visitors. Actual methods: logInfo, logWarning, handleError(Error|string)."
    note for ErrorHandler "Primary, more comprehensive error handler. Not directly implementing IErrorHandler for visitor use but adaptable."
    note "No distinct 'ParseWarning' object type. Warnings are string messages logged via logWarning."
```

### 5. Data Flow

#### Parsing Pipeline

```mermaid
flowchart TD
    A[OpenSCAD Code] --> B[Tree-sitter Parser]
    B --> C{Parse Success?}
    C -->|Yes| D[CST Generation]
    C -->|No| E[Syntax Errors]
    E --> F[Error Handler]
    D --> G[Enhanced Parser]
    G --> H[Visitor Chain]
    H --> I[AST Node Creation]
    I --> J[Type Validation]
    J --> K{Valid?}
    K -->|Yes| L[Structured AST]
    K -->|No| M[Semantic Errors]
    M --> F
    F --> N[Error Collection]
    L --> O[Final Result]
    N --> O
    
    style A fill:#e1f5fe
    style O fill:#e8f5e8
    style F fill:#ffebee
```

### Memory Management

```mermaid
sequenceDiagram
    participant U as User Code
    participant EP as EnhancedParser
    participant OP as OpenscadParser
    participant TS as Tree-sitter
    participant V as Visitors
    
    U->>EP: new EnhancedParser()
    EP->>OP: new OpenscadParser()
    U->>EP: init()
    EP->>OP: init()
    OP->>TS: Load WASM & Grammar
    EP->>V: Initialize visitors
    
    loop Parsing Operations
        U->>EP: parseAST(code)
        EP->>OP: parse(code)
        OP->>TS: parse(code)
        TS-->>OP: Tree
        OP-->>EP: Tree
        EP->>V: visit(tree.rootNode)
        V-->>EP: ASTNode[]
        EP-->>U: ASTNode[]
    end
    
    U->>EP: dispose()
    EP->>OP: dispose()
    OP->>TS: delete parser
    EP->>V: cleanup
```

## Performance Characteristics

### Time Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| CST Parsing | O(n) | Linear with input size |
| AST Generation | O(n) | Single pass through CST |
| Node Lookup | O(1) | Direct access via type guards |
| Tree Traversal | O(n) | Visits each node once |
| Incremental Update | O(log n) | Tree-sitter incremental parsing |

### Space Complexity

| Component | Space Usage | Notes |
|-----------|-------------|-------|
| CST | O(n) | Preserves all syntax information |
| AST | O(k) | Where k < n (structured representation) |
| Error Collection | O(e) | Where e = number of errors |
| Parser State | O(1) | Constant overhead |

### Optimization Strategies

1. **Parser Reuse**: Reuse parser instances for multiple operations
2. **Incremental Parsing**: Use tree-sitter's incremental parsing for large files
3. **Lazy Evaluation**: Generate AST nodes only when needed
4. **Memory Pooling**: Reuse AST node objects where possible

## Design Patterns

### 1. Visitor Pattern

**Purpose**: Separate AST node processing logic from node structure

**Benefits**:
- Easy to add new operations without modifying node classes
- Supports different processing strategies
- Maintains type safety

**Implementation**:
```typescript
abstract class BaseASTVisitor {
  abstract visit(node: TreeSitter.SyntaxNode): ASTNode | null;
  
  protected visitChildren(node: TreeSitter.SyntaxNode): ASTNode[] {
    const results: ASTNode[] = [];
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        const result = this.visit(child);
        if (result) results.push(result);
      }
    }
    return results;
  }
}
```

### 2. Chain of Responsibility

**Purpose**: Allow multiple visitors to process the same node

**Benefits**:
- Flexible processing pipeline
- Easy to add/remove processors
- Fail-safe delegation

### 3. Factory Pattern

**Purpose**: Create appropriate AST nodes based on CST node types

**Benefits**:
- Centralized node creation logic
- Type-safe node instantiation
- Easy to extend with new node types

### 4. Strategy Pattern

**Purpose**: Different error handling strategies

**Benefits**:
- Pluggable error handling
- Different strategies for different contexts
- Easy testing with mock handlers

## Integration Points

### Tree-sitter Integration

```mermaid
graph LR
    A[OpenSCAD Grammar] --> B[tree-sitter-openscad]
    B --> C[WASM Binary]
    C --> D[OpenscadParser]
    D --> E[CST]
    E --> F[EnhancedParser]
    
    style A fill:#e1f5fe
    style C fill:#fff3e0
    style E fill:#f3e5f5
```

### Monorepo Integration

```mermaid
graph TD
    A[packages/tree-sitter-openscad] --> B[Grammar Definition]
    B --> C[WASM Build]
    C --> D[packages/openscad-parser]
    D --> E[TypeScript Parser]
    E --> F[packages/openscad-editor]
    E --> G[packages/openscad-demo]
    
    style A fill:#e8f5e8
    style D fill:#e1f5fe
    style F fill:#fff3e0
    style G fill:#f3e5f5
```

## Testing Architecture

### Real Parser Pattern

The library follows the "Real Parser Pattern" for testing:

```mermaid
sequenceDiagram
    participant T as Test
    participant P as Parser
    participant TS as Tree-sitter
    
    T->>P: new EnhancedParser()
    T->>P: init()
    P->>TS: Load real WASM
    
    loop Each Test
        T->>P: parseAST(testCode)
        P->>TS: Real parsing
        TS-->>P: Real CST
        P-->>T: Real AST
        T->>T: Assert on real results
    end
    
    T->>P: dispose()
    P->>TS: Cleanup real resources
```

**Benefits**:
- Tests real integration between components
- Catches actual parsing issues
- Provides confidence in production behavior
- No mock maintenance overhead

## Extension Points

### Custom Visitors

```typescript
class CustomVisitor extends BaseASTVisitor {
  visit(node: TreeSitter.SyntaxNode): ASTNode | null {
    // Custom processing logic
    switch (node.type) {
      case 'custom_construct':
        return this.createCustomNode(node);
      default:
        return super.visit(node);
    }
  }
  
  private createCustomNode(node: TreeSitter.SyntaxNode): CustomNode {
    // Custom node creation
  }
}
```

### Custom Error Handlers

```typescript
class LoggingErrorHandler implements IErrorHandler {
  handleError(error: ParseError): void {
    console.error(`Parse error: ${error.message}`);
    // Send to logging service
  }
  
  handleWarning(warning: ParseWarning): void {
    console.warn(`Parse warning: ${warning.message}`);
  }
  
  // ... other methods
}
```

### Custom AST Nodes

```typescript
interface CustomNode extends ASTNode {
  type: 'custom';
  customProperty: string;
}

function isCustomNode(node: ASTNode): node is CustomNode {
  return node.type === 'custom';
}
```

## Future Considerations

### Scalability

1. **Streaming Parser**: For very large files
2. **Worker Thread Support**: Offload parsing to web workers
3. **Caching**: Cache parsed results for unchanged code
4. **Lazy Loading**: Load grammar modules on demand

### Extensibility

1. **Plugin System**: Allow third-party extensions
2. **Custom Grammars**: Support for OpenSCAD extensions
3. **Multiple Backends**: Support different parsing engines
4. **Language Server**: IDE integration capabilities
