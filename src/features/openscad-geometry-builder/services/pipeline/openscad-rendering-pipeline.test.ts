/**
 * @file openscad-rendering-pipeline.test.ts
 * @description Tests for OpenSCAD Rendering Pipeline Service
 */

import { Engine, Scene } from '@babylonjs/core';
import { beforeEach, describe, expect, test } from 'vitest';
import type {
  ASTNode,
  AssignStatementNode,
  CubeNode,
  SphereNode,
} from '@/features/openscad-parser';
import { isError, isSuccess } from '@/shared';
import { OpenSCADRenderingPipelineService } from './openscad-rendering-pipeline';

// Mock BabylonJS for testing
vi.mock('@babylonjs/core', () => ({
  Engine: vi.fn().mockImplementation(() => ({
    dispose: vi.fn(),
  })),
  Scene: vi.fn().mockImplementation(() => ({
    dispose: vi.fn(),
    meshes: [],
  })),
  Mesh: vi.fn().mockImplementation(() => ({
    name: 'test-mesh',
    getTotalVertices: vi.fn().mockReturnValue(8),
    getTotalIndices: vi.fn().mockReturnValue(12),
    dispose: vi.fn(),
  })),
}));

describe('OpenSCADRenderingPipelineService', () => {
  let pipeline: OpenSCADRenderingPipelineService;
  let scene: Scene;

  beforeEach(() => {
    pipeline = new OpenSCADRenderingPipelineService();
    scene = new Scene(new Engine(null, false));
  });

  describe('extractGlobalVariables', () => {
    test('should extract global variables from AST', () => {
      const ast: ASTNode[] = [
        {
          type: 'assign_statement',
          variable: '$fn',
          value: 8,
          location: { line: 1, column: 1 },
        } as AssignStatementNode,
        {
          type: 'assign_statement',
          variable: '$fa',
          value: 6,
          location: { line: 2, column: 1 },
        } as AssignStatementNode,
        {
          type: 'assign_statement',
          variable: '$fs',
          value: 1,
          location: { line: 3, column: 1 },
        } as AssignStatementNode,
        {
          type: 'sphere',
          radius: 5,
          location: { line: 4, column: 1 },
        } as SphereNode,
      ];

      const globals = pipeline.extractGlobalVariables(ast);

      expect(globals.$fn).toBe(8);
      expect(globals.$fa).toBe(6);
      expect(globals.$fs).toBe(1);
      expect(globals.$t).toBe(0); // Default value
    });

    test('should use default values when no assignments found', () => {
      const ast: ASTNode[] = [
        {
          type: 'sphere',
          radius: 5,
          location: { line: 1, column: 1 },
        } as SphereNode,
      ];

      const globals = pipeline.extractGlobalVariables(ast);

      expect(globals.$fn).toBeUndefined(); // No default for $fn
      expect(globals.$fa).toBe(12); // Default value
      expect(globals.$fs).toBe(2); // Default value
      expect(globals.$t).toBe(0); // Default value
    });

    test('should ignore non-numeric assignment values', () => {
      const ast: ASTNode[] = [
        {
          type: 'assign_statement',
          variable: '$fn',
          value: 'invalid',
          location: { line: 1, column: 1 },
        } as any,
        {
          type: 'assign_statement',
          variable: '$fa',
          value: 6,
          location: { line: 2, column: 1 },
        } as AssignStatementNode,
      ];

      const globals = pipeline.extractGlobalVariables(ast);

      expect(globals.$fn).toBeUndefined(); // Invalid value ignored
      expect(globals.$fa).toBe(6); // Valid value extracted
    });
  });

  describe('filterGeometryNodes', () => {
    test('should filter out assignment statements', () => {
      const ast: ASTNode[] = [
        {
          type: 'assign_statement',
          variable: '$fn',
          value: 8,
          location: { line: 1, column: 1 },
        } as AssignStatementNode,
        {
          type: 'sphere',
          radius: 5,
          location: { line: 2, column: 1 },
        } as SphereNode,
        {
          type: 'cube',
          size: 2,
          location: { line: 3, column: 1 },
        } as CubeNode,
        {
          type: 'assign_statement',
          variable: '$fa',
          value: 12,
          location: { line: 4, column: 1 },
        } as AssignStatementNode,
      ];

      const geometryNodes = pipeline.filterGeometryNodes(ast);

      expect(geometryNodes.length).toBe(2);
      expect(geometryNodes[0].type).toBe('sphere');
      expect(geometryNodes[1].type).toBe('cube');
    });

    test('should return empty array when no geometry nodes found', () => {
      const ast: ASTNode[] = [
        {
          type: 'assign_statement',
          variable: '$fn',
          value: 8,
          location: { line: 1, column: 1 },
        } as AssignStatementNode,
        {
          type: 'assign_statement',
          variable: '$fa',
          value: 12,
          location: { line: 2, column: 1 },
        } as AssignStatementNode,
      ];

      const geometryNodes = pipeline.filterGeometryNodes(ast);

      expect(geometryNodes.length).toBe(0);
    });
  });

  describe('convertASTToMeshes', () => {
    test('should convert AST nodes to meshes successfully', () => {
      const ast: ASTNode[] = [
        {
          type: 'assign_statement',
          variable: '$fn',
          value: 8,
          location: { line: 1, column: 1 },
        } as AssignStatementNode,
        {
          type: 'sphere',
          radius: 5,
          $fn: 6,
          location: { line: 2, column: 1 },
        } as SphereNode,
        {
          type: 'cube',
          size: 2,
          center: true,
          location: { line: 3, column: 1 },
        } as CubeNode,
      ];

      const result = pipeline.convertASTToMeshes(ast, scene, undefined, 'test');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const meshes = result.data;
        expect(meshes.length).toBe(2); // sphere + cube
        expect(meshes[0].name).toBe('test-0');
        expect(meshes[1].name).toBe('test-1');
      }
    });

    test('should handle empty geometry nodes gracefully', () => {
      const ast: ASTNode[] = [
        {
          type: 'assign_statement',
          variable: '$fn',
          value: 8,
          location: { line: 1, column: 1 },
        } as AssignStatementNode,
      ];

      const result = pipeline.convertASTToMeshes(ast, scene);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.length).toBe(0);
      }
    });

    test('should use provided global variables', () => {
      const ast: ASTNode[] = [
        {
          type: 'sphere',
          radius: 5,
          location: { line: 1, column: 1 },
        } as SphereNode,
      ];

      const customGlobals = {
        $fn: 12,
        $fa: 6,
        $fs: 1,
        $t: 0.5,
      };

      const result = pipeline.convertASTToMeshes(ast, scene, customGlobals);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.length).toBe(1);
      }
    });

    test('should handle conversion errors gracefully', () => {
      const ast: ASTNode[] = [
        {
          type: 'unsupported_primitive',
          location: { line: 1, column: 1 },
        } as any,
      ];

      const result = pipeline.convertASTToMeshes(ast, scene);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.type).toBe('CONVERSION_ERROR');
        expect(result.error.message).toContain('AST to geometry conversion failed');
      }
    });
  });

  describe('validateAST', () => {
    test('should validate correct AST structure', () => {
      const ast: ASTNode[] = [
        {
          type: 'sphere',
          radius: 5,
          location: { line: 1, column: 1 },
        } as SphereNode,
        {
          type: 'cube',
          size: 2,
          location: { line: 2, column: 1 },
        } as CubeNode,
      ];

      const result = pipeline.validateAST(ast);

      expect(isSuccess(result)).toBe(true);
    });

    test('should reject non-array input', () => {
      const result = pipeline.validateAST('not an array' as any);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.type).toBe('AST_FILTERING_ERROR');
        expect(result.error.message).toContain('must be an array');
      }
    });

    test('should reject empty AST array', () => {
      const result = pipeline.validateAST([]);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.type).toBe('AST_FILTERING_ERROR');
        expect(result.error.message).toContain('empty');
      }
    });

    test('should reject nodes with invalid type property', () => {
      const ast = [
        {
          type: 'sphere',
          radius: 5,
          location: { line: 1, column: 1 },
        },
        {
          // Missing type property
          radius: 3,
          location: { line: 2, column: 1 },
        },
      ] as any[];

      const result = pipeline.validateAST(ast);

      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.type).toBe('AST_FILTERING_ERROR');
        expect(result.error.message).toContain('Invalid AST node at index 1');
      }
    });
  });

  describe('getPipelineStatistics', () => {
    test('should calculate pipeline statistics correctly', () => {
      const ast: ASTNode[] = [
        {
          type: 'assign_statement',
          variable: '$fn',
          value: 8,
          location: { line: 1, column: 1 },
        } as AssignStatementNode,
        {
          type: 'sphere',
          radius: 5,
          location: { line: 2, column: 1 },
        } as SphereNode,
        {
          type: 'sphere',
          radius: 3,
          location: { line: 3, column: 1 },
        } as SphereNode,
        {
          type: 'cube',
          size: 2,
          location: { line: 4, column: 1 },
        } as CubeNode,
      ];

      const mockMeshes = [{ name: 'mesh-0' }, { name: 'mesh-1' }, { name: 'mesh-2' }] as any[];

      const globals = {
        $fn: 8,
        $fa: 12,
        $fs: 2,
        $t: 0,
      };

      const stats = pipeline.getPipelineStatistics(ast, mockMeshes, globals);

      expect(stats.totalASTNodes).toBe(4);
      expect(stats.filteredASTNodes).toBe(3); // Excludes assignment statement
      expect(stats.createdMeshes).toBe(3);
      expect(stats.globalVariables).toEqual(globals);
      expect(stats.nodeTypeBreakdown.sphere).toBe(2);
      expect(stats.nodeTypeBreakdown.cube).toBe(1);
    });
  });
});
