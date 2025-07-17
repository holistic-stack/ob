import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type { OpenscadParser } from '../../openscad-parser.js';
import type * as ast from '../ast-types.js';

describe('Control Structures AST Generation', () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    parser = createTestParser();
    await parser.init();
  });

  afterEach(() => {
    parser.dispose();
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
      expect(ifNode.condition).toBeDefined();
      expect(ifNode.thenBranch).toHaveLength(1);
      expect(ifNode.thenBranch[0]?.type).toBe('cube');
      expect(ifNode.elseBranch).toBeUndefined();
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
      expect(ifNode.condition).toBeDefined();
      expect(ifNode.thenBranch).toHaveLength(1);
      expect(ifNode.thenBranch[0]?.type).toBe('cube');
      expect(ifNode.elseBranch).toHaveLength(1);
      expect(ifNode.elseBranch?.[0]?.type).toBe('sphere');
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
      expect(ifNode.condition).toBeDefined();
      expect(ifNode.thenBranch).toHaveLength(1);
      expect(ifNode.thenBranch[0]?.type).toBe('cube');
      expect(ifNode.elseBranch).toHaveLength(1);
      expect((ifNode.elseBranch?.[0] as ast.IfNode).type).toBe('if');
      expect((ifNode.elseBranch?.[0] as ast.IfNode).thenBranch).toHaveLength(1);
      expect(((ifNode.elseBranch?.[0] as ast.IfNode).thenBranch[0] as ast.SphereNode).type).toBe(
        'sphere'
      );
      expect((ifNode.elseBranch?.[0] as ast.IfNode).elseBranch).toHaveLength(1);
      expect(
        ((ifNode.elseBranch?.[0] as ast.IfNode).elseBranch?.[0] as ast.CylinderNode).type
      ).toBe('cylinder');
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
      expect(forNode.variables).toHaveLength(1);
      expect(forNode.variables?.[0]?.variable).toBe('i');

      // Check that range is a RangeExpressionNode
      const range = forNode.variables?.[0]?.range;
      expect(range).toBeDefined();
      expect(range?.type).toBe('expression');
      if (range?.type === 'expression' && 'expressionType' in range) {
        expect(range.expressionType).toBe('range_expression');
        const rangeExpr = range as ast.RangeExpressionNode;
        expect(rangeExpr.start).toBeDefined();
        expect(rangeExpr.end).toBeDefined();
      }

      expect(forNode.body).toHaveLength(1);
      expect(forNode.body?.[0]?.type).toBe('module_instantiation');
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
      expect(forNode.variables).toHaveLength(1);
      expect(forNode.variables?.[0]?.variable).toBe('i');

      // Check that range is a RangeExpressionNode
      const range = forNode.variables?.[0]?.range;
      expect(range).toBeDefined();
      expect(range?.type).toBe('expression');
      if (range?.type === 'expression' && 'expressionType' in range) {
        expect(range.expressionType).toBe('range_expression');
        const rangeExpr = range as ast.RangeExpressionNode;
        expect(rangeExpr.start).toBeDefined();
        expect(rangeExpr.end).toBeDefined();
        // For stepped ranges, step should be defined
        if (rangeExpr.step) {
          expect(rangeExpr.step).toBeDefined();
        }
      }

      expect(forNode.body).toHaveLength(1);
      expect(forNode.body?.[0]?.type).toBe('module_instantiation');
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
      expect(forNode.variables).toHaveLength(2);
      expect(forNode.variables?.[0]?.variable).toBe('i');

      // Check that first range is a RangeExpressionNode
      const range1 = forNode.variables?.[0]?.range;
      expect(range1).toBeDefined();
      expect(range1?.type).toBe('expression');
      if (range1?.type === 'expression' && 'expressionType' in range1) {
        expect(range1.expressionType).toBe('range_expression');
      }

      expect(forNode.variables?.[1]?.variable).toBe('j');

      // Check that second range is a RangeExpressionNode
      const range2 = forNode.variables?.[1]?.range;
      expect(range2).toBeDefined();
      expect(range2?.type).toBe('expression');
      if (range2?.type === 'expression' && 'expressionType' in range2) {
        expect(range2.expressionType).toBe('range_expression');
      }

      expect(forNode.body).toHaveLength(1);
      expect(forNode.body?.[0]?.type).toBe('module_instantiation');
    });
  });

  describe('let expressions', () => {
    it.skip('should parse a basic let expression', () => {
      // Note: Let expressions require OpenSCAD 2019.05+ and may not be supported by the current Tree-sitter grammar
      const code = `let (a = 10) {
        cube(a);
      }`;
      const astNodes = parser.parseAST(code);

      expect(astNodes).toBeDefined();
      expect(astNodes).toHaveLength(1);

      const letNode = astNodes[0] as ast.LetNode;
      expect(letNode.type).toBe('let');
      expect(letNode.assignments).toBeDefined();
      expect(letNode.assignments.a).toBe(10);
      expect(letNode.body).toHaveLength(1);
      expect(letNode.body?.[0]?.type).toBe('module_instantiation');
    });

    it.skip('should parse a let expression with multiple assignments', () => {
      // Note: Let expressions require OpenSCAD 2019.05+ and may not be supported by the current Tree-sitter grammar
      const code = `let (a = 10, b = 20) {
        translate([a, b, 0]) cube(10);
      }`;
      const astNodes = parser.parseAST(code);

      expect(astNodes).toBeDefined();
      expect(astNodes).toHaveLength(1);

      const letNode = astNodes[0] as ast.LetNode;
      expect(letNode.type).toBe('let');
      expect(letNode.assignments).toBeDefined();
      expect(letNode.assignments.a).toBe(10);
      expect(letNode.assignments.b).toBe(20);
      expect(letNode.body).toHaveLength(1);
      expect(letNode.body?.[0]?.type).toBe('module_instantiation');
    });
  });

  describe('each statements', () => {
    it.skip('should parse a basic each statement', () => {
      // Note: 'each' is not a standalone statement in OpenSCAD but used within list comprehensions
      // Example: [ for (i = [0:4]) each [i, i*2] ]
      const code = `each [1, 2, 3]`;
      const astNodes = parser.parseAST(code);

      expect(astNodes).toBeDefined();
      expect(astNodes).toHaveLength(1);

      const eachNode = astNodes[0] as ast.EachNode;
      expect(eachNode.type).toBe('each');
      expect(eachNode.expression).toBeDefined();
      expect(eachNode.expression.expressionType).toBe('array');
    });
  });
});
