/**
 * @file Manifold AST Converter Tests (Moved to Conversion Layer)
 * 
 * Tests for the ManifoldASTConverter that has been moved from 3d-renderer
 * to ast-to-csg-converter to achieve proper architectural separation.
 * 
 * Uses real OpenSCAD parser instances (no mocks) as per project guidelines.
 */

import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type { OpenscadParser } from '../../../openscad-parser/openscad-parser';
import type { ASTNode } from '../../../openscad-parser/ast/ast-types';
import { MaterialIDManager } from '../../../3d-renderer/services/manifold-material-manager/manifold-material-manager';
import { ManifoldASTConverter } from './manifold-ast-converter';

describe('ManifoldASTConverter (Conversion Layer)', () => {
  let parser: OpenscadParser;
  let materialManager: MaterialIDManager;
  let converter: ManifoldASTConverter;

  beforeEach(async () => {
    // Create real parser instance (no mocks)
    parser = await createTestParser();
    
    // Create material manager
    materialManager = new MaterialIDManager();
    await materialManager.initialize();
    
    // Create converter
    converter = new ManifoldASTConverter(materialManager);
    await converter.initialize();
  });

  afterEach(() => {
    // Clean up resources
    converter.dispose();
    materialManager.dispose();
    parser.dispose();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const newMaterialManager = new MaterialIDManager();
      await newMaterialManager.initialize();
      
      const newConverter = new ManifoldASTConverter(newMaterialManager);
      const result = await newConverter.initialize();
      
      expect(result.success).toBe(true);
      
      newConverter.dispose();
      newMaterialManager.dispose();
    });

    it('should handle multiple initialization calls', async () => {
      const result1 = await converter.initialize();
      const result2 = await converter.initialize();
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe('Primitive Conversion', () => {
    it('should convert cube AST node to BufferGeometry', async () => {
      const code = 'cube(10);';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      expect(ast.length).toBe(1);

      const result = await converter.convertNode(ast[0]);
      
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.geometry).toBeDefined();
      expect(result.data.vertexCount).toBeGreaterThan(0);
      expect(result.data.triangleCount).toBeGreaterThan(0);
      expect(result.data.operationTime).toBeGreaterThanOrEqual(0);
    });

    it('should convert sphere AST node to BufferGeometry', async () => {
      const code = 'sphere(5);';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      const result = await converter.convertNode(ast[0]);
      
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.geometry).toBeDefined();
      expect(result.data.vertexCount).toBeGreaterThan(0);
    });

    it('should convert cylinder AST node to BufferGeometry', async () => {
      const code = 'cylinder(h=10, r=5);';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      const result = await converter.convertNode(ast[0]);
      
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.geometry).toBeDefined();
      expect(result.data.vertexCount).toBeGreaterThan(0);
    });
  });

  describe('Transformation Operations', () => {
    it('should convert translate operation', async () => {
      const code = 'translate([5, 0, 0]) cube(10);';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      const result = await converter.convertNode(ast[0]);
      
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.geometry).toBeDefined();
    });

    it('should convert rotate operation', async () => {
      const code = 'rotate([0, 0, 45]) cube(10);';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      const result = await converter.convertNode(ast[0]);
      
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.geometry).toBeDefined();
    });

    it('should convert scale operation', async () => {
      const code = 'scale([2, 1, 1]) cube(10);';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      const result = await converter.convertNode(ast[0]);
      
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.geometry).toBeDefined();
    });
  });

  describe('CSG Operations', () => {
    it('should convert union operation', async () => {
      const code = 'union() { cube(10); sphere(5); }';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      const result = await converter.convertNode(ast[0]);
      
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.geometry).toBeDefined();
    });

    it('should convert difference operation', async () => {
      const code = 'difference() { cube(10); sphere(5); }';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      const result = await converter.convertNode(ast[0]);
      
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.geometry).toBeDefined();
    });

    it('should convert intersection operation', async () => {
      const code = 'intersection() { cube(10); sphere(8); }';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      const result = await converter.convertNode(ast[0]);
      
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.geometry).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported node types', async () => {
      const invalidNode = { type: 'unsupported', children: [] } as unknown as ASTNode;
      
      const result = await converter.convertNode(invalidNode);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unsupported AST node type');
      }
    });

    it('should fail gracefully when not initialized', async () => {
      const uninitializedConverter = new ManifoldASTConverter(materialManager);
      
      const code = 'cube(10);';
      const parseResult = parser.parseASTWithResult(code);
      expect(parseResult.success).toBe(true);
      
      if (!parseResult.success) return;
      
      const result = await uninitializedConverter.convertNode(parseResult.data[0]);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not initialized');
      }
    });

    it('should handle invalid CSG operations', async () => {
      // Test difference with only one child (should fail)
      const code = 'difference() { cube(10); }';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      const result = await converter.convertNode(ast[0]);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('requires at least 2 children');
      }
    });
  });

  describe('Conversion Options', () => {
    it('should respect optimization options', async () => {
      const code = 'cube(10);';
      const parseResult = parser.parseASTWithResult(code);
      
      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const options = {
        preserveMaterials: true,
        optimizeResult: false,
        timeout: 5000,
      };

      const result = await converter.convertNode(parseResult.data[0], options);
      
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.geometry).toBeDefined();
    });
  });

  describe('Resource Management', () => {
    it('should dispose resources properly', () => {
      expect(() => converter.dispose()).not.toThrow();
    });

    it('should handle disposal of uninitialized converter', () => {
      const newConverter = new ManifoldASTConverter(materialManager);
      expect(() => newConverter.dispose()).not.toThrow();
    });
  });
});
