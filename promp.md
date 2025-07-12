# OpenSCAD Parser Infrastructure Usage Guide

Important: you are on windows and the terminal is powershell;

## 🚨 **Critical Issue: Different Behavior Between Initial Load vs Monaco Editor Changes**

**OBSERVED BEHAVIOR**:
- ✅ **Initial Page Load**: Parse and render work correctly - meshes display properly
- ❌ **Monaco Editor Changes**: Meshes don't render correctly after code changes
- 🔍 **Root Cause**: Different code paths between initial load and editor updates

**INVESTIGATION FOCUS**:
The initial load path and the Monaco editor change path are **different**, causing rendering inconsistencies. This suggests:

1. **Different Parser Instances**: Initial load vs editor changes may use different parser instances
2. **State Management Issues**: Zustand store updates may not properly trigger re-rendering
3. **AST Processing Differences**: Different AST processing pipelines for initial vs incremental parsing
4. **Mesh Lifecycle Issues**: Existing meshes may not be properly cleaned up/replaced
5. **Debouncing Side Effects**: 300ms debouncing may interfere with proper state updates

**KEY INVESTIGATION AREAS**:
- Compare initial load pipeline vs Monaco `onChange` pipeline
- Check if parser instances are properly shared/reused
- Verify Zustand store subscription and re-rendering triggers
- Investigate mesh cleanup and replacement in React Three Fiber
- Analyze debounced parsing effects on state consistency

---

## 🎯 **Core Principle: Use Existing Infrastructure, Avoid Zustand Implementation**

**✅ DO**: Leverage the comprehensive `src/features/openscad-parser/` infrastructure
**❌ DON'T**: Implement parsing logic directly in Zustand slices

## 🏗️ **Architecture Overview**

The OpenSCAD parser feature provides a **complete, production-ready infrastructure** with 100+ files organized following bulletproof-react patterns:

```
src/features/openscad-parser/
├── 📁 ast/                    # Abstract Syntax Tree infrastructure
├── 📁 cst/                    # Concrete Syntax Tree handling
├── 📁 error-handling/         # Comprehensive error recovery system
├── 📁 services/               # Parser initialization services
├── 📁 types/                  # Type definitions
└── 📁 utils/                  # Utility functions
```

## 🔧 **Key Components to Use**

### 1. **Error Recovery System** ⭐ **USE THIS INSTEAD OF ZUSTAND**

**Primary Component**: `error-handling/recovery-strategy-registry.ts`

```typescript
// ✅ CORRECT: Use existing recovery registry
import { RecoveryStrategyRegistry } from './error-handling/recovery-strategy-registry';

const registry = new RecoveryStrategyRegistry();
const recoveredCode = registry.attemptRecovery(error, originalCode);

// ❌ WRONG: Don't implement recovery in Zustand slice
// const parseCode = (code) => { /* custom error handling */ }
```

**Built-in Recovery Strategies**:
- `missing-semicolon-strategy.ts` - Automatically adds missing semicolons
- `unclosed-bracket-strategy.ts` - Closes unmatched brackets/parentheses
- `unknown-identifier-strategy.ts` - Suggests corrections for typos
- `type-mismatch-strategy.ts` - Provides type-related error guidance

### 2. **AST Generation & Processing**

**Core Components**:
- `ast/visitor-ast-generator.ts` - Main AST generation engine
- `ast/visitors/` - 20+ specialized visitors for each OpenSCAD construct
- `ast/extractors/` - Parameter extraction for primitives (cube, sphere, cylinder)

```typescript
// ✅ Use specialized extractors
import { CubeExtractor } from './ast/extractors/cube-extractor';
import { SphereExtractor } from './ast/extractors/sphere-extractor';

const cubeParams = CubeExtractor.extractParameters(cubeNode);
const sphereParams = SphereExtractor.extractParameters(sphereNode);
```

### 3. **Parser Initialization**

**Service**: `services/parser-initialization.service.ts`

```typescript
// ✅ Use singleton parser service
import { initializeParser, getInitializedParser } from './services/parser-initialization.service';

const initResult = await initializeParser();
const parser = getInitializedParser();
```

## 🚨 **Tree-sitter Grammar Issue Analysis**

Based on your description of tree-sitter grammar corruption, here are the likely causes and solutions:

### **Issue 1: Parser Version Compatibility**

**Problem**: web-tree-sitter 0.25.3 compatibility with openscad-parser
**Solution**: Use the existing parser initialization service

```typescript
// ✅ Use tested initialization service
import { initializeParser } from './services/parser-initialization.service';

// This handles version compatibility and proper initialization
const result = await initializeParser();
```

### **Issue 2: Application-Level AST Processing**

**Problem**: Corruption during TypeScript AST processing, not grammar itself
**Investigation Points**:

1. **Parameter Extraction Issues** (Different behavior between paths):
   ```typescript
   // Check these extractors for parameter corruption
   ast/extractors/cube-extractor.ts      // Initial load: ✅ Works
   ast/extractors/sphere-extractor.ts    // Editor change: ❌ Fails
   ast/extractors/cylinder-extractor.ts  // Compare extraction results

   // Debug parameter extraction differences
   const initialParams = CubeExtractor.extractParameters(initialAST);
   const editorParams = CubeExtractor.extractParameters(editorAST);
   console.log('Parameter extraction diff:', initialParams, editorParams);
   ```

2. **Visitor Processing Issues** (Path-dependent corruption):
   ```typescript
   // Check these visitors for AST corruption
   ast/visitors/primitive-visitor.ts     // Initial: ✅ Creates meshes
   ast/visitors/expression-visitor.ts    // Editor: ❌ Mesh creation fails
   ast/visitors/transform-visitor.ts     // Compare visitor outputs

   // Debug visitor processing differences
   const initialVisitorResult = PrimitiveVisitor.visit(initialCST);
   const editorVisitorResult = PrimitiveVisitor.visit(editorCST);
   ```

3. **Memory Management Issues** (Parser instance reuse):
   ```typescript
   // Check cursor utilities for memory leaks between paths
   cst/cursor-utils/cursor-utils.ts
   cst/cursor-utils/cstTreeCursorWalkLog.ts

   // Debug parser instance lifecycle
   console.log('Parser memory state:', parser.getMemoryUsage());
   ```

4. **State Synchronization Issues** (Monaco → Zustand → R3F):
   ```typescript
   // Check state flow between Monaco editor changes and rendering
   // Monaco onChange → debounced update → Zustand → React Three Fiber

   // Debug state synchronization
   const storeState = useStore.getState();
   console.log('Store AST vs Rendered meshes:', {
     astNodes: storeState.parsing.ast.length,
     renderedMeshes: storeState.rendering?.meshes.length
   });
   ```

### **Issue 3: Caching/State Issues**

**Problem**: AST caching causing stale or corrupted data
**Investigation Points**:

```typescript
// Check these caching components
ast/query/lru-query-cache.ts
ast/query/query-cache.ts
ast/query/query-manager.ts
```

## 🔍 **Debugging Strategy**

### **Step 1: Compare Initial Load vs Monaco Editor Change Paths**

**Initial Load Path Investigation**:
```typescript
// Trace the initial load pipeline
1. App startup → Store initialization
2. Initial code loading → parseCode() call
3. AST generation → mesh creation
4. React Three Fiber rendering → ✅ SUCCESS
```

**Monaco Editor Change Path Investigation**:
```typescript
// Trace the editor change pipeline
1. Monaco onChange → debounced update (300ms)
2. Zustand updateCode() → parseCode() call
3. AST generation → mesh creation attempt
4. React Three Fiber rendering → ❌ FAILURE
```

**Key Comparison Points**:
```typescript
// Check these differences between paths:
- Parser instance reuse vs new instance creation
- Zustand store state consistency between paths
- AST processing pipeline differences
- Mesh cleanup/replacement strategies
- React Three Fiber re-rendering triggers
```

### **Step 2: Use Existing Debug Utilities**

```typescript
// Use built-in debugging tools
import { DebugUtils } from './ast/utils/debug-utils';
import { ASTErrorUtils } from './ast/utils/ast-error-utils';

// Enable debug logging for both paths
const debugResult = DebugUtils.analyzeAST(ast);
const errorAnalysis = ASTErrorUtils.analyzeErrors(errors);

// Compare AST outputs between initial load and editor changes
console.log('Initial Load AST:', initialAST);
console.log('Editor Change AST:', editorAST);
```

### **Step 3: Investigate Parser Instance Management**

```typescript
// Check parser instance consistency
import { getInitializedParser } from './services/parser-initialization.service';

// Verify same parser instance is used for both paths
const initialParser = getInitializedParser(); // Initial load
const editorParser = getInitializedParser();  // Editor change

console.log('Same parser instance?', initialParser === editorParser);
```

### **Step 4: Debug Zustand Store State Flow**

```typescript
// Monitor store state changes
import { useStore } from '../store';

// Add logging to track state updates
const store = useStore();
store.subscribe((state) => {
  console.log('Store updated:', {
    ast: state.parsing.ast,
    meshes: state.rendering?.meshes,
    isLoading: state.parsing.isLoading
  });
});
```

### **Step 5: Test with Real Parser Instances**

```typescript
// ✅ Use real parser testing (already implemented)
// Check these test files for patterns:
openscad-parser.test.ts
ast/ast-generator.integration.test.ts
incremental-parsing.test.ts

// Test both code paths with same input
const testCode = 'cube([10, 10, 10]);';
const initialResult = testInitialLoadPath(testCode);
const editorResult = testEditorChangePath(testCode);
```

## 📋 **Implementation Checklist**

### **✅ Use These Existing Components**

- [ ] `error-handling/recovery-strategy-registry.ts` for error recovery
- [ ] `services/parser-initialization.service.ts` for parser setup
- [ ] `ast/extractors/` for parameter extraction
- [ ] `ast/visitors/` for AST processing
- [ ] `ast/utils/debug-utils.ts` for debugging
- [ ] `cst/query-utils.ts` for CST queries

### **❌ Avoid These Anti-patterns**

- [ ] Don't implement error recovery in Zustand slices
- [ ] Don't create custom AST visitors (use existing ones)
- [ ] Don't bypass the parser initialization service
- [ ] Don't implement custom parameter extraction (use extractors)

## 🎯 **Next Steps for Grammar Issues**

1. **Enable Debug Logging**:
   ```typescript
   // Use existing logger
   import { Logger } from './error-handling/logger';
   const logger = new Logger('ParserDebug');
   ```

2. **Test Specific Code Patterns**:
   ```typescript
   // Use existing test infrastructure
   ast/tests/cube.test.ts
   ast/tests/transformations.test.ts
   ast/tests/control-structures.test.ts
   ```

3. **Check Memory Management**:
   ```typescript
   // Investigate cursor utilities
   cst/cursor-utils/cursor-utils.ts
   ```

4. **Validate AST Structure**:
   ```typescript
   // Use AST validation utilities
   ast/utils/ast-evaluator.ts
   ast/utils/node-utils.ts
   ```

## 💡 **Key Takeaway**

Your OpenSCAD parser infrastructure is **comprehensive and production-ready**. The tree-sitter grammar corruption is likely happening at the **application processing level**, not the grammar itself. Use the existing debugging utilities and error recovery system to identify and fix the specific issues rather than implementing workarounds in the Zustand layer.

---

## 📁 **Complete File Structure Reference**

```
C:\USERS\LUCIANO\GIT\OPENSCAD-BABYLON\SRC\FEATURES\OPENSCAD-PARSER
│   argument-debug.test.ts              # Argument debugging tests
│   GEMINI.md                          # Comprehensive infrastructure documentation
│   incremental-parsing.test.ts        # Incremental parsing performance tests
│   index.ts                           # Main feature exports
│   node-location.ts                   # Source location tracking utilities
│   node-types.test.ts                 # Node type validation tests
│   openscad-ast.test.ts              # AST generation integration tests
│   openscad-parser-error-handling.test.ts  # Error handling integration tests
│   openscad-parser-visitor.test.ts    # Visitor pattern tests
│   openscad-parser.test.ts           # Main parser integration tests
│   openscad-parser.ts                # 🎯 Main OpenscadParser class
│
├───ast                               # 🏗️ Abstract Syntax Tree Infrastructure
│   │   ast-generator.integration.test.ts  # AST generation pipeline tests
│   │   ast-types.ts                  # 📋 Core AST type definitions
│   │   index.ts                      # AST feature exports
│   │   visitor-ast-generator.test.ts # Visitor generator tests
│   │   visitor-ast-generator.ts      # 🎯 Main AST generator using visitor pattern
│   │
│   ├───changes                       # AST change tracking
│   │       change-tracker.test.ts
│   │       change-tracker.ts
│   │
│   ├───errors                        # AST error handling
│   │       index.ts
│   │       parser-error.test.ts
│   │       parser-error.ts           # 🎯 Core parser error types
│   │       recovery-strategy.test.ts
│   │       recovery-strategy.ts      # 🎯 Recovery strategy interface
│   │       semantic-error.ts
│   │       syntax-error.test.ts
│   │       syntax-error.ts
│   │
│   ├───evaluation                    # 🧮 Expression evaluation engine
│   │   │   binary-expression-evaluator.ts
│   │   │   expression-evaluation-context.ts
│   │   │   expression-evaluation.test.ts
│   │   │   expression-evaluator-registry.ts
│   │   │   expression-evaluator.ts
│   │   │
│   │   └───binary-expression-evaluator
│   │           binary-expression-evaluator-cube.test.ts
│   │           binary-expression-evaluator.test.ts
│   │           binary-expression-evaluator.ts
│   │
│   ├───extractors                    # 🔧 Parameter extraction system
│   │       argument-extractor.ts
│   │       color-extractor.ts
│   │       cube-extractor.test.ts
│   │       cube-extractor.ts         # 🎯 Cube parameter extraction
│   │       cylinder-extractor.ts     # 🎯 Cylinder parameter extraction
│   │       direct-binary-expression-test.ts
│   │       extractValue.vector.test.ts
│   │       index.ts
│   │       minimal-cube-test.ts
│   │       module-parameter-extractor.test.ts
│   │       module-parameter-extractor.ts
│   │       offset-extractor.ts
│   │       parameter-extractor.ts    # 🎯 Generic parameter extraction
│   │       sphere-extractor.ts       # 🎯 Sphere parameter extraction
│   │       value-extractor.ts
│   │       vector-extractor.ts
│   │
│   ├───nodes                         # AST node definitions
│   │   │   ast-node.ts
│   │   │   expression.ts
│   │   │
│   │   └───expressions
│   │           binary-expression.ts
│   │
│   ├───query                         # 🚀 Performance optimization
│   │       index.ts
│   │       lru-query-cache.test.ts
│   │       lru-query-cache.ts        # 🎯 LRU cache for queries
│   │       query-cache.test.ts
│   │       query-cache.ts
│   │       query-manager.test.ts
│   │       query-manager.ts          # 🎯 Query management system
│   │
│   ├───registry                      # 🗂️ Visitor registry system
│   │       default-node-handler-registry.ts
│   │       index.ts
│   │       node-handler-registry-factory.ts
│   │       node-handler-registry.test.ts
│   │       node-handler-registry.ts  # 🎯 Visitor registry
│   │
│   ├───test-utils                    # Testing utilities
│   │       real-node-generator.test.ts
│   │       real-node-generator.ts    # 🎯 Real parser testing utilities
│   │
│   ├───tests                         # 🧪 Comprehensive test suite
│   │       control-structures.test.ts
│   │       cube-extractor.test.ts
│   │       cube.test.ts
│   │       cylinder-extractor.test.ts
│   │       difference.test.ts
│   │       intersection.test.ts
│   │       minkowski.test.ts
│   │       module-function.test.ts
│   │       primitive-visitor.test.ts
│   │       rotate.test.ts
│   │       scale.test.ts
│   │       sphere-extractor.test.ts
│   │       sphere.test.ts
│   │       transformations.test.ts
│   │       union.test.ts
│   │
│   ├───types                         # Type definitions
│   ├───utils                         # 🛠️ AST utilities
│   │       ast-error-utils.ts        # 🎯 Error analysis utilities
│   │       ast-evaluator.test.ts
│   │       ast-evaluator.ts
│   │       debug-utils.ts            # 🎯 Debug utilities
│   │       index.ts
│   │       location-utils.ts
│   │       node-utils.ts
│   │       variable-utils.ts
│   │       vector-utils.ts
│   │
│   └───visitors                      # 👥 20+ Specialized visitors
│       │   ast-visitor.ts
│       │   base-ast-visitor.test.ts
│       │   base-ast-visitor.ts       # 🎯 Base visitor class
│       │   composite-visitor-real.test.ts
│       │   composite-visitor.test.ts
│       │   composite-visitor.ts
│       │   control-structure-visitor.test.ts
│       │   control-structure-visitor.ts
│       │   csg-visitor.test.ts
│       │   csg-visitor.ts            # 🎯 CSG operations visitor
│       │   expression-visitor.debug.test.ts
│       │   expression-visitor.integration.test.ts
│       │   expression-visitor.simple.test.ts
│       │   expression-visitor.test.ts
│       │   expression-visitor.ts     # 🎯 Expression evaluation visitor
│       │   function-visitor.test.ts
│       │   function-visitor.ts
│       │   index.ts
│       │   module-visitor.test.ts
│       │   module-visitor.ts
│       │   primitive-visitor.test.ts
│       │   primitive-visitor.ts      # 🎯 Primitive shapes visitor
│       │   query-visitor.test.ts
│       │   query-visitor.ts
│       │   transform-visitor.test.ts
│       │   transform-visitor.ts      # 🎯 Transformations visitor
│       │   variable-visitor.ts
│       │
│       ├───assert-statement-visitor
│       │       assert-statement-visitor.test.ts
│       │       assert-statement-visitor.ts
│       │
│       ├───assign-statement-visitor
│       │       assign-statement-visitor.test.ts
│       │       assign-statement-visitor.ts
│       │
│       ├───binary-expression-visitor
│       │       binary-expression-visitor.test.ts
│       │
│       ├───control-structure-visitor
│       │       for-loop-visitor.test.ts
│       │       for-loop-visitor.ts
│       │       if-else-visitor.test.ts
│       │       if-else-visitor.ts
│       │
│       ├───echo-statement-visitor
│       │       echo-statement-visitor.test.ts
│       │       echo-statement-visitor.ts
│       │
│       └───expression-visitor        # 🧮 Expression visitor specializations
│           │   function-call-visitor.test.ts
│           │   function-call-visitor.ts
│           │   i-parent-expression-visitor.ts
│           │   index.ts
│           │
│           ├───binary-expression-visitor
│           │       binary-expression-visitor.test.ts
│           │       binary-expression-visitor.ts
│           │       simple-binary.test.ts
│           │
│           ├───conditional-expression-visitor
│           │       conditional-expression-visitor.test.ts
│           │       conditional-expression-visitor.ts
│           │
│           ├───list-comprehension-visitor
│           │       list-comprehension-visitor.test.ts
│           │       list-comprehension-visitor.ts
│           │
│           ├───parenthesized-expression-visitor
│           │       parenthesized-expression-visitor.test.ts
│           │       parenthesized-expression-visitor.ts
│           │
│           ├───range-expression-visitor
│           │       range-expression-visitor.test.ts
│           │       range-expression-visitor.ts
│           │
│           └───unary-expression-visitor
│                   unary-expression-visitor.test.ts
│                   unary-expression-visitor.ts
│
├───core                              # Core type definitions
│       ast-types.ts
│
├───cst                               # 🌳 Concrete Syntax Tree handling
│   │   query-utils.test.ts
│   │   query-utils.ts                # 🎯 CST query utilities
│   │
│   ├───cursor-utils                  # Tree cursor utilities
│   │       cstTreeCursorWalkLog.test.ts
│   │       cstTreeCursorWalkLog.ts   # 🎯 Cursor logging utilities
│   │       cursor-utils.integration.test.ts
│   │       cursor-utils.test.ts
│   │       cursor-utils.ts           # 🎯 Advanced cursor utilities
│   │       README.md
│   │
│   └───queries                       # Tree-sitter queries
│           dependencies.scm
│           find-function-calls.scm
│           highlights.scm
│
├───error-handling                    # 🚨 Comprehensive error recovery
│   │   error-handler.ts              # 🎯 Main error handler
│   │   error-handling-integration.test.ts
│   │   index.ts
│   │   logger.ts                     # 🎯 Structured logging
│   │   recovery-strategy-registry.ts # 🎯 ⭐ MAIN RECOVERY SYSTEM
│   │   simple-error-handler.ts
│   │
│   ├───strategies                    # 🔧 Built-in recovery strategies
│   │       missing-semicolon-strategy.test.ts
│   │       missing-semicolon-strategy.ts     # 🎯 Auto-add semicolons
│   │       recovery-strategy.ts              # 🎯 Strategy interface
│   │       type-mismatch-strategy.test.ts
│   │       type-mismatch-strategy.ts         # 🎯 Type error guidance
│   │       unclosed-bracket-strategy.test.ts
│   │       unclosed-bracket-strategy.ts      # 🎯 Auto-close brackets
│   │       unknown-identifier-strategy.test.ts
│   │       unknown-identifier-strategy.ts    # 🎯 Typo suggestions
│   │
│   ├───types                         # Error type definitions
│   │       error-types.ts
│   │
│   └───utils                         # Error handling utilities
├───services                          # 🔧 Parser services
│       parser-initialization.service.test.ts
│       parser-initialization.service.ts      # 🎯 ⭐ PARSER INITIALIZATION
│
├───types                             # Type definitions
│       ast.types.ts
│
└───utils                             # General utilities
```

## 🎯 **Key Files for Tree-sitter Grammar Issues**

**Priority Investigation Order**:

1. **`services/parser-initialization.service.ts`** - Parser setup and version compatibility
2. **`cst/cursor-utils/cursor-utils.ts`** - Memory management and cursor handling
3. **`ast/extractors/cube-extractor.ts`** - Parameter extraction corruption
4. **`ast/visitors/primitive-visitor.ts`** - AST processing issues
5. **`ast/utils/debug-utils.ts`** - Debugging utilities
6. **`error-handling/recovery-strategy-registry.ts`** - Error recovery system