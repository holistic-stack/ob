# OpenSCAD Babylon Development Workflow

## Project Overview

This is a **production-ready** web-based 3D model editor that uses OpenSCAD syntax for real-time 3D visualization with BabylonJS rendering. The project follows bulletproof-react architecture with feature-based organization and strict performance requirements.

## Technology Stack

### Core Framework
- **React 19.0.0** with concurrent features
- **TypeScript 5.8.3** with strict mode
- **Vite 6.0.0** for development and build
- **pnpm** as package manager

### 3D Rendering & Parsing
- **BabylonJS 8.16.1** for 3D graphics and scene management
- **Monaco Editor 0.52.2** with OpenSCAD syntax highlighting
- **web-tree-sitter 0.25.3** for OpenSCAD parsing
- **OpenSCAD coordinate system**: Z-up, right-handed

### State Management
- **Zustand 5.0.5** for application state
- **Immer 10.1.1** for immutable updates
- **Reselect 5.1.1** for memoized selectors

### Quality & Testing Tools
- **Biome 2.0.6** for linting and formatting
- **Vitest 1.6.1** for unit and integration testing
- **Playwright 1.53.0** for E2E and visual regression testing

## Architecture Overview

### 4-Layer Architecture
1. **OpenSCAD Parser Layer**: Tree-sitter grammar, visitor pattern, error recovery
2. **BabylonJS-Extended AST Layer**: OpenSCADNode extends BABYLON.AbstractMesh
3. **Mesh Generation Layer**: BabylonJS Mesh Builder, CSG operations
4. **Scene Management Layer**: BABYLON.Scene integration, camera controls, lighting

### Feature-Based Organization
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

## Development Environment Setup

### Prerequisites
- **Node.js 22.14.0+**
- **pnpm 10.10.0+** (package manager)
- **Git** for version control

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd openscad-babylon

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Development Commands

### Core Development
```bash
# Start development server with hot reload
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm typecheck
```

### Testing Commands
```bash
# Run all unit tests
pnpm test

# Run tests with memory optimization
pnpm test:memory-safe

# Run tests with coverage report
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run visual regression tests
pnpm test:visual

# Update visual test snapshots
pnpm test:visual:update

# Run component tests with Playwright
pnpm test:ct
```

### Code Quality
```bash
# Run Biome linting and formatting
pnpm biome:fix

# Lint only
pnpm biome:lint

# Format only
pnpm biome:format

# Validate types
pnpm validate:types
```

### Specialized Testing
```bash
# Test specific features
pnpm test:code-editor
pnpm validate:pipeline

# Run Storybook for component development
pnpm storybook
```

## Performance Requirements

### Rendering Performance
- **Target**: <16ms render times for 60fps
- **Memory Management**: Proper disposal of BabylonJS resources
- **Hot Reload**: <100ms development reload times
- **Test Coverage**: 95%+ across all features

### Monitoring
- Real-time performance metrics in development
- Automated performance regression testing
- Memory usage tracking for 3D scenes

## Coding Standards

### TypeScript Guidelines
- **Strict mode enabled**: No `any` types, explicit return types
- **Result<T,E> pattern**: For error handling instead of throwing exceptions
- **Branded types**: For type safety
- **Functional programming**: Pure functions, immutable data structures

### File Organization
- **Co-located tests**: Every component/function has adjacent `.test.ts` file
- **Files under 500 lines**: Split large files into smaller, focused modules
- **Single Responsibility Principle**: Each file has one clear purpose
- **Index files**: Use `index.ts` for clean exports

### Testing Practices
- **Real implementations**: No mocks for core functionality (BabylonJS, OpenSCAD parser)
- **NullEngine for BabylonJS**: Use `BABYLON.NullEngine()` for headless testing
- **Property-based testing**: Use fast-check for edge cases
- **Visual regression**: Playwright screenshot comparisons

## Git Workflow

### Branch Strategy
- **main**: Production-ready code
- **feature/***: Feature development branches
- **fix/***: Bug fix branches
- **docs/***: Documentation updates

### Commit Standards
- Use conventional commits format
- Include performance impact in commit messages
- Reference issue numbers when applicable

### Pre-commit Checks
- Biome formatting and linting
- TypeScript type checking
- Unit test execution
- Performance regression checks

## Development Best Practices

### BabylonJS Integration
- **AbstractMesh extension**: All OpenSCAD nodes extend BABYLON.AbstractMesh
- **Scene management**: Centralized scene lifecycle management
- **Memory management**: Proper disposal of meshes and materials
- **Performance optimization**: Efficient mesh generation and CSG operations

### OpenSCAD Parser
- **Framework-agnostic**: Parser independent of React
- **Error recovery**: Graceful handling of syntax errors
- **Real-time parsing**: Debounced parsing for editor changes
- **AST validation**: Comprehensive validation of parsed structures

### State Management
- **Zustand slices**: Feature-based state organization
- **Immutable updates**: Using Immer for state changes
- **Memoized selectors**: Using Reselect for performance
- **Middleware**: Logging and persistence middleware

## Debugging and Troubleshooting

### Development Tools
- **BabylonJS Inspector**: For 3D scene debugging
- **React DevTools**: For component state inspection
- **Zustand DevTools**: For state management debugging
- **Monaco Editor**: Built-in debugging features

### Common Issues
- **Memory leaks**: Check BabylonJS resource disposal
- **Performance issues**: Use performance profiling tools
- **Parser errors**: Check tree-sitter grammar and error recovery
- **Type errors**: Ensure strict TypeScript compliance

## Continuous Integration

### Automated Checks
- TypeScript compilation
- Biome linting and formatting
- Unit and integration tests
- Visual regression tests
- Performance benchmarks
- Security vulnerability scanning

### Quality Gates
- Zero TypeScript errors
- Zero Biome violations
- 95%+ test coverage
- Performance thresholds met
- All tests passing

This workflow ensures consistent, high-quality development while maintaining the performance and reliability standards required for a production 3D modeling application.