/**
 * @file Generic Scene Component Tests
 * 
 * Tests for the generic scene component that verifies proper mesh rendering
 * without any OpenSCAD-specific knowledge.
 */

import ReactThreeTestRenderer, { type ReactThreeTest } from '@react-three/test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BufferGeometry, BoxGeometry, Matrix4, Box3 } from 'three';
import type { GenericMeshData } from '../../../ast-to-csg-converter/types/conversion.types';
import type { CameraConfig } from '../../../../shared/types/common.types';
import { MeshDataScene } from './mesh-data-scene';

// Mock camera configuration
const defaultCamera: CameraConfig = {
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

// Mock callbacks
const mockOnRenderComplete = vi.fn();
const mockOnRenderError = vi.fn();
const mockOnCameraChange = vi.fn();

// Default props
const defaultProps = {
  meshes: [],
  camera: defaultCamera,
  onRenderComplete: mockOnRenderComplete,
  onRenderError: mockOnRenderError,
  onCameraChange: mockOnCameraChange,
};

describe('MeshDataScene', () => {
  let renderer: ReactThreeTest;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (renderer) {
      await renderer.unmount();
    }
  });

  describe('Initialization', () => {
    it('should render without crashing', async () => {
      renderer = await ReactThreeTestRenderer.create(
        <MeshDataScene {...defaultProps} />
      );

      expect(renderer.scene).toBeDefined();
    });

    it('should handle empty mesh array', async () => {
      renderer = await ReactThreeTestRenderer.create(
        <MeshDataScene {...defaultProps} meshes={[]} />
      );

      expect(mockOnRenderComplete).toHaveBeenCalledWith([]);
      expect(mockOnRenderError).not.toHaveBeenCalled();
    });
  });

  describe('Mesh Rendering', () => {
    it('should render single generic mesh', async () => {
      const geometry = new BoxGeometry(1, 1, 1);
      const meshData: GenericMeshData = {
        id: 'test-mesh-1',
        geometry,
        material: {
          color: '#ff0000',
          metalness: 0.1,
          roughness: 0.8,
          opacity: 1.0,
          transparent: false,
          side: 'double',
        },
        transform: new Matrix4(),
        metadata: {
          meshId: 'test-mesh-1',
          triangleCount: 12,
          vertexCount: 8,
          boundingBox: new Box3(),
          complexity: 8,
          operationTime: 10,
          isOptimized: true,
          lastAccessed: new Date(),
        },
      };

      renderer = await ReactThreeTestRenderer.create(
        <MeshDataScene {...defaultProps} meshes={[meshData]} />
      );

      // Should have called onRenderComplete with the mesh
      expect(mockOnRenderComplete).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            mesh: expect.any(Object),
            metadata: expect.objectContaining({
              meshId: 'test-mesh-1',
            }),
          }),
        ])
      );
    });

    it('should render multiple generic meshes', async () => {
      const geometry1 = new BoxGeometry(1, 1, 1);
      const geometry2 = new BoxGeometry(2, 2, 2);
      
      const meshData1: GenericMeshData = {
        id: 'test-mesh-1',
        geometry: geometry1,
        material: {
          color: '#ff0000',
          metalness: 0.1,
          roughness: 0.8,
          opacity: 1.0,
          transparent: false,
          side: 'double',
        },
        transform: new Matrix4(),
        metadata: {
          meshId: 'test-mesh-1',
          triangleCount: 12,
          vertexCount: 8,
          boundingBox: new Box3(),
          complexity: 8,
          operationTime: 10,
          isOptimized: true,
          lastAccessed: new Date(),
        },
      };

      const meshData2: GenericMeshData = {
        id: 'test-mesh-2',
        geometry: geometry2,
        material: {
          color: '#00ff00',
          metalness: 0.2,
          roughness: 0.7,
          opacity: 0.8,
          transparent: true,
          side: 'front',
        },
        transform: new Matrix4(),
        metadata: {
          meshId: 'test-mesh-2',
          triangleCount: 12,
          vertexCount: 8,
          boundingBox: new Box3(),
          complexity: 8,
          operationTime: 15,
          isOptimized: false,
          lastAccessed: new Date(),
        },
      };

      renderer = await ReactThreeTestRenderer.create(
        <MeshDataScene {...defaultProps} meshes={[meshData1, meshData2]} />
      );

      // Should have called onRenderComplete with both meshes
      expect(mockOnRenderComplete).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            metadata: expect.objectContaining({
              meshId: 'test-mesh-1',
            }),
          }),
          expect.objectContaining({
            metadata: expect.objectContaining({
              meshId: 'test-mesh-2',
            }),
          }),
        ])
      );
    });

    it('should apply material properties correctly', async () => {
      const geometry = new BoxGeometry(1, 1, 1);
      const meshData: GenericMeshData = {
        id: 'test-mesh-material',
        geometry,
        material: {
          color: '#0000ff',
          metalness: 0.5,
          roughness: 0.3,
          opacity: 0.7,
          transparent: true,
          side: 'back',
          wireframe: true,
        },
        transform: new Matrix4(),
        metadata: {
          meshId: 'test-mesh-material',
          triangleCount: 12,
          vertexCount: 8,
          boundingBox: new Box3(),
          complexity: 8,
          operationTime: 10,
          isOptimized: true,
          lastAccessed: new Date(),
        },
      };

      renderer = await ReactThreeTestRenderer.create(
        <MeshDataScene {...defaultProps} meshes={[meshData]} />
      );

      expect(mockOnRenderComplete).toHaveBeenCalled();
      expect(mockOnRenderError).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid mesh data gracefully', async () => {
      const invalidMeshData = {
        id: 'invalid-mesh',
        // Missing required properties
      } as unknown as GenericMeshData;

      renderer = await ReactThreeTestRenderer.create(
        <MeshDataScene {...defaultProps} meshes={[invalidMeshData]} />
      );

      // Should have called onRenderError
      expect(mockOnRenderError).toHaveBeenCalled();
    });

    it('should handle null/undefined meshes in array', async () => {
      const validGeometry = new BoxGeometry(1, 1, 1);
      const validMeshData: GenericMeshData = {
        id: 'valid-mesh',
        geometry: validGeometry,
        material: {
          color: '#ff0000',
          metalness: 0.1,
          roughness: 0.8,
          opacity: 1.0,
          transparent: false,
          side: 'double',
        },
        transform: new Matrix4(),
        metadata: {
          meshId: 'valid-mesh',
          triangleCount: 12,
          vertexCount: 8,
          boundingBox: new Box3(),
          complexity: 8,
          operationTime: 10,
          isOptimized: true,
          lastAccessed: new Date(),
        },
      };

      const meshesWithNull = [validMeshData, null, undefined] as any[];

      renderer = await ReactThreeTestRenderer.create(
        <MeshDataScene {...defaultProps} meshes={meshesWithNull} />
      );

      // Should render the valid mesh and skip the invalid ones
      expect(mockOnRenderComplete).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            metadata: expect.objectContaining({
              meshId: 'valid-mesh',
            }),
          }),
        ])
      );
    });
  });

  describe('Configuration Options', () => {
    it('should apply wireframe mode when enabled', async () => {
      const geometry = new BoxGeometry(1, 1, 1);
      const meshData: GenericMeshData = {
        id: 'wireframe-mesh',
        geometry,
        material: {
          color: '#ff0000',
          metalness: 0.1,
          roughness: 0.8,
          opacity: 1.0,
          transparent: false,
          side: 'double',
        },
        transform: new Matrix4(),
        metadata: {
          meshId: 'wireframe-mesh',
          triangleCount: 12,
          vertexCount: 8,
          boundingBox: new Box3(),
          complexity: 8,
          operationTime: 10,
          isOptimized: true,
          lastAccessed: new Date(),
        },
      };

      renderer = await ReactThreeTestRenderer.create(
        <MeshDataScene {...defaultProps} meshes={[meshData]} debugWireframe={true} />
      );

      expect(mockOnRenderComplete).toHaveBeenCalled();
      expect(mockOnRenderError).not.toHaveBeenCalled();
    });

    it('should handle shadow configuration', async () => {
      const geometry = new BoxGeometry(1, 1, 1);
      const meshData: GenericMeshData = {
        id: 'shadow-mesh',
        geometry,
        material: {
          color: '#ff0000',
          metalness: 0.1,
          roughness: 0.8,
          opacity: 1.0,
          transparent: false,
          side: 'double',
        },
        transform: new Matrix4(),
        metadata: {
          meshId: 'shadow-mesh',
          triangleCount: 12,
          vertexCount: 8,
          boundingBox: new Box3(),
          complexity: 8,
          operationTime: 10,
          isOptimized: true,
          lastAccessed: new Date(),
        },
      };

      renderer = await ReactThreeTestRenderer.create(
        <MeshDataScene {...defaultProps} meshes={[meshData]} enableShadows={true} />
      );

      expect(mockOnRenderComplete).toHaveBeenCalled();
    });
  });
});
