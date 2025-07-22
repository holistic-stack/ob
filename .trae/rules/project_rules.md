# OpenSCAD Babylon Project Rules

## Project Overview

This is a **production-ready** web-based 3D model editor that uses OpenSCAD syntax for real-time 3D visualization with BabylonJS rendering. The project follows bulletproof-react architecture with feature-based organization.

## Architecture Principles

### Core Architecture
- **BabylonJS-Extended AST**: Extends `BABYLON.AbstractMesh` as base class for unified abstract mesh layer
- **Feature-Based Organization**: Each feature is self-contained with co-located tests
- **Functional Programming**: Pure functions, immutable state, Result<T,E> patterns
- **Zero TypeScript Errors**: Strict TypeScript with branded types mandatory
- **Framework-Agnostic**: BabylonJS and OpenSCAD parser implementation independent of React

### 4-Layer Architecture
1. **OpenSCAD Parser Layer**: Tree-sitter grammar, visitor pattern, error recovery
2. **BabylonJS-Extended AST Layer**: OpenSCADNode extends BABYLON.AbstractMesh
3. **Mesh Generation Layer**: BabylonJS Mesh Builder, BABYLON.CSG integration
4. **Scene Management Layer**: BABYLON.Scene integration, camera controls, lighting

## Technology Stack

### Core Framework
- **React 19.0.0** with concurrent features
- **TypeScript 5.8.3** with strict mode
- **Vite 6.0.0** for development
- **pnpm** as package manager

### 3D Rendering
- **BabylonJS 8.16.1** for 3D graphics
- **manifold-3d 3.1.1** for CSG operations
- **OpenSCAD coordinate system**: Z-up, right-handed

### State Management
- **Zustand 5.0.5** for state management
- **Immer 10.1.1** for immutable updates
- **Reselect 5.1.1** for memoized selectors

### Code Editor
- **Monaco Editor 0.52.2** with OpenSCAD syntax highlighting
- **web-tree-sitter 0.25.3** for parsing

### Quality Tools
- **Biome 2.0.6** for linting and formatting
- **Vitest 1.6.1** for unit testing
- **Playwright 1.53.0** for E2E testing

## Project Structure

```
src/
├── features/                    # Feature-based modules
│   ├── babylon-renderer/        # BabylonJS 3D rendering
│   ├── code-editor/            # Monaco editor integration
│   ├── openscad-parser/        # AST parsing integration
│   └── store/                  # Zustand state management
├── shared/                     # Shared utilities and components
│   ├── components/             # Reusable UI components
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Pure utility functions
│   └── services/               # Shared services
└── test/                       # Test utilities and setup
```

## Coding Standards

### File Organization
- **Co-located tests**: Every component/function has adjacent `.test.ts` file
- **Files under 500 lines**: Split large files into smaller, focused modules
- **Single Responsibility Principle**: Each file has one clear purpose
- **Index files**: Use `index.ts` for clean exports

### TypeScript Guidelines
- **Strict mode enabled**: No `any` types, explicit return types
- **Result<T,E> pattern**: For error handling instead of throwing exceptions
- **Branded types**: For type safety (e.g., `type UserId = string & { __brand: 'UserId' }`)
- **Functional programming**: Pure functions, immutable data structures

### React Patterns
- **Functional components only**: No class components
- **Custom hooks**: Extract reusable logic into hooks
- **Error boundaries**: Wrap components with error boundaries
- **Suspense**: Use for async operations and code splitting

### BabylonJS Integration
- **AbstractMesh extension**: All OpenSCAD nodes extend BABYLON.AbstractMesh
- **Scene management**: Centralized scene lifecycle management
- **Performance optimization**: Target <16ms render times
- **Memory management**: Proper disposal of meshes and materials

## Feature-Specific Guidelines

### Babylon Renderer Feature
- **Location**: `src/features/babylon-renderer/`
- **Purpose**: 3D scene rendering and mesh generation
- **Key components**: Scene management, mesh conversion, CSG operations
- **Performance**: <16ms render times, efficient memory usage

### Code Editor Feature
- **Location**: `src/features/code-editor/`
- **Purpose**: Monaco editor with OpenSCAD syntax support
- **Key components**: Editor configuration, syntax highlighting, real-time parsing
- **Integration**: Real-time AST updates to 3D renderer

### OpenSCAD Parser Feature
- **Location**: `src/features/openscad-parser/`
- **Purpose**: Parse OpenSCAD syntax into AST
- **Key components**: Tree-sitter integration, AST processing, error handling
- **Output**: BabylonJS-compatible AST nodes

### Store Feature
- **Location**: `src/features/store/`
- **Purpose**: Application state management
- **Pattern**: Zustand slices with middleware
- **State**: Editor content, parsing results, scene state

## Testing Strategy

### Test Coverage
- **Target**: 95%+ test coverage
- **Real implementations**: No mocks for core functionality
- **Co-located tests**: Tests adjacent to implementation files
- **Test types**: Unit, integration, visual regression

### Testing Tools
- **Vitest**: Unit and integration tests
- **Playwright**: E2E and visual regression tests
- **Testing Library**: React component testing
- **Fast-check**: Property-based testing

## Performance Requirements

### Rendering Performance
- **Target**: <16ms render times
- **Optimization**: Efficient mesh generation and CSG operations
- **Memory**: Proper disposal of BabylonJS resources
- **Hot reload**: <100ms development reload times

### Code Quality
- **Zero TypeScript errors**: Strict type checking
- **Zero Biome violations**: Clean, consistent code
- **Functional patterns**: Pure functions, immutable state
- **Error handling**: Result<T,E> pattern throughout

## Development Workflow

### Commands
- `pnpm dev`: Start development server
- `pnpm test`: Run unit tests
- `pnpm test:coverage`: Run tests with coverage
- `pnpm biome:check`: Lint and format code
- `pnpm typecheck`: Type checking
- `pnpm build`: Production build

### Code Quality Checks
- **Pre-commit**: Biome formatting and linting
- **CI/CD**: Type checking, tests, coverage reports
- **Performance**: Render time monitoring
- **Visual regression**: Playwright screenshot testing

## OpenSCAD Specific Guidelines

### Coordinate System
- **Z-up, right-handed**: OpenSCAD standard coordinate system
- **Transformations**: Translate, rotate, scale, mirror, multmatrix
- **CSG Operations**: Union, difference, intersection with Manifold
- **Primitives**: cube, sphere, cylinder, polyhedron

### AST Node Types
- **PrimitiveNode**: 3D and 2D primitives
- **TransformNode**: All transformations
- **CSGNode**: Boolean operations
- **ControlFlowNode**: for, if, let statements
- **FunctionNode**: Built-in functions
- **ModuleNode**: User-defined modules
- **ExtrusionNode**: linear_extrude, rotate_extrude
- **ModifierNode**: *, !, #, % modifiers
- **ImportNode**: import(), include(), use()

## Error Handling

### Result<T,E> Pattern
```typescript
type Result<T, E> = { success: true; data: T } | { success: false; error: E };
```

### Error Types
- **ParseError**: OpenSCAD syntax errors
- **RenderError**: BabylonJS rendering errors
- **ValidationError**: AST validation errors
- **PerformanceError**: Performance threshold violations

## Documentation Standards

### Code Documentation
- **JSDoc comments**: For all public APIs
- **Type annotations**: Explicit types for clarity
- **README files**: For each feature directory
- **Architecture docs**: Keep updated with changes

### API Documentation
- **Location**: `docs/api/`
- **Format**: Markdown with code examples
- **Coverage**: All public interfaces
- **Examples**: Real-world usage patterns

This project represents a production-ready 3D modeling application with comprehensive test coverage, strict type safety, and optimized performance for real-time 3D rendering of OpenSCAD models.