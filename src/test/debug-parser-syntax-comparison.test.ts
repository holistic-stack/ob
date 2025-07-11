import { beforeEach, describe, expect, it } from 'vitest';
import { OpenscadParser } from '../features/openscad-parser/openscad-parser.js';
import { createLogger } from '../shared/services/logger.service.js';
import { clearSourceCodeForExtraction } from '../features/3d-renderer/services/ast-to-csg-converter/ast-to-csg-converter.js';

const logger = createLogger('DebugParserSyntaxComparison');

describe('Debug Parser Syntax Comparison', () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    // Use EXACT same setup as cube sizing tests
    logger.init('Setting up debug parser syntax comparison tests');
    parser = new OpenscadParser();
    await parser.init();
  });

  afterEach(() => {
    // Use EXACT same cleanup as cube sizing tests
    if (parser) {
      try {
        // Call cleanup method if available
        if ('cleanup' in parser && typeof parser.cleanup === 'function') {
          parser.cleanup();
        }
        // Clear any source code extraction state
        clearSourceCodeForExtraction();
      } catch (error) {
        logger.warn('Parser cleanup failed:', error);
      }
    }
  });

  it('should compare working vs failing syntax patterns', () => {
    console.log('🔍 Comparing working vs failing syntax patterns...');

    // Working patterns from core recursive AST extraction tests
    const workingPatterns = [
      'translate([1, 2, 3]) cube(10);',           // From line 48 - WORKING
      'translate([0, 0, 0]) cube(5);',            // From line 180 - WORKING  
      'translate([10, 20, 30]) cube(5);',         // From line 269 - WORKING
      'translate([10, 20, 30]) cube(size=[5, 10, 15], center=true);', // From line 202 - WORKING
    ];

    // Failing patterns from cube sizing tests
    const failingPatterns = [
      'translate([10,20,30])cube(0.1, center=false);',  // From cube sizing test - FAILING
      'translate([0,0,0])translate([0,0,0])cube(1, center=false);', // From cube sizing test - FAILING
    ];

    // Test variations to isolate the issue
    const testVariations = [
      // Space variations
      'translate([10,20,30]) cube(0.1, center=false);',  // Add space
      'translate([10, 20, 30])cube(0.1, center=false);', // Add spaces in array
      'translate([10, 20, 30]) cube(0.1, center=false);', // Add all spaces
      
      // Decimal variations
      'translate([10,20,30])cube(1, center=false);',     // Use integer instead of decimal
      'translate([10,20,30])cube(0.1);',                 // Remove center parameter
      'translate([10,20,30])cube(10);',                  // Use integer and remove center
      
      // Syntax variations
      'translate([10,20,30]) { cube(0.1, center=false); }', // Add braces
      'translate([10,20,30]) cube([0.1, 0.1, 0.1], center=false);', // Use array for size
    ];

    console.log('\n✅ Testing known working patterns:');
    workingPatterns.forEach((pattern, i) => {
      const ast = parser.parseAST(pattern);
      console.log(`   ${i + 1}. ${ast.length > 0 ? '✅' : '❌'} (${ast.length}) "${pattern}"`);
    });

    console.log('\n❌ Testing known failing patterns:');
    failingPatterns.forEach((pattern, i) => {
      const ast = parser.parseAST(pattern);
      console.log(`   ${i + 1}. ${ast.length > 0 ? '✅' : '❌'} (${ast.length}) "${pattern}"`);
    });

    console.log('\n🔍 Testing variations to isolate the issue:');
    testVariations.forEach((pattern, i) => {
      const ast = parser.parseAST(pattern);
      console.log(`   ${i + 1}. ${ast.length > 0 ? '✅' : '❌'} (${ast.length}) "${pattern}"`);
    });

    // Find the pattern that makes it work
    console.log('\n📊 Analysis:');
    const workingCount = workingPatterns.filter(p => parser.parseAST(p).length > 0).length;
    const failingCount = failingPatterns.filter(p => parser.parseAST(p).length > 0).length;
    const variationCount = testVariations.filter(p => parser.parseAST(p).length > 0).length;
    
    console.log(`   Working patterns: ${workingCount}/${workingPatterns.length}`);
    console.log(`   Failing patterns: ${failingCount}/${failingPatterns.length}`);
    console.log(`   Variation patterns: ${variationCount}/${testVariations.length}`);

    // The key insight: find what makes the difference
    if (failingCount === 0 && variationCount > 0) {
      console.log('🔍 KEY INSIGHT: The issue is in the specific syntax combination!');
      console.log('   Likely causes: spacing, decimal numbers, or parameter syntax');
    } else if (failingCount > 0) {
      console.log('🔍 KEY INSIGHT: The failing patterns actually work in isolation!');
      console.log('   This suggests a test environment issue, not a parser issue');
    }
  });
});
