/**
 * @file Control Flow Operations Service Tests
 *
 * Tests for the ControlFlowOperationsService following TDD principles.
 * Tests control flow constructs without external dependencies.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { BoundingBox, Matrix, Vector3 } from '@babylonjs/core';
import {
  ControlFlowOperationsService,
  type OpenSCADForLoopParams,
  type OpenSCADIfParams,
  type OpenSCADLetParams,
  type OpenSCADIntersectionForParams,
  type VariableContext,
} from './control-flow-operations.service';
import type { GenericMeshData, GenericMeshCollection } from '../../types/generic-mesh-data.types';
import { MATERIAL_PRESETS, DEFAULT_MESH_METADATA } from '../../types/generic-mesh-data.types';
import { success } from '../../../../shared/utils/functional/result';

describe('ControlFlowOperationsService', () => {
  let controlFlowService: ControlFlowOperationsService;
  let testMesh: GenericMeshData;

  beforeEach(() => {
    controlFlowService = new ControlFlowOperationsService();
    
    // Create test mesh data
    testMesh = createTestMesh('test-mesh');
  });

  describe('For Loop Operations', () => {
    it('should expand for loop with range iteration', async () => {
      const params: OpenSCADForLoopParams = {
        variable: 'i',
        range: { start: 0, end: 2, step: 1 },
        body: async (value, context) => {
          const mesh = createTestMesh(`mesh_${value}`);
          return success(mesh);
        },
      };

      const result = await controlFlowService.expandForLoop(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const collection = result.data;
        expect(collection.meshes.length).toBe(3); // 0, 1, 2
        expect(collection.metadata.collectionType).toBe('control_flow_result');
        expect(collection.meshes[0]!.id).toBe('mesh_0');
        expect(collection.meshes[1]!.id).toBe('mesh_1');
        expect(collection.meshes[2]!.id).toBe('mesh_2');
      }
    });

    it('should expand for loop with list iteration', async () => {
      const params: OpenSCADForLoopParams = {
        variable: 'item',
        list: ['a', 'b', 'c'],
        body: async (value, context) => {
          const mesh = createTestMesh(`mesh_${value}`);
          return success(mesh);
        },
      };

      const result = await controlFlowService.expandForLoop(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const collection = result.data;
        expect(collection.meshes.length).toBe(3);
        expect(collection.meshes[0]!.id).toBe('mesh_a');
        expect(collection.meshes[1]!.id).toBe('mesh_b');
        expect(collection.meshes[2]!.id).toBe('mesh_c');
      }
    });

    it('should handle negative step in range iteration', async () => {
      const params: OpenSCADForLoopParams = {
        variable: 'i',
        range: { start: 5, end: 3, step: -1 },
        body: async (value, context) => {
          const mesh = createTestMesh(`mesh_${value}`);
          return success(mesh);
        },
      };

      const result = await controlFlowService.expandForLoop(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const collection = result.data;
        expect(collection.meshes.length).toBe(3); // 5, 4, 3
        expect(collection.meshes[0]!.id).toBe('mesh_5');
        expect(collection.meshes[1]!.id).toBe('mesh_4');
        expect(collection.meshes[2]!.id).toBe('mesh_3');
      }
    });

    it('should handle empty iteration gracefully', async () => {
      const params: OpenSCADForLoopParams = {
        variable: 'i',
        range: { start: 5, end: 3, step: 1 }, // Invalid range
        body: async (value, context) => {
          const mesh = createTestMesh(`mesh_${value}`);
          return success(mesh);
        },
      };

      const result = await controlFlowService.expandForLoop(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const collection = result.data;
        expect(collection.meshes.length).toBe(0);
      }
    });

    it('should fail with invalid parameters', async () => {
      const params: OpenSCADForLoopParams = {
        variable: '',
        body: async (value, context) => success(testMesh),
      };

      const result = await controlFlowService.expandForLoop(params);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(['INVALID_PARAMETERS', 'EVALUATION_FAILED']).toContain(result.error.code);
        expect(result.error.operationType).toBe('for_loop');
      }
    });

    it('should handle body errors gracefully', async () => {
      const params: OpenSCADForLoopParams = {
        variable: 'i',
        range: { start: 0, end: 2 },
        body: async (value, context) => {
          if (value === 1) {
            throw new Error('Body error');
          }
          return success(createTestMesh(`mesh_${value}`));
        },
      };

      const result = await controlFlowService.expandForLoop(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const collection = result.data;
        expect(collection.meshes.length).toBe(2); // Should skip the failed iteration
        expect(collection.meshes[0]!.id).toBe('mesh_0');
        expect(collection.meshes[1]!.id).toBe('mesh_2');
      }
    });
  });

  describe('If Statement Operations', () => {
    it('should execute then branch when condition is true', async () => {
      const params: OpenSCADIfParams = {
        condition: true,
        thenBody: async (context) => success(createTestMesh('then-mesh')),
        elseBody: async (context) => success(createTestMesh('else-mesh')),
      };

      const result = await controlFlowService.processIf(params);
      expect(result.success).toBe(true);
      
      if (result.success && result.data) {
        expect((result.data as GenericMeshData).id).toBe('then-mesh');
      }
    });

    it('should execute else branch when condition is false', async () => {
      const params: OpenSCADIfParams = {
        condition: false,
        thenBody: async (context) => success(createTestMesh('then-mesh')),
        elseBody: async (context) => success(createTestMesh('else-mesh')),
      };

      const result = await controlFlowService.processIf(params);
      expect(result.success).toBe(true);
      
      if (result.success && result.data) {
        expect((result.data as GenericMeshData).id).toBe('else-mesh');
      }
    });

    it('should return null when condition is false and no else branch', async () => {
      const params: OpenSCADIfParams = {
        condition: false,
        thenBody: async (context) => success(createTestMesh('then-mesh')),
      };

      const result = await controlFlowService.processIf(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toBe(null);
      }
    });

    it('should evaluate function conditions with context', async () => {
      const context: VariableContext = {
        variables: { x: 10, y: 5 },
      };

      const params: OpenSCADIfParams = {
        condition: (ctx) => (ctx.variables.x as number) > (ctx.variables.y as number),
        thenBody: async (context) => success(createTestMesh('condition-true')),
        elseBody: async (context) => success(createTestMesh('condition-false')),
      };

      const result = await controlFlowService.processIf(params, context);
      expect(result.success).toBe(true);
      
      if (result.success && result.data) {
        expect((result.data as GenericMeshData).id).toBe('condition-true');
      }
    });

    it('should handle condition evaluation errors', async () => {
      const params: OpenSCADIfParams = {
        condition: (ctx) => {
          throw new Error('Condition error');
        },
        thenBody: async (context) => success(createTestMesh('then-mesh')),
        elseBody: async (context) => success(createTestMesh('else-mesh')),
      };

      const result = await controlFlowService.processIf(params);
      expect(result.success).toBe(true);
      
      if (result.success && result.data) {
        // Should default to false and execute else branch
        expect((result.data as GenericMeshData).id).toBe('else-mesh');
      }
    });
  });

  describe('Let Statement Operations', () => {
    it('should bind variables and execute body', async () => {
      const params: OpenSCADLetParams = {
        bindings: { x: 10, y: 20 },
        body: async (context) => {
          const x = context.variables.x as number;
          const y = context.variables.y as number;
          return success(createTestMesh(`result_${x + y}`));
        },
      };

      const result = await controlFlowService.processLet(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect((result.data as GenericMeshData).id).toBe('result_30');
      }
    });

    it('should inherit parent context variables', async () => {
      const parentContext: VariableContext = {
        variables: { a: 5, b: 10 },
      };

      const params: OpenSCADLetParams = {
        bindings: { c: 15 },
        body: async (context) => {
          const a = context.variables.a as number;
          const b = context.variables.b as number;
          const c = context.variables.c as number;
          return success(createTestMesh(`result_${a + b + c}`));
        },
      };

      const result = await controlFlowService.processLet(params, parentContext);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect((result.data as GenericMeshData).id).toBe('result_30');
      }
    });

    it('should override parent variables with local bindings', async () => {
      const parentContext: VariableContext = {
        variables: { x: 5 },
      };

      const params: OpenSCADLetParams = {
        bindings: { x: 10 }, // Override parent x
        body: async (context) => {
          const x = context.variables.x as number;
          return success(createTestMesh(`result_${x}`));
        },
      };

      const result = await controlFlowService.processLet(params, parentContext);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect((result.data as GenericMeshData).id).toBe('result_10');
      }
    });
  });

  describe('Intersection For Operations', () => {
    it('should process intersection_for with range', async () => {
      const params: OpenSCADIntersectionForParams = {
        variable: 'i',
        range: { start: 0, end: 2 },
        body: async (value, context) => {
          return success(createTestMesh(`mesh_${value}`));
        },
      };

      const result = await controlFlowService.processIntersectionFor(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        // For now, returns first mesh as placeholder
        expect(result.data.id).toBe('mesh_0');
      }
    });

    it('should fail with no valid meshes', async () => {
      const params: OpenSCADIntersectionForParams = {
        variable: 'i',
        range: { start: 5, end: 3 }, // Empty range
        body: async (value, context) => {
          return success(createTestMesh(`mesh_${value}`));
        },
      };

      const result = await controlFlowService.processIntersectionFor(params);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(['ITERATION_FAILED', 'EVALUATION_FAILED']).toContain(result.error.code);
      }
    });
  });

  describe('Variable Context Management', () => {
    it('should handle nested contexts correctly', async () => {
      const outerContext: VariableContext = {
        variables: { outer: 'outer_value' },
      };

      const forParams: OpenSCADForLoopParams = {
        variable: 'i',
        range: { start: 0, end: 1 },
        body: async (value, context) => {
          // Should have access to both outer variable and loop variable
          const outer = context.variables.outer as string;
          const i = context.variables.i as number;
          return success(createTestMesh(`${outer}_${i}`));
        },
      };

      const result = await controlFlowService.expandForLoop(forParams, outerContext);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const collection = result.data;
        expect(collection.meshes[0]!.id).toBe('outer_value_0');
        expect(collection.meshes[1]!.id).toBe('outer_value_1');
      }
    });
  });

  // Helper function to create test mesh
  function createTestMesh(id: string): GenericMeshData {
    return {
      id,
      geometry: {
        positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        indices: new Uint32Array([0, 1, 2]),
        vertexCount: 3,
        triangleCount: 1,
        boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
      },
      material: MATERIAL_PRESETS.DEFAULT,
      transform: Matrix.Identity(),
      metadata: {
        ...DEFAULT_MESH_METADATA,
        meshId: id,
        name: id,
        nodeType: 'test',
        vertexCount: 3,
        triangleCount: 1,
        boundingBox: new BoundingBox(Vector3.Zero(), Vector3.One()),
      },
    };
  }
});
