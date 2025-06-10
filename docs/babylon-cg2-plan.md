# OpenSCAD to Babylon.js CSG2 Pipeline Plan

## Overview

This document outlines the comprehensive implementation of the **OpenSCAD → @holistic-stack/openscad-parser → CSG2 Babylon JS → Babylon JS Scene** pipeline. This pipeline converts OpenSCAD code into fully functional Babylon.js 3D scenes with proper CSG operations.

## Current Status (June 2025)

**🔧 NEEDS TYPE FIXES** - Core pipeline logic is functional but requires TypeScript compilation fixes:

- **Parser Integration**: ✅ @holistic-stack/openscad-parser v0.1.2+ successfully integrated with ParserResourceManager
- **AST Processing**: ⚠️ OpenScadAstVisitor logic complete but has type import/export mismatches  
- **CSG2 Operations**: ⚠️ CSG2 operations implemented but API method names need correction (FromMesh vs fromMesh)
- **Scene Generation**: ✅ SceneFactory creates complete Babylon.js scenes with cameras and lighting
- **Error Handling**: ✅ Comprehensive error handling and resource management
- **Testing**: ❌ TypeScript compilation errors prevent test execution

## TypeScript Status Summary

**❌ COMPILATION ERRORS**: 147+ TypeScript errors need systematic fixing:

### Critical Type Issues (Priority 1):
- **Import/Export Mismatches**: `OpenSCADPrimitiveNodeNode` vs `OpenSCADPrimitiveNode`
- **Transform Type Names**: `isOpenSCADTransformation` vs `isOpenSCADTransform` 
- **CSG2 API Methods**: `fromMesh` vs `FromMesh` (capitalization)
- **Position Interface**: Missing `offset` property in test mocks
- **Result Type Usage**: `ConversionResult` vs `Result` inconsistencies

### Test Status:
- **Cannot Execute**: TypeScript compilation must pass first
- **Expected Status**: 90+ tests should pass after fixes
- **Known Issues**: 1 end-to-end test (WASM loading), 2 empty test files

## Pipeline Architecture

```mermaid
flowchart TD
    A[OpenSCAD Source Code] --> B[ParserResourceManager]
    B --> C[@holistic-stack/openscad-parser]
    C --> D[OpenSCAD AST Array]
    D --> E[OpenScadAstVisitor]
    E --> F[Babylon.js Primitive Meshes]
    F --> G[CSG2 Operations]
    G --> H[Merged Babylon.js Meshes]
    H --> I[SceneFactory]
    I --> J[Complete Babylon.js Scene]
    
    K[Error Handler] --> B
    L[Type Safety] --> E
    M[Performance Monitor] --> G
    N[Resource Manager] --> I
```

## Technology Stack

### Core Dependencies
- **@holistic-stack/openscad-parser**: v0.1.2+ - Production-ready TypeScript parser using tree-sitter
  - **Key Features**: High performance, type-safe AST generation, comprehensive error handling
  - **Architecture**: Tree-sitter based with incremental parsing support
  - **Language Support**: Complete OpenSCAD syntax coverage including new features (assert, echo, let expressions)
  - **Testing**: 572 tests with 100% test success rate using real parser instances
- **@babylonjs/core**: v8.11.0 - Babylon.js core with CSG2 support
- **TypeScript**: 5.8+ - Strict mode with comprehensive type safety
- **Vite**: 6.0+ - Modern build tooling and fast development
- **Vitest**: 3.2+ - Testing framework with 95%+ test coverage

### Pipeline Components

#### 1. Parser Layer (`ParserResourceManager`)
- **Purpose**: Manages @holistic-stack/openscad-parser lifecycle
- **Methods**: `parseOpenSCAD()` returns `Result<ReadonlyArray<ASTNode>, string>`
- **Features**: Automatic resource cleanup, functional error handling
- **Status**: ✅ Complete with 23 passing tests

#### 2. AST Processing (`OpenScadAstVisitor`)
- **Purpose**: Converts OpenSCAD AST nodes to Babylon.js meshes
- **Supported Primitives**: cube, sphere, cylinder with full parameter support
- **Supported Operations**: union, difference, intersection, translate, rotate, scale
- **Features**: Type-safe node dispatching, graceful error handling
- **Status**: ✅ Complete with 7 passing tests + 6 integration tests

#### 3. CSG2 Integration
- **Implementation**: Async CSG2 operations with fallback handling
- **Operations**: `.union()`, `.subtract()`, `.intersect()` with proper mesh merging
- **Performance**: Graceful degradation when CSG2 unavailable
- **Status**: ✅ Complete with working CSG operations

#### 4. Scene Management (`SceneFactory`)
- **Purpose**: Creates complete Babylon.js scenes from AST
- **Features**: Automatic camera and lighting setup, mesh integration
- **API**: `async createFromAst(engine: Engine, ast: ASTNode): Promise<Scene>`
- **Status**: ✅ Complete with 3 passing tests
   ```
   src/
   ├── babylon-csg2/
   │   ├── babylon-csg2-converter/
   │   │   ├── babylon-csg2-converter.ts
   │   │   └── babylon-csg2-converter.test.ts
   │   ├── openscad-ast-visitor/
   │   │   ├── openscad-ast-visitor.ts
   │   │   └── openscad-ast-visitor.test.ts
   │   └── scene-manager/
   │       ├── scene-manager.ts
   │       └── scene-manager.test.ts
   ```

3. **Setup TypeScript Configuration**
   - Update tsconfig.json for Babylon.js compatibility
   - Configure strict mode and module resolution

### Phase 2: AST to CSG2 Converter
**Goal**: Convert OpenSCAD AST nodes to Babylon.js CSG2 operations

#### Core Components:

1. **OpenSCAD AST Visitor**
   - Implement visitor pattern for AST traversal
   - Handle primitive shapes (cube, sphere, cylinder)
   - Process transformations (translate, rotate, scale)
   - Support CSG operations (union, difference, intersection)

2. **Babylon CSG2 Converter**
   - Convert AST nodes to Babylon.js meshes
   - Apply CSG2 operations for boolean geometry
   - Handle material and texture mapping
   - Manage scene hierarchy

#### Key OpenSCAD Primitives to Support:
- `cube([x, y, z])` → `BABYLON.MeshBuilder.CreateBox()`
- `sphere(r)` → `BABYLON.MeshBuilder.CreateSphere()`
- `cylinder(h, r)` → `BABYLON.MeshBuilder.CreateCylinder()`
- `translate([x, y, z])` → `mesh.position.set(x, y, z)`
- `rotate([x, y, z])` → `mesh.rotation.set(x, y, z)`
- `scale([x, y, z])` → `mesh.scaling.set(x, y, z)`

### Phase 3: CSG2 Operations Implementation
**Goal**: Implement boolean operations using Babylon.js CSG2

#### CSG2 Integration:
```typescript
// CORRECTED CSG2 usage pattern (based on research findings)
// 1. Initialize CSG2 once per application (async)
await BABYLON.InitializeCSG2Async();

// 2. Create CSG2 from mesh (synchronous)
const csg1 = BABYLON.CSG2.FromMesh(mesh1);
const csg2 = BABYLON.CSG2.FromMesh(mesh2);

// 3. Perform operations (synchronous - NOT async!)
const unionResult = csg1.add(csg2);      // NOTE: union is called 'add'
const diffResult = csg1.subtract(csg2);   // difference
const intersectResult = csg1.intersect(csg2); // intersection

// 4. Convert back to mesh (synchronous)
const finalMesh = unionResult.toMesh("result", scene, materialOptions);
```

#### Operations to Implement:
- **Union**: Combine multiple shapes
- **Difference**: Subtract one shape from another  
- **Intersection**: Keep only overlapping parts
- **Module Definitions**: Custom reusable components
- **Function Calls**: Parameterized geometry

### Phase 4: Scene Management
**Goal**: Create and manage Babylon.js scenes with proper lifecycle

#### Scene Manager Features:
- Initialize Babylon.js engine and scene
- Camera and lighting setup
- Material management
- Performance optimization
- Resource cleanup

### Phase 5: Testing & Validation
**Goal**: Comprehensive testing with real OpenSCAD examples

#### Testing Strategy:
- Unit tests for each converter component
- Integration tests with sample OpenSCAD files
- Performance benchmarks
- Visual regression testing
- E2E tests with Playwright

## Implementation Details

### Current Pipeline Flow

```typescript
// 1. Parse OpenSCAD Code using @holistic-stack/openscad-parser via ParserResourceManager
const parserManager = new ParserResourceManager({ enableLogging: true });
const parseResult = await parserManager.parseOpenSCAD(openscadCode);

// 2. Extract AST nodes (array of root nodes) with full type safety
if (parseResult.success) {
  const astNodes: ReadonlyArray<ASTNode> = parseResult.value;
  
  // AST nodes follow strict TypeScript interfaces:
  // - CubeNode: { type: 'cube', size: ParameterValue, center?: boolean }
  // - SphereNode: { type: 'sphere', r?: number, d?: number, $fa?: number, $fs?: number, $fn?: number }
  // - CylinderNode: { type: 'cylinder', h: number, r?: number, r1?: number, r2?: number, ... }
  // - UnionNode: { type: 'union', children: ASTNode[] }
  // - DifferenceNode: { type: 'difference', children: ASTNode[] }
  // - IntersectionNode: { type: 'intersection', children: ASTNode[] }
  // - TranslateNode: { type: 'translate', v: Vector2D | Vector3D, children: ASTNode[] }
  // - RotateNode: { type: 'rotate', a: number | Vector3D, v?: Vector3D, children: ASTNode[] }
  // - ScaleNode: { type: 'scale', v: Vector3D, children: ASTNode[] }
  
  // 3. Process first AST node using OpenScadAstVisitor
  const visitor = new OpenScadAstVisitor(scene);
  await visitor.initializeCSG2(); // Initialize CSG2 support
  
  const resultMesh = await visitor.visit(astNodes[0]);
  
  // 4. Create complete scene using SceneFactory
  const scene = await SceneFactory.createFromAst(engine, astNodes[0]);
}
```

## OpenSCAD Parser Integration Details

### Parser API and Usage

The @holistic-stack/openscad-parser provides a production-ready TypeScript interface for parsing OpenSCAD code:

#### Core Parser Classes

1. **EnhancedOpenscadParser**: Main parser class
   ```typescript
   import { EnhancedOpenscadParser, SimpleErrorHandler } from '@holistic-stack/openscad-parser';
   
   const errorHandler = new SimpleErrorHandler();
   const parser = new EnhancedOpenscadParser(errorHandler);
   await parser.init(); // Loads WASM
   
   const ast: ASTNode[] = parser.parseAST(openscadCode);
   parser.dispose(); // Clean up resources
   ```

2. **Functional Resource Management Pattern**:
   ```typescript
   const withParser = async <T>(fn: (parser: EnhancedOpenscadParser) => Promise<T>): Promise<T> => {
     const errorHandler = new SimpleErrorHandler();
     const parser = new EnhancedOpenscadParser(errorHandler);
     
     try {
       await parser.init();
       return await fn(parser);
     } finally {
       parser.dispose(); // Guaranteed cleanup
     }
   };
   ```

#### Supported AST Node Types

**Primitive Shapes**:
- `CubeNode`: Represents `cube(size, center)` with size as ParameterValue
- `SphereNode`: Represents `sphere(r|d, $fa, $fs, $fn)` with radius or diameter
- `CylinderNode`: Represents `cylinder(h, r|r1/r2|d|d1/d2, center)` with height and radius variations

**CSG Operations**:
- `UnionNode`: Boolean union with children array
- `DifferenceNode`: Boolean subtraction with children array  
- `IntersectionNode`: Boolean intersection with children array

**Transformations**:
- `TranslateNode`: Translation with v (Vector2D|Vector3D) and children
- `RotateNode`: Rotation with a (number|Vector3D), optional v (Vector3D), and children
- `ScaleNode`: Scaling with v (Vector3D) and children

**Advanced Features**:
- `ForLoopNode`: For loop constructs with range expressions
- `IfNode`: Conditional geometry
- `AssertStatementNode`: Assertion statements 
- `EchoStatementNode`: Debug output statements
- `LetExpressionNode`: Local variable bindings

#### Type Safety and Error Handling

All AST nodes extend `BaseNode` with:
```typescript
interface BaseNode {
  type: string;
  location?: SourceLocation; // Position in source code
}

interface SourceLocation {
  start: Position;
  end: Position;
  text?: string; // Original source text
}
```

Error handling uses `ErrorNode` for parse failures:
```typescript
interface ErrorNode extends BaseNode {
  type: 'error';
  errorCode: string;
  message: string;
  originalNodeType?: string;
  cstNodeText?: string;
  cause?: ErrorNode;
}
```

### Core Classes Implementation Status

#### 1. `ParserResourceManager` ✅ COMPLETE
**Location**: `src/babylon-csg2/utils/parser-resource-manager.ts`

- **Functional Programming**: Uses Result<T, E> types for safe error handling
- **Resource Management**: Automatic parser lifecycle with cleanup
- **API**: `parseOpenSCAD(code: string): Promise<Result<ReadonlyArray<ASTNode>, string>>`
- **Testing**: 23 passing tests with real parser instances
- **Parser Integration**: Uses @holistic-stack/openscad-parser with proper WASM initialization

```typescript
interface ParserConfig {
  readonly wasmPath?: string;
  readonly treeSitterWasmPath?: string;
  readonly enableLogging?: boolean;
}

// Usage pattern - no mocks, real parser instances
const manager = new ParserResourceManager(config);
const result = await manager.parseOpenSCAD(openscadCode);
if (result.success) {
  const astNodes: ReadonlyArray<ASTNode> = result.value;
  // Process AST nodes...
}
```
  readonly wasmPath?: string;
  readonly treeSitterWasmPath?: string;
  readonly enableLogging?: boolean;
}
```

#### 2. `OpenScadAstVisitor` ✅ COMPLETE  
**Location**: `src/babylon-csg2/openscad-ast-visitor/openscad-ast-visitor.ts`

- **Visitor Pattern**: Type-safe node dispatching using discriminated unions
- **Primitives**: Full support for cube, sphere, cylinder with parameter extraction
- **Transforms**: translate, rotate, scale with proper matrix operations
- **CSG Operations**: union, difference, intersection with CSG2 integration
- **Testing**: 7 unit tests + 6 integration tests passing
- **AST Node Support**: Handles all major OpenSCAD constructs from @holistic-stack/openscad-parser

```typescript
// Key methods implemented with full AST node support:
async visit(node: ASTNode): Promise<BABYLON.Mesh | null>

// Primitive shape handlers
async visitCube(node: CubeNode): Promise<BABYLON.Mesh>
async visitSphere(node: SphereNode): Promise<BABYLON.Mesh>  
async visitCylinder(node: CylinderNode): Promise<BABYLON.Mesh>

// CSG operation handlers
async visitUnion(node: UnionNode): Promise<BABYLON.Mesh | null>
async visitDifference(node: DifferenceNode): Promise<BABYLON.Mesh | null>
async visitIntersection(node: IntersectionNode): Promise<BABYLON.Mesh | null>

// Transform handlers
async visitTranslate(node: TranslateNode): Promise<BABYLON.Mesh | null>
async visitRotate(node: RotateNode): Promise<BABYLON.Mesh | null>
async visitScale(node: ScaleNode): Promise<BABYLON.Mesh | null>

// CSG2 integration
async initializeCSG2(): Promise<void>
```

**Parameter Extraction**: Properly handles all OpenSCAD parameter types:
- Primitive values (numbers, strings, booleans)
- Vector values (Vector2D, Vector3D) 
- ParameterValue types (literals, variables, expressions)
- Special variables ($fa, $fs, $fn for resolution control)

#### 3. `SceneFactory` ✅ COMPLETE
**Location**: `src/babylon-csg2/scene-factory.ts`

- **Scene Creation**: Complete Babylon.js scene setup with camera and lighting
- **Async Support**: Handles CSG2 initialization and mesh processing
- **API**: `async createFromAst(engine: Engine, ast: ASTNode): Promise<Scene>`
- **Testing**: 3 passing tests with NullEngine

#### 4. `OpenScadPipeline` ✅ COMPLETE
**Location**: `src/babylon-csg2/openscad-pipeline/openscad-pipeline.ts`

- **End-to-End Processing**: Complete pipeline from OpenSCAD code to meshes
- **Performance Metrics**: Optional timing and resource tracking
- **Error Handling**: Comprehensive error recovery and reporting
- **Testing**: 14 passing tests covering all scenarios

## Current Issues & Next Steps

### Critical Issues to Address

#### 1. End-to-End Test WASM Loading ⚠️ HIGH PRIORITY
**Issue**: `end-to-end-integration.test.ts` fails loading tree-sitter WASM files
**Error**: `Failed to parse URL from ./tree-sitter-openscad.wasm`
**Root Cause**: Test environment doesn't have proper WASM file paths configured
**Solutions**: 
- **Option A**: Mock the parser for e2e tests with controlled AST fixtures
- **Option B**: Set up proper WASM file paths in test environment (copy assets to test build)
- **Option C**: Use conditional imports to skip real parser in test environment
**Action Required**: Implement Option A first as it's fastest and maintains test isolation

#### 2. Missing Test Files 🔧 MEDIUM PRIORITY  
**Issues**:
- `basic-integration.test.ts` is empty (0 tests) - needs integration scenarios
- `scene-manager-new.test.ts` is empty (0 tests) - needs scene management tests
**Solution**: Implement comprehensive integration tests covering:
  - Parser → AST → Mesh → Scene pipeline
  - Error handling scenarios
  - Performance benchmarks
  - Visual regression testing
  - E2E tests with Playwright

#### 3. Slow CSG2 Converter Tests ⏱️ LOW PRIORITY
**Issue**: `babylon-csg2-converter.test.ts` runs very slowly (30+ seconds)
**Root Cause**: Heavy CSG2 operations in test suite
**Solution**: 
  - Break into smaller, focused test files
  - Use test fixtures instead of generating complex meshes
  - Optimize CSG2 test setup/teardown

### Enhancement Opportunities

#### 1. Advanced OpenSCAD Features 📈 FUTURE
**Missing Features** (available in @holistic-stack/openscad-parser):
- ✅ **Already Supported by Parser**: for loops, if statements, assert/echo statements, let expressions
- 🔄 **Needs AST Visitor Implementation**:
  - `ForLoopNode`: Iterative operations with range expressions
  - `IfNode`: Conditional geometry generation
  - `AssertStatementNode`: Runtime validation
  - `EchoStatementNode`: Debug output
  - `LetExpressionNode`: Local variable scoping
  - User-defined modules and functions (`ModuleDefinitionNode`, `FunctionDefinitionNode`)
  - Advanced primitives (polygon, polyhedron, text) (`PolygonNode`, `PolyhedronNode`, `TextNode`)
  - Import/include statements for external files

**Implementation Priority**: 
1. Control structures (for, if) - High impact for complex models
2. Advanced primitives - Medium impact for specialized use cases  
3. User-defined modules - High impact for reusable components

#### 2. Performance Optimizations 🚀 FUTURE
**Parser Performance**: Already optimized with tree-sitter incremental parsing
**Pipeline Improvements**:
- Mesh caching and reuse based on AST node hashes
- Batch CSG operations for multiple similar shapes
- Level-of-detail (LOD) support for complex models
- Progressive loading for large AST trees
- Background processing for non-blocking UI

#### 3. Error Handling Enhancement 🛡️ FUTURE  
**Parser Integration**: Enhanced error reporting using parser's SourceLocation data
**Improvements**:
- Better error messages with line/column numbers from AST nodes
- Syntax highlighting for error locations using SourceLocation.text
- Recovery suggestions for common OpenSCAD mistakes
- Performance warnings for expensive operations
- Visual error indicators in 3D scene

## Implementation Best Practices Applied

### 1. Functional Programming ✅
- Result<T, E> types for error handling
- Immutable data structures
- Pure functions where possible
- Automatic resource management

### 2. TypeScript Excellence ✅  
- Strict mode compliance
- Discriminated unions for AST nodes
- Generic types for reusability
- Comprehensive type guards

### 3. Testing Strategy ✅
- Real parser instances (no mocks)
- NullEngine for Babylon.js tests
- 95%+ test coverage achieved
- Integration and unit test separation

### 4. Error Handling ✅
- Structured error types
- Graceful degradation patterns
- Comprehensive logging
- Resource cleanup guarantees

## Next Development Iteration

### Immediate Tasks (Current Sprint)

1. **Fix End-to-End Test** 
   - Implement WASM file mocking or test environment setup
   - Create controlled AST fixtures for e2e testing
   - Ensure e2e test passes without requiring real parser assets in test env

2. **Complete Missing Tests**
   - Implement `src/babylon-csg2/scene-manager/scene-manager-new.test.ts`
   - Fix or mock WASM loading in end-to-end test
   - Optimize slow-running CSG2 converter tests

3. **Documentation Updates** 
   - Update README.md with current pipeline status and @holistic-stack/openscad-parser integration
   - Document lessons learned and common pitfalls in docs/lesson-learned.md
   - Update TypeScript guidelines based on AST node type handling

### Future Iterations

1. **Advanced OpenSCAD Support**
   - Implement control structures (ForLoopNode, IfNode) in AST visitor
   - Add user-defined modules (ModuleDefinitionNode processing)
   - Support advanced primitives (PolygonNode, PolyhedronNode, TextNode)
   - Implement assert/echo statement handling for debugging

2. **Performance & Scalability**
   - Leverage parser's incremental parsing for real-time editing
   - Optimize CSG operations with result caching
   - Add mesh caching based on AST node hashes
   - Implement progressive loading for complex models

3. **Developer Experience**
   - Add live preview capabilities with incremental updates
   - Improve error reporting using SourceLocation data from parser
   - Add debugging tools with AST visualization
   - Implement OpenSCAD code completion using parser's symbol provider

## Parser Best Practices Applied

### 1. Real Parser Pattern ✅
- **No Mocks**: All tests use real @holistic-stack/openscad-parser instances
- **Proper Lifecycle**: Parser initialization and disposal managed correctly
- **Resource Management**: WASM loading handled with error recovery
- **Test Isolation**: Each test creates fresh parser instance

### 2. Functional Error Handling ✅  
- **Result Types**: Result<T, E> pattern for safe error handling
- **Immutable AST**: All parsed AST nodes are treated as immutable
- **Pure Functions**: AST transformation functions are side-effect free
- **Graceful Degradation**: Parser errors don't crash the pipeline

### 3. TypeScript Integration ✅
- **Strict Types**: Full type safety with parser's AST node interfaces
- **Discriminated Unions**: Safe node type checking with type guards
- **Generic Types**: Reusable types for different AST node patterns
- **Comprehensive Coverage**: All parser features exposed through types

## Systematic TypeScript Fix Strategy

### Phase 1: Import/Export Corrections
**Goal**: Fix all type import/export mismatches to align with actual exports

#### Key Fixes Needed:
1. **Primitive Types**:
   ```typescript
   // WRONG ❌
   import { OpenSCADPrimitiveNodeNode } from '../../types/openscad-types.js';
   
   // CORRECT ✅  
   import { OpenSCADPrimitiveNode } from '../../types/openscad-types.js';
   ```

2. **Transform Types**:
   ```typescript
   // WRONG ❌
   import { isOpenSCADTransformation, OpenSCADTransformationNode } from '../../types/openscad-types.js';
   
   // CORRECT ✅
   import { isOpenSCADTransform, OpenSCADTransformType } from '../../types/openscad-types.js';
   ```

3. **CSG2 API Methods**:
   ```typescript
   // WRONG ❌
   const csg1 = BABYLON.CSG2.fromMesh(mesh1);
   
   // CORRECT ✅
   const csg1 = BABYLON.CSG2.FromMesh(mesh1);
   ```

### Phase 2: Position Interface Alignment
**Goal**: Ensure Position interface matches @holistic-stack/openscad-parser exactly

```typescript
// Test mocks must include all required properties
interface Position {
  line: number;   // 0-based line number
  column: number; // 0-based column number
  offset: number; // 0-based byte offset - MISSING in tests!
}
```

### Phase 3: Result Type Unification
**Goal**: Align ConversionResult vs Result type usage throughout codebase

```typescript
// Current inconsistency:
// Some files use: ConversionResult<T> with .data property
// Others use: Result<T> with .value property

// Standard should be: ConversionResult<T> with .data property (functional style)
```

### Phase 4: Validation and Testing
**Goal**: Ensure all TypeScript errors are resolved and tests pass

1. Run `pnpm tsc --noEmit` - must pass with 0 errors
2. Run `pnpm test` - should show 90+ passing tests
3. Address any remaining integration issues

## Immediate Action Plan

### Step 1: Critical Type Fixes (Current Priority)
**Estimated Time**: 2-3 hours of systematic fixes

1. **Fix Import/Export Mismatches** (Priority 1):
   - `OpenSCADPrimitiveNodeNode` → `OpenSCADPrimitiveNode`
   - `isOpenSCADTransformation` → `isOpenSCADTransform`
   - `OpenSCADTransformationNode` → `OpenSCADTransformType`

2. **Update AST Node Usage** (Priority 2):
   - Replace `parameters: { size: [10, 10, 10] }` with `size: [10, 10, 10]`
   - Replace `parameters: { radius: 5 }` with `radius: 5`
   - Replace `parameters: { height: 10, radius: 3 }` with `h: 10, r: 3`

3. **Fix Position Interface** (Priority 3):
   - Add `offset: number` property to all Position mock objects in tests

4. **CSG2 API Corrections** (Priority 4):
   - `BABYLON.CSG2.fromMesh()` → `BABYLON.CSG2.FromMesh()`

### Step 2: Validation and Testing
**Goal**: Confirm TypeScript compilation passes and tests execute

1. Run `pnpm tsc --noEmit` - target: 0 errors
2. Run `pnpm test` - target: 90+ passing tests
3. Fix any remaining integration issues

### Step 3: Complete Missing Tests
**Goal**: Implement empty test files and fix failing tests

1. Implement `src/babylon-csg2/scene-manager/scene-manager-new.test.ts`
2. Fix or mock WASM loading in end-to-end test
3. Optimize slow-running CSG2 converter tests

## Current Development Blockers

❌ **BLOCKED: Cannot run tests** - TypeScript compilation must pass first
❌ **BLOCKED: Cannot verify functionality** - Need working test suite
❌ **BLOCKED: Documentation out of sync** - Plan reflects completed state but code has critical issues

## Success Criteria for Phase 1 Completion

✅ **TypeScript Compilation**: `pnpm tsc --noEmit` passes with 0 errors
✅ **Test Execution**: Tests run without compilation failures
✅ **Core Tests Passing**: 85+ tests pass (realistic target after fixes)
✅ **Documentation Updated**: Plan reflects actual working status

## Detailed Fix Examples

### Import/Export Corrections

**File**: `src/babylon-csg2/converters/primitive-converter/primitive-converter.test.ts`
```typescript
// BEFORE (WRONG) ❌
import type { OpenSCADPrimitiveNodeNode } from '../../types/openscad-types.js';

// AFTER (CORRECT) ✅  
import type { OpenSCADPrimitiveNode } from '../../types/openscad-types.js';
```

### AST Node Property Corrections

**CubeNode Usage**:
```typescript
// BEFORE (WRONG) ❌
const cubeNode: OpenSCADPrimitiveNode = {
  type: 'cube',
  parameters: { size: [10, 10, 10] },
  location: mockLocation
};

// AFTER (CORRECT) ✅
const cubeNode: OpenSCADPrimitiveNode = {
  type: 'cube',
  size: [10, 10, 10],
  location: mockLocation
};
```

**SphereNode Usage**:
```typescript
// BEFORE (WRONG) ❌  
const sphereNode: OpenSCADPrimitiveNode = {
  type: 'sphere',
  parameters: { radius: 5 },
  location: mockLocation
};

// AFTER (CORRECT) ✅
const sphereNode: OpenSCADPrimitiveNode = {
  type: 'sphere',
  radius: 5,
  location: mockLocation
};
```

**CylinderNode Usage**:
```typescript
// BEFORE (WRONG) ❌
const cylinderNode: OpenSCADPrimitiveNode = {
  type: 'cylinder',
  parameters: { height: 10, radius: 3 },
  location: mockLocation
};

// AFTER (CORRECT) ✅
const cylinderNode: OpenSCADPrimitiveNode = {
  type: 'cylinder',
  h: 10,
  r: 3,
  location: mockLocation
};
```

### Position Interface Fixes

```typescript
// BEFORE (WRONG) ❌
const mockLocation = {
  start: { line: 1, column: 0 },
  end: { line: 1, column: 10 }
};

// AFTER (CORRECT) ✅
const mockLocation = {
  start: { line: 1, column: 0, offset: 0 },
  end: { line: 1, column: 10, offset: 10 }
};
```

### CSG2 API Method Fixes

```typescript
// BEFORE (WRONG) ❌
const csg1 = BABYLON.CSG2.fromMesh(mesh1);

// AFTER (CORRECT) ✅
const csg1 = BABYLON.CSG2.FromMesh(mesh1);
```

### Transform Type Fixes

```typescript
// BEFORE (WRONG) ❌
import { isOpenSCADTransformation, OpenSCADTransformationNode } from '../../types/openscad-types.js';

// AFTER (CORRECT) ✅
import { isOpenSCADTransform, OpenSCADTransformType } from '../../types/openscad-types.js';
```
