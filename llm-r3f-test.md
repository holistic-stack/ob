# Testing @react-three/fiber Components

Testing `@react-three/fiber` (R3F) components requires a specific approach due to their reliance on a WebGL canvas. This guide outlines the recommended strategies for unit/integration testing and end-to-end testing, adhering to the project's guidelines.

## 1. Unit & Integration Testing with `@react-three/test-renderer`

For testing the logic, props, and structure of your R3F components without a full browser environment, `@react-three/test-renderer` is the tool of choice. It renders your component tree into a JSON-like object, allowing you to inspect the scene graph and its elements. This approach aligns with the project guideline of *not mocking* the core Three.js environment, as it uses a dedicated renderer.

### Installation

```bash
pnpm add -D @react-three/test-renderer
```

### Basic Usage

Let's consider a simple `Box` component:

```tsx
// src/features/3d-renderer/components/box.tsx
import React from 'react';

interface BoxProps {
  color: string;
  size?: number;
}

export const Box: React.FC<BoxProps> = ({ color, size = 1 }) => {
  return (
    <mesh>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};
```

Here's how you would test it:

```tsx
// src/features/3d-renderer/components/box.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { Box } from './box.js'; // Note the .js extension for imports
import React from 'react';
import * as THREE from 'three';

describe('Box component', () => {
  // Ensure Three.js objects are disposed after each test to prevent memory leaks
  let renderer: ReactThreeTestRenderer.Renderer | null = null;

  afterEach(() => {
    if (renderer) {
      renderer.unmount();
      renderer = null;
    }
  });

  it('should render a mesh with a boxGeometry and the correct color material', async () => {
    renderer = await ReactThreeTestRenderer.create(<Box color="blue" />);

    // Find the mesh in the scene graph
    const mesh = renderer.scene.children[0];
    expect(mesh.type).toBe('Mesh');

    // Assert that its children (geometry and material) are correct
    const geometry = mesh.children[0];
    const material = mesh.children[1];

    expect(geometry.type).toBe('BoxGeometry');
    expect(geometry.props.args).toEqual([1, 1, 1]); // Default size
    expect(material.type).toBe('MeshStandardMaterial');
    expect(material.props.color).toBe('blue');
  });

  it('should update properties correctly', async () => {
    renderer = await ReactThreeTestRenderer.create(<Box color="blue" size={2} />);

    // Re-render with new props
    await renderer.update(<Box color="red" size={3} />);

    const mesh = renderer.scene.children[0];
    const geometry = mesh.children[0];
    const material = mesh.children[1];

    expect(geometry.props.args).toEqual([3, 3, 3]);
    expect(material.props.color).toBe('red');
  });

  it('should handle multiple children correctly', async () => {
    // Example of a component with multiple meshes
    const GroupedBoxes: React.FC = () => (
      <group>
        <Box color="red" position={[1, 0, 0]} />
        <Box color="green" position={[-1, 0, 0]} />
      </group>
    );

    renderer = await ReactThreeTestRenderer.create(<GroupedBoxes />);

    const group = renderer.scene.children[0];
    expect(group.type).toBe('Group');
    expect(group.children).toHaveLength(2);

    const box1 = group.children[0];
    const box2 = group.children[1];

    expect(box1.props.color).toBe('red');
    expect(box2.props.color).toBe('green');
  });

  it('should dispose of Three.js objects after unmount', async () => {
    renderer = await ReactThreeTestRenderer.create(<Box color="red" />);
    const mesh = renderer.scene.children[0].instance as THREE.Mesh;
    const geometry = mesh.geometry;
    const material = mesh.material as THREE.Material;

    const geometryDisposeSpy = vi.spyOn(geometry, 'dispose');
    const materialDisposeSpy = vi.spyOn(material, 'dispose');

    renderer.unmount();

    expect(geometryDisposeSpy).toHaveBeenCalled();
    expect(materialDisposeSpy).toHaveBeenCalled();
  });
});
```

### Testing Hooks (`useThree`, `useFrame`, etc.)

Testing hooks that interact with the R3F canvas (`useThree`, `useFrame`, `useLoader`) requires wrapping them in a component that is then rendered by `ReactThreeTestRenderer`.

```tsx
// src/features/3d-renderer/hooks/use-custom-camera.ts
import { useThree, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export const useCustomCamera = () => {
  const { camera } = useThree();
  const rotationSpeed = useRef(0.01);

  useFrame(() => {
    // Example: Rotate camera around a point
    camera.position.x = Math.sin(rotationSpeed.current) * 10;
    camera.position.z = Math.cos(rotationSpeed.current) * 10;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    rotationSpeed.current += 0.01;
  });

  return { camera };
};

// src/features/3d-renderer/hooks/use-custom-camera.test.tsx
import { describe, it, expect, vi } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { useCustomCamera } from './use-custom-camera.js';
import React from 'react';
import * as THREE from 'three';

describe('useCustomCamera hook', () => {
  it('should update camera position and lookAt target on each frame', async () => {
    const initialCameraPosition = new THREE.Vector3(0, 0, 0);
    const initialCameraTarget = new THREE.Vector3(0, 0, 0);

    // Mock the useThree hook's return value
    const mockCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    mockCamera.position.copy(initialCameraPosition);
    mockCamera.lookAt(initialCameraTarget);

    // Create a test component that uses the hook
    const TestComponent: React.FC = () => {
      useCustomCamera();
      return null;
    };

    // Render the test component within the R3F test renderer
    const renderer = await ReactThreeTestRenderer.create(<TestComponent />, {
      // Provide a mock camera to the R3F context
      // This is a rare case where mocking is acceptable for R3F internal state
      // as we are testing the hook's logic, not the R3F setup itself.
      // However, prefer to use the actual R3F context if possible.
      // For useThree, the test renderer provides a default context.
      // We can spy on the camera methods.
      camera: mockCamera,
    });

    // Spy on camera methods to check if they are called
    const setPositionSpy = vi.spyOn(mockCamera.position, 'set');
    const lookAtSpy = vi.spyOn(mockCamera, 'lookAt');

    // Simulate a few frames
    renderer.advanceFrames(1);
    expect(setPositionSpy).toHaveBeenCalled();
    expect(lookAtSpy).toHaveBeenCalledWith(new THREE.Vector3(0, 0, 0));

    setPositionSpy.mockClear();
    lookAtSpy.mockClear();

    renderer.advanceFrames(1);
    expect(setPositionSpy).toHaveBeenCalled();
    expect(lookAtSpy).toHaveBeenCalledWith(new THREE.Vector3(0, 0, 0));

    renderer.unmount();
  });
});
```

### Testing Components with External Data (e.g., from Zustand Store)

When your R3F components are connected to a state management solution like Zustand, you'll need to ensure your tests provide the necessary context or mock the store's behavior.

```tsx
// src/features/3d-renderer/components/store-connected-box.tsx
import React from 'react';
import { useAppStore } from '../../store/app-store.js';
import { selectConfigTheme } from '../../store/selectors/store.selectors.js';

export const StoreConnectedBox: React.FC = () => {
  const theme = useAppStore(selectConfigTheme);
  const color = theme === 'dark' ? 'black' : 'white';

  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// src/features/3d-renderer/components/store-connected-box.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { StoreConnectedBox } from './store-connected-box.js';
import React from 'react';
import { useAppStore } from '../../store/app-store.js';

describe('StoreConnectedBox component', () => {
  let renderer: ReactThreeTestRenderer.Renderer | null = null;

  beforeEach(() => {
    // Reset Zustand store to a known state before each test
    useAppStore.setState({
      config: { theme: 'dark' },
      // ... other initial state for other slices if needed
    } as any); // Use 'as any' or define a partial state type if not all state is provided
  });

  afterEach(() => {
    if (renderer) {
      renderer.unmount();
      renderer = null;
    }
    vi.restoreAllMocks(); // Clean up any spies/mocks
  });

  it('should render a black box when theme is dark', async () => {
    renderer = await ReactThreeTestRenderer.create(<StoreConnectedBox />);

    const material = renderer.scene.children[0].children[1];
    expect(material.props.color).toBe('black');
  });

  it('should render a white box when theme is light', async () => {
    // Update the store state to 'light' theme
    useAppStore.setState((state) => ({
      config: { ...state.config, theme: 'light' },
    }));

    renderer = await ReactThreeTestRenderer.create(<StoreConnectedBox />);

    const material = renderer.scene.children[0].children[1];
    expect(material.props.color).toBe('white');
  });
});
```

### Testing Components with `useLoader`

`useLoader` is an R3F hook for loading external assets. When testing, you often want to mock the actual loading process to make tests fast and deterministic.

```tsx
// src/features/3d-renderer/components/gltf-model.tsx
import React from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface GLTFModelProps {
  url: string;
}

export const GLTFModel: React.FC<GLTFModelProps> = ({ url }) => {
  const gltf = useLoader(GLTFLoader, url);
  return <primitive object={gltf.scene} />;
};

// src/features/3d-renderer/components/gltf-model.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { GLTFModel } from './gltf-model.js';
import React from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

describe('GLTFModel component', () => {
  let renderer: ReactThreeTestRenderer.Renderer | null = null;

  beforeEach(() => {
    // Mock the GLTFLoader's load method
    vi.spyOn(GLTFLoader.prototype, 'load').mockImplementation((url, onLoad, onProgress, onError) => {
      // Simulate a simple GLTF scene structure
      const mockScene = new THREE.Group();
      mockScene.name = 'mock-gltf-scene';
      const mockMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
      mockMesh.name = 'mock-gltf-mesh';
      mockScene.add(mockMesh);

      onLoad({ scene: mockScene } as any); // Cast to any to satisfy type checking for mock
      return {} as any; // Return a mock XHR object
    });
  });

  afterEach(() => {
    if (renderer) {
      renderer.unmount();
      renderer = null;
    }
    vi.restoreAllMocks(); // Restore the original GLTFLoader.load method
  });

  it('should load and render the GLTF model scene', async () => {
    renderer = await ReactThreeTestRenderer.create(<GLTFModel url="/path/to/model.gltf" />);

    // Assert that the primitive object is the mock scene
    const primitive = renderer.scene.children[0];
    expect(primitive.type).toBe('Group'); // GLTF scene is typically a Group
    expect(primitive.instance.name).toBe('mock-gltf-scene');
    expect(primitive.children[0].instance.name).toBe('mock-gltf-mesh');
  });
});
```

## 2. End-to-End Testing with Playwright

For testing visual output, animations, and complex user interactions (like mouse clicks and drags) that require a real browser environment, you should use E2E tests with Playwright. This method runs your application in a real browser, allowing you to take screenshots and programmatically interact with the canvas to verify that the component behaves and looks exactly as expected.

### When to use Playwright for R3F testing:

- **Visual Regression Testing:** Ensure your 3D models render correctly across different browsers and don't change unexpectedly.
- **Interaction Testing:** Test user interactions like dragging, zooming, rotating the camera, or clicking on 3D objects.
- **Performance Testing:** Measure actual rendering performance in a browser.
- **Integration with Backend:** If your 3D scene depends on data fetched from a backend, Playwright can test the full integration.

### Basic Playwright Setup (Example)

Assuming you have Playwright configured (e.g., `playwright.config.ts`):

```typescript
// tests/e2e/3d-scene.spec.ts
import { test, expect } from '@playwright/test';

test.describe('3D Scene Rendering', () => {
  test('should render the default cube correctly', async ({ page }) => {
    await page.goto('/'); // Navigate to your application's root URL

    // Wait for the canvas to be visible and potentially for the 3D scene to load
    await expect(page.locator('canvas')).toBeVisible();

    // Take a screenshot of the canvas or the entire page
    // This is crucial for visual regression testing
    await expect(page.locator('canvas')).toHaveScreenshot('default-cube.png', {
      maxDiffPixelRatio: 0.01, // Allow a small pixel difference
    });
  });

  test('should allow camera interaction (zoom in)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible();

    // Simulate mouse wheel scroll to zoom in
    await page.locator('canvas').hover();
    await page.mouse.wheel(0, -500); // Scroll down to zoom in

    // Take a screenshot after interaction
    await expect(page.locator('canvas')).toHaveScreenshot('zoomed-cube.png', {
      maxDiffPixelRatio: 0.05, // More tolerance for interaction-based changes
    });
  });

  test('should display error message for invalid OpenSCAD code', async ({ page }) => {
    await page.goto('/');

    // Type invalid OpenSCAD code into the editor (assuming an editor element exists)
    await page.locator('.monaco-editor textarea').fill('cube([10,10,10'); // Missing bracket

    // Expect an error message to appear in the UI
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-display"]')).toContainText('Failed to parse AST');
  });
});
```

### Tips for Playwright with R3F:

- **Selectors:** Target your canvas element or specific UI elements that interact with the 3D scene using reliable Playwright selectors.
- **Waiting:** Use `page.waitForSelector()`, `page.waitForLoadState('networkidle')`, or custom `page.waitForFunction()` to ensure the 3D scene has loaded and rendered before taking screenshots or interacting.
- **Mocking APIs:** For complex scenarios, you can mock network requests in Playwright to control data fetched by your R3F components (e.g., `page.route('**/model.gltf', route => route.fulfill({ path: './tests/fixtures/mock-model.gltf' }))`).
- **Visual Regression:** Playwright's `toHaveScreenshot()` is powerful. Store golden screenshots and compare against them in CI/CD pipelines.

## 3. Hybrid Testing Strategy (Recommended)

For most R3F projects, a hybrid approach is best:

- **Unit/Integration Tests (`@react-three/test-renderer`):** Use for isolated component logic, prop validation, and scene graph structure. These are fast and run in a Node.js environment.
- **E2E Tests (Playwright):** Use for critical visual checks, complex user interactions, and full application flow testing in a real browser. These are slower but provide high confidence.

By combining these strategies, you can achieve comprehensive test coverage for your `@react-three/fiber` applications.
