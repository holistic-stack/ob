/**
 * @file Validation Types Tests
 * 
 * Comprehensive test suite for validation system and runtime type checking.
 * Tests type safety, validation functions, and error handling patterns.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ValidationError,
  ValidationErrorCode,
  ValidationResult,
  Validator,
  Schema,
  ValidationOptions,
  string,
  number,
  boolean,
  array,
  object,
  required,
  optional,
  stringLength,
  numberRange,
  pattern,
  oneOf,
  and,
  or,
  custom,
  validate,
  transform,
  formatValidationErrors,
  isValidationSuccess,
  isValidationError,
} from './validation-types';

describe('Validation Types', () => {
  beforeEach(() => {
    console.log('[INIT] Starting validation types test');
  });

  describe('Basic Type Validators', () => {
    it('should validate string types', () => {
      console.log('[DEBUG] Testing string validation');
      
      const stringValidator = string('testField');
      
      const validResult = stringValidator('hello');
      const invalidResult = stringValidator(123);
      
      expect(validResult.success).toBe(true);
      expect(validResult.data).toBe('hello');
      
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toHaveLength(1);
      expect(invalidResult.error[0].field).toBe('testField');
      expect(invalidResult.error[0].code).toBe('type_mismatch');
      expect(invalidResult.error[0].message).toBe('Expected string, got number');
      
      console.log('[DEBUG] String validation test passed');
    });

    it('should validate number types', () => {
      console.log('[DEBUG] Testing number validation');
      
      const numberValidator = number('numField');
      
      const validResult = numberValidator(42);
      const invalidResult = numberValidator('not a number');
      const nanResult = numberValidator(NaN);
      
      expect(validResult.success).toBe(true);
      expect(validResult.data).toBe(42);
      
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error[0].code).toBe('type_mismatch');
      
      expect(nanResult.success).toBe(false);
      expect(nanResult.error[0].code).toBe('type_mismatch');
      
      console.log('[DEBUG] Number validation test passed');
    });

    it('should validate boolean types', () => {
      console.log('[DEBUG] Testing boolean validation');
      
      const booleanValidator = boolean('boolField');
      
      const validTrueResult = booleanValidator(true);
      const validFalseResult = booleanValidator(false);
      const invalidResult = booleanValidator('true');
      
      expect(validTrueResult.success).toBe(true);
      expect(validTrueResult.data).toBe(true);
      
      expect(validFalseResult.success).toBe(true);
      expect(validFalseResult.data).toBe(false);
      
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error[0].code).toBe('type_mismatch');
      
      console.log('[DEBUG] Boolean validation test passed');
    });

    it('should validate array types', () => {
      console.log('[DEBUG] Testing array validation');
      
      const stringArrayValidator = array(string(), 'arrayField');
      
      const validResult = stringArrayValidator(['hello', 'world']);
      const invalidTypeResult = stringArrayValidator('not an array');
      const invalidItemResult = stringArrayValidator(['hello', 123, 'world']);
      
      expect(validResult.success).toBe(true);
      expect(validResult.data).toEqual(['hello', 'world']);
      
      expect(invalidTypeResult.success).toBe(false);
      expect(invalidTypeResult.error[0].code).toBe('type_mismatch');
      
      expect(invalidItemResult.success).toBe(false);
      expect(invalidItemResult.error).toHaveLength(1);
      expect(invalidItemResult.error[0].field).toBe('arrayField[1].value');
      
      console.log('[DEBUG] Array validation test passed');
    });

    it('should validate object types', () => {
      console.log('[DEBUG] Testing object validation');
      
      const userSchema: Schema<{ name: string; age: number }> = {
        name: string('name'),
        age: number('age'),
      };
      const objectValidator = object(userSchema, 'user');
      
      const validResult = objectValidator({ name: 'John', age: 30 });
      const invalidTypeResult = objectValidator('not an object');
      const missingFieldResult = objectValidator({ name: 'John' });
      const invalidFieldResult = objectValidator({ name: 'John', age: 'thirty' });
      
      expect(validResult.success).toBe(true);
      expect(validResult.data).toEqual({ name: 'John', age: 30 });
      
      expect(invalidTypeResult.success).toBe(false);
      expect(invalidTypeResult.error[0].code).toBe('type_mismatch');
      
      expect(missingFieldResult.success).toBe(false);
      expect(missingFieldResult.error[0].field).toContain('age');

      expect(invalidFieldResult.success).toBe(false);
      expect(invalidFieldResult.error[0].field).toContain('age');
      expect(invalidFieldResult.error[0].code).toBe('type_mismatch');
      
      console.log('[DEBUG] Object validation test passed');
    });
  });

  describe('Constraint Validators', () => {
    it('should validate required fields', () => {
      console.log('[DEBUG] Testing required field validation');
      
      const requiredStringValidator = required(string(), 'requiredField');
      
      const validResult = requiredStringValidator('hello');
      const nullResult = requiredStringValidator(null);
      const undefinedResult = requiredStringValidator(undefined);
      
      expect(validResult.success).toBe(true);
      expect(validResult.data).toBe('hello');
      
      expect(nullResult.success).toBe(false);
      expect(nullResult.error[0].code).toBe('required');
      
      expect(undefinedResult.success).toBe(false);
      expect(undefinedResult.error[0].code).toBe('required');
      
      console.log('[DEBUG] Required field validation test passed');
    });

    it('should validate optional fields', () => {
      console.log('[DEBUG] Testing optional field validation');
      
      const optionalStringValidator = optional(string(), 'optionalField');
      
      const validResult = optionalStringValidator('hello');
      const nullResult = optionalStringValidator(null);
      const undefinedResult = optionalStringValidator(undefined);
      const invalidResult = optionalStringValidator(123);
      
      expect(validResult.success).toBe(true);
      expect(validResult.data).toBe('hello');
      
      expect(nullResult.success).toBe(true);
      expect(nullResult.data).toBe(undefined);
      
      expect(undefinedResult.success).toBe(true);
      expect(undefinedResult.data).toBe(undefined);
      
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error[0].code).toBe('type_mismatch');
      
      console.log('[DEBUG] Optional field validation test passed');
    });

    it('should validate string length constraints', () => {
      console.log('[DEBUG] Testing string length validation');
      
      const lengthValidator = stringLength(3, 10, 'lengthField');
      
      const validResult = lengthValidator('hello');
      const tooShortResult = lengthValidator('hi');
      const tooLongResult = lengthValidator('this is too long');
      const invalidTypeResult = lengthValidator(123);
      
      expect(validResult.success).toBe(true);
      expect(validResult.data).toBe('hello');
      
      expect(tooShortResult.success).toBe(false);
      expect(tooShortResult.error[0].code).toBe('too_short');
      
      expect(tooLongResult.success).toBe(false);
      expect(tooLongResult.error[0].code).toBe('too_long');
      
      expect(invalidTypeResult.success).toBe(false);
      expect(invalidTypeResult.error[0].code).toBe('type_mismatch');
      
      console.log('[DEBUG] String length validation test passed');
    });

    it('should validate number range constraints', () => {
      console.log('[DEBUG] Testing number range validation');
      
      const rangeValidator = numberRange(0, 100, 'rangeField');
      
      const validResult = rangeValidator(50);
      const tooSmallResult = rangeValidator(-10);
      const tooLargeResult = rangeValidator(150);
      const invalidTypeResult = rangeValidator('fifty');
      
      expect(validResult.success).toBe(true);
      expect(validResult.data).toBe(50);
      
      expect(tooSmallResult.success).toBe(false);
      expect(tooSmallResult.error[0].code).toBe('out_of_range');
      
      expect(tooLargeResult.success).toBe(false);
      expect(tooLargeResult.error[0].code).toBe('out_of_range');
      
      expect(invalidTypeResult.success).toBe(false);
      expect(invalidTypeResult.error[0].code).toBe('type_mismatch');
      
      console.log('[DEBUG] Number range validation test passed');
    });

    it('should validate string patterns', () => {
      console.log('[DEBUG] Testing pattern validation');
      
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emailValidator = pattern(emailPattern, 'Invalid email format', 'email');
      
      const validResult = emailValidator('test@example.com');
      const invalidResult = emailValidator('invalid-email');
      const invalidTypeResult = emailValidator(123);
      
      expect(validResult.success).toBe(true);
      expect(validResult.data).toBe('test@example.com');
      
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error[0].code).toBe('invalid_pattern');
      expect(invalidResult.error[0].message).toBe('Invalid email format');
      
      expect(invalidTypeResult.success).toBe(false);
      expect(invalidTypeResult.error[0].code).toBe('type_mismatch');
      
      console.log('[DEBUG] Pattern validation test passed');
    });

    it('should validate enum values', () => {
      console.log('[DEBUG] Testing enum validation');
      
      const statusValidator = oneOf(['active', 'inactive', 'pending'] as const, 'status');
      
      const validResult = statusValidator('active');
      const invalidResult = statusValidator('unknown');
      
      expect(validResult.success).toBe(true);
      expect(validResult.data).toBe('active');
      
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error[0].code).toBe('invalid_format');
      expect(invalidResult.error[0].message).toBe('Value must be one of: active, inactive, pending');
      
      console.log('[DEBUG] Enum validation test passed');
    });
  });

  describe('Composite Validators', () => {
    it('should combine validators with AND logic', () => {
      console.log('[DEBUG] Testing AND validator combination');

      const positiveNumberValidator = and([
        number('value'),
        custom((value: number) => value > 0, 'Must be positive', 'value')
      ], 'positiveNumber');

      const validResult = positiveNumberValidator(42);
      const invalidTypeResult = positiveNumberValidator('not a number');
      const invalidValueResult = positiveNumberValidator(-5);

      expect(validResult.success).toBe(true);
      expect(validResult.data).toBe(42);

      expect(invalidTypeResult.success).toBe(false);
      expect(invalidTypeResult.error[0].code).toBe('type_mismatch');

      expect(invalidValueResult.success).toBe(false);
      expect(invalidValueResult.error[0].code).toBe('custom_validation');
      expect(invalidValueResult.error[0].message).toBe('Must be positive');

      console.log('[DEBUG] AND validator combination test passed');
    });

    it('should combine validators with OR logic', () => {
      console.log('[DEBUG] Testing OR validator combination');

      const stringOrNumberValidator = or([
        string('value'),
        number('value')
      ], 'stringOrNumber');

      const validStringResult = stringOrNumberValidator('hello');
      const validNumberResult = stringOrNumberValidator(42);
      const invalidResult = stringOrNumberValidator(true);

      expect(validStringResult.success).toBe(true);
      expect(validStringResult.data).toBe('hello');

      expect(validNumberResult.success).toBe(true);
      expect(validNumberResult.data).toBe(42);

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error[0].code).toBe('custom_validation');
      expect(invalidResult.error[0].message).toBe('Value failed all validation alternatives');

      console.log('[DEBUG] OR validator combination test passed');
    });

    it('should create custom validators', () => {
      console.log('[DEBUG] Testing custom validators');

      const evenNumberValidator = custom(
        (value: number) => value % 2 === 0,
        'Number must be even',
        'evenNumber'
      );

      const validResult = evenNumberValidator(4);
      const invalidResult = evenNumberValidator(3);

      expect(validResult.success).toBe(true);
      expect(validResult.data).toBe(4);

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error[0].code).toBe('custom_validation');
      expect(invalidResult.error[0].message).toBe('Number must be even');

      console.log('[DEBUG] Custom validators test passed');
    });
  });

  describe('Object Validation with Options', () => {
    it('should handle unknown fields based on options', () => {
      console.log('[DEBUG] Testing object validation with unknown fields');

      const schema: Schema<{ name: string }> = {
        name: string('name'),
      };

      const strictValidator = object(schema, 'user', { allowUnknownFields: false });
      const allowUnknownValidator = object(schema, 'user', { allowUnknownFields: true });
      const stripUnknownValidator = object(schema, 'user', {
        allowUnknownFields: false,
        stripUnknownFields: true
      });

      const testData = { name: 'John', age: 30 };

      const strictResult = strictValidator(testData);
      const allowUnknownResult = allowUnknownValidator(testData);
      const stripUnknownResult = stripUnknownValidator(testData);

      expect(strictResult.success).toBe(false);
      expect(strictResult.error[0].field).toBe('user.age');
      expect(strictResult.error[0].message).toBe('Unknown field: age');

      expect(allowUnknownResult.success).toBe(true);
      expect(allowUnknownResult.data).toEqual({ name: 'John', age: 30 });

      expect(stripUnknownResult.success).toBe(true);
      expect(stripUnknownResult.data).toEqual({ name: 'John' });

      console.log('[DEBUG] Object validation with unknown fields test passed');
    });

    it('should handle nested object validation', () => {
      console.log('[DEBUG] Testing nested object validation');

      const addressSchema: Schema<{ street: string; city: string }> = {
        street: string('street'),
        city: string('city'),
      };

      const userSchema: Schema<{ name: string; address: { street: string; city: string } }> = {
        name: string('name'),
        address: object(addressSchema, 'address'),
      };

      const userValidator = object(userSchema, 'user');

      const validData = {
        name: 'John',
        address: {
          street: '123 Main St',
          city: 'Anytown'
        }
      };

      const invalidData = {
        name: 'John',
        address: {
          street: '123 Main St'
          // missing city
        }
      };

      const validResult = userValidator(validData);
      const invalidResult = userValidator(invalidData);

      expect(validResult.success).toBe(true);
      expect(validResult.data).toEqual(validData);

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error[0].field).toContain('city');
      expect(invalidResult.error[0].code).toBe('type_mismatch');

      console.log('[DEBUG] Nested object validation test passed');
    });
  });

  describe('Utility Functions', () => {
    it('should validate values using the validate function', () => {
      console.log('[DEBUG] Testing validate utility function');

      const validator = stringLength(3, 10, 'testString');

      const validResult = validate(validator, 'hello');
      const invalidResult = validate(validator, 'hi');

      expect(validResult.success).toBe(true);
      expect(validResult.data).toBe('hello');

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error[0].code).toBe('too_short');

      console.log('[DEBUG] Validate utility function test passed');
    });

    it('should transform validated values', () => {
      console.log('[DEBUG] Testing transform utility function');

      const stringToUpperValidator = transform(
        string('value'),
        (str: string) => str.toUpperCase(),
        'upperString'
      );

      const validResult = stringToUpperValidator('hello');
      const invalidResult = stringToUpperValidator(123);

      expect(validResult.success).toBe(true);
      expect(validResult.data).toBe('HELLO');

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error[0].code).toBe('type_mismatch');

      console.log('[DEBUG] Transform utility function test passed');
    });

    it('should handle transformation errors', () => {
      console.log('[DEBUG] Testing transformation error handling');

      const failingTransformValidator = transform(
        string('value'),
        (str: string) => {
          if (str === 'fail') {
            throw new Error('Transformation failed');
          }
          return str.toUpperCase();
        },
        'transformField'
      );

      const validResult = failingTransformValidator('hello');
      const errorResult = failingTransformValidator('fail');

      expect(validResult.success).toBe(true);
      expect(validResult.data).toBe('HELLO');

      expect(errorResult.success).toBe(false);
      expect(errorResult.error[0].code).toBe('custom_validation');
      expect(errorResult.error[0].message).toContain('Transformation failed');

      console.log('[DEBUG] Transformation error handling test passed');
    });

    it('should format validation errors', () => {
      console.log('[DEBUG] Testing error formatting');

      const errors: ValidationError[] = [
        {
          field: 'name',
          message: 'Name is required',
          code: 'required'
        },
        {
          field: 'age',
          message: 'Age must be a number',
          code: 'type_mismatch',
          value: 'not a number'
        }
      ];

      const formatted = formatValidationErrors(errors);
      const expectedFormat = 'name: Name is required\nage: Age must be a number';

      expect(formatted).toBe(expectedFormat);

      console.log('[DEBUG] Error formatting test passed');
    });

    it('should check validation result types', () => {
      console.log('[DEBUG] Testing validation result type checking');

      const successResult = validate(string(), 'hello');
      const errorResult = validate(string(), 123);

      expect(isValidationSuccess(successResult)).toBe(true);
      expect(isValidationError(successResult)).toBe(false);

      expect(isValidationSuccess(errorResult)).toBe(false);
      expect(isValidationError(errorResult)).toBe(true);

      console.log('[DEBUG] Validation result type checking test passed');
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('should handle complex nested validation', () => {
      console.log('[DEBUG] Testing complex nested validation');

      const configSchema: Schema<{
        database: {
          host: string;
          port: number;
          credentials: {
            username: string;
            password: string;
          };
        };
        features: string[];
        debug: boolean;
      }> = {
        database: object({
          host: required(string(), 'host'),
          port: required(numberRange(1, 65535), 'port'),
          credentials: object({
            username: required(stringLength(3, 50), 'username'),
            password: required(stringLength(8, 100), 'password'),
          }, 'credentials'),
        }, 'database'),
        features: array(string(), 'features'),
        debug: boolean('debug'),
      };

      const configValidator = object(configSchema, 'config');

      const validConfig = {
        database: {
          host: 'localhost',
          port: 5432,
          credentials: {
            username: 'admin',
            password: 'secretpassword'
          }
        },
        features: ['auth', 'logging'],
        debug: true
      };

      const invalidConfig = {
        database: {
          host: 'localhost',
          port: 99999, // Invalid port
          credentials: {
            username: 'ad', // Too short
            password: 'short' // Too short
          }
        },
        features: ['auth', 123], // Invalid array item
        debug: 'true' // Wrong type
      };

      const validResult = configValidator(validConfig);
      const invalidResult = configValidator(invalidConfig);

      expect(validResult.success).toBe(true);
      expect(validResult.data).toEqual(validConfig);

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error.length).toBeGreaterThan(1);

      // Check specific error fields
      const errorFields = invalidResult.error.map(err => err.field);
      expect(errorFields.some(field => field.includes('port'))).toBe(true);
      expect(errorFields.some(field => field.includes('username'))).toBe(true);
      expect(errorFields.some(field => field.includes('password'))).toBe(true);
      expect(errorFields.some(field => field.includes('features'))).toBe(true);
      expect(errorFields.some(field => field.includes('debug'))).toBe(true);

      console.log('[DEBUG] Complex nested validation test passed');
    });
  });
});
