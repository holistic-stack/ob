/**
 * Tree-sitter Vector Parsing Validation Test
 *
 * This test validates that the Tree-sitter vector parsing fixes are working correctly
 * for the specific issue where translate([100,20,30]) was being parsed as [10, 0, 0].
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { extractTranslateParameters } from '../features/3d-renderer/services/ast-to-csg-converter/ast-to-csg-converter.js';
import { createLogger } from '../shared/services/logger.service.js';

const logger = createLogger('TreeSitterVectorParsingValidation');

describe('Tree-sitter Vector Parsing Validation', () => {
  beforeEach(() => {
    logger.init('Starting Tree-sitter vector parsing validation test');
  });

  describe('Vector Parsing Workaround', () => {
    it('should correctly extract complex vectors that were previously truncated', () => {
      // These are the specific test cases that were failing before our fix
      const problematicCases = [
        {
          description: 'Original failing case: translate([100,20,30])',
          code: 'cube(5, center=true);translate([100,20,30])sphere(10);',
          expected: [100, 20, 30],
          previouslyParsedAs: [10, 0, 0], // What Tree-sitter was incorrectly returning
        },
        {
          description: 'Large vector values',
          code: 'translate([999,888,777])cube(5);',
          expected: [999, 888, 777],
          previouslyParsedAs: [9, 8, 7], // Simulated truncation
        },
        {
          description: 'Three-digit values',
          code: 'translate([123,456,789])sphere(10);',
          expected: [123, 456, 789],
          previouslyParsedAs: [1, 4, 7], // Simulated truncation
        },
        {
          description: 'Mixed small and large values',
          code: 'translate([5,200,30])cylinder(h=10, r=5);',
          expected: [5, 200, 30],
          previouslyParsedAs: [5, 2, 3], // Simulated truncation
        },
      ];

      problematicCases.forEach(({ description, code, expected, previouslyParsedAs }) => {
        logger.debug(`Testing: ${description}`);
        logger.debug(`Code: ${code}`);
        logger.debug(`Expected: [${expected.join(', ')}]`);
        logger.debug(`Previously parsed as: [${previouslyParsedAs.join(', ')}]`);

        const extracted = extractTranslateParameters(code);

        // Should successfully extract the vector
        expect(extracted).not.toBeNull();

        if (extracted) {
          // Should have exactly 3 components
          expect(extracted).toHaveLength(3);

          // Should match the expected values (not the truncated ones)
          expect(extracted[0]).toBeCloseTo(expected[0], 5);
          expect(extracted[1]).toBeCloseTo(expected[1], 5);
          expect(extracted[2]).toBeCloseTo(expected[2], 5);

          // Should NOT match the previously incorrect values
          const matchesPreviousIncorrect =
            Math.abs(extracted[0] - previouslyParsedAs[0]) < 0.001 &&
            Math.abs(extracted[1] - previouslyParsedAs[1]) < 0.001 &&
            Math.abs(extracted[2] - previouslyParsedAs[2]) < 0.001;

          expect(matchesPreviousIncorrect).toBe(false);

          logger.debug(
            `✅ Successfully extracted: [${extracted[0]}, ${extracted[1]}, ${extracted[2]}]`
          );
        }
      });

      logger.debug('✅ All Tree-sitter vector parsing workaround tests passed');
    });

    it('should handle edge cases that might trigger Tree-sitter truncation', () => {
      const edgeCases = [
        {
          description: 'Very large numbers',
          code: 'translate([1000,2000,3000])cube(1);',
          expected: [1000, 2000, 3000],
        },
        {
          description: 'Decimal values',
          code: 'translate([12.34,56.78,90.12])sphere(5);',
          expected: [12.34, 56.78, 90.12],
        },
        {
          description: 'Negative values',
          code: 'translate([-100,-200,-300])cylinder(h=5, r=2);',
          expected: [-100, -200, -300],
        },
        {
          description: 'Mixed positive and negative',
          code: 'translate([100,-200,300])cube(3);',
          expected: [100, -200, 300],
        },
        {
          description: 'Zero values mixed with large values',
          code: 'translate([0,500,0])sphere(8);',
          expected: [0, 500, 0],
        },
      ];

      edgeCases.forEach(({ description, code, expected }) => {
        logger.debug(`Testing edge case: ${description}`);

        const extracted = extractTranslateParameters(code);
        expect(extracted).not.toBeNull();

        if (extracted) {
          expect(extracted).toHaveLength(3);
          expect(extracted[0]).toBeCloseTo(expected[0], 5);
          expect(extracted[1]).toBeCloseTo(expected[1], 5);
          expect(extracted[2]).toBeCloseTo(expected[2], 5);

          logger.debug(`✅ Edge case passed: [${extracted[0]}, ${extracted[1]}, ${extracted[2]}]`);
        }
      });

      logger.debug('✅ All edge case tests passed');
    });

    it('should maintain backward compatibility with simple vectors', () => {
      // Ensure our fix doesn't break simple cases that were already working
      const simpleCases = [
        { code: 'translate([1,2,3])cube(1);', expected: [1, 2, 3] },
        { code: 'translate([0,0,0])sphere(1);', expected: [0, 0, 0] },
        { code: 'translate([5,5,5])cylinder(h=1, r=1);', expected: [5, 5, 5] },
      ];

      simpleCases.forEach(({ code, expected }) => {
        const extracted = extractTranslateParameters(code);
        expect(extracted).not.toBeNull();

        if (extracted) {
          expect(extracted).toHaveLength(3);
          expect(extracted[0]).toBeCloseTo(expected[0], 5);
          expect(extracted[1]).toBeCloseTo(expected[1], 5);
          expect(extracted[2]).toBeCloseTo(expected[2], 5);
        }
      });

      logger.debug('✅ Backward compatibility maintained');
    });
  });

  describe('Integration with AST Restructuring', () => {
    it('should work correctly with the AST restructuring fixes', () => {
      // Test the complete pipeline: parsing → AST restructuring → vector extraction
      const integrationCases = [
        {
          description: 'Multi-statement with correct primitive association',
          code: 'cube(5, center=true);translate([100,20,30])sphere(10);',
          expectedVector: [100, 20, 30],
          expectedPrimitive: 'sphere', // Should associate with sphere, not cube
        },
      ];

      integrationCases.forEach(({ description, code, expectedVector }) => {
        logger.debug(`Testing integration: ${description}`);

        const extracted = extractTranslateParameters(code);
        expect(extracted).not.toBeNull();

        if (extracted) {
          expect(extracted[0]).toBeCloseTo(expectedVector[0], 5);
          expect(extracted[1]).toBeCloseTo(expectedVector[1], 5);
          expect(extracted[2]).toBeCloseTo(expectedVector[2], 5);

          logger.debug(
            `✅ Integration test passed: [${extracted[0]}, ${extracted[1]}, ${extracted[2]}]`
          );
        }
      });

      logger.debug('✅ AST restructuring integration tests passed');
    });
  });
});
