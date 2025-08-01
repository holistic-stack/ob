/**
 * Result Types Test Suite
 *
 * Tests for functional error handling types and type guards
 * following TDD methodology with comprehensive coverage.
 */

import { describe, expect, it } from 'vitest';
import {
  type Brand,
  type ComponentId,
  isError,
  isNone,
  isSome,
  isSuccess,
  type NetworkError,
  type NetworkResult,
  type Option,
  type Result,
  type ValidationResult,
} from '@/shared';

describe('Result Types', () => {
  describe('Result<T,E> type', () => {
    it('should create success result correctly', () => {
      const result: Result<string, Error> = {
        success: true,
        data: 'test value',
      };

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test value');
      }
    });

    it('should create error result correctly', () => {
      const error = new Error('test error');
      const result: Result<string, Error> = {
        success: false,
        error,
      };

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('Type Guards', () => {
    describe('isSuccess', () => {
      it('should correctly identify success results', () => {
        const successResult: Result<number, string> = {
          success: true,
          data: 42,
        };

        expect(isSuccess(successResult)).toBe(true);

        if (isSuccess(successResult)) {
          // TypeScript should narrow the type here
          expect(successResult.data).toBe(42);
        }
      });

      it('should correctly identify error results as not success', () => {
        const errorResult: Result<number, string> = {
          success: false,
          error: 'test error',
        };

        expect(isSuccess(errorResult)).toBe(false);
      });
    });

    describe('isError', () => {
      it('should correctly identify error results', () => {
        const errorResult: Result<number, string> = {
          success: false,
          error: 'test error',
        };

        expect(isError(errorResult)).toBe(true);

        if (isError(errorResult)) {
          // TypeScript should narrow the type here
          expect(errorResult.error).toBe('test error');
        }
      });

      it('should correctly identify success results as not error', () => {
        const successResult: Result<number, string> = {
          success: true,
          data: 42,
        };

        expect(isError(successResult)).toBe(false);
      });
    });
  });

  describe('Option<T> type', () => {
    it('should create Some option correctly', () => {
      const option: Option<string> = {
        some: true,
        value: 'test value',
      };

      expect(option.some).toBe(true);
      if (option.some) {
        expect(option.value).toBe('test value');
      }
    });

    it('should create None option correctly', () => {
      const option: Option<string> = {
        some: false,
      };

      expect(option.some).toBe(false);
    });

    describe('Option type guards', () => {
      it('should correctly identify Some options', () => {
        const someOption: Option<number> = {
          some: true,
          value: 42,
        };

        expect(isSome(someOption)).toBe(true);

        if (isSome(someOption)) {
          expect(someOption.value).toBe(42);
        }
      });

      it('should correctly identify None options', () => {
        const noneOption: Option<number> = {
          some: false,
        };

        expect(isNone(noneOption)).toBe(true);
      });
    });
  });

  describe('Specialized Result types', () => {
    describe('ValidationResult', () => {
      it('should handle successful validation', () => {
        const result: ValidationResult<{ name: string }> = {
          success: true,
          data: { name: 'John' },
        };

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.name).toBe('John');
        }
      });

      it('should handle validation errors', () => {
        const result: ValidationResult<{ name: string }> = {
          success: false,
          error: ['Name is required', 'Name must be at least 2 characters'],
        };

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error).toHaveLength(2);
          expect(result.error[0]).toBe('Name is required');
        }
      });
    });

    describe('NetworkResult', () => {
      it('should handle successful network operations', () => {
        const result: NetworkResult<{ id: number }> = {
          success: true,
          data: { id: 123 },
        };

        expect(isSuccess(result)).toBe(true);
      });

      it('should handle network errors', () => {
        const networkError: NetworkError = {
          status: 404,
          message: 'Not Found',
          details: { resource: 'user' },
        };

        const result: NetworkResult<{ id: number }> = {
          success: false,
          error: networkError,
        };

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.status).toBe(404);
          expect(result.error.message).toBe('Not Found');
        }
      });
    });
  });

  describe('Branded Types', () => {
    it('should create branded types correctly', () => {
      const componentId: ComponentId = 'comp-123' as ComponentId;

      // Branded types should be assignable to their base type
      const baseString: string = componentId;
      expect(baseString).toBe('comp-123');
    });

    it('should work with generic Brand utility type', () => {
      type CustomId = Brand<string, 'CustomId'>;
      const customId: CustomId = 'custom-456' as CustomId;

      expect(customId).toBe('custom-456');
    });
  });
});
