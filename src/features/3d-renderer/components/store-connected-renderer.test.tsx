/**
 * Store-Connected Renderer Component Tests (Simplified)
 *
 * Simplified tests that avoid complex mocking to prevent infinite loops.
 * Based on Zustand testing best practices and community recommendations.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { StoreConnectedRenderer } from './store-connected-renderer';

// Simple, stable mocks to prevent infinite loops
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
}));

vi.mock('@react-three/drei', () => ({
  Stats: () => <div data-testid="stats" />,
}));

vi.mock('./r3f-scene', () => ({
  R3FScene: () => <div data-testid="r3f-scene" />,
}));

// Create stable constants outside of mocks to prevent reference changes
const STABLE_EMPTY_ARRAY: any[] = [];
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
      return () => {}; // Stable no-op function
    }
    return STABLE_EMPTY_ARRAY;
  }),
}));

describe('StoreConnectedRenderer', () => {
  it('should render without crashing', () => {
    render(<StoreConnectedRenderer />);

    expect(screen.getByTestId('store-connected-renderer')).toBeInTheDocument();
  });

  it('should render R3F canvas', () => {
    render(<StoreConnectedRenderer />);

    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
  });

  it('should render R3F scene component', () => {
    render(<StoreConnectedRenderer />);

    expect(screen.getByTestId('r3f-scene')).toBeInTheDocument();
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

    expect(screen.getByTestId('stats')).toBeInTheDocument();

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
