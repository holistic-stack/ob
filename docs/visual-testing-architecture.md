# Visual Testing Architecture

## Overview

The OpenSCAD Babylon project implements a dual visual testing architecture that provides comprehensive coverage for both workflow validation and focused geometry testing. This document outlines the architecture, usage guidelines, and best practices.

## Architecture Components

### 1. AST-Based Workflow Tests

**Location:** `src/features/visual-testing/components/openscad-workflow-test-scene/`

**Data Flow:**
```
OpenSCAD Code → Parser → AST → ASTBridgeConverter → PrimitiveBabylonNode → OpenSCAD Geometry Builder → BabylonJS Meshes → Screenshots
```

**Purpose:**
- End-to-end workflow validation
- OpenSCAD syntax compatibility testing
- Parser integration testing
- Real-world usage scenario validation

**Example:**
```tsx
<OpenSCADWorkflowTestScene
  openscadCode="sphere(r=5, $fn=8);"
  cameraAngle="isometric"
  showOrientationGizmo={true}
/>
```

### 2. Direct Geometry Builder Tests

**Location:** `src/features/visual-testing/components/geometry-builder-test-scene/`

**Data Flow:**
```
Parameters → OpenSCAD Geometry Builder → BabylonJS Meshes → Screenshots
```

**Purpose:**
- Focused geometry generation testing
- Performance validation
- Algorithm-specific testing
- Regression testing for geometry fixes

**Example:**
```tsx
<GeometryBuilderTestScene
  primitiveType="sphere"
  primitiveParameters={{ radius: 5, fragments: 8 }}
  cameraAngle="isometric"
  showOrientationGizmo={true}
/>
```

## Performance Characteristics

### AST-Based Workflow Tests
- **Complexity:** High (full pipeline)
- **Setup Time:** ~300ms (parser initialization)
- **Execution Time:** Variable (depends on code complexity)
- **Memory Usage:** Higher (AST + geometry data)
- **Use Case:** Integration and workflow testing

### Direct Geometry Builder Tests
- **Complexity:** Low (focused testing)
- **Setup Time:** <10ms (direct service instantiation)
- **Execution Time:** <0.1ms per primitive
- **Memory Usage:** Lower (geometry data only)
- **Use Case:** Unit testing and performance validation

## Usage Guidelines

### When to Use AST-Based Tests

✅ **Use AST-based tests for:**
- Testing OpenSCAD syntax compatibility
- Validating parser integration
- End-to-end workflow testing
- Real-world usage scenarios
- Complex OpenSCAD constructs (modules, functions, etc.)

❌ **Avoid AST-based tests for:**
- Simple geometry validation
- Performance-critical testing
- Regression testing of specific algorithms
- High-frequency test execution

### When to Use Direct Geometry Builder Tests

✅ **Use direct tests for:**
- Geometry algorithm validation
- Performance testing and benchmarking
- Regression testing for specific fixes (e.g., $fn=3 sphere)
- Parameter validation testing
- Batch testing scenarios

❌ **Avoid direct tests for:**
- OpenSCAD syntax validation
- Parser integration testing
- Complex workflow scenarios
- Real-world usage validation

## Test Organization

### Visual Test Structure
```
src/features/visual-testing/components/
├── openscad-workflow-test-scene/           # AST-based tests
│   ├── sphere-primitive-workflow.vspec.tsx
│   ├── cube-primitive-workflow.vspec.tsx
│   └── cylinder-primitive-workflow.vspec.tsx
├── geometry-builder-test-scene/            # Direct test component
│   ├── geometry-builder-test-scene.tsx
│   └── geometry-builder-test-scene.test.tsx
└── geometry-builder-visual-tests/          # Direct visual tests
    ├── sphere-geometry-builder.vspec.tsx
    ├── cube-geometry-builder.vspec.tsx
    ├── cylinder-geometry-builder.vspec.tsx
    ├── consistency-validation.test.tsx
    └── performance-optimization.test.tsx
```

### Test Categories

#### 1. Critical Fix Validation
- **$fn=3 sphere rendering** (main issue fix)
- **Center parameter handling** (cube positioning)
- **Cone generation** (r2=0 edge case)

#### 2. Parameter Validation
- **Fragment counts** (3, 8, 16, 32, 64)
- **Size variations** (small, standard, large)
- **Edge cases** (zero values, extreme values)

#### 3. Performance Testing
- **Individual primitive generation** (<1ms target)
- **Mesh creation** (<5ms target)
- **End-to-end pipeline** (<16ms target)
- **Batch processing** (multiple primitives)

#### 4. Consistency Validation
- **AST vs Direct comparison** (same visual output)
- **Cross-platform compatibility**
- **Memory usage validation**

## Best Practices

### Test Development

1. **Follow TDD Methodology**
   ```typescript
   // Red: Write failing test first
   it('should generate $fn=3 sphere correctly', () => {
     const result = sphereGenerator.generateSphere(5, 3);
     expect(isSuccess(result)).toBe(true);
   });
   
   // Green: Implement minimal code to pass
   // Refactor: Improve while maintaining tests
   ```

2. **Use Real Implementations**
   ```typescript
   // ✅ Good: Use real services
   const sphereGenerator = new SphereGeneratorService(fragmentCalculator);
   
   // ❌ Bad: Mock core functionality
   vi.mock('SphereGeneratorService');
   ```

3. **Performance Monitoring**
   ```typescript
   const startTime = performance.now();
   const result = generateGeometry();
   const endTime = performance.now();
   
   expect(endTime - startTime).toBeLessThan(16);
   console.log(`Generation time: ${(endTime - startTime).toFixed(3)}ms`);
   ```

### Visual Test Configuration

1. **Storybook Integration**
   ```typescript
   export default {
     title: 'Visual Tests/Geometry Builder/Sphere',
     component: GeometryBuilderTestScene,
     parameters: {
       chromatic: {
         modes: {
           desktop: { viewport: { width: 1200, height: 800 } },
           mobile: { viewport: { width: 375, height: 667 } },
         },
       },
     },
   };
   ```

2. **Camera Configuration**
   ```typescript
   // Standard angles for consistent testing
   const cameraAngles = ['front', 'top', 'side', 'back', 'isometric'];
   
   // Use isometric for most tests (best 3D visualization)
   cameraAngle: 'isometric'
   ```

3. **Test Naming Convention**
   ```typescript
   // Format: [PrimitiveType][Variation][TestCase]
   export const SphereWithFn3: Story = { /* $fn=3 sphere test */ };
   export const CubeCentered: Story = { /* center=true cube test */ };
   export const CylinderCone: Story = { /* r2=0 cone test */ };
   ```

## Debugging and Troubleshooting

### Common Issues

1. **Test Timeout**
   ```typescript
   // Increase timeout for complex tests
   it('should handle complex geometry', async () => {
     // Test implementation
   }, { timeout: 10000 });
   ```

2. **Memory Leaks**
   ```typescript
   afterEach(() => {
     mockEngine?.dispose();
     mockScene?.dispose();
     // Cleanup any created meshes
   });
   ```

3. **Visual Regression Failures**
   ```bash
   # Update visual baselines when intentional changes are made
   pnpm test:visual --update-snapshots
   ```

### Performance Debugging

1. **Enable Performance Logging**
   ```typescript
   const props = {
     enableLogging: true,
     // Other props...
   };
   ```

2. **Memory Monitoring**
   ```typescript
   const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
   // Test execution
   const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
   console.log(`Memory increase: ${(finalMemory - initialMemory) / 1024 / 1024}MB`);
   ```

## Integration with CI/CD

### Automated Testing
```yaml
# GitHub Actions example
- name: Run Visual Tests
  run: |
    pnpm test:visual
    pnpm test src/features/visual-testing/
```

### Performance Monitoring
```yaml
- name: Performance Validation
  run: |
    pnpm test src/features/visual-testing/components/geometry-builder-visual-tests/performance-optimization.test.tsx
```

## Future Enhancements

### Planned Improvements
1. **Automated Performance Regression Detection**
2. **Cross-browser Visual Testing**
3. **3D Scene Comparison Tools**
4. **Automated Test Generation from OpenSCAD Files**

### Extension Points
1. **Custom Primitive Testing**
2. **CSG Operation Visual Tests**
3. **Animation and Interaction Testing**
4. **WebGL Performance Profiling**

## Conclusion

The dual visual testing architecture provides comprehensive coverage while maintaining excellent performance. Use AST-based tests for workflow validation and direct geometry builder tests for focused algorithm testing. Follow the guidelines and best practices to ensure reliable, maintainable visual testing infrastructure.
