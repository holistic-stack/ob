/**
 * @file scoped-registry.service.test.ts
 * @description Tests for the ScopedRegistryService.
 * Verifies hierarchical registry creation, inheritance, and scope isolation.
 */

import { describe, expect, it } from 'vitest';
import type { ModuleDefinitionNode } from '../../ast/ast-types.js';
import { ModuleRegistry } from '../module-registry/module-registry.js';
import { ScopedRegistryService } from './scoped-registry.service.js';

describe('ScopedRegistryService', () => {
  const createTestModule = (name: string): ModuleDefinitionNode => ({
    type: 'module_definition',
    name: {
      type: 'expression',
      expressionType: 'identifier',
      name,
      location: { line: 1, column: 1 },
    },
    parameters: [],
    body: [
      {
        type: 'cube',
        size: 10,
        center: false,
        location: { line: 2, column: 3 },
      },
    ],
    location: { line: 1, column: 1 },
  });

  describe('createScopedRegistry', () => {
    it('should create a scoped registry that inherits from parent', () => {
      const service = new ScopedRegistryService();
      const parentRegistry = new ModuleRegistry();
      const parentModule = createTestModule('parentModule');

      // Register module in parent
      const registerResult = parentRegistry.register(parentModule);
      expect(registerResult.success).toBe(true);

      // Create scoped registry
      const scopedRegistry = service.createScopedRegistry(parentRegistry);

      // Should be able to find parent module
      const lookupResult = scopedRegistry.lookup('parentModule');
      expect(lookupResult.success).toBe(true);
      expect(lookupResult.data?.name.name).toBe('parentModule');
    });

    it('should prioritize local modules over parent modules', () => {
      const service = new ScopedRegistryService();
      const parentRegistry = new ModuleRegistry();
      const scopedRegistry = service.createScopedRegistry(parentRegistry);

      const parentModule = createTestModule('sharedName');
      const localModule = createTestModule('sharedName');

      // Register same-named module in both registries
      parentRegistry.register(parentModule);
      scopedRegistry.register(localModule);

      // Should find local module (not parent)
      const lookupResult = scopedRegistry.lookup('sharedName');
      expect(lookupResult.success).toBe(true);
      // Local module should be returned (same reference)
      expect(lookupResult.data).toBe(localModule);
    });

    it('should maintain scope isolation (parent cannot see child modules)', () => {
      const service = new ScopedRegistryService();
      const parentRegistry = new ModuleRegistry();
      const scopedRegistry = service.createScopedRegistry(parentRegistry);

      const childModule = createTestModule('childModule');

      // Register module in child scope
      const registerResult = scopedRegistry.register(childModule);
      expect(registerResult.success).toBe(true);

      // Parent should not be able to find child module
      const parentLookupResult = parentRegistry.lookup('childModule');
      expect(parentLookupResult.success).toBe(false);

      // Child should be able to find its own module
      const childLookupResult = scopedRegistry.lookup('childModule');
      expect(childLookupResult.success).toBe(true);
    });

    it('should support multi-level inheritance', () => {
      const service = new ScopedRegistryService();
      const grandparentRegistry = new ModuleRegistry();
      const parentRegistry = service.createScopedRegistry(grandparentRegistry);
      const childRegistry = service.createScopedRegistry(parentRegistry);

      const grandparentModule = createTestModule('grandparentModule');
      const parentModule = createTestModule('parentModule');
      const childModule = createTestModule('childModule');

      // Register modules at different levels
      grandparentRegistry.register(grandparentModule);
      parentRegistry.register(parentModule);
      childRegistry.register(childModule);

      // Child should be able to access all levels
      expect(childRegistry.lookup('childModule').success).toBe(true);
      expect(childRegistry.lookup('parentModule').success).toBe(true);
      expect(childRegistry.lookup('grandparentModule').success).toBe(true);

      // Parent should access grandparent but not child
      expect(parentRegistry.lookup('parentModule').success).toBe(true);
      expect(parentRegistry.lookup('grandparentModule').success).toBe(true);
      expect(parentRegistry.lookup('childModule').success).toBe(false);

      // Grandparent should only access its own modules
      expect(grandparentRegistry.lookup('grandparentModule').success).toBe(true);
      expect(grandparentRegistry.lookup('parentModule').success).toBe(false);
      expect(grandparentRegistry.lookup('childModule').success).toBe(false);
    });
  });

  describe('has method', () => {
    it('should check both local and parent registries', () => {
      const service = new ScopedRegistryService();
      const parentRegistry = new ModuleRegistry();
      const scopedRegistry = service.createScopedRegistry(parentRegistry);

      const parentModule = createTestModule('parentModule');
      const localModule = createTestModule('localModule');

      parentRegistry.register(parentModule);
      scopedRegistry.register(localModule);

      expect(scopedRegistry.has('parentModule')).toBe(true);
      expect(scopedRegistry.has('localModule')).toBe(true);
      expect(scopedRegistry.has('nonExistent')).toBe(false);
    });
  });

  describe('getModuleNames method', () => {
    it('should return unique names from both local and parent registries', () => {
      const service = new ScopedRegistryService();
      const parentRegistry = new ModuleRegistry();
      const scopedRegistry = service.createScopedRegistry(parentRegistry);

      const parentModule1 = createTestModule('parent1');
      const parentModule2 = createTestModule('parent2');
      const localModule1 = createTestModule('local1');
      const localModule2 = createTestModule('local2');
      const duplicateModule = createTestModule('duplicate');

      parentRegistry.register(parentModule1);
      parentRegistry.register(parentModule2);
      parentRegistry.register(duplicateModule);
      scopedRegistry.register(localModule1);
      scopedRegistry.register(localModule2);
      scopedRegistry.register(duplicateModule); // Same name as parent

      const moduleNames = scopedRegistry.getModuleNames();

      expect(moduleNames).toContain('parent1');
      expect(moduleNames).toContain('parent2');
      expect(moduleNames).toContain('local1');
      expect(moduleNames).toContain('local2');
      expect(moduleNames).toContain('duplicate');

      // Should not have duplicates
      const uniqueNames = [...new Set(moduleNames)];
      expect(moduleNames.length).toBe(uniqueNames.length);
    });
  });

  describe('size method', () => {
    it('should return total size including parent registries', () => {
      const service = new ScopedRegistryService();
      const parentRegistry = new ModuleRegistry();
      const scopedRegistry = service.createScopedRegistry(parentRegistry);

      expect(scopedRegistry.size()).toBe(0);

      parentRegistry.register(createTestModule('parent1'));
      parentRegistry.register(createTestModule('parent2'));
      expect(scopedRegistry.size()).toBe(2);

      scopedRegistry.register(createTestModule('local1'));
      expect(scopedRegistry.size()).toBe(3);
    });
  });

  describe('clear method', () => {
    it('should clear only local registry, not parent', () => {
      const service = new ScopedRegistryService();
      const parentRegistry = new ModuleRegistry();
      const scopedRegistry = service.createScopedRegistry(parentRegistry);

      const parentModule = createTestModule('parentModule');
      const localModule = createTestModule('localModule');

      parentRegistry.register(parentModule);
      scopedRegistry.register(localModule);

      expect(scopedRegistry.has('parentModule')).toBe(true);
      expect(scopedRegistry.has('localModule')).toBe(true);

      scopedRegistry.clear();

      expect(scopedRegistry.has('parentModule')).toBe(true); // Parent unchanged
      expect(scopedRegistry.has('localModule')).toBe(false); // Local cleared
    });
  });

  describe('inheritance depth limits', () => {
    it('should enforce maximum inheritance depth', () => {
      const service = new ScopedRegistryService({ maxInheritanceDepth: 3 });

      let currentRegistry = new ModuleRegistry();

      // Create chain up to the limit
      for (let i = 0; i < 3; i++) {
        currentRegistry = service.createScopedRegistry(currentRegistry);
      }

      // Should throw when exceeding limit
      expect(() => {
        service.createScopedRegistry(currentRegistry);
      }).toThrow('Maximum inheritance depth (3) exceeded');
    });
  });

  describe('validateRegistryChain', () => {
    it('should detect valid registry chains', () => {
      const service = new ScopedRegistryService();
      const parent = new ModuleRegistry();
      const child = service.createScopedRegistry(parent);
      const grandchild = service.createScopedRegistry(child);

      expect(service.validateRegistryChain(parent)).toBe(true);
      expect(service.validateRegistryChain(child)).toBe(true);
      expect(service.validateRegistryChain(grandchild)).toBe(true);
    });

    it('should handle registry without parent', () => {
      const service = new ScopedRegistryService();
      const standalone = new ModuleRegistry();

      expect(service.validateRegistryChain(standalone)).toBe(true);
    });
  });

  describe('debug logging', () => {
    it('should support debug logging when enabled', () => {
      const service = new ScopedRegistryService({ enableDebugLogging: true });
      const parentRegistry = new ModuleRegistry();

      // Should not throw with debug logging enabled
      expect(() => {
        const scopedRegistry = service.createScopedRegistry(parentRegistry);
        scopedRegistry.register(createTestModule('testModule'));
        scopedRegistry.lookup('testModule');
        scopedRegistry.clear();
      }).not.toThrow();
    });
  });
});
