/**
 * Store-Connected Renderer Component Tests (Simplified)
 *
 * Simplified tests that avoid complex mocking to prevent infinite loops.
 * Based on Zustand testing best practices and community recommendations.
 * Enhanced with comprehensive browser environment mocking to remove userAgent dependencies.
 */

import { cleanup, render, screen } from '@testing-library/react';

import type React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';

import { StoreConnectedRenderer } from './store-connected-renderer';

// Mock ResizeObserver before any imports that might use it
Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation((callback) => ({
    observe: vi.fn((element) => {
      // Simulate a resize event immediately
      setTimeout(() => {
        callback([{
          target: element,
          contentRect: {
            width: 800,
            height: 600,
            top: 0,
            left: 0,
            bottom: 600,
            right: 800,
          },
          borderBoxSize: [{ inlineSize: 800, blockSize: 600 }],
          contentBoxSize: [{ inlineSize: 800, blockSize: 600 }],
          devicePixelContentBoxSize: [{ inlineSize: 800, blockSize: 600 }],
        }], this);
      }, 0);
    }),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

// Comprehensive browser environment mocking to remove userAgent dependencies
beforeAll(() => {
  // Mock WebGL context to avoid browser-specific checks
  const mockWebGLContext = {
    canvas: {},
    drawingBufferWidth: 800,
    drawingBufferHeight: 600,
    getExtension: vi.fn(() => null),
    getParameter: vi.fn(() => null),
    getShaderPrecisionFormat: vi.fn(() => ({ precision: 23, rangeMin: 127, rangeMax: 127 })),
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    useProgram: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    drawArrays: vi.fn(),
    viewport: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    depthFunc: vi.fn(),
    blendFunc: vi.fn(),
  };

  // Mock HTMLCanvasElement.getContext to return our mock WebGL context
  HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
    if (
      contextType === 'webgl' ||
      contextType === 'webgl2' ||
      contextType === 'experimental-webgl'
    ) {
      return mockWebGLContext;
    }
    return null;
  });

  // Mock navigator to remove userAgent dependencies
  Object.defineProperty(global, 'navigator', {
    value: {
      userAgent: 'test-environment',
      platform: 'test',
      vendor: 'test',
      hardwareConcurrency: 4,
      deviceMemory: 8,
      webdriver: false,
    },
    writable: true,
  });

  // Mock window properties that might be checked
  Object.defineProperty(global, 'window', {
    value: {
      innerWidth: 1024,
      innerHeight: 768,
      devicePixelRatio: 1,
      WebGLRenderingContext: mockWebGLContext.constructor,
      WebGL2RenderingContext: mockWebGLContext.constructor,
    },
    writable: true,
  });
});

// Simple, stable mocks to prevent infinite loops
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useThree: vi.fn(() => ({
    scene: { add: vi.fn(), remove: vi.fn(), children: [] },
    camera: { position: { set: vi.fn() }, lookAt: vi.fn() },
    gl: { domElement: document.createElement('canvas') },
  })),
}));

vi.mock('@react-three/drei', () => ({
  Stats: () => <div data-testid="stats" />,
  OrbitControls: () => <div data-testid="orbit-controls" />,
}));

vi.mock('./r3f-scene', () => ({
  R3FScene: () => <div data-testid="r3f-scene" />,
}));

// Create stable constants outside of mocks to prevent reference changes
const STABLE_EMPTY_ARRAY: readonly ASTNode[] = [];
const STABLE_CAMERA = {
  position: [5, 5, 5] as const,
  target: [0, 0, 0] as const,
  zoom: 1,
  fov: 75,
  near: 0.1,
  far: 1000,
  enableControls: true,
  enableAutoRotate: false,
  autoRotateSpeed: 1,
};
const STABLE_RENDERING_STATE = {
  meshes: [],
  isRendering: false,
  renderErrors: [],
  lastRendered: null,
  renderTime: 0,
  camera: STABLE_CAMERA,
};
const STABLE_METRICS = {
  renderTime: 0,
  parseTime: 0,
  memoryUsage: 0,
  frameRate: 60,
};

// Mock store with stable values only (no changing functions)
vi.mock('../../store', () => ({
  useAppStore: vi.fn((selector) => {
    // Return stable values based on selector type
    if (typeof selector === 'function') {
      // For selector functions, return stable values
      const selectorStr = selector.toString();
      if (selectorStr.includes('selectParsingAST')) return STABLE_EMPTY_ARRAY;
      if (selectorStr.includes('selectRenderingCamera')) return STABLE_CAMERA;
      if (selectorStr.includes('selectRenderingState')) return STABLE_RENDERING_STATE;
      if (selectorStr.includes('selectPerformanceMetrics')) return STABLE_METRICS;
      if (selectorStr.includes('selectConfigEnableRealTimeRendering')) return true;

      // For action selectors, return stable no-op functions
      return () => {
        /* no-op */
      }; // Stable no-op function
    }
    return STABLE_EMPTY_ARRAY;
  }),
}));

describe('StoreConnectedRenderer', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render without crashing', () => {
    render(<StoreConnectedRenderer />);

    expect(screen.getByTestId('store-connected-renderer')).toBeInTheDocument();
  });

  it('should render R3F canvas', () => {
    render(<StoreConnectedRenderer />);

    expect(screen.getAllByTestId('r3f-canvas')).toHaveLength(1);
  });

  it('should render R3F scene component', () => {
    render(<StoreConnectedRenderer />);

    expect(screen.getAllByTestId('r3f-scene')).toHaveLength(1);
  });

  it('should apply custom props correctly', () => {
    render(
      <StoreConnectedRenderer
        className="custom-class"
        data-testid="custom-renderer"
        width={1024}
        height={768}
      />
    );

    const renderer = screen.getByTestId('custom-renderer');
    expect(renderer).toBeInTheDocument();
    expect(renderer).toHaveClass('custom-class');
    expect(renderer).toHaveStyle({ width: '1024px', height: '768px' });
  });

  it('should render stats in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(<StoreConnectedRenderer />);

    expect(screen.getAllByTestId('stats')).toHaveLength(1);

    process.env.NODE_ENV = originalEnv;
  });

  it('should not render stats in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(<StoreConnectedRenderer />);

    expect(screen.queryByTestId('stats')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});
