# OpenSCAD to Babylon.js CSG2 Pipeline

A robust, type-safe pipeline for converting OpenSCAD code to interactive 3D scenes using Babylon.js CSG2. Built with modern TypeScript, functional programming principles, and comprehensive testing.

## ⚠️ Current Status: Type Fixes Required

**CRITICAL**: TypeScript compilation errors (147+) must be resolved before testing can proceed. Core pipeline logic is implemented but requires systematic type corrections.

## 🎯 Project Overview

**Pipeline Flow:** `OpenSCAD Code → @holistic-stack/openscad-parser → [TYPE FIXES NEEDED] → CSG2 Operations → Babylon.js Scene`

This project implements a complete conversion pipeline from OpenSCAD's geometric description language to interactive 3D models in the browser using Babylon.js's latest CSG2 technology.

## 🚀 Key Technologies

- **@holistic-stack/openscad-parser** - Production-ready TypeScript parser for OpenSCAD ⚠️ (integration complete, imports need fixes)
- **Babylon.js CSG2** - Advanced constructive solid geometry with 10x+ performance improvements ⚠️ (API method names need correction)
- **TypeScript 5.8+** - Strict mode with Result/Either patterns ❌ (compilation failing due to type mismatches)
- **Vite 6.x** - Modern build tooling ✅ (working)
- **Vitest 3.x** - Comprehensive testing ❌ (blocked by compilation errors)
- **Playwright** - End-to-end testing ❌ (pending)

## 🔧 Current Issues

### Critical TypeScript Fixes Needed
- ❌ **Import/Export Mismatches**: `OpenSCADPrimitiveNodeNode` vs `OpenSCADPrimitiveNode`
- ❌ **AST Node Properties**: Tests use `parameters: { size: [10, 10, 10] }` instead of `size: [10, 10, 10]`
- ❌ **Position Interface**: Missing `offset` property in test mocks
- ❌ **CSG2 API Methods**: `fromMesh` vs `FromMesh` capitalization errors

### Immediate Priorities
1. Fix all import/export type name mismatches
2. Update AST node property usage in tests to match actual parser types
3. Add missing `offset` property to Position interfaces
4. Correct CSG2 method capitalization
5. Run `pnpm tsc --noEmit` to verify compilation
6. Execute test suite to validate functionality

## ✨ Implementation Status

### Completed Logic (Needs Type Fixes)
- ⚠️ **Foundation Setup** - Complete structure, compilation blocked
- ⚠️ **AST Processing** - Logic implemented, type imports wrong
- ⚠️ **CSG2 Operations** - Implementation complete, method names incorrect
- ⚠️ **Scene Management** - Babylon.js integration working
- ❌ **Testing** - Cannot execute due to compilation errors

### Pipeline Logic Status
- ✅ **Parser Integration Logic** - ParserResourceManager implemented
- ✅ **AST Visitor Logic** - OpenScadAstVisitor conversion logic complete
- ✅ **CSG2 Integration Logic** - Union, difference, intersection implemented
- ✅ **Scene Factory Logic** - Complete scene creation with cameras/lighting

// OpenSCAD Transforms → Babylon.js Transformations  
TranslateNode: { type: "translate", v: Vector3D, children: ASTNode[] } → mesh.position
RotateNode: { type: "rotate", a: Vector3D, children: ASTNode[] } → mesh.rotation
ScaleNode: { type: "scale", v: Vector3D, children: ASTNode[] } → mesh.scaling

// OpenSCAD CSG → Babylon.js CSG2 Operations
UnionNode: { type: "union", children: ASTNode[] } → csg1.add(csg2)
DifferenceNode: { type: "difference", children: ASTNode[] } → csg1.subtract(csg2)
IntersectionNode: { type: "intersection", children: ASTNode[] } → csg1.intersect(csg2)
```

### Functional Programming Patterns
```typescript
// Result type for error handling
type Result<T, E = Error> = 
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };

// Resource management with automatic cleanup
const withParser = async <T>(fn: (parser: EnhancedOpenscadParser) => Promise<T>): Promise<Result<T, Error>>;

// Type-safe AST node processing
function isCubeNode(node: ASTNode): node is CubeNode;
function isTransformNode(node: ASTNode): node is TransformNode;
```

## 📋 Prerequisites

- Node.js 18+ 
- pnpm 10+ (recommended package manager)

## 🛠️ Installation

```bash
# Install dependencies
pnpm install
```

## 🏃‍♂️ Development

```bash
# Start development server
pnpm run dev

# Run tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage

# Type checking
pnpm run type-check

# Linting
pnpm run lint
pnpm run lint:fix

# Code formatting
pnpm run format
pnpm run format:check
```

## 🏗️ Build

```bash
# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## 🧪 Testing

The project uses Vitest with React Testing Library for comprehensive testing:

- **Unit Tests**: Component testing with React Testing Library
- **Integration Tests**: Full application flow testing
- **Coverage Reports**: Detailed coverage analysis with v8 provider
- **Mock Setup**: Comprehensive mocking for browser APIs and 3D contexts

## 📁 Project Structure

```
src/
├── App.tsx              # Main application component
├── App.css              # Application styles
├── App.test.tsx         # Application tests
├── main.tsx             # React application entry point
└── test-setup.ts        # Vitest test configuration

public/
└── vite.svg             # Application icon

Configuration Files:
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── tsconfig.base.json   # Base TypeScript configuration
├── tsconfig.lib.json    # Library TypeScript configuration
├── tsconfig.spec.json   # Test TypeScript configuration
├── package.json         # Dependencies and scripts
└── index.html           # HTML template
```

## 🔧 Technology Stack

- **Frontend Framework**: React 19
- **Language**: TypeScript 5.8
- **Build Tool**: Vite 6.x
- **Testing**: Vitest 3.x + React Testing Library
- **Linting**: ESLint 9.x with TypeScript support
- **Formatting**: Prettier
- **Package Manager**: pnpm

## 🎯 Development Features

- **Hot Module Replacement**: Instant updates during development
- **Type Safety**: Strict TypeScript configuration with comprehensive type checking
- **Test-Driven Development**: Comprehensive test suite with fast feedback
- **Code Quality**: Automated linting and formatting
- **Modern JavaScript**: ES2022 target with latest language features

## 📖 Documentation

- **[Complete Implementation Plan](docs/babylon-cg2-plan.md)** - ENHANCED: Comprehensive roadmap with corrected CSG2 API, detailed implementation patterns, testing strategies, and production deployment considerations
- **[Current Progress](tasks/PROGRESS.md)** - Detailed milestone tracking
- **[Task Breakdown](tasks/TODO.md)** - Enhanced task list with detailed implementation patterns
- **[Current Context](tasks/current-context.md)** - Up-to-date project status and key findings
- **[Lessons Learned](docs/lesson-learned.md)** - Research findings, API corrections, and best practices
- **[TypeScript Guidelines](docs/typescript-guidelines.md)** - Coding standards and modern TypeScript patterns

## 🌐 Browser Support

- Modern browsers with ES2022 support
- WebGL support for 3D rendering
- SharedArrayBuffer support for WASM modules

## 📝 Scripts Reference

| Script | Description |
|--------|-------------|
| `dev` | Start development server on http://localhost:4200 |
| `build` | Build for production |
| `preview` | Preview production build |
| `test` | Run tests in watch mode |
| `test:run` | Run tests once |
| `test:coverage` | Run tests with coverage report |
| `test:ui` | Run tests with UI interface |
| `type-check` | Run TypeScript type checking |
| `lint` | Run ESLint |
| `lint:fix` | Run ESLint with auto-fix |
| `format` | Format code with Prettier |
| `format:check` | Check code formatting |

## 🤝 Contributing

1. Follow the existing code style and conventions
2. Write tests for new features
3. Ensure all tests pass before submitting
4. Use conventional commit messages
5. Update documentation as needed

## 📄 License

ISC License
