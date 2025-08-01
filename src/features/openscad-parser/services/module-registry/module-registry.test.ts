import { beforeEach, describe, expect, it } from 'vitest';
import type { ModuleDefinitionNode } from '../../ast/ast-types.js';
import { createSourceLocation, createTestModule } from '../test-utils.js';
import { ModuleRegistry, ModuleRegistryErrorCode } from './module-registry.js';

describe('ModuleRegistry', () => {
  let registry: ModuleRegistry;

  beforeEach(() => {
    registry = new ModuleRegistry();
  });

  describe('register', () => {
    it('should register a valid module definition', () => {
      const moduleDefinition = createTestModule('mycube');

      const result = registry.register(moduleDefinition);

      expect(result.success).toBe(true);
      expect(registry.has('mycube')).toBe(true);
      expect(registry.size()).toBe(1);
    });

    it('should reject null or undefined module definition', () => {
      const result = registry.register(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ModuleRegistryErrorCode.INVALID_MODULE_DEFINITION);
      }
    });

    it('should reject module definition without name', () => {
      const moduleDefinition = {
        type: 'module_definition',
        name: null,
        parameters: [],
        body: [],
        location: createSourceLocation(1, 1, 1, 1, 10, 10),
      } as any;

      const result = registry.register(moduleDefinition);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ModuleRegistryErrorCode.INVALID_MODULE_NAME);
      }
    });

    it('should reject module definition with empty name', () => {
      const moduleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: '',
          location: createSourceLocation(1, 8, 8, 1, 8, 8),
        },
        parameters: [],
        body: [],
        location: createSourceLocation(1, 1, 1, 1, 10, 10),
      };

      const result = registry.register(moduleDefinition);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ModuleRegistryErrorCode.INVALID_MODULE_NAME);
      }
    });

    it('should reject duplicate module registration', () => {
      const moduleDefinition = createTestModule('mycube');

      // Register first time
      const firstResult = registry.register(moduleDefinition);
      expect(firstResult.success).toBe(true);

      // Try to register again
      const secondResult = registry.register(moduleDefinition);
      expect(secondResult.success).toBe(false);
      if (!secondResult.success) {
        expect(secondResult.error.code).toBe(ModuleRegistryErrorCode.MODULE_ALREADY_EXISTS);
        expect(secondResult.error.moduleName).toBe('mycube');
      }
    });
  });

  describe('lookup', () => {
    it('should find a registered module', () => {
      const moduleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'mycube',
          location: createSourceLocation(1, 8, 8, 1, 14, 14),
        },
        parameters: [],
        body: [],
        location: createSourceLocation(1, 1, 1, 3, 1, 40),
      };

      registry.register(moduleDefinition);
      const result = registry.lookup('mycube');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.name.name).toBe('mycube');
      }
    });

    it('should return error for non-existent module', () => {
      const result = registry.lookup('nonexistent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ModuleRegistryErrorCode.MODULE_NOT_FOUND);
        expect(result.error.moduleName).toBe('nonexistent');
      }
    });

    it('should reject empty module name', () => {
      const result = registry.lookup('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ModuleRegistryErrorCode.INVALID_MODULE_NAME);
      }
    });
  });

  describe('has', () => {
    it('should return true for registered module', () => {
      const moduleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'mycube',
          location: createSourceLocation(1, 8, 8, 1, 14, 14),
        },
        parameters: [],
        body: [],
        location: createSourceLocation(1, 1, 1, 3, 1, 40),
      };

      registry.register(moduleDefinition);
      expect(registry.has('mycube')).toBe(true);
    });

    it('should return false for non-existent module', () => {
      expect(registry.has('nonexistent')).toBe(false);
    });
  });

  describe('getModuleNames', () => {
    it('should return empty array when no modules registered', () => {
      const names = registry.getModuleNames();
      expect(names).toEqual([]);
    });

    it('should return all registered module names', () => {
      const modules = ['module1', 'module2', 'module3'];

      modules.forEach((name) => {
        const moduleDefinition: ModuleDefinitionNode = {
          type: 'module_definition',
          name: {
            type: 'expression',
            expressionType: 'identifier',
            name,
            location: createSourceLocation(1, 8, 8, 1, 8 + name.length, 8 + name.length),
          },
          parameters: [],
          body: [],
          location: createSourceLocation(1, 1, 1, 3, 1, 40),
        };
        registry.register(moduleDefinition);
      });

      const names = registry.getModuleNames();
      expect(names).toHaveLength(3);
      expect(names).toEqual(expect.arrayContaining(modules));
    });
  });

  describe('clear', () => {
    it('should remove all registered modules', () => {
      const moduleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'mycube',
          location: createSourceLocation(1, 8, 8, 1, 14, 6),
        },
        parameters: [],
        body: [],
        location: createSourceLocation(1, 1, 1, 1, 20, 19),
      };

      registry.register(moduleDefinition);
      expect(registry.size()).toBe(1);

      registry.clear();
      expect(registry.size()).toBe(0);
      expect(registry.has('mycube')).toBe(false);
    });
  });

  describe('size', () => {
    it('should return correct number of registered modules', () => {
      expect(registry.size()).toBe(0);

      const moduleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'mycube',
          location: createSourceLocation(1, 8, 8, 1, 14, 6),
        },
        parameters: [],
        body: [],
        location: createSourceLocation(1, 1, 1, 1, 20, 19),
      };

      registry.register(moduleDefinition);
      expect(registry.size()).toBe(1);
    });
  });
});
