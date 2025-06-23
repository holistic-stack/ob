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
import * as THREE from 'three';
import {
  convertThreeMeshToProcessedMesh,
  convertResultToMeshes,
  isValidGeometryData,
  getMeshStats,
} from './geometry-converter';
import type { PipelineResult } from '../../openscad-pipeline/core/pipeline-processor';

describe('Geometry Converter (Pure Functions)', () => {
  const createMockMesh = (name: string): THREE.Mesh => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 1, 1]), 3));
    const material = new THREE.MeshStandardMaterial({ color: 'red' });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    return mesh;
  };

  const mockMesh = createMockMesh('test-cube');

  describe('convertThreeMeshToProcessedMesh', () => {
    it('should convert THREE.Mesh to processed mesh', () => {
      const processedMesh = convertThreeMeshToProcessedMesh(mockMesh);

      expect(processedMesh.name).toBe('test-cube');
      expect(processedMesh.positions).toBeInstanceOf(Float32Array);
      expect(processedMesh.materialData).not.toBeNull();
    });
  });

  describe('convertResultToMeshes', () => {
    it('should convert successful result with meshes', () => {
      const result: PipelineResult = {
        success: true,
        meshes: [mockMesh, createMockMesh('mesh2')],
        ast: undefined,
        csgTree: undefined,
        r3fResult: undefined,
        scene: undefined,
        errors: [],
        warnings: [],
        metrics: {} as any,
      };
      const meshes = convertResultToMeshes(result);

      expect(meshes).toHaveLength(2);
      expect(meshes[0]?.name).toBe('test-cube');
      expect(meshes[1]?.name).toBe('mesh2');
    });

    it('should return empty array for failed result', () => {
      const result: PipelineResult = {
        success: false,
        meshes: [],
        ast: undefined,
        csgTree: undefined,
        r3fResult: undefined,
        scene: undefined,
        errors: [{ stage: 'parsing', message: 'error', code: 'ERROR', severity: 'error' }],
        warnings: [],
        metrics: {} as any,
      };
      const meshes = convertResultToMeshes(result);
      expect(meshes).toHaveLength(0);
    });
  });

  describe('isValidGeometryData', () => {
    it('should return true for valid mesh', () => {
      expect(isValidGeometryData(mockMesh)).toBe(true);
    });

    it('should return false for mesh with no name', () => {
      const mesh = createMockMesh('');
      mesh.name = '';
      expect(isValidGeometryData(mesh)).toBe(false);
    });

    it('should return false for mesh with no positions', () => {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.MeshStandardMaterial();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'no-positions';
        expect(isValidGeometryData(mesh)).toBe(false);
    });
  });

  describe('getMeshStats', () => {
    it('should return correct stats for a processed mesh', () => {
      const processedMesh = convertThreeMeshToProcessedMesh(mockMesh);
      const stats = getMeshStats(processedMesh);

      expect(stats.vertexCount).toBe(2);
      expect(stats.triangleCount).toBe(0); // No indices
      expect(stats.hasNormals).toBe(false);
    });
  });
});
