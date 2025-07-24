/**
 * @file axis-errors.test.ts
 * @description Tests for axis error handling module
 */

import { describe, expect, it, vi } from 'vitest';
import { AXIS_NAMES } from '../axis-constants/axis-constants';
import {
  AxisErrorFactory,
  AxisErrorUtils,
  AxisResultUtils,
  type AxisCreationError,
  type AxisError,
  type AxisResult,
} from './axis-errors';

describe('AxisErrors', () => {
  describe('AxisErrorFactory', () => {
    describe('createCreationError', () => {
      it('should create a creation error with all properties', () => {
        const error = AxisErrorFactory.createCreationError(
          'Test creation error',
          'create_cylinder',
          'X',
          { test: 'context' }
        );

        expect(error.code).toBe('AXIS_CREATION_ERROR');
        expect(error.message).toBe('Test creation error');
        expect(error.operation).toBe('create_cylinder');
        expect(error.axisName).toBe('X');
        expect(error.context).toEqual({ test: 'context' });
        expect(error.timestamp).toBeTypeOf('number');
        expect(error.timestamp).toBeGreaterThan(0);
      });

      it('should create a creation error without optional properties', () => {
        const error = AxisErrorFactory.createCreationError(
          'Test creation error',
          'create_material'
        );

        expect(error.code).toBe('AXIS_CREATION_ERROR');
        expect(error.message).toBe('Test creation error');
        expect(error.operation).toBe('create_material');
        expect(error.axisName).toBeUndefined();
        expect(error.context).toBeUndefined();
      });
    });

    describe('createConfigurationError', () => {
      it('should create a configuration error', () => {
        const error = AxisErrorFactory.createConfigurationError(
          'Invalid field value',
          'pixelWidth',
          -1,
          'positive number'
        );

        expect(error.code).toBe('AXIS_CONFIGURATION_ERROR');
        expect(error.message).toBe('Invalid field value');
        expect(error.field).toBe('pixelWidth');
        expect(error.value).toBe(-1);
        expect(error.expectedType).toBe('positive number');
      });
    });

    describe('createRenderError', () => {
      it('should create a render error', () => {
        const error = AxisErrorFactory.createRenderError(
          'Render failed',
          'initialization',
          { sceneId: 'test-scene' }
        );

        expect(error.code).toBe('AXIS_RENDER_ERROR');
        expect(error.message).toBe('Render failed');
        expect(error.renderStage).toBe('initialization');
        expect(error.context).toEqual({ sceneId: 'test-scene' });
      });
    });

    describe('createValidationError', () => {
      it('should create a validation error', () => {
        const error = AxisErrorFactory.createValidationError(
          'Invalid color',
          'color',
          'colorField'
        );

        expect(error.code).toBe('AXIS_VALIDATION_ERROR');
        expect(error.message).toBe('Invalid color');
        expect(error.validationType).toBe('color');
        expect(error.field).toBe('colorField');
      });
    });

    describe('createShaderError', () => {
      it('should create a shader error', () => {
        const error = AxisErrorFactory.createShaderError(
          'Shader compilation failed',
          'compilation',
          'screenSpaceAxis'
        );

        expect(error.code).toBe('AXIS_SHADER_ERROR');
        expect(error.message).toBe('Shader compilation failed');
        expect(error.shaderType).toBe('compilation');
        expect(error.shaderName).toBe('screenSpaceAxis');
      });
    });

    describe('fromUnknownError', () => {
      it('should create error from Error instance', () => {
        const originalError = new Error('Original error message');
        const error = AxisErrorFactory.fromUnknownError(
          originalError,
          'test operation'
        );

        expect(error.code).toBe('AXIS_RENDER_ERROR');
        expect(error.message).toContain('test operation');
        expect(error.message).toContain('Original error message');
        expect(error.renderStage).toBe('initialization');
        expect(error.context?.originalError).toBe(originalError);
      });

      it('should create error from string', () => {
        const error = AxisErrorFactory.fromUnknownError(
          'String error',
          'test operation'
        );

        expect(error.code).toBe('AXIS_RENDER_ERROR');
        expect(error.message).toContain('String error');
        expect(error.context?.originalError).toBe('String error');
      });

      it('should create error from unknown type', () => {
        const unknownError = { custom: 'object' };
        const error = AxisErrorFactory.fromUnknownError(
          unknownError,
          'test operation'
        );

        expect(error.code).toBe('AXIS_RENDER_ERROR');
        expect(error.message).toContain('[object Object]');
        expect(error.context?.originalError).toBe(unknownError);
      });
    });
  });

  describe('AxisErrorUtils', () => {
    const mockError: AxisCreationError = {
      code: 'AXIS_CREATION_ERROR',
      message: 'Test error',
      timestamp: 1234567890000,
      operation: 'create_cylinder',
      axisName: 'X',
      context: { test: 'value' },
    };

    describe('isAxisError', () => {
      it('should identify valid axis errors', () => {
        expect(AxisErrorUtils.isAxisError(mockError)).toBe(true);
      });

      it('should reject invalid objects', () => {
        expect(AxisErrorUtils.isAxisError({})).toBe(false);
        expect(AxisErrorUtils.isAxisError({ code: 'INVALID' })).toBe(false);
        expect(AxisErrorUtils.isAxisError({ message: 'test' })).toBe(false);
        expect(AxisErrorUtils.isAxisError(null)).toBe(false);
        expect(AxisErrorUtils.isAxisError(undefined)).toBe(false);
        expect(AxisErrorUtils.isAxisError('string')).toBe(false);
      });
    });

    describe('isAxisErrorOfType', () => {
      it('should identify specific error types', () => {
        expect(
          AxisErrorUtils.isAxisErrorOfType(mockError, 'AXIS_CREATION_ERROR')
        ).toBe(true);
        expect(
          AxisErrorUtils.isAxisErrorOfType(mockError, 'AXIS_RENDER_ERROR')
        ).toBe(false);
      });

      it('should reject non-axis errors', () => {
        expect(
          AxisErrorUtils.isAxisErrorOfType({}, 'AXIS_CREATION_ERROR')
        ).toBe(false);
      });
    });

    describe('formatError', () => {
      it('should format creation error', () => {
        const error = AxisErrorFactory.createCreationError(
          'Test error',
          'create_cylinder',
          'X',
          { test: 'context' }
        );

        const formatted = AxisErrorUtils.formatError(error);
        expect(formatted).toContain('AXIS_CREATION_ERROR');
        expect(formatted).toContain('Test error');
        expect(formatted).toContain('create_cylinder');
        expect(formatted).toContain('axis: X');
        // Check that timestamp is included (should be current time)
        expect(formatted).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
      });

      it('should format configuration error', () => {
        const configError = AxisErrorFactory.createConfigurationError(
          'Config error',
          'testField',
          'testValue'
        );
        const formatted = AxisErrorUtils.formatError(configError);
        expect(formatted).toContain('AXIS_CONFIGURATION_ERROR');
        expect(formatted).toContain('field: testField');
        expect(formatted).toContain('value: "testValue"');
      });

      it('should format render error', () => {
        const renderError = AxisErrorFactory.createRenderError(
          'Render error',
          'update'
        );
        const formatted = AxisErrorUtils.formatError(renderError);
        expect(formatted).toContain('AXIS_RENDER_ERROR');
        expect(formatted).toContain('stage: update');
      });

      it('should format validation error', () => {
        const validationError = AxisErrorFactory.createValidationError(
          'Validation error',
          'numeric',
          'testField'
        );
        const formatted = AxisErrorUtils.formatError(validationError);
        expect(formatted).toContain('AXIS_VALIDATION_ERROR');
        expect(formatted).toContain('type: numeric');
        expect(formatted).toContain('field: testField');
      });

      it('should format shader error', () => {
        const shaderError = AxisErrorFactory.createShaderError(
          'Shader error',
          'vertex',
          'testShader'
        );
        const formatted = AxisErrorUtils.formatError(shaderError);
        expect(formatted).toContain('AXIS_SHADER_ERROR');
        expect(formatted).toContain('type: vertex');
        expect(formatted).toContain('shader: testShader');
      });
    });

    describe('extractContext', () => {
      it('should extract error context', () => {
        const context = AxisErrorUtils.extractContext(mockError);
        expect(context).toEqual({
          code: 'AXIS_CREATION_ERROR',
          timestamp: 1234567890000,
          test: 'value',
        });
      });

      it('should handle errors without context', () => {
        const errorWithoutContext = AxisErrorFactory.createRenderError(
          'Test',
          'initialization'
        );
        const context = AxisErrorUtils.extractContext(errorWithoutContext);
        expect(context.code).toBe('AXIS_RENDER_ERROR');
        expect(context.timestamp).toBeTypeOf('number');
      });
    });

    describe('getUserFriendlyMessage', () => {
      it('should return user-friendly messages for each error type', () => {
        const creationError = AxisErrorFactory.createCreationError(
          'Test',
          'create_cylinder'
        );
        expect(AxisErrorUtils.getUserFriendlyMessage(creationError)).toContain(
          'Failed to create 3D axis'
        );

        const configError = AxisErrorFactory.createConfigurationError(
          'Test',
          'testField',
          'value'
        );
        expect(AxisErrorUtils.getUserFriendlyMessage(configError)).toContain(
          'Invalid axis configuration'
        );

        const renderError = AxisErrorFactory.createRenderError(
          'Test',
          'initialization'
        );
        expect(AxisErrorUtils.getUserFriendlyMessage(renderError)).toContain(
          'Failed to render 3D axes'
        );

        const validationError = AxisErrorFactory.createValidationError(
          'Test',
          'color'
        );
        expect(AxisErrorUtils.getUserFriendlyMessage(validationError)).toContain(
          'Invalid axis settings'
        );

        const shaderError = AxisErrorFactory.createShaderError(
          'Test',
          'vertex'
        );
        expect(AxisErrorUtils.getUserFriendlyMessage(shaderError)).toContain(
          'Graphics rendering error'
        );
      });
    });
  });

  describe('AxisResultUtils', () => {
    describe('success', () => {
      it('should create successful result', () => {
        const result = AxisResultUtils.success('test data');
        expect(result.success).toBe(true);
        expect(result.data).toBe('test data');
      });
    });

    describe('failure', () => {
      it('should create failed result', () => {
        const error = AxisErrorFactory.createRenderError('Test', 'initialization');
        const result = AxisResultUtils.failure(error);
        expect(result.success).toBe(false);
        expect(result.error).toBe(error);
      });
    });

    describe('failureFromUnknown', () => {
      it('should create failed result from unknown error', () => {
        const result = AxisResultUtils.failureFromUnknown(
          new Error('Test error'),
          'test operation'
        );
        expect(result.success).toBe(false);
        expect(result.error.code).toBe('AXIS_RENDER_ERROR');
        expect(result.error.message).toContain('test operation');
      });
    });

    describe('isSuccess', () => {
      it('should identify successful results', () => {
        const successResult = AxisResultUtils.success('data');
        const failureResult = AxisResultUtils.failure(
          AxisErrorFactory.createRenderError('Test', 'initialization')
        );

        expect(AxisResultUtils.isSuccess(successResult)).toBe(true);
        expect(AxisResultUtils.isSuccess(failureResult)).toBe(false);
      });
    });

    describe('isFailure', () => {
      it('should identify failed results', () => {
        const successResult = AxisResultUtils.success('data');
        const failureResult = AxisResultUtils.failure(
          AxisErrorFactory.createRenderError('Test', 'initialization')
        );

        expect(AxisResultUtils.isFailure(successResult)).toBe(false);
        expect(AxisResultUtils.isFailure(failureResult)).toBe(true);
      });
    });
  });
});