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
- **React 19.0.0** with concurrent features and Suspense
- **TypeScript 5.8.3** with strict mode and branded types
- **Vite 6.0.0** for development and HMR
- **pnpm** as package manager with workspace support

### 3D Rendering
- **BabylonJS 8.16.1** for 3D graphics and scene management
- **manifold-3d 3.1.1** for high-performance CSG operations
- **OpenSCAD coordinate system**: Z-up, right-handed coordinate system
- **Performance target**: <16ms render times for real-time interaction

### State Management
- **Zustand 5.0.5** with slice pattern and middleware
- **Immer 10.1.1** for immutable state updates
- **Reselect 5.1.1** for memoized selectors and performance

### Code Editor
- **Monaco Editor 0.52.2** with OpenSCAD syntax highlighting
- **web-tree-sitter 0.25.3** for real-time parsing
- **Language Server Protocol** integration for IntelliSense

### Quality Tools
- **Biome 2.0.6** for linting, formatting, and import sorting
- **Vitest 1.6.1** for unit testing with 95%+ coverage target
- **Playwright 1.53.0** for E2E and visual regression testing
- **TypeScript strict mode** with zero compilation errors policy

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
- **Co-located tests**: Every component/function has adjacent `.test.ts` file in same directory
- **Files under 500 lines**: Split large files into smaller, focused modules following SRP
- **Single Responsibility Principle**: Each file has one clear purpose and responsibility
- **Index files**: Use `index.ts` for clean exports and public API surface
- **Feature-based structure**: Group related functionality in feature directories
- **Kebab-case filenames**: Use consistent naming convention for all files

### TypeScript Guidelines
- **Strict mode enabled**: No `any` types, explicit return types for all functions
- **Result<T,E> pattern**: For error handling instead of throwing exceptions
- **Branded types**: For type safety (e.g., `type UserId = string & { __brand: 'UserId' }`)
- **Functional programming**: Pure functions, immutable data structures, no side effects
- **Advanced types**: Leverage unions, intersections, generics, and utility types
- **Type guards**: Use type guards instead of type assertions for runtime safety
- **Discriminated unions**: For complex state modeling and exhaustive checking

### React Patterns
- **Functional components only**: No class components, use React 19 features
- **Custom hooks**: Extract reusable logic into hooks following SRP
- **Error boundaries**: Wrap components with error boundaries for graceful failure
- **Suspense**: Use for async operations, code splitting, and data fetching
- **Concurrent features**: Leverage React 19 concurrent rendering capabilities
- **Component composition**: Prefer composition over inheritance patterns
- **Bulletproof-react architecture**: Follow established patterns for scalability

### BabylonJS Integration
- **AbstractMesh extension**: All OpenSCAD nodes extend BABYLON.AbstractMesh for unified interface
- **Scene management**: Centralized scene lifecycle management with proper cleanup
- **Performance optimization**: Target <16ms render times for 60fps real-time rendering
- **Memory management**: Proper disposal of meshes, materials, and textures
- **NullEngine testing**: Use BABYLON.NullEngine for headless testing, no mocks
- **CSG operations**: Integrate manifold-3d for high-performance boolean operations
- **Framework agnostic**: Keep BabylonJS logic independent of React components

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
- **Target**: 95%+ test coverage across all features
- **Real implementations**: No mocks for BabylonJS (use NullEngine) or OpenSCAD parser
- **Co-located tests**: Tests adjacent to implementation files in same directory
- **Test types**: Unit, integration, visual regression, and property-based testing
- **TDD approach**: Write tests first, implement incrementally
- **Fast-check**: Use property-based testing for complex algorithms

### Testing Tools
- **Vitest**: Unit and integration tests with coverage reporting
- **Playwright**: E2E and visual regression tests with screenshot comparison
- **Testing Library**: React component testing with user-centric queries
- **Fast-check**: Property-based testing for mathematical operations
- **BABYLON.NullEngine**: Headless 3D testing without WebGL context
- **Real parser instances**: Use actual OpenSCAD parser, no mocking

## Performance Requirements

### Rendering Performance
- **Target**: <16ms render times for 60fps real-time interaction
- **Optimization**: Efficient mesh generation, CSG operations, and scene updates
- **Memory**: Proper disposal of BabylonJS resources, prevent memory leaks
- **Hot reload**: <100ms development reload times with Vite HMR
- **Profiling**: Monitor render times and memory usage in development
- **Lazy loading**: Code splitting for non-critical features

### Code Quality
- **Zero TypeScript errors**: Strict type checking with no compilation errors
- **Zero Biome violations**: Clean, consistent code with automated formatting
- **Functional patterns**: Pure functions, immutable state, no side effects
- **Error handling**: Result<T,E> pattern throughout, no throwing exceptions
- **Documentation**: JSDoc comments for all public APIs with examples
- **DRY and KISS**: Don't Repeat Yourself, Keep It Simple Stupid principles
- **SOLID principles**: Especially Single Responsibility Principle for all functions

## Development Workflow

### Commands
- `pnpm dev`: Start development server with HMR
- `pnpm test`: Run unit tests with Vitest
- `pnpm test:coverage`: Run tests with coverage reporting
- `pnpm test:watch`: Run tests in watch mode for TDD
- `pnpm biome:check`: Lint and format code with Biome
- `pnpm biome:fix`: Auto-fix linting and formatting issues
- `pnpm typecheck`: TypeScript type checking
- `pnpm build`: Production build with optimization
- `pnpm preview`: Preview production build locally

### Code Quality Checks
- **Pre-commit**: Biome formatting, linting, and TypeScript checking
- **CI/CD**: Type checking, tests, coverage reports, and build verification
- **Performance**: Render time monitoring and memory usage tracking
- **Visual regression**: Playwright screenshot testing with baseline comparison
- **Automated testing**: Run full test suite on every commit
- **Coverage gates**: Maintain 95%+ test coverage requirement

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
- **JSDoc comments**: Required for all public APIs with descriptions and examples
- **Type annotations**: Explicit types for clarity and self-documentation
- **README files**: For each feature directory with setup and usage instructions
- **Architecture docs**: Keep updated with changes, include decision rationale
- **Inline comments**: Explain complex algorithms and business logic
- **@example tags**: Provide working code examples in JSDoc
- **@file tags**: Module-level descriptions for file purposes

### API Documentation
- **Location**: `docs/api/` with organized structure
- **Format**: Markdown with executable code examples
- **Coverage**: All public interfaces, types, and functions
- **Examples**: Real-world usage patterns and common scenarios
- **Versioning**: Document breaking changes and migration guides
- **Interactive examples**: Include runnable code snippets where possible

## Summary

This project represents a **production-ready 3D modeling application** with:
- **Comprehensive test coverage** (95%+ target) using real implementations
- **Strict type safety** with zero TypeScript errors policy
- **Optimized performance** for real-time 3D rendering (<16ms render times)
- **Modern architecture** following bulletproof-react and functional programming patterns
- **Advanced tooling** with Vite, Biome, and comprehensive testing suite
- **Framework-agnostic core** with BabylonJS and OpenSCAD parser independence

The architecture emphasizes **maintainability**, **performance**, and **developer experience** while delivering a robust platform for OpenSCAD-based 3D modeling in the browser.


--- 
 
## Coding Best Practices 
 
### General Principles 
- DO NOT USE MOCKS for OpenscadParser; 
- Implement changes incrementally with files under 500 lines 
- Follow TDD with small changes and avoid mocks in tests 
- No `any` types in TypeScript; use kebab-case for filenames 
- Apply Single Responsibility Principle (SRP) 
- Prioritize readability over clever code
- Follow best typescripts patterns in docs\typescript-guidelines.md; 
KEEP THE docs/*.md updated with the changes;
ALWAYS USE DRY and KISS rules and algoritm improvements, split the code in smaller and manageable code, reason multiple options of improvements; 
use SRP of solid for any function and utils, use TDD approach; 
search in the web for more context; 
MUST avoid biome lint issues and typescript issues; 
Follow bulletproof-react architecture patterns;  
Maintain zero TypeScript compilation errors and zero Biome violations;
BabylonJs, Openscad parser MUST be react agnostic/independent using functional programming and SRP; 
do not use __tests__ folder, use: 
EACH SRP file must have its own folder and the its tests should be in the same folder, e.g. of file structure: 
 
```jsx 
new-srp-file/ 
├── new-srp-file-with-single-small-test-files-example/ 
│   ├── new-srp-file.ts 
│   └── new-srp-file.test.ts 
└── new-srp-file-with-muiltiple-small-test-files-example/ 
    ├── new-srp-file.ts 
    ├── new-srp-file-[similar-scenario1].test.ts 
    ├── new-srp-file-[similar-scenario2].test.ts 
    ├── ... 
    └── new-srp-file-[similar-scenarioX].test.ts 
``` 
 
### TypeScript Best Practices 
- Use strict mode and explicit type annotations 
- Leverage advanced types (unions, intersections, generics) 
- Prefer interfaces for APIs and readonly for immutable data 
- Use type guards instead of type assertions 
- Utilize utility types and discriminated unions 
 
### Functional Programming 
- Write pure functions without side effects 
- Enforce immutability and use higher-order functions 
- Compose functions and use declarative programming 
- Handle nullable values with option/maybe types 
- Use Either/Result types for error handling 
 
 
### Testing with Vitest 
### BabylonJS Testing Pattern
Do not use mocks for Babylon, use NullEngine for headless testing:
```typescript
import * as BABYLON from "@babylonjs/core";
import { initializeCSG2 } from "../path/to/csg-init";

describe("Babylon tests", () => {
  let scene: BABYLON.Scene;
  let engine: BABYLON.NullEngine;
  
  beforeAll(async () => {
    // Initialize CSG2 for boolean operations
    await initializeCSG2();
  });
  
  beforeEach(async () => {
    // Create a null engine (headless)
    engine = new BABYLON.NullEngine();
    
    // Create a real scene
    scene = new BABYLON.Scene(engine);
  });
  
  afterEach(() => {
    // Proper cleanup to prevent memory leaks
    scene.dispose();
    engine.dispose();
  });
});
```

### OpenSCAD Parser Testing Pattern
Do not use mocks for OpenSCAD parser, use real parser instances:
```typescript
import { OpenscadParser } from "../path/to/parser";

describe("OpenSCADParser", () => {
  let parser: OpenscadParser;
  
  beforeEach(async () => {
    // Create a new parser instance before each test
    parser = new OpenscadParser();
    
    // Initialize the parser with tree-sitter grammar
    await parser.init();
  });
  
  afterEach(() => {
    // Clean up after each test
    parser.dispose();
  });
  
  it("should parse basic cube syntax", async () => {
    const result = await parser.parse("cube([1, 2, 3]);");
    expect(result.success).toBe(true);
  });
});
``` 
 
### Error Handling 
- Use structured error handling with specific types 
- Provide meaningful error messages with context 
- Handle edge cases explicitly and validate input data 
- Use try/catch blocks only when necessary 
 
### Performance 
- Optimize for readability first, then performance 
- Profile to identify actual bottlenecks 
- Use appropriate data structures and memoization 
- Minimize DOM manipulations and optimize 3D operations 
 
## Documentation Best Practices 
- IMPORTANT!!!!! Add JSDoc comments to all code elements with descriptions and examples 
- Use `@example` tag and `@file` tag for module descriptions 
- Document why code works a certain way, not just what it does 
- Include architectural decisions, limitations, and edge cases 
- Use diagrams for complex relationships and "before/after" sections 
- Keep documentation close to code and provide thorough examples 
 
## Code Review Guidelines 
- Check adherence to standards, test coverage, and documentation 
- Look for security vulnerabilities and performance issues 
- Verify proper typing, error handling, and functional principles 
- Identify refactoring opportunities for better code quality 
- Provide constructive feedback focused on code, not developer 
 
## Continuous Integration 
- Ensure all code passes tests, linting, and type checking 
- Use feature branches and maintain clean commit history

 