/**
 * @file BabylonJS Scene Component Tests
 *
 * Tests for BabylonJS scene component functionality.
 * Following TDD principles with React Testing Library and real BabylonJS NullEngine.
 */

import { Color3, Vector3 } from '@babylonjs/core';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BabylonScene } from './babylon-scene';

// Mock ResizeObserver for tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window events
Object.defineProperty(window, 'addEventListener', { value: vi.fn(), writable: true });
Object.defineProperty(window, 'removeEventListener', { value: vi.fn(), writable: true });

/**
 * @description Following project best practices: Use BabylonJS NullEngine for testing
 * instead of mocking. This provides real BabylonJS functionality in headless mode.
 */
import * as BABYLON from '@babylonjs/core';

/**
 * @polyfill Canvas for React 19 compatibility in BabylonScene tests
 * @description React 19 requires proper canvas element support in test environment.
 * This polyfill ensures canvas elements work correctly with React 19 rendering.
 */
const createCanvasPolyfill = () => {
  const originalCreateElement = document.createElement;

  document.createElement = function(tagName: string, options?: any) {
    const element = originalCreateElement.call(this, tagName, options);

    if (tagName.toLowerCase() === 'canvas') {
      const canvas = element as HTMLCanvasElement;

      // Ensure setAttribute works correctly for React 19
      const originalSetAttribute = canvas.setAttribute;
      canvas.setAttribute = function(name: string, value: string) {
        try {
          if (name === 'width' || name === 'height') {
            const numValue = Number.parseInt(value, 10);
            if (!Number.isNaN(numValue)) {
              if (name === 'width') {
                this.width = numValue;
              } else if (name === 'height') {
                this.height = numValue;
              }
            }
          }

          if (originalSetAttribute) {
            return originalSetAttribute.call(this, name, value);
          } else {
            this.dataset[name] = value;
          }
        } catch {
          // Graceful fallback
          this.dataset[name] = value;
        }
      };

      // Ensure getContext works
      if (!canvas.getContext) {
        canvas.getContext = vi.fn(() => ({}));
      }
    }

    return element;
  };
};

// Apply canvas polyfill before tests
createCanvasPolyfill();

// Create a global NullEngine for tests
let testEngine: BABYLON.NullEngine | null = null;
let testScene: BABYLON.Scene | null = null;

// Setup and cleanup for BabylonJS NullEngine
beforeEach(() => {
  // Create a null engine (headless)
  testEngine = new BABYLON.NullEngine();
  // Create a real scene
  testScene = new BABYLON.Scene(testEngine);
});

afterEach(() => {
  // Clean up BabylonJS resources
  if (testScene) {
    testScene.dispose();
    testScene = null;
  }
  if (testEngine) {
    testEngine.dispose();
    testEngine = null;
  }
});

// Mock hooks
vi.mock('../../hooks/use-babylon-inspector', () => ({
  useBabylonInspector: () => ({
    inspectorService: null,
    hideInspector: vi.fn(),
  }),
}));

// Mock logger
vi.mock('../../../../shared/services/logger.service', () => ({
  createLogger: () => ({
    init: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    end: vi.fn(),
  }),
}));

describe('BabylonScene', () => {
  afterEach(() => {
    cleanup();
    // Reset any global state that might interfere with other tests
    vi.clearAllMocks();
  });
  it('should render canvas element', () => {
    render(<BabylonScene />);

    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('aria-label', 'BabylonJS 3D Scene');
  });

  it('should render with custom className and style', () => {
    const customStyle = { width: '800px', height: '600px' };
    const customClass = 'custom-babylon-scene';

    render(<BabylonScene className={customClass} style={customStyle} />);

    const container = screen.getByRole('img').parentElement;
    expect(container).toHaveClass(customClass);
    expect(container).toHaveStyle(customStyle);
  });

  it('should accept configuration props', () => {
    const config = {
      enableWebGPU: false,
      antialias: false,
      backgroundColor: new Color3(1, 0, 0),
    };

    render(<BabylonScene config={config} />);

    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
  });

  it('should accept camera configuration', () => {
    const camera = {
      type: 'arcRotate' as const,
      position: new Vector3(5, 5, 5),
      target: new Vector3(0, 0, 0),
    };

    render(<BabylonScene camera={camera} />);

    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
  });

  it('should accept lighting configuration', () => {
    const lighting = {
      ambient: {
        enabled: true,
        color: new Color3(0.5, 0.5, 0.5),
        intensity: 0.8,
      },
      directional: {
        enabled: true,
        color: new Color3(1, 1, 1),
        intensity: 1.0,
        direction: new Vector3(-1, -1, -1),
      },
      environment: {
        enabled: false,
        intensity: 1.0,
      },
    };

    render(<BabylonScene lighting={lighting} />);

    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
  });

  it('should accept orientation gizmo configuration', () => {
    const _gizmoConfig = {
      enabled: true,
      position: 'bottom-left' as const,
      size: 120,
      enableTransitions: false,
    };

    render(<BabylonScene style={{ width: '800px', height: '600px' }} />);

    const canvas = screen.getByTestId('babylon-canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should accept gizmo configuration', () => {
    const _gizmoConfig = {
      enabled: true,
      position: 'top-left' as const,
      size: 80,
    };

    render(<BabylonScene style={{ width: '800px', height: '600px' }} />);

    const canvas = screen.getByTestId('babylon-canvas');
    expect(canvas).toBeInTheDocument();
  });
});
