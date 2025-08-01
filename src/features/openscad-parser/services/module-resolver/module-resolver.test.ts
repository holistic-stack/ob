import { beforeEach, describe, expect, it } from 'vitest';
import type {
  ASTNode,
  ModuleDefinitionNode,
  ModuleInstantiationNode,
} from '../../ast/ast-types.js';
import { ModuleRegistry } from '../module-registry/module-registry.js';
import { createSourceLocation } from '../test-utils.js';
import { ModuleResolver, ModuleResolverErrorCode } from './module-resolver.js';

describe('ModuleResolver', () => {
  let registry: ModuleRegistry;
  let resolver: ModuleResolver;

  beforeEach(() => {
    registry = new ModuleRegistry();
    resolver = new ModuleResolver(registry);
  });

  describe('resolveAST', () => {
    it('should resolve a simple module instantiation', () => {
      const moduleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'mycube',
          location: createSourceLocation(1, 8, 8, 1, 14, 6),
        },
        parameters: [],
        body: [
          {
            type: 'cube',
            size: 10,
            center: false,
            location: createSourceLocation(2, 3, 20, 2, 15, 12),
          },
        ],
        location: createSourceLocation(1, 1, 1, 3, 1, 30),
      };

      const moduleInstantiation: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'mycube',
        args: [],
        location: createSourceLocation(4, 1, 151, 4, 11, 161),
      };

      const inputAST: ASTNode[] = [moduleDefinition, moduleInstantiation];

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0]?.type).toBe('cube');
      }
    });

    it('should handle multiple module instantiations', () => {
      const moduleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'mycube',
          location: createSourceLocation(1, 8, 8, 1, 18, 18),
        },
        parameters: [],
        body: [
          {
            type: 'cube',
            size: 10,
            center: false,
            location: createSourceLocation(2, 3, 53, 2, 13, 63),
          },
        ],
        location: createSourceLocation(1, 1, 1, 1, 11, 11),
      };

      const instantiation1: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'mycube',
        args: [],
        location: createSourceLocation(4, 1, 151, 4, 11, 161),
      };

      const instantiation2: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'mycube',
        args: [],
        location: createSourceLocation(5, 1, 201, 5, 11, 211),
      };

      const inputAST: ASTNode[] = [moduleDefinition, instantiation1, instantiation2];

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data?.[0]?.type).toBe('cube');
        expect(result.data?.[1]?.type).toBe('cube');
      }
    });

    it('should handle modules with multiple body elements', () => {
      const moduleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'myshapes',
          location: createSourceLocation(1, 8, 8, 1, 18, 18),
        },
        parameters: [],
        body: [
          {
            type: 'cube',
            size: 10,
            center: false,
            location: createSourceLocation(2, 3, 53, 2, 13, 63),
          },
          {
            type: 'sphere',
            radius: 5,
            location: createSourceLocation(3, 3, 103, 3, 13, 113),
          },
        ],
        location: createSourceLocation(1, 1, 1, 1, 11, 11),
      };

      const moduleInstantiation: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'myshapes',
        args: [],
        location: createSourceLocation(5, 1, 201, 5, 11, 211),
      };

      const inputAST: ASTNode[] = [moduleDefinition, moduleInstantiation];

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data?.[0]?.type).toBe('cube');
        expect(result.data?.[1]?.type).toBe('sphere');
      }
    });

    it('should return error for non-existent module', () => {
      const moduleInstantiation: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'nonexistent',
        args: [],
        location: createSourceLocation(1, 1, 1, 1, 11, 11),
      };

      const inputAST: ASTNode[] = [moduleInstantiation];

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.code).toBe(ModuleResolverErrorCode.MODULE_NOT_FOUND);
        expect(result.error?.moduleName).toBe('nonexistent');
      }
    });

    it('should detect circular dependencies in recursive module calls', () => {
      const moduleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'recursive',
          location: createSourceLocation(1, 8, 8, 1, 18, 18),
        },
        parameters: [],
        body: [
          {
            type: 'cube',
            size: 10,
            center: false,
            location: createSourceLocation(2, 3, 53, 2, 13, 63),
          },
          {
            type: 'module_instantiation',
            name: 'recursive',
            args: [],
            location: createSourceLocation(3, 3, 103, 3, 13, 113),
          },
        ],
        location: createSourceLocation(1, 1, 1, 1, 11, 11),
      };

      const moduleInstantiation: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'recursive',
        args: [],
        location: createSourceLocation(6, 1, 251, 6, 11, 261),
      };

      const inputAST: ASTNode[] = [moduleDefinition, moduleInstantiation];

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.code).toBe(ModuleResolverErrorCode.CIRCULAR_DEPENDENCY);
      }
    });

    it('should detect circular dependencies', () => {
      const moduleA: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'moduleA',
          location: createSourceLocation(1, 8, 8, 1, 18, 18),
        },
        parameters: [],
        body: [
          {
            type: 'module_instantiation',
            name: 'moduleB',
            args: [],
            location: createSourceLocation(2, 3, 53, 2, 13, 63),
          },
        ],
        location: createSourceLocation(1, 1, 1, 1, 11, 11),
      };

      const moduleB: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'moduleB',
          location: createSourceLocation(4, 8, 158, 4, 18, 168),
        },
        parameters: [],
        body: [
          {
            type: 'module_instantiation',
            name: 'moduleA',
            args: [],
            location: createSourceLocation(5, 3, 203, 5, 13, 213),
          },
        ],
        location: createSourceLocation(4, 1, 151, 4, 11, 161),
      };

      const moduleInstantiation: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'moduleA',
        args: [],
        location: createSourceLocation(8, 1, 351, 8, 11, 361),
      };

      const inputAST: ASTNode[] = [moduleA, moduleB, moduleInstantiation];

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.code).toBe(ModuleResolverErrorCode.CIRCULAR_DEPENDENCY);
      }
    });

    it('should preserve non-module nodes', () => {
      const cubeNode = {
        type: 'cube',
        size: 10,
        center: false,
        location: createSourceLocation(1, 1, 1, 1, 11, 11),
      };

      const sphereNode = {
        type: 'sphere',
        radius: 5,
        location: createSourceLocation(2, 1, 51, 2, 11, 61),
      };

      const inputAST: ASTNode[] = [cubeNode, sphereNode];

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data?.[0]?.type).toBe('cube');
        expect(result.data?.[1]?.type).toBe('sphere');
      }
    });

    it('should handle invalid AST input', () => {
      const result = resolver.resolveAST(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.code).toBe(ModuleResolverErrorCode.INVALID_AST);
      }
    });
  });
});
