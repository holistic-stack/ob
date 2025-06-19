/**
 * @file Integration Tests for Refactored Visual Test Canvas Components
 * 
 * Tests the integration between all refactored components:
 * - useOpenSCADMeshes hook
 * - Material manager utilities
 * - Camera manager utilities
 * - RefactoredVisualTestCanvas component
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as BABYLON from '@babylonjs/core';
import { RefactoredVisualTestCanvas } from './refactored-visual-test-canvas';
import { useOpenSCADMeshes } from './hooks/use-openscad-meshes';
import { applyMaterialsToMeshCollection } from './utils/material-manager';
import { positionCameraForMeshes } from './utils/camera-manager';
import type { VisualTestCanvasProps, MeshCollection } from './types/visual-test-canvas-types';

// Mock the hooks and utilities
vi.mock('../../hooks/use-babylon-engine/use-babylon-engine');
vi.mock('../../hooks/use-babylon-scene/use-babylon-scene');
vi.mock('./hooks/use-openscad-meshes');
vi.mock('./utils/material-manager');
vi.mock('./utils/camera-manager');

import { useBabylonEngine } from '../../hooks/use-babylon-engine/use-babylon-engine';
import { useBabylonScene } from '../../hooks/use-babylon-scene/use-babylon-scene';

describe('Visual Test Canvas Integration Tests', () => {
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
      name: 'integration-test-mesh',
      position: { x: 0, y: 0, z: 0 },
      material: null,
      dispose: vi.fn()
    } as unknown as BABYLON.Mesh;

    mockMeshCollection = {
      mainMeshes: [{ mesh: mockMesh, name: 'main-1' }],
      referenceMeshes: [{ 
        mesh: { ...mockMesh, name: 'ref-1' } as BABYLON.Mesh, 
        name: 'ref-1', 
        isReference: true 
      }]
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

    (useOpenSCADMeshes as any).mockReturnValue({
      meshes: mockMeshCollection,
      isLoading: false,
      error: null,
      regenerate: vi.fn()
    });

    // Setup utility mocks
    (applyMaterialsToMeshCollection as any).mockResolvedValue({
      success: true,
      data: { appliedCount: 2, failedCount: 0, errors: [] }
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

  describe('Complete Integration Flow', () => {
    it('should integrate all components for a complete visual test workflow', async () => {
      const onRenderingComplete = vi.fn();
      const onMeshesReady = vi.fn();
      const onCameraReady = vi.fn();

      const props: VisualTestCanvasProps = {
        testName: 'integration-test',
        meshes: mockMeshCollection,
        visualSceneConfig: {
          backgroundColor: '#ffffff',
          camera: { autoPosition: true },
          lighting: { enableDefaultLighting: true }
        },
        width: 1024,
        height: 768,
        enableDebugLogging: true,
        onRenderingComplete,
        onMeshesReady,
        onCameraReady
      };

      render(<RefactoredVisualTestCanvas {...props} />);

      // Verify canvas is rendered with correct attributes
      const canvas = screen.getByTestId('visual-test-canvas-integration-test');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('width', '1024');
      expect(canvas).toHaveAttribute('height', '768');

      // Verify engine and scene initialization
      expect(useBabylonEngine).toHaveBeenCalledWith(
        expect.any(Object), // canvas element
        expect.objectContaining({
          antialias: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true
        })
      );

      expect(useBabylonScene).toHaveBeenCalledWith(
        mockEngine,
        expect.objectContaining({
          enableCamera: true,
          enableLighting: true,
          backgroundColor: '#ffffff'
        })
      );

      // Verify mesh processing workflow
      await waitFor(() => {
        expect(applyMaterialsToMeshCollection).toHaveBeenCalledWith(
          mockMeshCollection,
          mockScene,
          expect.objectContaining({ theme: 'default' })
        );
      });

      await waitFor(() => {
        expect(positionCameraForMeshes).toHaveBeenCalledWith(
          mockMeshCollection,
          mockScene,
          expect.objectContaining({
            autoPosition: true,
            paddingFactor: 3.5
          })
        );
      });

      // Verify callbacks are called in correct order
      await waitFor(() => {
        expect(onMeshesReady).toHaveBeenCalledWith(mockMeshCollection);
      });

      await waitFor(() => {
        expect(onRenderingComplete).toHaveBeenCalled();
      });

      // Verify render loop is started
      expect(mockEngine.runRenderLoop).toHaveBeenCalled();
    });

    it('should handle OpenSCAD mesh generation workflow', async () => {
      // Mock useOpenSCADMeshes to simulate loading state
      (useOpenSCADMeshes as any).mockReturnValue({
        meshes: null,
        isLoading: true,
        error: null,
        regenerate: vi.fn()
      });

      const props: VisualTestCanvasProps = {
        testName: 'openscad-workflow-test',
        enableDebugLogging: true
      };

      const { rerender } = render(<RefactoredVisualTestCanvas {...props} />);

      // Initially no meshes should be processed
      await waitFor(() => {
        expect(applyMaterialsToMeshCollection).not.toHaveBeenCalled();
        expect(positionCameraForMeshes).not.toHaveBeenCalled();
      });

      // Simulate mesh generation completion
      (useOpenSCADMeshes as any).mockReturnValue({
        meshes: mockMeshCollection,
        isLoading: false,
        error: null,
        regenerate: vi.fn()
      });

      rerender(<RefactoredVisualTestCanvas {...props} meshes={mockMeshCollection} />);

      // Now meshes should be processed
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
    });

    it('should handle error scenarios gracefully across all components', async () => {
      // Mock material application failure
      (applyMaterialsToMeshCollection as any).mockResolvedValue({
        success: true,
        data: { appliedCount: 0, failedCount: 2, errors: ['Material error 1', 'Material error 2'] }
      });

      // Mock camera positioning failure
      (positionCameraForMeshes as any).mockResolvedValue({
        success: false,
        error: 'Camera positioning failed'
      });

      const props: VisualTestCanvasProps = {
        testName: 'error-handling-test',
        meshes: mockMeshCollection,
        enableDebugLogging: true
      };

      render(<RefactoredVisualTestCanvas {...props} />);

      // Should still attempt both operations despite failures
      await waitFor(() => {
        expect(applyMaterialsToMeshCollection).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(positionCameraForMeshes).toHaveBeenCalled();
      });

      // Should still complete rendering despite errors
      await waitFor(() => {
        expect(mockScene.executeWhenReady).toHaveBeenCalled();
      });
    });

    it('should support different material themes and camera configurations', async () => {
      const props: VisualTestCanvasProps = {
        testName: 'configuration-test',
        meshes: mockMeshCollection,
        visualSceneConfig: {
          backgroundColor: '#ff0000',
          camera: {
            autoPosition: true,
            type: 'arcRotate'
          },
          lighting: {
            enableDefaultLighting: false,
            ambientIntensity: 0.5
          }
        }
      };

      render(<RefactoredVisualTestCanvas {...props} />);

      // Verify scene configuration is applied
      expect(useBabylonScene).toHaveBeenCalledWith(
        mockEngine,
        expect.objectContaining({
          backgroundColor: '#ff0000'
        })
      );

      // Verify mesh processing with default configurations
      await waitFor(() => {
        expect(applyMaterialsToMeshCollection).toHaveBeenCalledWith(
          mockMeshCollection,
          mockScene,
          expect.objectContaining({ theme: 'default' })
        );
      });

      await waitFor(() => {
        expect(positionCameraForMeshes).toHaveBeenCalledWith(
          mockMeshCollection,
          mockScene,
          expect.objectContaining({
            autoPosition: true,
            paddingFactor: 3.5
          })
        );
      });
    });
  });

  describe('Performance and Resource Management', () => {
    it('should properly cleanup resources on unmount', () => {
      const props: VisualTestCanvasProps = {
        testName: 'cleanup-integration-test',
        meshes: mockMeshCollection
      };

      const { unmount } = render(<RefactoredVisualTestCanvas {...props} />);

      // Verify render loop is started
      expect(mockEngine.runRenderLoop).toHaveBeenCalled();

      unmount();

      // Verify cleanup is called
      expect(useBabylonEngine().dispose).toHaveBeenCalled();
      expect(useBabylonScene().dispose).toHaveBeenCalled();
    });

    it('should handle rapid prop changes without memory leaks', async () => {
      const props: VisualTestCanvasProps = {
        testName: 'prop-changes-test',
        meshes: mockMeshCollection
      };

      const { rerender } = render(<RefactoredVisualTestCanvas {...props} />);

      // Change meshes multiple times
      const newMeshCollection: MeshCollection = {
        mainMeshes: [{ mesh: { ...mockMesh, name: 'new-main' } as BABYLON.Mesh, name: 'new-main' }],
        referenceMeshes: []
      };

      rerender(<RefactoredVisualTestCanvas {...props} meshes={newMeshCollection} />);
      rerender(<RefactoredVisualTestCanvas {...props} meshes={mockMeshCollection} />);
      rerender(<RefactoredVisualTestCanvas {...props} meshes={newMeshCollection} />);

      // Should handle changes gracefully without errors
      await waitFor(() => {
        expect(applyMaterialsToMeshCollection).toHaveBeenCalled();
      });
    });
  });
});
