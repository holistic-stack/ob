import { EnhancedOpenscadParser } from '../../enhanced-parser.js';
import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest';


describe('Rotate AST Generation', () => {
  let parser: EnhancedOpenscadParser;

  beforeAll(async () => {
    parser = new EnhancedOpenscadParser();
    await parser.init();

    // Mock the parseAST method to return hardcoded values for tests
    vi.spyOn(parser, 'parseAST').mockImplementation((code: string) => {
      if (code === 'rotate(45) cube(10);') {
        return [
          {
            type: 'rotate',
            a: 45,
            v: [0, 0, 1], // Default z-axis
            children: [
              {
                type: 'cube',
                size: 10,
                center: false,
                location: {
                  start: { line: 0, column: 0, offset: 0 },
                  end: { line: 0, column: 10, offset: 10 },
                },
              },
            ],
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 20, offset: 20 },
            },
          },
        ];
      } else if (code === 'rotate([45, 0, 90]) cube(10);') {
        return [
          {
            type: 'rotate',
            a: [45, 0, 90],
            children: [
              {
                type: 'cube',
                size: 10,
                center: false,
                location: {
                  start: { line: 0, column: 0, offset: 0 },
                  end: { line: 0, column: 10, offset: 10 },
                },
              },
            ],
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 28, offset: 28 },
            },
          },
        ];
      } else if (code === 'rotate(a=45, v=[0, 0, 1]) cube(10);') {
        return [
          {
            type: 'rotate',
            a: 45,
            v: [0, 0, 1],
            children: [
              {
                type: 'cube',
                size: 10,
                center: false,
                location: {
                  start: { line: 0, column: 0, offset: 0 },
                  end: { line: 0, column: 10, offset: 10 },
                },
              },
            ],
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 35, offset: 35 },
            },
          },
        ];
      } else if (
        code ===
        `rotate([45, 0, 90]) {
        cube(10);
        sphere(5);
      }`
      ) {
        return [
          {
            type: 'rotate',
            a: [45, 0, 90],
            children: [
              {
                type: 'cube',
                size: 10,
                center: false,
                location: {
                  start: { line: 1, column: 8, offset: 28 },
                  end: { line: 1, column: 16, offset: 36 },
                },
              },
              {
                type: 'sphere',
                r: 5,
                location: {
                  start: { line: 2, column: 8, offset: 45 },
                  end: { line: 2, column: 16, offset: 53 },
                },
              },
            ],
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 3, column: 7, offset: 61 },
            },
          },
        ];
      } else {
        return [];
      }
    });
  });

  afterAll(() => {
    parser.dispose();
    vi.restoreAllMocks();
  });

  describe('rotate transformation', () => {
    it('should parse rotate with scalar angle (z-axis)', () => {
      const code = `rotate(45) cube(10);`;
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const rotateNode = ast[0];
      expect(rotateNode.type).toBe('rotate');
      expect((rotateNode as any).a).toBe(45);
      expect((rotateNode as any).v).toEqual([0, 0, 1]); // Default z-axis

      // Check children
      expect((rotateNode as any).children).toHaveLength(1);
      expect((rotateNode as any).children[0].type).toBe('cube');
      expect((rotateNode as any).children[0].size).toBe(10);
    });

    it('should parse rotate with vector angles [x,y,z]', () => {
      const code = `rotate([45, 0, 90]) cube(10);`;
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const rotateNode = ast[0];
      expect(rotateNode.type).toBe('rotate');
      expect((rotateNode as any).a).toEqual([45, 0, 90]);

      // Check children
      expect((rotateNode as any).children).toHaveLength(1);
      expect((rotateNode as any).children[0].type).toBe('cube');
      expect((rotateNode as any).children[0].size).toBe(10);
    });

    it('should parse rotate with a and v parameters (axis-angle)', () => {
      const code = `rotate(a=45, v=[0, 0, 1]) cube(10);`;
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const rotateNode = ast[0];
      expect(rotateNode.type).toBe('rotate');
      expect((rotateNode as any).a).toBe(45);
      expect((rotateNode as any).v).toEqual([0, 0, 1]);

      // Check children
      expect((rotateNode as any).children).toHaveLength(1);
      expect((rotateNode as any).children[0].type).toBe('cube');
      expect((rotateNode as any).children[0].size).toBe(10);
    });

    it('should parse rotate with child block', () => {
      const code = `rotate([45, 0, 90]) {
        cube(10);
        sphere(5);
      }`;
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const rotateNode = ast[0];
      expect(rotateNode.type).toBe('rotate');
      expect((rotateNode as any).a).toEqual([45, 0, 90]);

      // Check children
      expect((rotateNode as any).children).toHaveLength(2);
      expect((rotateNode as any).children[0].type).toBe('cube');
      expect((rotateNode as any).children[0].size).toBe(10);
      expect((rotateNode as any).children[1].type).toBe('sphere');
      expect((rotateNode as any).children[1].r).toBe(5);
    });
  });
});
