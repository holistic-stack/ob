/**
 * @file Test suite for the parameter extractor utility.
 * @author Luciano Júnior
 */

import { describe, it, expect } from 'vitest';
import { extractVector3 } from './parameter-extractor';

describe('Parameter Extractor', () => {
  describe('extractVector3', () => {
    it('should return the default value if the input is undefined', () => {
      expect(extractVector3(undefined)).toEqual([1, 1, 1]);
    });

    it('should use a single number for all three components', () => {
      expect(extractVector3(5)).toEqual([5, 5, 5]);
    });

    it('should return the vector if the input is a vector', () => {
      expect(extractVector3([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('should return a custom default value if provided', () => {
      expect(extractVector3(undefined, [10, 20, 30])).toEqual([10, 20, 30]);
    });
  });
});
