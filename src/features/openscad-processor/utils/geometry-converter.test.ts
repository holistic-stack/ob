/**
 * @file Geometry Converter Tests
 * 
 * Tests for pure geometry conversion functions.
 * These tests demonstrate the improved testability after refactoring.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect } from 'vitest';
import {
  convertGeometryToMesh,
  convertResultToMeshes,
  isValidGeometryData,
  getMeshStats
} from './geometry-converter';
import { createPipelineSuccess, createPipelineFailure } from '../../../types/pipeline-types';
import type { MeshGeometryData } from '../../../types/pipeline-types';

describe('Geometry Converter (Pure Functions)', () => {
  const mockGeometryData: MeshGeometryData = {
    name: 'test-cube',
    positions: [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], // 4 vertices
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], // 4 normals
    indices: [0, 1, 2, 0, 2, 3], // 2 triangles
    uvs: [0, 0, 1, 0, 1, 1, 0, 1], // 4 UV coordinates
    materialData: {
      diffuseColor: [1, 0, 0] as const,
      specularColor: [0, 1, 0] as const,
      emissiveColor: [0, 0, 1] as const
    }
  };

  describe('convertGeometryToMesh', () => {
    it('should convert geometry data to processed mesh', () => {
      const mesh = convertGeometryToMesh(mockGeometryData);
      
      expect(mesh.name).toBe('test-cube');
      expect(mesh.positions).toBeInstanceOf(Float32Array);
      expect(mesh.normals).toBeInstanceOf(Float32Array);
      expect(mesh.indices).toBeInstanceOf(Uint16Array);
      expect(mesh.uvs).toBeInstanceOf(Float32Array);
      expect(mesh.materialData).toEqual(mockGeometryData.materialData);
    });

    it('should handle null geometry data gracefully', () => {
      const geometryWithNulls: MeshGeometryData = {
        name: 'empty-mesh',
        positions: null,
        normals: null,
        indices: null,
        uvs: null,
        materialData: null
      };
      
      const mesh = convertGeometryToMesh(geometryWithNulls);
      
      expect(mesh.name).toBe('empty-mesh');
      expect(mesh.positions).toBeNull();
      expect(mesh.normals).toBeNull();
      expect(mesh.indices).toBeNull();
      expect(mesh.uvs).toBeNull();
      expect(mesh.materialData).toBeNull();
    });
  });
  describe('convertResultToMeshes', () => {
    it('should convert successful result with single mesh', () => {
      const result = createPipelineSuccess(mockGeometryData);
      const meshes = convertResultToMeshes(result);
      
      expect(meshes).toHaveLength(1);
      expect(meshes[0]?.name).toBe('test-cube');
    });

    it('should convert successful result with multiple meshes', () => {
      const geometryArray = [
        { ...mockGeometryData, name: 'mesh1' },
        { ...mockGeometryData, name: 'mesh2' }
      ];
      const result = createPipelineSuccess(geometryArray);
      const meshes = convertResultToMeshes(result);
      
      expect(meshes).toHaveLength(2);
      expect(meshes[0]?.name).toBe('mesh1');
      expect(meshes[1]?.name).toBe('mesh2');
    });

    it('should return empty array for failed result', () => {
      const result = createPipelineFailure<MeshGeometryData>('Processing failed');
      const meshes = convertResultToMeshes(result);
      
      expect(meshes).toHaveLength(0);
    });

    it('should return empty array for successful result with null value', () => {
      const result = { success: true as const, value: null as MeshGeometryData | null };
      const meshes = convertResultToMeshes(result as any);
      
      expect(meshes).toHaveLength(0);
    });
  });

  describe('isValidGeometryData', () => {
    it('should validate correct geometry data', () => {
      expect(isValidGeometryData(mockGeometryData)).toBe(true);
    });

    it('should reject geometry without name', () => {
      const invalidGeometry = { ...mockGeometryData, name: '' };
      expect(isValidGeometryData(invalidGeometry)).toBe(false);
    });

    it('should reject geometry without positions', () => {
      const invalidGeometry = { ...mockGeometryData, positions: null };
      expect(isValidGeometryData(invalidGeometry)).toBe(false);
    });

    it('should reject geometry with empty positions', () => {
      const invalidGeometry = { ...mockGeometryData, positions: [] };
      expect(isValidGeometryData(invalidGeometry)).toBe(false);
    });

    it('should reject geometry with invalid position count', () => {
      const invalidGeometry = { ...mockGeometryData, positions: [0, 0] }; // Not divisible by 3
      expect(isValidGeometryData(invalidGeometry)).toBe(false);
    });

    it('should reject geometry with invalid indices', () => {
      const invalidGeometry = { 
        ...mockGeometryData, 
        indices: [0, 1, 100] // Index 100 doesn't exist in positions
      };
      expect(isValidGeometryData(invalidGeometry)).toBe(false);
    });
  });

  describe('getMeshStats', () => {
    it('should calculate mesh statistics correctly', () => {
      const mesh = convertGeometryToMesh(mockGeometryData);
      const stats = getMeshStats(mesh);
      
      expect(stats.vertexCount).toBe(4); // 12 positions / 3 = 4 vertices
      expect(stats.triangleCount).toBe(2); // 6 indices / 3 = 2 triangles
      expect(stats.hasNormals).toBe(true);
      expect(stats.hasUVs).toBe(true);
      expect(stats.hasMaterial).toBe(true);
    });

    it('should handle mesh without optional data', () => {
      const minimalGeometry: MeshGeometryData = {
        name: 'minimal',
        positions: [0, 0, 0, 1, 0, 0, 1, 1, 0],
        normals: null,
        indices: null,
        uvs: null,
        materialData: null
      };
      
      const mesh = convertGeometryToMesh(minimalGeometry);
      const stats = getMeshStats(mesh);
      
      expect(stats.vertexCount).toBe(3);
      expect(stats.triangleCount).toBe(0);
      expect(stats.hasNormals).toBe(false);
      expect(stats.hasUVs).toBe(false);
      expect(stats.hasMaterial).toBe(false);
    });
  });
});
