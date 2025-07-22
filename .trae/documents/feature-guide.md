# OpenSCAD Babylon Feature Guide

## Feature Overview

The OpenSCAD Babylon project is organized into distinct feature modules, each with specific responsibilities and clear interfaces. This guide provides detailed information about each feature and how they interact.

## Feature Architecture

### Feature Structure Template

Each feature follows this consistent structure:

```
src/features/{feature-name}/
├── components/          # React components
├── hooks/              # Custom React hooks
├── services/           # Business logic and external integrations
├── types/              # TypeScript type definitions
├── utils/              # Pure utility functions
├── __tests__/          # Feature-level integration tests
└── index.ts            # Public API exports
```

## Core Features

### 1. Babylon Renderer Feature

**Location**: `src/features/babylon-renderer/`

**Purpose**: Handles all 3D rendering using BabylonJS, including scene management, mesh generation, and CSG operations.

#### Key Components

```typescript
// Main scene component
interface BabylonSceneProps {
  ast: OpenSCADNode | null;
  onRenderComplete?: (metrics: PerformanceMetrics) => void;
  onError?: (error: RenderError) => void;
}

function BabylonScene({ ast, onRenderComplete, onError }: BabylonSceneProps) {
  // Scene rendering logic
}

// Mesh converter service
class MeshConverter {
  static convertASTToMesh(node: OpenSCADNode): Result<BABYLON.Mesh, RenderError> {
    // AST to mesh conversion logic
  }
}

// CSG operations service
class CSGOperations {
  static union(meshes: BABYLON.Mesh[]): Result<BABYLON.Mesh, CSGError> {
    // Boolean union operation
  }
  
  static difference(base: BABYLON.Mesh, subtract: BABYLON.Mesh): Result<BABYLON.Mesh, CSGError> {
    // Boolean difference operation
  }
}
```

#### Key Services

- **SceneManager**: Manages BabylonJS scene lifecycle
- **MeshConverter**: Converts OpenSCAD AST nodes to BabylonJS meshes
- **CSGOperations**: Handles boolean operations using manifold-3d
- **MaterialManager**: Manages materials and textures
- **CameraController**: Handles camera positioning and controls

#### Performance Requirements

- **Render Time**: <16ms for 60fps
- **Memory Management**: Proper disposal of meshes and materials
- **Incremental Updates**: Only update changed parts of the scene
- **Level of Detail**: Reduce complexity for distant objects

#### Integration Points

- **Input**: OpenSCAD AST from parser feature
- **Output**: Rendered 3D scene
- **State**: Scene state managed in store feature
- **Events**: Performance metrics, render errors

### 2. Code Editor Feature

**Location**: `src/features/code-editor/`

**Purpose**: Provides Monaco editor integration with OpenSCAD syntax highlighting and real-time parsing feedback.

#### Key Components

```typescript
// Main editor component
interface OpenSCADEditorProps {
  value: string;
  onChange: (value: string) => void;
  onCursorChange?: (position: number) => void;
  errors?: ParseError[];
}

function OpenSCADEditor({ value, onChange, onCursorChange, errors }: OpenSCADEditorProps) {
  // Monaco editor integration
}

// Syntax highlighting service
class OpenSCADLanguage {
  static registerLanguage(monaco: typeof import('monaco-editor')) {
    // Register OpenSCAD language definition
  }
  
  static getTokenProvider(): monaco.languages.IMonarchLanguage {
    // OpenSCAD syntax highlighting rules
  }
}
```

#### Key Services

- **MonacoConfig**: Monaco editor configuration
- **OpenSCADLanguage**: Language definition and syntax highlighting
- **ErrorMarkers**: Display syntax errors in editor
- **AutoComplete**: OpenSCAD function and module completion
- **CodeFormatting**: Code formatting and indentation

#### Features

- **Syntax Highlighting**: Full OpenSCAD syntax support
- **Error Markers**: Real-time syntax error display
- **Auto-completion**: Built-in functions and user modules
- **Code Folding**: Collapsible code blocks
- **Find/Replace**: Advanced search functionality

#### Integration Points

- **Input**: User code input
- **Output**: OpenSCAD source code
- **State**: Editor state managed in store feature
- **Events**: Content changes, cursor position, errors

### 3. OpenSCAD Parser Feature

**Location**: `src/features/openscad-parser/`

**Purpose**: Parses OpenSCAD source code into AST using web-tree-sitter and converts to BabylonJS-compatible nodes.

#### Key Components

```typescript
// Parser manager
class ParserManager {
  private parser: Parser;
  private language: Language;
  
  async initialize(): Promise<Result<void, ParserError>> {
    // Initialize tree-sitter parser
  }
  
  parse(code: string): Result<OpenSCADNode, ParseError> {
    // Parse OpenSCAD code to AST
  }
}

// AST processor
class ASTProcessor {
  static processNode(node: SyntaxNode): Result<OpenSCADNode, ProcessError> {
    // Convert tree-sitter node to OpenSCAD node
  }
  
  static validateAST(ast: OpenSCADNode): Result<void, ValidationError> {
    // Validate AST structure and semantics
  }
}
```

#### Key Services

- **ParserManager**: Manages tree-sitter parser lifecycle
- **ASTProcessor**: Converts raw AST to typed nodes
- **ErrorHandler**: Handles parsing and validation errors
- **NodeFactory**: Creates specific OpenSCAD node types
- **Validator**: Validates AST structure and semantics

#### Supported OpenSCAD Features

- **Primitives**: cube, sphere, cylinder, polyhedron
- **Transformations**: translate, rotate, scale, mirror, multmatrix
- **Boolean Operations**: union, difference, intersection
- **Control Flow**: for, if, let statements
- **Functions**: Built-in mathematical and utility functions
- **Modules**: User-defined modules and function calls
- **Extrusion**: linear_extrude, rotate_extrude
- **Modifiers**: *, !, #, % modifiers

#### Integration Points

- **Input**: OpenSCAD source code from editor
- **Output**: Typed AST nodes for renderer
- **State**: Parsing state managed in store feature
- **Events**: Parse completion, errors, progress

### 4. Store Feature

**Location**: `src/features/store/`

**Purpose**: Manages application state using Zustand with middleware for persistence and debugging.

#### Key Components

```typescript
// Main store interface
interface AppState {
  editor: EditorSlice;
  parsing: ParsingSlice;
  scene: SceneSlice;
  ui: UISlice;
}

// Editor slice
interface EditorSlice {
  content: string;
  cursorPosition: number;
  syntaxErrors: ParseError[];
  setContent: (content: string) => void;
  setCursorPosition: (position: number) => void;
  setSyntaxErrors: (errors: ParseError[]) => void;
}

// Parsing slice
interface ParsingSlice {
  ast: OpenSCADNode | null;
  isValid: boolean;
  errors: ParseError[];
  isLoading: boolean;
  setAST: (ast: OpenSCADNode | null) => void;
  setErrors: (errors: ParseError[]) => void;
  setLoading: (loading: boolean) => void;
}
```

#### Key Services

- **Store Configuration**: Main Zustand store setup
- **Middleware**: Persistence, debugging, devtools
- **Selectors**: Memoized state selectors
- **Actions**: State update functions
- **Persistence**: Local storage integration

#### State Management Patterns

- **Slice Pattern**: Feature-based state organization
- **Immer Integration**: Immutable state updates
- **Selector Memoization**: Performance optimization
- **Middleware Chain**: Extensible middleware system

#### Integration Points

- **Consumers**: All features consume state
- **Producers**: Features update their respective slices
- **Persistence**: Local storage for user preferences
- **DevTools**: Redux DevTools integration

## Feature Interactions

### Data Flow

```
User Input → Editor → Parser → AST → Renderer → Scene
     ↓         ↓        ↓      ↓        ↓        ↓
   Store ← Store ← Store ← Store ← Store ← Store
```

### Event Flow

1. **User Types in Editor**
   - Editor updates content in store
   - Debounced parsing triggered
   - Parser processes code
   - AST updated in store
   - Renderer regenerates scene

2. **Parse Error Occurs**
   - Parser returns error result
   - Error stored in parsing slice
   - Editor displays error markers
   - Previous valid AST preserved

3. **Scene Render Complete**
   - Renderer emits performance metrics
   - Metrics stored in scene slice
   - UI updates performance indicators

### Cross-Feature Communication

```typescript
// Event system for loose coupling
interface FeatureEvents {
  'editor:content-changed': { content: string };
  'parser:ast-updated': { ast: OpenSCADNode };
  'parser:error': { errors: ParseError[] };
  'renderer:scene-updated': { metrics: PerformanceMetrics };
  'renderer:error': { error: RenderError };
}

// Event emitter service
class EventBus {
  static emit<K extends keyof FeatureEvents>(event: K, data: FeatureEvents[K]): void;
  static on<K extends keyof FeatureEvents>(event: K, handler: (data: FeatureEvents[K]) => void): void;
}
```

## Development Guidelines

### Adding New Features

1. **Create Feature Directory**: Follow the standard structure
2. **Define Public API**: Export only necessary interfaces
3. **Add Tests**: Comprehensive test coverage
4. **Update Store**: Add feature slice if needed
5. **Document Integration**: Update this guide

### Feature Dependencies

- **Shared Dependencies**: Use `src/shared/` for common utilities
- **Feature Dependencies**: Minimize direct feature-to-feature dependencies
- **Store Communication**: Use store for state sharing
- **Event Communication**: Use event bus for loose coupling

### Performance Considerations

- **Lazy Loading**: Load features on demand
- **Code Splitting**: Split features into separate bundles
- **Memoization**: Cache expensive computations
- **Debouncing**: Prevent excessive updates

### Testing Strategy

- **Unit Tests**: Test individual components and services
- **Integration Tests**: Test feature interactions
- **E2E Tests**: Test complete user workflows
- **Performance Tests**: Validate performance requirements

This feature guide provides the foundation for understanding and extending the OpenSCAD Babylon application architecture.