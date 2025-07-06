# Debug Configuration Setup

## Overview
This document outlines the debugging tools and configurations set up for analyzing and fixing test failures.

**Created:** 2025-01-06 13:45 UTC
**Purpose:** Test failure analysis and resolution

## Debugging Tools Configuration

### 1. Vitest Debug Configuration
```bash
# Debug specific test file
pnpm test:debug src/features/openscad-parser/ast/visitors/expression-visitor.test.ts

# Debug with browser DevTools
pnpm test:ui

# Run tests with verbose output
pnpm test --reporter=verbose --reporter=html

# Run specific test pattern
pnpm test --grep "Vector Expression"
```

### 2. TypeScript Debugging
Current TypeScript configuration is robust:
- **Strict mode enabled**: All strict type checking flags active
- **Modern ES2022 target**: Latest language features supported
- **Source maps enabled**: Full debugging support
- **Path aliases configured**: `@/` for src directory

### 3. Biome Linting Configuration
Current Biome setup provides comprehensive code quality checks:
- **Strict linting rules**: Error-level enforcement
- **Security checks**: Prevents dangerous patterns
- **Performance optimization**: Flags performance issues
- **React-specific rules**: JSX and React patterns validated

### 4. Test Environment Configuration
```javascript
// vite.config.ts test configuration
test: {
  globals: true,
  environment: 'jsdom',
  include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  testTimeout: 5000,
  hookTimeout: 3000,
  reporters: 'verbose',
  pool: 'forks',
  sequence: { concurrent: false, shuffle: false },
}
```

## Debugging Strategies by Issue Type

### 1. OpenSCAD Vector Parsing Issues
**Debug Commands:**
```bash
# Run parser-specific tests
pnpm test openscad-parser

# Debug AST generation
pnpm test --grep "vector.*expression"

# Run with debug logging
DEBUG=openscad:parser pnpm test
```

**Analysis Points:**
- Check TreeSitter grammar handling of vector expressions
- Verify CST to AST conversion for vector nodes
- Examine extractValue function for vector processing

### 2. CSG Boolean Operation Failures
**Debug Commands:**
```bash
# Run CSG-specific tests
pnpm test csg-operations

# Debug BSP tree operations
pnpm test --grep "BSP.*tree"

# Run with memory profiling
NODE_OPTIONS="--max-old-space-size=4096" pnpm test csg
```

**Analysis Points:**
- BSP tree recursion depth limits
- Memory usage in CSG operations
- Three.js geometry processing pipeline

### 3. Three.js Integration Issues
**Debug Commands:**
```bash
# Run renderer tests
pnpm test three-renderer

# Debug with visual output
pnpm test:ui three-renderer

# Check matrix operations
pnpm test matrix-adapters
```

**Analysis Points:**
- Multiple Three.js instance detection
- WebGL context creation in tests
- Memory cleanup in test teardown

### 4. Matrix Transformation Issues
**Debug Commands:**
```bash
# Run matrix-specific tests
pnpm test matrix-adapters

# Debug gl-matrix integration
pnpm test --grep "matrix.*conversion"

# Check transformation pipeline
pnpm test --grep "transform"
```

**Analysis Points:**
- gl-matrix to Three.js conversion
- Matrix4 compatibility issues
- Transformation matrix validation

## Logging Configuration

### 1. Application Logging (tslog)
Current logging service provides structured logging:
```typescript
// Example debug logging
logger.debug('CSG operation', { operation: 'union', nodes: nodeCount });
logger.error('Parser error', { code: 'E001', context: parseContext });
```

### 2. Test-Specific Logging
```bash
# Enable verbose test output
VITEST_LOG_LEVEL=debug pnpm test

# Test-specific environment variables
OPENSCAD_DEBUG=true pnpm test
THREE_DEBUG=true pnpm test
CSG_DEBUG=true pnpm test
```

### 3. Performance Monitoring
```bash
# Memory usage monitoring
NODE_OPTIONS="--heap-prof" pnpm test

# Performance timing
TIME=true pnpm test

# Test coverage with debugging
pnpm test --coverage --reporter=lcov
```

## IDE Configuration

### 1. VS Code Debug Configuration
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "program": "./node_modules/vitest/vitest.mjs",
  "args": ["run", "--threads", "false"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### 2. Test Explorer Integration
- Vitest extension for VS Code
- Test result visualization
- Inline error display

## Error Analysis Workflow

### 1. Systematic Approach
1. **Identify failing test category**
2. **Run isolated test suite**
3. **Enable debug logging**
4. **Analyze error stack traces**
5. **Check related dependencies**
6. **Verify configuration consistency**

### 2. Common Debug Patterns
```bash
# Step 1: Isolate the issue
pnpm test specific-test-file.test.ts

# Step 2: Enable verbose output
pnpm test specific-test-file.test.ts --reporter=verbose

# Step 3: Check dependencies
pnpm test --grep "dependency-name"

# Step 4: Run with profiling
NODE_OPTIONS="--inspect" pnpm test specific-test-file.test.ts
```

## Next Steps

### Immediate Actions
1. **Set up test result monitoring**
2. **Configure CI/CD debugging**
3. **Implement test failure categorization**
4. **Create automated error reporting**

### Long-term Improvements
1. **Test stability metrics**
2. **Performance regression detection**
3. **Automated fix suggestions**
4. **Test coverage improvement tracking**

## Tool Versions

- **TypeScript**: 5.8+ (latest features enabled)
- **Vitest**: Latest (configured for 3D/WebGL testing)
- **Biome**: Latest (strict linting configuration)
- **Three.js**: Latest (with proper testing setup)
- **Node.js**: 18+ (with modern JavaScript features)
