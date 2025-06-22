/**
 * @file AST Utilities Tests
 * 
 * Comprehensive test suite for AST utilities following TDD methodology
 * Tests for validation, error handling, logging, and processing utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { type ASTNode } from '@holistic-stack/openscad-parser';
import {
  validateAST,
  validateASTNode,
  validateNodeArray,
  createASTError,
  withASTErrorHandling,
  logASTOperation,
  logASTResult,
  processASTNodes,
  transformASTNode,
  extractLineNumber,
  extractColumnNumber,
  createParseError,
  formatPerformanceTime,
  isWithinPerformanceTarget
} from './ast-utils';
import type { ParseError, ASTResult } from './ast-utils';

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

beforeEach(() => {
  vi.clearAllMocks();
  console.log = mockConsole.log;
  console.warn = mockConsole.warn;
  console.error = mockConsole.error;
});

// Mock AST nodes for testing
const createMockASTNode = (type: string, overrides: Partial<ASTNode> = {}): ASTNode => ({
  type,
  location: {
    start: { line: 1, column: 1 },
    end: { line: 1, column: 10 }
  },
  ...overrides
} as ASTNode);

const createMockParseError = (message: string, line = 1, column = 1): ParseError => ({
  message,
  line,
  column,
  severity: 'error' as const
});

describe('AST Utilities', () => {
  describe('validateAST', () => {
    it('should validate correct AST array', () => {
      const ast = [
        createMockASTNode('cube'),
        createMockASTNode('sphere')
      ];
      
      const result = validateAST(ast);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(ast);
    });

    it('should reject null AST', () => {
      const result = validateAST(null);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('AST is null or undefined');
    });

    it('should reject non-array AST', () => {
      const result = validateAST('not an array' as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('AST is not an array');
    });

    it('should reject AST with invalid nodes', () => {
      const ast = [
        createMockASTNode('cube'),
        null,
        createMockASTNode('sphere')
      ] as any;
      
      const result = validateAST(ast);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid AST node found');
    });

    it('should handle empty AST array', () => {
      const result = validateAST([]);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('validateASTNode', () => {
    it('should validate correct AST node', () => {
      const node = createMockASTNode('cube');
      const result = validateASTNode(node);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(node);
    });

    it('should reject null node', () => {
      const result = validateASTNode(null);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('AST node is null or undefined');
    });

    it('should reject node without type', () => {
      const node = { location: { start: { line: 1, column: 1 }, end: { line: 1, column: 10 } } } as any;
      const result = validateASTNode(node);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('AST node missing required type property');
    });

    it('should reject node with invalid type', () => {
      const node = { type: 123, location: {} } as any;
      const result = validateASTNode(node);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('AST node type must be a string');
    });
  });

  describe('validateNodeArray', () => {
    it('should validate array of valid nodes', () => {
      const nodes = [
        createMockASTNode('cube'),
        createMockASTNode('sphere')
      ];
      
      const result = validateNodeArray(nodes);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(nodes);
    });

    it('should filter out invalid nodes', () => {
      const nodes = [
        createMockASTNode('cube'),
        null,
        createMockASTNode('sphere'),
        undefined
      ] as any;
      
      const result = validateNodeArray(nodes);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.map(n => n.type)).toEqual(['cube', 'sphere']);
    });

    it('should reject null array', () => {
      const result = validateNodeArray(null);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Node array is null or undefined');
    });

    it('should reject non-array input', () => {
      const result = validateNodeArray('not an array' as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Input is not an array');
    });
  });

  describe('createASTError', () => {
    it('should create error message from Error object', () => {
      const error = new Error('Test AST error');
      const result = createASTError('parse AST', error);
      
      expect(result).toBe('Failed to parse AST: Test AST error');
    });

    it('should handle unknown error types', () => {
      const result = createASTError('validate nodes', 'string error');
      
      expect(result).toBe('Failed to validate nodes: Unknown error');
    });

    it('should handle null/undefined errors', () => {
      const result = createASTError('process AST', null);
      
      expect(result).toBe('Failed to process AST: Unknown error');
    });
  });

  describe('withASTErrorHandling', () => {
    it('should return success for successful operation', () => {
      const fn = vi.fn(() => 'test result');
      const result = withASTErrorHandling('test operation', fn);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('test result');
      expect(fn).toHaveBeenCalledOnce();
    });

    it('should handle thrown errors', () => {
      const fn = vi.fn(() => { throw new Error('Test error'); });
      const result = withASTErrorHandling('test operation', fn);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to test operation: Test error');
    });

    it('should handle non-Error exceptions', () => {
      const fn = vi.fn(() => { throw 'string error'; });
      const result = withASTErrorHandling('test operation', fn);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to test operation: Unknown error');
    });
  });

  describe('logASTOperation', () => {
    it('should log operation with basic info', () => {
      const nodes = [createMockASTNode('cube')];
      
      logASTOperation('test operation', nodes);
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        '[AST Service] test operation:',
        expect.objectContaining({
          nodeCount: 1,
          nodeTypes: ['cube']
        })
      );
    });

    it('should include additional info in logs', () => {
      const nodes = [createMockASTNode('cube')];
      const additionalInfo = { parseTime: 150 };
      
      logASTOperation('test operation', nodes, additionalInfo);
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        '[AST Service] test operation:',
        expect.objectContaining({
          nodeCount: 1,
          parseTime: 150
        })
      );
    });

    it('should handle empty node array', () => {
      logASTOperation('test operation', []);
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        '[AST Service] test operation:',
        expect.objectContaining({
          nodeCount: 0,
          nodeTypes: []
        })
      );
    });
  });

  describe('logASTResult', () => {
    it('should log successful result', () => {
      const result: ASTResult<string> = { success: true, data: 'test data' };
      
      logASTResult('test operation', result);
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        '[AST Service] test operation completed successfully',
        undefined
      );
    });

    it('should log failed result', () => {
      const result: ASTResult<string> = { success: false, error: 'test error' };
      
      logASTResult('test operation', result);
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        '[AST Service] test operation failed:',
        'test error',
        undefined
      );
    });

    it('should include additional info in logs', () => {
      const result: ASTResult<string> = { success: true, data: 'test data' };
      const additionalInfo = { nodeCount: 5 };
      
      logASTResult('test operation', result, additionalInfo);
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        '[AST Service] test operation completed successfully',
        additionalInfo
      );
    });
  });

  describe('extractLineNumber', () => {
    it('should extract line number from error message', () => {
      const errorMessage = 'Syntax error at line 42, column 10';
      const result = extractLineNumber(errorMessage);
      
      expect(result).toBe(42);
    });

    it('should return null for message without line number', () => {
      const errorMessage = 'Generic error message';
      const result = extractLineNumber(errorMessage);
      
      expect(result).toBeNull();
    });

    it('should handle multiple line references', () => {
      const errorMessage = 'Error on line 5, expected line 10';
      const result = extractLineNumber(errorMessage);
      
      expect(result).toBe(5); // Should return first match
    });
  });

  describe('extractColumnNumber', () => {
    it('should extract column number from error message', () => {
      const errorMessage = 'Syntax error at line 42, column 15';
      const result = extractColumnNumber(errorMessage);
      
      expect(result).toBe(15);
    });

    it('should return null for message without column number', () => {
      const errorMessage = 'Generic error message';
      const result = extractColumnNumber(errorMessage);
      
      expect(result).toBeNull();
    });
  });

  describe('createParseError', () => {
    it('should create ParseError from error message', () => {
      const errorMessage = 'Syntax error at line 5, column 10';
      const result = createParseError(errorMessage);
      
      expect(result).toEqual({
        message: errorMessage,
        line: 5,
        column: 10,
        severity: 'error'
      });
    });

    it('should use default line/column when not found', () => {
      const errorMessage = 'Generic error';
      const result = createParseError(errorMessage);
      
      expect(result).toEqual({
        message: errorMessage,
        line: 1,
        column: 1,
        severity: 'error'
      });
    });

    it('should allow custom severity', () => {
      const errorMessage = 'Warning message';
      const result = createParseError(errorMessage, 'warning');
      
      expect(result.severity).toBe('warning');
    });
  });

  describe('formatPerformanceTime', () => {
    it('should format time with 2 decimal places', () => {
      expect(formatPerformanceTime(123.456)).toBe('123.46ms');
      expect(formatPerformanceTime(0.123)).toBe('0.12ms');
      expect(formatPerformanceTime(1000)).toBe('1000.00ms');
    });
  });

  describe('isWithinPerformanceTarget', () => {
    it('should check if time is within 300ms target', () => {
      expect(isWithinPerformanceTarget(250)).toBe(true);
      expect(isWithinPerformanceTarget(300)).toBe(true);
      expect(isWithinPerformanceTarget(350)).toBe(false);
    });

    it('should allow custom target', () => {
      expect(isWithinPerformanceTarget(150, 100)).toBe(false);
      expect(isWithinPerformanceTarget(50, 100)).toBe(true);
    });
  });
});
