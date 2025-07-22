# OpenSCAD Babylon API Reference

## Overview

This document provides comprehensive API reference for the OpenSCAD Babylon project, including all public interfaces, types, and usage examples.

## Core Types

### Result<T, E> Pattern

```typescript
/**
 * Result type for explicit error handling
 * @template T Success data type
 * @template E Error type
 */
type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Usage examples
function parseCode(code: string): Result<AST, ParseError> {
  // Implementation
}

function renderMesh(node: OpenSCADNode): Result<BABYLON.Mesh, RenderError> {
  // Implementation
}
```

### Branded Types

```typescript
/**
 * Branded types for type safety
 */
type NodeId = string & { __brand: 'NodeId' };
type MeshId = string & { __brand: 'MeshId' };
type SceneId = string & { __brand: 'SceneId' };

// Factory functions
function createNodeId(value: string): NodeId {
  return value as NodeId;
}

function createMeshId(value: string): MeshId {
  return value as MeshId;
}
```

### Error Types

```typescript
/**
 * Base error class
 */
abstract class OpenSCADError extends Error {
  abstract readonly code: string;
  abstract readonly category: ErrorCategory;
}

/**
 * Parse error for syntax issues
 */
class ParseError extends OpenSCADError {
  readonly code = 'PARSE_ERROR';
  readonly category = ErrorCategory.Parse;
  
  constructor(
    message: string,
    public readonly line?: number,
    public readonly column?: number
  ) {
    super(message);
  }
}

/**
 * Render error for 3D rendering issues
 */
class RenderError extends OpenSCADError {
  readonly code = 'RENDER_ERROR';
  readonly category = ErrorCategory.Render;
  
  constructor(
    message: string,
    public readonly nodeId?: NodeId
  ) {
    super(message);
  }
}

/**
 * Validation error for AST validation
 */
class ValidationError extends OpenSCADError {
  readonly code = 'VALIDATION_ERROR';
  readonly category = ErrorCategory.Validation;
}

/**
 * Performance error for performance violations
 */
class PerformanceError extends OpenSCADError {
  readonly code = 'PERFORMANCE_ERROR';
  readonly category = ErrorCategory.Performance;
  
  constructor(
    message: string,
    public readonly actualTime: number,
    public readonly expectedTime: number
  ) {
    super(message);
  }
}
```

## OpenSCAD AST API

### Base Node Interface

```typescript
/**
 * Base interface for all OpenSCAD nodes
 */
interface OpenSCADNodeBase {
  readonly id: NodeId;
  readonly type: OpenSCADNodeType;
  readonly children: readonly OpenSCADNode[];
  readonly parent?: OpenSCADNode;
  readonly metadata: NodeMetadata;
}

/**
 * Abstract base class for OpenSCAD nodes
 */
abstract class OpenSCADNode extends BABYLON.AbstractMesh implements OpenSCADNodeBase {
  abstract readonly type: OpenSCADNodeType;
  abstract evaluate(): Result<BABYLON.Mesh, RenderError>;
  abstract clone(): OpenSCADNode;
  abstract validate(): Result<void, ValidationError>;
  
  // Node management
  addChild(child: OpenSCADNode): void;
  removeChild(child: OpenSCADNode): void;
  getChildren(): readonly OpenSCADNode[];
  
  // Traversal
  traverse(visitor: NodeVisitor): void;
  find(predicate: (node: OpenSCADNode) => boolean): OpenSCADNode | null;
  
  // Serialization
  toJSON(): NodeJSON;
  static fromJSON(json: NodeJSON): OpenSCADNode;
}
```

### Node Types

```typescript
/**
 * OpenSCAD node type enumeration
 */
enum OpenSCADNodeType {
  // Primitives
  Cube = 'cube',
  Sphere = 'sphere',
  Cylinder = 'cylinder',
  Polyhedron = 'polyhedron',
  
  // 2D Primitives
  Square = 'square',
  Circle = 'circle',
  Polygon = 'polygon',
  
  // Transformations
  Translate = 'translate',
  Rotate = 'rotate',
  Scale = 'scale',
  Mirror = 'mirror',
  Multmatrix = 'multmatrix',
  
  // Boolean Operations
  Union = 'union',
  Difference = 'difference',
  Intersection = 'intersection',
  
  // Extrusion
  LinearExtrude = 'linear_extrude',
  RotateExtrude = 'rotate_extrude',
  
  // Control Flow
  For = 'for',
  If = 'if',
  Let = 'let',
  
  // Modules
  Module = 'module',
  ModuleCall = 'module_call',
  
  // Functions
  Function = 'function',
  FunctionCall = 'function_call'
}
```

### Primitive Nodes

```typescript
/**
 * Cube primitive node
 */
class CubeNode extends OpenSCADNode {
  readonly type = OpenSCADNodeType.Cube;
  
  constructor(
    name: string,
    scene: BABYLON.Scene,
    public readonly size: BABYLON.Vector3 = new BABYLON.Vector3(1, 1, 1),
    public readonly center: boolean = false
  ) {
    super(name, scene);
  }
  
  evaluate(): Result<BABYLON.Mesh, RenderError> {
    // Implementation
  }
  
  clone(): CubeNode {
    return new CubeNode(this.name, this.getScene(), this.size, this.center);
  }
}

/**
 * Sphere primitive node
 */
class SphereNode extends OpenSCADNode {
  readonly type = OpenSCADNodeType.Sphere;
  
  constructor(
    name: string,
    scene: BABYLON.Scene,
    public readonly radius: number = 1,
    public readonly fragments?: number
  ) {
    super(name, scene);
  }
  
  evaluate(): Result<BABYLON.Mesh, RenderError> {
    // Implementation
  }
}

/**
 * Cylinder primitive node
 */
class CylinderNode extends OpenSCADNode {
  readonly type = OpenSCADNodeType.Cylinder;
  
  constructor(
    name: string,
    scene: BABYLON.Scene,
    public readonly height: number = 1,
    public readonly radius1: number = 1,
    public readonly radius2?: number,
    public readonly center: boolean = false,
    public readonly fragments?: number
  ) {
    super(name, scene);
  }
  
  evaluate(): Result<BABYLON.Mesh, RenderError> {
    // Implementation
  }
}
```

### Transform Nodes

```typescript
/**
 * Translate transformation node
 */
class TranslateNode extends OpenSCADNode {
  readonly type = OpenSCADNodeType.Translate;
  
  constructor(
    name: string,
    scene: BABYLON.Scene,
    public readonly translation: BABYLON.Vector3
  ) {
    super(name, scene);
  }
  
  evaluate(): Result<BABYLON.Mesh, RenderError> {
    // Apply translation to children
  }
}

/**
 * Rotate transformation node
 */
class RotateNode extends OpenSCADNode {
  readonly type = OpenSCADNodeType.Rotate;
  
  constructor(
    name: string,
    scene: BABYLON.Scene,
    public readonly rotation: BABYLON.Vector3
  ) {
    super(name, scene);
  }
  
  evaluate(): Result<BABYLON.Mesh, RenderError> {
    // Apply rotation to children
  }
}

/**
 * Scale transformation node
 */
class ScaleNode extends OpenSCADNode {
  readonly type = OpenSCADNodeType.Scale;
  
  constructor(
    name: string,
    scene: BABYLON.Scene,
    public readonly scale: BABYLON.Vector3
  ) {
    super(name, scene);
  }
  
  evaluate(): Result<BABYLON.Mesh, RenderError> {
    // Apply scaling to children
  }
}
```

### CSG Nodes

```typescript
/**
 * Union boolean operation node
 */
class UnionNode extends OpenSCADNode {
  readonly type = OpenSCADNodeType.Union;
  
  evaluate(): Result<BABYLON.Mesh, RenderError> {
    // Perform boolean union on children
  }
}

/**
 * Difference boolean operation node
 */
class DifferenceNode extends OpenSCADNode {
  readonly type = OpenSCADNodeType.Difference;
  
  evaluate(): Result<BABYLON.Mesh, RenderError> {
    // Perform boolean difference on children
  }
}

/**
 * Intersection boolean operation node
 */
class IntersectionNode extends OpenSCADNode {
  readonly type = OpenSCADNodeType.Intersection;
  
  evaluate(): Result<BABYLON.Mesh, RenderError> {
    // Perform boolean intersection on children
  }
}
```

## Parser API

### Parser Manager

```typescript
/**
 * Main parser interface
 */
interface IOpenSCADParser {
  parse(code: string): Result<OpenSCADNode, ParseError>;
  validate(ast: OpenSCADNode): Result<void, ValidationError>;
  getErrors(): readonly ParseError[];
}

/**
 * Parser manager implementation
 */
class ParserManager implements IOpenSCADParser {
  private parser: Parser;
  private language: Language;
  
  /**
   * Initialize the parser
   */
  async initialize(): Promise<Result<void, ParserError>> {
    // Implementation
  }
  
  /**
   * Parse OpenSCAD code to AST
   */
  parse(code: string): Result<OpenSCADNode, ParseError> {
    // Implementation
  }
  
  /**
   * Validate AST structure
   */
  validate(ast: OpenSCADNode): Result<void, ValidationError> {
    // Implementation
  }
  
  /**
   * Get current parsing errors
   */
  getErrors(): readonly ParseError[] {
    // Implementation
  }
}
```

### AST Processor

```typescript
/**
 * AST processing utilities
 */
class ASTProcessor {
  /**
   * Convert tree-sitter node to OpenSCAD node
   */
  static processNode(node: SyntaxNode, scene: BABYLON.Scene): Result<OpenSCADNode, ProcessError> {
    // Implementation
  }
  
  /**
   * Optimize AST for rendering
   */
  static optimize(ast: OpenSCADNode): Result<OpenSCADNode, OptimizationError> {
    // Implementation
  }
  
  /**
   * Flatten AST for efficient processing
   */
  static flatten(ast: OpenSCADNode): OpenSCADNode[] {
    // Implementation
  }
}
```

## Renderer API

### Scene Manager

```typescript
/**
 * Scene management interface
 */
interface ISceneManager {
  initialize(canvas: HTMLCanvasElement): Result<void, RenderError>;
  render(ast: OpenSCADNode): Result<PerformanceMetrics, RenderError>;
  dispose(): void;
  getScene(): BABYLON.Scene | null;
}

/**
 * BabylonJS scene manager
 */
class BabylonSceneManager implements ISceneManager {
  private engine: BABYLON.Engine | null = null;
  private scene: BABYLON.Scene | null = null;
  private camera: BABYLON.Camera | null = null;
  
  /**
   * Initialize the 3D scene
   */
  initialize(canvas: HTMLCanvasElement): Result<void, RenderError> {
    // Implementation
  }
  
  /**
   * Render OpenSCAD AST to 3D scene
   */
  render(ast: OpenSCADNode): Result<PerformanceMetrics, RenderError> {
    // Implementation
  }
  
  /**
   * Dispose of all resources
   */
  dispose(): void {
    // Implementation
  }
  
  /**
   * Get the current scene
   */
  getScene(): BABYLON.Scene | null {
    return this.scene;
  }
}
```

### Mesh Converter

```typescript
/**
 * Mesh conversion utilities
 */
class MeshConverter {
  /**
   * Convert OpenSCAD node to BabylonJS mesh
   */
  static convertToMesh(node: OpenSCADNode): Result<BABYLON.Mesh, RenderError> {
    // Implementation
  }
  
  /**
   * Apply transformations to mesh
   */
  static applyTransform(
    mesh: BABYLON.Mesh,
    transform: BABYLON.Matrix
  ): Result<BABYLON.Mesh, RenderError> {
    // Implementation
  }
  
  /**
   * Optimize mesh for rendering
   */
  static optimizeMesh(mesh: BABYLON.Mesh): Result<BABYLON.Mesh, RenderError> {
    // Implementation
  }
}
```

### CSG Operations

```typescript
/**
 * CSG operations using manifold-3d
 */
class CSGOperations {
  /**
   * Perform boolean union
   */
  static union(meshes: BABYLON.Mesh[]): Result<BABYLON.Mesh, CSGError> {
    // Implementation
  }
  
  /**
   * Perform boolean difference
   */
  static difference(
    base: BABYLON.Mesh,
    subtract: BABYLON.Mesh
  ): Result<BABYLON.Mesh, CSGError> {
    // Implementation
  }
  
  /**
   * Perform boolean intersection
   */
  static intersection(meshes: BABYLON.Mesh[]): Result<BABYLON.Mesh, CSGError> {
    // Implementation
  }
}
```

## Store API

### State Interface

```typescript
/**
 * Application state interface
 */
interface AppState {
  editor: EditorState;
  parsing: ParsingState;
  scene: SceneState;
  ui: UIState;
}

/**
 * Editor state
 */
interface EditorState {
  content: string;
  cursorPosition: number;
  syntaxErrors: ParseError[];
  isModified: boolean;
}

/**
 * Parsing state
 */
interface ParsingState {
  ast: OpenSCADNode | null;
  isValid: boolean;
  errors: ParseError[];
  isLoading: boolean;
  lastParseTime: number;
}

/**
 * Scene state
 */
interface SceneState {
  meshes: BABYLON.Mesh[];
  camera: CameraState;
  performance: PerformanceMetrics;
  isRendering: boolean;
}
```

### Store Actions

```typescript
/**
 * Store action interface
 */
interface StoreActions {
  // Editor actions
  setEditorContent: (content: string) => void;
  setCursorPosition: (position: number) => void;
  setSyntaxErrors: (errors: ParseError[]) => void;
  
  // Parsing actions
  setAST: (ast: OpenSCADNode | null) => void;
  setParsingErrors: (errors: ParseError[]) => void;
  setParsingLoading: (loading: boolean) => void;
  
  // Scene actions
  setMeshes: (meshes: BABYLON.Mesh[]) => void;
  setCameraState: (camera: CameraState) => void;
  setPerformanceMetrics: (metrics: PerformanceMetrics) => void;
  setRendering: (rendering: boolean) => void;
}
```

## React Components API

### Editor Component

```typescript
/**
 * OpenSCAD editor component props
 */
interface OpenSCADEditorProps {
  value: string;
  onChange: (value: string) => void;
  onCursorChange?: (position: number) => void;
  errors?: ParseError[];
  readOnly?: boolean;
  theme?: 'light' | 'dark';
  fontSize?: number;
  showLineNumbers?: boolean;
  showMinimap?: boolean;
}

/**
 * OpenSCAD editor component
 */
function OpenSCADEditor(props: OpenSCADEditorProps): JSX.Element {
  // Implementation
}
```

### Scene Component

```typescript
/**
 * 3D scene component props
 */
interface BabylonSceneProps {
  ast: OpenSCADNode | null;
  onRenderComplete?: (metrics: PerformanceMetrics) => void;
  onError?: (error: RenderError) => void;
  width?: number;
  height?: number;
  antialias?: boolean;
  showInspector?: boolean;
}

/**
 * BabylonJS scene component
 */
function BabylonScene(props: BabylonSceneProps): JSX.Element {
  // Implementation
}
```

## Hooks API

### Parser Hook

```typescript
/**
 * OpenSCAD parser hook
 */
function useOpenSCADParser() {
  const parse = useCallback((code: string) => {
    // Implementation
  }, []);
  
  const validate = useCallback((ast: OpenSCADNode) => {
    // Implementation
  }, []);
  
  return {
    parse,
    validate,
    isLoading: false,
    errors: []
  };
}
```

### Scene Hook

```typescript
/**
 * BabylonJS scene hook
 */
function useBabylonScene(canvasRef: RefObject<HTMLCanvasElement>) {
  const [scene, setScene] = useState<BABYLON.Scene | null>(null);
  const [engine, setEngine] = useState<BABYLON.Engine | null>(null);
  
  const render = useCallback((ast: OpenSCADNode) => {
    // Implementation
  }, [scene]);
  
  return {
    scene,
    engine,
    render,
    isReady: scene !== null
  };
}
```

## Performance Metrics

```typescript
/**
 * Performance metrics interface
 */
interface PerformanceMetrics {
  parseTime: number;        // Parse time in milliseconds
  renderTime: number;       // Render time in milliseconds
  meshCount: number;        // Number of meshes in scene
  triangleCount: number;    // Total triangle count
  memoryUsage: number;      // Memory usage in MB
  fps: number;             // Frames per second
}

/**
 * Performance monitoring utilities
 */
class PerformanceMonitor {
  static startTiming(operation: string): () => number {
    // Implementation
  }
  
  static getMemoryUsage(): number {
    // Implementation
  }
  
  static getFPS(): number {
    // Implementation
  }
}
```

This API reference provides comprehensive documentation for all public interfaces in the OpenSCAD Babylon project.