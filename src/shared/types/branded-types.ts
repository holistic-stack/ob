/**
 * @file Branded Types - Type-Safe Identifiers
 * 
 * Branded types provide compile-time type safety for primitive values
 * that should not be interchangeable, preventing common bugs like
 * mixing up different ID types or measurement units.
 * 
 * Features:
 * - Type-safe identifiers for entities
 * - Compile-time prevention of value mixing
 * - Runtime validation with factory functions
 * - Serialization/deserialization support
 * - Integration with existing APIs
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

// ============================================================================
// Core Branded Type Infrastructure
// ============================================================================

/**
 * Base branded type utility
 * Creates a unique type that wraps a primitive value
 */
export type Branded<T, Brand extends string> = T & { readonly __brand: Brand };

/**
 * Extract the underlying type from a branded type
 */
export type UnBrand<T> = T extends Branded<infer U, any> ? U : T;

/**
 * Check if a value is of a specific branded type
 */
export type IsBranded<T, Brand extends string> = T extends Branded<any, Brand> ? true : false;

// ============================================================================
// Entity Identifiers
// ============================================================================

/**
 * Unique identifier for Babylon.js engines
 */
export type EngineId = Branded<string, 'EngineId'>;

/**
 * Unique identifier for Babylon.js scenes
 */
export type SceneId = Branded<string, 'SceneId'>;

/**
 * Unique identifier for Babylon.js meshes
 */
export type MeshId = Branded<string, 'MeshId'>;

/**
 * Unique identifier for materials
 */
export type MaterialId = Branded<string, 'MaterialId'>;

/**
 * Unique identifier for cameras
 */
export type CameraId = Branded<string, 'CameraId'>;

/**
 * Unique identifier for lights
 */
export type LightId = Branded<string, 'LightId'>;

/**
 * Unique identifier for textures
 */
export type TextureId = Branded<string, 'TextureId'>;

// ============================================================================
// OpenSCAD Pipeline Identifiers
// ============================================================================

/**
 * Unique identifier for OpenSCAD AST nodes
 */
export type ASTNodeId = Branded<string, 'ASTNodeId'>;

/**
 * Unique identifier for CSG operations
 */
export type CSGOperationId = Branded<string, 'CSGOperationId'>;

/**
 * Unique identifier for geometry data
 */
export type GeometryId = Branded<string, 'GeometryId'>;

/**
 * Unique identifier for parsing sessions
 */
export type ParseSessionId = Branded<string, 'ParseSessionId'>;

// ============================================================================
// Measurement Units
// ============================================================================

/**
 * Distance measurement in millimeters
 */
export type Millimeters = Branded<number, 'Millimeters'>;

/**
 * Angle measurement in radians
 */
export type Radians = Branded<number, 'Radians'>;

/**
 * Angle measurement in degrees
 */
export type Degrees = Branded<number, 'Degrees'>;

/**
 * Time measurement in milliseconds
 */
export type Milliseconds = Branded<number, 'Milliseconds'>;

/**
 * Percentage value (0-100)
 */
export type Percentage = Branded<number, 'Percentage'>;

/**
 * Normalized value (0-1)
 */
export type Normalized = Branded<number, 'Normalized'>;

// ============================================================================
// Color Types
// ============================================================================

/**
 * Hex color string (e.g., "#FF0000")
 */
export type HexColor = Branded<string, 'HexColor'>;

/**
 * RGB color values (0-255)
 */
export type RGBColor = Branded<readonly [number, number, number], 'RGBColor'>;

/**
 * RGBA color values (0-255, 0-1 for alpha)
 */
export type RGBAColor = Branded<readonly [number, number, number, number], 'RGBAColor'>;

/**
 * HSL color values (0-360 for hue, 0-100 for saturation/lightness)
 */
export type HSLColor = Branded<readonly [number, number, number], 'HSLColor'>;

// ============================================================================
// File System Types
// ============================================================================

/**
 * Absolute file path
 */
export type AbsolutePath = Branded<string, 'AbsolutePath'>;

/**
 * Relative file path
 */
export type RelativePath = Branded<string, 'RelativePath'>;

/**
 * File extension (e.g., ".scad", ".js")
 */
export type FileExtension = Branded<string, 'FileExtension'>;

/**
 * MIME type (e.g., "application/json")
 */
export type MimeType = Branded<string, 'MimeType'>;

// ============================================================================
// Network Types
// ============================================================================

/**
 * URL string
 */
export type URL = Branded<string, 'URL'>;

/**
 * Email address
 */
export type EmailAddress = Branded<string, 'EmailAddress'>;

/**
 * IP address
 */
export type IPAddress = Branded<string, 'IPAddress'>;

// ============================================================================
// Factory Functions for Safe Construction
// ============================================================================

/**
 * Create a branded type with validation
 */
export const createBranded = <T, Brand extends string>(
  value: T,
  validator?: (value: T) => boolean,
  errorMessage?: string
): Branded<T, Brand> => {
  if (validator && !validator(value)) {
    throw new Error(errorMessage || `Invalid value for branded type: ${value}`);
  }
  return value as Branded<T, Brand>;
};

/**
 * Extract the raw value from a branded type
 */
export const unBrand = <T>(value: Branded<T, any>): T => {
  return value as T;
};

// ============================================================================
// Entity ID Factories
// ============================================================================

/**
 * Generate a unique engine ID
 */
export const createEngineId = (prefix = 'engine'): EngineId => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return createBranded<string, 'EngineId'>(`${prefix}_${timestamp}_${random}`);
};

/**
 * Generate a unique scene ID
 */
export const createSceneId = (prefix = 'scene'): SceneId => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return createBranded<string, 'SceneId'>(`${prefix}_${timestamp}_${random}`);
};

/**
 * Generate a unique mesh ID
 */
export const createMeshId = (prefix = 'mesh'): MeshId => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return createBranded<string, 'MeshId'>(`${prefix}_${timestamp}_${random}`);
};

/**
 * Generate a unique material ID
 */
export const createMaterialId = (prefix = 'material'): MaterialId => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return createBranded<string, 'MaterialId'>(`${prefix}_${timestamp}_${random}`);
};

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate hex color format
 */
export const isValidHexColor = (value: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
};

/**
 * Validate email address format
 */
export const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

/**
 * Validate URL format
 */
export const isValidURL = (value: string): boolean => {
  try {
    new globalThis.URL(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate percentage range (0-100)
 */
export const isValidPercentage = (value: number): boolean => {
  return value >= 0 && value <= 100;
};

/**
 * Validate normalized range (0-1)
 */
export const isValidNormalized = (value: number): boolean => {
  return value >= 0 && value <= 1;
};

// ============================================================================
// Safe Factory Functions with Validation
// ============================================================================

/**
 * Create a validated hex color
 */
export const createHexColor = (value: string): HexColor => {
  return createBranded<string, 'HexColor'>(
    value,
    isValidHexColor,
    `Invalid hex color format: ${value}`
  );
};

/**
 * Create a validated email address
 */
export const createEmailAddress = (value: string): EmailAddress => {
  return createBranded<string, 'EmailAddress'>(
    value,
    isValidEmail,
    `Invalid email address format: ${value}`
  );
};

/**
 * Create a validated URL
 */
export const createURL = (value: string): URL => {
  return createBranded<string, 'URL'>(
    value,
    isValidURL,
    `Invalid URL format: ${value}`
  );
};

/**
 * Create a validated percentage
 */
export const createPercentage = (value: number): Percentage => {
  return createBranded<number, 'Percentage'>(
    value,
    isValidPercentage,
    `Percentage must be between 0 and 100, got: ${value}`
  );
};

/**
 * Create a validated normalized value
 */
export const createNormalized = (value: number): Normalized => {
  return createBranded<number, 'Normalized'>(
    value,
    isValidNormalized,
    `Normalized value must be between 0 and 1, got: ${value}`
  );
};

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a branded type
 */
export const isBrandedType = <T, Brand extends string>(
  value: unknown,
  validator?: (value: unknown) => value is T
): value is Branded<T, Brand> => {
  return validator ? validator(value) : true;
};

/**
 * Type guard for engine IDs
 */
export const isEngineId = (value: unknown): value is EngineId => {
  return typeof value === 'string' && value.startsWith('engine_');
};

/**
 * Type guard for scene IDs
 */
export const isSceneId = (value: unknown): value is SceneId => {
  return typeof value === 'string' && value.startsWith('scene_');
};

/**
 * Type guard for mesh IDs
 */
export const isMeshId = (value: unknown): value is MeshId => {
  return typeof value === 'string' && value.startsWith('mesh_');
};

// ============================================================================
// Serialization Support
// ============================================================================

/**
 * Serialize a branded type to JSON
 */
export const serializeBranded = <T>(value: Branded<T, any>): T => {
  return unBrand(value);
};

/**
 * Deserialize a value to a branded type
 */
export const deserializeBranded = <T, Brand extends string>(
  value: T,
  validator?: (value: T) => boolean
): Branded<T, Brand> => {
  return createBranded<T, Brand>(value, validator);
};

// ============================================================================
// Export All Types and Utilities
// ============================================================================

export type {
  Branded,
  UnBrand,
  IsBranded,
  // Entity IDs
  EngineId,
  SceneId,
  MeshId,
  MaterialId,
  CameraId,
  LightId,
  TextureId,
  // Pipeline IDs
  ASTNodeId,
  CSGOperationId,
  GeometryId,
  ParseSessionId,
  // Measurements
  Millimeters,
  Radians,
  Degrees,
  Milliseconds,
  Percentage,
  Normalized,
  // Colors
  HexColor,
  RGBColor,
  RGBAColor,
  HSLColor,
  // File System
  AbsolutePath,
  RelativePath,
  FileExtension,
  MimeType,
  // Network
  URL,
  EmailAddress,
  IPAddress,
};
