# Enhanced Development Guidelines

## Overview

This document outlines the enhanced development guidelines for the OpenSCAD 3D visualization project, incorporating systematic code quality improvements, tslog integration, and bulletproof-react architecture compliance.

## Core Principles

### 1. Zero-Error Policy
- **Zero TypeScript compilation errors**: All code must pass `pnpm type-check` without errors
- **Zero Biome violations**: All code must pass `pnpm biome:check` without warnings or errors
- **Mandatory quality checks**: Run both commands after every task completion

### 2. Architectural Compliance
- **Bulletproof-react architecture**: Follow established patterns in `src/features/` structure
- **DRY (Don't Repeat Yourself)**: Minimize code duplication through reusable abstractions
- **SRP (Single Responsibility Principle)**: Each component/function has one clear purpose
- **Functional Programming**: Emphasize immutability, pure functions, and composition

### 3. Error Handling Standards
- **Result<T,E> patterns**: Use for all operations that can fail
- **No implicit any types**: All variables must have explicit type annotations
- **Comprehensive error boundaries**: Handle all error scenarios gracefully

## Enhanced Logging with tslog

### Implementation Standards
```typescript
import { createLogger } from '../../../shared/services/logger.service';

const logger = createLogger('ComponentName');

// Usage patterns
logger.init('Component initialized successfully');
logger.debug('Processing data', { count: 42 });
logger.info('Operation completed');
logger.warn('Performance warning detected');
logger.error('Operation failed', error);
logger.end('Component cleanup completed');
```

### Logging Categories
- **[INIT]**: Component/service initialization
- **[DEBUG]**: Development debugging information
- **[INFO]**: General operational information
- **[WARN]**: Warning conditions that need attention
- **[ERROR]**: Error conditions requiring immediate attention
- **[END]**: Component/service cleanup and disposal

### Performance Integration
- Use enhanced performance monitoring utilities
- Target <16ms render performance for all operations
- Log performance warnings for operations exceeding thresholds

## Testing Standards

### Real Implementation Policy
- **NO MOCKS** except for Three.js WebGL components
- Use real OpenSCAD parser instances with proper lifecycle management
- Co-locate tests with implementation files (no `__tests__` folders)
- Comprehensive test coverage with meaningful assertions

### Testing Utilities
```typescript
// Use standard Vitest testing patterns with real implementations
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';

// Example test with real parser instance
describe('OpenSCAD Operation', () => {
  let parser: OpenscadParser;

  beforeEach(() => {
    parser = createTestParser(); // Automatic cleanup handled
  });

  it('should perform operation correctly', async () => {
    const result = await performOperation();
    expect(result).toBeDefined();
  });
});
```

### Test Categories
- **Unit tests**: Individual function/component testing
- **Integration tests**: Component interaction testing
- **Performance tests**: Render time and memory usage validation
- **E2E tests**: Complete user workflow validation

## Code Quality Standards

### TypeScript Configuration
- Use TypeScript 5.8+ features for enhanced type safety
- Enable strict mode with comprehensive compiler options
- No implicit any types - all variables must be explicitly typed
- Follow `docs/typescript-guidelines.md` requirements

### Biome Configuration
- Use Biome v2.0.6 as complete replacement for ESLint/Prettier
- Enable performance rules: `noAccumulatingSpread`, `noDelete`
- Enforce style consistency: `useConst`, `useOptionalChain`
- Apply correctness rules: `noUnusedVariables`, `useIsNan`

### Performance Optimization
- Leverage enhanced functional composition utilities
- Use performance monitoring for critical operations
- Implement memoization for expensive computations
- Apply debouncing/throttling for user interactions

## Package Management

### Dependency Standards
- **Always use pnpm**: Never use npm for package management
- Use package manager commands for all dependency changes
- Maintain lock file consistency across environments
- Document dependency rationale in commit messages

### Version Management
- Pin exact versions for critical dependencies
- Use semantic versioning for internal packages
- Regular dependency audits and security updates
- Maintain compatibility with Vite 6.0.0 and React 19

## Development Workflow

### Task Management
- Use structured task breakdown for complex work
- Apply systematic phase-based approach
- Document progress with detailed logging
- Maintain backward compatibility during refactoring

### Quality Assurance Process
1. **Pre-implementation**: Research and planning with tool assistance
2. **Implementation**: Follow TDD methodology with real implementations
3. **Quality checks**: Run mandatory `pnpm type-check` and `pnpm biome:check`
4. **Testing**: Comprehensive test coverage with performance validation
5. **Documentation**: Update relevant documentation files

### Code Review Standards
- Compare implementations against reference baselines
- Focus on architecture, feature gaps, and code quality
- Verify performance targets and error handling patterns
- Ensure logging consistency and debugging capabilities

## Performance Targets

### Render Performance
- **<16ms render times**: Maintain 60fps target for all operations
- **300ms debouncing**: For user input processing (Monaco Editor)
- **Memory efficiency**: Monitor and optimize memory usage patterns
- **Startup performance**: Fast application initialization

### Operation Categories
- **Render operations**: <16ms (60fps target)
- **AST parsing**: <100ms for typical OpenSCAD files
- **Matrix computations**: <50ms for standard operations
- **File I/O**: <200ms for local file operations
- **UI interactions**: <100ms for user feedback

## Integration Patterns

### Monaco Editor Integration
- Use systematic 4-step debugging approach
- Configure vite-plugin-monaco-editor with workers
- Fix ESM imports and test incrementally
- Maintain 300ms debouncing with Result<T,E> patterns

### React Three Fiber Integration
- Follow Zustand-centric architecture
- Maintain clean separation between store and rendering logic
- Use proper Three.js object disposal through store lifecycle
- Integrate with performance monitoring for render operations

### OpenSCAD Parser Integration
- Use real parser instances with proper init/dispose lifecycle
- Apply fail-fast approach for parser loading failures
- Implement comprehensive AST processing with source location analysis
- Maintain Result<T,E> error handling throughout parser operations

## Documentation Standards

### Code Documentation
- Comprehensive JSDoc comments for all public APIs
- Include usage examples and performance considerations
- Document error conditions and recovery strategies
- Maintain up-to-date type definitions

### Architecture Documentation
- Use Mermaid diagrams for complex system interactions
- Document data flow patterns and state management
- Include performance benchmarks and optimization notes
- Maintain decision records for architectural choices

### Development Documentation
- Keep implementation guides current with code changes
- Document debugging procedures and troubleshooting steps
- Include setup instructions and environment requirements
- Maintain changelog with detailed feature descriptions

## Continuous Improvement

### Quality Metrics
- Track TypeScript error reduction over time
- Monitor Biome violation trends and resolution
- Measure test coverage improvements
- Analyze performance optimization results

### Tool Integration
- Leverage Sequential Thinking for complex problem decomposition
- Use Playwright MCP for systematic browser debugging
- Apply enhanced logging for better debugging capabilities
- Utilize performance monitoring for optimization insights

### Knowledge Sharing
- Document lessons learned from complex implementations
- Share debugging techniques and optimization strategies
- Maintain best practices repository
- Regular architecture review sessions

## Conclusion

These enhanced development guidelines ensure consistent, high-quality code that meets performance targets while maintaining architectural integrity. By following these standards, we create maintainable, debuggable, and performant applications that provide excellent user experiences.

For specific implementation details, refer to:
- `docs/typescript-guidelines.md` - TypeScript coding standards
- `docs/logging/tslog-integration.md` - Detailed logging implementation
- `docs/bulletproof-react-structure.md` - Architecture patterns
- `CODE_QUALITY_PLAN.md` - Systematic quality improvement process
