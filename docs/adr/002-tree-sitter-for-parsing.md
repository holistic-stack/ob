# ADR-002: Use Tree-sitter for OpenSCAD Parsing

## Status
Accepted

## Date
2024-12-19

## Context

The OpenSCAD Babylon project requires robust parsing of OpenSCAD code to generate Abstract Syntax Trees (AST) for 3D rendering. The primary parsing approaches considered were:

1. **Tree-sitter** - Incremental parsing system with error recovery
2. **ANTLR** - Parser generator with grammar-based approach
3. **Custom Parser** - Hand-written recursive descent parser
4. **PEG.js** - Parsing Expression Grammar generator

### Requirements
- Accurate OpenSCAD syntax parsing
- Error recovery and partial parsing capabilities
- Real-time parsing for editor integration
- WebAssembly compatibility for browser execution
- Comprehensive AST generation
- Performance suitable for interactive applications

### Evaluation Criteria
- **Accuracy**: Correct parsing of OpenSCAD syntax
- **Performance**: Speed suitable for real-time applications
- **Error Handling**: Graceful error recovery and reporting
- **Incremental Parsing**: Support for efficient re-parsing
- **Browser Support**: WebAssembly compatibility
- **Maintenance**: Grammar updates and community support

## Decision

We chose **Tree-sitter** as the OpenSCAD parsing engine for the following reasons:

### 1. Superior Error Recovery
Tree-sitter provides exceptional error recovery capabilities, allowing partial parsing of malformed OpenSCAD code. This is crucial for real-time editor integration where users frequently have incomplete or syntactically incorrect code.

### 2. Incremental Parsing Performance
Tree-sitter's incremental parsing algorithm efficiently re-parses only the changed portions of code, making it ideal for interactive applications with frequent code updates.

### 3. WebAssembly Support
Tree-sitter compiles to WebAssembly, providing near-native parsing performance in web browsers without requiring server-side processing.

### 4. Robust Grammar System
Tree-sitter's grammar system is well-suited for OpenSCAD's syntax, handling:
- Nested expressions and function calls
- Module definitions and instantiations
- Complex parameter lists and expressions
- Comments and whitespace handling

### 5. Production-Ready Ecosystem
Tree-sitter is used by major editors (GitHub, Atom, Neovim) and has proven reliability in production environments.

### 6. Comprehensive AST Generation
Tree-sitter generates detailed Concrete Syntax Trees (CST) that can be efficiently converted to semantic Abstract Syntax Trees (AST).

## Consequences

### Positive
- **Error Resilience**: Graceful handling of syntax errors with partial parsing
- **Performance**: Fast incremental parsing suitable for real-time applications
- **Browser Compatibility**: WebAssembly execution without server dependencies
- **Editor Integration**: Excellent support for syntax highlighting and code analysis
- **Maintenance**: Active community and regular grammar updates
- **Debugging**: Detailed parse trees aid in debugging parsing issues
- **Extensibility**: Grammar can be extended for custom OpenSCAD features

### Negative
- **Complexity**: More complex setup compared to simple parser generators
- **Bundle Size**: WebAssembly binary adds to application bundle size
- **Learning Curve**: Tree-sitter concepts require team training
- **Grammar Maintenance**: Custom grammar requires ongoing maintenance

### Mitigation Strategies
- **Documentation**: Comprehensive documentation of Tree-sitter integration patterns
- **Bundle Optimization**: Lazy loading of parser WebAssembly for reduced initial bundle
- **Grammar Testing**: Extensive test suite for OpenSCAD grammar validation
- **Fallback Parsing**: Graceful degradation when parsing fails completely

## Implementation Notes

### Key Tree-sitter Features Used
- **Error Recovery**: Partial parsing of malformed code
- **Incremental Parsing**: Efficient re-parsing of code changes
- **Query System**: Efficient AST node querying and extraction
- **WebAssembly Runtime**: Browser-compatible execution

### Integration Patterns
```typescript
// Parser initialization
import Parser from 'web-tree-sitter';
await Parser.init();
const parser = new Parser();
const language = await Parser.Language.load('tree-sitter-openscad.wasm');
parser.setLanguage(language);

// Parsing with error recovery
const tree = parser.parse(openscadCode);
if (tree.rootNode.hasError()) {
  // Handle syntax errors gracefully
  const errors = extractSyntaxErrors(tree.rootNode);
}

// Incremental parsing
const newTree = parser.parse(newCode, tree);
```

### Performance Characteristics
- **Initial Parse**: <50ms for typical OpenSCAD files
- **Incremental Parse**: <10ms for small changes
- **Memory Usage**: Efficient tree representation
- **Bundle Size**: ~200KB WebAssembly binary

### OpenSCAD Grammar Coverage
- **Primitives**: cube, sphere, cylinder, polyhedron
- **Transformations**: translate, rotate, scale, mirror
- **Boolean Operations**: union, difference, intersection
- **Control Flow**: for loops, if statements, conditionals
- **Modules**: module definitions and instantiations
- **Functions**: function definitions and calls
- **Variables**: variable assignments and references

## Alternatives Considered

### ANTLR
- **Pros**: Mature parser generator, extensive documentation, multiple target languages
- **Cons**: Limited error recovery, no incremental parsing, complex WebAssembly integration
- **Verdict**: Rejected due to poor error recovery and incremental parsing limitations

### Custom Parser
- **Pros**: Full control, optimized for specific use case, no external dependencies
- **Cons**: Significant development time, error recovery complexity, maintenance burden
- **Verdict**: Rejected due to development complexity and time constraints

### PEG.js
- **Pros**: Simple grammar syntax, JavaScript-native, good documentation
- **Cons**: Limited error recovery, no incremental parsing, performance limitations
- **Verdict**: Rejected due to error recovery and performance limitations

## Error Handling Strategy

### Syntax Error Recovery
```typescript
// Error detection and recovery
if (tree.rootNode.hasError()) {
  const errors = [];
  
  function findErrors(node: SyntaxNode) {
    if (node.type === 'ERROR') {
      errors.push({
        message: 'Syntax error',
        startPosition: node.startPosition,
        endPosition: node.endPosition
      });
    }
    
    for (const child of node.children) {
      findErrors(child);
    }
  }
  
  findErrors(tree.rootNode);
  return { success: false, errors };
}
```

### Partial AST Generation
Even with syntax errors, Tree-sitter generates partial ASTs that can be processed for:
- Syntax highlighting
- Code completion
- Partial 3D rendering
- Error reporting with context

## Performance Targets

- **Parse Time**: <50ms for files up to 1000 lines
- **Incremental Parse**: <10ms for typical edits
- **Memory Usage**: <10MB for large OpenSCAD files
- **Error Recovery**: <100ms for error detection and reporting

## References
- [Tree-sitter Documentation](https://tree-sitter.github.io/tree-sitter/)
- [Tree-sitter WebAssembly Guide](https://tree-sitter.github.io/tree-sitter/using-parsers#web-assembly)
- [OpenSCAD Language Reference](https://openscad.org/documentation.html)
- [Tree-sitter Grammar Development](https://tree-sitter.github.io/tree-sitter/creating-parsers)

## Related ADRs
- [ADR-007: Use Result Types for Error Handling](./007-result-types-error-handling.md)
- [ADR-013: Use 300ms Debouncing for Parsing](./013-300ms-debouncing-parsing.md)
