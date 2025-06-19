/**
 * @file Tests for useOpenSCADMeshes Hook
 * 
 * Tests for the OpenSCAD mesh provider hook following TDD principles
 * Tests the extraction of OpenSCAD to mesh conversion logic
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import * as BABYLON from '@babylonjs/core';
import { useOpenSCADMeshes } from './use-openscad-meshes';
import type { UseOpenSCADMeshesProps, MeshCollection } from '../../types/visual-test-canvas-types';

// Mock the babylon-csg2-converter
vi.mock('../../../../../babylon-csg2/conversion/babylon-csg2-converter/babylon-csg2-converter', () => ({
  convertOpenSCADToBabylon: vi.fn()
}));

// Mock the positioning utilities
vi.mock('../../utils/ghost-positioning', () => ({
  detectTransformationType: vi.fn(),
  calculateGhostOffset: vi.fn(),
  DEFAULT_GHOST_CONFIG: {
    separationDistance: 15,
    minSeparation: 8,
    maxSeparation: 25
  }
}));

vi.mock('../../utils/mesh-positioning', () => ({
  applyGhostPositioning: vi.fn(),
  formatVector3ForLogging: vi.fn().mockReturnValue('{X: 0 Y: 0 Z: 0}')
}));

import { convertOpenSCADToBabylon } from '../../../../../babylon-csg2/conversion/babylon-csg2-converter/babylon-csg2-converter';
import { detectTransformationType, calculateGhostOffset } from '../../utils/ghost-positioning';
import { applyGhostPositioning } from '../../utils/mesh-positioning';

describe('useOpenSCADMeshes Hook', () => {
  let mockScene: BABYLON.Scene;
  let mockEngine: BABYLON.Engine;
  let mockMesh: BABYLON.Mesh;

  beforeEach(() => {
    // Create mock Babylon.js objects
    mockEngine = {
      dispose: vi.fn(),
      isDisposed: false
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
      isVisible: true,
      setEnabled: vi.fn(),
      dispose: vi.fn()
    } as unknown as BABYLON.Mesh;

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Hook Functionality', () => {
    it('should return initial state when no scene provided', () => {
      const props: UseOpenSCADMeshesProps = {
        scene: null,
        openscadCode: 'cube([5, 5, 5]);'
      };

      const { result } = renderHook(() => useOpenSCADMeshes(props));

      expect(result.current.meshes).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.regenerate).toBe('function');
    });

    it('should return initial state when no OpenSCAD code provided', () => {
      const props: UseOpenSCADMeshesProps = {
        scene: mockScene,
        openscadCode: undefined
      };

      const { result } = renderHook(() => useOpenSCADMeshes(props));

      expect(result.current.meshes).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Main Mesh Generation', () => {
    it('should generate main meshes from OpenSCAD code', async () => {
      const mockConvertResult = {
        success: true,
        value: [mockMesh]
      };

      (convertOpenSCADToBabylon as any).mockResolvedValue(mockConvertResult);

      const props: UseOpenSCADMeshesProps = {
        scene: mockScene,
        openscadCode: 'cube([5, 5, 5]);',
        enableDebugLogging: true
      };

      const { result } = renderHook(() => useOpenSCADMeshes(props));

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for conversion to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.meshes).not.toBeNull();
      expect(result.current.meshes?.mainMeshes).toHaveLength(1);
      expect(result.current.meshes?.mainMeshes[0].mesh).toBe(mockMesh);
      expect(result.current.error).toBeNull();

      // Verify converter was called with correct parameters
      expect(convertOpenSCADToBabylon).toHaveBeenCalledWith(
        'cube([5, 5, 5]);',
        mockScene,
        expect.objectContaining({
          enableLogging: true,
          rebuildNormals: true,
          centerMesh: true
        })
      );
    });

    it('should handle conversion errors gracefully', async () => {
      const mockConvertResult = {
        success: false,
        error: 'Conversion failed'
      };

      (convertOpenSCADToBabylon as any).mockResolvedValue(mockConvertResult);

      const props: UseOpenSCADMeshesProps = {
        scene: mockScene,
        openscadCode: 'invalid_code();'
      };

      const { result } = renderHook(() => useOpenSCADMeshes(props));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.meshes).toBeNull();
      expect(result.current.error).toBe('Failed to convert main OpenSCAD code: Error: Conversion failed');
    });
  });

  describe('Reference Mesh Generation', () => {
    it('should generate reference meshes when reference code provided', async () => {
      const mainMesh = { ...mockMesh, name: 'main-mesh' };
      const referenceMesh = { ...mockMesh, name: 'reference-mesh' };

      (convertOpenSCADToBabylon as any)
        .mockResolvedValueOnce({ success: true, value: [mainMesh] })
        .mockResolvedValueOnce({ success: true, value: [referenceMesh] });

      (detectTransformationType as any).mockReturnValue({
        type: 'translate',
        values: [10, 0, 0]
      });

      (calculateGhostOffset as any).mockReturnValue({ x: 15, y: 0, z: 0 });

      const props: UseOpenSCADMeshesProps = {
        scene: mockScene,
        openscadCode: 'translate([10, 0, 0]) cube([5, 5, 5]);',
        referenceOpenscadCode: 'cube([5, 5, 5]);'
      };

      const { result } = renderHook(() => useOpenSCADMeshes(props));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.meshes).not.toBeNull();
      expect(result.current.meshes?.mainMeshes).toHaveLength(1);
      expect(result.current.meshes?.referenceMeshes).toHaveLength(1);
      expect(result.current.meshes?.referenceMeshes[0].isReference).toBe(true);

      // Verify ghost positioning was applied
      expect(applyGhostPositioning).toHaveBeenCalledWith(
        [referenceMesh],
        { x: 15, y: 0, z: 0 }
      );
    });

    it('should handle reference mesh conversion errors gracefully', async () => {
      (convertOpenSCADToBabylon as any)
        .mockResolvedValueOnce({ success: true, value: [mockMesh] })
        .mockResolvedValueOnce({ success: false, error: 'Reference conversion failed' });

      const props: UseOpenSCADMeshesProps = {
        scene: mockScene,
        openscadCode: 'cube([5, 5, 5]);',
        referenceOpenscadCode: 'invalid_reference();'
      };

      const { result } = renderHook(() => useOpenSCADMeshes(props));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still have main meshes, but no reference meshes
      expect(result.current.meshes?.mainMeshes).toHaveLength(1);
      expect(result.current.meshes?.referenceMeshes).toHaveLength(0);
      expect(result.current.error).toBeNull(); // Reference errors don't fail the whole operation
    });
  });

  describe('Regenerate Functionality', () => {
    it('should regenerate meshes when regenerate is called', async () => {
      (convertOpenSCADToBabylon as any).mockResolvedValue({
        success: true,
        value: [mockMesh]
      });

      const props: UseOpenSCADMeshesProps = {
        scene: mockScene,
        openscadCode: 'cube([5, 5, 5]);'
      };

      const { result } = renderHook(() => useOpenSCADMeshes(props));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear the mock call history
      vi.clearAllMocks();

      // Call regenerate wrapped in act
      act(() => {
        result.current.regenerate();
      });

      // Should start loading again
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify converter was called again
      expect(convertOpenSCADToBabylon).toHaveBeenCalled();
    });
  });

  describe('Configuration Handling', () => {
    it('should apply custom mesh configuration', async () => {
      (convertOpenSCADToBabylon as any).mockResolvedValue({
        success: true,
        value: [mockMesh]
      });

      const customConfig = {
        enableLogging: false,
        rebuildNormals: false,
        centerMesh: false
      };

      const props: UseOpenSCADMeshesProps = {
        scene: mockScene,
        openscadCode: 'cube([5, 5, 5]);',
        mainMeshConfig: customConfig
      };

      const { result } = renderHook(() => useOpenSCADMeshes(props));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(convertOpenSCADToBabylon).toHaveBeenCalledWith(
        'cube([5, 5, 5]);',
        mockScene,
        expect.objectContaining(customConfig)
      );
    });
  });
});
