# ADR-001: Use BabylonJS for 3D Rendering

## Status
Accepted

## Date
2024-12-19

## Context

The OpenSCAD Babylon project requires a robust 3D rendering engine to display OpenSCAD models in web browsers. The primary candidates were:

1. **Three.js** - Popular WebGL library with extensive ecosystem
2. **BabylonJS** - Microsoft-backed 3D engine with advanced features
3. **Custom WebGL** - Direct WebGL implementation

### Requirements
- High-performance 3D rendering with WebGL 2.0 support
- Advanced CSG (Constructive Solid Geometry) operations
- Scene management and object selection
- Export capabilities to multiple 3D formats
- TypeScript-first development experience
- Comprehensive testing support including headless rendering

### Evaluation Criteria
- **Performance**: Rendering speed and memory efficiency
- **Features**: Built-in CSG, materials, lighting, cameras
- **Ecosystem**: Community, documentation, plugins
- **TypeScript Support**: First-class TypeScript integration
- **Testing**: Headless rendering capabilities
- **Maintenance**: Active development and long-term support

## Decision

We chose **BabylonJS** as the 3D rendering engine for the following reasons:

### 1. Superior CSG Support
BabylonJS provides built-in CSG operations through the CSG2 library, which is essential for OpenSCAD boolean operations (union, difference, intersection). Three.js requires external libraries like three-csg-ts which have limitations and performance issues.

### 2. Advanced Scene Management
BabylonJS offers sophisticated scene management with:
- Hierarchical scene graphs
- Advanced material systems
- Comprehensive lighting models
- Built-in camera controls
- Efficient culling and LOD systems

### 3. TypeScript-First Design
BabylonJS is written in TypeScript and provides excellent type definitions out of the box, aligning with our TypeScript-first development approach.

### 4. Headless Testing Support
BabylonJS NullEngine provides robust headless rendering capabilities essential for our TDD approach and CI/CD pipeline testing.

### 5. Export Capabilities
BabylonJS includes built-in exporters for multiple 3D formats (STL, GLTF, GLB, 3MF) which are crucial for CAD applications.

### 6. Performance Characteristics
BabylonJS demonstrates superior performance for CAD-style applications with:
- Efficient mesh management
- Advanced WebGL 2.0 utilization
- Optimized rendering pipeline
- Memory management tools

### 7. Enterprise Support
Microsoft backing provides confidence in long-term maintenance and enterprise-grade reliability.

## Consequences

### Positive
- **Advanced CSG Operations**: Built-in boolean operations without external dependencies
- **Comprehensive Feature Set**: Materials, lighting, cameras, and scene management included
- **TypeScript Integration**: Excellent type safety and developer experience
- **Testing Capabilities**: Robust headless testing with NullEngine
- **Export Functionality**: Multiple 3D format export without additional libraries
- **Performance**: Optimized for complex 3D scenes and CAD applications
- **Documentation**: Extensive documentation and learning resources
- **Community**: Active community and regular updates

### Negative
- **Bundle Size**: Larger bundle size compared to minimal Three.js setups
- **Learning Curve**: Different API patterns compared to Three.js
- **Ecosystem**: Smaller plugin ecosystem compared to Three.js
- **Flexibility**: More opinionated architecture may limit some customizations

### Mitigation Strategies
- **Bundle Optimization**: Use tree-shaking and selective imports to minimize bundle size
- **Documentation**: Comprehensive internal documentation for BabylonJS patterns
- **Training**: Team training on BabylonJS concepts and best practices
- **Custom Extensions**: Develop custom extensions where needed

## Implementation Notes

### Key BabylonJS Features Used
- **Scene Management**: Hierarchical scene organization
- **CSG Operations**: Boolean operations for OpenSCAD modeling
- **Material System**: PBR materials for realistic rendering
- **Camera Controls**: Arc-rotate camera for CAD-style interaction
- **Selection System**: Ray-casting for object selection
- **Export System**: Multi-format 3D model export

### Integration Patterns
```typescript
// Scene initialization
const engine = new Engine(canvas, true);
const scene = new Scene(engine);

// CSG operations
const csgA = CSG.FromMesh(meshA);
const csgB = CSG.FromMesh(meshB);
const result = csgA.union(csgB).toMesh("union", scene);

// Headless testing
const engine = new NullEngine();
const scene = new Scene(engine);
```

### Performance Targets
- **Render Time**: <16ms per frame for smooth interaction
- **Memory Usage**: Efficient mesh and material management
- **Startup Time**: <2 seconds for initial scene setup
- **Export Time**: <5 seconds for typical CAD models

## Alternatives Considered

### Three.js
- **Pros**: Larger ecosystem, smaller core bundle, familiar API
- **Cons**: Limited CSG support, requires multiple external libraries, less TypeScript-native
- **Verdict**: Rejected due to CSG limitations and fragmented ecosystem for CAD features

### Custom WebGL
- **Pros**: Maximum control, minimal bundle size, custom optimizations
- **Cons**: Significant development time, maintenance burden, feature gaps
- **Verdict**: Rejected due to development complexity and time constraints

## References
- [BabylonJS Documentation](https://doc.babylonjs.com/)
- [BabylonJS CSG Documentation](https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set/csg)
- [BabylonJS TypeScript Guide](https://doc.babylonjs.com/setup/support/typeScript)
- [Performance Optimization Guide](https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene)

## Related ADRs
- [ADR-009: Use Manifold for CSG Operations](./009-manifold-csg-operations.md)
- [ADR-015: Use Headless Testing Strategy](./015-headless-testing-strategy.md)
