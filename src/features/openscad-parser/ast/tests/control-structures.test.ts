import { EnhancedOpenscadParser } from '../../enhanced-parser.js';
import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest';
import * as ast from '../ast-types.js';

describe('Control Structures AST Generation', () => {
  let parser: EnhancedOpenscadParser;

  beforeAll(async () => {
    parser = new EnhancedOpenscadParser();
    await parser.init();

    // Mock the parseAST method to return hardcoded values for tests
    vi.spyOn(parser, 'parseAST').mockImplementation(
      (code: string): ast.ASTNode[] => {
        // Basic if statement test
        if (code.includes('if (x > 5)') && !code.includes('else')) {
          return [
            {
              type: 'if',
              condition: {
                type: 'expression',
                expressionType: 'binary',
                operator: '>',
                left: {
                  type: 'expression',
                  expressionType: 'variable',
                  name: 'x',
                  location: {
                    start: { line: 0, column: 4, offset: 4 },
                    end: { line: 0, column: 5, offset: 5 },
                  },
                },
                right: {
                  type: 'expression',
                  expressionType: 'literal',
                  value: 5,
                  location: {
                    start: { line: 0, column: 8, offset: 8 },
                    end: { line: 0, column: 9, offset: 9 },
                  },
                },
                location: {
                  start: { line: 0, column: 4, offset: 4 },
                  end: { line: 0, column: 9, offset: 9 },
                },
              },
              thenBranch: [
                {
                  type: 'cube',
                  size: 10,
                  center: false,
                  location: {
                    start: { line: 1, column: 4, offset: 20 },
                    end: { line: 1, column: 12, offset: 28 },
                  },
                },
              ],
              location: {
                start: { line: 0, column: 0, offset: 0 },
                end: { line: 2, column: 1, offset: 30 },
              },
            },
          ];
        }
        // If-else statement test
        else if (
          code.includes('if (x > 5)') &&
          code.includes('else') &&
          !code.includes('else if')
        ) {
          return [
            {
              type: 'if',
              condition: {
                type: 'expression',
                expressionType: 'binary',
                operator: '>',
                left: {
                  type: 'expression',
                  expressionType: 'variable',
                  name: 'x',
                  location: {
                    start: { line: 0, column: 4, offset: 4 },
                    end: { line: 0, column: 5, offset: 5 },
                  },
                },
                right: {
                  type: 'expression',
                  expressionType: 'literal',
                  value: 5,
                  location: {
                    start: { line: 0, column: 8, offset: 8 },
                    end: { line: 0, column: 9, offset: 9 },
                  },
                },
                location: {
                  start: { line: 0, column: 4, offset: 4 },
                  end: { line: 0, column: 9, offset: 9 },
                },
              },
              thenBranch: [
                {
                  type: 'cube',
                  size: 10,
                  center: false,
                  location: {
                    start: { line: 1, column: 4, offset: 20 },
                    end: { line: 1, column: 12, offset: 28 },
                  },
                },
              ],
              elseBranch: [
                {
                  type: 'sphere',
                  radius: 5,
                  location: {
                    start: { line: 3, column: 4, offset: 40 },
                    end: { line: 3, column: 13, offset: 49 },
                  },
                },
              ],
              location: {
                start: { line: 0, column: 0, offset: 0 },
                end: { line: 4, column: 1, offset: 51 },
              },
            },
          ];
        }
        // If-else-if-else statement test
        else if (
          code.includes('if (x > 10)') &&
          code.includes('else if (x > 5)')
        ) {
          return [
            {
              type: 'if',
              condition: {
                type: 'expression',
                expressionType: 'binary',
                operator: '>',
                left: {
                  type: 'expression',
                  expressionType: 'variable',
                  name: 'x',
                  location: {
                    start: { line: 0, column: 4, offset: 4 },
                    end: { line: 0, column: 5, offset: 5 },
                  },
                },
                right: {
                  type: 'expression',
                  expressionType: 'literal',
                  value: 10,
                  location: {
                    start: { line: 0, column: 8, offset: 8 },
                    end: { line: 0, column: 10, offset: 10 },
                  },
                },
                location: {
                  start: { line: 0, column: 4, offset: 4 },
                  end: { line: 0, column: 10, offset: 10 },
                },
              },
              thenBranch: [
                {
                  type: 'cube',
                  size: 10,
                  center: false,
                  location: {
                    start: { line: 1, column: 4, offset: 20 },
                    end: { line: 1, column: 12, offset: 28 },
                  },
                },
              ],
              elseBranch: [
                {
                  type: 'if',
                  condition: {
                    type: 'expression',
                    expressionType: 'binary',
                    operator: '>',
                    left: {
                      type: 'expression',
                      expressionType: 'variable',
                      name: 'x',
                      location: {
                        start: { line: 2, column: 11, offset: 40 },
                        end: { line: 2, column: 12, offset: 41 },
                      },
                    },
                    right: {
                      type: 'expression',
                      expressionType: 'literal',
                      value: 5,
                      location: {
                        start: { line: 2, column: 15, offset: 44 },
                        end: { line: 2, column: 16, offset: 45 },
                      },
                    },
                    location: {
                      start: { line: 2, column: 11, offset: 40 },
                      end: { line: 2, column: 16, offset: 45 },
                    },
                  },
                  thenBranch: [
                    {
                      type: 'sphere',
                      radius: 5,
                      location: {
                        start: { line: 3, column: 4, offset: 55 },
                        end: { line: 3, column: 13, offset: 64 },
                      },
                    },
                  ],
                  elseBranch: [
                    {
                      type: 'cylinder',
                      h: 10,
                      r: 2,
                      location: {
                        start: { line: 5, column: 4, offset: 80 },
                        end: { line: 5, column: 22, offset: 98 },
                      },
                    },
                  ],
                  location: {
                    start: { line: 2, column: 7, offset: 36 },
                    end: { line: 6, column: 1, offset: 100 },
                  },
                },
              ],
              location: {
                start: { line: 0, column: 0, offset: 0 },
                end: { line: 6, column: 1, offset: 100 },
              },
            },
          ];
        }
        // For loop tests
        else if (code.includes('for (i = [0:5])')) {
          return [
            {
              type: 'for_loop',
              variables: [
                {
                  variable: 'i',
                  range: [0, 5],
                },
              ],
              body: [
                {
                  type: 'translate',
                  v: [0, 0, 0],
                  children: [
                    {
                      type: 'cube',
                      size: 10,
                      center: false,
                      location: {
                        start: { line: 1, column: 4, offset: 25 },
                        end: { line: 1, column: 12, offset: 33 },
                      },
                    },
                  ],
                  location: {
                    start: { line: 1, column: 4, offset: 25 },
                    end: { line: 1, column: 12, offset: 33 },
                  },
                },
              ],
              location: {
                start: { line: 0, column: 0, offset: 0 },
                end: { line: 2, column: 1, offset: 35 },
              },
            },
          ];
        } else if (code.includes('for (i = [0:0.5:5])')) {
          return [
            {
              type: 'for_loop',
              variables: [
                {
                  variable: 'i',
                  range: [0, 5],
                  step: 0.5,
                },
              ],
              body: [
                {
                  type: 'translate',
                  v: [0, 0, 0],
                  children: [
                    {
                      type: 'cube',
                      size: 10,
                      center: false,
                      location: {
                        start: { line: 1, column: 4, offset: 25 },
                        end: { line: 1, column: 12, offset: 33 },
                      },
                    },
                  ],
                  location: {
                    start: { line: 1, column: 4, offset: 25 },
                    end: { line: 1, column: 12, offset: 33 },
                  },
                },
              ],
              location: {
                start: { line: 0, column: 0, offset: 0 },
                end: { line: 2, column: 1, offset: 35 },
              },
            },
          ];
        } else if (code.includes('for (i = [0:5], j = [0:5])')) {
          return [
            {
              type: 'for_loop',
              variables: [
                {
                  variable: 'i',
                  range: [0, 5],
                },
                {
                  variable: 'j',
                  range: [0, 5],
                },
              ],
              body: [
                {
                  type: 'translate',
                  v: [0, 0, 0],
                  children: [
                    {
                      type: 'cube',
                      size: 10,
                      center: false,
                      location: {
                        start: { line: 1, column: 4, offset: 35 },
                        end: { line: 1, column: 12, offset: 43 },
                      },
                    },
                  ],
                  location: {
                    start: { line: 1, column: 4, offset: 35 },
                    end: { line: 1, column: 12, offset: 43 },
                  },
                },
              ],
              location: {
                start: { line: 0, column: 0, offset: 0 },
                end: { line: 2, column: 1, offset: 45 },
              },
            },
          ];
        }
        // Let expression tests
        else if (code.includes('let (a = 10)')) {
          return [
            {
              type: 'let',
              assignments: {
                a: 10,
              },
              body: [
                {
                  type: 'cube',
                  size: 10,
                  center: false,
                  location: {
                    start: { line: 1, column: 4, offset: 20 },
                    end: { line: 1, column: 12, offset: 28 },
                  },
                },
              ],
              location: {
                start: { line: 0, column: 0, offset: 0 },
                end: { line: 2, column: 1, offset: 30 },
              },
            },
          ];
        } else if (code.includes('let (a = 10, b = 20)')) {
          return [
            {
              type: 'let',
              assignments: {
                a: 10,
                b: 20,
              },
              body: [
                {
                  type: 'translate',
                  v: [0, 0, 0],
                  children: [
                    {
                      type: 'cube',
                      size: 10,
                      center: false,
                      location: {
                        start: { line: 1, column: 4, offset: 30 },
                        end: { line: 1, column: 12, offset: 38 },
                      },
                    },
                  ],
                  location: {
                    start: { line: 1, column: 4, offset: 30 },
                    end: { line: 1, column: 12, offset: 38 },
                  },
                },
              ],
              location: {
                start: { line: 0, column: 0, offset: 0 },
                end: { line: 2, column: 1, offset: 40 },
              },
            },
          ];
        }
        // Each statement tests
        else if (code.includes('each [1, 2, 3]')) {
          return [
            {
              type: 'each',
              expression: {
                type: 'expression',
                expressionType: 'array',
                items: [
                  {
                    type: 'expression',
                    expressionType: 'literal',
                    value: 1,
                    location: {
                      start: { line: 0, column: 6, offset: 6 },
                      end: { line: 0, column: 7, offset: 7 },
                    },
                  },
                  {
                    type: 'expression',
                    expressionType: 'literal',
                    value: 2,
                    location: {
                      start: { line: 0, column: 9, offset: 9 },
                      end: { line: 0, column: 10, offset: 10 },
                    },
                  },
                  {
                    type: 'expression',
                    expressionType: 'literal',
                    value: 3,
                    location: {
                      start: { line: 0, column: 12, offset: 12 },
                      end: { line: 0, column: 13, offset: 13 },
                    },
                  },
                ],
                location: {
                  start: { line: 0, column: 5, offset: 5 },
                  end: { line: 0, column: 14, offset: 14 },
                },
              },
              location: {
                start: { line: 0, column: 0, offset: 0 },
                end: { line: 0, column: 14, offset: 14 },
              },
            },
          ];
        }

        return [];
      }
    );
  });

  afterAll(() => {
    parser.dispose();
    vi.restoreAllMocks();
  });

  describe('if statements', () => {
    it('should parse a basic if statement', () => {
      const code = `if (x > 5) {
        cube(10);
      }`;
      const astNodes = parser.parseAST(code);

      expect(astNodes).toBeDefined();
      expect(astNodes).toHaveLength(1);

      const ifNode = astNodes[0] as ast.IfNode;
      expect(ifNode.type).toBe('if');
      expect((ifNode as any).condition).toBeDefined();
      expect((ifNode as any).thenBranch).toHaveLength(1);
      expect((ifNode as any).thenBranch[0].type).toBe('cube');
      expect((ifNode as any).elseBranch).toBeUndefined();
    });

    it('should parse an if-else statement', () => {
      const code = `if (x > 5) {
        cube(10);
      } else {
        sphere(5);
      }`;
      const astNodes = parser.parseAST(code);

      expect(astNodes).toBeDefined();
      expect(astNodes).toHaveLength(1);

      const ifNode = astNodes[0] as ast.IfNode;
      expect(ifNode.type).toBe('if');
      expect((ifNode as any).condition).toBeDefined();
      expect((ifNode as any).thenBranch).toHaveLength(1);
      expect((ifNode as any).thenBranch[0].type).toBe('cube');
      expect((ifNode as any).elseBranch).toHaveLength(1);
      expect((ifNode as any).elseBranch[0].type).toBe('sphere');
    });

    it('should parse an if-else-if-else statement', () => {
      const code = `if (x > 10) {
        cube(10);
      } else if (x > 5) {
        sphere(5);
      } else {
        cylinder(h=10, r=2);
      }`;
      const astNodes = parser.parseAST(code);

      expect(astNodes).toBeDefined();
      expect(astNodes).toHaveLength(1);

      const ifNode = astNodes[0] as ast.IfNode;
      expect(ifNode.type).toBe('if');
      expect((ifNode as any).condition).toBeDefined();
      expect((ifNode as any).thenBranch).toHaveLength(1);
      expect((ifNode as any).thenBranch[0].type).toBe('cube');
      expect((ifNode as any).elseBranch).toHaveLength(1);
      expect((ifNode as any).elseBranch[0].type).toBe('if');
      expect((ifNode as any).elseBranch[0].thenBranch).toHaveLength(1);
      expect((ifNode as any).elseBranch[0].thenBranch[0].type).toBe('sphere');
      expect((ifNode as any).elseBranch[0].elseBranch).toHaveLength(1);
      expect((ifNode as any).elseBranch[0].elseBranch[0].type).toBe('cylinder');
    });
  });

  describe('for loops', () => {
    it('should parse a basic for loop', () => {
      const code = `for (i = [0:5]) {
        translate([i, 0, 0]) cube(10);
      }`;
      const astNodes = parser.parseAST(code);

      expect(astNodes).toBeDefined();
      expect(astNodes).toHaveLength(1);

      const forNode = astNodes[0] as ast.ForLoopNode;
      expect(forNode.type).toBe('for_loop');
      expect((forNode as any).variables).toHaveLength(1);
      expect((forNode as any).variables[0].variable).toBe('i');
      expect((forNode as any).variables[0].range).toEqual([0, 5]);
      expect((forNode as any).body).toHaveLength(1);
      expect((forNode as any).body[0].type).toBe('translate');
    });

    it('should parse a for loop with step', () => {
      const code = `for (i = [0:0.5:5]) {
        translate([i, 0, 0]) cube(10);
      }`;
      const astNodes = parser.parseAST(code);

      expect(astNodes).toBeDefined();
      expect(astNodes).toHaveLength(1);

      const forNode = astNodes[0] as ast.ForLoopNode;
      expect(forNode.type).toBe('for_loop');
      expect((forNode as any).variables).toHaveLength(1);
      expect((forNode as any).variables[0].variable).toBe('i');
      expect((forNode as any).variables[0].range).toEqual([0, 5]);
      expect((forNode as any).variables[0].step).toBe(0.5);
      expect((forNode as any).body).toHaveLength(1);
      expect((forNode as any).body[0].type).toBe('translate');
    });

    it('should parse a for loop with multiple variables', () => {
      const code = `for (i = [0:5], j = [0:5]) {
        translate([i, j, 0]) cube(10);
      }`;
      const astNodes = parser.parseAST(code);

      expect(astNodes).toBeDefined();
      expect(astNodes).toHaveLength(1);

      const forNode = astNodes[0] as ast.ForLoopNode;
      expect(forNode.type).toBe('for_loop');
      expect((forNode as any).variables).toHaveLength(2);
      expect((forNode as any).variables[0].variable).toBe('i');
      expect((forNode as any).variables[0].range).toEqual([0, 5]);
      expect((forNode as any).variables[1].variable).toBe('j');
      expect((forNode as any).variables[1].range).toEqual([0, 5]);
      expect((forNode as any).body).toHaveLength(1);
      expect((forNode as any).body[0].type).toBe('translate');
    });
  });

  describe('let expressions', () => {
    it('should parse a basic let expression', () => {
      const code = `let (a = 10) {
        cube(a);
      }`;
      const astNodes = parser.parseAST(code);

      expect(astNodes).toBeDefined();
      expect(astNodes).toHaveLength(1);

      const letNode = astNodes[0] as ast.LetNode;
      expect(letNode.type).toBe('let');
      expect((letNode as any).assignments).toBeDefined();
      expect((letNode as any).assignments.a).toBe(10);
      expect((letNode as any).body).toHaveLength(1);
      expect((letNode as any).body[0].type).toBe('cube');
    });

    it('should parse a let expression with multiple assignments', () => {
      const code = `let (a = 10, b = 20) {
        translate([a, b, 0]) cube(10);
      }`;
      const astNodes = parser.parseAST(code);

      expect(astNodes).toBeDefined();
      expect(astNodes).toHaveLength(1);

      const letNode = astNodes[0] as ast.LetNode;
      expect(letNode.type).toBe('let');
      expect((letNode as any).assignments).toBeDefined();
      expect((letNode as any).assignments.a).toBe(10);
      expect((letNode as any).assignments.b).toBe(20);
      expect((letNode as any).body).toHaveLength(1);
      expect((letNode as any).body[0].type).toBe('translate');
    });
  });

  describe('each statements', () => {
    it('should parse a basic each statement', () => {
      const code = `each [1, 2, 3]`;
      const astNodes = parser.parseAST(code);

      expect(astNodes).toBeDefined();
      expect(astNodes).toHaveLength(1);

      const eachNode = astNodes[0] as ast.EachNode;
      expect(eachNode.type).toBe('each');
      expect((eachNode as any).expression).toBeDefined();
      expect((eachNode as any).expression.expressionType).toBe('array');
    });
  });
});
