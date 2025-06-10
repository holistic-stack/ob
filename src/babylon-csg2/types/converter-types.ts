/**
 * @file Converter type definitions for OpenSCAD to Babylon.js pipeline
 * 
 * This module provides TypeScript type definitions for the conversion pipeline
 * between OpenSCAD AST nodes and Babylon.js CSG2 operations, following
 * functional programming principles with immutable data structures.
 * 
 * @example
 * ```typescript
 * import { ConversionContext, ConverterResult } from './converter-types.js';
 * 
 * const context = createConversionContext(scene, errorHandler);
 * const result = await convertPrimitive(astNode, context);
 * ```
 */

import type { Scene, Mesh, Material, Engine } from '@babylonjs/core';
import type { ASTNode, SourceLocation } from '@holistic-stack/openscad-parser';
import type { 
  OpenSCADOperationNode,
  ConversionResult 
} from './openscad-types.js';
import type { 
  BabylonMeshConfig,
  BabylonResult 
} from './babylon-types.js';

/**
 * Error types that can occur during conversion
 */
export type ConversionErrorType =
  | 'unsupported_operation'
  | 'invalid_parameters'
  | 'babylon_error'
  | 'csg_operation_failed'
  | 'resource_error'
  | 'validation_error';

/**
 * Detailed conversion error information
 */
export interface ConversionError {
  readonly type: ConversionErrorType;
  readonly message: string;
  readonly location?: SourceLocation | undefined;
  readonly astNode?: ASTNode | undefined;
  readonly cause?: Error | undefined;
  readonly context?: string | undefined;
}

/**
 * Conversion context containing shared resources and configuration
 */
export interface ConversionContext {
  readonly scene: Scene;
  readonly engine: Engine;
  readonly defaultMaterial: Material;
  readonly errorHandler: ConversionErrorHandler;
  readonly options: ConversionOptions;
  readonly meshCache: ReadonlyMap<string, Mesh>;
  readonly materialCache: ReadonlyMap<string, Material>;
}

/**
 * Configuration options for the conversion process
 */
export interface ConversionOptions {
  readonly enableCSG: boolean;
  readonly enableOptimization: boolean;
  readonly maxRecursionDepth: number;
  readonly defaultMeshQuality: 'low' | 'medium' | 'high';
  readonly enableCaching: boolean;
  readonly enableLogging: boolean;
  readonly performanceMode: boolean;
}

/**
 * Error handler interface for conversion operations
 */
export interface ConversionErrorHandler {
  readonly handleError: (error: ConversionError) => void;
  readonly handleWarning: (message: string, location?: SourceLocation) => void;
  readonly getErrors: () => readonly ConversionError[];
  readonly getWarnings: () => readonly string[];
  readonly hasErrors: () => boolean;
  readonly clear: () => void;
}

/**
 * Result type for converter operations
 */
export type ConverterResult<T> = ConversionResult<T, ConversionError>;

/**
 * Result type specifically for mesh conversion
 */
export type MeshConversionResult = ConverterResult<Mesh>;

/**
 * Result type for multiple mesh operations
 */
export type MeshArrayConversionResult = ConverterResult<readonly Mesh[]>;

/**
 * Converter interface for different types of OpenSCAD operations
 */
export interface OpenSCADConverter<T extends ASTNode> {
  readonly canConvert: (node: ASTNode) => node is T;
  readonly convert: (node: T, context: ConversionContext) => Promise<MeshConversionResult>;
  readonly priority: number;
}

/**
 * Registry for OpenSCAD converters
 */
export interface ConverterRegistry {
  readonly register: <T extends ASTNode>(converter: OpenSCADConverter<T>) => void;
  readonly getConverter: (node: ASTNode) => OpenSCADConverter<ASTNode> | null;
  readonly getConverters: () => readonly OpenSCADConverter<ASTNode>[];
}

/**
 * Performance metrics for conversion operations
 */
export interface ConversionMetrics {
  readonly startTime: number;
  readonly endTime?: number;
  readonly duration?: number;
  readonly nodesProcessed: number;
  readonly meshesCreated: number;
  readonly csgOperations: number;
  readonly errorsEncountered: number;
  readonly memoryUsage?: number;
}

/**
 * Conversion session containing all context and results
 */
export interface ConversionSession {
  readonly id: string;
  readonly context: ConversionContext;
  readonly metrics: ConversionMetrics;
  readonly results: readonly Mesh[];
  readonly errors: readonly ConversionError[];
  readonly warnings: readonly string[];
}

/**
 * Factory function to create conversion error
 */
export function createConversionError(
  type: ConversionErrorType,
  message: string,
  options?: {
    location?: SourceLocation;
    astNode?: ASTNode;
    cause?: Error;
    context?: string;
  }
): ConversionError {
  return Object.freeze({
    type,
    message,
    location: options?.location,
    astNode: options?.astNode,
    cause: options?.cause,
    context: options?.context
  });
}

/**
 * Factory function to create conversion context
 */
export function createConversionContext(
  scene: Scene,
  engine: Engine,
  defaultMaterial: Material,
  errorHandler: ConversionErrorHandler,
  options?: Partial<ConversionOptions>
): ConversionContext {
  const defaultOptions: ConversionOptions = {
    enableCSG: true,
    enableOptimization: true,
    maxRecursionDepth: 100,
    defaultMeshQuality: 'medium',
    enableCaching: true,
    enableLogging: false,
    performanceMode: false
  };

  return Object.freeze({
    scene,
    engine,
    defaultMaterial,
    errorHandler,
    options: Object.freeze({ ...defaultOptions, ...options }),
    meshCache: new Map(),
    materialCache: new Map()
  });
}

/**
 * Factory function to create conversion options
 */
export function createConversionOptions(options?: Partial<ConversionOptions>): ConversionOptions {
  const defaults: ConversionOptions = {
    enableCSG: true,
    enableOptimization: true,
    maxRecursionDepth: 100,
    defaultMeshQuality: 'medium',
    enableCaching: true,
    enableLogging: false,
    performanceMode: false
  };

  return Object.freeze({ ...defaults, ...options });
}

/**
 * Helper function to create successful converter result
 */
export function createConverterSuccess<T>(data: T): ConverterResult<T> {
  return Object.freeze({ success: true, data });
}

/**
 * Helper function to create failed converter result
 */
export function createConverterFailure<T>(error: ConversionError): ConverterResult<T> {
  return Object.freeze({ success: false, error });
}

/**
 * Type guard to check if a result is successful
 */
export function isConverterSuccess<T>(result: ConverterResult<T>): result is { success: true; data: T } {
  return result.success;
}

/**
 * Type guard to check if a result is a failure
 */
export function isConverterFailure<T>(result: ConverterResult<T>): result is { success: false; error: ConversionError } {
  return !result.success;
}
