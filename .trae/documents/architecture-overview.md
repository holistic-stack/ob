# OpenSCAD Babylon Architecture Overview

## System Architecture

The OpenSCAD Babylon project implements a sophisticated 3D modeling application that bridges OpenSCAD syntax with real-time BabylonJS rendering. The architecture is designed for production use with strict performance requirements and comprehensive error handling.

## Core Design Principles

### 1. BabylonJS-Extended AST Pattern

The central architectural innovation is extending `BABYLON.AbstractMesh` to create OpenSCAD-specific node types:

```typescript
abstract class OpenSCADNode extends BABYLON.AbstractMesh {
  abstract evaluate(): Result<BABYLON.Mesh, RenderError>;
  abstract getOpenSCADType(): OpenSCADNodeType;
}

class PrimitiveNode extends OpenSCADNode {
  // Handles cube, sphere, cylinder, etc.
}

class TransformNode extends OpenSCADNode {
  // Handles translate, rotate, scale, etc.
}

class CSGNode extends OpenSCADNode {
  // Handles union, difference, intersection
}
```

### 2. Functional Programming Patterns

- **Pure Functions**: All utility functions are pure with no side effects
- **Immutable State**: Using Immer for state updates
- **Result<T,E> Pattern**: Explicit error handling without exceptions
- **Composition over Inheritance**: Favor function composition

### 3. Performance-First Design

- **Target**: <16ms render times for smooth 60fps
- **Memory Management**: Proper disposal of BabylonJS resources
- **Efficient CSG**: Using manifold-3d for complex boolean operations
- **Hot Reload**: <100ms development reload times

## Layer Architecture

### Layer 1: OpenSCAD Parser
- **Technology**: web-tree-sitter with custom OpenSCAD grammar
- **Input**: OpenSCAD source code
- **Output**: Raw AST nodes
- **Error Handling**: Syntax error recovery and reporting

### Layer 2: BabylonJS-Extended AST
- **Technology**: Custom node classes extending BABYLON.AbstractMesh
- **Input**: Raw AST from parser
- **Output**: Evaluatable mesh nodes
- **Features**: Type-safe node hierarchy, lazy evaluation

### Layer 3: Mesh Generation
- **Technology**: BabylonJS MeshBuilder + manifold-3d for CSG
- **Input**: Evaluated AST nodes
- **Output**: Renderable BabylonJS meshes
- **Optimization**: Mesh caching, efficient geometry generation

### Layer 4: Scene Management
- **Technology**: BabylonJS Scene with custom controls
- **Input**: Generated meshes
- **Output**: Rendered 3D scene
- **Features**: Camera controls, lighting, materials

## Data Flow

```
OpenSCAD Code → Parser → AST → Mesh Generation → Scene Rendering
     ↓            ↓      ↓           ↓              ↓
  Syntax Check → Type → Eval → Geometry Gen → Visual Output
```

## State Management Architecture

### Zustand Store Structure

```typescript
interface AppState {
  editor: {
    content: string;
    cursorPosition: number;
    syntaxErrors: ParseError[];
  };
  parsing: {
    ast: OpenSCADNode | null;
    isValid: boolean;
    errors: ParseError[];
  };
  scene: {
    meshes: BABYLON.Mesh[];
    camera: CameraState;
    performance: PerformanceMetrics;
  };
}
```

### State Update Flow

1. **Editor Change** → Debounced parsing trigger
2. **Parse Success** → AST update → Mesh regeneration
3. **Parse Error** → Error display → Previous state preserved
4. **Mesh Update** → Scene refresh → Performance monitoring

## Error Handling Strategy

### Result<T,E> Pattern Implementation

```typescript
type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Usage example
function parseOpenSCAD(code: string): Result<OpenSCADNode, ParseError> {
  try {
    const ast = parser.parse(code);
    return { success: true, data: ast };
  } catch (error) {
    return { success: false, error: new ParseError(error.message) };
  }
}
```

### Error Types Hierarchy

- **ParseError**: OpenSCAD syntax errors
- **ValidationError**: AST validation failures
- **RenderError**: BabylonJS rendering issues
- **PerformanceError**: Performance threshold violations
- **ResourceError**: Memory or loading issues

## Performance Monitoring

### Key Metrics

- **Parse Time**: Target <5ms for typical files
- **Render Time**: Target <16ms for 60fps
- **Memory Usage**: Monitor mesh and texture memory
- **Hot Reload**: Target <100ms for development

### Performance Optimization Strategies

1. **Lazy Evaluation**: Only evaluate visible/changed nodes
2. **Mesh Caching**: Cache generated geometries
3. **Level of Detail**: Reduce complexity for distant objects
4. **Incremental Updates**: Only update changed parts of scene

## Testing Architecture

### Test Categories

1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: Feature interactions
3. **Visual Regression**: Screenshot comparisons
4. **Performance Tests**: Render time validation
5. **Property-Based Tests**: Using fast-check for edge cases

### Test Organization

- **Co-located**: Tests adjacent to implementation
- **Real Implementations**: No mocks for core functionality
- **Coverage Target**: 95%+ across all features
- **CI/CD Integration**: Automated testing on all commits

## Security Considerations

### Code Execution Safety

- **Sandboxed Parsing**: Parser runs in isolated context
- **Resource Limits**: Memory and computation limits
- **Input Validation**: Strict validation of all inputs
- **Error Boundaries**: Prevent crashes from propagating

### Performance Security

- **DoS Prevention**: Limits on file size and complexity
- **Memory Limits**: Prevent memory exhaustion
- **Timeout Protection**: Prevent infinite loops

## Extensibility Design

### Plugin Architecture

- **Custom Primitives**: Add new OpenSCAD primitives
- **Custom Transformations**: Add new transformation types
- **Custom Renderers**: Support for other 3D engines
- **Custom Exporters**: Add new export formats

### API Design

- **Stable Interfaces**: Versioned APIs for extensions
- **Event System**: Hooks for custom behavior
- **Configuration**: Extensive customization options
- **Documentation**: Comprehensive API documentation

This architecture provides a solid foundation for a production-ready 3D modeling application with room for future enhancements and extensions.