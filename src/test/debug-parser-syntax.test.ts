import { beforeEach, describe, expect, it } from 'vitest';
import { OpenscadParser } from '../features/openscad-parser/openscad-parser.js';
import {
  setSourceCodeForExtraction,
  clearSourceCodeForExtraction
} from '../features/3d-renderer/services/ast-to-csg-converter/ast-to-csg-converter.js';

describe('Debug Parser Syntax Issues', () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    parser = new OpenscadParser();
    await parser.init();
  });

  it('should investigate parser state corruption in cube sizing test environment', () => {
    console.log('🔍 Investigating parser state corruption...');

    // Test the exact patterns from the working core tests
    const workingPatterns = [
      'translate([1, 2, 3]) cube(10);',
      'translate([0, 0, 0]) cube(5);',
      'translate([10, 20, 30]) cube(5);',
    ];

    // Test the exact patterns from the failing cube sizing tests
    const failingPatterns = [
      'translate([10,20,30])cube(0.1, center=false);',
      'translate([0,0,0])translate([0,0,0])cube(1, center=false);',
    ];

    console.log('\n✅ Testing known working patterns:');
    workingPatterns.forEach((code, i) => {
      const ast = parser.parseAST(code);
      console.log(`   Pattern ${i + 1}: ${ast.length > 0 ? '✅' : '❌'} (length: ${ast.length}) - "${code}"`);
    });

    console.log('\n❌ Testing supposedly failing patterns:');
    failingPatterns.forEach((code, i) => {
      const ast = parser.parseAST(code);
      console.log(`   Pattern ${i + 1}: ${ast.length > 0 ? '✅' : '❌'} (length: ${ast.length}) - "${code}"`);
    });

    // Test with the exact same setup as cube sizing tests
    console.log('\n🔍 Testing with cube sizing test setup (setSourceCodeForExtraction):');
    failingPatterns.forEach((code, i) => {
      setSourceCodeForExtraction(code);
      const ast = parser.parseAST(code);
      clearSourceCodeForExtraction();
      console.log(`   Pattern ${i + 1} (with setSource): ${ast.length > 0 ? '✅' : '❌'} (length: ${ast.length}) - "${code}"`);
    });

    // Test parser state after multiple calls (simulating property-based testing)
    console.log('\n🔍 Testing parser state after multiple rapid calls:');
    for (let i = 0; i < 5; i++) {
      const code = 'translate([0,0,0])cube(1, center=false);';
      setSourceCodeForExtraction(code);
      const ast = parser.parseAST(code);
      clearSourceCodeForExtraction();
      console.log(`   Rapid call ${i + 1}: ${ast.length > 0 ? '✅' : '❌'} (length: ${ast.length})`);

      if (ast.length === 0) {
        console.log('🚨 PARSER STATE CORRUPTION DETECTED after rapid calls!');
        break;
      }
    }
  });

  it('should test syntax patterns from failing cube sizing tests', () => {
    console.log('Testing syntax patterns that are failing in cube sizing tests...');

    // Test 1: Working syntax (from core tests) - WITHOUT setSourceCodeForExtraction
    const working = 'translate([1, 2, 3]) cube(10);';
    const ast1 = parser.parseAST(working);
    console.log('✅ Working syntax (no setSource):', working);
    console.log('   AST length:', ast1.length);
    expect(ast1.length).toBeGreaterThan(0);

    // Test 2: Same syntax - WITH setSourceCodeForExtraction (like failing tests)
    setSourceCodeForExtraction(working);
    const ast1b = parser.parseAST(working);
    clearSourceCodeForExtraction();
    console.log('🔍 Same syntax (with setSource):', working);
    console.log('   AST length:', ast1b.length);

    // Test 3: Problematic syntax from edge case test (line 211) - WITHOUT setSourceCodeForExtraction
    const problematic1 = 'translate([10,20,30])cube(0.1, center=false);';
    const ast2 = parser.parseAST(problematic1);
    console.log('✅ Problematic syntax 1 (no setSource):', problematic1);
    console.log('   AST length:', ast2.length);

    // Test 4: Same problematic syntax - WITH setSourceCodeForExtraction (like failing tests)
    setSourceCodeForExtraction(problematic1);
    const ast2b = parser.parseAST(problematic1);
    clearSourceCodeForExtraction();
    console.log('❌ Problematic syntax 1 (with setSource):', problematic1);
    console.log('   AST length:', ast2b.length);

    // Test 5: Double translate from multiple transformation test (line 286) - WITHOUT setSourceCodeForExtraction
    const problematic2 = 'translate([0,0,0])translate([0,0,0])cube(1, center=false);';
    const ast3 = parser.parseAST(problematic2);
    console.log('✅ Problematic syntax 2 (no setSource):', problematic2);
    console.log('   AST length:', ast3.length);

    // Test 6: Same double translate - WITH setSourceCodeForExtraction (like failing tests)
    setSourceCodeForExtraction(problematic2);
    const ast3b = parser.parseAST(problematic2);
    clearSourceCodeForExtraction();
    console.log('❌ Problematic syntax 2 (with setSource):', problematic2);
    console.log('   AST length:', ast3b.length);

    // Test 4: Fixed syntax with spaces
    const fixed1 = 'translate([10,20,30]) cube(0.1, center=false);';
    const ast4 = parser.parseAST(fixed1);
    console.log('🔧 Fixed syntax 1:', fixed1);
    console.log('   AST length:', ast4.length);
    expect(ast4.length).toBeGreaterThan(0);

    // Test 5: Fixed double translate with spaces
    const fixed2 = 'translate([0,0,0]) translate([0,0,0]) cube(1, center=false);';
    const ast5 = parser.parseAST(fixed2);
    console.log('🔧 Fixed syntax 2:', fixed2);
    console.log('   AST length:', ast5.length);
    expect(ast5.length).toBeGreaterThan(0);

    // Test 6: Alternative double translate with braces
    const fixed3 = 'translate([0,0,0]) { translate([0,0,0]) { cube(1, center=false); } }';
    const ast6 = parser.parseAST(fixed3);
    console.log('🔧 Fixed syntax 3 (braces):', fixed3);
    console.log('   AST length:', ast6.length);
    expect(ast6.length).toBeGreaterThan(0);

    // Show which patterns fail
    console.log('\n📊 Results Summary:');
    console.log(`Working pattern (no setSource): ${ast1.length > 0 ? '✅' : '❌'}`);
    console.log(`Working pattern (with setSource): ${ast1b.length > 0 ? '✅' : '❌'}`);
    console.log(`Problematic 1 (no setSource): ${ast2.length > 0 ? '✅' : '❌'}`);
    console.log(`Problematic 1 (with setSource): ${ast2b.length > 0 ? '✅' : '❌'}`);
    console.log(`Problematic 2 (no setSource): ${ast3.length > 0 ? '✅' : '❌'}`);
    console.log(`Problematic 2 (with setSource): ${ast3b.length > 0 ? '✅' : '❌'}`);

    // The key test: setSourceCodeForExtraction should NOT affect parser.parseAST()
    console.log('\n🔍 Key Finding:');
    if (ast1.length === ast1b.length && ast2.length === ast2b.length && ast3.length === ast3b.length) {
      console.log('✅ setSourceCodeForExtraction does NOT interfere with parser.parseAST()');
    } else {
      console.log('❌ setSourceCodeForExtraction DOES interfere with parser.parseAST()');
      console.log('   This is the root cause of the failing cube sizing tests!');
    }
  });
});
