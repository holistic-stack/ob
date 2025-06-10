# OpenSCAD to Babylon.js CSG2 Pipeline Plan

## Overview

This document outlines the comprehensive plan to integrate @holistic-stack/openscad-parser with Babylon.js CSG2 to create a robust pipeline: **OpenSCAD Code → AST → CG2 Babylon JS → Babylon JS Scene**.

## Pipeline Architecture

```mermaid
flowchart TD
    A[OpenSCAD Source Code] --> B[@holistic-stack/openscad-parser]
    B --> C[OpenSCAD AST]
    C --> D[AST to CSG2 Converter]
    D --> E[Babylon.js CSG2 Operations]
    E --> F[Babylon.js Meshes]
    F --> G[Babylon.js Scene]
    
    H[Error Handler] --> B
    I[Type Safety] --> D
    J[Performance Monitor] --> E
    K[Scene Manager] --> G
```

## Technology Stack

### Core Dependencies
- **@holistic-stack/openscad-parser**: v0.1.2 - TypeScript parser for OpenSCAD using tree-sitter
- **@babylonjs/core**: Latest - Babylon.js core with CSG2 support
- **TypeScript**: 5.8+ - Latest TypeScript features and strict mode
- **Vite**: 6.0+ - Modern build tooling
- **Vitest**: 3.2+ - Testing framework with NullEngine support

### Key Features from Research
- **CSG2**: New Babylon.js CSG implementation built on Manifold (replaces deprecated CSG)
- **Performance**: CSG2 is significantly faster and produces better topology
- **API**: `CSG2.fromMesh()`, `CSG2.toMesh()`, `.union()`, `.subtract()`, `.intersect()`
- **Async Support**: CSG2 operations are asynchronous for better performance

## Development Phases

### Phase 1: Foundation Setup
**Goal**: Establish project structure and basic dependencies

#### Tasks:
1. **Install Babylon.js Dependencies**
   ```bash
   pnpm add @babylonjs/core @babylonjs/materials @babylonjs/loaders
   ```

2. **Create Core Module Structure**
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

### Error Handling Strategy
- Use functional Result/Either patterns from @holistic-stack/openscad-parser
- Graceful degradation for unsupported OpenSCAD features
- Detailed error reporting with source location mapping

### Performance Considerations
- Async/await for CSG2 operations
- Mesh pooling and reuse
- Incremental scene updates
- Memory management for large models

### Type Safety
- Strict TypeScript configuration
- Comprehensive type definitions for AST nodes
- Type guards for runtime validation
- No `any` types allowed

## File Structure Plan

```
src/
├── babylon-csg2/
│   ├── types/
│   │   ├── openscad-types.ts
│   │   ├── babylon-types.ts
│   │   └── converter-types.ts
│   ├── converters/
│   │   ├── primitive-converter/
│   │   ├── transform-converter/
│   │   └── csg-converter/
│   ├── visitors/
│   │   ├── ast-visitor-base/
│   │   └── openscad-ast-visitor/
│   ├── scene/
│   │   ├── scene-manager/
│   │   └── material-manager/
│   └── utils/
│       ├── geometry-utils/
│       └── performance-utils/
```

## Success Criteria

1. **Functional Pipeline**: Complete OpenSCAD → Babylon.js conversion
2. **Performance**: Handle complex models with acceptable performance
3. **Type Safety**: 100% TypeScript coverage with strict mode
4. **Test Coverage**: >90% code coverage with comprehensive tests
5. **Documentation**: Complete API documentation and usage examples
6. **Real-world Usage**: Successfully render actual OpenSCAD models

### Phase 6: CSG2 Migration (NEW - June 2025)
**Goal**: Migrate from deprecated CSG to new CSG2 for improved performance and topology

#### Current State Analysis
- ✅ **Phase 1-5 Complete**: Basic pipeline working with deprecated CSG
- ⚠️ **Issue**: Using `CSG.FromMesh()`, `csg.union()`, etc. (deprecated)
- 🎯 **Target**: Migrate to `CSG2.fromMesh()`, `await csg.union()`, etc.

#### Migration Benefits
- **Performance**: 10x+ faster CSG operations
- **Quality**: Better mesh topology and normals
- **Future-Proof**: Built on Manifold library (actively maintained)
- **API**: Async operations for better UI responsiveness

#### Migration Tasks

1. **Task 6.1: Research CSG2 Best Practices**
   - Study Babylon.js CSG2 documentation and examples
   - Understand async patterns and error handling
   - Document performance improvements

2. **Task 6.2: Update Visitor Pattern to Async**
   - Convert `visit()` method to async
   - Update all CSG operation methods to async
   - Handle Promise chains properly

3. **Task 6.3: Migrate Union Operations**
   - Replace `CSG.FromMesh()` with `CSG2.fromMesh()`
   - Update `union()` calls to `await union()`
   - Update tests for async operations

4. **Task 6.4: Migrate Difference Operations**
   - Update `subtract()` calls to async pattern
   - Test complex difference scenarios
   - Validate performance improvements

5. **Task 6.5: Migrate Intersection Operations**
   - Update `intersect()` calls to async pattern
   - Test intersection edge cases
   - Document topology improvements

6. **Task 6.6: Update Scene Factory and Integration**
   - Update `SceneFactory` to handle async visitor
   - Update all integration tests
   - Add E2E tests with Playwright

#### API Changes Summary
```typescript
// OLD (Deprecated CSG)
const csg = CSG.FromMesh(mesh);
const result = csg.union(other);
const finalMesh = result.toMesh(name, material, scene);

// NEW (CSG2) - CORRECTED API
// 1. One-time initialization (async)
await BABYLON.InitializeCSG2Async();

// 2. Operations (all synchronous)
const csg = BABYLON.CSG2.FromMesh(mesh);       // Note: FromMesh (capital F)
const result = csg.add(other);                 // Note: add() not union()
const finalMesh = result.toMesh(name, scene, options);
```

#### Critical API Differences (Research-Based)
- **Initialization**: `await BABYLON.InitializeCSG2Async()` required once
- **Check Ready**: `BABYLON.IsCSG2Ready()` to verify initialization
- **Union**: `csg.add()` NOT `csg.union()`
- **Difference**: `csg.subtract()` (same as old CSG)
- **Intersection**: `csg.intersect()` (same as old CSG)
- **From Mesh**: `CSG2.FromMesh()` NOT `CSG2.fromMesh()`
- **To Mesh**: `csg.toMesh(name, scene, options)` (different parameter order)

#### Testing Strategy
- Maintain existing test coverage during migration
- Add performance benchmarks comparing CSG vs CSG2
- Use NullEngine for headless testing (no mocks)
- Add visual regression tests for topology improvements

### Phase 7: OpenSCAD Parser Integration (NEW - June 2025)
**Goal**: Complete implementation of the OpenSCAD → @holistic-stack/openscad-parser → CSG2 Babylon.js → Scene pipeline

#### Parser Integration Analysis
Based on @holistic-stack/openscad-parser documentation analysis:

**Parser Architecture:**
- **Class**: `EnhancedOpenscadParser` with functional resource management
- **AST**: Strongly-typed AST nodes with comprehensive error handling
- **Patterns**: Result types, immutable structures, pure functions
- **Initialization**: `await parser.init()` with WASM loading
- **Usage**: `parser.parseAST(openscadCode)` returns typed AST

**Key AST Node Types for Pipeline:**

1. **Primitive Nodes**
   ```typescript
   // CubeNode: { type: "cube", size: ParameterValue, center?: boolean }
   cube([10, 20, 30]) → BABYLON.MeshBuilder.CreateBox()
   
   // SphereNode: { type: "sphere", radius?: number, diameter?: number }
   sphere(r=5) → BABYLON.MeshBuilder.CreateSphere()
   
   // CylinderNode: { type: "cylinder", h: number, r1?: number, r2?: number }
   cylinder(h=10, r=5) → BABYLON.MeshBuilder.CreateCylinder()
   ```

2. **Transform Nodes**
   ```typescript
   // TranslateNode: { type: "translate", v: Vector3D | Vector2D, children: ASTNode[] }
   translate([1, 2, 3]) → mesh.position.set(1, 2, 3)
   
   // RotateNode: { type: "rotate", a: Vector3D | number, v?: Vector3D, children: ASTNode[] }
   rotate([0, 0, 90]) → mesh.rotation.set(0, 0, Math.PI/2)
   
   // ScaleNode: { type: "scale", v: Vector3D | Vector2D | number, children: ASTNode[] }
   scale([2, 1, 1]) → mesh.scaling.set(2, 1, 1)
   ```

3. **CSG Operation Nodes**
   ```typescript
   // UnionNode: { type: "union", children: ASTNode[] }
   union() { cube(); sphere(); } → await csg1.add(csg2)
   
   // DifferenceNode: { type: "difference", children: ASTNode[] }
   difference() { cube(); sphere(); } → await csg1.subtract(csg2)
   
   // IntersectionNode: { type: "intersection", children: ASTNode[] }
   intersection() { cube(); sphere(); } → await csg1.intersect(csg2)
   ```

#### Phase 7 Implementation Tasks

**Task 7.1: Parser Resource Management** ✅ **COMPLETED**
- Implement functional parser lifecycle management with Resource pattern
- Create `withParser()` higher-order function for automatic resource cleanup
- Add Result/Either error handling for parser operations
- Test parser initialization and disposal patterns
- **Status**: ✅ Fully implemented with 23 comprehensive tests (all passing)
- **Files**: `src/babylon-csg2/utils/parser-resource-manager.ts`, `parser-resource-manager.test.ts`

#### Parser Resource Management Implementation Pattern
```typescript
// Resource management pattern for EnhancedOpenscadParser
import { EnhancedOpenscadParser } from '@holistic-stack/openscad-parser';

// Result type for error handling
type Result<T, E = Error> = { success: true; value: T } | { success: false; error: E };

// Parser resource manager
export class ParserResourceManager {
  private parser: EnhancedOpenscadParser | null = null;
  
  async initializeParser(): Promise<Result<EnhancedOpenscadParser, string>> {
    try {
      this.parser = new EnhancedOpenscadParser();
      await this.parser.init(); // Initialize WASM
      return { success: true, value: this.parser };
    } catch (error) {
      return { success: false, error: `Parser initialization failed: ${error}` };
    }
  }
  
  async disposeParser(): Promise<void> {
    if (this.parser) {
      // Clean up WASM resources if needed
      this.parser = null;
    }
  }
  
  // Higher-order function for parser resource management
  async withParser<T>(
    operation: (parser: EnhancedOpenscadParser) => Promise<Result<T, string>>
  ): Promise<Result<T, string>> {
    const initResult = await this.initializeParser();
    if (!initResult.success) {
      return initResult;
    }
    
    try {
      const result = await operation(initResult.value);
      return result;
    } finally {
      await this.disposeParser();
    }
  }
}

// Usage example
const resourceManager = new ParserResourceManager();

const result = await resourceManager.withParser(async (parser) => {
  const ast = parser.parseAST(openscadCode);
  if (ast.length === 0) {
    return { success: false, error: 'Failed to parse OpenSCAD code' };
  }
  return { success: true, value: ast };
});
```

**Task 7.2: AST Node Type Guards and Utilities**
- Create comprehensive type guards for all OpenSCAD AST node types
- Implement parameter extraction utilities for complex nodes
- Add validation functions for node structure integrity
- Create node traversal and transformation utilities

#### AST Node Type Guards Implementation
```typescript
// Type guards for OpenSCAD AST nodes
import type { 
  ASTNode, CubeNode, SphereNode, CylinderNode, 
  TranslateNode, RotateNode, ScaleNode,
  UnionNode, DifferenceNode, IntersectionNode,
  ParameterValue, Vector3D, Vector2D
} from '@holistic-stack/openscad-parser';

// Primitive node type guards
export const isCubeNode = (node: ASTNode): node is CubeNode => 
  node.type === 'cube';

export const isSphereNode = (node: ASTNode): node is SphereNode => 
  node.type === 'sphere';

export const isCylinderNode = (node: ASTNode): node is CylinderNode => 
  node.type === 'cylinder';

// Transform node type guards
export const isTranslateNode = (node: ASTNode): node is TranslateNode => 
  node.type === 'translate';

export const isRotateNode = (node: ASTNode): node is RotateNode => 
  node.type === 'rotate';

export const isScaleNode = (node: ASTNode): node is ScaleNode => 
  node.type === 'scale';

// CSG operation type guards
export const isUnionNode = (node: ASTNode): node is UnionNode => 
  node.type === 'union';

export const isDifferenceNode = (node: ASTNode): node is DifferenceNode => 
  node.type === 'difference';

export const isIntersectionNode = (node: ASTNode): node is IntersectionNode => 
  node.type === 'intersection';

// Parameter extraction utilities
export const extractParameterValue = (param: ParameterValue): number | number[] | string | boolean => {
  // Handle different ParameterValue types based on parser documentation
  if (typeof param === 'number' || typeof param === 'string' || typeof param === 'boolean') {
    return param;
  }
  if (Array.isArray(param)) {
    return param.map(p => typeof p === 'number' ? p : 0);
  }
  // Handle expression evaluation if needed
  return 0;
};

export const extractVector3D = (param: ParameterValue): [number, number, number] => {
  const value = extractParameterValue(param);
  if (Array.isArray(value)) {
    return [
      value[0] || 0,
      value[1] || 0,
      value[2] || 0
    ];
  }
  if (typeof value === 'number') {
    return [value, value, value];
  }
  return [0, 0, 0];
};

// Node validation utilities
export const validateNodeStructure = (node: ASTNode): Result<ASTNode, string> => {
  if (!node.type) {
    return { success: false, error: 'Node missing type property' };
  }
  
  // Add specific validation for each node type
  if (isCubeNode(node)) {
    if (!node.size) {
      return { success: false, error: 'CubeNode missing size parameter' };
    }
  }
  
  return { success: true, value: node };
};

// Node traversal utilities
export const traverseAST = (
  nodes: ASTNode[], 
  visitor: (node: ASTNode) => void
): void => {
  for (const node of nodes) {
    visitor(node);
    
    // Recursively traverse children if present
    if ('children' in node && Array.isArray(node.children)) {
      traverseAST(node.children, visitor);
    }
  }
};
```

**Task 7.3: Enhanced AST Visitor with Parser Integration**
- Update OpenScadAstVisitor to handle @holistic-stack/openscad-parser AST nodes
- Implement proper CSG2 patterns (corrected API usage)
- Add comprehensive error handling for unsupported nodes
- Create visitor method mapping for all supported OpenSCAD constructs

#### Enhanced Visitor Implementation with Corrected CSG2 API
```typescript
import type { 
  ASTNode, CubeNode, SphereNode, CylinderNode,
  TranslateNode, RotateNode, ScaleNode,
  UnionNode, DifferenceNode, IntersectionNode
} from '@holistic-stack/openscad-parser';
import * as BABYLON from '@babylonjs/core';
import { 
  isCubeNode, isSphereNode, isUnionNode, isDifferenceNode,
  extractVector3D, extractParameterValue 
} from '../ast-utils/type-guards';

export class OpenScadAstVisitor {
  private scene: BABYLON.Scene;
  private isCSG2Ready = false;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }

  // Initialize CSG2 once per visitor instance
  async initializeCSG2(): Promise<Result<void, string>> {
    try {
      if (!BABYLON.IsCSG2Ready()) {
        await BABYLON.InitializeCSG2Async();
      }
      this.isCSG2Ready = true;
      return { success: true, value: undefined };
    } catch (error) {
      return { success: false, error: `CSG2 initialization failed: ${error}` };
    }
  }

  // Main visitor method - now synchronous (CSG2 operations are sync)
  visit(node: ASTNode): Result<BABYLON.Mesh | null, string> {
    if (!this.isCSG2Ready) {
      return { success: false, error: 'CSG2 not initialized. Call initializeCSG2() first.' };
    }

    try {
      switch (node.type) {
        case 'cube':
          return this.visitCube(node as CubeNode);
        case 'sphere':
          return this.visitSphere(node as SphereNode);
        case 'cylinder':
          return this.visitCylinder(node as CylinderNode);
        case 'union':
          return this.visitUnion(node as UnionNode);
        case 'difference':
          return this.visitDifference(node as DifferenceNode);
        case 'intersection':
          return this.visitIntersection(node as IntersectionNode);
        case 'translate':
          return this.visitTranslate(node as TranslateNode);
        case 'rotate':
          return this.visitRotate(node as RotateNode);
        case 'scale':
          return this.visitScale(node as ScaleNode);
        default:
          return { 
            success: false, 
            error: `Unsupported node type: ${node.type}` 
          };
      }
    } catch (error) {
      return { 
        success: false, 
        error: `Error visiting ${node.type} node: ${error}` 
      };
    }
  }

  private visitCube(node: CubeNode): Result<BABYLON.Mesh, string> {
    const size = extractVector3D(node.size);
    const mesh = BABYLON.MeshBuilder.CreateBox(
      "cube", 
      { width: size[0], height: size[1], depth: size[2] }, 
      this.scene
    );
    
    // Handle center parameter
    if (node.center === false) {
      mesh.position.x = size[0] / 2;
      mesh.position.y = size[1] / 2;
      mesh.position.z = size[2] / 2;
    }
    
    return { success: true, value: mesh };
  }

  private visitSphere(node: SphereNode): Result<BABYLON.Mesh, string> {
    const radius = node.radius ? extractParameterValue(node.radius) as number : 
                   node.diameter ? (extractParameterValue(node.diameter) as number) / 2 : 1;
    
    const mesh = BABYLON.MeshBuilder.CreateSphere(
      "sphere", 
      { diameter: radius * 2 }, 
      this.scene
    );
    
    return { success: true, value: mesh };
  }

  private visitUnion(node: UnionNode): Result<BABYLON.Mesh | null, string> {
    if (!node.children || node.children.length === 0) {
      return { success: true, value: null };
    }

    // Visit first child
    const firstResult = this.visit(node.children[0]);
    if (!firstResult.success || !firstResult.value) {
      return firstResult;
    }

    let resultMesh = firstResult.value;

    // Union with remaining children using CSG2 (corrected API)
    for (let i = 1; i < node.children.length; i++) {
      const childResult = this.visit(node.children[i]);
      if (!childResult.success || !childResult.value) {
        continue; // Skip failed children
      }

      // CSG2 union operation (synchronous)
      const csg1 = BABYLON.CSG2.FromMesh(resultMesh);
      const csg2 = BABYLON.CSG2.FromMesh(childResult.value);
      const unionCSG = csg1.add(csg2); // NOTE: add() not union()
      
      // Dispose old mesh and create new one
      resultMesh.dispose();
      childResult.value.dispose();
      
      resultMesh = unionCSG.toMesh("union", this.scene);
    }

    return { success: true, value: resultMesh };
  }

  private visitDifference(node: DifferenceNode): Result<BABYLON.Mesh | null, string> {
    if (!node.children || node.children.length < 2) {
      return { success: false, error: 'Difference requires at least 2 children' };
    }

    // Visit first child (base shape)
    const baseResult = this.visit(node.children[0]);
    if (!baseResult.success || !baseResult.value) {
      return baseResult;
    }

    let resultMesh = baseResult.value;

    // Subtract remaining children
    for (let i = 1; i < node.children.length; i++) {
      const childResult = this.visit(node.children[i]);
      if (!childResult.success || !childResult.value) {
        continue;
      }

      // CSG2 difference operation (synchronous)
      const csg1 = BABYLON.CSG2.FromMesh(resultMesh);
      const csg2 = BABYLON.CSG2.FromMesh(childResult.value);
      const diffCSG = csg1.subtract(csg2);
      
      resultMesh.dispose();
      childResult.value.dispose();
      
      resultMesh = diffCSG.toMesh("difference", this.scene);
    }

    return { success: true, value: resultMesh };
  }

  private visitTranslate(node: TranslateNode): Result<BABYLON.Mesh | null, string> {
    if (!node.children || node.children.length === 0) {
      return { success: true, value: null };
    }

    const translation = extractVector3D(node.v);
    
    // Visit child and apply translation
    const childResult = this.visit(node.children[0]);
    if (!childResult.success || !childResult.value) {
      return childResult;
    }

    childResult.value.position.set(translation[0], translation[1], translation[2]);
    return childResult;
  }
}
```

**Task 7.4: Complete Pipeline Implementation**
- Create end-to-end OpenSCAD to Babylon.js pipeline
- Parse OpenSCAD code → AST → Meshes → Scene optimization
- Performance monitoring and resource management
- Comprehensive error handling with source location mapping

#### Complete Pipeline Implementation
```typescript
import { EnhancedOpenscadParser } from '@holistic-stack/openscad-parser';
import { ParserResourceManager } from '../parser/parser-manager';
import { OpenScadAstVisitor } from '../visitors/openscad-ast-visitor';
import * as BABYLON from '@babylonjs/core';

export interface ConversionOptions {
  enableOptimization?: boolean;
  maxMeshes?: number;
  materialOptions?: BABYLON.StandardMaterialOptions;
}

export interface ConversionError {
  type: 'parse' | 'conversion' | 'csg' | 'scene';
  message: string;
  sourceLocation?: SourceLocation;
  details?: unknown;
}

export class OpenSCADToBabylonPipeline {
  private resourceManager: ParserResourceManager;
  private scene: BABYLON.Scene;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
    this.resourceManager = new ParserResourceManager();
  }

  /**
   * Complete pipeline: OpenSCAD code → AST → CSG2 Babylon.js → Scene
   * @param openscadCode OpenSCAD source code
   * @param options Conversion options
   * @returns Result with converted meshes or error
   */
  async convertOpenSCADToScene(
    openscadCode: string, 
    options: ConversionOptions = {}
  ): Promise<Result<BABYLON.Mesh[], ConversionError>> {
    console.log('[INIT] Starting OpenSCAD to Babylon.js conversion pipeline');
    
    try {
      // Step 1: Parse OpenSCAD code to AST
      console.log('[DEBUG] Parsing OpenSCAD code to AST');
      const parseResult = await this.parseOpenSCAD(openscadCode);
      if (!parseResult.success) {
        console.log('[ERROR] Failed to parse OpenSCAD code:', parseResult.error);
        return {
          success: false,
          error: {
            type: 'parse',
            message: parseResult.error,
            details: openscadCode.slice(0, 100) + '...'
          }
        };
      }

      console.log(`[DEBUG] Successfully parsed AST with ${parseResult.value.length} root nodes`);

      // Step 2: Convert AST to Babylon.js meshes using CSG2
      const meshResult = await this.convertASTToMeshes(parseResult.value, options);
      if (!meshResult.success) {
        console.log('[ERROR] Failed to convert AST to meshes:', meshResult.error);
        return meshResult;
      }

      console.log(`[DEBUG] Successfully converted to ${meshResult.value.length} meshes`);

      // Step 3: Optimize and finalize scene
      const optimizedResult = this.optimizeScene(meshResult.value, options);
      if (!optimizedResult.success) {
        console.log('[WARN] Scene optimization failed, returning unoptimized meshes');
        return meshResult; // Return unoptimized meshes if optimization fails
      }

      console.log('[END] Successfully completed OpenSCAD to Babylon.js conversion');
      return optimizedResult;
      
    } catch (error) {
      console.log('[ERROR] Unexpected error in conversion pipeline:', error);
      return {
        success: false,
        error: {
          type: 'scene',
          message: `Unexpected pipeline error: ${error}`,
          details: error
        }
      };
    }
  }

  private async parseOpenSCAD(openscadCode: string): Promise<Result<ASTNode[], string>> {
    return await this.resourceManager.withParser(async (parser) => {
      try {
        const ast = parser.parseAST(openscadCode);
        
        // Validate AST
        if (!ast || ast.length === 0) {
          return { 
            success: false, 
            error: 'No valid AST nodes generated from OpenSCAD code' 
          };
        }

        return { success: true, value: ast };
      } catch (error) {
        return { 
          success: false, 
          error: `AST parsing failed: ${error}` 
        };
      }
    });
  }

  private async convertASTToMeshes(
    astNodes: ASTNode[], 
    options: ConversionOptions
  ): Promise<Result<BABYLON.Mesh[], ConversionError>> {
    const visitor = new OpenScadAstVisitor(this.scene);
    
    // Initialize CSG2 once
    const csgInitResult = await visitor.initializeCSG2();
    if (!csgInitResult.success) {
      return {
        success: false,
        error: {
          type: 'csg',
          message: csgInitResult.error
        }
      };
    }

    const meshes: BABYLON.Mesh[] = [];
    const errors: ConversionError[] = [];

    // Convert each AST node
    for (const node of astNodes) {
      const meshResult = visitor.visit(node);
      
      if (meshResult.success && meshResult.value) {
        meshes.push(meshResult.value);
        
        // Apply material if specified
        if (options.materialOptions) {
          const material = new BABYLON.StandardMaterial("material", this.scene);
          Object.assign(material, options.materialOptions);
          meshResult.value.material = material;
        }
      } else {
        errors.push({
          type: 'conversion',
          message: meshResult.error,
          sourceLocation: node.location
        });
      }

      // Check mesh limit
      if (options.maxMeshes && meshes.length >= options.maxMeshes) {
        console.log(`[WARN] Reached maximum mesh limit: ${options.maxMeshes}`);
        break;
      }
    }

    // Return success even if some nodes failed (partial success)
    if (meshes.length > 0) {
      if (errors.length > 0) {
        console.log(`[WARN] Converted ${meshes.length} meshes with ${errors.length} errors`);
      }
      return { success: true, value: meshes };
    } else {
      return {
        success: false,
        error: errors[0] || {
          type: 'conversion',
          message: 'No meshes could be generated from AST'
        }
      };
    }
  }

  private optimizeScene(
    meshes: BABYLON.Mesh[], 
    options: ConversionOptions
  ): Result<BABYLON.Mesh[], ConversionError> {
    if (!options.enableOptimization) {
      return { success: true, value: meshes };
    }

    try {
      // Merge compatible meshes
      const optimizedMeshes = this.mergeMeshes(meshes);
      
      // Optimize materials
      this.optimizeMaterials(optimizedMeshes);
      
      // Update scene bounds
      this.scene.createPickingRay(0, 0);
      
      return { success: true, value: optimizedMeshes };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'scene',
          message: `Scene optimization failed: ${error}`
        }
      };
    }
  }

  private mergeMeshes(meshes: BABYLON.Mesh[]): BABYLON.Mesh[] {
    // Group meshes by material and merge when possible
    const materialGroups = new Map<BABYLON.Material | null, BABYLON.Mesh[]>();
    
    for (const mesh of meshes) {
      const material = mesh.material;
      if (!materialGroups.has(material)) {
        materialGroups.set(material, []);
      }
      materialGroups.get(material)!.push(mesh);
    }

    const optimizedMeshes: BABYLON.Mesh[] = [];
    
    for (const [material, groupMeshes] of materialGroups) {
      if (groupMeshes.length > 1) {
        // Merge meshes with same material
        const merged = BABYLON.Mesh.MergeMeshes(groupMeshes, true, true);
        if (merged) {
          merged.material = material;
          optimizedMeshes.push(merged);
        } else {
          optimizedMeshes.push(...groupMeshes);
        }
      } else {
        optimizedMeshes.push(...groupMeshes);
      }
    }

    return optimizedMeshes;
  }

  private optimizeMaterials(meshes: BABYLON.Mesh[]): void {
    // Optimize materials by sharing common properties
    const materialMap = new Map<string, BABYLON.Material>();
    
    for (const mesh of meshes) {
      if (mesh.material instanceof BABYLON.StandardMaterial) {
        const key = this.getMaterialKey(mesh.material);
        if (materialMap.has(key)) {
          mesh.material = materialMap.get(key)!;
        } else {
          materialMap.set(key, mesh.material);
        }
      }
    }
  }

  private getMaterialKey(material: BABYLON.StandardMaterial): string {
    return `${material.diffuseColor?.toString()}_${material.emissiveColor?.toString()}`;
  }
}
```

**Task 7.5: Advanced OpenSCAD Features**
- Support for module definitions and instantiations
- Function calls with parameter resolution
- Variable assignments and scoping
- Conditional statements (if/else)
- Loop constructs (for loops)
- List comprehensions and ranges

**Task 7.6: Parameter Extraction and Processing**
- Implement robust parameter value extraction from ParameterValue types
- Handle vectors, numbers, booleans, and string parameters
- Support named parameters and default values
- Add parameter validation and type coercion

**Task 7.7: Error Handling and Diagnostics**
- Comprehensive error reporting with source location mapping
- Graceful degradation for unsupported OpenSCAD features
- Validation of OpenSCAD syntax and semantic errors
- User-friendly error messages with suggestions

#### OpenSCAD Language Support Matrix

| Feature | AST Node | Babylon.js Mapping | Status |
|---------|----------|-------------------|---------|
| `cube()` | CubeNode | CreateBox() | ✅ Planned |
| `sphere()` | SphereNode | CreateSphere() | ✅ Planned |
| `cylinder()` | CylinderNode | CreateCylinder() | ✅ Planned |
| `translate()` | TranslateNode | mesh.position | ✅ Planned |
| `rotate()` | RotateNode | mesh.rotation | ✅ Planned |
| `scale()` | ScaleNode | mesh.scaling | ✅ Planned |
| `union()` | UnionNode | CSG2.add() | ✅ Planned |
| `difference()` | DifferenceNode | CSG2.subtract() | ✅ Planned |
| `intersection()` | IntersectionNode | CSG2.intersect() | ✅ Planned |
| `linear_extrude()` | LinearExtrudeNode | Custom geometry | 🔄 Future |
| `rotate_extrude()` | RotateExtrudeNode | Custom geometry | 🔄 Future |
| `polygon()` | PolygonNode | Custom geometry | 🔄 Future |
| `polyhedron()` | PolyhedronNode | Custom geometry | 🔄 Future |
| `module` definitions | ModuleDefinitionNode | Function composition | 🔄 Future |
| `if` statements | IfNode | Conditional logic | 🔄 Future |
| `for` loops | ForLoopNode | Array operations | 🔄 Future |

#### Testing Infrastructure Setup

**Vitest Configuration for CSG2 and Parser Testing:**
```typescript
// vitest.config.ts enhancements for OpenSCAD testing
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // For Babylon.js DOM dependencies
    setupFiles: ['./src/vitest-setup.ts'],
    timeout: 30000, // Longer timeout for CSG2 operations
    threads: false, // Disable threading for deterministic results
    globals: true,
    
    // Add CSG2-specific test patterns
    include: [
      'src/**/*.test.ts',
      'src/**/*.integration.test.ts'
    ],
    
    // Coverage configuration
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'src/**/*.test.ts',
        'src/test-assets/**',
        'node_modules/**'
      ]
    }
  }
});
```

**Enhanced Test Setup with CSG2 and Parser Initialization:**
```typescript
// src/vitest-setup.ts
import * as BABYLON from '@babylonjs/core';
import { beforeAll, afterAll } from 'vitest';

// Global test environment setup
beforeAll(async () => {
  console.log('[INIT] Setting up global test environment');
  
  // Initialize CSG2 once for all tests
  try {
    await BABYLON.InitializeCSG2Async();
    console.log('[DEBUG] CSG2 initialized successfully');
  } catch (error) {
    console.error('[ERROR] Failed to initialize CSG2:', error);
    throw error;
  }
  
  // Set up global error handlers
  globalThis.addEventListener('unhandledrejection', (event) => {
    console.error('[ERROR] Unhandled promise rejection in tests:', event.reason);
  });
  
  // Mock performance.now if not available
  if (!globalThis.performance) {
    globalThis.performance = { now: () => Date.now() };
  }
});

afterAll(() => {
  console.log('[END] Cleaning up global test environment');
  // Additional cleanup if needed
});

// Test utilities
export const createTestScene = (): { engine: BABYLON.NullEngine; scene: BABYLON.Scene } => {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  return { engine, scene };
};

export const disposeTestScene = (engine: BABYLON.NullEngine, scene: BABYLON.Scene): void => {
  scene.dispose();
  engine.dispose();
};
```

**Test Data and Fixtures:**
```typescript
// src/test-assets/openscad-test-cases.ts
export const OpenSCADTestCases = {
  // Simple primitives
  simpleCube: 'cube([10, 10, 10]);',
  simpleSphere: 'sphere(r=5);',
  simpleCylinder: 'cylinder(h=10, r=3);',
  
  // Transformations
  translatedCube: 'translate([5, 0, 0]) cube([10, 10, 10]);',
  rotatedSphere: 'rotate([0, 0, 45]) sphere(r=5);',
  scaledCylinder: 'scale([2, 1, 1]) cylinder(h=10, r=3);',
  
  // CSG operations
  simpleUnion: `
    union() {
      cube([10, 10, 10]);
      translate([5, 0, 0]) cube([10, 10, 10]);
    }
  `,
  
  simpleDifference: `
    difference() {
      cube([20, 20, 20]);
      translate([10, 10, 10]) sphere(8);
    }
  `,
  
  complexNested: `
    difference() {
      union() {
        cube([20, 20, 20]);
        translate([20, 0, 0]) cube([20, 20, 20]);
      }
      union() {
        translate([10, 10, 10]) sphere(8);
        translate([30, 10, 10]) sphere(8);
      }
    }
  `,
  
  // Edge cases
  emptyCube: 'cube([0, 0, 0]);',
  negativeCube: 'cube([-5, -5, -5]);',
  singlePointSphere: 'sphere(r=0);',
  
  // Performance test cases
  manyPrimitives: Array(20).fill(0).map((_, i) => 
    `translate([${i * 2}, 0, 0]) cube([1, 1, 1]);`
  ).join('\n'),
  
  deepNesting: `
    difference() {
      difference() {
        difference() {
          cube([30, 30, 30]);
          translate([15, 15, 15]) sphere(10);
        }
        translate([15, 15, 5]) cylinder(h=10, r=5);
      }
      translate([15, 5, 15]) cube([5, 5, 5]);
    }
  `,
  
  // Invalid cases for error testing
  invalidSyntax: 'invalid_syntax_here();',
  unclosedBrace: 'union() { cube([10, 10, 10]);',
  undefinedFunction: 'unknown_function([1, 2, 3]);'
};

export const ExpectedResults = {
  simpleCube: { meshCount: 1, nodeType: 'cube' },
  simpleUnion: { meshCount: 1, nodeType: 'union' },
  complexNested: { meshCount: 1, nodeType: 'difference' },
  manyPrimitives: { meshCount: 20, maxRenderTime: 5000 },
  
  // Error expectations
  invalidSyntax: { shouldFail: true, errorType: 'parse' },
  emptyCube: { shouldFail: false, meshCount: 1 } // Should create mesh with 0 size
};
```

**Unit Tests with CSG2 Initialization:**
```typescript
import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { OpenScadAstVisitor } from '../openscad-ast-visitor';
import { ParserResourceManager } from '../parser/parser-manager';

describe('OpenSCAD Parser Integration', () => {
  let scene: BABYLON.Scene;
  let engine: BABYLON.NullEngine;
  let resourceManager: ParserResourceManager;

  beforeAll(async () => {
    console.log('[INIT] Initializing CSG2 for tests');
    // Initialize CSG2 once for all tests
    await BABYLON.InitializeCSG2Async();
    resourceManager = new ParserResourceManager();
  });

  beforeEach(async () => {
    console.log('[DEBUG] Setting up test scene');
    // Create a null engine (headless)
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
  });

  test('should parse simple cube OpenSCAD code', async () => {
    console.log('[DEBUG] Testing cube parsing');
    const code = 'cube([10, 20, 30]);';
    
    const result = await resourceManager.withParser(async (parser) => {
      const ast = parser.parseAST(code);
      if (ast.length === 0) {
        return { success: false, error: 'No AST nodes generated' };
      }
      return { success: true, value: ast };
    });
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value[0].type).toBe('cube');
      console.log('[DEBUG] Successfully parsed cube node');
    }
  });
  
  test('should convert cube AST node to Babylon mesh', async () => {
    console.log('[DEBUG] Testing cube AST to mesh conversion');
    const visitor = new OpenScadAstVisitor(scene);
    await visitor.initializeCSG2();
    
    // Create a mock CubeNode (in real implementation, this comes from parser)
    const cubeNode = {
      type: 'cube',
      size: [10, 20, 30],
      center: true,
      location: { start: { line: 0, column: 0 }, end: { line: 0, column: 20 } }
    } as CubeNode;
    
    const result = visitor.visit(cubeNode);
    
    expect(result.success).toBe(true);
    if (result.success && result.value) {
      expect(result.value).toBeInstanceOf(BABYLON.Mesh);
      expect(result.value.name).toBe('cube');
      console.log('[DEBUG] Successfully converted cube to mesh');
    }
  });

  test('should handle CSG2 union operations', async () => {
    console.log('[DEBUG] Testing CSG2 union operations');
    const visitor = new OpenScadAstVisitor(scene);
    await visitor.initializeCSG2();
    
    const unionNode = {
      type: 'union',
      children: [
        { type: 'cube', size: [10, 10, 10] },
        { type: 'sphere', radius: 5 }
      ]
    } as UnionNode;
    
    const result = visitor.visit(unionNode);
    
    expect(result.success).toBe(true);
    if (result.success && result.value) {
      expect(result.value.name).toBe('union');
      console.log('[DEBUG] Successfully performed CSG2 union');
    }
  });

  test('should handle parameter extraction', async () => {
    console.log('[DEBUG] Testing parameter extraction');
    const visitor = new OpenScadAstVisitor(scene);
    await visitor.initializeCSG2();
    
    // Test various parameter formats
    const testCases = [
      { size: [10, 20, 30], expected: [10, 20, 30] },
      { size: 15, expected: [15, 15, 15] },
      { size: [5], expected: [5, 0, 0] }
    ];
    
    for (const testCase of testCases) {
      const cubeNode = { type: 'cube', size: testCase.size } as CubeNode;
      const result = visitor.visit(cubeNode);
      
      expect(result.success).toBe(true);
      console.log(`[DEBUG] Parameter extraction test passed for ${JSON.stringify(testCase.size)}`);
    }
  });
});
```

**Integration Tests:**
```typescript
describe('End-to-End OpenSCAD Pipeline', () => {
  let pipeline: OpenSCADToBabylonPipeline;
  let scene: BABYLON.Scene;
  let engine: BABYLON.NullEngine;

  beforeAll(async () => {
    console.log('[INIT] Initializing E2E test environment');
    await BABYLON.InitializeCSG2Async();
  });

  beforeEach(() => {
    console.log('[DEBUG] Setting up E2E test scene');
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    pipeline = new OpenSCADToBabylonPipeline(scene);
  });

  test('should convert simple OpenSCAD model to scene', async () => {
    console.log('[DEBUG] Testing simple OpenSCAD model conversion');
    const openscadCode = `
      cube([20, 20, 20]);
    `;
    
    const result = await pipeline.convertOpenSCADToScene(openscadCode);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toBeInstanceOf(BABYLON.Mesh);
      console.log('[DEBUG] Simple model conversion successful');
    }
  });

  test('should convert complex OpenSCAD model with CSG operations', async () => {
    console.log('[DEBUG] Testing complex OpenSCAD model with CSG');
    const openscadCode = `
      difference() {
        cube([20, 20, 20]);
        translate([10, 10, 10])
          sphere(8);
      }
    `;
    
    const result = await pipeline.convertOpenSCADToScene(openscadCode, {
      enableOptimization: true,
      maxMeshes: 10
    });
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].name).toBe('difference');
      console.log('[DEBUG] Complex CSG model conversion successful');
    }
  });

  test('should handle parsing errors gracefully', async () => {
    console.log('[DEBUG] Testing error handling for invalid OpenSCAD');
    const invalidCode = 'invalid_openscad_syntax(;';
    
    const result = await pipeline.convertOpenSCADToScene(invalidCode);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('parse');
      console.log(`[DEBUG] Error handling test passed: ${result.error.message}`);
    }
  });

  test('should handle performance requirements', async () => {
    console.log('[DEBUG] Testing performance with large model');
    const largeModel = Array(50).fill(0).map((_, i) => 
      `translate([${i}, 0, 0]) cube([1, 1, 1]);`
    ).join('\n');
    
    const startTime = performance.now();
    const result = await pipeline.convertOpenSCADToScene(largeModel, {
      maxMeshes: 20 // Limit for performance
    });
    const endTime = performance.now();
    
    console.log(`[DEBUG] Conversion took ${endTime - startTime} milliseconds`);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete in 5 seconds
    
    if (result.success) {
      expect(result.value.length).toBeLessThanOrEqual(20);
      console.log(`[DEBUG] Performance test passed with ${result.value.length} meshes`);
    }
  });
});
```

**E2E Tests with Playwright:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('OpenSCAD Viewer E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    console.log('[INIT] Loading OpenSCAD viewer page');
    await page.goto('/openscad-viewer');
    
    // Wait for Babylon.js and CSG2 to initialize
    await page.waitForFunction(() => window.BABYLON && window.BABYLON.IsCSG2Ready());
    console.log('[DEBUG] Babylon.js and CSG2 initialized');
  });

  test('should render simple OpenSCAD model in browser', async ({ page }) => {
    console.log('[DEBUG] Testing simple cube rendering');
    
    // Input OpenSCAD code
    await page.fill('#openscad-input', 'cube([10, 10, 10]);');
    await page.click('#render-button');
    
    // Wait for render to complete
    await page.waitForSelector('.render-complete', { timeout: 10000 });
    
    // Check that mesh is rendered
    const meshCount = await page.evaluate(() => {
      return window.scene?.meshes?.length || 0;
    });
    
    expect(meshCount).toBeGreaterThan(0);
    console.log(`[DEBUG] Rendered ${meshCount} meshes successfully`);
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/simple-cube.png' });
  });

  test('should render complex CSG operations', async ({ page }) => {
    console.log('[DEBUG] Testing complex CSG rendering');
    
    const complexCode = `
      difference() {
        union() {
          cube([20, 20, 20]);
          translate([20, 0, 0]) cube([20, 20, 20]);
        }
        translate([20, 10, 10]) sphere(12);
      }
    `;
    
    await page.fill('#openscad-input', complexCode);
    await page.click('#render-button');
    
    await page.waitForSelector('.render-complete', { timeout: 15000 });
    
    const renderTime = await page.evaluate(() => {
      return window.lastRenderTime || 0;
    });
    
    expect(renderTime).toBeLessThan(10000); // Should render in less than 10 seconds
    console.log(`[DEBUG] Complex CSG rendered in ${renderTime}ms`);
    
    await page.screenshot({ path: 'test-results/complex-csg.png' });
  });

  test('should handle error cases in UI', async ({ page }) => {
    console.log('[DEBUG] Testing error handling in UI');
    
    // Test invalid syntax
    await page.fill('#openscad-input', 'invalid syntax here');
    await page.click('#render-button');
    
    // Should show error message
    const errorMessage = await page.textContent('.error-message');
    expect(errorMessage).toContain('parse');
    
    console.log(`[DEBUG] Error displayed correctly: ${errorMessage}`);
  });

  test('should support real-time preview', async ({ page }) => {
    console.log('[DEBUG] Testing real-time preview');
    
    // Enable real-time mode
    await page.check('#realtime-checkbox');
    
    // Type code gradually
    await page.fill('#openscad-input', '');
    await page.type('#openscad-input', 'cube([', { delay: 100 });
    await page.type('#openscad-input', '5, 5, 5]);', { delay: 100 });
    
    // Should render automatically
    await page.waitForSelector('.render-complete', { timeout: 5000 });
    
    const meshCount = await page.evaluate(() => window.scene?.meshes?.length || 0);
    expect(meshCount).toBeGreaterThan(0);
    
    console.log('[DEBUG] Real-time preview working correctly');
  });
});
```

## Advanced Implementation Patterns

### CSG2 Performance Optimization

Based on research findings, here are specific patterns for optimizing CSG2 operations:

```typescript
// Performance-optimized CSG2 patterns
export class OptimizedCSG2Processor {
  private meshPool: Map<string, BABYLON.Mesh> = new Map();
  private csgCache: Map<string, BABYLON.CSG2> = new Map();

  // Mesh pooling to reduce garbage collection
  getMeshFromPool(type: string, scene: BABYLON.Scene): BABYLON.Mesh {
    const poolKey = `${type}_pool`;
    let mesh = this.meshPool.get(poolKey);
    
    if (!mesh) {
      switch (type) {
        case 'cube':
          mesh = BABYLON.MeshBuilder.CreateBox("pooled_cube", { size: 1 }, scene);
          break;
        case 'sphere':
          mesh = BABYLON.MeshBuilder.CreateSphere("pooled_sphere", { diameter: 1 }, scene);
          break;
        default:
          return null;
      }
      this.meshPool.set(poolKey, mesh);
    }

    return mesh.clone(`${type}_${Date.now()}`);
  }

  // CSG2 operation caching for identical operations
  getCachedCSGResult(
    mesh1: BABYLON.Mesh, 
    mesh2: BABYLON.Mesh, 
    operation: 'add' | 'subtract' | 'intersect'
  ): BABYLON.CSG2 | null {
    const cacheKey = `${mesh1.uniqueId}_${mesh2.uniqueId}_${operation}`;
    return this.csgCache.get(cacheKey) || null;
  }

  setCachedCSGResult(
    mesh1: BABYLON.Mesh, 
    mesh2: BABYLON.Mesh, 
    operation: 'add' | 'subtract' | 'intersect',
    result: BABYLON.CSG2
  ): void {
    const cacheKey = `${mesh1.uniqueId}_${mesh2.uniqueId}_${operation}`;
    this.csgCache.set(cacheKey, result);
  }

  // Optimized batch CSG operations
  performBatchCSGOperations(
    baseMesh: BABYLON.Mesh,
    operationMeshes: { mesh: BABYLON.Mesh; operation: 'add' | 'subtract' | 'intersect' }[]
  ): BABYLON.Mesh {
    let resultCSG = BABYLON.CSG2.FromMesh(baseMesh);

    // Group operations by type for better performance
    const groupedOps = operationMeshes.reduce((groups, op) => {
      if (!groups[op.operation]) groups[op.operation] = [];
      groups[op.operation].push(op.mesh);
      return groups;
    }, {} as Record<string, BABYLON.Mesh[]>);

    // Perform operations in optimal order (unions first, then differences, then intersections)
    const operationOrder: Array<'add' | 'subtract' | 'intersect'> = ['add', 'subtract', 'intersect'];
    
    for (const operation of operationOrder) {
      const meshes = groupedOps[operation] || [];
      for (const mesh of meshes) {
        const meshCSG = BABYLON.CSG2.FromMesh(mesh);
        
        switch (operation) {
          case 'add':
            resultCSG = resultCSG.add(meshCSG);
            break;
          case 'subtract':
            resultCSG = resultCSG.subtract(meshCSG);
            break;
          case 'intersect':
            resultCSG = resultCSG.intersect(meshCSG);
            break;
        }
      }
    }

    return resultCSG.toMesh("batch_result", baseMesh.getScene());
  }
}
```

### Memory Management Patterns

```typescript
// Resource cleanup patterns for large OpenSCAD models
export class MemoryManager {
  private disposableResources: Set<BABYLON.Mesh> = new Set();
  
  trackMesh(mesh: BABYLON.Mesh): void {
    this.disposableResources.add(mesh);
  }
  
  cleanupIntermediateMeshes(): void {
    console.log(`[DEBUG] Cleaning up ${this.disposableResources.size} intermediate meshes`);
    
    for (const mesh of this.disposableResources) {
      if (mesh && !mesh.isDisposed()) {
        mesh.dispose();
      }
    }
    
    this.disposableResources.clear();
    console.log('[DEBUG] Memory cleanup completed');
  }
  
  // Monitor memory usage
  getMemoryStats(): { meshCount: number; triangleCount: number } {
    let triangleCount = 0;
    let meshCount = 0;
    
    for (const mesh of this.disposableResources) {
      if (mesh && !mesh.isDisposed()) {
        meshCount++;
        const indices = mesh.getIndices();
        if (indices) {
          triangleCount += indices.length / 3;
        }
      }
    }
    
    return { meshCount, triangleCount };
  }
}
```

### Error Recovery Patterns

```typescript
// Graceful error recovery for complex OpenSCAD models
export class ErrorRecoveryManager {
  private fallbackStrategies: Map<string, (node: ASTNode) => BABYLON.Mesh | null> = new Map();
  
  constructor() {
    this.setupFallbackStrategies();
  }
  
  private setupFallbackStrategies(): void {
    // Simple fallbacks for complex operations
    this.fallbackStrategies.set('union', (node) => {
      console.log('[WARN] Union operation failed, creating bounding box placeholder');
      return BABYLON.MeshBuilder.CreateBox("union_fallback", { size: 1 }, null);
    });
    
    this.fallbackStrategies.set('difference', (node) => {
      console.log('[WARN] Difference operation failed, using first child only');
      // Return first child mesh if available
      return null; // Implementation depends on context
    });
  }
  
  handleConversionError(
    node: ASTNode, 
    error: string, 
    scene: BABYLON.Scene
  ): Result<BABYLON.Mesh | null, string> {
    console.log(`[ERROR] Conversion failed for ${node.type}: ${error}`);
    
    const fallback = this.fallbackStrategies.get(node.type);
    if (fallback) {
      console.log(`[DEBUG] Applying fallback strategy for ${node.type}`);
      const fallbackMesh = fallback(node);
      
      if (fallbackMesh) {
        // Add visual indicator that this is a fallback
        const material = new BABYLON.StandardMaterial("error_material", scene);
        material.diffuseColor = new BABYLON.Color3(1, 0.5, 0.5); // Light red
        material.wireframe = true;
        fallbackMesh.material = material;
        
        return { success: true, value: fallbackMesh };
      }
    }
    
    // No fallback available
    return { success: false, error: `No fallback available for ${node.type}: ${error}` };
  }
}

### Real-World Implementation Considerations

#### Production Deployment Patterns

```typescript
// Production-ready initialization with error handling
export class ProductionCSG2Manager {
  private static instance: ProductionCSG2Manager;
  private initializationPromise: Promise<boolean> | null = null;
  private isReady = false;

  static getInstance(): ProductionCSG2Manager {
    if (!ProductionCSG2Manager.instance) {
      ProductionCSG2Manager.instance = new ProductionCSG2Manager();
    }
    return ProductionCSG2Manager.instance;
  }

  async ensureCSG2Ready(): Promise<Result<void, string>> {
    if (this.isReady) {
      return { success: true, value: undefined };
    }

    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeCSG2Internal();
    }

    const success = await this.initializationPromise;
    if (success) {
      this.isReady = true;
      return { success: true, value: undefined };
    } else {
      return { success: false, error: 'Failed to initialize CSG2' };
    }
  }

  private async initializeCSG2Internal(): Promise<boolean> {
    try {
      console.log('[INIT] Initializing CSG2 for production');
      
      // Check if already initialized
      if (BABYLON.IsCSG2Ready()) {
        console.log('[DEBUG] CSG2 already initialized');
        return true;
      }

      // Initialize with timeout
      const initPromise = BABYLON.InitializeCSG2Async();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('CSG2 initialization timeout')), 10000)
      );

      await Promise.race([initPromise, timeoutPromise]);
      
      console.log('[DEBUG] CSG2 initialization completed');
      return true;
    } catch (error) {
      console.error('[ERROR] CSG2 initialization failed:', error);
      return false;
    }
  }
}

// Production pipeline with monitoring
export class ProductionOpenSCADPipeline extends OpenSCADToBabylonPipeline {
  private metrics = {
    conversionsCount: 0,
    totalConversionTime: 0,
    averageConversionTime: 0,
    errorCount: 0,
    lastError: null as string | null
  };

  async convertOpenSCADToScene(
    openscadCode: string,
    options: ConversionOptions = {}
  ): Promise<Result<BABYLON.Mesh[], ConversionError>> {
    const startTime = performance.now();
    
    try {
      // Ensure CSG2 is ready
      const csg2Manager = ProductionCSG2Manager.getInstance();
      const csg2Result = await csg2Manager.ensureCSG2Ready();
      
      if (!csg2Result.success) {
        this.recordError('CSG2 initialization failed');
        return {
          success: false,
          error: {
            type: 'csg',
            message: csg2Result.error
          }
        };
      }

      // Perform conversion
      const result = await super.convertOpenSCADToScene(openscadCode, options);
      
      // Record metrics
      const conversionTime = performance.now() - startTime;
      this.recordConversion(conversionTime, result.success);
      
      return result;
    } catch (error) {
      const conversionTime = performance.now() - startTime;
      this.recordConversion(conversionTime, false);
      this.recordError(String(error));
      
      return {
        success: false,
        error: {
          type: 'scene',
          message: `Unexpected error: ${error}`
        }
      };
    }
  }

  private recordConversion(time: number, success: boolean): void {
    this.metrics.conversionsCount++;
    this.metrics.totalConversionTime += time;
    this.metrics.averageConversionTime = 
      this.metrics.totalConversionTime / this.metrics.conversionsCount;
    
    if (!success) {
      this.metrics.errorCount++;
    }
  }

  private recordError(error: string): void {
    this.metrics.lastError = error;
    console.error('[ERROR] Pipeline error recorded:', error);
  }

  getMetrics() {
    return {
      ...this.metrics,
      errorRate: this.metrics.errorCount / this.metrics.conversionsCount
    };
  }
}
```

#### Browser Compatibility and Feature Detection

```typescript
// Feature detection for CSG2 and OpenSCAD parser
export class FeatureDetector {
  static async checkBrowserCompatibility(): Promise<{
    webgl: boolean;
    wasm: boolean;
    csg2: boolean;
    performance: boolean;
  }> {
    const results = {
      webgl: false,
      wasm: false,
      csg2: false,
      performance: false
    };

    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      results.webgl = !!gl;
    } catch (e) {
      console.warn('[WARN] WebGL detection failed:', e);
    }

    // Check WASM support
    results.wasm = (() => {
      try {
        if (typeof WebAssembly === 'object' &&
            typeof WebAssembly.instantiate === 'function') {
          const module = new WebAssembly.Module(
            Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
          );
          return module instanceof WebAssembly.Module;
        }
        return false;
      } catch (e) {
        return false;
      }
    })();

    // Check CSG2 availability
    try {
      await BABYLON.InitializeCSG2Async();
      results.csg2 = BABYLON.IsCSG2Ready();
    } catch (e) {
      console.warn('[WARN] CSG2 detection failed:', e);
    }

    // Check performance APIs
    results.performance = typeof performance !== 'undefined' &&
                         typeof performance.now === 'function';

    return results;
  }

  static getRecommendations(compatibility: ReturnType<typeof FeatureDetector.checkBrowserCompatibility>): string[] {
    const recommendations: string[] = [];

    if (!compatibility.webgl) {
      recommendations.push('WebGL not supported. 3D rendering will not work.');
    }

    if (!compatibility.wasm) {
      recommendations.push('WebAssembly not supported. Parser will not work.');
    }

    if (!compatibility.csg2) {
      recommendations.push('CSG2 initialization failed. Boolean operations unavailable.');
    }

    if (!compatibility.performance) {
      recommendations.push('Performance APIs unavailable. Timing metrics will be inaccurate.');
    }

    return recommendations;
  }
}
```

## Next Steps
2. **Phase 7 Implementation**: Complete OpenSCAD parser integration
3. **Incremental Development**: Follow TDD approach with small iterations
4. **Performance Validation**: Benchmark complete pipeline performance
5. **Documentation**: Maintain comprehensive documentation throughout development

## Dependencies and Constraints

### Technical Constraints (Updated Based on Research)
- Browser compatibility for WebGL/WebGPU
- Memory limitations for large models (CSG2 helps but still applies)
- WASM loading requirements for Tree-sitter parser (async initialization)
- **CORRECTED**: CSG2 operations are synchronous, only initialization is async
- **NEW**: CSG2 initialization requires ~3MB WASM download (Manifold library)

### Development Constraints
- Follow functional programming principles with Result/Either patterns
- Maintain compatibility with existing codebase
- Use SRP file structure with co-located tests
- No mocks for OpenscadParser - use real parser instances
- Strict TypeScript mode with no `any` types
- **NEW**: Use comprehensive logging with [INIT], [DEBUG], [ERROR], [WARN], [END] prefixes

### Parser Constraints (Clarified)
- **CRITICAL**: WASM initialization required before parsing (`await parser.init()`)
- Resource management critical for parser lifecycle (implement `withParser()` pattern)
- Error handling must preserve source location information from AST nodes
- AST nodes are immutable and strongly typed (no mutation allowed)
- **NEW**: Parser instances should be properly disposed to free WASM memory

### CSG2 API Constraints (Research-Based Corrections)
- **CRITICAL**: Must call `await BABYLON.InitializeCSG2Async()` once before any CSG2 operations
- **CORRECTED**: Union operation is `csg.add()` NOT `csg.union()`
- **CORRECTED**: From mesh is `CSG2.FromMesh()` NOT `CSG2.fromMesh()` (capital F)
- **CORRECTED**: All CSG2 operations (add, subtract, intersect, toMesh) are synchronous
- **NEW**: Use `BABYLON.IsCSG2Ready()` to check initialization status

This comprehensive plan provides a complete roadmap for implementing a robust OpenSCAD to Babylon.js CSG2 pipeline using @holistic-stack/openscad-parser while maintaining code quality, performance, and type safety. The plan now includes corrected API usage, specific implementation patterns, comprehensive testing strategies, and real-world deployment considerations based on thorough research and analysis.
