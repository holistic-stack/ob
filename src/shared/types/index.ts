/**
 * @file Shared Types Index
 * 
 * Central export point for all shared types in the application.
 * Provides a clean API for importing types throughout the codebase.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

// ============================================================================
// Branded Types
// ============================================================================

export type {
  // Core branded type utilities
  Branded,
  UnBrand,
  IsBranded,
  
  // Entity identifiers
  EngineId,
  SceneId,
  MeshId,
  MaterialId,
  CameraId,
  LightId,
  TextureId,
  
  // OpenSCAD pipeline identifiers
  ASTNodeId,
  CSGOperationId,
  GeometryId,
  ParseSessionId,
  
  // Measurement units
  Millimeters,
  Radians,
  Degrees,
  Milliseconds,
  Percentage,
  Normalized,
  
  // Color types
  HexColor,
  RGBColor,
  RGBAColor,
  HSLColor,
  
  // File system types
  AbsolutePath,
  RelativePath,
  FileExtension,
  MimeType,
  
  // Network types
  URL,
  EmailAddress,
  IPAddress,
} from './branded-types';

export {
  // Factory functions
  createBranded,
  unBrand,
  createEngineId,
  createSceneId,
  createMeshId,
  createMaterialId,
  
  // Validation functions
  isValidHexColor,
  isValidEmail,
  isValidURL,
  isValidPercentage,
  isValidNormalized,
  
  // Safe factory functions
  createHexColor,
  createEmailAddress,
  createURL,
  createPercentage,
  createNormalized,
  
  // Type guards
  isBrandedType,
  isEngineId,
  isSceneId,
  isMeshId,
  
  // Serialization
  serializeBranded,
  deserializeBranded,
} from './branded-types';

// ============================================================================
// State Types
// ============================================================================

export type {
  // Core async patterns
  AsyncState,
  ResourceState,
  OperationState,
  
  // Engine state
  EngineState,
  EngineCapabilities,
  EngineError,
  
  // Scene state
  SceneState,
  SceneMetadata,
  SceneUpdateType,
  SceneError,
  
  // Mesh state
  MeshState,
  MeshGeometry,
  BoundingBox,
  MeshUpdateType,
  MeshError,
  
  // OpenSCAD pipeline state
  ParseState,
  ParseStage,
  ParseError,
  CSGState,
  CSGOperation,
  CSGError,
  
  // Application state
  ApplicationState,
  UIState,
  ViewType,
  ThemeType,
  
  // State utilities
  StateStatus,
  StateData,
  StateError,
  IsLoadingState,
  IsSuccessState,
  IsErrorState,
} from './state-types';

// ============================================================================
// Result Types
// ============================================================================

export type {
  // Core types
  Result,
  Option,
  AsyncResult,
} from './result-types';

export {
  // Result constructors
  Ok,
  Err,
  Some,
  None,
  
  // Result utilities
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  unwrapErr,
  
  // Result transformations
  map,
  mapErr,
  flatMap,
  flatMapErr,
  apply,
  
  // Option utilities
  isSome,
  isNone,
  unwrapOption,
  unwrapOptionOr,
  unwrapOptionOrElse,
  
  // Option transformations
  mapOption,
  flatMapOption,
  filterOption,
  
  // Conversions
  fromNullable,
  toNullable,
  resultToOption,
  optionToResult,
  
  // Async utilities
  AsyncOk,
  AsyncErr,
  mapAsync,
  flatMapAsync,
  tryCatch,
  tryCatchSync,
  
  // Combinators
  all,
  any,
  partition,
  
  // Pipeline functions
  pipe,
  pipeResult,
} from './result-types';

// ============================================================================
// Validation Types
// ============================================================================

export type {
  // Core validation types
  ValidationError,
  ValidationErrorCode,
  ValidationResult,
  Validator,
  Schema,
  ValidationOptions,
} from './validation-types';

export {
  // Basic validators
  string,
  number,
  boolean,
  array,
  object,
  
  // Constraint validators
  required,
  optional,
  stringLength,
  numberRange,
  pattern,
  oneOf,
  
  // Composite validators
  and,
  or,
  custom,
  
  // Utility functions
  validate,
  transform,
  formatValidationErrors,
  isValidationSuccess,
  isValidationError,
} from './validation-types';

// ============================================================================
// Re-export Common Patterns (using imported types)
// ============================================================================

/**
 * Common Result type for string errors
 */
export type StringResult<T> = import('./result-types').Result<T, string>;

/**
 * Common Result type for validation errors
 */
export type ValidatedResult<T> = import('./result-types').Result<T, import('./validation-types').ValidationError[]>;

/**
 * Common async operation result
 */
export type AsyncOperation<T> = import('./result-types').AsyncResult<T, string>;

/**
 * Common entity creation result
 */
export type EntityResult<T, Id> = import('./result-types').Result<T & { id: Id }, string>;

/**
 * Common state update result
 */
export type StateUpdateResult<T> = import('./result-types').Result<T, { message: string; code: string }>;

// ============================================================================
// Type Utilities
// ============================================================================

/**
 * Make all properties of T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make all properties of T readonly recursively
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Extract keys of T that are of type U
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Make specific properties of T required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties of T optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract function parameter types
 */
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

/**
 * Extract function return type
 */
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;

/**
 * Extract promise value type
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Non-nullable type
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Extract array element type
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * Create a union of all values in an object
 */
export type ValueOf<T> = T[keyof T];

/**
 * Create a type that requires at least one property from T
 */
export type AtLeastOne<T> = {
  [K in keyof T]: Pick<T, K> & Partial<Omit<T, K>>;
}[keyof T];

/**
 * Create a type that allows exactly one property from T
 */
export type ExactlyOne<T> = {
  [K in keyof T]: Pick<T, K> & Partial<Record<Exclude<keyof T, K>, never>>;
}[keyof T];

// ============================================================================
// All type utilities are exported inline above where they are defined
// ============================================================================
