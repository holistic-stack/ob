/**
 * @file Orientation Gizmo Types Test Suite
 * @description Comprehensive test suite for orientation gizmo type definitions,
 * validating type safety, immutability, and functional programming patterns.
 * Tests branded types, Result<T,E> patterns, and configuration validation.
 *
 * @example Running Tests
 * ```bash
 * pnpm test orientation-gizmo.types.test.ts
 * ```
 */

import { Vector3 } from '@babylonjs/core';
import { describe, expect, it } from 'vitest';
import type {
  GizmoConfig,
  GizmoError,
  GizmoId,
  GizmoInitOptions,
  GizmoInteractionEvent,
  GizmoState,
} from './orientation-gizmo.types';
import {
  AxisDirection,
  createGizmoId,
  DEFAULT_GIZMO_CONFIG,
  GizmoErrorCode,
  GizmoPosition,
  isSupportedCamera,
} from './orientation-gizmo.types';

describe('OrientationGizmoTypes', () => {
  describe('Enums', () => {
    it('should define correct GizmoPosition values', () => {
      expect(GizmoPosition.TOP_LEFT).toBe('top-left');
      expect(GizmoPosition.TOP_RIGHT).toBe('top-right');
      expect(GizmoPosition.BOTTOM_LEFT).toBe('bottom-left');
      expect(GizmoPosition.BOTTOM_RIGHT).toBe('bottom-right');
    });

    it('should define correct AxisDirection values', () => {
      expect(AxisDirection.POSITIVE_X).toBe('+x');
      expect(AxisDirection.NEGATIVE_X).toBe('-x');
      expect(AxisDirection.POSITIVE_Y).toBe('+y');
      expect(AxisDirection.NEGATIVE_Y).toBe('-y');
      expect(AxisDirection.POSITIVE_Z).toBe('+z');
      expect(AxisDirection.NEGATIVE_Z).toBe('-z');
    });

    it('should define correct GizmoErrorCode values', () => {
      expect(GizmoErrorCode.INITIALIZATION_FAILED).toBe('INITIALIZATION_FAILED');
      expect(GizmoErrorCode.CAMERA_NOT_SUPPORTED).toBe('CAMERA_NOT_SUPPORTED');
      expect(GizmoErrorCode.CANVAS_NOT_FOUND).toBe('CANVAS_NOT_FOUND');
      expect(GizmoErrorCode.ANIMATION_FAILED).toBe('ANIMATION_FAILED');
      expect(GizmoErrorCode.RENDER_FAILED).toBe('RENDER_FAILED');
      expect(GizmoErrorCode.INTERACTION_FAILED).toBe('INTERACTION_FAILED');
      expect(GizmoErrorCode.CONFIGURATION_INVALID).toBe('CONFIGURATION_INVALID');
    });
  });

  describe('Default Configuration', () => {
    it('should provide valid default gizmo configuration', () => {
      expect(DEFAULT_GIZMO_CONFIG).toBeDefined();
      expect(DEFAULT_GIZMO_CONFIG.size).toBe(90);
      expect(DEFAULT_GIZMO_CONFIG.padding).toBe(8);
      expect(DEFAULT_GIZMO_CONFIG.bubbleSizePrimary).toBe(8);
      expect(DEFAULT_GIZMO_CONFIG.bubbleSizeSecondary).toBe(6);
      expect(DEFAULT_GIZMO_CONFIG.showSecondary).toBe(true);
      expect(DEFAULT_GIZMO_CONFIG.lineWidth).toBe(2);
      expect(DEFAULT_GIZMO_CONFIG.sensitivity).toBe(1.0);
      expect(DEFAULT_GIZMO_CONFIG.enableInteraction).toBe(true);
    });

    it('should have correct color configuration', () => {
      const { colors } = DEFAULT_GIZMO_CONFIG;

      // X-axis colors (red)
      expect(colors.x).toEqual(['#f73c3c', '#942424']);

      // Y-axis colors (green)
      expect(colors.y).toEqual(['#6ccb26', '#417a17']);

      // Z-axis colors (blue)
      expect(colors.z).toEqual(['#178cf0', '#0e5490']);
    });

    it('should have correct font configuration', () => {
      const { font } = DEFAULT_GIZMO_CONFIG;

      expect(font.fontSize).toBe('11px');
      expect(font.fontFamily).toBe('arial');
      expect(font.fontWeight).toBe('bold');
      expect(font.fontColor).toBe('#151515');
      expect(font.fontYAdjust).toBe(0);
    });

    it('should have correct animation configuration', () => {
      const { animation } = DEFAULT_GIZMO_CONFIG;

      expect(animation.enableAnimations).toBe(true);
      expect(animation.animationDuration).toBe(500);
      expect(animation.easingFunction).toBe('quadratic');
      expect(animation.frameRate).toBe(60);
    });
  });

  describe('Branded Types', () => {
    it('should create branded GizmoId type', () => {
      const id = createGizmoId('test-gizmo-123');
      expect(typeof id).toBe('string');
      expect(id).toBe('test-gizmo-123');

      // Type assertion to verify branded type works
      const typedId: GizmoId = id;
      expect(typedId).toBe('test-gizmo-123');
    });

    it('should prevent mixing different ID types at compile time', () => {
      // This test verifies TypeScript compilation behavior
      const gizmoId = createGizmoId('gizmo-1');

      // This should work
      const validId: GizmoId = gizmoId;
      expect(validId).toBe('gizmo-1');

      // Regular string should not be assignable to GizmoId without factory
      // (This is enforced at compile time, not runtime)
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify supported camera types', () => {
      // Mock ArcRotateCamera-like object
      const mockArcRotateCamera = {
        getClassName: () => 'ArcRotateCamera',
      };

      expect(isSupportedCamera(mockArcRotateCamera)).toBe(true);
    });

    it('should reject unsupported camera types', () => {
      const mockFreeCamera = {
        getClassName: () => 'FreeCamera',
      };

      expect(isSupportedCamera(mockFreeCamera)).toBe(false);
    });

    it('should reject null and undefined cameras', () => {
      expect(isSupportedCamera(null)).toBe(false);
      expect(isSupportedCamera(undefined)).toBe(false);
    });

    it('should reject non-camera objects', () => {
      expect(isSupportedCamera({})).toBe(false);
      expect(isSupportedCamera('string')).toBe(false);
      expect(isSupportedCamera(123)).toBe(false);
    });
  });

  describe('Interface Validation', () => {
    it('should validate GizmoConfig interface structure', () => {
      const config: GizmoConfig = {
        size: 100,
        padding: 10,
        bubbleSizePrimary: 10,
        bubbleSizeSecondary: 8,
        showSecondary: true,
        lineWidth: 3,
        colors: {
          x: ['#ff0000', '#800000'],
          y: ['#00ff00', '#008000'],
          z: ['#0000ff', '#000080'],
        },
        font: {
          fontSize: '12px',
          fontFamily: 'helvetica',
          fontWeight: 'normal',
          fontColor: '#000000',
          fontYAdjust: 1,
        },
        animation: {
          enableAnimations: false,
          animationDuration: 300,
          easingFunction: 'linear',
          frameRate: 30,
        },
        sensitivity: 0.8,
        enableInteraction: false,
      };

      expect(config.size).toBe(100);
      expect(config.colors.x[0]).toBe('#ff0000');
      expect(config.font.fontSize).toBe('12px');
      expect(config.animation.enableAnimations).toBe(false);
    });

    it('should validate GizmoError interface structure', () => {
      const error: GizmoError = {
        code: GizmoErrorCode.INITIALIZATION_FAILED,
        message: 'Failed to initialize gizmo',
        timestamp: new Date(),
        details: { reason: 'Camera not found' },
        stack: 'Error stack trace',
      };

      expect(error.code).toBe(GizmoErrorCode.INITIALIZATION_FAILED);
      expect(error.message).toBe('Failed to initialize gizmo');
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.details?.reason).toBe('Camera not found');
    });

    it('should validate GizmoInteractionEvent interface structure', () => {
      const event: GizmoInteractionEvent = {
        axis: AxisDirection.POSITIVE_X,
        direction: new Vector3(1, 0, 0),
        timestamp: new Date(),
        mousePosition: new Vector3(100, 50, 0),
        cameraPosition: new Vector3(10, 10, 10),
      };

      expect(event.axis).toBe(AxisDirection.POSITIVE_X);
      expect(event.direction).toBeInstanceOf(Vector3);
      expect(event.direction.x).toBe(1);
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Immutability', () => {
    it('should enforce readonly properties in GizmoConfig', () => {
      const config = DEFAULT_GIZMO_CONFIG;

      // These should be readonly and cause TypeScript errors if uncommented:
      // config.size = 200; // Error: Cannot assign to 'size' because it is a read-only property
      // config.colors.x = ['#ffffff', '#000000']; // Error: readonly array

      // Verify the values are accessible
      expect(config.size).toBe(90);
      expect(config.colors.x[0]).toBe('#f73c3c');
    });

    it('should enforce readonly arrays in color configuration', () => {
      const colors = DEFAULT_GIZMO_CONFIG.colors;

      // These should cause TypeScript errors if uncommented:
      // colors.x[0] = '#ffffff'; // Error: readonly array
      // colors.x.push('#new-color'); // Error: readonly array

      // Verify arrays are accessible
      expect(colors.x.length).toBe(2);
      expect(colors.y.length).toBe(2);
      expect(colors.z.length).toBe(2);
    });
  });

  describe('Type Compatibility', () => {
    it('should work with Result<T,E> pattern', () => {
      // Mock successful result
      const successResult = {
        success: true as const,
        data: DEFAULT_GIZMO_CONFIG,
      };

      expect(successResult.success).toBe(true);
      if (successResult.success) {
        expect(successResult.data.size).toBe(90);
      }

      // Mock error result
      const errorResult = {
        success: false as const,
        error: {
          code: GizmoErrorCode.CONFIGURATION_INVALID,
          message: 'Invalid configuration',
          timestamp: new Date(),
        } as GizmoError,
      };

      expect(errorResult.success).toBe(false);
      if (!errorResult.success) {
        expect(errorResult.error.code).toBe(GizmoErrorCode.CONFIGURATION_INVALID);
      }
    });

    it('should support partial configuration updates', () => {
      const partialConfig: Partial<GizmoConfig> = {
        size: 120,
        colors: {
          x: ['#ff0000', '#cc0000'],
          y: ['#00ff00', '#00cc00'],
          z: ['#0000ff', '#0000cc'],
        },
      };

      expect(partialConfig.size).toBe(120);
      expect(partialConfig.colors?.x[0]).toBe('#ff0000');
      expect(partialConfig.padding).toBeUndefined(); // Not specified in partial
    });
  });
});
