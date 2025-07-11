import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearSourceCodeForExtraction,
  convertASTNodeToCSG,
  setSourceCodeForExtraction,
} from '../features/3d-renderer/services/ast-to-csg-converter/ast-to-csg-converter.js';
import type { ASTNode } from '../features/openscad-parser/core/ast-types.js';
import { OpenscadParser } from '../features/openscad-parser/openscad-parser.js';
import { createLogger } from '../shared/services/logger.service.js';

const logger = createLogger('DebugCubeSizingEnvironmentTest');

describe('Debug Cube Sizing Test Environment', () => {
  let parserService: OpenscadParser;

  beforeEach(async () => {
    logger.init('Setting up debug cube sizing test environment');
    parserService = new OpenscadParser();
    await parserService.init();
  });

  afterEach(() => {
    // Clean up parser instance to prevent state corruption between tests
    if (parserService) {
      try {
        // Call cleanup method if available
        if ('cleanup' in parserService && typeof parserService.cleanup === 'function') {
          parserService.cleanup();
        }
        // Clear any source code extraction state
        clearSourceCodeForExtraction();
      } catch (error) {
        logger.warn('Parser cleanup failed:', error);
      }
    }
  });

  it('should isolate exactly when parser state gets corrupted', async () => {
    console.log('🔍 Isolating EXACTLY when parser state gets corrupted...');

    const code1 = `cube(0.1, center=false);`;
    const code2 = `translate([10,20,30])cube(0.1, center=false);`;

    console.log(`\n🧪 Step-by-step isolation:`);
    console.log(`   Code1: "${code1}"`);
    console.log(`   Code2: "${code2}"`);

    // Step 1: Test parser in clean state
    console.log('\n📍 Step 1: Test parser in clean state');
    const cleanAst1 = parserService.parseAST(code1);
    const cleanAst2 = parserService.parseAST(code2);
    console.log(`   Clean AST1 length: ${cleanAst1.length}`);
    console.log(`   Clean AST2 length: ${cleanAst2.length}`);

    // Step 2: Test with setSourceCodeForExtraction (no CSG conversion)
    console.log('\n📍 Step 2: Test with setSourceCodeForExtraction (no CSG conversion)');
    setSourceCodeForExtraction(code1);
    const sourceAst1 = parserService.parseAST(code1);
    clearSourceCodeForExtraction();

    setSourceCodeForExtraction(code2);
    const sourceAst2 = parserService.parseAST(code2);
    clearSourceCodeForExtraction();

    console.log(`   With setSource AST1 length: ${sourceAst1.length}`);
    console.log(`   With setSource AST2 length: ${sourceAst2.length}`);

    // Step 3: Test after first CSG conversion
    console.log('\n📍 Step 3: Test after first CSG conversion');
    setSourceCodeForExtraction(code1);
    const preCSGAst1 = parserService.parseAST(code1);
    console.log(`   Pre-CSG AST1 length: ${preCSGAst1.length}`);

    if (preCSGAst1.length > 0) {
      const result1 = await convertASTNodeToCSG(preCSGAst1[0] as ASTNode, 0);
      console.log(`   CSG conversion 1 success: ${result1.success}`);
    }
    clearSourceCodeForExtraction();

    // Step 4: Test parser state after CSG conversion
    console.log('\n📍 Step 4: Test parser state after CSG conversion');
    const postCSGAst1 = parserService.parseAST(code1);
    const postCSGAst2 = parserService.parseAST(code2);
    console.log(`   Post-CSG AST1 length: ${postCSGAst1.length}`);
    console.log(`   Post-CSG AST2 length: ${postCSGAst2.length}`);

    // Step 5: Test with setSourceCodeForExtraction after CSG conversion
    console.log('\n📍 Step 5: Test with setSourceCodeForExtraction after CSG conversion');
    setSourceCodeForExtraction(code2);
    const finalAst2 = parserService.parseAST(code2);
    clearSourceCodeForExtraction();
    console.log(`   Final AST2 length: ${finalAst2.length}`);

    // Identify the exact step where corruption occurs
    console.log('\n🔍 Corruption Analysis:');
    if (cleanAst2.length === 0) {
      console.log('🚨 CORRUPTION: Parser fails from the start!');
    } else if (sourceAst2.length === 0) {
      console.log('🚨 CORRUPTION: setSourceCodeForExtraction causes the issue!');
    } else if (postCSGAst2.length === 0) {
      console.log('🚨 CORRUPTION: CSG conversion causes the issue!');
    } else if (finalAst2.length === 0) {
      console.log('🚨 CORRUPTION: setSourceCodeForExtraction after CSG causes the issue!');
    } else {
      console.log('✅ NO CORRUPTION: All steps work correctly!');
    }

    // For the test to pass, we need the final parsing to work
    expect(finalAst2.length).toBeGreaterThan(0);
  });
});
