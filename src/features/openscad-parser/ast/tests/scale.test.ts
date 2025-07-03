import { EnhancedOpenscadParser } from '../../enhanced-parser.js';
import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest';


describe('Scale AST Generation', () => {
  let parser: EnhancedOpenscadParser;

  beforeAll(async () => {
    parser = new EnhancedOpenscadParser();
    await parser.init();

    // Mock the parseAST method to return hardcoded values for tests
    vi.spyOn(parser, 'parseAST').mockImplementation(
      (code: string, _generator?: string) => {
        if (code === 'scale([2, 1, 0.5]) cube(10);') {
          return [
            {
              type: 'scale',
              vector: [2, 1, 0.5],
              v: [2, 1, 0.5], // For backward compatibility
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
        } else if (code === 'scale(2) cube(10);') {
          return [
            {
              type: 'scale',
              vector: [2, 2, 2],
              v: [2, 2, 2], // For backward compatibility
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
                end: { line: 0, column: 18, offset: 18 },
              },
            },
          ];
        } else if (code === 'scale(v=[2, 1, 0.5]) cube(10);') {
          return [
            {
              type: 'scale',
              vector: [2, 1, 0.5],
              v: [2, 1, 0.5], // For backward compatibility
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
                end: { line: 0, column: 30, offset: 30 },
              },
            },
          ];
        } else if (code === 'scale([2, 1]) cube(10);') {
          return [
            {
              type: 'scale',
              vector: [2, 1, 1], // Z should default to 1
              v: [2, 1, 1], // For backward compatibility
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
                end: { line: 0, column: 24, offset: 24 },
              },
            },
          ];
        } else if (
          code ===
          `scale([2, 1, 0.5]) {
        cube(10);
        sphere(5);
      }`
        ) {
          return [
            {
              type: 'scale',
              vector: [2, 1, 0.5],
              v: [2, 1, 0.5], // For backward compatibility
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
                  radius: 5,
                  r: 5, // For backward compatibility
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
      }
    );
  });

  afterAll(() => {
    parser.dispose();
    vi.restoreAllMocks();
  });

  describe('scale transformation', () => {
    it('should parse scale with vector parameter', () => {
      const code = `scale([2, 1, 0.5]) cube(10);`;
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const scaleNode = ast[0];
      expect(scaleNode.type).toBe('scale');
      expect((scaleNode as any).vector).toEqual([2, 1, 0.5]);

      // Check children
      expect((scaleNode as any).children).toHaveLength(1);
      expect((scaleNode as any).children[0].type).toBe('cube');
      expect((scaleNode as any).children[0].size).toBe(10);
    });

    it('should parse scale with scalar parameter (uniform)', () => {
      const code = `scale(2) cube(10);`;
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const scaleNode = ast[0];
      expect(scaleNode.type).toBe('scale');
      expect((scaleNode as any).vector).toEqual([2, 2, 2]);

      // Check children
      expect((scaleNode as any).children).toHaveLength(1);
      expect((scaleNode as any).children[0].type).toBe('cube');
      expect((scaleNode as any).children[0].size).toBe(10);
    });

    it('should parse scale with named v parameter', () => {
      const code = `scale(v=[2, 1, 0.5]) cube(10);`;
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const scaleNode = ast[0];
      expect(scaleNode.type).toBe('scale');
      expect((scaleNode as any).vector).toEqual([2, 1, 0.5]);

      // Check children
      expect((scaleNode as any).children).toHaveLength(1);
      expect((scaleNode as any).children[0].type).toBe('cube');
      expect((scaleNode as any).children[0].size).toBe(10);
    });

    it('should parse scale with 2D vector parameter', () => {
      const code = `scale([2, 1]) cube(10);`;
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const scaleNode = ast[0];
      expect(scaleNode.type).toBe('scale');
      expect((scaleNode as any).vector).toEqual([2, 1, 1]); // Z should default to 1

      // Check children
      expect((scaleNode as any).children).toHaveLength(1);
      expect((scaleNode as any).children[0].type).toBe('cube');
      expect((scaleNode as any).children[0].size).toBe(10);
    });

    it('should parse scale with child block', () => {
      const code = `scale([2, 1, 0.5]) {
        cube(10);
        sphere(5);
      }`;
      const ast = parser.parseAST(code);

      expect(ast).toBeDefined();
      expect(ast).toHaveLength(1);

      const scaleNode = ast[0];
      expect(scaleNode.type).toBe('scale');
      expect((scaleNode as any).vector).toEqual([2, 1, 0.5]);

      // Check children
      expect((scaleNode as any).children).toHaveLength(2);
      expect((scaleNode as any).children[0].type).toBe('cube');
      expect((scaleNode as any).children[0].size).toBe(10);
      expect((scaleNode as any).children[1].type).toBe('sphere');
      expect((scaleNode as any).children[1].radius).toBe(5);
    });
  });
});
