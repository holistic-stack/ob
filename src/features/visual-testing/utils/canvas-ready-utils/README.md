# Canvas Ready Utils

Reusable utilities for waiting for BabylonJS canvas to be fully rendered before taking screenshots in visual regression tests. Provides robust waiting strategies that ensure consistent and reliable visual testing.

## Overview

The Canvas Ready Utils provide a comprehensive solution for waiting for 3D canvas rendering to complete before capturing screenshots. This is essential for visual regression testing where timing is critical for consistent results.

## Key Features

- ✅ **Canvas Element Detection** - Waits for canvas DOM element to be present and visible
- ✅ **Ready Attribute Checking** - Waits for custom `data-ready` attributes to be set
- ✅ **WebGL Context Validation** - Optional WebGL context availability checking
- ✅ **Frame Stability Detection** - Waits for rendering to stabilize (no frame changes)
- ✅ **Configurable Timeouts** - Customizable timeout and stabilization settings
- ✅ **Comprehensive Logging** - Detailed debug logging for troubleshooting
- ✅ **Playwright Optimized** - Designed specifically for headless browser testing

## Quick Start

### Basic Usage

```typescript
import { waitForCanvasReady } from './canvas-ready-utils';

test('my visual test', async ({ mount, page }) => {
  const component = await mount(<MyBabylonComponent />);
  
  // Wait for canvas to be fully rendered
  await waitForCanvasReady(page, {
    testName: 'my-test',
    timeout: 15000
  });
  
  await expect(component).toHaveScreenshot('my-test.png');
});
```

### Using Shared Test Setup (Recommended)

```typescript
import { runBabylonVisualTest } from '../shared-test-setup/shared-test-setup';

test('babylon scene test', async ({ mount, page }) => {
  await runBabylonVisualTest(page, 'babylon-test', async () => {
    const component = await mount(<BabylonComponent />);
    // Canvas waiting is handled automatically
    await expect(component).toHaveScreenshot('babylon.png');
  });
});
```

## API Reference

### `waitForCanvasReady(page, options)`

Main function that provides comprehensive canvas readiness checking.

**Parameters:**
- `page: Page` - Playwright page instance
- `options: CanvasReadyOptions` - Configuration options

**Options:**
```typescript
interface CanvasReadyOptions {
  testName?: string;              // Test name for logging (default: 'canvas-ready')
  timeout?: number;               // Max wait time in ms (default: 15000)
  stabilizationTime?: number;     // Final stabilization wait in ms (default: 2000)
  canvasSelector?: string;        // Canvas CSS selector (default: 'canvas')
  readyAttribute?: string;        // Ready attribute name (default: 'data-ready')
  readyValue?: string;            // Expected ready value (default: 'true')
  waitForWebGL?: boolean;         // Check WebGL context (default: true)
  waitForStableFrames?: boolean;  // Wait for frame stability (default: true)
  stableFrameCount?: number;      // Stable frames to wait for (default: 3)
}
```

### `waitForCanvasReadyQuick(page, options)`

Simplified version for faster tests with basic readiness checking.

**Features:**
- Skips frame stability checking
- Shorter stabilization time (1000ms)
- Good for simple/fast rendering scenarios

## Integration with Shared Test Setup

The canvas ready utilities are integrated into the shared test setup functions:

### `runBabylonVisualTest()`

Full-featured visual test runner with comprehensive canvas waiting:

```typescript
await runBabylonVisualTest(page, 'test-name', async () => {
  // Your test code here
}, {
  canvasOptions: {
    timeout: 20000,
    stabilizationTime: 3000
  }
});
```

### `runBabylonVisualTestQuick()`

Fast visual test runner with quick canvas waiting:

```typescript
await runBabylonVisualTestQuick(page, 'test-name', async () => {
  // Your test code here
});
```

## Configuration Examples

### Custom Timeout and Stabilization

```typescript
await waitForCanvasReady(page, {
  testName: 'complex-scene',
  timeout: 30000,           // 30 second timeout
  stabilizationTime: 5000,  // 5 second stabilization
});
```

### Custom Canvas Selector

```typescript
await waitForCanvasReady(page, {
  canvasSelector: '.my-custom-canvas',
  readyAttribute: 'data-scene-ready',
  readyValue: 'loaded'
});
```

### Disable Advanced Checks

```typescript
await waitForCanvasReady(page, {
  waitForWebGL: false,        // Skip WebGL check (good for headless)
  waitForStableFrames: false, // Skip frame stability check
  stabilizationTime: 1000     // Shorter wait time
});
```

## Troubleshooting

### Common Issues

1. **WebGL Context Not Available**
   - **Solution:** Set `waitForWebGL: false` for headless browser testing
   - **Reason:** Headless browsers may not support WebGL

2. **Timeout During Frame Stability Check**
   - **Solution:** Set `waitForStableFrames: false` or increase `timeout`
   - **Reason:** Complex animations may never stabilize

3. **Canvas Element Not Found**
   - **Solution:** Check `canvasSelector` and ensure component is mounted
   - **Reason:** Canvas may not be rendered yet or selector is incorrect

### Debug Logging

The utilities provide comprehensive logging. Look for these log patterns:

```
[CANVAS_READY][test-name] Starting canvas readiness check
[CANVAS_ELEMENT][test-name] Canvas element found and visible
[CANVAS_READY_ATTR][test-name] Ready attribute found
[CANVAS_STABLE][test-name] Frame rendering stabilized
[CANVAS_READY][test-name] Canvas is ready for screenshot
```

## Best Practices

1. **Use Shared Test Setup** - Prefer `runBabylonVisualTest()` over direct utility calls
2. **Disable WebGL for Headless** - Set `waitForWebGL: false` in CI environments
3. **Adjust Timeouts for Complexity** - Increase timeouts for complex 3D scenes
4. **Use Quick Version for Simple Tests** - Use `waitForCanvasReadyQuick()` for fast rendering
5. **Test Name for Debugging** - Always provide meaningful test names for logging

## Examples

See the test files for complete examples:
- `circle-primitive.vspec.tsx` - Basic primitive testing
- `canvas-ready-utils.test.ts` - Unit tests with mock examples
- `shared-test-setup.test.ts` - Integration test examples
