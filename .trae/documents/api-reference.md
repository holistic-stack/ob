# OpenSCAD Babylon API Reference

## Overview

This document provides comprehensive API documentation for the OpenSCAD Babylon project. The project follows a feature-based architecture with strict TypeScript, functional programming patterns, and BabylonJS integration.

## Core Types

### Result Pattern

```typescript
// Core Result type for error handling
type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Usage in all API functions
function apiFunction(): Result<ReturnType, ErrorType> {
  // Implementation
}
```

### Branded Types

```typescript
// Domain-specific ID types
type NodeId = string & { __brand: 'NodeId' };
type MeshId = string & { __brand: 'MeshId' };
type SceneId = string & { __brand: 'SceneId' };
type UserId = string & { __brand: 'UserId' };

// Factory functions
function createNodeId(value: string): NodeId;
function createMeshId(value: string): MeshId;
function createSceneId(value: string): SceneId;
function createUserId(value: string): UserId;
```

### Error Types

```typescript
// Base error interface
interface BaseError {
  message: string;
  code: string;
  timestamp: Date;
}

// Specific error types
interface ParseError extends BaseError {
  code: 'PARSE_ERROR';
  location?: {
    line: number;
    column: number;
  };
  syntaxError?: string;
}

interface RenderError extends BaseError {
  code: 'RENDER_ERROR';
  meshId?: MeshId;
  babylonError?: string;
}

interface ValidationError extends BaseError {
  code: 'VALIDATION_ERROR';
  field?: string;
  expectedType?: string;
}

interface PerformanceError extends BaseError {
  code: 'PERFORMANCE_ERROR';
  duration: number;
  threshold: number;
}
```

## OpenSCAD Parser API

### OpenSCADParser Class

```typescript
class OpenSCADParser {
  /**
   * Initialize the parser with tree-sitter grammar
   * @returns Promise that resolves when parser is ready
   */
  init(): Promise<void>;
  
  /**
   * Parse OpenSCAD code into AST
   * @param code - OpenSCAD source code
   * @returns Result containing AST or parse error
   */
  parse(code: string): Result<OpenSCADNode, ParseError>;
  
  /**
   * Validate OpenSCAD syntax without full parsing
   * @param code - OpenSCAD source code
   * @returns Result containing validation status
   */
  validate(code: string): Result<boolean, ValidationError>;
  
  /**
   * Get syntax errors from last parse operation
   * @returns Array of syntax errors with locations
   */
  getSyntaxErrors(): ParseError[];
  
  /**
   * Dispose parser resources
   */
  dispose(): void;
}
```

### OpenSCAD Node Types

```typescript
// Base node interface
abstract class OpenSCADNode extends BABYLON.AbstractMesh {
  protected _nodeType: OpenSCADNodeType;
  protected _parameters: Record<string, unknown>;
  
  constructor(
    name: string,
    scene: BABYLON.Scene,
    nodeType: OpenSCADNodeType,
    parameters?: Record<string, unknown>
  );
  
  /**
   * Evaluate node to generate BabylonJS mesh
   * @returns Result containing mesh or render error
   */
  abstract evaluate(): Result<BABYLON.Mesh, RenderError>;
  
  /**
   * Get the OpenSCAD node type
   * @returns Node type identifier
   */
  abstract getOpenSCADType(): OpenSCADNodeType;
  
  /**
   * Clone the node with new name and parent
   * @param name - New node name
   * @param newParent - Optional new parent node
   * @returns Cloned node instance
   */
  abstract clone(name: string, newParent?: BABYLON.Node): OpenSCADNode;
  
  /**
   * Get node parameters (read-only)
   * @returns Immutable parameters object
   */
  getParameters(): Readonly<Record<string, unknown>>;
  
  /**
   * Update node parameters
   * @param parameters - New parameters to merge
   * @returns Result indicating success or validation error
   */
  updateParameters(parameters: Partial<Record<string, unknown>>): Result<void, ValidationError>;
}
```

### Primitive Nodes

```typescript
// Cube primitive
class CubeNode extends OpenSCADNode {
  constructor(
    name: string,
    scene: BABYLON.Scene,
    size: [number, number, number]
  );
  
  evaluate(): Result<BABYLON.Mesh, RenderError>;
  getOpenSCADType(): 'cube';
  clone(name: string, newParent?: BABYLON.Node): CubeNode;
}

// Sphere primitive
class SphereNode extends OpenSCADNode {
  constructor(
    name: string,
    scene: BABYLON.Scene,
    radius: number,
    segments?: number
  );
  
  evaluate(): Result<BABYLON.Mesh, RenderError>;
  getOpenSCADType(): 'sphere';
  clone(name: string, newParent?: BABYLON.Node): SphereNode;
}

// Cylinder primitive
class CylinderNode extends OpenSCADNode {
  constructor(
    name: string,
    scene: BABYLON.Scene,
    height: number,
    radius1: number,
    radius2?: number,
    segments?: number
  );
  
  evaluate(): Result<BABYLON.Mesh, RenderError>;
  getOpenSCADType(): 'cylinder';
  clone(name: string, newParent?: BABYLON.Node): CylinderNode;
}
```

### Transform Nodes

```typescript
// Translation transform
class TranslateNode extends OpenSCADNode {
  constructor(
    name: string,
    scene: BABYLON.Scene,
    translation: [number, number, number]
  );
  
  evaluate(): Result<BABYLON.Mesh, RenderError>;
  getOpenSCADType(): 'translate';
  clone(name: string, newParent?: BABYLON.Node): TranslateNode;
}

// Rotation transform
class RotateNode extends OpenSCADNode {
  constructor(
    name: string,
    scene: BABYLON.Scene,
    rotation: [number, number, number]
  );
  
  evaluate(): Result<BABYLON.Mesh, RenderError>;
  getOpenSCADType(): 'rotate';
  clone(name: string, newParent?: BABYLON.Node): RotateNode;
}

// Scale transform
class ScaleNode extends OpenSCADNode {
  constructor(
    name: string,
    scene: BABYLON.Scene,
    scale: [number, number, number]
  );
  
  evaluate(): Result<BABYLON.Mesh, RenderError>;
  getOpenSCADType(): 'scale';
  clone(name: string, newParent?: BABYLON.Node): ScaleNode;
}
```

### CSG Operation Nodes

```typescript
// Union operation
class UnionNode extends OpenSCADNode {
  constructor(
    name: string,
    scene: BABYLON.Scene,
    children: OpenSCADNode[]
  );
  
  evaluate(): Result<BABYLON.Mesh, RenderError>;
  getOpenSCADType(): 'union';
  clone(name: string, newParent?: BABYLON.Node): UnionNode;
  
  addChild(child: OpenSCADNode): void;
  removeChild(child: OpenSCADNode): boolean;
  getChildren(): readonly OpenSCADNode[];
}

// Difference operation
class DifferenceNode extends OpenSCADNode {
  constructor(
    name: string,
    scene: BABYLON.Scene,
    children: OpenSCADNode[]
  );
  
  evaluate(): Result<BABYLON.Mesh, RenderError>;
  getOpenSCADType(): 'difference';
  clone(name: string, newParent?: BABYLON.Node): DifferenceNode;
}

// Intersection operation
class IntersectionNode extends OpenSCADNode {
  constructor(
    name: string,
    scene: BABYLON.Scene,
    children: OpenSCADNode[]
  );
  
  evaluate(): Result<BABYLON.Mesh, RenderError>;
  getOpenSCADType(): 'intersection';
  clone(name: string, newParent?: BABYLON.Node): IntersectionNode;
}
```

## BabylonJS Renderer API

### SceneManager Class

```typescript
class SceneManager {
  /**
   * Create scene manager with canvas element
   * @param canvas - HTML canvas element for rendering
   * @param options - Optional scene configuration
   */
  constructor(canvas: HTMLCanvasElement, options?: SceneOptions);
  
  /**
   * Get the BabylonJS scene instance
   * @returns Scene instance
   */
  getScene(): BABYLON.Scene;
  
  /**
   * Get the BabylonJS engine instance
   * @returns Engine instance
   */
  getEngine(): BABYLON.Engine;
  
  /**
   * Add mesh to scene with proper management
   * @param mesh - Mesh to add
   * @param id - Optional mesh identifier
   * @returns Result indicating success or error
   */
  addMesh(mesh: BABYLON.Mesh, id?: MeshId): Result<void, RenderError>;
  
  /**
   * Remove mesh from scene
   * @param meshId - Mesh identifier
   * @returns Result indicating success or error
   */
  removeMesh(meshId: MeshId): Result<void, RenderError>;
  
  /**
   * Clear all meshes from scene
   * @returns Result indicating success or error
   */
  clearScene(): Result<void, RenderError>;
  
  /**
   * Update scene with new AST
   * @param ast - OpenSCAD AST root node
   * @returns Result indicating success or error
   */
  updateScene(ast: OpenSCADNode): Result<void, RenderError>;
  
  /**
   * Resize scene to match canvas
   * @returns Result indicating success or error
   */
  resize(): Result<void, RenderError>;
  
  /**
   * Dispose scene and engine resources
   */
  dispose(): void;
}
```

### MeshGenerator Class

```typescript
class MeshGenerator {
  /**
   * Generate BabylonJS mesh from OpenSCAD node
   * @param node - OpenSCAD node to convert
   * @param scene - Target BabylonJS scene
   * @returns Result containing mesh or render error
   */
  static generateMesh(
    node: OpenSCADNode, 
    scene: BABYLON.Scene
  ): Result<BABYLON.Mesh, RenderError>;
  
  /**
   * Apply CSG operation to meshes
   * @param operation - CSG operation type
   * @param meshes - Input meshes
   * @param scene - Target scene
   * @returns Result containing resulting mesh
   */
  static applyCSGOperation(
    operation: 'union' | 'difference' | 'intersection',
    meshes: BABYLON.Mesh[],
    scene: BABYLON.Scene
  ): Result<BABYLON.Mesh, RenderError>;
  
  /**
   * Optimize mesh for performance
   * @param mesh - Mesh to optimize
   * @returns Result containing optimized mesh
   */
  static optimizeMesh(mesh: BABYLON.Mesh): Result<BABYLON.Mesh, RenderError>;
}
```

## Code Editor API

### EditorManager Class

```typescript
class EditorManager {
  /**
   * Initialize Monaco editor with OpenSCAD support
   * @param container - HTML element to contain editor
   * @param options - Editor configuration options
   */
  constructor(container: HTMLElement, options?: EditorOptions);
  
  /**
   * Get current editor content
   * @returns Current OpenSCAD code
   */
  getValue(): string;
  
  /**
   * Set editor content
   * @param value - OpenSCAD code to set
   * @returns Result indicating success or error
   */
  setValue(value: string): Result<void, ValidationError>;
  
  /**
   * Get current cursor position
   * @returns Cursor position with line and column
   */
  getCursorPosition(): { line: number; column: number };
  
  /**
   * Set cursor position
   * @param position - Target position
   * @returns Result indicating success or error
   */
  setCursorPosition(position: { line: number; column: number }): Result<void, ValidationError>;
  
  /**
   * Add syntax error markers
   * @param errors - Array of parse errors to display
   * @returns Result indicating success or error
   */
  setErrorMarkers(errors: ParseError[]): Result<void, ValidationError>;
  
  /**
   * Clear all error markers
   * @returns Result indicating success or error
   */
  clearErrorMarkers(): Result<void, ValidationError>;
  
  /**
   * Register content change callback
   * @param callback - Function to call on content change
   */
  onContentChange(callback: (content: string) => void): void;
  
  /**
   * Register cursor position change callback
   * @param callback - Function to call on cursor move
   */
  onCursorChange(callback: (position: { line: number; column: number }) => void): void;
  
  /**
   * Dispose editor resources
   */
  dispose(): void;
}
```

## State Management API

### Store Interfaces

```typescript
// Editor state slice
interface EditorSlice {
  content: string;
  cursorPosition: { line: number; column: number };
  syntaxErrors: ParseError[];
  isReadOnly: boolean;
  
  // Actions
  setContent: (content: string) => void;
  setCursorPosition: (position: { line: number; column: number }) => void;
  setSyntaxErrors: (errors: ParseError[]) => void;
  setReadOnly: (readOnly: boolean) => void;
}

// Parser state slice
interface ParserSlice {
  ast: OpenSCADNode | null;
  parseState: 'idle' | 'parsing' | 'success' | 'error';
  parseProgress: number;
  parseError: ParseError | null;
  
  // Actions
  setAST: (ast: OpenSCADNode | null) => void;
  setParseState: (state: 'idle' | 'parsing' | 'success' | 'error') => void;
  setParseProgress: (progress: number) => void;
  setParseError: (error: ParseError | null) => void;
}

// Scene state slice
interface SceneSlice {
  meshes: Map<MeshId, BABYLON.Mesh>;
  sceneId: SceneId;
  renderState: 'idle' | 'rendering' | 'success' | 'error';
  renderError: RenderError | null;
  
  // Actions
  addMesh: (id: MeshId, mesh: BABYLON.Mesh) => void;
  removeMesh: (id: MeshId) => void;
  clearMeshes: () => void;
  setRenderState: (state: 'idle' | 'rendering' | 'success' | 'error') => void;
  setRenderError: (error: RenderError | null) => void;
}

// Combined app state
type AppState = EditorSlice & ParserSlice & SceneSlice;
```

### Store Selectors

```typescript
// Memoized selectors for performance
const selectEditorContent = (state: AppState) => state.content;
const selectSyntaxErrors = (state: AppState) => state.syntaxErrors;
const selectAST = (state: AppState) => state.ast;
const selectMeshes = (state: AppState) => state.meshes;

// Computed selectors
const selectIsValidCode = createSelector(
  [selectAST, selectSyntaxErrors],
  (ast, errors) => ast !== null && errors.length === 0
);

const selectRenderableNodes = createSelector(
  [selectAST],
  (ast) => ast ? extractRenderableNodes(ast) : []
);

const selectErrorCount = createSelector(
  [selectSyntaxErrors],
  (errors) => errors.length
);
```

## React Hooks API

### Core Hooks

```typescript
/**
 * Hook for OpenSCAD parsing functionality
 * @returns Parser state and actions
 */
function useOpenSCADParser(): {
  parseState: 'idle' | 'parsing' | 'success' | 'error';
  ast: OpenSCADNode | null;
  errors: ParseError[];
  parseCode: (code: string) => Promise<void>;
  clearErrors: () => void;
};

/**
 * Hook for BabylonJS scene management
 * @param canvasRef - Ref to canvas element
 * @returns Scene manager and state
 */
function useBabylonScene(canvasRef: RefObject<HTMLCanvasElement>): {
  scene: BABYLON.Scene | null;
  engine: BABYLON.Engine | null;
  sceneManager: SceneManager | null;
  isReady: boolean;
};

/**
 * Hook for Monaco editor integration
 * @param containerRef - Ref to editor container
 * @param options - Editor options
 * @returns Editor manager and state
 */
function useMonacoEditor(
  containerRef: RefObject<HTMLElement>,
  options?: EditorOptions
): {
  editor: EditorManager | null;
  isReady: boolean;
  content: string;
  cursorPosition: { line: number; column: number };
};

/**
 * Hook for debounced operations
 * @param callback - Function to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced function
 */
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T;

/**
 * Hook for performance monitoring
 * @param operationName - Name of operation to monitor
 * @returns Performance measurement functions
 */
function usePerformanceMonitor(operationName: string): {
  startMeasurement: () => void;
  endMeasurement: () => number;
  getAverageTime: () => number;
  getLastTime: () => number;
};
```

## Utility Functions

### Validation Utilities

```typescript
/**
 * Validate OpenSCAD syntax
 * @param code - OpenSCAD code to validate
 * @returns Result with validation status
 */
function validateOpenSCADSyntax(code: string): Result<boolean, ValidationError>;

/**
 * Validate node parameters
 * @param nodeType - Type of OpenSCAD node
 * @param parameters - Parameters to validate
 * @returns Result with validation status
 */
function validateNodeParameters(
  nodeType: OpenSCADNodeType,
  parameters: Record<string, unknown>
): Result<boolean, ValidationError>;

/**
 * Check if coordinates are valid
 * @param coords - Coordinate array to validate
 * @returns True if coordinates are valid
 */
function isValidCoordinates(coords: number[]): boolean;
```

### Conversion Utilities

```typescript
/**
 * Convert OpenSCAD coordinates to BabylonJS
 * @param coords - OpenSCAD coordinates [x, y, z]
 * @returns BabylonJS Vector3
 */
function openSCADToBabylon(coords: [number, number, number]): BABYLON.Vector3;

/**
 * Convert BabylonJS coordinates to OpenSCAD
 * @param vector - BabylonJS Vector3
 * @returns OpenSCAD coordinates [x, y, z]
 */
function babylonToOpenSCAD(vector: BABYLON.Vector3): [number, number, number];

/**
 * Convert degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
function degreesToRadians(degrees: number): number;

/**
 * Convert radians to degrees
 * @param radians - Angle in radians
 * @returns Angle in degrees
 */
function radiansToDegrees(radians: number): number;
```

### Performance Utilities

```typescript
/**
 * Measure function execution time
 * @param fn - Function to measure
 * @param name - Optional name for logging
 * @returns Function result and execution time
 */
function measurePerformance<T>(
  fn: () => T,
  name?: string
): { result: T; duration: number };

/**
 * Create memoized function with custom equality
 * @param fn - Function to memoize
 * @param equalityFn - Custom equality function
 * @returns Memoized function
 */
function createMemoizedFunction<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  equalityFn?: (a: TArgs, b: TArgs) => boolean
): (...args: TArgs) => TReturn;

/**
 * Debounce function calls
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T;
```

## Constants and Enums

### OpenSCAD Node Types

```typescript
type OpenSCADNodeType = 
  // Primitives
  | 'cube'
  | 'sphere'
  | 'cylinder'
  | 'polyhedron'
  | 'polygon'
  | 'circle'
  | 'square'
  // Transforms
  | 'translate'
  | 'rotate'
  | 'scale'
  | 'mirror'
  | 'multmatrix'
  // CSG Operations
  | 'union'
  | 'difference'
  | 'intersection'
  // Extrusions
  | 'linear_extrude'
  | 'rotate_extrude'
  // Control Flow
  | 'for'
  | 'if'
  | 'let'
  // Functions
  | 'function'
  | 'module'
  // Modifiers
  | 'modifier'
  // Import
  | 'import'
  | 'include'
  | 'use';
```

### Performance Constants

```typescript
// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  RENDER_TIME_MS: 16, // Target 60fps
  PARSE_TIME_MS: 100,
  MESH_GENERATION_MS: 50,
  SCENE_UPDATE_MS: 32
} as const;

// Memory limits
const MEMORY_LIMITS = {
  MAX_VERTICES: 100000,
  MAX_FACES: 200000,
  MAX_NODES: 1000,
  MAX_SCENE_SIZE_MB: 100
} as const;
```

### Error Codes

```typescript
const ERROR_CODES = {
  // Parse errors
  SYNTAX_ERROR: 'PARSE_001',
  INVALID_TOKEN: 'PARSE_002',
  UNEXPECTED_EOF: 'PARSE_003',
  
  // Render errors
  MESH_GENERATION_FAILED: 'RENDER_001',
  CSG_OPERATION_FAILED: 'RENDER_002',
  SCENE_UPDATE_FAILED: 'RENDER_003',
  
  // Validation errors
  INVALID_PARAMETERS: 'VALIDATION_001',
  MISSING_REQUIRED_FIELD: 'VALIDATION_002',
  TYPE_MISMATCH: 'VALIDATION_003',
  
  // Performance errors
  RENDER_TIME_EXCEEDED: 'PERFORMANCE_001',
  MEMORY_LIMIT_EXCEEDED: 'PERFORMANCE_002',
  COMPLEXITY_LIMIT_EXCEEDED: 'PERFORMANCE_003'
} as const;
```

This API reference provides comprehensive documentation for all public interfaces in the OpenSCAD Babylon project, following functional programming principles and strict type safety.