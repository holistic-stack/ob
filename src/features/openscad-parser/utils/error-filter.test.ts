/**
 * Tests for error filtering utilities
 */

import { describe, it, expect } from 'vitest';
import { 
  isLikelyFalsePositiveError, 
  extractLineNumber, 
  filterFalsePositiveErrors,
  shouldConsiderParsingSuccessful 
} from './error-filter.js';

describe('Error Filter', () => {
  describe('isLikelyFalsePositiveError', () => {
    it('should detect false positive for transform without space', () => {
      const error = "Syntax error at line 1, column 17:";
      const code = "translate([0,15,0])cube(8, center=true);";

      expect(isLikelyFalsePositiveError(error, code, 1)).toBe(true);
    });

    it('should detect false positive for transform with braces', () => {
      const error = "Syntax error at line 3, column 20:";
      const code = "translate([15,0,0]) {\n  cube(7, center=true);\n}";
      
      expect(isLikelyFalsePositiveError(error, code, 1)).toBe(true);
    });

    it('should not flag real syntax errors', () => {
      const error = "Undefined variable: invalidVar";
      const code = "cube(invalidVar);";
      
      expect(isLikelyFalsePositiveError(error, code)).toBe(false);
    });

    it('should handle missing line number', () => {
      const error = "Syntax error at line 1, column 17:";
      const code = "translate([0,15,0])cube(8, center=true);";

      expect(isLikelyFalsePositiveError(error, code)).toBe(false); // Should be false without line number
    });
  });

  describe('extractLineNumber', () => {
    it('should extract line number from error message', () => {
      const error = "Syntax error at line 7, column 17:";
      expect(extractLineNumber(error)).toBe(7);
    });

    it('should handle missing line number', () => {
      const error = "General syntax error";
      expect(extractLineNumber(error)).toBeUndefined();
    });

    it('should extract first line number if multiple present', () => {
      const error = "Syntax error at line 7, column 17: expected line 8";
      expect(extractLineNumber(error)).toBe(7);
    });
  });

  describe('filterFalsePositiveErrors', () => {
    it('should filter out false positive errors', () => {
      const errors = [
        "Syntax error at line 2, column 17:",
        "Undefined variable: invalidVar",
        "Missing semicolon"
      ];
      const code = `sphere(5);
translate([0,15,0])cube(8, center=true);
cube(invalidVar);`;

      const filtered = filterFalsePositiveErrors(errors, code);
      expect(filtered).toEqual([
        "Undefined variable: invalidVar",
        "Missing semicolon"
      ]);
    });

    it('should return empty array if all errors are false positives', () => {
      const errors = [
        "Syntax error at line 1, column 17:",
        "Syntax error at line 2, column 20:"
      ];
      const code = `translate([0,15,0])cube(8, center=true);
translate([15,0,0]) {
  cube(7, center=true);
}`;

      const filtered = filterFalsePositiveErrors(errors, code);
      expect(filtered).toEqual([]);
    });

    it('should return all errors if none are false positives', () => {
      const errors = [
        "Undefined variable: invalidVar",
        "Missing semicolon"
      ];
      const code = "cube(invalidVar)";
      
      const filtered = filterFalsePositiveErrors(errors, code);
      expect(filtered).toEqual(errors);
    });
  });

  describe('shouldConsiderParsingSuccessful', () => {
    it('should consider successful if no errors and AST nodes exist', () => {
      expect(shouldConsiderParsingSuccessful([], "cube(5);", 1)).toBe(true);
    });

    it('should consider successful if only false positive errors', () => {
      const errors = ["Syntax error at line 1, column 17:"];
      const code = "translate([0,15,0])cube(8, center=true);";

      expect(shouldConsiderParsingSuccessful(errors, code, 2)).toBe(true);
    });

    it('should not consider successful if real errors exist', () => {
      const errors = ["Undefined variable: invalidVar"];
      const code = "cube(invalidVar);";
      
      expect(shouldConsiderParsingSuccessful(errors, code, 1)).toBe(false);
    });

    it('should not consider successful if no AST nodes generated', () => {
      expect(shouldConsiderParsingSuccessful([], "cube(5);", 0)).toBe(false);
    });

    it('should handle user reported case', () => {
      const errors = ["Syntax error at line 7, column 17:"];
      const code = `sphere(5);

translate([15,0,0]) {
  cube(7, center=true);
}

translate([0,15,0])cube(8, center=true);
translate([0,0,15]){
  cube(9, center=true);
}

translate([-15,0,0])cube(10, center=true);

translate([0,-15,0])cube(4, center=true);


translate([0,0,-15]){
  cube(3, center=true);
}`;
      
      expect(shouldConsiderParsingSuccessful(errors, code, 7)).toBe(true);
    });
  });
});
