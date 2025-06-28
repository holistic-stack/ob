/**
 * Validation Utilities Test Suite
 * 
 * Tests for validation functions following TDD methodology
 * with comprehensive coverage of all validators.
 */

import { describe, it, expect } from 'vitest';
import {
  required,
  minLength,
  maxLength,
  pattern,
  email,
  url,
  min,
  max,
  integer,
  positive,
  negative,
  minItems,
  maxItems,
  uniqueItems,
  hasProperty,
  propertyType,
  whenInvalid,
  unlessValid,
  oneOf,
  allOf,
  openscadIdentifier,
  openscadNumber,
  openscadVector,
  fileExtension,
  validateField,
  validateForm
} from './validators';

describe('Validation Utilities', () => {
  describe('Basic validators', () => {
    describe('required', () => {
      const validator = required();

      it('should pass for non-empty values', () => {
        expect(validator('test')).toBeNull();
        expect(validator(0)).toBeNull();
        expect(validator(false)).toBeNull();
      });

      it('should fail for empty values', () => {
        expect(validator('')).toBe('This field is required');
        expect(validator(null)).toBe('This field is required');
        expect(validator(undefined)).toBe('This field is required');
      });

      it('should use custom message', () => {
        const customValidator = required('Custom message');
        expect(customValidator('')).toBe('Custom message');
      });
    });

    describe('minLength', () => {
      const validator = minLength(3);

      it('should pass for strings meeting minimum length', () => {
        expect(validator('abc')).toBeNull();
        expect(validator('abcd')).toBeNull();
      });

      it('should fail for strings below minimum length', () => {
        expect(validator('ab')).toBe('Must be at least 3 characters');
      });
    });

    describe('maxLength', () => {
      const validator = maxLength(5);

      it('should pass for strings within maximum length', () => {
        expect(validator('abc')).toBeNull();
        expect(validator('abcde')).toBeNull();
      });

      it('should fail for strings exceeding maximum length', () => {
        expect(validator('abcdef')).toBe('Must be no more than 5 characters');
      });
    });

    describe('pattern', () => {
      const validator = pattern(/^\d+$/, 'Must be digits only');

      it('should pass for matching patterns', () => {
        expect(validator('123')).toBeNull();
      });

      it('should fail for non-matching patterns', () => {
        expect(validator('abc')).toBe('Must be digits only');
      });
    });

    describe('email', () => {
      const validator = email();

      it('should pass for valid emails', () => {
        expect(validator('test@example.com')).toBeNull();
        expect(validator('user.name+tag@domain.co.uk')).toBeNull();
      });

      it('should fail for invalid emails', () => {
        expect(validator('invalid-email')).toBe('Invalid email address');
        expect(validator('test@')).toBe('Invalid email address');
      });
    });

    describe('url', () => {
      const validator = url();

      it('should pass for valid URLs', () => {
        expect(validator('https://example.com')).toBeNull();
        expect(validator('http://localhost:3000')).toBeNull();
      });

      it('should fail for invalid URLs', () => {
        expect(validator('not-a-url')).toBe('Invalid URL');
        expect(validator('ftp://')).toBe('Invalid URL');
      });
    });
  });

  describe('Numeric validators', () => {
    describe('min', () => {
      const validator = min(10);

      it('should pass for values above minimum', () => {
        expect(validator(10)).toBeNull();
        expect(validator(15)).toBeNull();
      });

      it('should fail for values below minimum', () => {
        expect(validator(5)).toBe('Must be at least 10');
      });
    });

    describe('max', () => {
      const validator = max(100);

      it('should pass for values below maximum', () => {
        expect(validator(50)).toBeNull();
        expect(validator(100)).toBeNull();
      });

      it('should fail for values above maximum', () => {
        expect(validator(150)).toBe('Must be no more than 100');
      });
    });

    describe('integer', () => {
      const validator = integer();

      it('should pass for integers', () => {
        expect(validator(42)).toBeNull();
        expect(validator(-10)).toBeNull();
        expect(validator(0)).toBeNull();
      });

      it('should fail for non-integers', () => {
        expect(validator(3.14)).toBe('Must be an integer');
        expect(validator(1.1)).toBe('Must be an integer');
      });
    });

    describe('positive', () => {
      const validator = positive();

      it('should pass for positive numbers', () => {
        expect(validator(1)).toBeNull();
        expect(validator(0.1)).toBeNull();
      });

      it('should fail for non-positive numbers', () => {
        expect(validator(0)).toBe('Must be positive');
        expect(validator(-1)).toBe('Must be positive');
      });
    });

    describe('negative', () => {
      const validator = negative();

      it('should pass for negative numbers', () => {
        expect(validator(-1)).toBeNull();
        expect(validator(-0.1)).toBeNull();
      });

      it('should fail for non-negative numbers', () => {
        expect(validator(0)).toBe('Must be negative');
        expect(validator(1)).toBe('Must be negative');
      });
    });
  });

  describe('Array validators', () => {
    describe('minItems', () => {
      const validator = minItems(2);

      it('should pass for arrays with sufficient items', () => {
        expect(validator([1, 2])).toBeNull();
        expect(validator([1, 2, 3])).toBeNull();
      });

      it('should fail for arrays with insufficient items', () => {
        expect(validator([1])).toBe('Must have at least 2 items');
      });
    });

    describe('maxItems', () => {
      const validator = maxItems(3);

      it('should pass for arrays within limit', () => {
        expect(validator([1, 2])).toBeNull();
        expect(validator([1, 2, 3])).toBeNull();
      });

      it('should fail for arrays exceeding limit', () => {
        expect(validator([1, 2, 3, 4])).toBe('Must have no more than 3 items');
      });
    });

    describe('uniqueItems', () => {
      const validator = uniqueItems();

      it('should pass for arrays with unique items', () => {
        expect(validator([1, 2, 3])).toBeNull();
        expect(validator(['a', 'b', 'c'])).toBeNull();
      });

      it('should fail for arrays with duplicate items', () => {
        expect(validator([1, 2, 2])).toBe('Items must be unique');
        expect(validator(['a', 'b', 'a'])).toBe('Items must be unique');
      });
    });
  });

  describe('Object validators', () => {
    describe('hasProperty', () => {
      const validator = hasProperty('name');

      it('should pass for objects with required property', () => {
        expect(validator({ name: 'John', age: 30 })).toBeNull();
      });

      it('should fail for objects missing required property', () => {
        expect(validator({ age: 30 })).toBe('Missing required property: name');
      });
    });

    describe('propertyType', () => {
      const validator = propertyType('age', 'number');

      it('should pass for correct property type', () => {
        expect(validator({ age: 30 })).toBeNull();
      });

      it('should fail for incorrect property type', () => {
        expect(validator({ age: '30' })).toBe('Property age must be of type number');
      });
    });
  });

  describe('Conditional validators', () => {
    describe('whenInvalid', () => {
      const validator = whenInvalid(
        (x: number) => x > 10,
        (x: number) => x < 20 ? null : 'Must be less than 20'
      );

      it('should apply validation when condition is true', () => {
        expect(validator(15)).toBeNull();
        expect(validator(25)).toBe('Must be less than 20');
      });

      it('should skip validation when condition is false', () => {
        expect(validator(5)).toBeNull();
      });
    });

    describe('unlessValid', () => {
      const validator = unlessValid(
        (x: number) => x < 10,
        (x: number) => x < 20 ? null : 'Must be less than 20'
      );

      it('should apply validation when condition is false', () => {
        expect(validator(15)).toBeNull();
        expect(validator(25)).toBe('Must be less than 20');
      });

      it('should skip validation when condition is true', () => {
        expect(validator(5)).toBeNull();
      });
    });
  });

  describe('Composite validators', () => {
    describe('oneOf', () => {
      const validator = oneOf([
        (x: number) => x > 10 ? null : 'Must be > 10',
        (x: number) => x < 5 ? null : 'Must be < 5'
      ]);

      it('should pass if any validator passes', () => {
        expect(validator(15)).toBeNull(); // > 10
        expect(validator(3)).toBeNull();  // < 5
      });

      it('should fail if all validators fail', () => {
        expect(validator(7)).toBe('Must satisfy at least one condition');
      });
    });

    describe('allOf', () => {
      const validator = allOf([
        (x: number) => x > 5 ? null : 'Must be > 5',
        (x: number) => x < 15 ? null : 'Must be < 15'
      ]);

      it('should pass if all validators pass', () => {
        expect(validator(10)).toBeNull();
      });

      it('should fail if any validator fails', () => {
        expect(validator(3)).toBe('Must be > 5');
        expect(validator(20)).toBe('Must be < 15');
      });
    });
  });

  describe('OpenSCAD validators', () => {
    describe('openscadIdentifier', () => {
      const validator = openscadIdentifier();

      it('should pass for valid identifiers', () => {
        expect(validator('myVariable')).toBeNull();
        expect(validator('_private')).toBeNull();
        expect(validator('var123')).toBeNull();
      });

      it('should fail for invalid identifiers', () => {
        expect(validator('123var')).toBe('Invalid OpenSCAD identifier');
        expect(validator('my-var')).toBe('Invalid OpenSCAD identifier');
        expect(validator('my var')).toBe('Invalid OpenSCAD identifier');
      });
    });

    describe('openscadNumber', () => {
      const validator = openscadNumber();

      it('should pass for valid numbers', () => {
        expect(validator('123')).toBeNull();
        expect(validator('3.14')).toBeNull();
        expect(validator('-42')).toBeNull();
        expect(validator('1.5e-10')).toBeNull();
      });

      it('should fail for invalid numbers', () => {
        expect(validator('abc')).toBe('Invalid OpenSCAD number');
        expect(validator('1.2.3')).toBe('Invalid OpenSCAD number');
      });
    });

    describe('openscadVector', () => {
      const validator3D = openscadVector(3);

      it('should pass for valid 3D vectors', () => {
        expect(validator3D('[1, 2, 3]')).toBeNull();
        expect(validator3D('[1.5, -2.0, 3.14]')).toBeNull();
      });

      it('should fail for invalid vectors', () => {
        expect(validator3D('[1, 2]')).toBe('Vector must have exactly 3 components');
        expect(validator3D('[1, 2, 3, 4]')).toBe('Vector must have exactly 3 components');
        expect(validator3D('not a vector')).toBe('Invalid vector format');
      });
    });
  });

  describe('File validators', () => {
    describe('fileExtension', () => {
      const validator = fileExtension(['jpg', 'png', 'gif']);

      it('should pass for allowed extensions', () => {
        expect(validator('image.jpg')).toBeNull();
        expect(validator('photo.PNG')).toBeNull(); // Case insensitive
      });

      it('should fail for disallowed extensions', () => {
        expect(validator('document.pdf')).toBe('File must have one of these extensions: jpg, png, gif');
      });
    });
  });

  describe('Form validation', () => {
    describe('validateField', () => {
      it('should validate single field', () => {
        const result = validateField('test@example.com', [required(), email()]);
        expect(result.success).toBe(true);
      });

      it('should collect field errors', () => {
        const result = validateField('', [required(), email()]);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('This field is required');
        }
      });
    });

    describe('validateForm', () => {
      const schema = {
        name: [required(), minLength(2)],
        email: [required(), email()],
        age: [required(), min(18)]
      };

      it('should validate entire form', () => {
        const values = { name: 'John', email: 'john@example.com', age: 25 };
        const result = validateForm(values, schema);
        expect(result.success).toBe(true);
      });

      it('should collect all form errors', () => {
        const values = { name: '', email: 'invalid', age: 15 };
        const result = validateForm(values, schema);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.length).toBeGreaterThan(0);
        }
      });
    });
  });
});
