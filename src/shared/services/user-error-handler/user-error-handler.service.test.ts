/**
 * @file Tests for User Error Handler Service
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  UserErrorHandlerService,
  ErrorCategory,
  type UserErrorMessage,
} from './user-error-handler.service';
import { createEnhancedError } from '../../utils/error';

describe('UserErrorHandlerService', () => {
  let service: UserErrorHandlerService;

  beforeEach(() => {
    service = new UserErrorHandlerService();
  });

  afterEach(() => {
    service.dispose();
  });

  describe('error handling', () => {
    it('should handle syntax errors correctly', () => {
      const error = new Error('Syntax error: missing semicolon at line 5');
      
      const result = service.handleError(error);
      
      expect(result.title).toBe('Syntax Error in OpenSCAD Code');
      expect(result.severity).toBe('warning');
      expect(result.canRetry).toBe(true);
      expect(result.canRecover).toBe(true);
      expect(result.suggestions).toContain('Check for missing semicolons at the end of statements');
      expect(result.helpUrl).toBe('https://openscad.org/documentation.html');
    });

    it('should handle feature not supported errors', () => {
      const error = new Error('Feature not supported: advanced_hull operation');
      
      const result = service.handleError(error);
      
      expect(result.title).toBe('Feature Not Supported');
      expect(result.severity).toBe('info');
      expect(result.canRetry).toBe(false);
      expect(result.canRecover).toBe(true);
      expect(result.suggestions).toContain('Try using alternative OpenSCAD functions');
    });

    it('should handle WebGL rendering errors', () => {
      const error = new Error('WebGL context lost during rendering');
      
      const result = service.handleError(error);
      
      expect(result.title).toBe('Rendering Error');
      expect(result.severity).toBe('error');
      expect(result.canRetry).toBe(true);
      expect(result.canRecover).toBe(true);
      expect(result.suggestions).toContain('Try refreshing the page');
      expect(result.suggestions).toContain('Update your graphics drivers');
    });

    it('should handle browser compatibility issues', () => {
      const error = new Error('WebGL not supported in this browser');
      
      const result = service.handleError(error);
      
      expect(result.title).toBe('Browser Compatibility Issue');
      expect(result.severity).toBe('critical');
      expect(result.canRetry).toBe(false);
      expect(result.canRecover).toBe(false);
      expect(result.suggestions).toContain('Use a modern browser (Chrome, Firefox, Safari, or Edge)');
      expect(result.helpUrl).toBe('https://caniuse.com/webgl');
    });

    it('should handle performance issues', () => {
      const error = new Error('Operation timeout: model too complex');
      
      const result = service.handleError(error);
      
      expect(result.title).toBe('Performance Issue');
      expect(result.severity).toBe('warning');
      expect(result.canRetry).toBe(true);
      expect(result.canRecover).toBe(true);
      expect(result.suggestions).toContain('Reduce the number of objects in your model');
    });

    it('should handle network errors', () => {
      const error = new Error('Network connection timeout');
      
      const result = service.handleError(error);
      
      expect(result.title).toBe('Network Error');
      expect(result.severity).toBe('error');
      expect(result.canRetry).toBe(true);
      expect(result.canRecover).toBe(false);
      expect(result.suggestions).toContain('Check your internet connection');
    });

    it('should handle unknown errors with fallback', () => {
      const error = new Error('Some completely unknown error type');
      
      const result = service.handleError(error);
      
      expect(result.title).toBe('Unexpected Error');
      expect(result.severity).toBe('error');
      expect(result.canRetry).toBe(true);
      expect(result.canRecover).toBe(true);
      expect(result.suggestions).toContain('Try refreshing the page');
      expect(result.technicalDetails).toContain('Some completely unknown error type');
    });
  });

  describe('enhanced error handling', () => {
    it('should handle enhanced errors with additional context', () => {
      const enhancedError = createEnhancedError({
        message: 'Syntax error in OpenSCAD code',
        code: 'PARSE_ERROR',
        location: { file: 'model.scad', line: 10, column: 5 },
        context: { operation: 'parsing' },
      });
      
      const result = service.handleError(enhancedError);
      
      expect(result.title).toBe('Syntax Error in OpenSCAD Code');
      expect(result.technicalDetails).toContain('Code: PARSE_ERROR');
      expect(result.technicalDetails).toContain('Location:');
    });
  });

  describe('error type handling', () => {
    it('should handle string errors', () => {
      const result = service.handleError('Simple string error');
      
      expect(result.title).toBe('Unexpected Error');
      expect(result.message).toContain('Something unexpected happened');
    });

    it('should handle object errors with message property', () => {
      const error = { message: 'Object error with message' };
      
      const result = service.handleError(error);
      
      expect(result.title).toBe('Unexpected Error');
      expect(result.technicalDetails).toBeUndefined();
    });

    it('should handle null/undefined errors', () => {
      const result1 = service.handleError(null);
      const result2 = service.handleError(undefined);
      
      expect(result1.title).toBe('Unexpected Error');
      expect(result2.title).toBe('Unexpected Error');
    });
  });

  describe('result type handling', () => {
    it('should return error as Result type', () => {
      const error = new Error('Test error');
      
      const result = service.handleErrorAsResult(error);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.title).toBe('Unexpected Error');
        expect(result.error.message).toContain('Something unexpected happened');
      }
    });
  });

  describe('utility methods', () => {
    it('should get suggestions for specific categories', () => {
      const syntaxSuggestions = service.getSuggestionsForCategory(ErrorCategory.SYNTAX_ERROR);
      const renderingSuggestions = service.getSuggestionsForCategory(ErrorCategory.RENDERING_ERROR);
      
      expect(syntaxSuggestions).toContain('Check for missing semicolons at the end of statements');
      expect(renderingSuggestions).toContain('Try refreshing the page');
    });

    it('should check if errors are recoverable', () => {
      const syntaxError = new Error('Syntax error: missing semicolon');
      const browserError = new Error('WebGL not supported in this browser');

      expect(service.isRecoverable(syntaxError)).toBe(true);
      expect(service.isRecoverable(browserError)).toBe(false);
    });

    it('should check if operations can be retried', () => {
      const networkError = new Error('Network connection timeout');
      const featureError = new Error('Feature not supported');
      
      expect(service.canRetry(networkError)).toBe(true);
      expect(service.canRetry(featureError)).toBe(false);
    });
  });

  describe('technical details extraction', () => {
    it('should extract technical details from Error objects', () => {
      const error = new Error('Test error');
      error.name = 'TestError';
      
      const result = service.handleError(error);
      
      expect(result.technicalDetails).toContain('Error: TestError');
      expect(result.technicalDetails).toContain('Message: Test error');
    });

    it('should extract stack trace information', () => {
      const error = new Error('Test error with stack');
      // Mock stack trace
      error.stack = 'Error: Test error\n    at test (file.js:1:1)\n    at run (file.js:2:2)';
      
      const result = service.handleError(error);
      
      expect(result.technicalDetails).toContain('Stack:');
    });
  });

  describe('error handling resilience', () => {
    it('should handle errors in error handling gracefully', () => {
      // Create a problematic error object that might cause issues
      const problematicError = {
        get message() {
          throw new Error('Error accessing message');
        }
      };
      
      const result = service.handleError(problematicError);
      
      expect(result.title).toBe('Critical Error');
      expect(result.severity).toBe('critical');
      expect(result.canRetry).toBe(false);
      expect(result.canRecover).toBe(false);
    });
  });

  describe('pattern matching', () => {
    it('should match case-insensitive patterns', () => {
      const upperCaseError = new Error('SYNTAX ERROR IN CODE');
      const lowerCaseError = new Error('syntax error in code');
      const mixedCaseError = new Error('Syntax Error in Code');
      
      const result1 = service.handleError(upperCaseError);
      const result2 = service.handleError(lowerCaseError);
      const result3 = service.handleError(mixedCaseError);
      
      expect(result1.title).toBe('Syntax Error in OpenSCAD Code');
      expect(result2.title).toBe('Syntax Error in OpenSCAD Code');
      expect(result3.title).toBe('Syntax Error in OpenSCAD Code');
    });

    it('should match partial patterns', () => {
      const error1 = new Error('Unexpected token "}" at line 5');
      const error2 = new Error('Missing semicolon after statement');
      
      const result1 = service.handleError(error1);
      const result2 = service.handleError(error2);
      
      expect(result1.title).toBe('Syntax Error in OpenSCAD Code');
      expect(result2.title).toBe('Syntax Error in OpenSCAD Code');
    });
  });

  describe('disposal', () => {
    it('should dispose cleanly', () => {
      expect(() => service.dispose()).not.toThrow();
    });
  });
});
