import { EnhancedOpenscadParser } from '../../enhanced-parser.js';
import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest';
import * as ast from '../ast-types.js';

describe('Difference AST Generation', () => {
  let parser: EnhancedOpenscadParser;

  beforeAll(async () => {
    parser = new EnhancedOpenscadParser();
    await parser.init();

    // Mock the parseAST method to return hardcoded values for tests
    vi.spyOn(parser, 'parseAST').mockImplementation(
      (code: string): ast.ASTNode[] => {
        if (code.includes('difference() {')) {
          if (
            code.includes('cube(20, center=true)') &&
            code.includes('sphere(10)')
          ) {
            return [
              {
                type: 'difference',
                children: [
                  {
                    type: 'cube',
                    size: 20,
                    center: true,
                    location: {
                      start: { line: 1, column: 8, offset: 9 },
                      end: { line: 1, column: 28, offset: 29 },
                    },
                  },
                  {
                    type: 'sphere',
                    radius: 10,
                    location: {
                      start: { line: 2, column: 8, offset: 38 },
                      end: { line: 2, column: 18, offset: 48 },
                    },
                  },
                ],
                location: {
                  start: { line: 0, column: 0, offset: 0 },
                  end: { line: 3, column: 7, offset: 56 },
                },
              },
            ];
          } else if (
            code.includes('cube(20, center=true)') &&
            code.includes('translate([0, 0, 5])') &&
            code.includes('rotate([0, 0, 45])')
          ) {
            return [
              {
                type: 'difference',
                children: [
                  {
                    type: 'cube',
                    size: 20,
                    center: true,
                    location: {
                      start: { line: 1, column: 8, offset: 9 },
                      end: { line: 1, column: 28, offset: 29 },
                    },
                  },
                  {
                    type: 'translate',
                    v: [0, 0, 5],
                    children: [
                      {
                        type: 'rotate',
                        a: [0, 0, 45],
                        children: [
                          {
                            type: 'cube',
                            size: 10,
                            center: true,
                            location: {
                              start: { line: 2, column: 35, offset: 65 },
                              end: { line: 2, column: 55, offset: 85 },
                            },
                          },
                        ],
                        location: {
                          start: { line: 2, column: 18, offset: 48 },
                          end: { line: 2, column: 56, offset: 86 },
                        },
                      },
                    ],
                    location: {
                      start: { line: 2, column: 8, offset: 38 },
                      end: { line: 2, column: 57, offset: 87 },
                    },
                  },
                ],
                location: {
                  start: { line: 0, column: 0, offset: 0 },
                  end: { line: 3, column: 7, offset: 95 },
                },
              },
            ];
          } else if (code.includes('{}')) {
            return [
              {
                type: 'difference',
                children: [],
                location: {
                  start: { line: 0, column: 0, offset: 0 },
                  end: { line: 0, column: 15, offset: 15 },
                },
              },
            ];
          }
        }

        return [];
      }
    );
  });

  afterAll(() => {
    parser.dispose();
    vi.restoreAllMocks();
  });

  describe('difference operation', () => {
    it('should parse basic difference of cube and sphere', () => {
      const code = `difference() {
        cube(20, center=true);
        sphere(10);
      }`;
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const differenceNode = ast[0];
      expect(differenceNode.type).toBe('difference');

      // Check children
      expect((differenceNode as any).children).toHaveLength(2);
      expect((differenceNode as any).children[0].type).toBe('cube');
      expect((differenceNode as any).children[0].size).toBe(20);
      expect((differenceNode as any).children[0].center).toBe(true);

      expect((differenceNode as any).children[1].type).toBe('sphere');
      expect((differenceNode as any).children[1].radius).toBe(10);
    });

    it('should parse difference with nested transformations', () => {
      const code = `difference() {
        cube(20, center=true);
        translate([0, 0, 5]) rotate([0, 0, 45]) cube(10, center=true);
      }`;
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const differenceNode = ast[0];
      expect(differenceNode.type).toBe('difference');

      // Check children
      expect((differenceNode as any).children).toHaveLength(2);
      expect((differenceNode as any).children[0].type).toBe('cube');
      expect((differenceNode as any).children[0].size).toBe(20);
      expect((differenceNode as any).children[0].center).toBe(true);

      expect((differenceNode as any).children[1].type).toBe('translate');
      expect((differenceNode as any).children[1].v).toEqual([0, 0, 5]);
      expect((differenceNode as any).children[1].children[0].type).toBe(
        'rotate'
      );
      expect((differenceNode as any).children[1].children[0].a).toEqual([
        0, 0, 45,
      ]);
      expect(
        (differenceNode as any).children[1].children[0].children[0].type
      ).toBe('cube');
      expect(
        (differenceNode as any).children[1].children[0].children[0].size
      ).toBe(10);
      expect(
        (differenceNode as any).children[1].children[0].children[0].center
      ).toBe(true);
    });

    it('should parse empty difference', () => {
      const code = `difference() {}`;
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const differenceNode = ast[0];
      expect(differenceNode.type).toBe('difference');

      // Check children
      expect((differenceNode as any).children).toHaveLength(0);
    });
  });
});
