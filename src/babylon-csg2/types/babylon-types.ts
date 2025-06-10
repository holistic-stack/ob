/**
 * @file Babylon.js type definitions and utilities for CSG2 operations
 * 
 * This module provides TypeScript type definitions and utilities for working
 * with Babylon.js CSG2 operations, following functional programming principles
 * with immutable data structures and strict type safety.
 * 
 * @example
 * ```typescript
 * import { BabylonCSG2Operation, createBabylonMeshConfig } from './babylon-types.js';
 * 
 * const config = createBabylonMeshConfig({
 *   name: 'cube',
 *   material: standardMaterial,
 *   position: [0, 0, 0]
 * });
 * ```
 */

import type {
  Scene,
  Mesh,
  Material,
  CSG2,
  NullEngine,
  Engine
} from '@babylonjs/core';

// Import Vector3 as value for runtime usage
import { Vector3 } from '@babylonjs/core';

/**
 * Babylon.js CSG2 operation types
 */
export type BabylonCSG2OperationType = 
  | 'union'
  | 'subtract' 
  | 'intersect';

/**
 * Babylon.js primitive mesh types that can be created
 */
export type BabylonPrimitiveType =
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'plane'
  | 'ground'
  | 'torus'
  | 'polyhedron';

/**
 * Configuration for creating Babylon.js meshes
 */
export interface BabylonMeshConfig {
  readonly name: string;
  readonly material?: Material | undefined;
  readonly position?: readonly [number, number, number] | undefined;
  readonly rotation?: readonly [number, number, number] | undefined;
  readonly scaling?: readonly [number, number, number] | undefined;
  readonly visible?: boolean | undefined;
}

/**
 * Configuration for Babylon.js primitive creation
 */
export interface BabylonPrimitiveConfig extends BabylonMeshConfig {
  readonly type: BabylonPrimitiveType;
  readonly parameters: Readonly<Record<string, unknown>>;
}

/**
 * CSG2 operation configuration
 */
export interface BabylonCSG2Operation {
  readonly type: BabylonCSG2OperationType;
  readonly meshes: readonly Mesh[];
  readonly resultName: string;
  readonly material?: Material | undefined;
}

/**
 * Scene configuration for Babylon.js
 */
export interface BabylonSceneConfig {
  readonly engine: Engine | NullEngine;
  readonly enablePhysics?: boolean;
  readonly enableAudio?: boolean;
  readonly clearColor?: readonly [number, number, number, number];
}

/**
 * Camera configuration
 */
export interface BabylonCameraConfig {
  readonly type: 'arc' | 'free' | 'universal';
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly radius?: number;
  readonly alpha?: number;
  readonly beta?: number;
}

/**
 * Lighting configuration
 */
export interface BabylonLightConfig {
  readonly type: 'hemispheric' | 'directional' | 'point' | 'spot';
  readonly direction?: readonly [number, number, number];
  readonly position?: readonly [number, number, number];
  readonly intensity?: number;
  readonly diffuse?: readonly [number, number, number];
  readonly specular?: readonly [number, number, number];
}

/**
 * Material configuration
 */
export interface BabylonMaterialConfig {
  readonly type: 'standard' | 'pbr' | 'node';
  readonly name: string;
  readonly diffuseColor?: readonly [number, number, number];
  readonly specularColor?: readonly [number, number, number];
  readonly emissiveColor?: readonly [number, number, number];
  readonly ambientColor?: readonly [number, number, number];
  readonly alpha?: number;
  readonly roughness?: number;
  readonly metallic?: number;
}

/**
 * Result type for Babylon.js operations
 */
export type BabylonResult<T, E = Error> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * Helper function to create successful Babylon.js result
 */
export function createBabylonSuccess<T>(data: T): BabylonResult<T> {
  return Object.freeze({ success: true, data });
}

/**
 * Helper function to create failed Babylon.js result
 */
export function createBabylonFailure<T>(error: Error): BabylonResult<T> {
  return Object.freeze({ success: false, error });
}

/**
 * Factory function to create Babylon.js mesh configuration
 */
export function createBabylonMeshConfig(config: Partial<BabylonMeshConfig> & { name: string }): BabylonMeshConfig {
  return Object.freeze({
    name: config.name,
    material: config.material,
    position: config.position ?? ([0, 0, 0] as const),
    rotation: config.rotation ?? ([0, 0, 0] as const),
    scaling: config.scaling ?? ([1, 1, 1] as const),
    visible: config.visible ?? true
  });
}

/**
 * Factory function to create Babylon.js primitive configuration
 */
export function createBabylonPrimitiveConfig(
  type: BabylonPrimitiveType,
  parameters: Record<string, unknown>,
  meshConfig: Partial<BabylonMeshConfig> & { name: string }
): BabylonPrimitiveConfig {
  return Object.freeze({
    type,
    parameters: Object.freeze({ ...parameters }),
    ...createBabylonMeshConfig(meshConfig)
  });
}

/**
 * Factory function to create CSG2 operation configuration
 */
export function createBabylonCSG2Operation(
  type: BabylonCSG2OperationType,
  meshes: readonly Mesh[],
  resultName: string,
  material?: Material
): BabylonCSG2Operation {
  return Object.freeze({
    type,
    meshes: Object.freeze([...meshes]),
    resultName,
    material
  });
}

/**
 * Type guard to check if a value is a valid Vector3-like array
 */
export function isVector3Array(value: unknown): value is readonly [number, number, number] {
  return Array.isArray(value) && 
         value.length === 3 && 
         value.every(v => typeof v === 'number');
}

/**
 * Type guard to check if a value is a valid Vector4-like array
 */
export function isVector4Array(value: unknown): value is readonly [number, number, number, number] {
  return Array.isArray(value) && 
         value.length === 4 && 
         value.every(v => typeof v === 'number');
}

/**
 * Utility to convert array to Vector3
 */
export function arrayToVector3(arr: readonly [number, number, number]): Vector3 {
  return new Vector3(arr[0], arr[1], arr[2]);
}

/**
 * Utility to convert Vector3 to array
 */
export function vector3ToArray(vector: Vector3): readonly [number, number, number] {
  return Object.freeze([vector.x, vector.y, vector.z]);
}
