/**
 * Module Registry Service Tests
 *
 * Tests for the module registry service that manages OpenSCAD module definitions
 * and instantiations with parameter binding and scope management.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type {
  IdentifierNode,
  ModuleDefinitionNode,
  ModuleParameter,
} from '../../../openscad-parser/ast/ast-types.js';
import { ModuleRegistryService } from './module-registry.service.js';

const logger = createLogger('ModuleRegistryServiceTest');

describe('ModuleRegistryService', () => {
  let moduleRegistry: ModuleRegistryService;

  beforeEach(() => {
    logger.init('Setting up ModuleRegistryService test');
    moduleRegistry = new ModuleRegistryService();
  });

  afterEach(() => {
    logger.end('ModuleRegistryService test completed');
  });

  describe('Module Registration', () => {
    it('should register a module definition successfully', () => {
      const name: IdentifierNode = {
        type: 'expression',
        expressionType: 'identifier',
        name: 'test_module',
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 12, offset: 11 },
        },
      };
      const parameters: ModuleParameter[] = [{ name: 'size' }, { name: 'center' }];
      const moduleNode: ModuleDefinitionNode = {
        type: 'module_definition',
        name,
        parameters,
        body: [],
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 20, offset: 19 },
        },
      };

      const result = moduleRegistry.registerModule(moduleNode);

      expect(result.success).toBe(true);
      expect(moduleRegistry.hasModule('test_module')).toBe(true);
      expect(moduleRegistry.getModuleCount()).toBe(1);
    });

    it('should prevent duplicate module registration', () => {
      const name: IdentifierNode = {
        type: 'expression',
        expressionType: 'identifier',
        name: 'duplicate_module',
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 17, offset: 16 },
        },
      };
      const moduleNode: ModuleDefinitionNode = {
        type: 'module_definition',
        name,
        parameters: [],
        body: [],
      };

      const firstResult = moduleRegistry.registerModule(moduleNode);
      expect(firstResult.success).toBe(true);

      const secondResult = moduleRegistry.registerModule(moduleNode);
      expect(secondResult.success).toBe(false);
      if (!secondResult.success) {
        expect(secondResult.error).toContain('already defined');
      }
    });

    it('should retrieve registered module definitions', () => {
      const name: IdentifierNode = {
        type: 'expression',
        expressionType: 'identifier',
        name: 'retrievable_module',
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 19, offset: 18 },
        },
      };
      const parameters: ModuleParameter[] = [{ name: 'param1' }, { name: 'param2' }];
      const moduleNode: ModuleDefinitionNode = {
        type: 'module_definition',
        name,
        parameters,
        body: [],
      };

      moduleRegistry.registerModule(moduleNode);
      const retrieved = moduleRegistry.getModule('retrievable_module');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.name.name).toBe('retrievable_module');
      expect(retrieved?.parameters).toEqual([{ name: 'param1' }, { name: 'param2' }]);
    });

    it('should return null for non-existent modules', () => {
      const retrieved = moduleRegistry.getModule('non_existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('Module Instantiation', () => {
    beforeEach(() => {
      const name: IdentifierNode = {
        type: 'expression',
        expressionType: 'identifier',
        name: 'parameterized_module',
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 21, offset: 20 },
        },
      };
      const parameters: ModuleParameter[] = [
        { name: 'width' },
        { name: 'height' },
        { name: 'depth' },
      ];
      const moduleNode: ModuleDefinitionNode = {
        type: 'module_definition',
        name,
        parameters,
        body: [],
      };
      moduleRegistry.registerModule(moduleNode);
    });

    it('should create module instance with parameter bindings', () => {
      const args = [10, 20, 30];
      const result = moduleRegistry.createModuleInstance('parameterized_module', args);

      expect(result.success).toBe(true);
      if (result.success) {
        const instance = result.data;
        expect(instance.definition.name.name).toBe('parameterized_module');
        expect(instance.parameters.get('width')).toBe(10);
        expect(instance.parameters.get('height')).toBe(20);
        expect(instance.parameters.get('depth')).toBe(30);
      }
    });

    it('should handle fewer arguments than parameters', () => {
      const args = [10];
      const result = moduleRegistry.createModuleInstance('parameterized_module', args);

      expect(result.success).toBe(true);
      if (result.success) {
        const instance = result.data;
        expect(instance.parameters.get('width')).toBe(10);
        expect(instance.parameters.get('height')).toBeUndefined();
        expect(instance.parameters.get('depth')).toBeUndefined();
      }
    });

    it('should fail to instantiate non-existent module', () => {
      const result = moduleRegistry.createModuleInstance('non_existent', []);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('is not defined');
      }
    });
  });

  describe('Module Management', () => {
    it('should list all registered module names', () => {
      const createIdentifier = (name: string): IdentifierNode => ({
        type: 'expression',
        expressionType: 'identifier',
        name,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: name.length + 1, offset: name.length },
        },
      });

      const modules = [
        {
          type: 'module_definition' as const,
          name: createIdentifier('module1'),
          parameters: [],
          body: [],
        },
        {
          type: 'module_definition' as const,
          name: createIdentifier('module2'),
          parameters: [],
          body: [],
        },
        {
          type: 'module_definition' as const,
          name: createIdentifier('module3'),
          parameters: [],
          body: [],
        },
      ];

      modules.forEach((module) => moduleRegistry.registerModule(module));

      const moduleNames = moduleRegistry.getModuleNames();
      expect(moduleNames).toHaveLength(3);
      expect(moduleNames).toContain('module1');
      expect(moduleNames).toContain('module2');
      expect(moduleNames).toContain('module3');
    });

    it('should clear all registered modules', () => {
      const name: IdentifierNode = {
        type: 'expression',
        expressionType: 'identifier',
        name: 'clearable_module',
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 17, offset: 16 },
        },
      };
      const moduleNode: ModuleDefinitionNode = {
        type: 'module_definition',
        name,
        parameters: [],
        body: [],
      };

      moduleRegistry.registerModule(moduleNode);
      expect(moduleRegistry.getModuleCount()).toBe(1);

      moduleRegistry.clear();
      expect(moduleRegistry.getModuleCount()).toBe(0);
      expect(moduleRegistry.hasModule('clearable_module')).toBe(false);
    });

    it('should track module count correctly', () => {
      expect(moduleRegistry.getModuleCount()).toBe(0);

      const name1: IdentifierNode = {
        type: 'expression',
        expressionType: 'identifier',
        name: 'counted_module1',
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 16, offset: 15 },
        },
      };
      const moduleNode1: ModuleDefinitionNode = {
        type: 'module_definition',
        name: name1,
        parameters: [],
        body: [],
      };

      const name2: IdentifierNode = {
        type: 'expression',
        expressionType: 'identifier',
        name: 'counted_module2',
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 16, offset: 15 },
        },
      };
      const moduleNode2: ModuleDefinitionNode = {
        type: 'module_definition',
        name: name2,
        parameters: [],
        body: [],
      };

      moduleRegistry.registerModule(moduleNode1);
      expect(moduleRegistry.getModuleCount()).toBe(1);

      moduleRegistry.registerModule(moduleNode2);
      expect(moduleRegistry.getModuleCount()).toBe(2);
    });
  });
});
