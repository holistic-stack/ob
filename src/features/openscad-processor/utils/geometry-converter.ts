/**
 * @file Geometry Converter
 * 
 * Pure functions for converting geometry data to processed meshes.
 * Following DRY and SOLID principles.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import type { PipelineResult } from '../../openscad-pipeline/core/pipeline-processor';
import type * as THREE from 'three';
import type { ProcessedMesh } from '../types/processing-types';

/**
 * Pure function to convert THREE.Mesh to processed mesh
 * 
 * @param mesh - THREE.Mesh from the pipeline
 * @returns Processed mesh ready for Babylon.js
 */
export const convertThreeMeshToProcessedMesh = (mesh: THREE.Mesh): ProcessedMesh => {
    const geometry = mesh.geometry;
    const material = mesh.material as THREE.MeshStandardMaterial; // Assuming standard material

    return {
        name: mesh.name,
        positions: geometry.attributes.position ? (geometry.attributes.position.array as Float32Array) : null,
        normals: geometry.attributes.normal ? (geometry.attributes.normal.array as Float32Array) : null,
        indices: geometry.index ? (geometry.index.array as Uint16Array) : null,
        uvs: geometry.attributes.uv ? (geometry.attributes.uv.array as Float32Array) : null,
        materialData: material ? {
            diffuseColor: [material.color.r, material.color.g, material.color.b],
            specularColor: [0,0,0], // MeshStandardMaterial doesn't have specular color directly
            emissiveColor: material.emissive ? [material.emissive.r, material.emissive.g, material.emissive.b] : [0,0,0],
        } : null
    };
};

/**
 * Pure function to convert result to meshes array
 * 
 * @param result - Pipeline processing result
 * @returns Array of processed meshes
 */
export const convertResultToMeshes = (
  result: PipelineResult
): readonly ProcessedMesh[] => {
  if (!result.success || !result.meshes) {
    return [];
  }

  return result.meshes.map(convertThreeMeshToProcessedMesh);
};

/**
 * Pure function to validate geometry data
 * 
 * @param mesh - THREE.Mesh to validate
 * @returns True if valid, false otherwise
 */
export const isValidGeometryData = (mesh: THREE.Mesh): boolean => {
  if (!mesh.name) return false;
  const geometry = mesh.geometry;
  if (!geometry.attributes.position || (geometry.attributes.position.array as Float32Array).length === 0) return false;
  
  // Positions should be in groups of 3 (x, y, z)
  if ((geometry.attributes.position.array as Float32Array).length % 3 !== 0) return false;
  
  // If indices exist, they should be valid
  const positionCount = geometry.attributes.position.count;
  if (geometry.index && Array.from(geometry.index.array).some((i: number) => i < 0 || i >= positionCount)) {
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
