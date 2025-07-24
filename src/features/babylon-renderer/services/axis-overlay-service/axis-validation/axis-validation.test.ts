/**
 * @file axis-validation.test.ts
 * @description Tests for axis validation module
 */

import { describe, expect, it, vi } from 'vitest';
import { AxisResultUtils } from '../axis-errors/axis-errors';
import {
  AxisConfigValidation,
  AxisValidationUtils,
  DEFAULT_VALIDATION_OPTIONS,
  type ValidationOptions,
} from './axis-validation';

// Mock Scene object for testing
const createMockScene = () => ({
  dispose: vi.fn(),
  // Add other scene properties as needed
});

describe('AxisValidation', () => {
  describe('AxisValidationUtils', () => {
    describe('isFiniteNumber', () => {
      it('should validate finite numbers', () => {
        expect(AxisValidationUtils.isFiniteNumber(42)).toBe(true);
        expect(AxisValidationUtils.isFiniteNumber(0)).toBe(true);
        expect(AxisValidationUtils.isFiniteNumber(-3.14)).toBe(true);
        expect(AxisValidationUtils.isFiniteNumber(1.23e-10)).toBe(true);
      });

      it('should reject non-finite values', () => {
        expect(AxisValidationUtils.isFiniteNumber(Infinity)).toBe(false);
        expect(AxisValidationUtils.isFiniteNumber(-Infinity)).toBe(false);
        expect(AxisValidationUtils.isFiniteNumber(NaN)).toBe(false);
        expect(AxisValidationUtils.isFiniteNumber('42')).toBe(false);
        expect(AxisValidationUtils.isFiniteNumber(null)).toBe(false);
        expect(AxisValidationUtils.isFiniteNumber(undefined)).toBe(false);
      });
    });

    describe('isPositiveNumber', () => {
      it('should validate positive numbers', () => {
        expect(AxisValidationUtils.isPositiveNumber(1)).toBe(true);
        expect(AxisValidationUtils.isPositiveNumber(0.1)).toBe(true);
        expect(AxisValidationUtils.isPositiveNumber(1000)).toBe(true);
      });

      it('should handle zero based on allowZero parameter', () => {
        expect(AxisValidationUtils.isPositiveNumber(0, false)).toBe(false);
        expect(AxisValidationUtils.isPositiveNumber(0, true)).toBe(true);
      });

      it('should reject negative numbers', () => {
        expect(AxisValidationUtils.isPositiveNumber(-1)).toBe(false);
        expect(AxisValidationUtils.isPositiveNumber(-0.1)).toBe(false);
        expect(AxisValidationUtils.isPositiveNumber(-1000)).toBe(false);
      });

      it('should reject non-numbers', () => {
        expect(AxisValidationUtils.isPositiveNumber('1')).toBe(false);
        expect(AxisValidationUtils.isPositiveNumber(null)).toBe(false);
        expect(AxisValidationUtils.isPositiveNumber(undefined)).toBe(false);
      });
    });

    describe('isInRange', () => {
      it('should validate values within range (inclusive)', () => {
        expect(AxisValidationUtils.isInRange(5, 0, 10, true)).toBe(true);
        expect(AxisValidationUtils.isInRange(0, 0, 10, true)).toBe(true);
        expect(AxisValidationUtils.isInRange(10, 0, 10, true)).toBe(true);
      });

      it('should validate values within range (exclusive)', () => {
        expect(AxisValidationUtils.isInRange(5, 0, 10, false)).toBe(true);
        expect(AxisValidationUtils.isInRange(0, 0, 10, false)).toBe(false);
        expect(AxisValidationUtils.isInRange(10, 0, 10, false)).toBe(false);
      });

      it('should reject values outside range', () => {
        expect(AxisValidationUtils.isInRange(-1, 0, 10)).toBe(false);
        expect(AxisValidationUtils.isInRange(11, 0, 10)).toBe(false);
      });
    });

    describe('isNonEmptyString', () => {
      it('should validate non-empty strings', () => {
        expect(AxisValidationUtils.isNonEmptyString('hello')).toBe(true);
        expect(AxisValidationUtils.isNonEmptyString('a')).toBe(true);
        expect(AxisValidationUtils.isNonEmptyString('  test  ')).toBe(true);
      });

      it('should reject empty or whitespace strings', () => {
        expect(AxisValidationUtils.isNonEmptyString('')).toBe(false);
        expect(AxisValidationUtils.isNonEmptyString('   ')).toBe(false);
        expect(AxisValidationUtils.isNonEmptyString('\t\n')).toBe(false);
      });

      it('should reject non-strings', () => {
        expect(AxisValidationUtils.isNonEmptyString(42)).toBe(false);
        expect(AxisValidationUtils.isNonEmptyString(null)).toBe(false);
        expect(AxisValidationUtils.isNonEmptyString(undefined)).toBe(false);
      });
    });

    describe('isBoolean', () => {
      it('should validate boolean values', () => {
        expect(AxisValidationUtils.isBoolean(true)).toBe(true);
        expect(AxisValidationUtils.isBoolean(false)).toBe(true);
      });

      it('should reject non-boolean values', () => {
        expect(AxisValidationUtils.isBoolean(1)).toBe(false);
        expect(AxisValidationUtils.isBoolean(0)).toBe(false);
        expect(AxisValidationUtils.isBoolean('true')).toBe(false);
        expect(AxisValidationUtils.isBoolean(null)).toBe(false);
      });
    });

    describe('isValidScene', () => {
      it('should validate scene objects', () => {
        const mockScene = createMockScene();
        expect(AxisValidationUtils.isValidScene(mockScene)).toBe(true);
      });

      it('should reject invalid scene objects', () => {
        expect(AxisValidationUtils.isValidScene(null)).toBe(false);
        expect(AxisValidationUtils.isValidScene(undefined)).toBe(false);
        expect(AxisValidationUtils.isValidScene({})).toBe(false);
        expect(AxisValidationUtils.isValidScene({ dispose: 'not a function' })).toBe(false);
      });
    });

    describe('validateRgbColor', () => {
      it('should validate correct RGB colors', () => {
        const result = AxisValidationUtils.validateRgbColor([1, 0, 0]);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);
        if (AxisResultUtils.isSuccess(result)) {
          expect(result.data).toEqual([1, 0, 0]);
        }
      });

      it('should validate RGB colors with decimal values', () => {
        const result = AxisValidationUtils.validateRgbColor([0.5, 0.7, 0.9]);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);
      });

      it('should reject non-array values', () => {
        const result = AxisValidationUtils.validateRgbColor('red');
        expect(AxisResultUtils.isFailure(result)).toBe(true);
      });

      it('should reject arrays with wrong length', () => {
        const result1 = AxisValidationUtils.validateRgbColor([1, 0]);
        const result2 = AxisValidationUtils.validateRgbColor([1, 0, 0, 1]);
        expect(AxisResultUtils.isFailure(result1)).toBe(true);
        expect(AxisResultUtils.isFailure(result2)).toBe(true);
      });

      it('should reject arrays with non-numeric values', () => {
        const result = AxisValidationUtils.validateRgbColor([1, 'green', 0]);
        expect(AxisResultUtils.isFailure(result)).toBe(true);
      });

      it('should reject arrays with out-of-range values', () => {
        const result1 = AxisValidationUtils.validateRgbColor([-0.1, 0, 0]);
        const result2 = AxisValidationUtils.validateRgbColor([1.1, 0, 0]);
        expect(AxisResultUtils.isFailure(result1)).toBe(true);
        expect(AxisResultUtils.isFailure(result2)).toBe(true);
      });
    });

    describe('validatePixelWidth', () => {
      it('should validate correct pixel width values', () => {
        const result = AxisValidationUtils.validatePixelWidth(2.0);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);
        if (AxisResultUtils.isSuccess(result)) {
          expect(result.data).toBe(2.0);
        }
      });

      it('should reject non-numeric values', () => {
        const result = AxisValidationUtils.validatePixelWidth('2');
        expect(AxisResultUtils.isFailure(result)).toBe(true);
      });

      it('should reject negative values', () => {
        const result = AxisValidationUtils.validatePixelWidth(-1);
        expect(AxisResultUtils.isFailure(result)).toBe(true);
      });

      it('should handle zero based on options', () => {
        const result1 = AxisValidationUtils.validatePixelWidth(0, { allowZero: false });
        const result2 = AxisValidationUtils.validatePixelWidth(0, { allowZero: true });
        expect(AxisResultUtils.isFailure(result1)).toBe(true);
        expect(AxisResultUtils.isFailure(result2)).toBe(true); // Still fails due to range check
      });

      it('should respect custom ranges', () => {
        const options: ValidationOptions = {
          customRanges: { pixelWidth: [5, 15] },
        };
        const result1 = AxisValidationUtils.validatePixelWidth(10, options);
        const result2 = AxisValidationUtils.validatePixelWidth(2, options);
        expect(AxisResultUtils.isSuccess(result1)).toBe(true);
        expect(AxisResultUtils.isFailure(result2)).toBe(true);
      });
    });

    describe('validateOpacity', () => {
      it('should validate correct opacity values', () => {
        const result = AxisValidationUtils.validateOpacity(0.5);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);
      });

      it('should validate boundary values', () => {
        const result1 = AxisValidationUtils.validateOpacity(0);
        const result2 = AxisValidationUtils.validateOpacity(1);
        expect(AxisResultUtils.isSuccess(result1)).toBe(true);
        expect(AxisResultUtils.isSuccess(result2)).toBe(true);
      });

      it('should reject out-of-range values', () => {
        const result1 = AxisValidationUtils.validateOpacity(-0.1);
        const result2 = AxisValidationUtils.validateOpacity(1.1);
        expect(AxisResultUtils.isFailure(result1)).toBe(true);
        expect(AxisResultUtils.isFailure(result2)).toBe(true);
      });
    });

    describe('validateAxisLength', () => {
      it('should validate correct length values', () => {
        const result = AxisValidationUtils.validateAxisLength(100);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);
      });

      it('should reject negative values', () => {
        const result = AxisValidationUtils.validateAxisLength(-10);
        expect(AxisResultUtils.isFailure(result)).toBe(true);
      });

      it('should respect custom ranges', () => {
        const options: ValidationOptions = {
          customRanges: { length: [10, 100] },
        };
        const result1 = AxisValidationUtils.validateAxisLength(50, options);
        const result2 = AxisValidationUtils.validateAxisLength(5, options);
        expect(AxisResultUtils.isSuccess(result1)).toBe(true);
        expect(AxisResultUtils.isFailure(result2)).toBe(true);
      });
    });

    describe('validateScene', () => {
      it('should validate correct scene objects', () => {
        const mockScene = createMockScene();
        const result = AxisValidationUtils.validateScene(mockScene);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);
      });

      it('should reject invalid scenes', () => {
        const result = AxisValidationUtils.validateScene(null);
        expect(AxisResultUtils.isFailure(result)).toBe(true);
      });
    });

    describe('validateResolution', () => {
      it('should validate correct resolution arrays', () => {
        const result = AxisValidationUtils.validateResolution([1920, 1080]);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);
        if (AxisResultUtils.isSuccess(result)) {
          expect(result.data).toEqual([1920, 1080]);
        }
      });

      it('should reject non-arrays', () => {
        const result = AxisValidationUtils.validateResolution('1920x1080');
        expect(AxisResultUtils.isFailure(result)).toBe(true);
      });

      it('should reject arrays with wrong length', () => {
        const result1 = AxisValidationUtils.validateResolution([1920]);
        const result2 = AxisValidationUtils.validateResolution([1920, 1080, 60]);
        expect(AxisResultUtils.isFailure(result1)).toBe(true);
        expect(AxisResultUtils.isFailure(result2)).toBe(true);
      });

      it('should reject arrays with non-positive values', () => {
        const result1 = AxisValidationUtils.validateResolution([0, 1080]);
        const result2 = AxisValidationUtils.validateResolution([1920, -1080]);
        expect(AxisResultUtils.isFailure(result1)).toBe(true);
        expect(AxisResultUtils.isFailure(result2)).toBe(true);
      });
    });
  });

  describe('AxisConfigValidation', () => {
    describe('validateAxisConfig', () => {
      it('should validate correct configuration objects', () => {
        const config = {
          pixelWidth: 2.0,
          opacity: 0.8,
          length: 1000,
          visible: true,
        };
        const result = AxisConfigValidation.validateAxisConfig(config);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);
      });

      it('should reject non-object configurations', () => {
        const result = AxisConfigValidation.validateAxisConfig('config');
        expect(AxisResultUtils.isFailure(result)).toBe(true);
      });

      it('should reject null configurations', () => {
        const result = AxisConfigValidation.validateAxisConfig(null);
        expect(AxisResultUtils.isFailure(result)).toBe(true);
      });

      it('should validate color properties', () => {
        const config = {
          colors: {
            X: [1, 0, 0],
            Y: [0, 1, 0],
            Z: [0, 0, 1],
          },
        };
        const result = AxisConfigValidation.validateAxisConfig(config);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);
      });

      it('should reject invalid color properties', () => {
        const config = {
          colors: {
            X: [1, 0], // Invalid: wrong length
          },
        };
        const result = AxisConfigValidation.validateAxisConfig(config);
        expect(AxisResultUtils.isFailure(result)).toBe(true);
      });

      it('should handle strict mode', () => {
        const config = {
          unknownProperty: 'value',
        };
        const result1 = AxisConfigValidation.validateAxisConfig(config, { strict: false });
        const result2 = AxisConfigValidation.validateAxisConfig(config, { strict: true });
        expect(AxisResultUtils.isSuccess(result1)).toBe(true);
        expect(AxisResultUtils.isFailure(result2)).toBe(true);
      });
    });

    describe('sanitizeConfig', () => {
      it('should provide defaults for missing values', () => {
        const config = {};
        const sanitized = AxisConfigValidation.sanitizeConfig(config);
        expect(sanitized.pixelWidth).toBeDefined();
        expect(sanitized.opacity).toBeDefined();
        expect(sanitized.length).toBeDefined();
        expect(sanitized.visible).toBe(true);
      });

      it('should preserve existing values', () => {
        const config = {
          pixelWidth: 3.0,
          opacity: 0.5,
          customProperty: 'value',
        };
        const sanitized = AxisConfigValidation.sanitizeConfig(config);
        expect(sanitized.pixelWidth).toBe(3.0);
        expect(sanitized.opacity).toBe(0.5);
        expect(sanitized.customProperty).toBe('value');
      });

      it('should clamp values to valid ranges', () => {
        const config = {
          pixelWidth: 100, // Too high
          opacity: -0.5, // Too low
        };
        const sanitized = AxisConfigValidation.sanitizeConfig(config);
        expect(sanitized.pixelWidth).toBeLessThanOrEqual(10); // Max pixel width
        expect(sanitized.opacity).toBeGreaterThanOrEqual(0); // Min opacity
      });
    });
  });

  describe('DEFAULT_VALIDATION_OPTIONS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_VALIDATION_OPTIONS.strict).toBe(false);
      expect(DEFAULT_VALIDATION_OPTIONS.allowZero).toBe(false);
      expect(DEFAULT_VALIDATION_OPTIONS.customRanges).toBeDefined();
      expect(DEFAULT_VALIDATION_OPTIONS.customRanges?.pixelWidth).toEqual([1.0, 10.0]);
      expect(DEFAULT_VALIDATION_OPTIONS.customRanges?.opacity).toEqual([0, 1]);
      expect(DEFAULT_VALIDATION_OPTIONS.customRanges?.length).toEqual([0.1, 10000]);
    });
  });
});