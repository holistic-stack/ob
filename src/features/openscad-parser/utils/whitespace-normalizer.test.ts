/**
 * Tests for whitespace normalization utilities
 */

import { describe, it, expect } from 'vitest';
import { normalizeWhitespace, hasProblematicWhitespace, validateNormalizedCode } from './whitespace-normalizer.js';

describe('Whitespace Normalizer', () => {
  describe('normalizeWhitespace', () => {
    it('should handle empty or invalid input', () => {
      expect(normalizeWhitespace('')).toBe('');
      expect(normalizeWhitespace(null as any)).toBe('');
      expect(normalizeWhitespace(undefined as any)).toBe('');
    });

    it('should preserve normal code without changes', () => {
      const normalCode = `sphere(5);
translate([15,0,0]) {
  cube(7, center=true);
}`;
      
      expect(normalizeWhitespace(normalCode)).toBe(normalCode);
    });

    it('should reduce excessive empty lines', () => {
      const problematicCode = `sphere(5);




translate([15,0,0]) {
  cube(7, center=true);
}`;
      
      const expected = `sphere(5);


translate([15,0,0]) {
  cube(7, center=true);
}`;
      
      expect(normalizeWhitespace(problematicCode)).toBe(expected);
    });

    it('should remove trailing empty lines', () => {
      const codeWithTrailing = `sphere(5);
translate([15,0,0]) {
  cube(7, center=true);
}



`;
      
      const expected = `sphere(5);
translate([15,0,0]) {
  cube(7, center=true);
}`;
      
      expect(normalizeWhitespace(codeWithTrailing)).toBe(expected);
    });

    it('should handle the user reported problematic code', () => {
      const userCode = `sphere(5);

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
      
      const normalized = normalizeWhitespace(userCode);
      
      // Should not have more than 2 consecutive empty lines
      expect(normalized).not.toMatch(/\n\n\n\n/);
      
      // Should still contain the essential structure
      expect(normalized).toContain('sphere(5);');
      expect(normalized).toContain('translate([15,0,0])');
      expect(normalized).toContain('cube(7, center=true);');
    });
  });

  describe('hasProblematicWhitespace', () => {
    it('should detect excessive empty lines', () => {
      const problematicCode = `sphere(5);




translate([15,0,0]) {
  cube(7, center=true);
}`;
      
      expect(hasProblematicWhitespace(problematicCode)).toBe(true);
    });

    it('should not flag normal code', () => {
      const normalCode = `sphere(5);

translate([15,0,0]) {
  cube(7, center=true);
}`;
      
      expect(hasProblematicWhitespace(normalCode)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(hasProblematicWhitespace('')).toBe(false);
      expect(hasProblematicWhitespace(null as any)).toBe(false);
      expect(hasProblematicWhitespace(undefined as any)).toBe(false);
    });
  });

  describe('validateNormalizedCode', () => {
    it('should validate balanced braces', () => {
      const validCode = `translate([15,0,0]) {
  cube(7, center=true);
}`;
      
      expect(validateNormalizedCode(validCode)).toBe(true);
    });

    it('should reject unbalanced braces', () => {
      const invalidCode = `translate([15,0,0]) {
  cube(7, center=true);`;
      
      expect(validateNormalizedCode(invalidCode)).toBe(false);
    });

    it('should reject code with problematic whitespace', () => {
      const problematicCode = `sphere(5);




translate([15,0,0]) {
  cube(7, center=true);
}`;
      
      expect(validateNormalizedCode(problematicCode)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateNormalizedCode('')).toBe(false);
      expect(validateNormalizedCode(null as any)).toBe(false);
      expect(validateNormalizedCode(undefined as any)).toBe(false);
    });
  });
});
