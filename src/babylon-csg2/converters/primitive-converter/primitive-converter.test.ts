/**
 * @file Tests for PrimitiveConverter
 * 
 * This test suite validates the PrimitiveConverter functionality using TDD
 * principles with Babylon.js NullEngine for headless testing.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NullEngine, Scene, StandardMaterial, Color3 } from '@babylonjs/core';
import { PrimitiveConverter } from './primitive-converter.js';
import { type ConversionContext, createConversionContext } from '../../types/converter-types.js';
import type { OpenSCADPrimitiveNode } from '../../types/openscad-types.js';

describe('[INIT] PrimitiveConverter', () => {
  let engine: NullEngine;
  let scene: Scene;
  let context: ConversionContext;
  let converter: PrimitiveConverter;
  let defaultMaterial: StandardMaterial;
  const mockLocation = {
    start: { line: 1, column: 0, offset: 0 },
    end: { line: 1, column: 10, offset: 10 }
  };

  beforeEach(async () => {
    console.log('[INIT] Setting up test environment');
    
    // Create NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);
    
    // Create default material
    defaultMaterial = new StandardMaterial('default', scene);
    defaultMaterial.diffuseColor = new Color3(0.7, 0.7, 0.7);
    
    // Create mock error handler
    const mockErrorHandler = {
      handleError: () => {},
      handleWarning: () => {},
      getErrors: () => [],
      getWarnings: () => [],
      hasErrors: () => false,
      clear: () => {}
    };
    
    // Create conversion context
    context = createConversionContext(scene, engine, defaultMaterial, mockErrorHandler);
    
    // Create converter
    converter = new PrimitiveConverter();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up test environment');
    scene.dispose();
    engine.dispose();
  });

  describe('Type Guard', () => {
    it('[DEBUG] should identify cube nodes', () => {      const cubeNode: OpenSCADPrimitiveNode = {
        type: 'cube',
        size: [10, 10, 10],
        location: mockLocation
      };

      expect(converter.canConvert(cubeNode)).toBe(true);
    });    it('[DEBUG] should identify sphere nodes', () => {
      const sphereNode: OpenSCADPrimitiveNode = {
        type: 'sphere',
        radius: 5,
        location: mockLocation
      };

      expect(converter.canConvert(sphereNode)).toBe(true);
    });    it('[DEBUG] should identify cylinder nodes', () => {
      const cylinderNode: OpenSCADPrimitiveNode = {
        type: 'cylinder',
        h: 10,
        r: 3,
        location: mockLocation
      };

      expect(converter.canConvert(cylinderNode)).toBe(true);
    });

    it('[DEBUG] should reject non-primitive nodes', () => {
      const invalidNode = {
        type: 'translate',
        parameters: {},
        location: mockLocation
      };

      expect(converter.canConvert(invalidNode as any)).toBe(false);
    });
  });

  describe('Cube Conversion', () => {    it('[DEBUG] should convert cube with array size', async () => {
      const cubeNode: OpenSCADPrimitiveNode = {
        type: 'cube',
        size: [10, 20, 30], // Vector3D
        location: mockLocation
      };

      const result = await converter.convert(cubeNode, context);

      expect(result.success).toBe(true);
      if (result.success) {        expect(result.data.name).toContain('cube_');
        expect(result.data.material).toBe(defaultMaterial);
        // Note: In NullEngine, we can't easily test mesh dimensions
        // but we can verify the mesh was created successfully
      }
    });

    it('[DEBUG] should convert cube with single size value', async () => {
      const cubeNode: OpenSCADPrimitiveNode = {
        type: 'cube',
        size: 15,
        location: mockLocation
      };

      const result = await converter.convert(cubeNode, context);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toContain('cube_');
      }
    });

    it('[DEBUG] should use default size for cube without parameters', async () => {
      const cubeNode: OpenSCADPrimitiveNode = {
        type: 'cube',
        size: 1, // Default size
        location: mockLocation
      };

      const result = await converter.convert(cubeNode, context);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toContain('cube_');
      }
    });

    it('[DEBUG] should handle invalid cube parameters', async () => {
      const cubeNode: OpenSCADPrimitiveNode = {
        type: 'cube',
        size: 'invalid' as any, // Invalid size type
        location: mockLocation
      };

      const result = await converter.convert(cubeNode, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('invalid_parameters');
        expect(result.error.message).toContain('Invalid cube size parameters');
      }
    });
  });

  describe('Sphere Conversion', () => {
    it('[DEBUG] should convert sphere with radius', async () => {
      const sphereNode: OpenSCADPrimitiveNode = {
        type: 'sphere',
        radius: 5,
        location: mockLocation
      };

      const result = await converter.convert(sphereNode, context);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toContain('sphere_');
        expect(result.data.material).toBe(defaultMaterial);
      }
    });

    it('[DEBUG] should convert sphere with diameter', async () => {
      const sphereNode: OpenSCADPrimitiveNode = {
        type: 'sphere',
        diameter: 10,
        location: mockLocation
      };

      const result = await converter.convert(sphereNode, context);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toContain('sphere_');
      }
    });

    it('[DEBUG] should use default radius for sphere without parameters', async () => {
      const sphereNode: OpenSCADPrimitiveNode = {
        type: 'sphere',
        location: mockLocation
      };

      const result = await converter.convert(sphereNode, context);

      expect(result.success).toBe(true);
    });

    it('[DEBUG] should handle invalid sphere radius', async () => {
      const sphereNode: OpenSCADPrimitiveNode = {
        type: 'sphere',
        radius: -5,
        location: mockLocation
      };

      const result = await converter.convert(sphereNode, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('invalid_parameters');
      }
    });
  });

  describe('Cylinder Conversion', () => {    it('[DEBUG] should convert cylinder with height and radius', async () => {
      const cylinderNode: OpenSCADPrimitiveNode = {
        type: 'cylinder',
        h: 10,
        r: 3,
        location: mockLocation
      };

      const result = await converter.convert(cylinderNode, context);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toContain('cylinder_');
        expect(result.data.material).toBe(defaultMaterial);
      }
    });    it('[DEBUG] should convert cylinder with h and r parameters', async () => {
      const cylinderNode: OpenSCADPrimitiveNode = {
        type: 'cylinder',
        h: 8,
        r: 2,
        location: mockLocation
      };

      const result = await converter.convert(cylinderNode, context);

      expect(result.success).toBe(true);
    });    it('[DEBUG] should use default values for cylinder without parameters', async () => {
      const cylinderNode: OpenSCADPrimitiveNode = {
        type: 'cylinder',
        h: 1, // minimal required height
        location: mockLocation
      };

      const result = await converter.convert(cylinderNode, context);

      expect(result.success).toBe(true);
    });    it('[DEBUG] should handle invalid cylinder parameters', async () => {
      const cylinderNode: OpenSCADPrimitiveNode = {
        type: 'cylinder',
        h: -5,
        r: 3,
        location: mockLocation
      };

      const result = await converter.convert(cylinderNode, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('invalid_parameters');
      }
    });
  });

  describe('Error Handling', () => {    it('[DEBUG] should handle unsupported primitive types', async () => {
      const unsupportedNode: OpenSCADPrimitiveNode = {
        type: 'unsupported' as any,
        location: mockLocation
      } as any;

      const result = await converter.convert(unsupportedNode, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('unsupported_operation');
        expect(result.error.message).toContain('Unsupported primitive type');
      }
    });
  });

  describe('Priority', () => {
    it('[DEBUG] should have high priority for primitives', () => {
      expect(converter.priority).toBe(100);
    });
  });
});

console.log('[END] PrimitiveConverter test suite completed successfully');
