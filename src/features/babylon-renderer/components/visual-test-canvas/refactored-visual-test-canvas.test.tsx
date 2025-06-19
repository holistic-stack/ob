/**
 * @file Tests for Refactored VisualTestCanvas Component
 * 
 * Tests for the refactored component that accepts meshes as props
 * Following TDD principles and React testing best practices
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as BABYLON from '@babylonjs/core';
import { RefactoredVisualTestCanvas } from './refactored-visual-test-canvas';
import type { VisualTestCanvasProps, MeshCollection } from './types/visual-test-canvas-types';

// Mock the hooks
vi.mock('../../hooks/use-babylon-engine/use-babylon-engine', () => ({
  useBabylonEngine: vi.fn()
}));

vi.mock('../../hooks/use-babylon-scene/use-babylon-scene', () => ({
  useBabylonScene: vi.fn()
}));

// Mock the material manager
vi.mock('./utils/material-manager', () => ({
  applyMaterialsToMeshCollection: vi.fn()
}));

// Mock the camera manager
vi.mock('./utils/camera-manager', () => ({
  positionCameraForMeshes: vi.fn()
}));

import { useBabylonEngine } from '../../hooks/use-babylon-engine/use-babylon-engine';
import { useBabylonScene } from '../../hooks/use-babylon-scene/use-babylon-scene';
import { applyMaterialsToMeshCollection } from './utils/material-manager';
import { positionCameraForMeshes } from './utils/camera-manager';

describe('RefactoredVisualTestCanvas', () => {
  let mockEngine: BABYLON.Engine;
  let mockScene: BABYLON.Scene;
  let mockMesh: BABYLON.Mesh;
  let mockMeshCollection: MeshCollection;

  beforeEach(() => {
    // Create mock objects
    mockEngine = {
      dispose: vi.fn(),
      isDisposed: false,
      runRenderLoop: vi.fn(),
      stopRenderLoop: vi.fn()
    } as unknown as BABYLON.Engine;

    mockScene = {
      dispose: vi.fn(),
      isDisposed: false,
      executeWhenReady: vi.fn((callback) => callback())
    } as unknown as BABYLON.Scene;

    mockMesh = {
      name: 'test-mesh',
      position: { x: 0, y: 0, z: 0 },
      material: null,
      dispose: vi.fn()
    } as unknown as BABYLON.Mesh;

    mockMeshCollection = {
      mainMeshes: [{ mesh: mockMesh, name: 'main-1' }],
      referenceMeshes: []
    };

    // Setup hook mocks
    (useBabylonEngine as any).mockReturnValue({
      engine: mockEngine,
      isReady: true,
      error: null,
      dispose: vi.fn()
    });

    (useBabylonScene as any).mockReturnValue({
      scene: mockScene,
      isReady: true,
      render: vi.fn(),
      dispose: vi.fn()
    });

    // Setup utility mocks
    (applyMaterialsToMeshCollection as any).mockResolvedValue({
      success: true,
      data: { appliedCount: 1, failedCount: 0, errors: [] }
    });

    (positionCameraForMeshes as any).mockResolvedValue({
      success: true,
      data: {
        position: [10, 10, 10],
        target: [0, 0, 0],
        radius: 20,
        bounds: {
          center: [0, 0, 0],
          size: [2, 2, 2],
          maxDimension: 2,
          recommendedDistance: 7
        }
      }
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render canvas element with correct attributes', () => {
      const props: VisualTestCanvasProps = {
        testName: 'test-canvas',
        width: 800,
        height: 600
      };

      render(<RefactoredVisualTestCanvas {...props} />);

      const canvas = screen.getByTestId('visual-test-canvas-test-canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('width', '800');
      expect(canvas).toHaveAttribute('height', '600');
      expect(canvas).toHaveAttribute('aria-label', 'Visual test canvas for test-canvas');
    });

    it('should use default props when not provided', () => {
      render(<RefactoredVisualTestCanvas />);

      const canvas = screen.getByTestId('visual-test-canvas-visual-test');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('width', '800');
      expect(canvas).toHaveAttribute('height', '600');
    });

    it('should initialize engine and scene hooks', () => {
      const props: VisualTestCanvasProps = {
        testName: 'hook-test'
      };

      render(<RefactoredVisualTestCanvas {...props} />);

      expect(useBabylonEngine).toHaveBeenCalled();
      expect(useBabylonScene).toHaveBeenCalled();
    });
  });

  describe('Mesh Processing', () => {
    it('should process meshes when provided', async () => {
      const onRenderingComplete = vi.fn();
      const onMeshesReady = vi.fn();

      const props: VisualTestCanvasProps = {
        testName: 'mesh-test',
        meshes: mockMeshCollection,
        onRenderingComplete,
        onMeshesReady
      };

      render(<RefactoredVisualTestCanvas {...props} />);

      await waitFor(() => {
        expect(applyMaterialsToMeshCollection).toHaveBeenCalledWith(
          mockMeshCollection,
          mockScene,
          expect.any(Object)
        );
      });

      await waitFor(() => {
        expect(positionCameraForMeshes).toHaveBeenCalledWith(
          mockMeshCollection,
          mockScene,
          expect.any(Object)
        );
      });

      await waitFor(() => {
        expect(onMeshesReady).toHaveBeenCalledWith(mockMeshCollection);
      });

      await waitFor(() => {
        expect(onRenderingComplete).toHaveBeenCalled();
      });
    });

    it('should handle empty mesh collection', async () => {
      const emptyMeshCollection: MeshCollection = {
        mainMeshes: [],
        referenceMeshes: []
      };

      const props: VisualTestCanvasProps = {
        testName: 'empty-mesh-test',
        meshes: emptyMeshCollection
      };

      render(<RefactoredVisualTestCanvas {...props} />);

      // Should not call material or camera utilities for empty collection
      await waitFor(() => {
        expect(applyMaterialsToMeshCollection).not.toHaveBeenCalled();
        expect(positionCameraForMeshes).not.toHaveBeenCalled();
      });
    });

    it('should handle material application errors gracefully', async () => {
      (applyMaterialsToMeshCollection as any).mockResolvedValue({
        success: true,
        data: { appliedCount: 0, failedCount: 1, errors: ['Material error'] }
      });

      const props: VisualTestCanvasProps = {
        testName: 'material-error-test',
        meshes: mockMeshCollection,
        enableDebugLogging: true
      };

      render(<RefactoredVisualTestCanvas {...props} />);

      await waitFor(() => {
        expect(applyMaterialsToMeshCollection).toHaveBeenCalled();
      });

      // Should still continue with camera positioning despite material errors
      await waitFor(() => {
        expect(positionCameraForMeshes).toHaveBeenCalled();
      });
    });

    it('should handle camera positioning errors gracefully', async () => {
      (positionCameraForMeshes as any).mockResolvedValue({
        success: false,
        error: 'Camera positioning failed'
      });

      const props: VisualTestCanvasProps = {
        testName: 'camera-error-test',
        meshes: mockMeshCollection,
        enableDebugLogging: true
      };

      render(<RefactoredVisualTestCanvas {...props} />);

      await waitFor(() => {
        expect(positionCameraForMeshes).toHaveBeenCalled();
      });

      // Should still complete rendering despite camera errors
      await waitFor(() => {
        expect(mockScene.executeWhenReady).toHaveBeenCalled();
      });
    });
  });

  describe('Scene Configuration', () => {
    it('should apply custom scene configuration', () => {
      const visualSceneConfig = {
        backgroundColor: '#ff0000',
        camera: {
          autoPosition: false,
          position: [5, 5, 5] as const
        }
      };

      const props: VisualTestCanvasProps = {
        testName: 'config-test',
        visualSceneConfig
      };

      render(<RefactoredVisualTestCanvas {...props} />);

      expect(useBabylonScene).toHaveBeenCalledWith(
        mockEngine,
        expect.objectContaining({
          backgroundColor: '#ff0000'
        })
      );
    });

    it('should use default scene configuration when none provided', () => {
      const props: VisualTestCanvasProps = {
        testName: 'default-config-test'
      };

      render(<RefactoredVisualTestCanvas {...props} />);

      expect(useBabylonScene).toHaveBeenCalledWith(
        mockEngine,
        expect.objectContaining({
          enableCamera: true,
          enableLighting: true,
          backgroundColor: '#000000'
        })
      );
    });
  });

  describe('Render Loop Management', () => {
    it('should start render loop when scene is ready', () => {
      const props: VisualTestCanvasProps = {
        testName: 'render-loop-test'
      };

      render(<RefactoredVisualTestCanvas {...props} />);

      expect(mockEngine.runRenderLoop).toHaveBeenCalled();
    });

    it('should call onRenderFrame callback during render loop', () => {
      const onRenderFrame = vi.fn();

      const props: VisualTestCanvasProps = {
        testName: 'render-frame-test',
        onRenderFrame
      };

      render(<RefactoredVisualTestCanvas {...props} />);

      // Simulate render loop execution
      const renderLoopCallback = (mockEngine.runRenderLoop as any).mock.calls[0][0];
      renderLoopCallback();

      expect(onRenderFrame).toHaveBeenCalledWith(mockScene);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on unmount', () => {
      const props: VisualTestCanvasProps = {
        testName: 'cleanup-test'
      };

      const { unmount } = render(<RefactoredVisualTestCanvas {...props} />);

      unmount();

      // Verify cleanup was called (through hook dispose functions)
      expect(useBabylonEngine().dispose).toHaveBeenCalled();
      expect(useBabylonScene().dispose).toHaveBeenCalled();
    });
  });
});
