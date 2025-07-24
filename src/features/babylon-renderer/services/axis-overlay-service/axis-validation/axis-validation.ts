/**
 * @file axis-validation.ts
 * @description Centralized validation utilities for 3D axis configuration
 * Follows SRP by handling only validation-related functionality
 */

import type { Scene } from '@babylonjs/core';
import { AxisErrorFactory, type AxisResult, AxisResultUtils } from '../axis-errors/axis-errors';
import { AxisColorUtils, type RGBColor } from '../axis-colors/axis-colors';
import { DEFAULT_AXIS_PARAMS, SCREEN_SPACE_CONSTANTS } from '../axis-constants/axis-constants';

/**
 * Validation configuration options
 */
export interface ValidationOptions {
  readonly strict?: boolean;
  readonly allowZero?: boolean;
  readonly customRanges?: {
    readonly pixelWidth?: readonly [number, number];
    readonly opacity?: readonly [number, number];
    readonly length?: readonly [number, number];
  };
}

/**
 * Default validation options
 */
export const DEFAULT_VALIDATION_OPTIONS: ValidationOptions = {
  strict: false,
  allowZero: false,
  customRanges: {
    pixelWidth: [SCREEN_SPACE_CONSTANTS.MIN_PIXEL_WIDTH, SCREEN_SPACE_CONSTANTS.MAX_PIXEL_WIDTH],
    opacity: [0, 1],
    length: [0.1, 10000],
  },
} as const;

/**
 * Core validation utilities
 */
export class AxisValidationUtils {
  /**
   * Validate that a value is a finite number
   */
  static isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  /**
   * Validate that a value is a positive number
   */
  static isPositiveNumber(value: unknown, allowZero = false): value is number {
    return this.isFiniteNumber(value) && (allowZero ? value >= 0 : value > 0);
  }

  /**
   * Validate that a value is within a specified range
   */
  static isInRange(
    value: number,
    min: number,
    max: number,
    inclusive = true
  ): boolean {
    return inclusive ? value >= min && value <= max : value > min && value < max;
  }

  /**
   * Validate that a value is a non-empty string
   */
  static isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * Validate that a value is a boolean
   */
  static isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
  }

  /**
   * Validate that a scene is valid and not null
   */
  static isValidScene(scene: unknown): scene is Scene {
    return (
      scene !== null &&
      scene !== undefined &&
      typeof scene === 'object' &&
      'dispose' in scene &&
      typeof (scene as any).dispose === 'function'
    );
  }

  /**
   * Validate RGB color values
   */
  static validateRgbColor(color: unknown): AxisResult<RGBColor> {
    if (!Array.isArray(color)) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createValidationError(
          'Color must be an array',
          'color',
          'color'
        )
      );
    }

    if (color.length !== 3) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createValidationError(
          'Color array must have exactly 3 elements',
          'color',
          'color'
        )
      );
    }

    const [r, g, b] = color;
    if (!this.isFiniteNumber(r) || !this.isFiniteNumber(g) || !this.isFiniteNumber(b)) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createValidationError(
          'Color values must be finite numbers',
          'color',
          'color'
        )
      );
    }

    const rgbColor: RGBColor = [r, g, b];
    if (!AxisColorUtils.isValidRgb(rgbColor)) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createValidationError(
          'Color values must be between 0 and 1',
          'color',
          'color'
        )
      );
    }

    return AxisResultUtils.success(rgbColor);
  }

  /**
   * Validate pixel width value
   */
  static validatePixelWidth(
    value: unknown,
    options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS
  ): AxisResult<number> {
    if (!this.isFiniteNumber(value)) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createValidationError(
          'Pixel width must be a finite number',
          'numeric',
          'pixelWidth'
        )
      );
    }

    if (!this.isPositiveNumber(value, options.allowZero)) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createValidationError(
          `Pixel width must be ${options.allowZero ? 'non-negative' : 'positive'}`,
          'numeric',
          'pixelWidth'
        )
      );
    }

    const [min, max] = options.customRanges?.pixelWidth || 
      [SCREEN_SPACE_CONSTANTS.MIN_PIXEL_WIDTH, SCREEN_SPACE_CONSTANTS.MAX_PIXEL_WIDTH];
    
    if (!this.isInRange(value, min, max)) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createValidationError(
          `Pixel width must be between ${min} and ${max}`,
          'numeric',
          'pixelWidth'
        )
      );
    }

    return AxisResultUtils.success(value);
  }

  /**
   * Validate opacity value
   */
  static validateOpacity(
    value: unknown,
    options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS
  ): AxisResult<number> {
    if (!this.isFiniteNumber(value)) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createValidationError(
          'Opacity must be a finite number',
          'numeric',
          'opacity'
        )
      );
    }

    const [min, max] = options.customRanges?.opacity || [0, 1];
    
    if (!this.isInRange(value, min, max)) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createValidationError(
          `Opacity must be between ${min} and ${max}`,
          'numeric',
          'opacity'
        )
      );
    }

    return AxisResultUtils.success(value);
  }

  /**
   * Validate axis length value
   */
  static validateAxisLength(
    value: unknown,
    options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS
  ): AxisResult<number> {
    if (!this.isFiniteNumber(value)) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createValidationError(
          'Axis length must be a finite number',
          'numeric',
          'length'
        )
      );
    }

    if (!this.isPositiveNumber(value, options.allowZero)) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createValidationError(
          `Axis length must be ${options.allowZero ? 'non-negative' : 'positive'}`,
          'numeric',
          'length'
        )
      );
    }

    const [min, max] = options.customRanges?.length || [0.1, 10000];
    
    if (!this.isInRange(value, min, max)) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createValidationError(
          `Axis length must be between ${min} and ${max}`,
          'numeric',
          'length'
        )
      );
    }

    return AxisResultUtils.success(value);
  }

  /**
   * Validate scene object
   */
  static validateScene(scene: unknown): AxisResult<Scene> {
    if (!this.isValidScene(scene)) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createValidationError(
          'Invalid or null scene provided',
          'scene',
          'scene'
        )
      );
    }

    return AxisResultUtils.success(scene);
  }

  /**
   * Validate resolution array
   */
  static validateResolution(resolution: unknown): AxisResult<readonly [number, number]> {
    if (!Array.isArray(resolution)) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createValidationError(
          'Resolution must be an array',
          'numeric',
          'resolution'
        )
      );
    }

    if (resolution.length !== 2) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createValidationError(
          'Resolution array must have exactly 2 elements',
          'numeric',
          'resolution'
        )
      );
    }

    const [width, height] = resolution;
    if (!this.isPositiveNumber(width) || !this.isPositiveNumber(height)) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createValidationError(
          'Resolution values must be positive numbers',
          'numeric',
          'resolution'
        )
      );
    }

    return AxisResultUtils.success([width, height] as const);
  }
}

/**
 * Configuration validation utilities
 */
export class AxisConfigValidation {
  /**
   * Validate a complete axis configuration object
   */
  static validateAxisConfig(
    config: unknown,
    options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS
  ): AxisResult<Record<string, unknown>> {
    if (typeof config !== 'object' || config === null) {
      return AxisResultUtils.failure(
        AxisErrorFactory.createConfigurationError(
          'Configuration must be an object',
          'config',
          config,
          'object'
        )
      );
    }

    const configObj = config as Record<string, unknown>;
    const validatedConfig: Record<string, unknown> = {};

    // Validate each known property
    for (const [key, value] of Object.entries(configObj)) {
      const validationResult = this.validateConfigProperty(key, value, options);
      if (!AxisResultUtils.isSuccess(validationResult)) {
        return validationResult;
      }
      validatedConfig[key] = validationResult.data;
    }

    return AxisResultUtils.success(validatedConfig);
  }

  /**
   * Validate a single configuration property
   */
  private static validateConfigProperty(
    key: string,
    value: unknown,
    options: ValidationOptions
  ): AxisResult<unknown> {
    switch (key) {
      case 'pixelWidth':
        return AxisValidationUtils.validatePixelWidth(value, options);
      case 'opacity':
        return AxisValidationUtils.validateOpacity(value, options);
      case 'length':
        return AxisValidationUtils.validateAxisLength(value, options);
      case 'visible':
        if (!AxisValidationUtils.isBoolean(value)) {
          return AxisResultUtils.failure(
            AxisErrorFactory.createConfigurationError(
              'Visible property must be a boolean',
              key,
              value,
              'boolean'
            )
          );
        }
        return AxisResultUtils.success(value);
      case 'colors':
        if (typeof value === 'object' && value !== null) {
          // Validate color object properties
          const colorObj = value as Record<string, unknown>;
          for (const [colorKey, colorValue] of Object.entries(colorObj)) {
            const colorResult = AxisValidationUtils.validateRgbColor(colorValue);
            if (!AxisResultUtils.isSuccess(colorResult)) {
              return AxisResultUtils.failure(
                AxisErrorFactory.createConfigurationError(
                  `Invalid color for ${colorKey}`,
                  `colors.${colorKey}`,
                  colorValue,
                  'RGB array'
                )
              );
            }
          }
        }
        return AxisResultUtils.success(value);
      default:
        // Allow unknown properties in non-strict mode
        if (options.strict) {
          return AxisResultUtils.failure(
            AxisErrorFactory.createConfigurationError(
              `Unknown configuration property: ${key}`,
              key,
              value
            )
          );
        }
        return AxisResultUtils.success(value);
    }
  }

  /**
   * Sanitize and provide defaults for configuration
   */
  static sanitizeConfig(
    config: Record<string, unknown>
  ): Record<string, unknown> {
    const sanitized = { ...config };

    // Provide defaults for missing values
    if (sanitized.pixelWidth === undefined) {
      sanitized.pixelWidth = DEFAULT_AXIS_PARAMS.PIXEL_WIDTH;
    }
    if (sanitized.opacity === undefined) {
      sanitized.opacity = DEFAULT_AXIS_PARAMS.OPACITY;
    }
    if (sanitized.length === undefined) {
      sanitized.length = DEFAULT_AXIS_PARAMS.LENGTH;
    }
    if (sanitized.visible === undefined) {
      sanitized.visible = true;
    }

    // Clamp values to valid ranges
    if (typeof sanitized.pixelWidth === 'number') {
      sanitized.pixelWidth = Math.max(
        SCREEN_SPACE_CONSTANTS.MIN_PIXEL_WIDTH,
        Math.min(SCREEN_SPACE_CONSTANTS.MAX_PIXEL_WIDTH, sanitized.pixelWidth)
      );
    }

    if (typeof sanitized.opacity === 'number') {
      sanitized.opacity = Math.max(0, Math.min(1, sanitized.opacity));
    }

    return sanitized;
  }
}