# OpenSCAD Babylon Coding Patterns

## Overview

This document outlines the coding patterns, standards, and best practices for the OpenSCAD Babylon project. The project follows bulletproof-react architecture with strict TypeScript, functional programming principles, and performance-first design.

## Core Principles

### 1. Functional Programming
- **Pure Functions**: No side effects, predictable outputs
- **Immutable State**: Using Immer for state updates
- **Function Composition**: Building complex logic from simple functions
- **Result<T,E> Pattern**: Explicit error handling without exceptions

### 2. Type Safety
- **Strict TypeScript**: Zero `any` types, explicit return types
- **Branded Types**: Enhanced type safety for domain objects
- **Discriminated Unions**: Type-safe state management
- **Utility Types**: Leveraging TypeScript's advanced type system

### 3. Performance First
- **<16ms Render Times**: Target for 60fps rendering
- **Memory Management**: Proper resource disposal
- **Lazy Evaluation**: Only compute when needed
- **Memoization**: Cache expensive computations

## TypeScript Patterns

### Result Pattern for Error Handling

```typescript
// Core Result type
type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Usage example
function parseOpenSCAD(code: string): Result<OpenSCADNode, ParseError> {
  try {
    const ast = parser.parse(code);
    return { success: true, data: ast };
  } catch (error) {
    return { 
      success: false, 
      error: new ParseError(error.message, error.location) 
    };
  }
}

// Consuming Result
const parseResult = parseOpenSCAD(userCode);
if (parseResult.success) {
  // TypeScript knows parseResult.data is OpenSCADNode
  renderAST(parseResult.data);
} else {
  // TypeScript knows parseResult.error is ParseError
  displayError(parseResult.error);
}
```

### Branded Types for Domain Safety

```typescript
// Branded types prevent mixing similar primitives
type NodeId = string & { __brand: 'NodeId' };
type MeshId = string & { __brand: 'MeshId' };
type UserId = string & { __brand: 'UserId' };

// Factory functions for branded types
function createNodeId(value: string): NodeId {
  return value as NodeId;
}

// Usage prevents accidental mixing
function findNode(id: NodeId): OpenSCADNode | null {
  // Implementation
}

// This would be a TypeScript error:
// findNode("some-string"); // Error: string not assignable to NodeId
// Must use: findNode(createNodeId("some-string"));
```

### Discriminated Unions for State

```typescript
// Parser state with discriminated union
type ParserState = 
  | { status: 'idle' }
  | { status: 'parsing'; progress: number }
  | { status: 'success'; ast: OpenSCADNode }
  | { status: 'error'; error: ParseError };

// Type-safe state handling
function handleParserState(state: ParserState) {
  switch (state.status) {
    case 'idle':
      // TypeScript knows no additional properties
      showIdleState();
      break;
    case 'parsing':
      // TypeScript knows state.progress exists
      showProgress(state.progress);
      break;
    case 'success':
      // TypeScript knows state.ast exists
      renderAST(state.ast);
      break;
    case 'error':
      // TypeScript knows state.error exists
      displayError(state.error);
      break;
  }
}
```

## React Patterns

### Functional Components with Explicit Props

```typescript
// Props interface with clear documentation
interface OpenSCADEditorProps {
  /** Current OpenSCAD code content */
  value: string;
  /** Callback when code changes */
  onChange: (value: string) => void;
  /** Optional syntax errors to display */
  errors?: ParseError[];
  /** Whether editor is read-only */
  readOnly?: boolean;
}

// Functional component with destructured props
function OpenSCADEditor({ 
  value, 
  onChange, 
  errors = [], 
  readOnly = false 
}: OpenSCADEditorProps) {
  // Component implementation
  return (
    <div className="openscad-editor">
      {/* Editor implementation */}
    </div>
  );
}
```

### Custom Hooks for Logic Extraction

```typescript
// Custom hook for OpenSCAD parsing
function useOpenSCADParser() {
  const [parseState, setParseState] = useState<ParserState>({ status: 'idle' });
  
  const parseCode = useCallback(async (code: string) => {
    setParseState({ status: 'parsing', progress: 0 });
    
    try {
      const result = await parseOpenSCAD(code);
      if (result.success) {
        setParseState({ status: 'success', ast: result.data });
      } else {
        setParseState({ status: 'error', error: result.error });
      }
    } catch (error) {
      setParseState({ 
        status: 'error', 
        error: new ParseError('Unexpected parsing error') 
      });
    }
  }, []);
  
  return { parseState, parseCode };
}

// Usage in component
function CodeEditor() {
  const { parseState, parseCode } = useOpenSCADParser();
  const [code, setCode] = useState('');
  
  // Debounced parsing
  const debouncedParse = useMemo(
    () => debounce(parseCode, 300),
    [parseCode]
  );
  
  useEffect(() => {
    if (code.trim()) {
      debouncedParse(code);
    }
  }, [code, debouncedParse]);
  
  return (
    <OpenSCADEditor 
      value={code}
      onChange={setCode}
      errors={parseState.status === 'error' ? [parseState.error] : []}
    />
  );
}
```

### Error Boundaries for Resilience

```typescript
// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class FeatureErrorBoundary extends Component<
  PropsWithChildren<{}>, 
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Feature error boundary caught error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <details>
            {this.state.error?.message}
          </details>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Usage wrapper
function FeatureWithErrorBoundary({ children }: PropsWithChildren) {
  return (
    <FeatureErrorBoundary>
      {children}
    </FeatureErrorBoundary>
  );
}
```

## BabylonJS Patterns

### AbstractMesh Extension Pattern

```typescript
// Base OpenSCAD node extending BabylonJS AbstractMesh
abstract class OpenSCADNode extends BABYLON.AbstractMesh {
  protected _nodeType: OpenSCADNodeType;
  protected _parameters: Record<string, unknown>;
  
  constructor(
    name: string,
    scene: BABYLON.Scene,
    nodeType: OpenSCADNodeType,
    parameters: Record<string, unknown> = {}
  ) {
    super(name, scene);
    this._nodeType = nodeType;
    this._parameters = parameters;
  }
  
  // Abstract methods for subclasses
  abstract evaluate(): Result<BABYLON.Mesh, RenderError>;
  abstract getOpenSCADType(): OpenSCADNodeType;
  abstract clone(name: string, newParent?: BABYLON.Node): OpenSCADNode;
  
  // Common functionality
  getParameters(): Readonly<Record<string, unknown>> {
    return { ...this._parameters };
  }
  
  dispose(): void {
    // Clean up resources
    super.dispose();
  }
}

// Concrete implementation
class CubeNode extends OpenSCADNode {
  constructor(
    name: string,
    scene: BABYLON.Scene,
    size: [number, number, number]
  ) {
    super(name, scene, 'cube', { size });
  }
  
  evaluate(): Result<BABYLON.Mesh, RenderError> {
    try {
      const [x, y, z] = this._parameters.size as [number, number, number];
      const mesh = BABYLON.MeshBuilder.CreateBox(
        this.name,
        { width: x, height: y, depth: z },
        this.getScene()
      );
      return { success: true, data: mesh };
    } catch (error) {
      return { 
        success: false, 
        error: new RenderError(`Failed to create cube: ${error.message}`) 
      };
    }
  }
  
  getOpenSCADType(): OpenSCADNodeType {
    return 'cube';
  }
  
  clone(name: string, newParent?: BABYLON.Node): CubeNode {
    const cloned = new CubeNode(
      name,
      this.getScene(),
      this._parameters.size as [number, number, number]
    );
    if (newParent) {
      cloned.setParent(newParent);
    }
    return cloned;
  }
}
```

### Scene Management Pattern

```typescript
// Scene manager with proper lifecycle
class SceneManager {
  private _engine: BABYLON.Engine;
  private _scene: BABYLON.Scene;
  private _camera: BABYLON.Camera;
  private _disposed = false;
  
  constructor(canvas: HTMLCanvasElement) {
    this._engine = new BABYLON.Engine(canvas, true);
    this._scene = new BABYLON.Scene(this._engine);
    this._camera = this.createCamera();
    this.setupLighting();
    this.startRenderLoop();
  }
  
  private createCamera(): BABYLON.Camera {
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      0, 0, 10,
      BABYLON.Vector3.Zero(),
      this._scene
    );
    camera.attachControls(this._engine.getRenderingCanvas());
    return camera;
  }
  
  private setupLighting(): void {
    new BABYLON.HemisphericLight(
      'light',
      new BABYLON.Vector3(0, 1, 0),
      this._scene
    );
  }
  
  private startRenderLoop(): void {
    this._engine.runRenderLoop(() => {
      if (!this._disposed) {
        this._scene.render();
      }
    });
  }
  
  addMesh(mesh: BABYLON.Mesh): void {
    // Add mesh to scene with proper management
    mesh.parent = null;
    this._scene.addMesh(mesh);
  }
  
  removeMesh(mesh: BABYLON.Mesh): void {
    // Remove and dispose mesh properly
    mesh.dispose();
  }
  
  dispose(): void {
    if (this._disposed) return;
    
    this._disposed = true;
    this._scene.dispose();
    this._engine.dispose();
  }
}
```

## State Management Patterns

### Zustand Store Slices

```typescript
// Editor slice
interface EditorSlice {
  content: string;
  cursorPosition: number;
  syntaxErrors: ParseError[];
  setContent: (content: string) => void;
  setCursorPosition: (position: number) => void;
  setSyntaxErrors: (errors: ParseError[]) => void;
}

const createEditorSlice: StateCreator<
  AppState,
  [],
  [],
  EditorSlice
> = (set) => ({
  content: '',
  cursorPosition: 0,
  syntaxErrors: [],
  setContent: (content) => set(
    produce((state) => {
      state.editor.content = content;
    })
  ),
  setCursorPosition: (position) => set(
    produce((state) => {
      state.editor.cursorPosition = position;
    })
  ),
  setSyntaxErrors: (errors) => set(
    produce((state) => {
      state.editor.syntaxErrors = errors;
    })
  ),
});

// Combined store
type AppState = EditorSlice & ParserSlice & SceneSlice;

const useAppStore = create<AppState>()((...a) => ({
  ...createEditorSlice(...a),
  ...createParserSlice(...a),
  ...createSceneSlice(...a),
}));
```

### Memoized Selectors

```typescript
// Selectors with reselect for performance
const selectEditorContent = (state: AppState) => state.editor.content;
const selectParserAST = (state: AppState) => state.parser.ast;
const selectSyntaxErrors = (state: AppState) => state.editor.syntaxErrors;

// Memoized computed values
const selectIsValidCode = createSelector(
  [selectParserAST, selectSyntaxErrors],
  (ast, errors) => ast !== null && errors.length === 0
);

const selectRenderableNodes = createSelector(
  [selectParserAST],
  (ast) => ast ? extractRenderableNodes(ast) : []
);

// Usage in components
function EditorStatus() {
  const isValid = useAppStore(selectIsValidCode);
  const errorCount = useAppStore(state => state.editor.syntaxErrors.length);
  
  return (
    <div className={`status ${isValid ? 'valid' : 'invalid'}`}>
      {isValid ? 'Valid' : `${errorCount} errors`}
    </div>
  );
}
```

## Testing Patterns

### Unit Testing with Real Implementations

```typescript
// No mocks for core functionality
describe('OpenSCADParser', () => {
  let parser: OpenSCADParser;
  
  beforeEach(async () => {
    parser = new OpenSCADParser();
    await parser.init();
  });
  
  afterEach(() => {
    parser.dispose();
  });
  
  it('should parse cube syntax correctly', () => {
    const result = parser.parse('cube([1, 2, 3]);');
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.getOpenSCADType()).toBe('cube');
      expect(result.data.getParameters().size).toEqual([1, 2, 3]);
    }
  });
});

// BabylonJS testing with NullEngine
describe('CubeNode', () => {
  let scene: BABYLON.Scene;
  let engine: BABYLON.NullEngine;
  
  beforeEach(() => {
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
  });
  
  afterEach(() => {
    scene.dispose();
    engine.dispose();
  });
  
  it('should create cube mesh with correct dimensions', () => {
    const cubeNode = new CubeNode('test-cube', scene, [2, 3, 4]);
    const result = cubeNode.evaluate();
    
    expect(result.success).toBe(true);
    if (result.success) {
      const mesh = result.data;
      expect(mesh.name).toBe('test-cube');
      // Verify mesh properties
    }
  });
});
```

### Property-Based Testing

```typescript
// Using fast-check for edge case discovery
import fc from 'fast-check';

describe('Vector3 operations', () => {
  it('should maintain vector properties under transformation', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -100, max: 100 }),
        fc.float({ min: -100, max: 100 }),
        fc.float({ min: -100, max: 100 }),
        (x, y, z) => {
          const vector = new BABYLON.Vector3(x, y, z);
          const transformed = vector.scale(2).scale(0.5);
          
          // Should be approximately equal to original
          expect(transformed.x).toBeCloseTo(x, 5);
          expect(transformed.y).toBeCloseTo(y, 5);
          expect(transformed.z).toBeCloseTo(z, 5);
        }
      )
    );
  });
});
```

## Performance Patterns

### Memoization and Caching

```typescript
// Memoized expensive computations
const memoizedMeshGeneration = useMemo(() => {
  return createMemoizedFunction((ast: OpenSCADNode) => {
    const startTime = performance.now();
    const result = generateMesh(ast);
    const duration = performance.now() - startTime;
    
    // Performance monitoring
    if (duration > 16) {
      console.warn(`Mesh generation took ${duration}ms`);
    }
    
    return result;
  });
}, []);

// Debounced operations
const debouncedParse = useCallback(
  debounce((code: string) => {
    parseCode(code);
  }, 300),
  [parseCode]
);

// Resource cleanup
useEffect(() => {
  const resources = createResources();
  
  return () => {
    resources.forEach(resource => resource.dispose());
  };
}, []);
```

### Memory Management

```typescript
// Proper BabylonJS resource disposal
class MeshManager {
  private _meshes = new Map<string, BABYLON.Mesh>();
  
  addMesh(id: string, mesh: BABYLON.Mesh): void {
    // Dispose existing mesh if present
    const existing = this._meshes.get(id);
    if (existing) {
      existing.dispose();
    }
    
    this._meshes.set(id, mesh);
  }
  
  removeMesh(id: string): void {
    const mesh = this._meshes.get(id);
    if (mesh) {
      mesh.dispose();
      this._meshes.delete(id);
    }
  }
  
  dispose(): void {
    for (const mesh of this._meshes.values()) {
      mesh.dispose();
    }
    this._meshes.clear();
  }
}
```

## File Organization Patterns

### Feature Structure

```
src/features/feature-name/
├── components/
│   ├── component-name/
│   │   ├── component-name.tsx
│   │   ├── component-name.test.tsx
│   │   └── index.ts
│   └── index.ts
├── hooks/
│   ├── use-feature-hook/
│   │   ├── use-feature-hook.ts
│   │   ├── use-feature-hook.test.ts
│   │   └── index.ts
│   └── index.ts
├── services/
│   ├── feature-service/
│   │   ├── feature-service.ts
│   │   ├── feature-service.test.ts
│   │   └── index.ts
│   └── index.ts
├── types/
│   ├── feature-types.ts
│   └── index.ts
├── utils/
│   ├── feature-utils/
│   │   ├── feature-utils.ts
│   │   ├── feature-utils.test.ts
│   │   └── index.ts
│   └── index.ts
└── index.ts
```

### Index File Pattern

```typescript
// Clean public API exports
// src/features/openscad-parser/index.ts
export { OpenSCADParser } from './services/openscad-parser';
export { useOpenSCADParser } from './hooks/use-openscad-parser';
export type { 
  OpenSCADNode, 
  ParseError, 
  ParserOptions 
} from './types';

// Re-export commonly used utilities
export { 
  createNodeId, 
  isValidOpenSCADCode 
} from './utils';
```

These patterns ensure consistent, maintainable, and performant code across the OpenSCAD Babylon project while adhering to functional programming principles and strict type safety.