Fix all Biome linting errors and TypeScript compilation issues in the OpenSCAD 3D visualization application codebase. Follow these specific requirements:

**Code Quality Standards:**
1. Read and follow `CODE_QUALITY_PLAN.md` for systematic approach to code quality improvements
2. Eliminate ALL implicit `any` types in TypeScript files - use explicit type annotations following `docs/typescript-guidelines.md`
3. Read `biome.json` configuration to understand and avoid linting violations
4. Ensure zero TypeScript compilation errors and zero Biome linting errors as success criteria

**Testing Philosophy:**
1. DO NOT USE MOCKS in tests - use real implementations wherever possible
2. ONLY mock Three.js WebGL components when absolutely necessary for testing
3. Prefer real OpenSCAD parser instances with proper initialization (`await parser.init()`) and cleanup (`parser.dispose()`)

**Architectural Principles:**
1. Apply DRY (Don't Repeat Yourself) principle to eliminate code duplication
2. Follow SRP (Single Responsibility Principle) for each function, class, and module
3. Consider refactoring and splitting large files (>500 lines) into smaller, focused modules
4. Maintain bulletproof-react architecture with co-located tests and service-based organization

**Focus Areas:**
- Prioritize fixing issues in the AST-to-CSG converter service area and related 3D renderer components
- Maintain Result<T,E> error handling patterns throughout
- Preserve functional programming patterns and <16ms render performance targets
- Update task management system to track progress on complex refactoring work

**Success Criteria:**
- Zero TypeScript compilation errors (`pnpm type-check` passes)
- Zero Biome linting errors (`pnpm biome:check` passes)
- All tests pass with real implementations
- Code follows established architectural patterns