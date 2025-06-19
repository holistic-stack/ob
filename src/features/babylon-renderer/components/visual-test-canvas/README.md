# Visual Test Canvas Components

This directory contains components for visual regression testing of OpenSCAD to Babylon.js rendering pipeline. The components have been refactored following TDD, DRY, KISS, and SRP principles.

## Components Overview

### Original Component (Backward Compatibility)
- **`VisualTestCanvas`** - Original component that accepts OpenSCAD code and handles the entire pipeline internally

### Refactored Components (New Architecture)
- **`RefactoredVisualTestCanvas`** - Core rendering component that accepts pre-generated meshes as props
- **`OpenSCADToMeshWrapper`** - Wrapper that converts OpenSCAD code to meshes and passes them to RefactoredVisualTestCanvas
- **`useOpenSCADMeshes`** - Hook for converting OpenSCAD code to Babylon.js meshes
- **Material Manager Utilities** - Pure functions for applying materials to mesh collections
- **Camera Manager Utilities** - Pure functions for positioning cameras optimally

## Architecture Principles

### Single Responsibility Principle (SRP)
Each component has a single, well-defined responsibility:
- `RefactoredVisualTestCanvas`: Only handles rendering and scene management
- `useOpenSCADMeshes`: Only handles OpenSCAD to mesh conversion
- Material Manager: Only handles material creation and application
- Camera Manager: Only handles camera positioning

### Dependency Inversion
Components depend on abstractions (props) rather than concrete implementations:
- `RefactoredVisualTestCanvas` accepts `MeshCollection` props instead of OpenSCAD code
- Material and camera management are injected as utilities

### Functional Programming
- Pure functions for material and camera management
- Immutable data structures
- Result types for error handling
- Function composition for complex operations

## Usage Examples

### Using the Refactored Component Directly

```tsx
import { RefactoredVisualTestCanvas, useOpenSCADMeshes } from './visual-test-canvas';

function MyTest() {
  const { meshes, isLoading, error } = useOpenSCADMeshes({
    scene: babylonScene,
    openscadCode: 'cube([5, 5, 5]);',
    referenceOpenscadCode: 'cube([5, 5, 5]);'
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <RefactoredVisualTestCanvas
      testName="my-test"
      meshes={meshes}
      visualSceneConfig={{
        backgroundColor: '#ffffff',
        camera: { autoPosition: true }
      }}
      width={800}
      height={600}
    />
  );
}
```

### Using the Wrapper Component (Backward Compatible)

```tsx
import { OpenSCADToMeshWrapper } from './visual-test-canvas';

function MyTest() {
  return (
    <OpenSCADToMeshWrapper
      testName="my-test"
      openscadCode="cube([5, 5, 5]);"
      referenceOpenscadCode="cube([5, 5, 5]);"
      enableReferenceObject={true}
      width={800}
      height={600}
    />
  );
}
```

### Using Material Manager Utilities

```tsx
import { applyMaterialsToMeshCollection, getMaterialTheme } from './visual-test-canvas';

// Apply materials to a mesh collection
const result = await applyMaterialsToMeshCollection(
  meshCollection,
  scene,
  { theme: 'high-contrast' }
);

// Get a specific material theme
const theme = getMaterialTheme('colorful');
```

### Using Camera Manager Utilities

```tsx
import { positionCameraForMeshes, calculateMeshBounds } from './visual-test-canvas';

// Position camera for optimal viewing
const result = await positionCameraForMeshes(
  meshCollection,
  scene,
  { paddingFactor: 4.0, autoPosition: true }
);

// Calculate bounds for manual positioning
const boundsResult = calculateMeshBounds(meshes);
```

## Testing Strategy

### Unit Tests
- Each component and utility has comprehensive unit tests
- Tests follow TDD principles with failing tests written first
- Pure functions are easily testable due to predictable inputs/outputs

### Integration Tests
- `integration.test.tsx` tests the complete workflow
- Tests error handling and edge cases
- Verifies proper component composition

### Visual Regression Tests
- Playwright component tests for visual validation
- Tests use the wrapper component for backward compatibility
- Screenshots verify rendering correctness

## File Structure

```
visual-test-canvas/
├── README.md                                    # This file
├── index.ts                                     # Main exports
├── visual-test-canvas.tsx                       # Original component (backward compatibility)
├── refactored-visual-test-canvas.tsx            # New core rendering component
├── openscad-to-mesh-wrapper.tsx                 # Wrapper for backward compatibility
├── types/
│   └── visual-test-canvas-types.ts              # TypeScript type definitions
├── hooks/
│   └── use-openscad-meshes/                     # OpenSCAD to mesh conversion hook
│       ├── use-openscad-meshes.ts
│       ├── use-openscad-meshes.test.ts
│       └── index.ts
├── utils/
│   ├── material-manager/                        # Material management utilities
│   │   ├── material-manager.ts
│   │   ├── material-manager.test.ts
│   │   └── index.ts
│   └── camera-manager/                          # Camera positioning utilities
│       ├── camera-manager.ts
│       ├── camera-manager.test.ts
│       └── index.ts
├── integration.test.tsx                         # Integration tests
├── refactored-visual-test-canvas.test.tsx       # Unit tests for refactored component
└── *.vspec.tsx                                  # Playwright visual regression tests
```

## Migration Guide

### For New Tests
Use the refactored components for better separation of concerns:

```tsx
// Recommended for new tests
import { RefactoredVisualTestCanvas, useOpenSCADMeshes } from './visual-test-canvas';

// Or use the wrapper for simpler cases
import { OpenSCADToMeshWrapper } from './visual-test-canvas';
```

### For Existing Tests
Existing tests continue to work without changes:

```tsx
// Existing tests work unchanged
import { VisualTestCanvas } from './visual-test-canvas';
```

### Gradual Migration
1. Keep existing tests using `VisualTestCanvas`
2. Use `OpenSCADToMeshWrapper` for new tests that need OpenSCAD code input
3. Use `RefactoredVisualTestCanvas` directly for tests that need fine-grained control
4. Gradually migrate existing tests when making other changes

## Benefits of Refactoring

1. **Better Testability**: Pure functions and separated concerns make testing easier
2. **Improved Reusability**: Components can be composed in different ways
3. **Enhanced Maintainability**: Single responsibility makes code easier to understand and modify
4. **Type Safety**: Comprehensive TypeScript types prevent runtime errors
5. **Performance**: Optimized rendering pipeline with better resource management
6. **Debugging**: Clear separation makes it easier to isolate and fix issues

## Future Enhancements

- Additional material themes
- More camera positioning strategies
- Performance optimizations for large mesh collections
- Support for custom mesh processing pipelines
- Enhanced error handling and recovery
