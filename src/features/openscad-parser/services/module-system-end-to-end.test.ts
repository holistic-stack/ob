import { describe, expect, it } from 'vitest';
import type { ASTNode, ModuleDefinitionNode, ModuleInstantiationNode } from '../ast/ast-types.js';
import { ModuleRegistry } from './module-registry/module-registry.js';
import { ModuleResolver } from './module-resolver/module-resolver.js';
import { createSourceLocation } from './test-utils.js';

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
          location: createSourceLocation(1, 8, 8, 1, 18, 18),
        },
        parameters: [],
        body: [
          {
            type: 'sphere',
            radius: 10,
            location: createSourceLocation(2, 3, 53, 2, 13, 63),
          },
        ],
        location: createSourceLocation(1, 1, 1, 1, 11, 11),
      };

      const moduleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'moduleName',
        args: [],
        location: createSourceLocation(4, 1, 151, 4, 11, 161),
      };

      const inputAST: ASTNode[] = [moduleDefinition, moduleCall];

      // Test the module system
      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      if (!result.success) return; // Type guard for TypeScript

      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.type).toBe('sphere');
      expect((result.data[0] as any)?.radius).toBe(10);
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
          location: createSourceLocation(1, 8, 8, 1, 18, 18),
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
                    location: createSourceLocation(4, 7, 157, 4, 17, 167),
                  },
                  {
                    type: 'sphere',
                    radius: 10,
                    location: createSourceLocation(5, 7, 207, 5, 17, 217),
                  },
                ],
                location: createSourceLocation(3, 5, 105, 3, 15, 115),
              },
            ],
            location: createSourceLocation(2, 3, 53, 2, 13, 63),
          },
          {
            type: 'intersection',
            children: [
              {
                type: 'cube',
                size: 15,
                center: true,
                location: createSourceLocation(9, 5, 405, 9, 15, 415),
              },
              {
                type: 'sphere',
                radius: 10,
                location: createSourceLocation(10, 5, 455, 10, 15, 465),
              },
            ],
            location: createSourceLocation(8, 3, 353, 8, 13, 363),
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
                    location: createSourceLocation(14, 7, 657, 14, 17, 667),
                  },
                  {
                    type: 'sphere',
                    radius: 10,
                    location: createSourceLocation(15, 7, 707, 15, 17, 717),
                  },
                ],
                location: createSourceLocation(13, 5, 605, 13, 15, 615),
              },
            ],
            location: createSourceLocation(12, 3, 553, 12, 13, 563),
          },
        ],
        location: createSourceLocation(1, 1, 1, 1, 11, 11),
      };

      const moduleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'moduleName',
        args: [],
        location: createSourceLocation(19, 1, 901, 19, 11, 911),
      };

      const inputAST: ASTNode[] = [moduleDefinition, moduleCall];

      // Test the module system
      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      if (!result.success) return; // Type guard for TypeScript

      expect(result.data).toHaveLength(3); // 2 translates + 1 intersection

      const nodeTypes = result.data.map((node) => node.type);
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

      const call1: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'mycube',
        args: [],
        location: createSourceLocation(4, 1, 151, 4, 11, 161),
      };

      const call2: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'mycube',
        args: [],
        location: createSourceLocation(5, 1, 201, 5, 11, 211),
      };

      const call3: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'mycube',
        args: [],
        location: createSourceLocation(6, 1, 251, 6, 11, 261),
      };

      const inputAST: ASTNode[] = [moduleDefinition, call1, call2, call3];

      // Test the module system
      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      if (!result.success) return; // Type guard for TypeScript

      expect(result.data).toHaveLength(3); // 3 cubes

      result.data.forEach((node) => {
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

      const doubleCube: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'doubleCube',
          location: createSourceLocation(5, 8, 208, 5, 18, 218),
        },
        parameters: [],
        body: [
          {
            type: 'module_instantiation',
            name: 'basicCube',
            args: [],
            location: createSourceLocation(6, 3, 253, 6, 13, 263),
          },
          {
            type: 'module_instantiation',
            name: 'basicCube',
            args: [],
            location: createSourceLocation(7, 3, 303, 7, 13, 313),
          },
        ],
        location: createSourceLocation(5, 1, 201, 5, 11, 211),
      };

      const moduleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'doubleCube',
        args: [],
        location: createSourceLocation(10, 1, 451, 10, 11, 461),
      };

      const inputAST: ASTNode[] = [basicCube, doubleCube, moduleCall];

      // Test the module system
      const registry = new ModuleRegistry();
      const resolver = new ModuleResolver(registry);

      const result = resolver.resolveAST(inputAST);

      expect(result.success).toBe(true);
      if (!result.success) return; // Type guard for TypeScript

      expect(result.data).toHaveLength(2); // 2 cubes from doubleCube

      result.data.forEach((node) => {
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
        location: createSourceLocation(1, 1, 1, 1, 11, 11),
      };

      const moduleDefinition: ModuleDefinitionNode = {
        type: 'module_definition',
        name: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'mycube',
          location: createSourceLocation(3, 8, 108, 3, 18, 118),
        },
        parameters: [],
        body: [
          {
            type: 'cube',
            size: 10,
            center: false,
            location: createSourceLocation(4, 3, 153, 4, 13, 163),
          },
        ],
        location: createSourceLocation(3, 1, 101, 3, 11, 111),
      };

      const directSphere = {
        type: 'sphere',
        radius: 3,
        location: createSourceLocation(6, 1, 251, 6, 11, 261),
      };

      const moduleCall: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'mycube',
        args: [],
        location: createSourceLocation(7, 1, 301, 7, 11, 311),
      };

      const directCylinder = {
        type: 'cylinder',
        h: 10,
        r: 2,
        location: createSourceLocation(8, 1, 351, 8, 11, 361),
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
      if (result.success) {
        expect(result.data).toHaveLength(4); // directCube + directSphere + resolved cube + directCylinder

        const nodeTypes = result.data.map((node) => node.type);
        expect(nodeTypes).toContain('cube');
        expect(nodeTypes).toContain('sphere');
        expect(nodeTypes).toContain('cylinder');

        // Should have 2 cubes (direct + from module)
        const cubeCount = nodeTypes.filter((type) => type === 'cube').length;
        expect(cubeCount).toBe(2);
      }
    });
  });
});
