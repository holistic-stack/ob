# Migration Guide

## Overview

This guide helps you migrate to OpenSCAD Babylon from various existing implementations and tools. Whether you're coming from the desktop OpenSCAD application, other web-based OpenSCAD tools, or Three.js-based 3D applications, this guide provides step-by-step instructions and best practices.

## Migration Scenarios

### [From OpenSCAD Desktop Application](./from-openscad-desktop.md)
Migrate from the traditional OpenSCAD desktop application to the web-based OpenSCAD Babylon environment.

**Key Topics:**
- Feature compatibility and differences
- Workflow changes and new capabilities
- File management and project organization
- Export format support and limitations

### [From Other Web OpenSCAD Tools](./from-web-openscad-tools.md)
Migrate from existing web-based OpenSCAD implementations to OpenSCAD Babylon.

**Key Topics:**
- API differences and integration patterns
- Performance improvements and optimizations
- Component migration and refactoring
- State management updates

### [From Three.js Applications](./from-threejs-applications.md)
Migrate 3D applications from Three.js to BabylonJS with OpenSCAD integration.

**Key Topics:**
- BabylonJS vs Three.js differences
- Scene management and rendering patterns
- CSG operation migration
- Performance optimization strategies

### [API Migration Guide](./api-migration.md)
Detailed guide for migrating between different versions of OpenSCAD Babylon APIs.

**Key Topics:**
- Breaking changes and deprecations
- New Result-based error handling
- Component prop changes
- Hook usage patterns

## Quick Start Migration

### 1. Assessment Phase
Before starting migration, assess your current implementation:

```bash
# Clone the migration assessment tool
git clone https://github.com/openscad-babylon/migration-tools
cd migration-tools

# Run assessment on your codebase
npm install
npm run assess -- --path /path/to/your/project
```

### 2. Dependency Migration
Update your package.json dependencies:

```json
{
  "dependencies": {
    "openscad-babylon": "^1.0.0",
    "@babylonjs/core": "^7.0.0",
    "react": "^19.0.0",
    "typescript": "^5.8.0"
  },
  "devDependencies": {
    "vitest": "^1.6.0",
    "@types/react": "^19.0.0"
  }
}
```

### 3. Basic Component Migration
Replace existing OpenSCAD components:

```typescript
// Before (generic web OpenSCAD)
import { OpenSCADViewer } from 'old-openscad-lib';

function MyComponent() {
  return (
    <OpenSCADViewer 
      code="cube([1,1,1]);" 
      width={800} 
      height={600} 
    />
  );
}

// After (OpenSCAD Babylon)
import { BabylonCanvas } from 'openscad-babylon';

function MyComponent() {
  return (
    <BabylonCanvas 
      openscadCode="cube([1,1,1]);" 
      width={800} 
      height={600}
      enableSelection={true}
      enableExport={true}
    />
  );
}
```

### 4. Error Handling Migration
Update error handling to use Result types:

```typescript
// Before (exception-based)
try {
  const result = parseOpenSCAD(code);
  processResult(result);
} catch (error) {
  console.error('Parse failed:', error.message);
}

// After (Result-based)
const result = parseOpenSCADWithResult(code);
if (result.success) {
  processResult(result.data);
} else {
  console.error('Parse failed:', result.error.message);
  // Handle specific error types
  switch (result.error.code) {
    case 'SYNTAX_ERROR':
      showSyntaxError(result.error.line, result.error.column);
      break;
    case 'INVALID_INPUT':
      showInputError();
      break;
  }
}
```

## Migration Checklist

### Pre-Migration
- [ ] Assess current codebase and dependencies
- [ ] Identify breaking changes and compatibility issues
- [ ] Plan migration strategy and timeline
- [ ] Set up development environment
- [ ] Create backup of current implementation

### During Migration
- [ ] Update dependencies and build configuration
- [ ] Migrate core components and services
- [ ] Update error handling patterns
- [ ] Migrate tests and testing strategies
- [ ] Update documentation and examples

### Post-Migration
- [ ] Performance testing and optimization
- [ ] User acceptance testing
- [ ] Documentation updates
- [ ] Team training on new patterns
- [ ] Monitoring and error tracking setup

## Common Migration Challenges

### 1. Performance Differences
**Challenge:** Different performance characteristics between old and new implementations.

**Solution:**
- Profile both implementations to understand differences
- Optimize critical paths using OpenSCAD Babylon performance guidelines
- Use progressive enhancement for complex features

### 2. API Breaking Changes
**Challenge:** Existing code doesn't work with new APIs.

**Solution:**
- Use migration scripts and automated refactoring tools
- Implement adapter patterns for gradual migration
- Update TypeScript types to catch issues at compile time

### 3. Testing Strategy Changes
**Challenge:** Existing tests don't work with new architecture.

**Solution:**
- Migrate to Vitest and real implementation testing
- Update test patterns to use BabylonJS NullEngine
- Implement new visual regression testing strategies

### 4. Bundle Size Increases
**Challenge:** New implementation has larger bundle size.

**Solution:**
- Use tree-shaking and selective imports
- Implement code splitting and lazy loading
- Optimize build configuration for production

## Migration Tools

### Automated Migration Scripts
```bash
# Install migration CLI tool
npm install -g @openscad-babylon/migration-cli

# Run automated migration
openscad-babylon-migrate --source ./src --target ./migrated-src

# Validate migration results
openscad-babylon-validate --path ./migrated-src
```

### Code Transformation Tools
```bash
# Transform component patterns
npx @openscad-babylon/codemod transform-components src/

# Update error handling patterns
npx @openscad-babylon/codemod transform-error-handling src/

# Migrate test files
npx @openscad-babylon/codemod transform-tests src/
```

### Compatibility Adapters
For gradual migration, use compatibility adapters:

```typescript
// Adapter for old API compatibility
import { createLegacyAdapter } from '@openscad-babylon/compat';

const legacyViewer = createLegacyAdapter({
  component: BabylonCanvas,
  propMapping: {
    code: 'openscadCode',
    onError: 'onRenderError'
  }
});
```

## Performance Migration Guide

### Before Migration Benchmarks
Establish baseline performance metrics:

```typescript
// Measure current performance
const startTime = performance.now();
await currentImplementation.parse(code);
const parseTime = performance.now() - startTime;

console.log(`Current parse time: ${parseTime}ms`);
```

### After Migration Optimization
Optimize OpenSCAD Babylon performance:

```typescript
// Use performance monitoring
import { usePerformanceMonitor } from 'openscad-babylon';

function OptimizedComponent() {
  const { metrics, startMeasurement } = usePerformanceMonitor();
  
  const handleCodeChange = useCallback(
    debounce(async (code: string) => {
      const measurement = startMeasurement('parse');
      await parseCode(code);
      measurement.end();
    }, 300),
    []
  );
  
  return (
    <div>
      <CodeEditor onChange={handleCodeChange} />
      <PerformanceMetrics metrics={metrics} />
    </div>
  );
}
```

## Support and Resources

### Migration Support
- **GitHub Discussions**: Community support and migration questions
- **Migration Issues**: Report migration-specific bugs and issues
- **Professional Services**: Enterprise migration support available

### Documentation
- [API Reference](../api/README.md) - Complete API documentation
- [Architecture Guide](../adr/README.md) - Architectural decisions and patterns
- [Performance Guide](./performance-optimization.md) - Performance optimization strategies

### Examples
- [Migration Examples](../examples/migration/) - Real-world migration examples
- [Before/After Comparisons](../examples/comparisons/) - Side-by-side code comparisons
- [Best Practices](../examples/best-practices/) - Recommended patterns and practices

## Migration Timeline

### Phase 1: Assessment (1-2 weeks)
- Analyze current codebase
- Identify migration scope and challenges
- Plan migration strategy

### Phase 2: Core Migration (2-4 weeks)
- Migrate core components and services
- Update build and test configuration
- Implement new error handling patterns

### Phase 3: Testing and Optimization (1-2 weeks)
- Comprehensive testing of migrated code
- Performance optimization and tuning
- User acceptance testing

### Phase 4: Deployment and Monitoring (1 week)
- Production deployment
- Monitoring and error tracking setup
- Team training and documentation updates

## Success Metrics

Track migration success with these metrics:

- **Functionality**: All features working correctly
- **Performance**: Meeting or exceeding previous performance
- **Reliability**: Reduced error rates and improved stability
- **Developer Experience**: Improved development workflow and productivity
- **User Experience**: Enhanced user interface and interaction quality

## Next Steps

1. Choose your migration scenario from the links above
2. Follow the step-by-step migration guide
3. Use the provided tools and scripts
4. Test thoroughly and optimize performance
5. Deploy and monitor the migrated application

For specific migration questions or support, please refer to our [GitHub Discussions](https://github.com/openscad-babylon/discussions) or contact our support team.
