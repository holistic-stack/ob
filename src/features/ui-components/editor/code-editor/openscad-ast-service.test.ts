/**
 * OpenSCAD AST Service Tests
 * 
 * Comprehensive test suite for the AST parsing service layer
 * following TDD methodology and functional programming patterns.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  parseOpenSCADCode,
  parseOpenSCADCodeDebounced,
  cancelDebouncedParsing,
  disposeASTService,
  validateAST,
  getPerformanceMetrics,
  type ASTParsingConfig,
  type ParseError
} from './openscad-ast-service';

// Mock the parser resource manager
vi.mock('../../../babylon-csg2/openscad/utils/parser-resource-manager', () => ({
  createParserResourceManager: vi.fn(() => ({
    parseOpenSCAD: vi.fn()
  })),
  type: {
    Result: {} as any
  }
}));

// Mock performance monitoring
vi.mock('../../shared/performance/performance-monitor', () => ({
  measurePerformance: vi.fn(async (operation: string, fn: () => Promise<any>) => {
    const result = await fn();
    return { result, metrics: { operation, duration: 100, withinTarget: true } };
  }),
  globalPerformanceMonitor: {
    startTiming: vi.fn(),
    endTiming: vi.fn(() => ({ operation: 'test', duration: 100, withinTarget: true })),
    generateReport: vi.fn(() => ({ overallScore: 95, recommendations: [] }))
  }
}));

describe('OpenSCAD AST Service', () => {
  let mockParserManager: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock parser manager
    mockParserManager = {
      parseOpenSCAD: vi.fn()
    };

    // Mock the createParserResourceManager to return our mock
    const { createParserResourceManager } = require('../../../babylon-csg2/openscad/utils/parser-resource-manager');
    createParserResourceManager.mockReturnValue(mockParserManager);
  });

  afterEach(() => {
    disposeASTService();
    cancelDebouncedParsing();
  });

  describe('parseOpenSCADCode', () => {
    it('should successfully parse valid OpenSCAD code', async () => {
      // Arrange
      const validCode = 'cube([10, 10, 10]);';
      const mockAST = [{ type: 'cube', size: [10, 10, 10] }];
      
      mockParserManager.parseOpenSCAD.mockResolvedValue({
        success: true,
        value: mockAST
      });

      // Act
      const result = await parseOpenSCADCode(validCode);

      // Assert
      expect(result.success).toBe(true);
      expect(result.ast).toEqual(mockAST);
      expect(result.errors).toHaveLength(0);
      expect(result.parseTime).toBeGreaterThan(0);
      expect(mockParserManager.parseOpenSCAD).toHaveBeenCalledWith(validCode);
    });

    it('should handle parser errors gracefully', async () => {
      // Arrange
      const invalidCode = 'invalid syntax here';
      const errorMessage = 'Syntax error at line 1, column 5';
      
      mockParserManager.parseOpenSCAD.mockResolvedValue({
        success: false,
        error: errorMessage
      });

      // Act
      const result = await parseOpenSCADCode(invalidCode);

      // Assert
      expect(result.success).toBe(false);
      expect(result.ast).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        message: errorMessage,
        line: 1,
        column: 5,
        severity: 'error'
      });
      expect(result.parseTime).toBeGreaterThan(0);
    });

    it('should handle empty code input', async () => {
      // Act
      const result = await parseOpenSCADCode('');

      // Assert
      expect(result.success).toBe(true);
      expect(result.ast).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(mockParserManager.parseOpenSCAD).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only code input', async () => {
      // Act
      const result = await parseOpenSCADCode('   \n\t  ');

      // Assert
      expect(result.success).toBe(true);
      expect(result.ast).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(mockParserManager.parseOpenSCAD).not.toHaveBeenCalled();
    });

    it('should handle invalid input types', async () => {
      // Act
      const result = await parseOpenSCADCode(null as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Invalid or empty OpenSCAD code');
    });

    it('should handle parser exceptions', async () => {
      // Arrange
      const code = 'cube([10, 10, 10]);';
      const error = new Error('Parser crashed');
      
      mockParserManager.parseOpenSCAD.mockRejectedValue(error);

      // Act
      const result = await parseOpenSCADCode(code);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Parser exception: Parser crashed');
    });

    it('should respect configuration options', async () => {
      // Arrange
      const code = 'cube([10, 10, 10]);';
      const config: ASTParsingConfig = {
        enableLogging: true,
        timeout: 10000
      };
      
      mockParserManager.parseOpenSCAD.mockResolvedValue({
        success: true,
        value: []
      });

      // Spy on console.log
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      await parseOpenSCADCode(code, config);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AST Service] Starting OpenSCAD code parsing')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('parseOpenSCADCodeDebounced', () => {
    it('should debounce parsing calls', async () => {
      // Arrange
      const code = 'cube([10, 10, 10]);';
      const debounceMs = 100;
      
      mockParserManager.parseOpenSCAD.mockResolvedValue({
        success: true,
        value: []
      });

      // Act
      const startTime = Date.now();
      const result = await parseOpenSCADCodeDebounced(code, debounceMs);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeGreaterThanOrEqual(debounceMs);
      expect(result.success).toBe(true);
    });

    it('should use default debounce time when not specified', async () => {
      // Arrange
      const code = 'cube([10, 10, 10]);';
      
      mockParserManager.parseOpenSCAD.mockResolvedValue({
        success: true,
        value: []
      });

      // Act
      const startTime = Date.now();
      const result = await parseOpenSCADCodeDebounced(code);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeGreaterThanOrEqual(300); // Default 300ms
      expect(result.success).toBe(true);
    });
  });

  describe('validateAST', () => {
    it('should validate correct AST structure', () => {
      // Arrange
      const validAST = [
        { type: 'cube', size: [10, 10, 10] },
        { type: 'sphere', radius: 5 }
      ];

      // Act & Assert
      expect(validateAST(validAST)).toBe(true);
    });

    it('should reject invalid AST structure', () => {
      // Test cases for invalid AST
      expect(validateAST(null as any)).toBe(false);
      expect(validateAST('not an array' as any)).toBe(false);
      expect(validateAST([null] as any)).toBe(false);
      expect(validateAST([{ noType: 'missing type' }] as any)).toBe(false);
    });

    it('should handle empty AST array', () => {
      expect(validateAST([])).toBe(true);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return excellent for fast parsing', () => {
      const metrics = getPerformanceMetrics(50);
      expect(metrics.assessment).toBe('excellent');
      expect(metrics.recommendation).toContain('excellent');
    });

    it('should return good for target performance', () => {
      const metrics = getPerformanceMetrics(200);
      expect(metrics.assessment).toBe('good');
      expect(metrics.recommendation).toContain('target');
    });

    it('should return acceptable for moderate performance', () => {
      const metrics = getPerformanceMetrics(500);
      expect(metrics.assessment).toBe('acceptable');
      expect(metrics.recommendation).toContain('acceptable');
    });

    it('should return slow for poor performance', () => {
      const metrics = getPerformanceMetrics(1500);
      expect(metrics.assessment).toBe('slow');
      expect(metrics.recommendation).toContain('slow');
    });
  });

  describe('cancelDebouncedParsing', () => {
    it('should cancel pending debounced operations', () => {
      // This test verifies the function exists and can be called
      // without throwing errors
      expect(() => cancelDebouncedParsing()).not.toThrow();
    });
  });

  describe('disposeASTService', () => {
    it('should dispose service resources', () => {
      // This test verifies the function exists and can be called
      // without throwing errors
      expect(() => disposeASTService()).not.toThrow();
    });
  });
});
