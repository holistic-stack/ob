/**
 * @file AST to Mesh Converter Tests
 * 
 * Tests for the AST to mesh conversion service following TDD principles.
 * Uses real OpenSCAD parser instances (no mocks) as per project guidelines.
 */

import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { createInitializedTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type { OpenscadParser } from '../../../openscad-parser/openscad-parser';
import type { ASTNode } from '../../../openscad-parser/ast/ast-types';
import { ASTToMeshConversionService } from './ast-to-mesh-converter';
import type { ConversionOptions } from '../../types/conversion.types';

describe('ASTToMeshConversionService', () => {
  let parser: OpenscadParser;
  let converter: ASTToMeshConversionService;

  beforeEach(async () => {
    // Create real parser instance (no mocks) - fully initialized
    parser = await createInitializedTestParser();

    // Create conversion service
    converter = new ASTToMeshConversionService();
    await converter.initialize();
  });

  afterEach(() => {
    // Clean up resources
    converter.dispose();
    parser.dispose();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const newConverter = new ASTToMeshConversionService();
      const result = await newConverter.initialize();
      
      expect(result.success).toBe(true);
      
      newConverter.dispose();
    });

    it('should handle multiple initialization calls', async () => {
      const result1 = await converter.initialize();
      const result2 = await converter.initialize();
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe('Single Node Conversion', () => {
    it('should convert cube AST node to generic mesh', async () => {
      const code = 'cube(10);';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      expect(ast.length).toBe(1);

      const result = await converter.convertSingle(ast[0]);
      
      expect(result.success).toBe(true);
      if (!result.success) return;

      const mesh = result.data;
      expect(mesh.id).toBeDefined();
      expect(mesh.geometry).toBeDefined();
      expect(mesh.material).toBeDefined();
      expect(mesh.transform).toBeDefined();
      expect(mesh.metadata).toBeDefined();
      
      // Verify metadata
      expect(mesh.metadata.meshId).toBeDefined();
      expect(mesh.metadata.vertexCount).toBeGreaterThan(0);
      expect(mesh.metadata.triangleCount).toBeGreaterThan(0);
    });

    it('should convert sphere AST node to generic mesh', async () => {
      const code = 'sphere(5);';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      const result = await converter.convertSingle(ast[0]);
      
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.metadata.vertexCount).toBeGreaterThan(0);
    });

    it('should handle conversion errors gracefully', async () => {
      const invalidNode = { type: 'invalid', location: null } as unknown as ASTNode;
      
      const result = await converter.convertSingle(invalidNode);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Multiple Node Conversion', () => {
    it('should convert multiple AST nodes to generic meshes', async () => {
      const code = 'cube(10); sphere(5);';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      const result = await converter.convert(ast);
      
      expect(result.success).toBe(true);
      if (!result.success) return;

      const conversionResult = result.data;
      expect(conversionResult.meshes).toHaveLength(2);
      expect(conversionResult.totalVertices).toBeGreaterThan(0);
      expect(conversionResult.totalTriangles).toBeGreaterThan(0);
      expect(conversionResult.operationTime).toBeGreaterThan(0);
      expect(conversionResult.errors).toHaveLength(0);
    });

    it('should handle CSG operations', async () => {
      const code = 'difference() { cube(10); sphere(5); }';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      const result = await converter.convert(ast);
      
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.meshes.length).toBeGreaterThan(0);
    });

    it('should collect errors for failed conversions', async () => {
      const validNode = { type: 'cube', size: 10, location: null } as unknown as ASTNode;
      const invalidNode = { type: 'invalid', location: null } as unknown as ASTNode;
      
      const result = await converter.convert([validNode, invalidNode]);
      
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.meshes.length).toBe(1); // Only valid node converted
      expect(result.data.errors.length).toBe(1); // One error for invalid node
    });
  });

  describe('Conversion Options', () => {
    it('should respect optimization options', async () => {
      const code = 'cube(10);';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const options: ConversionOptions = {
        optimizeResult: true,
        preserveMaterials: false,
      };

      const result = await converter.convertSingle(parseResult.data[0], options);
      
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.metadata.isOptimized).toBe(true);
    });

    it('should handle caching when enabled', async () => {
      const code = 'cube(10);';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const options: ConversionOptions = { enableCaching: true };
      
      // First conversion
      const result1 = await converter.convertSingle(parseResult.data[0], options);
      expect(result1.success).toBe(true);
      
      // Second conversion (should use cache)
      const result2 = await converter.convertSingle(parseResult.data[0], options);
      expect(result2.success).toBe(true);
      
      // Results should be equivalent
      if (result1.success && result2.success) {
        expect(result1.data.id).toBe(result2.data.id);
      }
    });
  });

  describe('Resource Management', () => {
    it('should dispose resources properly', () => {
      expect(() => converter.dispose()).not.toThrow();
    });

    it('should handle disposal of uninitialized converter', () => {
      const newConverter = new ASTToMeshConversionService();
      expect(() => newConverter.dispose()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should fail gracefully when not initialized', async () => {
      const uninitializedConverter = new ASTToMeshConversionService();
      
      const result = await uninitializedConverter.convert([]);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not initialized');
      }
    });

    it('should handle empty AST arrays', async () => {
      const result = await converter.convert([]);
      
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.meshes).toHaveLength(0);
      expect(result.data.errors).toHaveLength(0);
    });
  });
});
