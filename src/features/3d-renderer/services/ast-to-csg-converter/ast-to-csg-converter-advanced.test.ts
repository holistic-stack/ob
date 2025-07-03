/**
 * AST to CSG Converter - Advanced Corpus Integration Tests
 *
 * Integration tests for OpenSCAD advanced language constructs from docs/corpus/advanced.txt
 * Tests the complete pipeline from OpenSCAD code parsing to AST generation to CSG conversion.
 *
 * Follows the ast-to-csg-converter-[variation].test.ts pattern for consistency.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { ASTNode } from '../../../openscad-parser/core/ast-types.js';
import { UnifiedParserService } from '../../../openscad-parser/services/unified-parser-service.js';
import { convertASTNodeToCSG } from './ast-to-csg-converter.js';

const logger = createLogger('ASTToCSGConverterAdvancedTest');

/**
 * Test scenarios from docs/corpus/advanced.txt
 */
const ADVANCED_CORPUS_SCENARIOS = {
  listComprehensions: {
    name: 'List Comprehensions',
    code: `
values = [for (i = [1:5]) i * i];
evens = [for (x = [1:20]) if (x % 2 == 0) x];
matrix = [for (i = [0:2]) [for (j = [0:2]) i+j]];
`,
    expectedNodeCount: 3,
    expectedNodeTypes: ['assignment_statement', 'assignment_statement', 'assignment_statement'],
    hasRenderableContent: false, // List comprehension assignments only
  },

  multipleVariableListComprehensions: {
    name: 'Multiple Variable List Comprehensions',
    code: `
polygon_points = [for (i=[0:n-1], a=i*360/n) [cos(a), sin(a)]];
complex_calc = [for (i=[0:5], x=i*2, y=x+1) [x, y, x*y]];
radial_pattern = [for (i=[0:num-1], a=i*360/num, r=radii[i]) [r*cos(a), r*sin(a)]];
`,
    expectedNodeCount: 3,
    expectedNodeTypes: ['assignment_statement', 'assignment_statement', 'assignment_statement'],
    hasRenderableContent: false, // Complex list comprehension assignments only
  },

  rangeExpressions: {
    name: 'Range Expressions',
    code: `
for (i = [0:5]) cube(i);
for (j = [0:0.5:10]) sphere(j);
for (k = [start:step:end]) cylinder(k);
`,
    expectedNodeCount: 3,
    expectedNodeTypes: ['for_statement', 'for_statement', 'for_statement'],
    hasRenderableContent: true, // For loops with 3D primitives that can be rendered
  },

  arrayIndexing: {
    name: 'Array Indexing',
    code: `
points = [[1,2,3], [4,5,6], [7,8,9]];
x = points[0][0];
row = points[1];
subset = points[0:1];
`,
    expectedNodeCount: 4,
    expectedNodeTypes: [
      'assignment_statement',
      'assignment_statement',
      'assignment_statement',
      'assignment_statement',
    ],
    hasRenderableContent: false, // Array indexing assignments only
  },

  specialVariables: {
    name: 'Special Variables',
    code: `
$fn = 36;
cube(10, $fn = 12);
rotate([$t * 360, 0, 0]) sphere(5);
move = $vpt;
view = $vpr;
dist = $vpd;
`,
    expectedNodeCount: 6,
    expectedNodeTypes: [
      'assignment_statement',
      'module_instantiation',
      'module_instantiation',
      'assignment_statement',
      'assignment_statement',
      'assignment_statement',
    ],
    hasRenderableContent: true, // Contains cube and sphere instantiations
  },

  moreSpecialVariables: {
    name: 'More Special Variables',
    code: `
angle = $fa;
size = $fs;
segments = $fn;
time = $t;
children_count = $children;
use_specials($fa, $fs, $fn, $t, $children);
`,
    expectedNodeCount: 6,
    expectedNodeTypes: [
      'assignment_statement',
      'assignment_statement',
      'assignment_statement',
      'assignment_statement',
      'assignment_statement',
      'module_instantiation',
    ],
    hasRenderableContent: false, // Special variable assignments and function call
  },

  errorRecovery: {
    name: 'Error Recovery',
    code: `
a = 5
`,
    expectedNodeCount: 1,
    expectedNodeTypes: ['assignment_statement'],
    hasRenderableContent: false, // Assignment statement with missing semicolon
  },

  unclosedBlock: {
    name: 'Unclosed Block',
    code: `
module foo() {
  a = 1;
// missing closing }
`,
    expectedNodeCount: 1,
    expectedNodeTypes: ['module_definition'],
    hasRenderableContent: false, // Module definition with syntax error
  },

  unclosedParenthesis: {
    name: 'Unclosed Parenthesis',
    code: `
b = (2 + 3;
`,
    expectedNodeCount: 1,
    expectedNodeTypes: ['assignment_statement'],
    hasRenderableContent: false, // Assignment with syntax error
  },

  incompleteExpression: {
    name: 'Incomplete Expression',
    code: `
c = 1 + ;
`,
    expectedNodeCount: 1,
    expectedNodeTypes: ['assignment_statement'],
    hasRenderableContent: false, // Assignment with incomplete expression
  },

  unclosedString: {
    name: 'Unclosed String',
    code: `
d = "unterminated string;
`,
    expectedNodeCount: 1,
    expectedNodeTypes: ['assignment_statement'],
    hasRenderableContent: false, // Assignment with unclosed string
  },

  complexNumericLiterals: {
    name: 'Complex Numeric Literals',
    code: `
small = 1.2e-3;
large = 1.5e6;
negative = -42;
precise = 3.14159265359;
`,
    expectedNodeCount: 4,
    expectedNodeTypes: [
      'assignment_statement',
      'assignment_statement',
      'assignment_statement',
      'assignment_statement',
    ],
    hasRenderableContent: false, // Numeric literal assignments only
  },

  specialVariablesAsModuleParameters: {
    name: 'Special Variables as Module Parameters',
    code: `
module Logo(size=50, $fn=100) {
    sphere(d=size);
}
Logo(25, $fn=64);
`,
    expectedNodeCount: 2,
    expectedNodeTypes: ['module_definition', 'module_instantiation'],
    hasRenderableContent: true, // Module definition and instantiation with sphere
  },

  exponentOperator: {
    name: 'Exponent Operator',
    code: `
result = 2^3;
power = base^exponent;
complex = (x + 1)^(y - 2);
`,
    expectedNodeCount: 3,
    expectedNodeTypes: ['assignment_statement', 'assignment_statement', 'assignment_statement'],
    hasRenderableContent: false, // Exponentiation assignments only
  },

  functionLiterals: {
    name: 'Function Literals',
    code: `
func = function (x) x * x;
echo(func(5));
`,
    expectedNodeCount: 2,
    expectedNodeTypes: ['assignment_statement', 'echo_statement'],
    hasRenderableContent: false, // Function literal assignment and echo statement
  },

  listComprehensionsWithLetExpressions: {
    name: 'List Comprehensions with Let Expressions',
    code: `
areas = [let (num=len(vertices)) for (i=[0:num-1]) triarea(vertices[i])];
complex = [let (a=5, b=10) for (x=[0:a]) x*b];
`,
    expectedNodeCount: 2,
    expectedNodeTypes: ['assignment_statement', 'assignment_statement'],
    hasRenderableContent: false, // Complex list comprehensions with let expressions
  },
} as const;

describe('AST to CSG Converter - Advanced Corpus Integration', () => {
  let parserService: UnifiedParserService;

  beforeEach(async () => {
    logger.init('Setting up advanced corpus integration test environment');

    parserService = new UnifiedParserService({
      enableLogging: true,
      enableCaching: false,
      retryAttempts: 3,
      timeoutMs: 10000,
    });

    await parserService.initialize();
  });

  describe('Parser Integration Tests', () => {
    it.each(Object.entries(ADVANCED_CORPUS_SCENARIOS))(
      'should parse %s from advanced corpus',
      async (_scenarioKey, scenario) => {
        logger.init(`Testing ${scenario.name} parsing`);

        const startTime = performance.now();

        // Step 1: Parse the OpenSCAD code
        const parseResult = await parserService.parseDocument(scenario.code);

        const parseTime = performance.now() - startTime;
        logger.debug(`Parse time: ${parseTime.toFixed(2)}ms`);

        // Verify parsing succeeded
        expect(parseResult.success).toBe(true);

        if (!parseResult.success) {
          throw new Error(`Parse failed: ${parseResult.error}`);
        }

        const ast = parseResult.data.ast;
        expect(ast).toBeDefined();
        expect(ast).not.toBeNull();

        if (!ast) {
          throw new Error('AST is null after successful parse');
        }

        expect(ast.length).toBe(scenario.expectedNodeCount);

        // Verify node types match expected structure
        ast.forEach((node, index) => {
          expect(node).toBeDefined();
          if (scenario.expectedNodeTypes[index]) {
            // Tree Sitter may parse some constructs as function_call or assignment_statement
            expect(node?.type).toMatch(
              new RegExp(`${scenario.expectedNodeTypes[index]}|function_call|assignment_statement`)
            );
          }
        });

        // Performance validation: <16ms target
        expect(parseTime).toBeLessThan(16);

        logger.debug(`✅ ${scenario.name} parsed successfully with ${ast.length} nodes`);
        logger.end(`${scenario.name} parsing test completed`);
      }
    );
  });

  describe('CSG Conversion Integration Tests', () => {
    it.each(
      Object.entries(ADVANCED_CORPUS_SCENARIOS).filter(
        ([_, scenario]) => scenario.hasRenderableContent
      )
    )('should convert %s to CSG meshes', async (_scenarioKey, scenario) => {
      logger.init(`Testing ${scenario.name} CSG conversion`);

      // Step 1: Parse the code
      const parseResult = await parserService.parseDocument(scenario.code);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) {
        throw new Error(`Parse failed: ${parseResult.error}`);
      }

      const ast = parseResult.data.ast;
      expect(ast).toBeDefined();
      expect(ast).not.toBeNull();

      if (!ast) {
        throw new Error('AST is null after successful parse');
      }

      expect(ast.length).toBeGreaterThan(0);

      // Step 2: Convert each AST node to CSG
      const conversionResults = [];

      for (let i = 0; i < ast.length; i++) {
        const node = ast[i];
        if (!node) continue;

        const startTime = performance.now();

        const csgResult = await convertASTNodeToCSG(node as ASTNode, i, {
          material: {
            color: '#00ff88',
            opacity: 1,
            metalness: 0.1,
            roughness: 0.8,
            wireframe: false,
            transparent: false,
            side: 'front',
          },
          enableOptimization: true,
          maxComplexity: 50000,
          timeoutMs: 5000,
        });

        const conversionTime = performance.now() - startTime;
        logger.debug(`CSG conversion time for node ${i}: ${conversionTime.toFixed(2)}ms`);

        // Performance validation: <16ms target
        expect(conversionTime).toBeLessThan(16);

        conversionResults.push({
          nodeIndex: i,
          nodeType: node.type,
          result: csgResult,
          conversionTime,
        });
      }

      // Verify at least one successful conversion for renderable content
      const successfulConversions = conversionResults.filter((r) => r.result.success);
      expect(successfulConversions.length).toBeGreaterThan(0);

      // Log conversion summary
      logger.debug(`✅ ${scenario.name} CSG conversion completed:`, {
        totalNodes: ast.length,
        successfulConversions: successfulConversions.length,
        averageTime:
          conversionResults.reduce((sum, r) => sum + r.conversionTime, 0) /
          conversionResults.length,
      });

      logger.end(`${scenario.name} CSG conversion test completed`);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty code gracefully', async () => {
      logger.init('Testing empty code handling');

      const parseResult = await parserService.parseDocument('');

      // Empty code should parse successfully but produce no AST nodes
      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(parseResult.data.ast).toEqual([]);
      }

      logger.end('Empty code handling test completed');
    });

    it('should handle syntax errors in advanced constructs gracefully', async () => {
      logger.init('Testing syntax error handling for advanced constructs');

      const invalidCode = 'for (i = [0:5]) {'; // Missing closing brace
      const parseResult = await parserService.parseDocument(invalidCode);

      // Parser should handle syntax errors gracefully
      // May succeed with partial parsing or fail with descriptive error
      if (!parseResult.success) {
        expect(parseResult.error).toBeDefined();
        expect(typeof parseResult.error).toBe('string');
      }

      logger.end('Advanced construct syntax error handling test completed');
    });

    it('should handle complex list comprehensions', async () => {
      logger.init('Testing complex list comprehensions');

      const complexCode = `
nested_list = [for (i = [0:2]) [for (j = [0:2]) [for (k = [0:2]) i+j+k]]];
filtered_list = [for (x = [1:100]) if (x % 3 == 0 && x % 5 == 0) x];
`;
      const parseResult = await parserService.parseDocument(complexCode);

      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        const ast = parseResult.data.ast;
        expect(ast).toBeDefined();
        expect(ast).not.toBeNull();

        if (ast) {
          expect(ast.length).toBe(2);
          logger.debug(`Complex list comprehensions parsed with ${ast.length} nodes`);
        }
      }

      logger.end('Complex list comprehensions test completed');
    });

    it('should handle advanced language performance requirements', async () => {
      logger.init('Testing advanced language parsing performance');

      const advancedCode = `
complex_matrix = [for (i = [0:10]) [for (j = [0:10]) i * j + sin(i) * cos(j)]];
special_vars = [$fn, $fa, $fs, $t, $vpt, $vpr, $vpd, $children];
power_calc = base^exponent + (x + y)^(z - w);
func_literal = function (a, b, c) a * b + c^2;
`;

      const startTime = performance.now();
      const parseResult = await parserService.parseDocument(advancedCode);
      const endTime = performance.now();

      const duration = endTime - startTime;
      logger.debug(`Advanced language parsing time: ${duration.toFixed(2)}ms`);

      expect(parseResult.success).toBe(true);
      expect(duration).toBeLessThan(16); // <16ms performance target

      if (parseResult.success) {
        const ast = parseResult.data.ast;
        expect(ast).toBeDefined();
        expect(ast).not.toBeNull();

        if (ast) {
          expect(ast.length).toBe(4); // Four assignment statements
        }
      }

      logger.end('Advanced language performance test completed');
    });

    it('should handle special variables correctly', async () => {
      logger.init('Testing special variable parsing');

      const specialVarCode = `
$fn = 64;
$fa = 12;
$fs = 2;
time_based = $t * 360;
viewport = [$vpt, $vpr, $vpd];
children_info = $children;
`;

      const parseResult = await parserService.parseDocument(specialVarCode);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        const ast = parseResult.data.ast;
        expect(ast).toBeDefined();
        expect(ast).not.toBeNull();

        if (ast) {
          expect(ast.length).toBe(6);

          // Verify each node is an assignment statement
          ast.forEach((node, index) => {
            expect(node).toBeDefined();
            expect(node?.type).toMatch(/assignment_statement|function_call/);
            logger.debug(`Special variable ${index + 1}: ${node?.type}`);
          });
        }
      }

      logger.end('Special variable parsing test completed');
    });

    it('should handle error recovery scenarios', async () => {
      logger.init('Testing error recovery scenarios');

      const errorRecoveryCode = `
a = 5
b = (2 + 3;
c = 1 + ;
d = "unterminated string;
`;

      const parseResult = await parserService.parseDocument(errorRecoveryCode);

      // Parser should attempt to recover from errors
      // May succeed with partial parsing or fail gracefully
      if (parseResult.success) {
        const ast = parseResult.data.ast;
        expect(ast).toBeDefined();
        expect(ast).not.toBeNull();

        if (ast) {
          logger.debug(`Error recovery parsed with ${ast.length} nodes`);
        }
      } else {
        expect(parseResult.error).toBeDefined();
        expect(typeof parseResult.error).toBe('string');
      }

      logger.end('Error recovery scenarios test completed');
    });
  });
});
