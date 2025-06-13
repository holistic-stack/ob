/**
 * @file Geometry Converter
 * 
 * Pure functions for converting geometry data to processed meshes.
 * Following DRY and SOLID principles.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { MeshGeometryData, PipelineResult } from '../../../types/pipeline-types';
import { ProcessedMesh } from '../types/processing-types';

/**
 * Pure function to convert geometry data to processed mesh
 * 
 * @param geometryData - Raw geometry data from the pipeline
 * @returns Processed mesh ready for Babylon.js
 */
export const convertGeometryToMesh = (geometryData: MeshGeometryData): ProcessedMesh => ({
  name: geometryData.name,
  positions: geometryData.positions ? new Float32Array(geometryData.positions) : null,
  normals: geometryData.normals ? new Float32Array(geometryData.normals) : null,
  indices: geometryData.indices ? new Uint16Array(geometryData.indices) : null,
  uvs: geometryData.uvs ? new Float32Array(geometryData.uvs) : null,
  materialData: geometryData.materialData
});

/**
 * Pure function to convert result to meshes array
 * 
 * @param result - Pipeline processing result
 * @returns Array of processed meshes
 */
export const convertResultToMeshes = (
  result: PipelineResult<MeshGeometryData | MeshGeometryData[]>
): readonly ProcessedMesh[] => {
  if (!result.success || !result.value) {
    return [];
  }

  if (Array.isArray(result.value)) {
    return result.value.map(convertGeometryToMesh);
  }

  return [convertGeometryToMesh(result.value)];
};

/**
 * Pure function to validate geometry data
 * 
 * @param geometryData - Geometry data to validate
 * @returns True if valid, false otherwise
 */
export const isValidGeometryData = (geometryData: MeshGeometryData): boolean => {
  if (!geometryData.name) return false;
  if (!geometryData.positions || geometryData.positions.length === 0) return false;
  
  // Positions should be in groups of 3 (x, y, z)
  if (geometryData.positions.length % 3 !== 0) return false;
  
  // If indices exist, they should be valid
  if (geometryData.indices && geometryData.indices.some(i => i < 0 || i >= geometryData.positions!.length / 3)) {
    return false;
  }
  
  return true;
};

/**
 * Pure function to get mesh statistics
 * 
 * @param mesh - Processed mesh
 * @returns Mesh statistics
 */
export const getMeshStats = (mesh: ProcessedMesh) => ({
  vertexCount: mesh.positions ? mesh.positions.length / 3 : 0,
  triangleCount: mesh.indices ? mesh.indices.length / 3 : 0,
  hasNormals: mesh.normals !== null,
  hasUVs: mesh.uvs !== null,
  hasMaterial: mesh.materialData !== null
});
