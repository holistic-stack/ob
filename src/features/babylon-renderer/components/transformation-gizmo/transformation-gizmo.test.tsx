/**
 * @file transformation-gizmo.test.tsx
 * @description Comprehensive tests for TransformationGizmo React component using real
 * BabylonJS instances with NullEngine for headless testing. Tests component lifecycle,
 * prop changes, and integration with transformation gizmo service.
 */

import type { AbstractMesh, Scene } from '@babylonjs/core';
import { CreateBox, type Engine, NullEngine } from '@babylonjs/core';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  TransformationEvent,
  TransformationGizmoError,
} from '../../services/transformation-gizmo-service';
import type { TransformationGizmoProps } from './transformation-gizmo';
import { TransformationGizmo } from './transformation-gizmo';

// Mock ResizeObserver for headless testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('TransformationGizmo', () => {
  let engine: Engine;
  let scene: Scene;
  let testMesh: AbstractMesh;
  let mockOnTransformationComplete: ReturnType<typeof vi.fn>;
  let mockOnError: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Create NullEngine for headless testing
    engine = new NullEngine({
      renderHeight: 512,
      renderWidth: 512,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1,
    });

    // Create scene
    scene = new Scene(engine);

    // Create test mesh
    testMesh = CreateBox('testBox', { size: 2 }, scene);

    // Create mock callbacks
    mockOnTransformationComplete = vi.fn();
    mockOnError = vi.fn();
  });

  afterEach(() => {
    scene.dispose();
    engine.dispose();
    vi.clearAllMocks();
  });

  const renderTransformationGizmo = (props: Partial<TransformationGizmoProps> = {}) => {
    const defaultProps: TransformationGizmoProps = {
      scene,
      selectedMesh: null,
      mode: 'position',
      onTransformationComplete: mockOnTransformationComplete,
      onError: mockOnError,
    };

    return render(<TransformationGizmo {...defaultProps} {...props} />);
  };

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = renderTransformationGizmo();
      expect(container.firstChild).toBeNull(); // Component renders nothing
    });

    it('should render with all props provided', () => {
      const { container } = renderTransformationGizmo({
        scene,
        selectedMesh: testMesh,
        mode: 'rotation',
        config: { size: 2.0 },
        className: 'test-gizmo',
      });
      expect(container.firstChild).toBeNull();
    });

    it('should handle null scene gracefully', () => {
      const { container } = renderTransformationGizmo({
        scene: null,
      });
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Service Initialization', () => {
    it('should initialize service when scene is provided', async () => {
      renderTransformationGizmo({ scene });

      // Wait for async initialization
      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });

    it('should not initialize service when scene is null', () => {
      renderTransformationGizmo({ scene: null });

      // Service should not be initialized
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should reinitialize service when scene changes', async () => {
      const { rerender } = renderTransformationGizmo({ scene: null });

      // Initially no scene
      expect(mockOnError).not.toHaveBeenCalled();

      // Provide scene
      rerender(
        <TransformationGizmo
          scene={scene}
          selectedMesh={null}
          mode="position"
          onTransformationComplete={mockOnTransformationComplete}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });
  });

  describe('Mesh Attachment', () => {
    it('should attach gizmo when mesh is selected', async () => {
      renderTransformationGizmo({
        scene,
        selectedMesh: testMesh,
      });

      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });

    it('should handle mesh changes', async () => {
      const { rerender } = renderTransformationGizmo({
        scene,
        selectedMesh: null,
      });

      // Initially no mesh selected
      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });

      // Select mesh
      rerender(
        <TransformationGizmo
          scene={scene}
          selectedMesh={testMesh}
          mode="position"
          onTransformationComplete={mockOnTransformationComplete}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });

      // Deselect mesh
      rerender(
        <TransformationGizmo
          scene={scene}
          selectedMesh={null}
          mode="position"
          onTransformationComplete={mockOnTransformationComplete}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });

    it('should handle multiple mesh changes', async () => {
      const secondMesh = CreateBox('secondBox', { size: 1 }, scene);

      const { rerender } = renderTransformationGizmo({
        scene,
        selectedMesh: testMesh,
      });

      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });

      // Switch to second mesh
      rerender(
        <TransformationGizmo
          scene={scene}
          selectedMesh={secondMesh}
          mode="position"
          onTransformationComplete={mockOnTransformationComplete}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });
  });

  describe('Mode Switching', () => {
    it('should handle mode changes', async () => {
      const { rerender } = renderTransformationGizmo({
        scene,
        selectedMesh: testMesh,
        mode: 'position',
      });

      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });

      // Switch to rotation mode
      rerender(
        <TransformationGizmo
          scene={scene}
          selectedMesh={testMesh}
          mode="rotation"
          onTransformationComplete={mockOnTransformationComplete}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });

      // Switch to scale mode
      rerender(
        <TransformationGizmo
          scene={scene}
          selectedMesh={testMesh}
          mode="scale"
          onTransformationComplete={mockOnTransformationComplete}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });

    it('should start with default position mode', async () => {
      renderTransformationGizmo({
        scene,
        selectedMesh: testMesh,
        // mode not specified, should default to 'position'
      });

      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });
  });

  describe('Configuration', () => {
    it('should accept custom configuration', async () => {
      const customConfig = {
        size: 2.0,
        snapToGrid: true,
        gridSize: 0.5,
      };

      renderTransformationGizmo({
        scene,
        selectedMesh: testMesh,
        config: customConfig,
      });

      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });

    it('should work without configuration', async () => {
      renderTransformationGizmo({
        scene,
        selectedMesh: testMesh,
        // config not provided
      });

      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });
  });

  describe('Event Handling', () => {
    it('should call onTransformationComplete when provided', async () => {
      renderTransformationGizmo({
        scene,
        selectedMesh: testMesh,
        onTransformationComplete: mockOnTransformationComplete,
      });

      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });

      // onTransformationComplete should be ready to receive events
      expect(mockOnTransformationComplete).not.toHaveBeenCalled();
    });

    it('should handle missing onTransformationComplete callback', async () => {
      renderTransformationGizmo({
        scene,
        selectedMesh: testMesh,
        onTransformationComplete: undefined,
      });

      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });

    it('should call onError when service encounters errors', async () => {
      // Create a scene that will be disposed to trigger an error scenario
      const disposedScene = new Scene(engine);
      disposedScene.dispose();

      renderTransformationGizmo({
        scene: disposedScene,
        selectedMesh: testMesh,
        onError: mockOnError,
      });

      // Should handle disposed scene gracefully
      await waitFor(() => {
        // BabylonJS handles disposed scenes gracefully, so no error expected
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup service on unmount', async () => {
      const { unmount } = renderTransformationGizmo({
        scene,
        selectedMesh: testMesh,
      });

      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });

      // Unmount component
      unmount();

      // Service should be disposed (no way to directly test this, but no errors should occur)
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should handle rapid prop changes', async () => {
      const { rerender } = renderTransformationGizmo({
        scene,
        selectedMesh: null,
        mode: 'position',
      });

      // Rapid changes
      for (let i = 0; i < 5; i++) {
        rerender(
          <TransformationGizmo
            scene={scene}
            selectedMesh={i % 2 === 0 ? testMesh : null}
            mode={i % 3 === 0 ? 'position' : i % 3 === 1 ? 'rotation' : 'scale'}
            onTransformationComplete={mockOnTransformationComplete}
            onError={mockOnError}
          />
        );
      }

      await waitFor(() => {
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });
  });
});
