/**
 * @file Module System Service Tests
 *
 * Tests for the ModuleSystemService following TDD principles.
 * Tests module registration, instantiation, and children() directive.
 */

import { BoundingBox, Matrix, Vector3 } from '@babylonjs/core';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Result } from '../../../../shared/types/result.types';
import { success } from '../../../../shared/utils/functional/result';
import type {
  ASTNode,
  ChildrenNode,
  IdentifierNode,
  ModuleDefinitionNode,
  ModuleInstantiationNode,
  ModuleParameter,
  Parameter,
} from '../../../openscad-parser/ast/ast-types';
import type { GenericMeshCollection, GenericMeshData } from '../../types/generic-mesh-data.types';
import { DEFAULT_MESH_METADATA, MATERIAL_PRESETS } from '../../types/generic-mesh-data.types';
import type { VariableContext } from '../control-flow-operations';
import { type ModuleExecutionContext, ModuleSystemService } from './module-system.service';

type BodyExecutor = (
  body: readonly ASTNode[],
  context: ModuleExecutionContext
) => Promise<
  Result<
    GenericMeshData | GenericMeshCollection,
    import('./module-system.service').ModuleSystemError
  >
>;
type ChildExecutor = (
  child: ASTNode,
  context: ModuleExecutionContext
) => Promise<
  Result<
    GenericMeshData | GenericMeshCollection,
    import('./module-system.service').ModuleSystemError
  >
>;

describe('ModuleSystemService', () => {
  let moduleService: ModuleSystemService;
  let testContext: VariableContext;
  let testMesh: GenericMeshData;

  beforeEach(() => {
    moduleService = new ModuleSystemService();
    testContext = { variables: {} };
    testMesh = createTestMesh('test-mesh');
  });

  describe('Module Registration', () => {
    it('should register a simple module definition', async () => {
      const moduleDefNode = createModuleDefinition('simple_box', [], []);

      const result = await moduleService.registerModule(moduleDefNode);
      expect(result.success).toBe(true);

      expect(moduleService.isModuleRegistered('simple_box')).toBe(true);
      expect(moduleService.getRegisteredModules()).toContain('simple_box');
    });

    it('should register a module with parameters', async () => {
      const parameters: ModuleParameter[] = [
        {
          type: 'module_parameter',
          name: 'size',
          defaultValue: { type: 'vector', value: [10, 10, 10] } as ASTNode
        },
        {
          type: 'module_parameter',
          name: 'center',
          defaultValue: { type: 'boolean', value: false } as ASTNode
        },
      ];
      const moduleDefNode = createModuleDefinition('parametric_box', parameters, []);

      const result = await moduleService.registerModule(moduleDefNode);
      expect(result.success).toBe(true);

      const definition = moduleService.getModuleDefinition('parametric_box');
      expect(definition).toBeDefined();
      expect(definition?.parameters.length).toBe(2);
      expect(definition?.parameters[0]?.name).toBe('size');
      expect(definition?.parameters[1]?.name).toBe('center');
    });

    it('should register multiple modules', async () => {
      const module1 = createModuleDefinition('module1', [], []);
      const module2 = createModuleDefinition('module2', [], []);

      await moduleService.registerModule(module1);
      await moduleService.registerModule(module2);

      expect(moduleService.getRegisteredModules()).toEqual(['module1', 'module2']);
    });

    it('should overwrite existing module with same name', async () => {
      const module1 = createModuleDefinition('test_module', [], []);
      const module2 = createModuleDefinition('test_module', [{ type: 'module_parameter', name: 'param' }], []);

      await moduleService.registerModule(module1);
      await moduleService.registerModule(module2);

      const definition = moduleService.getModuleDefinition('test_module');
      expect(definition?.parameters.length).toBe(1);
    });
  });

  describe('Module Instantiation', () => {
    beforeEach(async () => {
      // Register test modules
      const simpleModule = createModuleDefinition('simple_box', [], []);
      const parametricModule = createModuleDefinition(
        'parametric_box',
        [
          {
            type: 'module_parameter',
            name: 'size',
            defaultValue: { type: 'vector', value: [10, 10, 10] } as ASTNode
          },
          {
            type: 'module_parameter',
            name: 'center',
            defaultValue: { type: 'boolean', value: false } as ASTNode
          },
        ],
        []
      );

      await moduleService.registerModule(simpleModule);
      await moduleService.registerModule(parametricModule);
    });

    it('should instantiate a simple module', async () => {
      const moduleInstNode = createModuleInstantiation('simple_box', [], []);

      const bodyExecutor: BodyExecutor = async (_body, _context) => {
        return success(testMesh);
      };

      const result = await moduleService.instantiateModule(
        moduleInstNode,
        testContext,
        bodyExecutor
      );
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toBe(testMesh);
      }
    });

    it('should instantiate module with positional arguments', async () => {
      const args: Parameter[] = [
        { name: undefined, value: [20, 20, 20] },
        { name: undefined, value: true },
      ];
      const moduleInstNode = createModuleInstantiation('parametric_box', args, []);

      const bodyExecutor: BodyExecutor = async (_body, context) => {
        expect(context.moduleParameters.size).toEqual([20, 20, 20]);
        expect(context.moduleParameters.center).toBe(true);
        return success(testMesh);
      };

      const result = await moduleService.instantiateModule(
        moduleInstNode,
        testContext,
        bodyExecutor
      );
      expect(result.success).toBe(true);
    });

    it('should instantiate module with named arguments', async () => {
      const args: Parameter[] = [
        { name: 'center', value: true },
        { name: 'size', value: [15, 15, 15] },
      ];
      const moduleInstNode = createModuleInstantiation('parametric_box', args, []);

      const bodyExecutor: BodyExecutor = async (_body, context) => {
        expect(context.moduleParameters.size).toEqual([15, 15, 15]);
        expect(context.moduleParameters.center).toBe(true);
        return success(testMesh);
      };

      const result = await moduleService.instantiateModule(
        moduleInstNode,
        testContext,
        bodyExecutor
      );
      expect(result.success).toBe(true);
    });

    it('should use default parameter values', async () => {
      const args: Parameter[] = [
        { name: 'size', value: [25, 25, 25] },
        // center parameter not provided, should use default
      ];
      const moduleInstNode = createModuleInstantiation('parametric_box', args, []);

      const bodyExecutor: BodyExecutor = async (_body, context) => {
        expect(context.moduleParameters.size).toEqual([25, 25, 25]);
        expect(context.moduleParameters.center).toBe(false); // Default value
        return success(testMesh);
      };

      const result = await moduleService.instantiateModule(
        moduleInstNode,
        testContext,
        bodyExecutor
      );
      expect(result.success).toBe(true);
    });

    it('should fail with unknown module', async () => {
      const moduleInstNode = createModuleInstantiation('unknown_module', [], []);

      const bodyExecutor: BodyExecutor = async (_body, _context) => success(testMesh);

      const result = await moduleService.instantiateModule(
        moduleInstNode,
        testContext,
        bodyExecutor
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('MODULE_NOT_FOUND');
        expect(result.error.moduleName).toBe('unknown_module');
      }
    });

    it('should inherit parent context variables', async () => {
      const parentContext: VariableContext = {
        variables: { global_var: 'global_value' },
      };

      const moduleInstNode = createModuleInstantiation('simple_box', [], []);

      const bodyExecutor: BodyExecutor = async (_body, context) => {
        expect(context.variables.global_var).toBe('global_value');
        expect(context.parent).toBe(parentContext);
        return success(testMesh);
      };

      const result = await moduleService.instantiateModule(
        moduleInstNode,
        parentContext,
        bodyExecutor
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Children() Directive', () => {
    beforeEach(async () => {
      const wrapperModule = createModuleDefinition('wrapper', [], []);
      await moduleService.registerModule(wrapperModule);
    });

    it('should process children() with no children', async () => {
      const childrenNode: ChildrenNode = { type: 'children' };
      const context: ModuleExecutionContext = {
        variables: {},
        moduleParameters: {},
        childrenNodes: [],
      };

      const childExecutor: ChildExecutor = async (_child, _ctx) => success(testMesh);

      const result = await moduleService.processChildren(childrenNode, context, childExecutor);
      expect(result.success).toBe(true);

      if (result.success && 'meshes' in result.data) {
        expect(result.data.meshes.length).toBe(0);
      }
    });

    it('should process children() with multiple children', async () => {
      const childrenNode: ChildrenNode = { type: 'children' };
      const childNodes = [createTestASTNode('child1'), createTestASTNode('child2')];
      const context: ModuleExecutionContext = {
        variables: {},
        moduleParameters: {},
        childrenNodes: childNodes,
      };

      const childExecutor: ChildExecutor = async (child, _ctx) => {
        const mesh = createTestMesh(`mesh_${(child as any).name}`);
        return success(mesh);
      };

      const result = await moduleService.processChildren(childrenNode, context, childExecutor);
      expect(result.success).toBe(true);

      if (result.success && 'meshes' in result.data) {
        expect(result.data.meshes.length).toBe(2);
        expect(result.data.meshes[0]?.id).toBe('mesh_child1');
        expect(result.data.meshes[1]?.id).toBe('mesh_child2');
      }
    });

    it('should process children() with specific index', async () => {
      const childrenNode: ChildrenNode = { type: 'children', indices: [1] };
      const childNodes = [
        createTestASTNode('child1'),
        createTestASTNode('child2'),
        createTestASTNode('child3'),
      ];
      const context: ModuleExecutionContext = {
        variables: {},
        moduleParameters: {},
        childrenNodes: childNodes,
      };

      const childExecutor: ChildExecutor = async (child, ctx) => {
        const mesh = createTestMesh(`mesh_${(child as any).name}`);
        expect(ctx.childrenIndex).toBe(1);
        return success(mesh);
      };

      const result = await moduleService.processChildren(childrenNode, context, childExecutor);
      expect(result.success).toBe(true);

      if (result.success && 'id' in result.data) {
        expect(result.data.id).toBe('mesh_child2');
      }
    });

    it('should fail with invalid child index', async () => {
      const childrenNode: ChildrenNode = { type: 'children', indices: [5] };
      const context: ModuleExecutionContext = {
        variables: {},
        moduleParameters: {},
        childrenNodes: [createTestASTNode('child1')],
      };

      const childExecutor: ChildExecutor = async (_child, _ctx) => success(testMesh);

      const result = await moduleService.processChildren(childrenNode, context, childExecutor);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CHILDREN');
      }
    });
  });

  describe('Module Registry Management', () => {
    it('should clear all modules', async () => {
      const module1 = createModuleDefinition('module1', [], []);
      const module2 = createModuleDefinition('module2', [], []);

      await moduleService.registerModule(module1);
      await moduleService.registerModule(module2);

      expect(moduleService.getRegisteredModules().length).toBe(2);

      moduleService.clearModules();

      expect(moduleService.getRegisteredModules().length).toBe(0);
      expect(moduleService.isModuleRegistered('module1')).toBe(false);
      expect(moduleService.isModuleRegistered('module2')).toBe(false);
    });

    it('should check module registration status', () => {
      expect(moduleService.isModuleRegistered('nonexistent')).toBe(false);
    });
  });

  // Helper functions
  function createModuleDefinition(
    name: string,
    parameters: ModuleParameter[],
    body: ASTNode[]
  ): ModuleDefinitionNode {
    return {
      type: 'module_definition',
      name: { type: 'expression', expressionType: 'identifier', name } as IdentifierNode,
      parameters,
      body,
    };
  }

  function createModuleInstantiation(
    name: string,
    args: Parameter[],
    children: ASTNode[]
  ): ModuleInstantiationNode {
    return {
      type: 'module_instantiation',
      name: { type: 'expression', expressionType: 'identifier', name } as IdentifierNode,
      args,
      children,
    };
  }

  function createTestASTNode(name: string): ASTNode {
    return {
      type: 'cube',
      name,
    } as any;
  }

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
