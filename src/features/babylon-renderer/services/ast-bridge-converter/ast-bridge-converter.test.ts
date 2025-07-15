/**
 * @file AST Bridge Converter Tests
 *
 * Tests for the AST Bridge Converter service following TDD principles.
 * Uses real OpenSCAD parser instances and BabylonJS NullEngine (no mocks).
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type { OpenscadParser } from '../../../openscad-parser/openscad-parser';
import { ASTBridgeConverter, DEFAULT_BRIDGE_CONFIG } from './ast-bridge-converter';

describe('ASTBridgeConverter', () => {
  let bridgeConverter: ASTBridgeConverter;
  let parser: OpenscadParser;
  let engine: NullEngine;
  let scene: Scene;

  beforeEach(async () => {
    // Create real OpenSCAD parser instance (no mocks)
    parser = await createTestParser();

    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);

    // Create bridge converter instance
    bridgeConverter = new ASTBridgeConverter();
  });

  afterEach(() => {
    // Clean up resources
    bridgeConverter.dispose();
    scene.dispose();
    engine.dispose();
    parser.dispose();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(bridgeConverter).toBeDefined();

      const stats = bridgeConverter.getStats();
      expect(stats.isInitialized).toBe(false);
      expect(stats.hasScene).toBe(false);
      expect(stats.config).toEqual(DEFAULT_BRIDGE_CONFIG);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        ...DEFAULT_BRIDGE_CONFIG,
        optimizeConversion: false,
        timeout: 10000,
      };

      const customConverter = new ASTBridgeConverter(customConfig);
      const stats = customConverter.getStats();

      expect(stats.config).toEqual(customConfig);
      customConverter.dispose();
    });

    it('should initialize successfully with valid scene', async () => {
      const result = await bridgeConverter.initialize(scene);

      expect(result.success).toBe(true);

      const stats = bridgeConverter.getStats();
      expect(stats.isInitialized).toBe(true);
      expect(stats.hasScene).toBe(true);
    });

    it('should fail to initialize with null scene', async () => {
      const result = await bridgeConverter.initialize(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_SCENE');
      }
    });
  });

  describe('AST Conversion', () => {
    beforeEach(async () => {
      // Initialize bridge converter for conversion tests
      await bridgeConverter.initialize(scene);
    });

    it('should convert simple cube OpenSCAD AST to BabylonJS AST', async () => {
      const openscadCode = 'cube([2, 3, 4]);';

      // Parse OpenSCAD code to AST
      const ast = parser.parseAST(openscadCode);
      expect(ast).toBeDefined();
      expect(Array.isArray(ast)).toBe(true);
      expect(ast.length).toBeGreaterThan(0);

      // Convert to BabylonJS AST
      const conversionResult = await bridgeConverter.convertAST(ast);

      expect(conversionResult.success).toBe(true);
      if (conversionResult.success) {
        expect(conversionResult.data).toBeDefined();
        expect(Array.isArray(conversionResult.data)).toBe(true);
        expect(conversionResult.data.length).toBe(ast.length);

        // Verify the converted node
        const babylonNode = conversionResult.data[0];
        expect(babylonNode).toBeDefined();
        if (babylonNode) {
          expect(babylonNode.name).toContain('cube');
          expect(babylonNode.originalOpenscadNode).toBeDefined();
        }
      }
    });

    it('should convert sphere OpenSCAD AST to BabylonJS AST', async () => {
      const openscadCode = 'sphere(r=5);';

      // Parse OpenSCAD code to AST
      const ast = parser.parseAST(openscadCode);
      expect(ast).toBeDefined();
      expect(ast.length).toBeGreaterThan(0);

      // Convert to BabylonJS AST
      const conversionResult = await bridgeConverter.convertAST(ast);

      expect(conversionResult.success).toBe(true);
      if (conversionResult.success) {
        expect(conversionResult.data).toBeDefined();
        expect(conversionResult.data.length).toBe(ast.length);

        // Verify the converted node
        const babylonNode = conversionResult.data[0];
        expect(babylonNode).toBeDefined();
        if (babylonNode) {
          expect(babylonNode.name).toContain('sphere');
        }
      }
    });

    it('should convert multiple OpenSCAD nodes to BabylonJS AST', async () => {
      const openscadCode = `
        cube([1, 1, 1]);
        sphere(r=2);
        cylinder(h=3, r=1);
      `;

      // Parse OpenSCAD code to AST
      const ast = parser.parseAST(openscadCode);
      expect(ast).toBeDefined();
      expect(ast.length).toBeGreaterThan(2); // Should have multiple nodes

      // Convert to BabylonJS AST
      const conversionResult = await bridgeConverter.convertAST(ast);

      expect(conversionResult.success).toBe(true);
      if (conversionResult.success) {
        expect(conversionResult.data).toBeDefined();
        expect(conversionResult.data.length).toBe(ast.length);

        // Verify all nodes were converted
        for (let i = 0; i < conversionResult.data.length; i++) {
          const babylonNode = conversionResult.data[i];
          expect(babylonNode).toBeDefined();
          if (babylonNode) {
            expect(babylonNode.originalOpenscadNode).toBeDefined();
          }
        }
      }
    });

    it('should fail conversion when not initialized', async () => {
      const uninitializedConverter = new ASTBridgeConverter();
      const openscadCode = 'cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);

      const conversionResult = await uninitializedConverter.convertAST(ast);

      expect(conversionResult.success).toBe(false);
      if (!conversionResult.success) {
        expect(conversionResult.error.code).toBe('NOT_INITIALIZED');
      }

      uninitializedConverter.dispose();
    });

    it('should handle empty AST array', async () => {
      const conversionResult = await bridgeConverter.convertAST([]);

      expect(conversionResult.success).toBe(true);
      if (conversionResult.success) {
        expect(conversionResult.data).toBeDefined();
        expect(conversionResult.data.length).toBe(0);
      }
    });
  });

  describe('Caching and Optimization', () => {
    beforeEach(async () => {
      await bridgeConverter.initialize(scene);
    });

    it('should cache conversion results when optimization is enabled', async () => {
      const openscadCode = 'cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);

      // First conversion
      const result1 = await bridgeConverter.convertAST(ast);
      expect(result1.success).toBe(true);

      const statsBefore = bridgeConverter.getStats();
      expect(statsBefore.cacheSize).toBeGreaterThan(0);

      // Second conversion should use cache
      const result2 = await bridgeConverter.convertAST(ast);
      expect(result2.success).toBe(true);

      const statsAfter = bridgeConverter.getStats();
      expect(statsAfter.cacheSize).toBe(statsBefore.cacheSize);
    });

    it('should clear cache when requested', async () => {
      const openscadCode = 'cube([1, 1, 1]);';
      const ast = parser.parseAST(openscadCode);

      // Convert to populate cache
      await bridgeConverter.convertAST(ast);

      const statsBefore = bridgeConverter.getStats();
      expect(statsBefore.cacheSize).toBeGreaterThan(0);

      // Clear cache
      bridgeConverter.clearCache();

      const statsAfter = bridgeConverter.getStats();
      expect(statsAfter.cacheSize).toBe(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await bridgeConverter.initialize(scene);
    });

    it('should handle malformed AST nodes gracefully', async () => {
      const malformedAST = [{ type: 'unknown_type', invalidProperty: true } as any];

      const conversionResult = await bridgeConverter.convertAST(malformedAST);

      // Should still attempt conversion but may fail gracefully
      // The exact behavior depends on implementation details
      expect(conversionResult).toBeDefined();
      expect(typeof conversionResult.success).toBe('boolean');
    });
  });

  describe('Resource Management', () => {
    it('should dispose resources properly', async () => {
      await bridgeConverter.initialize(scene);

      const statsBefore = bridgeConverter.getStats();
      expect(statsBefore.isInitialized).toBe(true);

      bridgeConverter.dispose();

      const statsAfter = bridgeConverter.getStats();
      expect(statsAfter.isInitialized).toBe(false);
      expect(statsAfter.cacheSize).toBe(0);
      expect(statsAfter.hasScene).toBe(false);
    });
  });
});
