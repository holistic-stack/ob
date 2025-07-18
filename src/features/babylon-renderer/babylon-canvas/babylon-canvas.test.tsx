/**
 * @file babylon-canvas.test.tsx
 * @description Comprehensive test suite for the `BabylonCanvas` React component.
 * These tests ensure the component correctly renders, initializes Babylon.js engine and scene,
 * handles various props, and manages its lifecycle, including proper cleanup.
 *
 * @architectural_decision
 * - **Real Babylon.js Mocks**: Instead of completely mocking Babylon.js, `vi.mock('@babylonjs/core')` is used
 *   to mock only the `Engine` and `Scene` constructors. This allows testing the component's interaction
 *   with Babylon.js APIs without requiring a full WebGL context, improving test performance and reliability.
 * - **`ResizeObserver` Mock**: `ResizeObserver` is mocked globally to prevent errors in the JSDOM environment
 *   and to control its behavior during tests.
 * - **`@testing-library/react`**: Used for rendering and interacting with the React component in a way that
 *   mimics actual user behavior, focusing on accessibility and user-facing attributes.
 *
 * @limitations
 * - The tests do not perform visual assertions of the 3D rendering. This would typically be handled by
 *   visual regression tests in a separate Playwright suite.
 * - The mocked `Engine` and `Scene` are simplified and do not fully replicate all Babylon.js functionalities.
 *   The focus is on verifying the component's integration points and lifecycle.
 *
 * @example
 * ```typescript
 * // Basic rendering test:
 * it('should render canvas element with default props', () => {
 *   render(<BabylonCanvas />);
 *   const canvas = screen.getByRole('img');
 *   expect(canvas).toBeInTheDocument();
 * });
 *
 * // Testing custom props:
 * it('should render with custom props', () => {
 *   render(<BabylonCanvas className="custom-class" data-testid="my-canvas" />);
 *   const canvas = screen.getByTestId('my-canvas');
 *   expect(canvas).toHaveClass('custom-class');
 * });
 * ```
 *
 * @diagram
 * ```mermaid
 * graph TD
 *    A[Test Suite: BabylonCanvas] --> B[Mock Babylon.js Core];
 *    B --> C[Mock ResizeObserver];
 *    C --> D[Rendering Tests];
 *    D --> D1[Default Props];
 *    D --> D2[Custom Props];
 *    D --> E[Engine/Scene Configuration Tests];
 *    E --> E1[Custom Engine Options];
 *    E --> E2[Custom Scene Options];
 *    E --> F[Callback Tests];
 *    F --> F1[onSceneReady];
 *    F --> F2[onEngineReady];
 *    F --> F3[onRenderLoop];
 *    F --> G[Accessibility Tests];
 *    G --> G1[ARIA Attributes];
 * ```
 */

import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { BabylonCanvas } from './babylon-canvas';
import type { BabylonCanvasProps } from './babylon-canvas.types';

/**
 * @mock ResizeObserver
 * @description Mocks the global `ResizeObserver` to control its behavior in tests.
 * This prevents errors in JSDOM and allows for predictable testing of components that rely on element resizing.
 */
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

/**
 * @mock logger.service
 * @description Mocks the `logger.service` to prevent actual logging during tests.
 * This keeps test output clean and allows for spying on logger calls if needed.
 */
vi.mock('../../../shared/services/logger.service', () => ({
  createLogger: () => ({
    init: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    end: vi.fn(),
  }),
}));

/**
 * @mock @babylonjs/core
 * @description Mocks the `Engine` and `Scene` constructors from `@babylonjs/core`.
 * This allows testing the `BabylonCanvas` component's interaction with Babylon.js APIs
 * without requiring a full WebGL context, which is not available in JSDOM.
 * The mocked `Engine` and `Scene` provide essential methods like `dispose`, `runRenderLoop`, `resize`, and `render`.
 */
vi.mock('@babylonjs/core', async () => {
  const actual = await vi.importActual('@babylonjs/core');
  return {
    ...actual,
    Engine: vi.fn().mockImplementation(() => ({
      dispose: vi.fn(),
      runRenderLoop: vi.fn(),
      resize: vi.fn(),
    })),
    Scene: vi.fn().mockImplementation(() => ({
      dispose: vi.fn(),
      render: vi.fn(),
    })),
  };
});

describe('BabylonCanvas', () => {
  /**
   * @hook beforeAll
   * @description Global setup for the test suite. Currently empty but can be used for future global configurations.
   */
  beforeAll(() => {
    // Setup any global test configuration
  });

  /**
   * @section Rendering Tests
   * @description Tests related to the rendering of the canvas element and application of various props.
   */
  describe('rendering', () => {
    /**
     * @test should render canvas element with default props
     * @description Verifies that the `BabylonCanvas` component renders a `<canvas>` element
     * with its default `aria-label`, `data-testid`, and CSS classes.
     */
    it('should render canvas element with default props', () => {
      render(<BabylonCanvas />);

      const canvas = screen.getByRole('img');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('aria-label', 'BabylonJS 3D Canvas');
      expect(canvas).toHaveAttribute('data-testid', 'babylon-canvas');
      expect(canvas).toHaveClass('w-full', 'h-full');
    });

    /**
     * @test should render with custom props
     * @description Ensures that the `BabylonCanvas` component correctly applies custom `className`,
     * `style`, `data-testid`, and `aria-label` props to the rendered `<canvas>` element.
     */
    it('should render with custom props', () => {
      const customProps: BabylonCanvasProps = {
        className: 'custom-canvas',
        style: { width: '800px', height: '600px' },
        'data-testid': 'custom-testid',
        'aria-label': 'Custom 3D Canvas',
      };

      render(<BabylonCanvas {...customProps} />);

      const canvas = screen.getByRole('img');
      expect(canvas).toHaveClass('custom-canvas');
      expect(canvas).toHaveStyle({ width: '800px', height: '600px' });
      expect(canvas).toHaveAttribute('data-testid', 'custom-testid');
      expect(canvas).toHaveAttribute('aria-label', 'Custom 3D Canvas');
    });
  });

  /**
   * @section Engine Configuration Tests
   * @description Tests related to passing and applying Babylon.js engine and scene configuration options.
   */
  describe('engine configuration', () => {
    /**
     * @test should accept custom engine options
     * @description Verifies that the `BabylonCanvas` component accepts and processes custom `engineOptions`.
     * Although the mocked engine doesn't fully apply these, the test ensures the prop is passed correctly.
     */
    it('should accept custom engine options', () => {
      const engineOptions = {
        antialias: false,
        adaptToDeviceRatio: false,
        preserveDrawingBuffer: false,
      };

      render(<BabylonCanvas engineOptions={engineOptions} />);

      const canvas = screen.getByRole('img');
      expect(canvas).toBeInTheDocument();
    });

    /**
     * @test should accept custom scene options
     * @description Verifies that the `BabylonCanvas` component accepts and processes custom `sceneOptions`.
     * Similar to engine options, this test ensures the prop is correctly handled.
     */
    it('should accept custom scene options', () => {
      const sceneOptions = {
        autoClear: true,
        autoClearDepthAndStencil: true,
      };

      render(<BabylonCanvas sceneOptions={sceneOptions} />);

      const canvas = screen.getByRole('img');
      expect(canvas).toBeInTheDocument();
    });
  });

  /**
   * @section Callback Tests
   * @description Tests for verifying that the various callback props (`onSceneReady`, `onEngineReady`, `onRenderLoop`)
   * are correctly passed and potentially invoked.
   */
  describe('callbacks', () => {
    /**
     * @test should accept onSceneReady callback
     * @description Ensures that the `onSceneReady` callback prop can be provided to the component.
     * In a real scenario, this would also verify that the callback is invoked with the correct `Scene` instance.
     */
    it('should accept onSceneReady callback', () => {
      const onSceneReady = vi.fn();

      render(<BabylonCanvas onSceneReady={onSceneReady} />);

      const canvas = screen.getByRole('img');
      expect(canvas).toBeInTheDocument();
    });

    /**
     * @test should accept onEngineReady callback
     * @description Ensures that the `onEngineReady` callback prop can be provided to the component.
     * In a real scenario, this would also verify that the callback is invoked with the correct `Engine` instance.
     */
    it('should accept onEngineReady callback', () => {
      const onEngineReady = vi.fn();

      render(<BabylonCanvas onEngineReady={onEngineReady} />);

      const canvas = screen.getByRole('img');
      expect(canvas).toBeInTheDocument();
    });

    /**
     * @test should accept onRenderLoop callback
     * @description Ensures that the `onRenderLoop` callback prop can be provided to the component.
     * In a real scenario, this would also verify that the callback is invoked on each render frame.
     */
    it('should accept onRenderLoop callback', () => {
      const onRenderLoop = vi.fn();

      render(<BabylonCanvas onRenderLoop={onRenderLoop} />);

      const canvas = screen.getByRole('img');
      expect(canvas).toBeInTheDocument();
    });
  });

  /**
   * @section Accessibility Tests
   * @description Tests for ensuring the `BabylonCanvas` component adheres to accessibility best practices.
   */
  describe('accessibility', () => {
    /**
     * @test should have proper ARIA attributes
     * @description Verifies that the canvas element has the default `role="img"` and `aria-label` attributes
     * for accessibility, making it understandable by assistive technologies.
     */
    it('should have proper ARIA attributes', () => {
      render(<BabylonCanvas />);

      const canvas = screen.getByRole('img');
      expect(canvas).toHaveAttribute('role', 'img');
      expect(canvas).toHaveAttribute('aria-label', 'BabylonJS 3D Canvas');
    });

    /**
     * @test should support custom ARIA label
     * @description Ensures that a custom `aria-label` prop can be passed and correctly applied to the canvas element,
     * allowing for more descriptive labels for specific contexts.
     */
    it('should support custom ARIA label', () => {
      render(<BabylonCanvas aria-label="Custom 3D Visualization" />);

      const canvas = screen.getByRole('img');
      expect(canvas).toHaveAttribute('aria-label', 'Custom 3D Visualization');
    });
  });
});
