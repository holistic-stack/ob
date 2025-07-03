/**
 * AST to CSG Converter - Whitespace Handling Tests
 *
 * Tests for handling OpenSCAD code with leading/trailing whitespace
 * and ensuring proper function name extraction.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { ASTNode } from '../../../openscad-parser/core/ast-types.js';
import { UnifiedParserService } from '../../../openscad-parser/services/unified-parser-service.js';
import { convertASTNodeToCSG } from './ast-to-csg-converter.js';

const logger = createLogger('ASTToCSGConverterWhitespaceTest');

describe('AST to CSG Converter - Whitespace Handling', () => {
  let parserService: UnifiedParserService;

  beforeEach(async () => {
    logger.init('Setting up whitespace handling test environment');

    parserService = new UnifiedParserService({
      enableLogging: true,
      enableCaching: false,
      retryAttempts: 3,
      timeoutMs: 10000,
    });

    await parserService.initialize();
  });

  describe('Leading Whitespace Handling', () => {
    const testCases = [
      {
        name: 'cube with leading spaces',
        code: '  cube(15, center=true);',
        expectedFunction: 'cube',
      },
      {
        name: 'sphere with leading tabs',
        code: '\t\tsphere(10);',
        expectedFunction: 'sphere',
      },
      {
        name: 'cylinder with mixed whitespace',
        code: ' \t cylinder(h=20, r=5);',
        expectedFunction: 'cylinder',
      },
      {
        name: 'translate with leading spaces',
        code: '   translate([10, 0, 0]) cube(5);',
        expectedFunction: 'translate',
      },
    ];

    it.each(testCases)('should handle $name correctly', async ({ code, expectedFunction }) => {
      logger.init(`Testing whitespace handling for ${expectedFunction}`);

      const parseResult = await parserService.parseDocument(code);
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

      const rootNode = ast[0];
      expect(rootNode).toBeDefined();

      // Convert to CSG
      const result = await convertASTNodeToCSG(rootNode as ASTNode, 0);
      expect(result.success).toBe(true);

      if (result.success) {
        logger.debug(`✅ ${expectedFunction} with whitespace converted successfully`);
        expect(result.data.mesh).toBeDefined();
      }

      logger.end(`Whitespace handling test for ${expectedFunction} completed`);
    });
  });

  describe('Trailing Whitespace Handling', () => {
    it('should handle trailing whitespace in function calls', async () => {
      const code = 'cube(10)  \t ;';

      logger.init('Testing trailing whitespace handling');

      const parseResult = await parserService.parseDocument(code);
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

      // Convert each AST node to CSG
      for (let i = 0; i < ast.length; i++) {
        const node = ast[i];
        if (!node) continue;

        const result = await convertASTNodeToCSG(node as ASTNode, i);
        expect(result.success).toBe(true);

        if (result.success) {
          expect(result.data.mesh).toBeDefined();
          logger.debug(`Node ${i} converted successfully despite trailing whitespace`);
        }
      }

      logger.end('Trailing whitespace handling test completed');
    });
  });

  describe('Complex Whitespace Scenarios', () => {
    it('should handle multi-line code with various whitespace', async () => {
      const code = `
  
    cube(10);
    
      sphere(5);
      
        cylinder(h=8, r=3);
        
  `;

      logger.init('Testing complex multi-line whitespace scenarios');

      const parseResult = await parserService.parseDocument(code);
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

      const rootNode = ast[0];
      expect(rootNode).toBeDefined();

      const result = await convertASTNodeToCSG(rootNode as ASTNode, 0);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.mesh).toBeDefined();
        logger.debug('✅ Multi-line whitespace code converted successfully');
      }

      logger.end('Complex whitespace scenarios test completed');
    });

    it('should handle whitespace in function parameters', async () => {
      const code = 'cube( [ 10 , 10 , 10 ] , center = true );';

      logger.init('Testing whitespace in function parameters');

      const parseResult = await parserService.parseDocument(code);
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

      const rootNode = ast[0];
      expect(rootNode).toBeDefined();

      const result = await convertASTNodeToCSG(rootNode as ASTNode, 0);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.mesh).toBeDefined();
        expect(result.data.mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
        logger.debug('✅ Function with parameter whitespace converted successfully');
      }

      logger.end('Function parameter whitespace test completed');
    });

    it('should handle whitespace in nested structures', async () => {
      const code = `
translate( [ 10 , 0 , 0 ] ) {
  
    cube( 5 );
    
}
`;

      logger.init('Testing whitespace in nested structures');

      const parseResult = await parserService.parseDocument(code);
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

      const rootNode = ast[0];
      expect(rootNode).toBeDefined();

      const result = await convertASTNodeToCSG(rootNode as ASTNode, 0);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.mesh).toBeDefined();
        logger.debug('✅ Nested structure with whitespace converted successfully');
      }

      logger.end('Nested structure whitespace test completed');
    });

    it('should maintain performance with whitespace (<16ms)', async () => {
      const code = '   cube(10)   ;   ';

      logger.init('Testing whitespace handling performance');

      const parseResult = await parserService.parseDocument(code);
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

      const rootNode = ast[0];
      expect(rootNode).toBeDefined();

      // Performance test
      const startTime = performance.now();
      const result = await convertASTNodeToCSG(rootNode as ASTNode, 0);
      const endTime = performance.now();

      const duration = endTime - startTime;
      logger.debug(`Whitespace handling conversion time: ${duration.toFixed(2)}ms`);

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(16); // <16ms performance target

      if (result.success) {
        expect(result.data.mesh).toBeDefined();
      }

      logger.end('Whitespace handling performance test completed');
    });
  });
});
