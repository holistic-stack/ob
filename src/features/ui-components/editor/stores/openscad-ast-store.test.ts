/**
 * @file OpenSCAD AST Store Tests
 * 
 * Comprehensive test suite for the Zustand-based OpenSCAD AST store.
 * Tests state management, debouncing, error handling, and performance requirements.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import {
  useOpenSCADStore,
  useOpenSCADCode,
  useOpenSCADAst,
  useOpenSCADErrors,
  useOpenSCADStatus,
  useOpenSCADActions,
  cleanupOpenSCADStore,
  type OpenSCADCode,
  type ASTData,
  type Result
} from './openscad-ast-store';
import type { ParseError } from '../code-editor/openscad-ast-service';

// Mock dependencies
vi.mock('../code-editor/openscad-ast-service', () => ({
  parseOpenSCADCodeCached: vi.fn(),
  cancelDebouncedParsing: vi.fn(),
  validateAST: vi.fn(() => true),
  getPerformanceMetrics: vi.fn(() => ({ assessment: 'good', recommendation: 'Performance is good' }))
}));

vi.mock('../../shared/performance/performance-monitor', () => ({
  measurePerformance: vi.fn(async (operation: string, fn: () => Promise<any>) => {
    const result = await fn();
    return { result, metrics: { operation, duration: 100, withinTarget: true } };
  })
}));

// Mock shared AST utilities to test integration
vi.mock('../../shared/ast-utils', () => ({
  createParseError: vi.fn((message: string, severity = 'error') => ({
    message,
    line: 1,
    column: 1,
    severity
  })),
  formatPerformanceTime: vi.fn((timeMs: number) => `${timeMs.toFixed(2)}ms`)
}));

// Test data
const validOpenSCADCode = 'cube([10, 10, 10]);' as OpenSCADCode;
const invalidOpenSCADCode = 'cube([10, 10, 10]' as OpenSCADCode; // Missing closing bracket

const mockValidAST: ASTNode[] = [
  { type: 'cube', size: [10, 10, 10] } as any
];

const mockParseError: ParseError = {
  message: 'Syntax error: missing closing bracket',
  line: 1,
  column: 15,
  severity: 'error'
};

describe('OpenSCAD AST Store', () => {
  let mockParseFunction: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Import the mocked module
    const astService = await import('../code-editor/openscad-ast-service');
    mockParseFunction = vi.mocked(astService.parseOpenSCADCodeCached);

    // Reset store to initial state
    const { result } = renderHook(() => useOpenSCADStore());
    act(() => {
      result.current.reset();
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanupOpenSCADStore();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useOpenSCADStore());
      
      expect(result.current.code).toBe('');
      expect(result.current.ast).toEqual([]);
      expect(result.current.parseErrors).toEqual([]);
      expect(result.current.parseStatus).toBe('idle');
      expect(result.current.isParsing).toBe(false);
      expect(result.current.isASTValid).toBe(false);
      expect(result.current.performanceMetrics).toBeNull();
      expect(result.current.lastParseTime).toBeNull();
    });
  });

  describe('updateCode action', () => {
    it('should update code immediately', () => {
      const { result } = renderHook(() => useOpenSCADStore());
      
      act(() => {
        result.current.updateCode('cube([5, 5, 5]);');
      });
      
      expect(result.current.code).toBe('cube([5, 5, 5]);');
    });

    it('should clear AST for empty code', () => {
      const { result } = renderHook(() => useOpenSCADStore());
      
      // First set some code and AST
      act(() => {
        result.current.updateCode('cube([5, 5, 5]);');
      });
      
      // Then clear it
      act(() => {
        result.current.updateCode('');
      });
      
      expect(result.current.code).toBe('');
      expect(result.current.ast).toEqual([]);
      expect(result.current.parseStatus).toBe('idle');
      expect(result.current.isASTValid).toBe(false);
    });

    it('should debounce parsing calls', () => {
      const { result } = renderHook(() => useOpenSCADStore());

      // Rapid code updates
      act(() => {
        result.current.updateCode('c');
      });
      act(() => {
        result.current.updateCode('cu');
      });
      act(() => {
        result.current.updateCode('cub');
      });
      act(() => {
        result.current.updateCode('cube([10, 10, 10]);');
      });

      // Should not parse immediately
      expect(mockParseFunction).not.toHaveBeenCalled();

      // Fast-forward through debounce period
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should have called parse function once after debounce
      expect(mockParseFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe('parseAST action', () => {
    it('should parse valid OpenSCAD code successfully', async () => {
      mockParseFunction.mockResolvedValue({
        success: true,
        ast: mockValidAST,
        errors: [],
        parseTime: 150,
      });

      const { result } = renderHook(() => useOpenSCADStore());

      const parseResult = await act(async () => {
        return await result.current.parseAST(validOpenSCADCode, { immediate: true });
      });

      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(result.current.ast).toEqual(parseResult.data);
      }

      expect(result.current.ast).toEqual(mockValidAST);
      expect(result.current.parseStatus).toBe('success');
      expect(result.current.isParsing).toBe(false);
      expect(result.current.isASTValid).toBe(true);
      expect(result.current.parseErrors).toEqual([]);
    });

    it('should handle parse errors gracefully', async () => {
      mockParseFunction.mockResolvedValue({
        success: false,
        ast: [],
        errors: [mockParseError],
        parseTime: 200,
      });

      const { result } = renderHook(() => useOpenSCADStore());

      const parseResult = await act(async () => {
        return await result.current.parseAST(invalidOpenSCADCode, { immediate: true });
      });

      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        expect(result.current.parseErrors).toEqual(parseResult.error);
      }

      expect(result.current.ast).toEqual([]);
      expect(result.current.parseStatus).toBe('error');
      expect(result.current.isParsing).toBe(false);
      expect(result.current.isASTValid).toBe(false);
      expect(result.current.parseErrors).toEqual([mockParseError]);
    });

    it('should track performance metrics', async () => {
      const slowParseTime = 400; // Exceeds 300ms target
      mockParseFunction.mockResolvedValue({
        success: true,
        ast: mockValidAST,
        errors: [],
        parseTime: slowParseTime,
      });

      const { result } = renderHook(() => useOpenSCADStore());

      await act(async () => {
        await result.current.parseAST(validOpenSCADCode, { immediate: true });
      });

      expect(result.current.lastParseTime).toBe(slowParseTime);
      expect(result.current.performanceMetrics).toEqual({
        assessment: 'good',
        recommendation: 'Performance is good',
      });
    });

    it('should handle parser crashes', async () => {
      const error = new Error('Parser crashed');
      mockParseFunction.mockRejectedValue(error);

      const { result } = renderHook(() => useOpenSCADStore());

      const parseResult = await act(async () => {
        return await result.current.parseAST(validOpenSCADCode, { immediate: true });
      });

      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        expect(parseResult.error).toHaveLength(1);
        const firstError = parseResult.error?.[0];
        expect(firstError).toBeDefined();
        expect(firstError?.message).toBe('Parser crashed');
      }
      expect(result.current.parseStatus).toBe('error');
      expect(result.current.parseErrors).toHaveLength(1);
      const firstStoreError = result.current.parseErrors[0];
      expect(firstStoreError).toBeDefined();
      if (firstStoreError) {
        expect(firstStoreError.message).toBe('Parser crashed');
      }
    });
  });

  describe('error management actions', () => {
    it('should set parse errors manually', () => {
      const { result } = renderHook(() => useOpenSCADStore());
      
      act(() => {
        result.current.setParseErrors([mockParseError]);
      });
      
      expect(result.current.parseErrors).toEqual([mockParseError]);
      expect(result.current.parseStatus).toBe('error');
      expect(result.current.isASTValid).toBe(false);
    });

    it('should clear errors', () => {
      const { result } = renderHook(() => useOpenSCADStore());
      
      // First set some errors
      act(() => {
        result.current.setParseErrors([mockParseError]);
      });
      
      // Then clear them
      act(() => {
        result.current.clearErrors();
      });
      
      expect(result.current.parseErrors).toEqual([]);
      expect(result.current.parseStatus).toBe('idle');
    });
  });

  describe('store management actions', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useOpenSCADStore());
      
      // Set some state
      act(() => {
        result.current.updateCode('cube([5, 5, 5]);');
        result.current.setParseErrors([mockParseError]);
      });
      
      // Reset
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.code).toBe('');
      expect(result.current.ast).toEqual([]);
      expect(result.current.parseErrors).toEqual([]);
      expect(result.current.parseStatus).toBe('idle');
      expect(result.current.isParsing).toBe(false);
    });

    it('should cancel parsing operations', () => {
      const { result } = renderHook(() => useOpenSCADStore());
      
      // Set parsing state
      act(() => {
        result.current.updateCode('cube([5, 5, 5]);');
      });
      
      // Cancel parsing
      act(() => {
        result.current.cancelParsing();
      });
      
      expect(result.current.isParsing).toBe(false);
    });

    it('should provide state snapshot', () => {
      const { result } = renderHook(() => useOpenSCADStore());
      
      act(() => {
        result.current.updateCode('cube([5, 5, 5]);');
      });
      
      const snapshot = result.current.getSnapshot();
      
      expect(snapshot).toEqual({
        code: 'cube([5, 5, 5]);',
        ast: [],
        parseErrors: [],
        parseStatus: 'idle',
        isParsing: false
      });
    });
  });

  describe('selector hooks', () => {
    it('should provide selective subscriptions', () => {
      // Test that selector hooks exist and return expected types
      expect(typeof useOpenSCADCode).toBe('function');
      expect(typeof useOpenSCADAst).toBe('function');
      expect(typeof useOpenSCADErrors).toBe('function');
      expect(typeof useOpenSCADStatus).toBe('function');
      expect(typeof useOpenSCADActions).toBe('function');
    });
  });

  describe('performance requirements', () => {
    it('should meet 300ms debouncing requirement', () => {
      const { result } = renderHook(() => useOpenSCADStore());

      act(() => {
        result.current.updateCode('cube([5, 5, 5]);');
      });

      // Should not parse immediately
      expect(mockParseFunction).not.toHaveBeenCalled();

      // Should parse after 300ms
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockParseFunction).toHaveBeenCalledTimes(1);
    });

    it('should track performance against 300ms target', async () => {
      const fastParseTime = 250; // Within target
      mockParseFunction.mockResolvedValue({
        success: true,
        ast: mockValidAST,
        errors: [],
        parseTime: fastParseTime
      });

      const { result } = renderHook(() => useOpenSCADStore());

      await act(async () => {
        await result.current.parseAST(validOpenSCADCode, { immediate: true });
      });

      expect(result.current.performanceMetrics?.withinTarget).toBe(true);
    });
  });

  describe('Phase 3 Refactoring: Shared Utilities Integration', () => {
    let mockCreateParseError: any;
    let mockFormatPerformanceTime: any;

    beforeEach(async () => {
      // Import the mocked shared utilities
      const astUtils = await import('../../shared/ast-utils');
      mockCreateParseError = vi.mocked(astUtils.createParseError);
      mockFormatPerformanceTime = vi.mocked(astUtils.formatPerformanceTime);
    });

    describe('error handling with shared utilities', () => {
      it('should use createParseError for exception handling', async () => {
        const error = new Error('Custom parser error');
        mockParseFunction.mockRejectedValue(error);

        const { result } = renderHook(() => useOpenSCADStore());

        await act(async () => {
          await result.current.parseAST(validOpenSCADCode, { immediate: true });
        });

        // Verify that createParseError was called with the error message
        expect(mockCreateParseError).toHaveBeenCalledWith('Custom parser error');
        expect(result.current.parseStatus).toBe('error');
        expect(result.current.parseErrors).toHaveLength(1);
      });

      it('should handle unknown error types with shared utility', async () => {
        const unknownError = 'String error';
        mockParseFunction.mockRejectedValue(unknownError);

        const { result } = renderHook(() => useOpenSCADStore());

        await act(async () => {
          await result.current.parseAST(validOpenSCADCode, { immediate: true });
        });

        // Verify that createParseError was called with 'Unknown parsing error'
        expect(mockCreateParseError).toHaveBeenCalledWith('Unknown parsing error');
      });

      it('should maintain error format consistency', async () => {
        const error = new Error('Syntax error at line 5, column 10');
        mockParseFunction.mockRejectedValue(error);

        // Mock createParseError to return a properly formatted error
        mockCreateParseError.mockReturnValue({
          message: 'Syntax error at line 5, column 10',
          line: 5,
          column: 10,
          severity: 'error'
        });

        const { result } = renderHook(() => useOpenSCADStore());

        await act(async () => {
          await result.current.parseAST(validOpenSCADCode, { immediate: true });
        });

        expect(result.current.parseErrors[0]).toEqual({
          message: 'Syntax error at line 5, column 10',
          line: 5,
          column: 10,
          severity: 'error'
        });
      });
    });

    describe('performance logging with shared utilities', () => {
      it('should use formatPerformanceTime for success logging', async () => {
        const parseTime = 150;
        mockParseFunction.mockResolvedValue({
          success: true,
          ast: mockValidAST,
          errors: [],
          parseTime
        });

        const { result } = renderHook(() => useOpenSCADStore());

        await act(async () => {
          await result.current.parseAST(validOpenSCADCode, { immediate: true });
        });

        // Verify that formatPerformanceTime was called with the parse time
        expect(mockFormatPerformanceTime).toHaveBeenCalledWith(parseTime);
      });

      it('should format performance time consistently across operations', async () => {
        const parseTime = 275.456;
        mockParseFunction.mockResolvedValue({
          success: true,
          ast: mockValidAST,
          errors: [],
          parseTime
        });

        // Mock formatPerformanceTime to return formatted string
        mockFormatPerformanceTime.mockReturnValue('275.46ms');

        const { result } = renderHook(() => useOpenSCADStore());

        await act(async () => {
          await result.current.parseAST(validOpenSCADCode, { immediate: true });
        });

        expect(mockFormatPerformanceTime).toHaveBeenCalledWith(275.456);
      });
    });

    describe('backward compatibility validation', () => {
      it('should maintain exact same API behavior after refactoring', async () => {
        // Test that the store behaves identically to pre-refactoring version
        mockParseFunction.mockResolvedValue({
          success: true,
          ast: mockValidAST,
          errors: [],
          parseTime: 150
        });

        const { result } = renderHook(() => useOpenSCADStore());

        const parseResult = await act(async () => {
          return await result.current.parseAST(validOpenSCADCode, { immediate: true });
        });

        // Verify all state properties are set correctly
        expect(parseResult.success).toBe(true);
        expect(result.current.ast).toEqual(mockValidAST);
        expect(result.current.parseStatus).toBe('success');
        expect(result.current.isParsing).toBe(false);
        expect(result.current.isASTValid).toBe(true);
        expect(result.current.parseErrors).toEqual([]);
      });

      it('should preserve error handling behavior after refactoring', async () => {
        const originalError = new Error('Original error message');
        mockParseFunction.mockRejectedValue(originalError);

        const { result } = renderHook(() => useOpenSCADStore());

        const parseResult = await act(async () => {
          return await result.current.parseAST(validOpenSCADCode, { immediate: true });
        });

        // Verify error handling maintains same behavior
        expect(parseResult.success).toBe(false);
        expect(result.current.parseStatus).toBe('error');
        expect(result.current.isParsing).toBe(false);
        expect(result.current.isASTValid).toBe(false);
        expect(result.current.parseErrors).toHaveLength(1);
      });
    });

    describe('integration stress testing', () => {
      it('should handle rapid successive parsing operations with shared utilities', async () => {
        let callCount = 0;
        mockParseFunction.mockImplementation(() => {
          callCount++;
          return Promise.resolve({
            success: true,
            ast: mockValidAST,
            errors: [],
            parseTime: 100 + callCount * 10 // Varying parse times
          });
        });

        const { result } = renderHook(() => useOpenSCADStore());

        // Perform multiple rapid parsing operations
        const promises = [];
        for (let i = 0; i < 5; i++) {
          promises.push(
            act(async () => {
              return await result.current.parseAST(`cube([${i}, ${i}, ${i}]);` as OpenSCADCode, { immediate: true });
            })
          );
        }

        await Promise.all(promises);

        // Verify shared utilities were called multiple times
        expect(mockFormatPerformanceTime).toHaveBeenCalledTimes(5);
        expect(result.current.parseStatus).toBe('success');
      });

      it('should handle sequential success/error scenarios with shared utilities', async () => {
        const { result } = renderHook(() => useOpenSCADStore());

        // First operation: success
        mockParseFunction.mockResolvedValueOnce({
          success: true,
          ast: mockValidAST,
          errors: [],
          parseTime: 150
        });

        await act(async () => {
          await result.current.parseAST(validOpenSCADCode, { immediate: true });
        });

        expect(result.current.parseStatus).toBe('success');
        expect(mockFormatPerformanceTime).toHaveBeenCalledWith(150);

        // Reset mocks for second operation
        vi.clearAllMocks();

        // Second operation: error
        const error = new Error('Parse error');
        mockParseFunction.mockRejectedValueOnce(error);

        await act(async () => {
          await result.current.parseAST(invalidOpenSCADCode, { immediate: true });
        });

        expect(result.current.parseStatus).toBe('error');
        expect(mockCreateParseError).toHaveBeenCalledWith('Parse error');
      });
    });
  });
});
