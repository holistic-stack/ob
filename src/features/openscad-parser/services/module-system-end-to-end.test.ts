import { describe, expect, it } from 'vitest';
import type { ASTNode, ModuleDefinitionNode, ModuleInstantiationNode } from '../ast/ast-types.js';
import { ModuleRegistry } from './module-registry/module-registry.js';
import { ModuleResolver } from './module-resolver/module-resolver.js';

describe('Module System End-to-End', () => {
  describe('User Example 1: Simple module with sphere', () => {
    it('should resolve module definition and call correctly', () => {
      // Simulate the AST that would be generated from:
      // module moduleName() {
      //   sphere(10);
      // }
      // moduleName();

      const moduleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'moduleName',
          location: { line: 1, column: 8 },
        },
        parameters: [],
        body: [
          {
            type: 'sphere',
            radius: 10,
            location: { line: 2, column: 3 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const moduleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'moduleName',
        args: [],
        location: { line: 4, column: 1 },
      };

      const inputAST: ASTNode[] = [moduleDefinition, moduleCall];

      // Test the module system
      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.type).toBe('sphere');
      expect((result.data?.[0] as any)?.radius).toBe(10);
    });
  });

  describe('User Example 2: Complex module with CSG operations', () => {
    it('should resolve complex module with multiple operations', () => {
      // Simulate the AST that would be generated from:
      // module moduleName() {
      //   translate([-24,0,0]) {
      //     union() {
      //       cube(15, center=true);
      //       sphere(10);
      //     }
      //   }
      //   intersection() {
      //     cube(15, center=true);
      //     sphere(10);
      //   }
      //   translate([24,0,0]) {
      //     difference() {
      //       cube(15, center=true);
      //       sphere(10);
      //     }
      //   }
      // }
      // moduleName();

      const moduleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'moduleName',
          location: { line: 1, column: 8 },
        },
        parameters: [],
        body: [
          {
            type: 'translate',
            v: [-24, 0, 0],
            children: [
              {
                type: 'union',
                children: [
                  {
                    type: 'cube',
                    size: 15,
                    center: true,
                    location: { line: 4, column: 7 },
                  },
                  {
                    type: 'sphere',
                    radius: 10,
                    location: { line: 5, column: 7 },
                  },
                ],
                location: { line: 3, column: 5 },
              },
            ],
            location: { line: 2, column: 3 },
          },
          {
            type: 'intersection',
            children: [
              {
                type: 'cube',
                size: 15,
                center: true,
                location: { line: 9, column: 5 },
              },
              {
                type: 'sphere',
                radius: 10,
                location: { line: 10, column: 5 },
              },
            ],
            location: { line: 8, column: 3 },
          },
          {
            type: 'translate',
            v: [24, 0, 0],
            children: [
              {
                type: 'difference',
                children: [
                  {
                    type: 'cube',
                    size: 15,
                    center: true,
                    location: { line: 14, column: 7 },
                  },
                  {
                    type: 'sphere',
                    radius: 10,
                    location: { line: 15, column: 7 },
                  },
                ],
                location: { line: 13, column: 5 },
              },
            ],
            location: { line: 12, column: 3 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const moduleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'moduleName',
        args: [],
        location: { line: 19, column: 1 },
      };

      const inputAST: ASTNode[] = [moduleDefinition, moduleCall];

      // Test the module system
      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3); // 2 translates + 1 intersection

      const nodeTypes = result.data?.map((node) => node.type) || [];
      expect(nodeTypes.filter((type) => type === 'translate')).toHaveLength(2);
      expect(nodeTypes.filter((type) => type === 'intersection')).toHaveLength(1);
    });
  });

  describe('Multiple module calls', () => {
    it('should handle multiple calls to the same module', () => {
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

      const call1: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'mycube',
        args: [],
        location: { line: 4, column: 1 },
      };

      const call2: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'mycube',
        args: [],
        location: { line: 5, column: 1 },
      };

      const call3: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'mycube',
        args: [],
        location: { line: 6, column: 1 },
      };

      const inputAST: ASTNode[] = [moduleDefinition, call1, call2, call3];

      // Test the module system
      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3); // 3 cubes

      result.data?.forEach((node) => {
        expect(node.type).toBe('cube');
      });
    });
  });

  describe('Nested module calls', () => {
    it('should handle modules calling other modules', () => {
      const basicCube: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'basicCube',
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

      const doubleCube: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'doubleCube',
          location: { line: 5, column: 8 },
        },
        parameters: [],
        body: [
          {
            type: 'module_instantiation',
            name: 'basicCube',
            args: [],
            location: { line: 6, column: 3 },
          },
          {
            type: 'module_instantiation',
            name: 'basicCube',
            args: [],
            location: { line: 7, column: 3 },
          },
        ],
        location: { line: 5, column: 1 },
      };

      const moduleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'doubleCube',
        args: [],
        location: { line: 10, column: 1 },
      };

      const inputAST: ASTNode[] = [basicCube, doubleCube, moduleCall];

      // Test the module system
      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2); // 2 cubes from doubleCube

      result.data?.forEach((node) => {
        expect(node.type).toBe('cube');
      });
    });
  });

  describe('Mixed content', () => {
    it('should preserve non-module statements while resolving modules', () => {
      const directCube = {
        type: 'cube',
        size: 5,
        center: false,
        location: { line: 1, column: 1 },
      };

      const moduleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'mycube',
          location: { line: 3, column: 8 },
        },
        parameters: [],
        body: [
          {
            type: 'cube',
            size: 10,
            center: false,
            location: { line: 4, column: 3 },
          },
        ],
        location: { line: 3, column: 1 },
      };

      const directSphere = {
        type: 'sphere',
        radius: 3,
        location: { line: 6, column: 1 },
      };

      const moduleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'mycube',
        args: [],
        location: { line: 7, column: 1 },
      };

      const directCylinder = {
        type: 'cylinder',
        h: 10,
        r: 2,
        location: { line: 8, column: 1 },
      };

      const inputAST: ASTNode[] = [
        directCube,
        moduleDefinition,
        directSphere,
        moduleCall,
        directCylinder,
      ];

      // Test the module system
      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(4); // directCube + directSphere + resolved cube + directCylinder

      const nodeTypes = result.data?.map((node) => node.type) || [];
      expect(nodeTypes).toContain('cube');
      expect(nodeTypes).toContain('sphere');
      expect(nodeTypes).toContain('cylinder');

      // Should have 2 cubes (direct + from module)
      const cubeCount = nodeTypes.filter((type) => type === 'cube').length;
      expect(cubeCount).toBe(2);
    });
  });
});
