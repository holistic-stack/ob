# Visual Regression Testing Guide

This comprehensive guide provides step-by-step instructions for setting up, running, and maintaining visual regression tests for OpenSCAD primitive shapes in the OpenSCAD Babylon project.

## Overview

The visual testing system validates OpenSCAD primitive rendering through the complete workflow:
1. **OpenSCAD Code Input** → 2. **AST Parsing** → 3. **Manifold Operations** → 4. **BabylonJS Rendering** → 5. **Visual Regression**

The system features advanced **camera auto-centering** that automatically positions shapes in the center of the viewport with optimal framing, ensuring consistent and reliable visual regression testing across all primitive types and camera angles.

## Test Structure

### Single Object Per Test
Each visual test renders **only one primitive shape** per screenshot to ensure clear visual validation and easy debugging. This approach provides:
- **Clear visual validation** with focused testing
- **Easy debugging** when tests fail
- **Consistent baseline** for regression detection
- **Reliable auto-centering** for each individual shape

### 2D Primitive Testing (3 tests total)
- **Primitives**: circle, square, polygon
- **Camera Angle**: Top view only (`cameraAngle="top"`)
- **Rationale**: Top-down view provides the clearest view of flat 2D shapes
- **Auto-centering**: Enabled to ensure shapes are properly framed in viewport

### 3D Primitive Testing (15 tests total)
- **Primitives**: cube, sphere, cylinder
- **Camera Angles**: All five angles for comprehensive coverage
  - `top` - Top-down view (optimal for seeing shape outline)
  - `side` - Side profile view (shows depth and height)
  - `back` - Back view (ensures consistent rendering from all angles)
  - `front` - Orthogonal front view (primary viewing angle)
  - `isometric` - Perspective view (shows 3D structure clearly)
- **Auto-centering**: Enabled for all angles to ensure consistent framing

## Visual Appearance Standards

### Shape Color
All shapes render in **blue** (`Color3(0.2, 0.6, 0.9)`) for optimal contrast against the white background.
```typescript
// Correct shape color configuration
material.diffuseColor = new Color3(0.2, 0.6, 0.9); // Blue
```

### Background
Scene background is **white** (`Color3(1.0, 1.0, 1.0)`) for clean, professional screenshots.
```typescript
// Correct background configuration
backgroundColor={new Color3(1.0, 1.0, 1.0)} // White
```

### Scene Elements
- **3D Axis**: Hidden (`show3DAxis={false}`) to avoid visual clutter
- **Orientation Gizmo**: Visible (`showOrientationGizmo={true}`) for spatial reference
- **Auto-Centering**: Enabled (`autoCenterCamera={true}`) to ensure shapes are properly framed
- **Console Logging**: Enabled (`enableLogging={true}`) for debugging and performance monitoring

### Proper vs Improper Appearance
**✅ Correct Appearance:**
- Blue shape centered in white viewport
- Orientation gizmo visible in corner
- No 3D axis lines visible
- Shape fully visible with appropriate margins

**❌ Incorrect Appearance:**
- Shape positioned off-center or partially outside viewport
- Gray or other colored background
- 3D axis lines cluttering the view
- Shape too small or too large relative to viewport

## Camera Auto-Centering System

### Overview
The visual testing system features advanced **camera auto-centering** that automatically positions primitive shapes in the center of the viewport with optimal framing. This ensures consistent and reliable visual regression testing.

### How Auto-Centering Works
1. **Bounding Box Calculation**: Calculates accurate bounding boxes for all generated meshes
2. **Geometric Center**: Determines the center point of all shapes combined
3. **Optimal Distance**: Calculates camera distance with conservative 3x margin factor
4. **Target Adjustment**: Updates camera target to center point while preserving angle positioning
5. **Radius Adjustment**: Sets camera radius for proper framing (minimum 30 units)

### Auto-Centering Configuration
```typescript
// Enable auto-centering (recommended for all tests)
<OpenSCADWorkflowTestScene
  openscadCode="cube(size=10);"
  cameraAngle="top"
  autoCenterCamera={true}  // Enables automatic centering
  showOrientationGizmo={true}
  show3DAxis={false}
  backgroundColor={new Color3(1.0, 1.0, 1.0)}
  enableLogging={true}
/>

// Disable auto-centering (only for special cases)
<OpenSCADWorkflowTestScene
  autoCenterCamera={false}  // Uses fixed camera positioning
  // ... other props
/>
```

### Technical Implementation
```typescript
// Simplified auto-centering algorithm
const center = new Vector3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
const distance = Math.max(size * 3, 30); // 3x margin, 30 unit minimum

sceneCamera.setTarget(center);  // Center the shape
sceneCamera.radius = distance;  // Optimal viewing distance
```

## Enhanced Setup Procedures

### 1. Prerequisites
- **Node.js**: Version 18+ required
- **pnpm**: Package manager (install with `npm install -g pnpm`)
- **WebGL Support**: Ensure browser supports WebGL2
- **Git**: For version control and snapshot management

### 2. Installation
```bash
# Clone repository and install dependencies
git clone <repository-url>
cd openscad-babylon
pnpm install

# Verify Playwright installation
pnpm exec playwright install

# Verify WebGL support
pnpm exec playwright test --list | grep visual
```

### 3. Running Visual Tests
```bash
# Run all visual tests (18 tests total)
pnpm test:visual

# Run specific primitive type
pnpm test:visual circle-primitive-workflow.vspec.tsx
pnpm test:visual cube-primitive-workflow.vspec.tsx
pnpm test:visual sphere-primitive-workflow.vspec.tsx

# Run with specific options
pnpm test:visual --headed                    # Show browser window
pnpm test:visual --reporter=html            # Generate HTML report
pnpm test:visual --workers=1                # Single worker for consistency
```

### 4. Updating Snapshots
```bash
# Update all snapshots (when visual changes are intentional)
pnpm test:visual:update

# Update specific test snapshots
pnpm test:visual:update circle-primitive-workflow.vspec.tsx

# Update single test case
pnpm test:visual:update cube-primitive-workflow.vspec.tsx --grep="top view"
```

### 5. Viewing Test Results
```bash
# Open HTML report with visual diffs
pnpm exec playwright show-report

# Check test artifacts
ls test-results/                            # View generated screenshots and videos
```

## Console and Network Logging Configuration

### Automatic Logging Features
All visual tests automatically capture comprehensive debugging information:
- **Console Messages**: `console.log`, `console.warn`, `console.error`
- **Network Requests**: HTTP requests (excluding fonts, icons, source maps)
- **Performance Metrics**: Render times and mesh generation statistics
- **Camera Positioning**: Auto-centering calculations and adjustments
- **Mesh Generation**: BabylonJS mesh creation and material application

### Enabling Logging
```typescript
// Enable comprehensive logging (recommended for development)
<OpenSCADWorkflowTestScene
  openscadCode="sphere(10);"
  cameraAngle="isometric"
  enableLogging={true}        // Captures all debug information
  autoCenterCamera={true}
  // ... other props
/>
```

### Accessing Logs
```bash
# View logs in Playwright HTML report
pnpm exec playwright show-report

# Enable verbose logging during test runs
DEBUG=* pnpm test:visual

# View specific component logs
DEBUG=OpenSCADWorkflowTestScene pnpm test:visual
```

### Useful Log Messages for Debugging
```typescript
// Camera auto-centering logs
"[DEBUG][OpenSCADWorkflowTestScene] Camera auto-centered on meshes: center=Vector3(0, 0, 0), distance=45"

// Mesh generation logs
"[DEBUG][OpenSCADWorkflowTestScene] Mesh 0 generated with blue material"

// Performance logs
"[INFO][PlaywrightDebugUtils] Visual test completed successfully: cube-workflow-top-view"

// Error logs
"[ERROR][OpenSCADWorkflowTestScene] Failed to generate mesh 0: Invalid geometry"
```

### Log Analysis for Performance
Monitor these key metrics in logs:
- **Canvas Ready Time**: Time for BabylonJS canvas initialization
- **Mesh Generation Time**: Time for OpenSCAD → BabylonJS conversion
- **Auto-centering Calculations**: Bounding box and camera positioning time
- **Screenshot Capture Time**: Time for visual regression capture

## Camera Angle Guidelines

### 2D Primitives: Top View Only
**Primitives**: circle, square, polygon
**Camera Angle**: `top` only
**Rationale**: Top-down view provides the clearest view of flat 2D shapes

```typescript
// 2D Primitive Test Configuration
test('circle primitive - top view', async ({ mount, page }) => {
  const component = await mount(
    <OpenSCADWorkflowTestScene
      openscadCode="circle(r=10);"
      cameraAngle="top"                    // Only angle needed for 2D
      showOrientationGizmo={true}
      show3DAxis={false}
      backgroundColor={new Color3(1.0, 1.0, 1.0)}
      autoCenterCamera={true}
      enableLogging={true}
    />
  );

  await expect(component).toHaveScreenshot('circle-workflow-top-view.png');
});
```

### 3D Primitives: All Five Angles
**Primitives**: cube, sphere, cylinder
**Camera Angles**: `top`, `side`, `back`, `front`, `isometric`
**Rationale**: Multiple angles ensure comprehensive 3D shape validation

```typescript
// 3D Primitive Test Configuration
const CAMERA_ANGLES = ['top', 'side', 'back', 'front', 'isometric'] as const;

test.describe('Cube Primitive OpenSCAD Workflow Visual Regression', () => {
  CAMERA_ANGLES.forEach((cameraAngle) => {
    test(`cube primitive - ${cameraAngle} view`, async ({ mount, page }) => {
      const component = await mount(
        <OpenSCADWorkflowTestScene
          openscadCode="cube(size=10);"
          cameraAngle={cameraAngle}         // Test all 5 angles
          showOrientationGizmo={true}
          show3DAxis={false}
          backgroundColor={new Color3(1.0, 1.0, 1.0)}
          autoCenterCamera={true}           // Essential for consistent framing
          enableLogging={true}
        />
      );

      await expect(component).toHaveScreenshot(
        `cube-workflow-${cameraAngle}-view.png`
      );
    });
  });
});
```

### Camera Angle Descriptions
- **`top`**: Top-down view - optimal for seeing shape outline and 2D projections
- **`side`**: Side profile view - shows depth and height relationships
- **`back`**: Back view - ensures consistent rendering from all angles
- **`front`**: Orthogonal front view - primary viewing angle for most shapes
- **`isometric`**: Perspective view - shows 3D structure and depth clearly

## File Organization and Best Practices

### Current File Structure
```
src/features/visual-testing/components/openscad-workflow-test-scene/
├── openscad-workflow-test-scene.tsx           # Main test scene component with auto-centering
├── circle-primitive-workflow.vspec.tsx        # 2D circle tests (1 test)
├── square-primitive-workflow.vspec.tsx        # 2D square tests (1 test)
├── polygon-primitive-workflow.vspec.tsx       # 2D polygon tests (1 test)
├── cube-primitive-workflow.vspec.tsx          # 3D cube tests (5 tests)
├── sphere-primitive-workflow.vspec.tsx        # 3D sphere tests (5 tests)
├── cylinder-primitive-workflow.vspec.tsx      # 3D cylinder tests (5 tests)
└── *-snapshots/                               # Generated screenshot baselines
    ├── circle-workflow-top-view-chromium-win32.png
    ├── cube-workflow-top-view-chromium-win32.png
    ├── cube-workflow-side-view-chromium-win32.png
    ├── cube-workflow-back-view-chromium-win32.png
    ├── cube-workflow-front-view-chromium-win32.png
    ├── cube-workflow-isometric-view-chromium-win32.png
    └── ... (18 total snapshots)
```

### Naming Conventions
- **Test Files**: `{primitive}-primitive-workflow.vspec.tsx`
- **Test Names**: `{primitive} primitive - {angle} view`
- **Screenshots**: `{primitive}-workflow-{angle}-view-chromium-win32.png`
- **Test IDs**: `{primitive}-workflow-{angle}-view`

### Best Practices for Test Maintenance
1. **Single Responsibility**: Each test file focuses on one primitive type
2. **Consistent Configuration**: All tests use the same visual appearance standards
3. **Auto-centering**: Always enable `autoCenterCamera={true}` for reliable framing
4. **Logging**: Enable `enableLogging={true}` for debugging capabilities
5. **Snapshot Management**: Only update snapshots when visual changes are intentional

### Adding New Primitive Tests
```typescript
// Template for new primitive test file
import { Color3 } from '@babylonjs/core';
import { expect, test } from '@playwright/experimental-ct-react';
import {
  runBabylonVisualTest,
  STANDARD_SCREENSHOT_OPTIONS,
} from '../../utils/shared-test-setup/shared-test-setup';
import { OpenSCADWorkflowTestScene } from './openscad-workflow-test-scene';

// For 2D primitives - single test
test.describe('NewPrimitive Primitive OpenSCAD Workflow Visual Regression', () => {
  test('newprimitive primitive - top view', async ({ mount, page }) => {
    const testName = 'newprimitive-workflow-top-view';

    await runBabylonVisualTest(page, testName, async () => {
      const component = await mount(
        <OpenSCADWorkflowTestScene
          openscadCode="newprimitive(param=10);"
          cameraAngle="top"
          showOrientationGizmo={true}
          show3DAxis={false}
          backgroundColor={new Color3(1.0, 1.0, 1.0)}
          autoCenterCamera={true}
          enableLogging={true}
        />
      );

      await expect(component).toHaveScreenshot(
        'newprimitive-workflow-top-view.png',
        STANDARD_SCREENSHOT_OPTIONS
      );
    });
  });
});
```

## Comprehensive Troubleshooting Section

### Test Failures

#### Screenshot Mismatches
**Symptoms**: Visual differences detected between actual and expected screenshots
```bash
# Error message example
Error: Screenshot comparison failed:
  Expected: cube-workflow-top-view-chromium-win32.png
  Actual: test-failed-1.png
  Diff: cube-workflow-top-view-diff.png
```

**Solutions**:
1. **Review Visual Diff**: Open Playwright HTML report to see differences
   ```bash
   pnpm exec playwright show-report
   ```

2. **Update Snapshots** (if changes are intentional):
   ```bash
   pnpm test:visual:update cube-primitive-workflow.vspec.tsx
   ```

3. **Check Auto-centering**: Verify `autoCenterCamera={true}` is enabled
4. **Verify Configuration**: Ensure consistent visual appearance standards

#### Timeout Errors
**Symptoms**: Tests exceed 10-second timeout limit
```bash
# Error message example
Test timeout of 10000ms exceeded.
```

**Solutions**:
1. **Check Console Logs**: Look for parsing/rendering errors
   ```bash
   DEBUG=OpenSCADWorkflowTestScene pnpm test:visual --headed
   ```

2. **Verify OpenSCAD Syntax**: Ensure code is valid
   ```typescript
   // Correct syntax
   openscadCode="cube(size=10);"

   // Incorrect syntax (missing semicolon)
   openscadCode="cube(size=10)"
   ```

3. **Increase Timeout** (if needed):
   ```typescript
   test('slow primitive test', async ({ mount, page }) => {
     test.setTimeout(30000); // 30 second timeout
     // ... test implementation
   });
   ```

#### Canvas Initialization Issues
**Symptoms**: BabylonJS canvas fails to initialize or render
```bash
# Error message example
Error: Canvas element not found or WebGL not supported
```

**Solutions**:
1. **Verify WebGL Support**:
   ```bash
   # Check browser WebGL capabilities
   pnpm test:visual --headed
   # Manually navigate to: chrome://gpu/
   ```

2. **Check Viewport Size**: Ensure proper dimensions (1280x720)
3. **Browser Compatibility**: Test with different browsers
   ```bash
   pnpm test:visual --project=chromium
   pnpm test:visual --project=firefox
   ```

### Performance Issues

#### Slow Rendering
**Symptoms**: Tests take longer than expected (>30 seconds per test)

**Solutions**:
1. **Monitor Performance Logs**:
   ```bash
   # Look for these log patterns
   "[INFO][CanvasReadyUtils] Canvas is ready for screenshot"
   "[DEBUG][OpenSCADWorkflowTestScene] Camera auto-centered"
   ```

2. **Check Mesh Complexity**: Simplify OpenSCAD code if needed
3. **Optimize Auto-centering**: Verify bounding box calculations are efficient

#### Memory Leaks
**Symptoms**: Tests fail after multiple runs, system becomes unresponsive

**Solutions**:
1. **Verify Resource Cleanup**: Check for proper disposal
2. **Run Single Worker**: Use `--workers=1` for consistency
   ```bash
   pnpm test:visual --workers=1
   ```

3. **Monitor Memory Usage**: Use browser dev tools in headed mode

### Debugging Commands

#### Essential Debugging Commands
```bash
# Comprehensive debugging workflow
pnpm test:visual --headed                    # Visual debugging with browser
pnpm test:visual --reporter=html            # Generate detailed HTML report
DEBUG=* pnpm test:visual                     # Enable all debug logging
pnpm test:visual --trace=on                 # Enable Playwright tracing

# Component-specific debugging
DEBUG=OpenSCADWorkflowTestScene pnpm test:visual
DEBUG=CanvasReadyUtils pnpm test:visual
DEBUG=PlaywrightDebugUtils pnpm test:visual

# Performance debugging
NODE_OPTIONS="--inspect" pnpm test:visual   # Node.js debugging
pnpm test:visual --reporter=line            # Minimal output for CI
```

#### Advanced Debugging Techniques
```bash
# Capture additional artifacts
pnpm test:visual --video=on --screenshot=only-on-failure

# Debug specific test case
pnpm test:visual cube-primitive-workflow.vspec.tsx --grep="top view" --headed

# Generate trace files for analysis
pnpm test:visual --trace=retain-on-failure
```

### Common Error Patterns

#### TypeScript Compilation Errors
```bash
# Error pattern
error TS2339: Property 'error' does not exist on type 'Result<T, E>'

# Solution: Check Result type handling
if (!result.success) {
  const errorMsg = result.error?.message || 'Unknown error';
}
```

#### Biome Violations
```bash
# Check and fix formatting issues
pnpm biome:check
pnpm biome:fix
```

#### Snapshot Update Procedures
```bash
# Safe snapshot update workflow
1. git status                                # Ensure clean working directory
2. pnpm test:visual                         # Run tests to see failures
3. pnpm exec playwright show-report        # Review visual diffs
4. pnpm test:visual:update                  # Update if changes are intentional
5. git add . && git commit -m "Update visual regression snapshots"
```

## Development Best Practices

### Test Development Methodology
1. **TDD Approach**: Write failing tests first, then implement features
2. **Real Implementations**: Use actual OpenSCAD parser and BabylonJS (no mocks)
3. **Auto-centering First**: Always enable `autoCenterCamera={true}` for new tests
4. **Consistent Standards**: Follow visual appearance standards for all tests

### Test Naming and Organization
```typescript
// Consistent naming patterns
test('cube primitive - top view', async ({ mount, page }) => {
  const testName = 'cube-workflow-top-view';           // Test identifier
  const screenshotName = 'cube-workflow-top-view.png'; // Screenshot filename
  // ... test implementation
});
```

### Code Quality Standards
- **Zero TypeScript Errors**: Mandatory strict mode compliance
- **Zero Biome Violations**: Automated code quality enforcement
- **Comprehensive Logging**: Enable `enableLogging={true}` for all tests
- **Error Handling**: Use Result<T,E> patterns for robust error management

### Snapshot Management Best Practices
```bash
# Safe snapshot update workflow
1. Review changes: pnpm exec playwright show-report
2. Verify intentional: Confirm visual changes are expected
3. Update selectively: pnpm test:visual:update specific-test.vspec.tsx
4. Test thoroughly: pnpm test:visual (ensure all tests pass)
5. Commit carefully: git add snapshots with descriptive commit message
```

### Performance Optimization
- **Single Worker**: Use `--workers=1` for consistent results
- **Resource Cleanup**: Ensure proper disposal of BabylonJS resources
- **Conservative Margins**: Use 3x margin factor for reliable auto-centering
- **Minimal Test Scope**: One primitive per test for focused validation

## Integration with CI/CD

### Automated Pipeline Integration
Visual tests run automatically in CI/CD pipelines and will fail if:
- **Screenshot Mismatches**: Visual differences detected
- **Timeout Errors**: Tests exceed time limits
- **TypeScript Compilation**: Zero errors required
- **Biome Linting**: Zero violations required
- **Performance Degradation**: Tests take too long

### CI/CD Configuration Requirements
```yaml
# Example CI configuration
- name: Run Visual Regression Tests
  run: |
    pnpm install
    pnpm exec playwright install
    pnpm test:visual --workers=1

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: visual-test-results
    path: test-results/
```

### Pre-commit Checklist
Before committing changes, ensure:
1. ✅ All visual tests pass locally: `pnpm test:visual`
2. ✅ TypeScript compiles without errors: `pnpm type-check`
3. ✅ Code formatting is correct: `pnpm biome:check`
4. ✅ Snapshots are intentionally updated (if applicable)
5. ✅ Test coverage remains comprehensive (18 tests total)

### Deployment Considerations
- **Baseline Management**: Maintain consistent snapshot baselines across environments
- **Browser Compatibility**: Test with primary browser (Chromium) for consistency
- **Performance Monitoring**: Monitor test execution times in CI/CD
- **Artifact Storage**: Preserve test results and visual diffs for debugging

This comprehensive guide ensures reliable, maintainable visual regression testing for OpenSCAD primitive shapes with advanced auto-centering capabilities.
