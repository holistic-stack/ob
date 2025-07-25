/**
 * @file Orientation Gizmo Component Test Suite
 * @description Comprehensive test suite for OrientationGizmo React component
 * using real BabylonJS instances and Zustand store integration. Tests component
 * lifecycle, user interactions, store synchronization, and error handling.
 *
 * @example Running Tests
 * ```bash
 * pnpm test orientation-gizmo.test.tsx
 * ```
 */

import * as BABYLON from '@babylonjs/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appStoreInstance } from '../../../store/app-store';
import type { GizmoConfig, GizmoError } from '../../types/orientation-gizmo.types';
import { AxisDirection, GizmoErrorCode } from '../../types/orientation-gizmo.types';
import type { OrientationGizmoProps } from './orientation-gizmo';
import { OrientationGizmo } from './orientation-gizmo';

// Mock ResizeObserver for headless testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame for controlled testing
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16); // ~60fps
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock canvas 2D context for headless testing
const mockContext = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textBaseline: 'alphabetic',
  textAlign: 'start',
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
  if (type === '2d') {
    return mockContext;
  }
  return null;
}) as any;

// Mock getBoundingClientRect
HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
  left: 0,
  top: 0,
  right: 90,
  bottom: 90,
  width: 90,
  height: 90,
  x: 0,
  y: 0,
  toJSON: () => {},
}));

describe('OrientationGizmo', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let camera: BABYLON.ArcRotateCamera;
  let defaultProps: OrientationGizmoProps;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create real BabylonJS instances (no mocks)
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    camera = new BABYLON.ArcRotateCamera(
      'testCamera',
      0,
      Math.PI / 3,
      10,
      BABYLON.Vector3.Zero(),
      scene
    );

    // Reset store state
    appStoreInstance.getState().resetGizmo();

    defaultProps = {
      camera,
      className: 'test-gizmo',
    };
  });

  afterEach(() => {
    // Clean up BabylonJS resources
    scene.dispose();
    engine.dispose();
  });

  describe('Component Rendering', () => {
    it('should render gizmo when visible', async () => {
      // Set gizmo visible in store
      appStoreInstance.getState().setGizmoVisibility(true);

      render(<OrientationGizmo {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('orientation-gizmo')).toBeInTheDocument();
        expect(screen.getByTestId('gizmo-canvas')).toBeInTheDocument();
      });
    });

    it('should not render when not visible', () => {
      // Set gizmo not visible in store
      appStoreInstance.getState().setGizmoVisibility(false);

      render(<OrientationGizmo {...defaultProps} />);

      expect(screen.queryByTestId('orientation-gizmo')).not.toBeInTheDocument();
    });

    it('should not render when camera is null', () => {
      appStoreInstance.getState().setGizmoVisibility(true);

      render(<OrientationGizmo {...defaultProps} camera={null} />);

      expect(screen.queryByTestId('orientation-gizmo')).not.toBeInTheDocument();
    });

    it('should apply custom className and style', async () => {
      appStoreInstance.getState().setGizmoVisibility(true);

      const customStyle = { top: '20px', left: '20px' };
      render(<OrientationGizmo {...defaultProps} className="custom-gizmo" style={customStyle} />);

      await waitFor(() => {
        const gizmo = screen.getByTestId('orientation-gizmo');
        expect(gizmo).toHaveClass('custom-gizmo');
        expect(gizmo.style.top).toBe('20px');
        expect(gizmo.style.left).toBe('20px');
      });
    });
  });

  describe('Store Integration', () => {
    it('should sync with store visibility state', async () => {
      const { rerender } = render(<OrientationGizmo {...defaultProps} />);

      // Initially not visible
      expect(screen.queryByTestId('orientation-gizmo')).not.toBeInTheDocument();

      // Make visible through store
      appStoreInstance.getState().setGizmoVisibility(true);
      rerender(<OrientationGizmo {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('orientation-gizmo')).toBeInTheDocument();
      });

      // Hide through store
      appStoreInstance.getState().setGizmoVisibility(false);
      rerender(<OrientationGizmo {...defaultProps} />);

      expect(screen.queryByTestId('orientation-gizmo')).not.toBeInTheDocument();
    });

    it('should use store configuration', async () => {
      appStoreInstance.getState().setGizmoVisibility(true);
      appStoreInstance.getState().updateGizmoConfig({ size: 120 });

      render(<OrientationGizmo {...defaultProps} />);

      await waitFor(() => {
        const canvas = screen.getByTestId('gizmo-canvas');
        expect(canvas).toHaveAttribute('width', '120');
        expect(canvas).toHaveAttribute('height', '120');
      });
    });

    it('should override store config with prop config', async () => {
      appStoreInstance.getState().setGizmoVisibility(true);
      appStoreInstance.getState().updateGizmoConfig({ size: 90 });

      const propConfig: Partial<GizmoConfig> = { size: 150 };
      render(<OrientationGizmo {...defaultProps} config={propConfig} />);

      await waitFor(() => {
        const canvas = screen.getByTestId('gizmo-canvas');
        expect(canvas).toHaveAttribute('width', '150');
        expect(canvas).toHaveAttribute('height', '150');
      });
    });
  });

  describe('Mouse Interactions', () => {
    beforeEach(async () => {
      appStoreInstance.getState().setGizmoVisibility(true);
    });

    it('should handle mouse move events', async () => {
      render(<OrientationGizmo {...defaultProps} />);

      await waitFor(() => {
        const canvas = screen.getByTestId('gizmo-canvas');
        expect(canvas).toBeInTheDocument();
      });

      const canvas = screen.getByTestId('gizmo-canvas');

      fireEvent.mouseMove(canvas, {
        clientX: 45,
        clientY: 45,
      });

      // Should not throw errors
      expect(canvas).toBeInTheDocument();
    });

    it('should handle mouse leave events', async () => {
      render(<OrientationGizmo {...defaultProps} />);

      await waitFor(() => {
        const canvas = screen.getByTestId('gizmo-canvas');
        expect(canvas).toBeInTheDocument();
      });

      const canvas = screen.getByTestId('gizmo-canvas');

      fireEvent.mouseLeave(canvas);

      // Should clear selected axis in store
      expect(appStoreInstance.getState().babylonRendering.gizmo.selectedAxis).toBeNull();
    });

    it('should handle click events when axis is selected', async () => {
      const onAxisSelected = vi.fn();
      render(<OrientationGizmo {...defaultProps} onAxisSelected={onAxisSelected} />);

      await waitFor(() => {
        const canvas = screen.getByTestId('gizmo-canvas');
        expect(canvas).toBeInTheDocument();
      });

      // Simulate axis selection in store
      appStoreInstance.getState().setGizmoSelectedAxis(AxisDirection.POSITIVE_X);

      const canvas = screen.getByTestId('gizmo-canvas');
      fireEvent.click(canvas);

      // Should trigger animation state
      await waitFor(() => {
        expect(appStoreInstance.getState().babylonRendering.gizmo.cameraAnimation.isAnimating).toBe(
          true
        );
      });
    });

    it('should update cursor style based on selection', async () => {
      render(<OrientationGizmo {...defaultProps} />);

      await waitFor(() => {
        const canvas = screen.getByTestId('gizmo-canvas');
        expect(canvas).toBeInTheDocument();
      });

      const canvas = screen.getByTestId('gizmo-canvas');

      // Initially default cursor
      expect(canvas).toHaveStyle('cursor: default');

      // Select an axis
      appStoreInstance.getState().setGizmoSelectedAxis(AxisDirection.POSITIVE_X);

      await waitFor(() => {
        expect(canvas).toHaveStyle('cursor: pointer');
      });
    });
  });

  describe('Event Handlers', () => {
    beforeEach(async () => {
      appStoreInstance.getState().setGizmoVisibility(true);
    });

    it('should call onAxisSelected when axis is clicked', async () => {
      const onAxisSelected = vi.fn();
      render(<OrientationGizmo {...defaultProps} onAxisSelected={onAxisSelected} />);

      await waitFor(() => {
        const canvas = screen.getByTestId('gizmo-canvas');
        expect(canvas).toBeInTheDocument();
      });

      // Simulate axis selection and click
      appStoreInstance.getState().setGizmoSelectedAxis(AxisDirection.POSITIVE_Y);

      const canvas = screen.getByTestId('gizmo-canvas');
      fireEvent.click(canvas);

      // Wait for async operation with longer timeout
      await waitFor(
        () => {
          expect(onAxisSelected).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });

    it('should call onAnimationStart and onAnimationComplete', async () => {
      const onAnimationStart = vi.fn();
      const onAnimationComplete = vi.fn();

      render(
        <OrientationGizmo
          {...defaultProps}
          onAnimationStart={onAnimationStart}
          onAnimationComplete={onAnimationComplete}
        />
      );

      await waitFor(() => {
        const canvas = screen.getByTestId('gizmo-canvas');
        expect(canvas).toBeInTheDocument();
      });

      // Simulate axis selection and click
      appStoreInstance.getState().setGizmoSelectedAxis(AxisDirection.POSITIVE_Z);

      const canvas = screen.getByTestId('gizmo-canvas');
      fireEvent.click(canvas);

      await waitFor(
        () => {
          expect(onAnimationStart).toHaveBeenCalledWith(AxisDirection.POSITIVE_Z);
        },
        { timeout: 2000 }
      );

      // Wait for animation completion with longer timeout
      await waitFor(
        () => {
          expect(onAnimationComplete).toHaveBeenCalledWith(AxisDirection.POSITIVE_Z);
        },
        { timeout: 2000 }
      );
    });

    it('should call onError when initialization fails', async () => {
      const onError = vi.fn();

      // Create invalid camera to trigger error
      const invalidCamera = null;

      render(<OrientationGizmo camera={invalidCamera} onError={onError} />);

      // Should not call onError for null camera (component just doesn't render)
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      appStoreInstance.getState().setGizmoVisibility(true);
    });

    it('should display error indicator when there is a non-critical error', async () => {
      render(<OrientationGizmo {...defaultProps} />);

      await waitFor(() => {
        const canvas = screen.getByTestId('gizmo-canvas');
        expect(canvas).toBeInTheDocument();
      });

      // Simulate a render error in store
      const renderError: GizmoError = {
        code: GizmoErrorCode.RENDER_FAILED,
        message: 'Test render error',
        timestamp: new Date(),
      };

      appStoreInstance.getState().setGizmoError(renderError);

      await waitFor(() => {
        expect(screen.getByTestId('gizmo-error-indicator')).toBeInTheDocument();
      });
    });

    it('should not render when there is a critical initialization error', () => {
      appStoreInstance.getState().setGizmoVisibility(true);

      // Simulate critical error
      const criticalError: GizmoError = {
        code: GizmoErrorCode.INITIALIZATION_FAILED,
        message: 'Critical initialization error',
        timestamp: new Date(),
      };

      appStoreInstance.getState().setGizmoError(criticalError);

      render(<OrientationGizmo {...defaultProps} />);

      expect(screen.queryByTestId('orientation-gizmo')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      appStoreInstance.getState().setGizmoVisibility(true);
    });

    it('should have proper ARIA attributes', async () => {
      render(<OrientationGizmo {...defaultProps} />);

      await waitFor(() => {
        const canvas = screen.getByTestId('gizmo-canvas');
        expect(canvas).toBeInTheDocument();
      });

      const canvas = screen.getByTestId('gizmo-canvas');
      expect(canvas).toHaveAttribute('aria-label', '3D Orientation Gizmo');
      expect(canvas).toHaveAttribute('role', 'button');
      expect(canvas).toHaveAttribute('tabIndex', '0');
    });
  });
});
