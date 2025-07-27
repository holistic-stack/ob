import { beforeEach, describe, expect, it } from 'vitest';
import type {
  ASTNode,
  ModuleDefinitionNode,
  ModuleInstantiationNode,
} from '../../ast/ast-types.js';
import { ModuleRegistry } from '../module-registry/module-registry.js';
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
          location: { line: 1, column: 8 },
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
      };

      const moduleInstantiation: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'mycube',
        args: [],
        location: { line: 4, column: 1 },
      };

      const inputAST: ASTNode[] = [moduleDefinition, moduleInstantiation];

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.type).toBe('cube');
    });

    it('should handle multiple module instantiations', () => {
      const moduleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'mycube',
          location: { line: 1, column: 8 },
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
      };

      const instantiation1: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'mycube',
        args: [],
        location: { line: 4, column: 1 },
      };

      const instantiation2: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'mycube',
        args: [],
        location: { line: 5, column: 1 },
      };

      const inputAST: ASTNode[] = [moduleDefinition, instantiation1, instantiation2];

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]?.type).toBe('cube');
      expect(result.data?.[1]?.type).toBe('cube');
    });

    it('should handle modules with multiple body elements', () => {
      const moduleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'myshapes',
          location: { line: 1, column: 8 },
        },
        parameters: [],
        body: [
          {
            type: 'cube',
            size: 10,
            center: false,
            location: { line: 2, column: 3 },
          },
          {
            type: 'sphere',
            radius: 5,
            location: { line: 3, column: 3 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const moduleInstantiation: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'myshapes',
        args: [],
        location: { line: 5, column: 1 },
      };

      const inputAST: ASTNode[] = [moduleDefinition, moduleInstantiation];

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]?.type).toBe('cube');
      expect(result.data?.[1]?.type).toBe('sphere');
    });

    it('should return error for non-existent module', () => {
      const moduleInstantiation: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'nonexistent',
        args: [],
        location: { line: 1, column: 1 },
      };

      const inputAST: ASTNode[] = [moduleInstantiation];

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ModuleResolverErrorCode.MODULE_NOT_FOUND);
      expect(result.error?.moduleName).toBe('nonexistent');
    });

    it('should detect circular dependencies in recursive module calls', () => {
      const moduleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'recursive',
          location: { line: 1, column: 8 },
        },
        parameters: [],
        body: [
          {
            type: 'cube',
            size: 10,
            center: false,
            location: { line: 2, column: 3 },
          },
          {
            type: 'module_instantiation',
            name: 'recursive',
            args: [],
            location: { line: 3, column: 3 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const moduleInstantiation: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'recursive',
        args: [],
        location: { line: 6, column: 1 },
      };

      const inputAST: ASTNode[] = [moduleDefinition, moduleInstantiation];

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ModuleResolverErrorCode.CIRCULAR_DEPENDENCY);
    });

    it('should detect circular dependencies', () => {
      const moduleA: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'moduleA',
          location: { line: 1, column: 8 },
        },
        parameters: [],
        body: [
          {
            type: 'module_instantiation',
            name: 'moduleB',
            args: [],
            location: { line: 2, column: 3 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const moduleB: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'moduleB',
          location: { line: 4, column: 8 },
        },
        parameters: [],
        body: [
          {
            type: 'module_instantiation',
            name: 'moduleA',
            args: [],
            location: { line: 5, column: 3 },
          },
        ],
        location: { line: 4, column: 1 },
      };

      const moduleInstantiation: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'moduleA',
        args: [],
        location: { line: 8, column: 1 },
      };

      const inputAST: ASTNode[] = [moduleA, moduleB, moduleInstantiation];

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ModuleResolverErrorCode.CIRCULAR_DEPENDENCY);
    });

    it('should preserve non-module nodes', () => {
      const cubeNode = {
        type: 'cube',
        size: 10,
        center: false,
        location: { line: 1, column: 1 },
      };

      const sphereNode = {
        type: 'sphere',
        radius: 5,
        location: { line: 2, column: 1 },
      };

      const inputAST: ASTNode[] = [cubeNode, sphereNode];

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]?.type).toBe('cube');
      expect(result.data?.[1]?.type).toBe('sphere');
    });

    it('should handle invalid AST input', () => {
      const result = resolver.resolveAST(null as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ModuleResolverErrorCode.INVALID_AST);
    });
  });
});
