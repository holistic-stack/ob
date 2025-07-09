# Comprehensive Debugging Guide for OpenSCAD Babylon

## Overview

This guide provides comprehensive debugging strategies for the OpenSCAD Babylon project that work in headless environments, CI/CD pipelines, and development scenarios where browser-based debugging isn't available or practical.

**Target Environments:**
- Headless development environments
- CI/CD pipelines
- Server-side debugging
- Remote development environments
- Production troubleshooting

## Table of Contents

1. [CLI-Based Debugging](#cli-based-debugging)
2. [Testing-Based Debugging](#testing-based-debugging)
3. [Static Analysis Debugging](#static-analysis-debugging)
4. [Log-Based Debugging](#log-based-debugging)
5. [Node.js Debugging](#nodejs-debugging)
6. [TypeScript Debugging](#typescript-debugging)
7. [Component-Specific Debugging](#component-specific-debugging)
8. [Performance Debugging](#performance-debugging)
9. [CI/CD Debugging](#cicd-debugging)
10. [Production Debugging](#production-debugging)

## CLI-Based Debugging

### 1. Vitest CLI Debugging

```bash
# Debug specific test with detailed output
pnpm test --reporter=verbose --reporter=html src/path/to/test.ts

# Run tests with debugging enabled
pnpm test --inspect-brk --pool=forks --no-coverage

# Debug with custom timeout for complex operations
pnpm test --testTimeout=30000 --hookTimeout=10000

# Run tests sequentially for isolation
pnpm test --pool=forks --sequence.concurrent=false

# Debug specific test patterns
pnpm test --grep "OpenSCAD.*parser" --reporter=verbose

# Run tests with memory profiling
NODE_OPTIONS="--max-old-space-size=4096 --heap-prof" pnpm test
```

### 2. TypeScript CLI Debugging

```bash
# Type checking with detailed diagnostics
pnpm tsc --noEmit --listFiles --extendedDiagnostics

# Check specific files for type issues
pnpm tsc --noEmit src/features/openscad-parser/**/*.ts

# Generate declaration files for debugging
pnpm tsc --declaration --emitDeclarationOnly --outDir temp-types

# Trace module resolution issues
pnpm tsc --traceResolution --noEmit src/problematic-file.ts
```

### 3. Biome CLI Debugging

```bash
# Lint with detailed output
pnpm biome check --verbose --diagnostic-level=info

# Check specific files
pnpm biome check src/features/3d-renderer/ --verbose

# Format and show changes
pnpm biome format --write --verbose

# Check configuration issues
pnpm biome check --config-path=./biome.json --verbose
```

## Testing-Based Debugging

### 1. Isolated Test Debugging

```bash
# Run single test file with maximum verbosity
pnpm test src/features/openscad-parser/core/openscad-parser.test.ts \
  --reporter=verbose \
  --reporter=html \
  --testTimeout=10000

# Debug React Three Fiber components
pnpm test src/features/3d-renderer/ \
  --environment=jsdom \
  --globals \
  --reporter=verbose

# Debug with custom environment variables
OPENSCAD_DEBUG=true THREE_DEBUG=true CSG_DEBUG=true \
  pnpm test src/features/3d-renderer/
```

### 2. Property-Based Testing for Edge Cases

```bash
# Run fuzzy testing for OpenSCAD transformations
pnpm test --grep "property.*test" --reporter=verbose

# Debug with specific seed for reproducible failures
FAST_CHECK_SEED=42 pnpm test transformation-tests

# Run property tests with increased iterations
FAST_CHECK_NUM_RUNS=1000 pnpm test property-tests
```

### 3. Test Data Analysis

```bash
# Generate test coverage with detailed reports
pnpm test --coverage --reporter=lcov --reporter=html

# Run tests with performance timing
TIME=true pnpm test --reporter=verbose

# Debug test isolation issues
pnpm test --pool=forks --sequence.shuffle=false
```

## Static Analysis Debugging

### 1. TypeScript Analysis

```bash
# Generate comprehensive type information
pnpm tsc --generateTrace trace-output --noEmit

# Analyze bundle size and dependencies
pnpm vite-bundle-analyzer

# Check for unused exports
pnpm ts-unused-exports tsconfig.json

# Validate Result<T,E> patterns
pnpm tsc --noEmit --strict --exactOptionalPropertyTypes
```

### 2. Biome Analysis

```bash
# Security and performance analysis
pnpm biome check --apply-unsafe --verbose

# Check for React-specific issues
pnpm biome check --verbose src/features/ | grep -E "(react|jsx)"

# Analyze code complexity
pnpm biome check --verbose | grep -E "(complexity|cognitive)"
```

### 3. Dependency Analysis

```bash
# Check for duplicate dependencies
pnpm ls --depth=0 | grep -E "WARN|ERR"

# Analyze bundle composition
pnpm vite build --mode=development --sourcemap

# Check for security vulnerabilities
pnpm audit --audit-level=moderate
```

## Log-Based Debugging

### 1. Structured Logging with tslog

```typescript
// Component-specific debugging
import { createLogger } from '@/shared/services/logger.service';

const logger = createLogger('OpenSCADParser');

// Debug with structured data
logger.debug('Parsing AST node', {
  nodeType: 'vector_expression',
  position: { line: 42, column: 10 },
  context: 'transformation_block'
});

// Error logging with Result<T,E> integration
const result = parseExpression(code);
if (!result.success) {
  logger.error('Parse failed', {
    error: result.error,
    code: code.substring(0, 100),
    timestamp: Date.now()
  });
}
```

### 2. Environment-Based Logging

```bash
# Enable debug logging for specific components
DEBUG=openscad:parser,three:renderer pnpm dev

# Production-level logging only
LOG_LEVEL=ERROR pnpm start

# Comprehensive debug logging
LOG_LEVEL=DEBUG OPENSCAD_DEBUG=true pnpm dev

# Performance logging
PERFORMANCE_LOG=true pnpm dev
```

### 3. Log Analysis Tools

```bash
# Filter logs by component
pnpm dev 2>&1 | grep "\[OpenSCADParser\]"

# Extract error logs
pnpm test 2>&1 | grep -E "(ERROR|FATAL)" > error-log.txt

# Performance log analysis
pnpm dev 2>&1 | grep "performance" | tail -100
```

## Node.js Debugging

### 1. Inspector-Based Debugging

```bash
# Debug Node.js processes
node --inspect-brk=0.0.0.0:9229 ./node_modules/vitest/vitest.mjs run

# Debug with specific breakpoints
node --inspect --debug-brk ./scripts/debug-parser.js

# Remote debugging setup
node --inspect=0.0.0.0:9229 ./node_modules/vite/bin/vite.js dev
```

### 2. Memory and Performance Debugging

```bash
# Heap profiling
NODE_OPTIONS="--heap-prof --heap-prof-interval=100" pnpm dev

# CPU profiling
NODE_OPTIONS="--prof --prof-process" pnpm test

# Memory leak detection
NODE_OPTIONS="--trace-gc --trace-gc-verbose" pnpm dev

# Stack trace limits
NODE_OPTIONS="--stack-trace-limit=100" pnpm test
```

### 3. Process Debugging

```bash
# Debug child processes
NODE_OPTIONS="--inspect-port=9230" pnpm test:worker

# Trace async operations
NODE_OPTIONS="--trace-warnings --trace-uncaught" pnpm dev

# Debug module loading
NODE_OPTIONS="--trace-require" pnpm dev
```

## TypeScript Debugging

### 1. Compilation Debugging

```bash
# Incremental compilation debugging
pnpm tsc --incremental --tsBuildInfoFile=debug.tsbuildinfo

# Watch mode debugging
pnpm tsc --watch --preserveWatchOutput --pretty

# Module resolution tracing
pnpm tsc --traceResolution --noEmit 2> resolution-trace.log
```

### 2. Type System Debugging

```typescript
// Type assertion debugging
type DebugType<T> = T extends infer U ? U : never;
type ParserResult = DebugType<Result<AST, ParseError>>;

// Conditional type debugging
type IsSuccess<T> = T extends { success: true } ? true : false;

// Template literal debugging
type ComponentName = `[${string}]`;
```

### 3. Declaration File Debugging

```bash
# Generate declaration files for inspection
pnpm tsc --declaration --emitDeclarationOnly --outDir temp-declarations

# Check declaration file consistency
pnpm tsc --noEmit --skipLibCheck=false
```

## Component-Specific Debugging

### 1. OpenSCAD Parser Debugging

```bash
# Parser-specific tests
pnpm test src/features/openscad-parser/ --reporter=verbose

# AST generation debugging
OPENSCAD_DEBUG=true pnpm test --grep "AST.*generation"

# TreeSitter grammar debugging
DEBUG=tree-sitter pnpm test parser-tests
```

### 2. React Three Fiber Debugging

```bash
# 3D renderer debugging
THREE_DEBUG=true pnpm test src/features/3d-renderer/

# WebGL context debugging
WEBGL_DEBUG=true pnpm test three-fiber-tests

# CSG operations debugging
CSG_DEBUG=true pnpm test csg-operations
```

### 3. Zustand Store Debugging

```typescript
// Store debugging with middleware
import { subscribeWithSelector } from 'zustand/middleware';

const useStore = create(
  subscribeWithSelector((set, get) => ({
    // Store implementation
  }))
);

// Debug state changes
useStore.subscribe(
  (state) => state.parsingAST,
  (ast) => logger.debug('AST updated', { ast })
);
```

### 4. Monaco Editor Debugging

```bash
# Editor integration debugging
MONACO_DEBUG=true pnpm dev

# Language service debugging
TYPESCRIPT_DEBUG=true pnpm dev
```

## Performance Debugging

### 1. Render Performance Analysis

```bash
# Performance profiling with timing
TIME=true pnpm test --reporter=verbose

# Memory usage monitoring
NODE_OPTIONS="--trace-gc --trace-gc-verbose" pnpm dev

# Bundle analysis
pnpm vite build --mode=development --sourcemap
pnpm vite-bundle-analyzer dist/
```

### 2. CSG Operation Performance

```typescript
// Performance monitoring for CSG operations
import { createLogger } from '@/shared/services/logger.service';

const logger = createLogger('CSGPerformance');

const measureCSGOperation = <T>(operation: () => T, operationType: string): T => {
  const start = performance.now();
  const result = operation();
  const duration = performance.now() - start;

  logger.debug('CSG operation completed', {
    operation: operationType,
    duration: `${duration.toFixed(2)}ms`,
    memoryUsage: process.memoryUsage()
  });

  return result;
};
```

### 3. React Three Fiber Performance

```bash
# 3D rendering performance
REACT_THREE_FIBER_DEBUG=true pnpm dev

# Frame rate monitoring
FPS_MONITOR=true pnpm dev

# WebGL performance debugging
WEBGL_PERFORMANCE=true pnpm test three-fiber-tests
```

## CI/CD Debugging

### 1. GitHub Actions Debugging

```yaml
# .github/workflows/debug.yml
- name: Debug Test Environment
  run: |
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Memory: $(free -h)"
    echo "CPU: $(nproc)"

- name: Debug Test Failures
  if: failure()
  run: |
    pnpm test --reporter=verbose --reporter=json > test-results.json
    cat test-results.json

- name: Upload Debug Artifacts
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: debug-logs
    path: |
      test-results.json
      coverage/
      *.log
```

### 2. Headless Environment Setup

```bash
# Headless browser testing
HEADLESS=true pnpm test:e2e

# Virtual display for WebGL
export DISPLAY=:99
Xvfb :99 -screen 0 1024x768x24 &
pnpm test three-fiber-tests

# Docker debugging
docker run --rm -it \
  -v $(pwd):/app \
  -w /app \
  node:18-alpine \
  sh -c "npm install && npm test"
```

### 3. Environment Variable Debugging

```bash
# Debug environment configuration
env | grep -E "(NODE|NPM|VITEST|DEBUG)" | sort

# Test environment isolation
NODE_ENV=test LOG_LEVEL=DEBUG pnpm test

# Production environment simulation
NODE_ENV=production pnpm build && pnpm preview
```

## Production Debugging

### 1. Error Monitoring

```typescript
// Production error tracking
import { createLogger } from '@/shared/services/logger.service';

const logger = createLogger('ProductionMonitor');

// Global error handler
window.addEventListener('error', (event) => {
  logger.error('Unhandled error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
});

// Promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', {
    reason: event.reason,
    stack: event.reason?.stack
  });
});
```

### 2. Performance Monitoring

```typescript
// Performance metrics collection
const collectPerformanceMetrics = () => {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  logger.info('Performance metrics', {
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
    firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
    firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime
  });
};
```

### 3. Health Checks

```bash
# Application health monitoring
curl -f http://localhost:3000/health || exit 1

# Memory usage monitoring
ps aux | grep node | grep -v grep

# Log file monitoring
tail -f /var/log/openscad-babylon/app.log | grep ERROR
```

## Debugging Workflow Integration

### 1. TDD Debugging Cycle

```bash
# Red: Write failing test with debug output
pnpm test new-feature.test.ts --reporter=verbose

# Green: Implement with logging
DEBUG=new-feature pnpm test new-feature.test.ts

# Refactor: Clean up debug code
pnpm biome check --apply src/features/new-feature/
```

### 2. Result<T,E> Debugging

```typescript
// Debug Result patterns
import { map, flatMap, tryCatch } from '@/shared/utils/functional/result';

const debugResult = <T, E>(result: Result<T, E>, context: string): Result<T, E> => {
  if (result.success) {
    logger.debug(`${context} succeeded`, { data: result.data });
  } else {
    logger.error(`${context} failed`, { error: result.error });
  }
  return result;
};

// Usage in pipeline
const processOpenSCAD = (code: string) =>
  tryCatch(() => parseCode(code))
    .pipe(result => debugResult(result, 'Parse'))
    .pipe(result => flatMap(result, ast => generateCSG(ast)))
    .pipe(result => debugResult(result, 'CSG Generation'));
```

### 3. Bulletproof-React Architecture Debugging

```bash
# Feature-specific debugging
pnpm test src/features/openscad-parser/ --reporter=verbose
pnpm test src/features/3d-renderer/ --reporter=verbose
pnpm test src/features/code-editor/ --reporter=verbose

# Shared utilities debugging
pnpm test src/shared/ --reporter=verbose

# Cross-feature integration debugging
pnpm test --grep "integration" --reporter=verbose
```

## Quick Reference Commands

```bash
# Essential debugging commands
pnpm test --reporter=verbose                    # Verbose test output
pnpm tsc --noEmit --extendedDiagnostics        # TypeScript debugging
pnpm biome check --verbose                     # Linting analysis
DEBUG=component:name pnpm dev                  # Component debugging
NODE_OPTIONS="--inspect" pnpm test             # Node.js debugging
LOG_LEVEL=DEBUG pnpm dev                       # Enhanced logging

# Performance debugging
TIME=true pnpm test                            # Test timing
NODE_OPTIONS="--heap-prof" pnpm dev           # Memory profiling
pnpm vite build --sourcemap                   # Bundle analysis

# CI/CD debugging
HEADLESS=true pnpm test                        # Headless testing
NODE_ENV=production pnpm build                # Production simulation
env | grep -E "(NODE|DEBUG|LOG)"               # Environment inspection
```

## Best Practices

1. **Start with the simplest debugging approach** - CLI commands before complex setups
2. **Use structured logging** - Leverage tslog for consistent, searchable logs
3. **Isolate issues** - Test individual components before integration testing
4. **Preserve debugging context** - Include relevant state and configuration in logs
5. **Document debugging sessions** - Record successful debugging approaches for future reference
6. **Automate debugging workflows** - Create scripts for common debugging scenarios
7. **Monitor performance impact** - Ensure debugging doesn't significantly slow development
8. **Clean up debug code** - Remove temporary debugging code before committing

## Integration with Existing Tools

This debugging guide integrates with:
- **Existing DEBUG_CONFIG.md** - Builds on test failure analysis strategies
- **tslog system** - Leverages structured logging infrastructure
- **Result<T,E> patterns** - Provides debugging for functional error handling
- **Bulletproof-react architecture** - Supports feature-based debugging approaches
- **TDD methodology** - Enhances red-green-refactor debugging cycles
