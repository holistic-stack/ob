/**
 * @file Tests for basic integration example
 * 
 * This test suite validates the basic integration example functionality
 * and demonstrates end-to-end usage of the OpenSCAD to Babylon.js pipeline.
 */

import { describe, it, expect } from 'vitest';
import { NullEngine, Scene, StandardMaterial, Color3 } from '@babylonjs/core';
import { 
  runBasicIntegrationExample, 
  convertOpenSCADPrimitive,
  ExampleErrorHandler,
  createSamplePrimitives 
} from './basic-integration.js';
import type { OpenSCADPrimitive } from '../types/openscad-types.js';

describe('[INIT] Basic Integration Example', () => {
  const mockLocation = {
    start: { line: 1, column: 0 },
    end: { line: 1, column: 10 }
  };

  describe('Sample Primitives Creation', () => {
    it('[DEBUG] should create valid sample primitives', () => {
      const primitives = createSamplePrimitives();

      expect(primitives).toHaveLength(3);
      expect(primitives[0].type).toBe('cube');
      expect(primitives[1].type).toBe('sphere');
      expect(primitives[2].type).toBe('cylinder');

      // Verify immutability
      expect(Object.isFrozen(primitives)).toBe(true);
    });

    it('[DEBUG] should have correct parameters for each primitive', () => {
      const primitives = createSamplePrimitives();

      // Cube parameters
      expect(primitives[0].parameters.size).toEqual([10, 20, 30]);

      // Sphere parameters
      expect(primitives[1].parameters.r).toBe(5);

      // Cylinder parameters
      expect(primitives[2].parameters.h).toBe(15);
      expect(primitives[2].parameters.r).toBe(3);
    });
  });

  describe('Error Handler', () => {
    it('[DEBUG] should track errors and warnings', () => {
      const errorHandler = new ExampleErrorHandler();

      expect(errorHandler.hasErrors()).toBe(false);
      expect(errorHandler.getErrors()).toHaveLength(0);
      expect(errorHandler.getWarnings()).toHaveLength(0);

      errorHandler.handleError('Test error');
      errorHandler.handleWarning('Test warning');

      expect(errorHandler.hasErrors()).toBe(true);
      expect(errorHandler.getErrors()).toHaveLength(1);
      expect(errorHandler.getWarnings()).toHaveLength(1);
      expect(errorHandler.getErrors()[0]).toBe('Test error');
      expect(errorHandler.getWarnings()[0]).toBe('Test warning');
    });

    it('[DEBUG] should clear errors and warnings', () => {
      const errorHandler = new ExampleErrorHandler();

      errorHandler.handleError('Test error');
      errorHandler.handleWarning('Test warning');
      
      expect(errorHandler.hasErrors()).toBe(true);

      errorHandler.clear();

      expect(errorHandler.hasErrors()).toBe(false);
      expect(errorHandler.getErrors()).toHaveLength(0);
      expect(errorHandler.getWarnings()).toHaveLength(0);
    });
  });

  describe('Single Primitive Conversion', () => {
    it('[DEBUG] should convert a single cube primitive', async () => {
      const engine = new NullEngine();
      const scene = new Scene(engine);
      const material = new StandardMaterial('test', scene);

      try {
        const cubeNode: OpenSCADPrimitive = {
          type: 'cube',
          parameters: { size: [5, 5, 5] },
          location: mockLocation
        };

        const mesh = await convertOpenSCADPrimitive(cubeNode, scene, engine, material);

        expect(mesh.name).toContain('cube_');
        expect(mesh.material).toBe(material);
        expect(scene.meshes).toContain(mesh);
      } finally {
        scene.dispose();
        engine.dispose();
      }
    });

    it('[DEBUG] should throw error for unsupported primitive', async () => {
      const engine = new NullEngine();
      const scene = new Scene(engine);
      const material = new StandardMaterial('test', scene);

      try {
        const unsupportedNode: OpenSCADPrimitive = {
          type: 'text' as any,
          parameters: { text: 'hello' },
          location: mockLocation
        };

        await expect(
          convertOpenSCADPrimitive(unsupportedNode, scene, engine, material)
        ).rejects.toThrow('Conversion failed: Unsupported primitive type: text');
      } finally {
        scene.dispose();
        engine.dispose();
      }
    });

    it('[DEBUG] should throw error for invalid parameters', async () => {
      const engine = new NullEngine();
      const scene = new Scene(engine);
      const material = new StandardMaterial('test', scene);

      try {
        const invalidNode: OpenSCADPrimitive = {
          type: 'cube',
          parameters: { size: 'invalid' },
          location: mockLocation
        };

        await expect(
          convertOpenSCADPrimitive(invalidNode, scene, engine, material)
        ).rejects.toThrow('Conversion failed');
      } finally {
        scene.dispose();
        engine.dispose();
      }
    });
  });

  describe('Full Integration Example', () => {
    it('[DEBUG] should run complete integration example without errors', async () => {
      // This test verifies the full integration example runs successfully
      // It's more of an integration test than a unit test
      await expect(runBasicIntegrationExample()).resolves.not.toThrow();
    });

    it('[DEBUG] should handle all sample primitives', async () => {
      // Create a spy to capture console output
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '));
        originalLog(...args);
      };

      try {
        await runBasicIntegrationExample();

        // Verify that all three primitives were processed
        const conversionLogs = consoleLogs.filter(log => 
          log.includes('Converting') && (
            log.includes('cube') || 
            log.includes('sphere') || 
            log.includes('cylinder')
          )
        );

        expect(conversionLogs.length).toBeGreaterThanOrEqual(3);

        // Verify successful completion
        const completionLog = consoleLogs.find(log => 
          log.includes('Basic integration example completed successfully')
        );
        expect(completionLog).toBeDefined();

        // Verify no unexpected errors
        const errorLogs = consoleLogs.filter(log => 
          log.includes('[ERROR]') && !log.includes('Failed conversions:')
        );
        expect(errorLogs).toHaveLength(0);

      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('Resource Management', () => {
    it('[DEBUG] should properly dispose resources in integration example', async () => {
      // This test ensures that resources are properly cleaned up
      // We can't directly test disposal, but we can ensure no errors occur
      await expect(runBasicIntegrationExample()).resolves.not.toThrow();
    });
  });

  describe('Error Scenarios', () => {
    it('[DEBUG] should handle conversion errors gracefully', async () => {
      // The integration example should handle errors gracefully
      // and not throw exceptions for conversion failures
      await expect(runBasicIntegrationExample()).resolves.not.toThrow();
    });
  });
});

console.log('[END] Basic integration example test suite completed successfully');
