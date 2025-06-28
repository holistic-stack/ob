/**
 * AST Restructuring Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type {
  ASTNode,
  UnionNode,
  TranslateNode,
  CubeNode,
  SphereNode
} from '@holistic-stack/openscad-parser';
import { restructureAST, createASTRestructuringService } from './ast-restructuring-service';

describe('[INIT][ASTRestructuringService] AST Restructuring Service', () => {
  beforeEach(() => {
    console.log('[INIT][ASTRestructuringServiceTest] Setting up test environment');
  });

  afterEach(() => {
    console.log('[END][ASTRestructuringServiceTest] Cleaning up test environment');
  });

  describe('restructureAST', () => {
    it('should handle empty AST', () => {
      console.log('[DEBUG][ASTRestructuringServiceTest] Testing empty AST');
      
      const result = restructureAST([]);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
        console.log('[DEBUG][ASTRestructuringServiceTest] Empty AST handled correctly');
      }
    });

    it('should handle single node AST', () => {
      console.log('[DEBUG][ASTRestructuringServiceTest] Testing single node AST');
      
      const cubeNode: CubeNode = {
        type: 'cube',
        size: [10, 10, 10],
        center: false,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 15, offset: 14 }
        }
      };

      const result = restructureAST([cubeNode]);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([cubeNode]);
        console.log('[DEBUG][ASTRestructuringServiceTest] Single node AST handled correctly');
      }
    });

    it('should restructure flat AST with union and primitives', () => {
      console.log('[DEBUG][ASTRestructuringServiceTest] Testing union restructuring');
      
      // Simulate flat AST structure from parser
      const unionNode: UnionNode = {
        type: 'union',
        children: [], // Empty children as from parser
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 4, column: 1, offset: 50 }
        }
      };

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [15, 15, 15],
        center: true,
        location: {
          start: { line: 2, column: 5, offset: 15 },
          end: { line: 2, column: 25, offset: 35 }
        }
      };

      const sphereNode: SphereNode = {
        type: 'sphere',
        radius: 10,
        location: {
          start: { line: 3, column: 5, offset: 40 },
          end: { line: 3, column: 15, offset: 50 }
        }
      };

      const flatAST: ASTNode[] = [unionNode, cubeNode, sphereNode];

      const result = restructureAST(flatAST);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const restructuredAST = result.data;
        
        // Should have only one top-level node (the union)
        expect(restructuredAST).toHaveLength(1);
        
        const restructuredUnion = restructuredAST[0] as UnionNode;
        expect(restructuredUnion.type).toBe('union');
        expect(restructuredUnion.children).toHaveLength(2);
        
        // Check that children are properly assigned
        const childTypes = restructuredUnion.children.map(child => child.type);
        expect(childTypes).toContain('cube');
        expect(childTypes).toContain('sphere');
        
        console.log('[DEBUG][ASTRestructuringServiceTest] Union restructuring successful');
      }
    });

    it('should restructure nested transform with CSG operation', () => {
      console.log('[DEBUG][ASTRestructuringServiceTest] Testing nested transform restructuring');
      
      // Simulate translate(union(cube, sphere)) structure
      const translateNode: TranslateNode = {
        type: 'translate',
        v: [-24, 0, 0],
        children: [], // Will be populated by restructuring
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 6, column: 1, offset: 100 }
        }
      };

      const unionNode: UnionNode = {
        type: 'union',
        children: [], // Empty children as from parser
        location: {
          start: { line: 2, column: 5, offset: 20 },
          end: { line: 5, column: 5, offset: 80 }
        }
      };

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [15, 15, 15],
        center: true,
        location: {
          start: { line: 3, column: 9, offset: 35 },
          end: { line: 3, column: 29, offset: 55 }
        }
      };

      const sphereNode: SphereNode = {
        type: 'sphere',
        radius: 10,
        location: {
          start: { line: 4, column: 9, offset: 65 },
          end: { line: 4, column: 19, offset: 75 }
        }
      };

      const flatAST: ASTNode[] = [translateNode, unionNode, cubeNode, sphereNode];

      const result = restructureAST(flatAST);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const restructuredAST = result.data;
        
        // Should have only one top-level node (the translate)
        expect(restructuredAST).toHaveLength(1);
        
        const restructuredTranslate = restructuredAST[0] as TranslateNode;
        expect(restructuredTranslate.type).toBe('translate');
        expect(restructuredTranslate.children).toHaveLength(1);
        
        // Check that the union is a child of translate
        const unionChild = restructuredTranslate.children[0] as UnionNode;
        expect(unionChild.type).toBe('union');
        expect(unionChild.children).toHaveLength(2);
        
        // Check that primitives are children of union
        const primitiveTypes = unionChild.children.map(child => child.type);
        expect(primitiveTypes).toContain('cube');
        expect(primitiveTypes).toContain('sphere');
        
        console.log('[DEBUG][ASTRestructuringServiceTest] Nested transform restructuring successful');
      }
    });

    it('should handle nodes without source locations gracefully', () => {
      console.log('[DEBUG][ASTRestructuringServiceTest] Testing nodes without source locations');
      
      const unionNode: UnionNode = {
        type: 'union',
        children: []
        // No location property
      };

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [10, 10, 10],
        center: false
        // No location property
      };

      const flatAST: ASTNode[] = [unionNode, cubeNode];

      const result = restructureAST(flatAST);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const restructuredAST = result.data;
        
        // Without source locations, should keep original structure
        expect(restructuredAST).toHaveLength(2);
        expect(restructuredAST[0]?.type).toBe('union');
        expect(restructuredAST[1]?.type).toBe('cube');
        
        console.log('[DEBUG][ASTRestructuringServiceTest] Nodes without locations handled gracefully');
      }
    });
  });

  describe('createASTRestructuringService', () => {
    it('should create service with default config', () => {
      console.log('[DEBUG][ASTRestructuringServiceTest] Testing service creation');
      
      const service = createASTRestructuringService();
      
      expect(service.config.enableLogging).toBe(true);
      expect(service.config.maxDepth).toBe(10);
      expect(service.config.enableSourceLocationAnalysis).toBe(true);
      expect(typeof service.restructure).toBe('function');
      
      console.log('[DEBUG][ASTRestructuringServiceTest] Service creation successful');
    });

    it('should create service with custom config', () => {
      console.log('[DEBUG][ASTRestructuringServiceTest] Testing service creation with custom config');
      
      const service = createASTRestructuringService({
        enableLogging: false,
        maxDepth: 5
      });
      
      expect(service.config.enableLogging).toBe(false);
      expect(service.config.maxDepth).toBe(5);
      expect(service.config.enableSourceLocationAnalysis).toBe(true); // Default value
      
      console.log('[DEBUG][ASTRestructuringServiceTest] Custom service creation successful');
    });
  });
});
