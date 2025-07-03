import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { extractModuleParametersFromText } from './module-parameter-extractor.js';
import { EnhancedOpenscadParser } from '../../enhanced-parser.js';

describe('Module Parameter Extractor', () => {
  let parser: EnhancedOpenscadParser;

  beforeAll(async () => {
    parser = new EnhancedOpenscadParser();
    await parser.init();
  });

  afterAll(() => {
    parser.dispose();
    vi.clearAllMocks();
  });

  describe('extractModuleParametersFromText', () => {
    it('should extract parameters without default values', () => {
      const paramsText = 'a, b, c';
      const result = extractModuleParametersFromText(paramsText);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('a');
      expect(result[0].defaultValue).toBeUndefined();
      expect(result[1].name).toBe('b');
      expect(result[1].defaultValue).toBeUndefined();
      expect(result[2].name).toBe('c');
      expect(result[2].defaultValue).toBeUndefined();
    });

    it('should extract parameters with default values', () => {
      const paramsText = 'a=10, b="test", c=true';
      const result = extractModuleParametersFromText(paramsText);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('a');
      expect(result[0].defaultValue).toBe(10);
      expect(result[1].name).toBe('b');
      expect(result[1].defaultValue).toBe('test');
      expect(result[2].name).toBe('c');
      expect(result[2].defaultValue).toBe(true);
    });

    it('should extract parameters with mixed default values', () => {
      const paramsText = 'a, b=20, c';
      const result = extractModuleParametersFromText(paramsText);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('a');
      expect(result[0].defaultValue).toBeUndefined();
      expect(result[1].name).toBe('b');
      expect(result[1].defaultValue).toBe(20);
      expect(result[2].name).toBe('c');
      expect(result[2].defaultValue).toBeUndefined();
    });

    it('should extract parameters with vector default values', () => {
      const paramsText = 'size=[10, 20, 30], center=false';
      const result = extractModuleParametersFromText(paramsText);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('size');
      expect(result[0].defaultValue).toEqual([10, 20, 30]);
      expect(result[1].name).toBe('center');
      expect(result[1].defaultValue).toBe(false);
    });

    it('should extract parameters with 2D vector default values', () => {
      const paramsText = 'size=[10, 20], center=false';
      const result = extractModuleParametersFromText(paramsText);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('size');
      expect(result[0].defaultValue).toEqual([10, 20]);
      expect(result[1].name).toBe('center');
      expect(result[1].defaultValue).toBe(false);
    });

    it('should handle empty parameter list', () => {
      const paramsText = '';
      const result = extractModuleParametersFromText(paramsText);

      expect(result).toHaveLength(0);
    });

    it('should handle whitespace in parameter list', () => {
      const paramsText = '  a = 10,   b = 20  ';
      const result = extractModuleParametersFromText(paramsText);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('a');
      expect(result[0].defaultValue).toBe(10);
      expect(result[1].name).toBe('b');
      expect(result[1].defaultValue).toBe(20);
    });

    it('should handle negative numbers as default values', () => {
      const paramsText = 'x=-10, y=-20.5';
      const result = extractModuleParametersFromText(paramsText);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('x');
      expect(result[0].defaultValue).toBe(-10);
      expect(result[1].name).toBe('y');
      expect(result[1].defaultValue).toBe(-20.5);
    });

    it('should handle vectors with negative numbers', () => {
      const paramsText = 'v=[-10, 20, -30]';
      const result = extractModuleParametersFromText(paramsText);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('v');
      expect(result[0].defaultValue).toEqual([-10, 20, -30]);
    });
  });
});
