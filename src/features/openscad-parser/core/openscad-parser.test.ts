/**
 * @file OpenSCAD Parser Tests
 *
 * Tests for the custom OpenSCAD parser implementation.
 * Validates API compatibility and WASM-based functionality.
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLogger } from '../../../shared/services/logger.service.js';
import {
  cleanupTestParser,
  cleanupWasmTesting,
  createMockParser,
  createTestParser,
  getSampleOpenSCADCode,
  setupWasmTesting,
  verifyParserAPI,
} from '../test-utils/index.js';
import type { OpenscadParser } from './openscad-parser.js';
import { SimpleErrorHandler } from './simple-error-handler.js';

const logger = createLogger('OpenscadParserTest');

describe('[INIT][OpenscadParser] Custom OpenSCAD Parser', () => {
  let parser: OpenscadParser;
  let errorHandler: SimpleErrorHandler;
  const samples = getSampleOpenSCADCode();

  beforeEach(async () => {
    logger.init('Setting up OpenSCAD parser test');
    errorHandler = new SimpleErrorHandler();
    parser = createTestParser();
  });

  afterEach(() => {
    cleanupTestParser(parser);
    logger.end('Cleaning up OpenSCAD parser test');
  });

  describe('Parser Initialization', () => {
    it('should create parser instance', () => {
      expect(parser).toBeDefined();
      expect(parser.isReady()).toBe(false); // Not initialized yet
      verifyParserAPI(parser);
    });

    it('should handle initialization errors gracefully', async () => {
      // Test with invalid WASM paths
      await expect(parser.init('./invalid.wasm')).rejects.toThrow();
      expect(parser.isReady()).toBe(false);
    });
  });

  describe('CST Parsing', () => {
    it.skip('should parse simple OpenSCAD code to CST', () => {
      // Skip until WASM grammar is available
      const code = 'cube(10);';
      const tree = parser.parseCST(code);

      expect(tree).toBeDefined();
      expect(tree.rootNode).toBeDefined();
      expect(tree.rootNode.type).toBe('source_file');
    });

    it.skip('should handle empty code', () => {
      // Skip until WASM grammar is available
      const code = '';
      const tree = parser.parseCST(code);

      expect(tree).toBeDefined();
      expect(tree.rootNode).toBeDefined();
    });

    it.skip('should handle syntax errors gracefully', () => {
      // Skip until WASM grammar is available
      const code = 'cube(10'; // Missing closing parenthesis
      const tree = parser.parseCST(code);

      expect(tree).toBeDefined();
      expect(tree.rootNode.hasError).toBe(true);
    });
  });

  describe('AST Parsing', () => {
    it.skip('should parse simple OpenSCAD code to AST', () => {
      // Skip until WASM grammar is available
      const code = 'cube(10);';
      const ast = parser.parseAST(code);

      expect(Array.isArray(ast)).toBe(true);
      // Note: AST conversion is placeholder in Phase 1
      // Will be implemented in Phase 1.3 with BaseASTVisitor
    });

    it.skip('should return empty array for empty code', () => {
      // Skip until WASM grammar is available
      const code = '';
      const ast = parser.parseAST(code);

      expect(Array.isArray(ast)).toBe(true);
      expect(ast).toHaveLength(0);
    });

    it.skip('should handle parsing errors gracefully', () => {
      // Skip until WASM grammar is available
      const code = 'invalid syntax here';
      const ast = parser.parseAST(code);

      expect(Array.isArray(ast)).toBe(true);
      // Should not throw, but may return empty array
    });
  });

  describe('Error Handling', () => {
    it.skip('should collect errors through error handler', () => {
      // Skip until WASM grammar is available
      const code = 'cube(10'; // Syntax error
      parser.parseAST(code);

      // Error handler should have collected warnings about syntax errors
      expect(errorHandler.hasWarnings()).toBe(true);
    });

    it.skip('should clear errors between parses', () => {
      // Skip until WASM grammar is available
      const code = 'cube(10);';
      parser.parseAST(code);
      parser.parseAST(code); // Second parse should clear previous errors

      // Should not accumulate errors from previous parses
      expect(errorHandler.getTotalMessageCount()).toBeLessThanOrEqual(2);
    });
  });

  describe('Resource Management', () => {
    it('should dispose resources properly', () => {
      parser.dispose();
      expect(parser.isReady()).toBe(false);
    });

    it('should handle multiple dispose calls', () => {
      parser.dispose();
      parser.dispose(); // Should not throw
      expect(parser.isReady()).toBe(false);
    });
  });

  describe('API Compatibility', () => {
    it('should maintain exact API compatibility with @holistic-stack/openscad-parser', () => {
      verifyParserAPI(parser);
    });

    it('should handle uninitialized parser gracefully', () => {
      // Parser should throw meaningful errors when not initialized
      expect(() => parser.parseCST(samples.simple.cube)).toThrow();
      expect(() => parser.parseAST(samples.simple.cube)).toThrow();
    });
  });
});

describe('[WASM][OpenscadParser] WASM-based Parser Functionality', () => {
  let mockParser: OpenscadParser;

  beforeAll(() => {
    setupWasmTesting();
  });

  afterAll(() => {
    cleanupWasmTesting();
  });

  beforeEach(() => {
    mockParser = createMockParser();
  });

  afterEach(() => {
    cleanupTestParser(mockParser);
  });

  describe('Mock Parser Functionality', () => {
    it('should initialize mock parser successfully', async () => {
      await mockParser.init();
      expect(mockParser.isReady()).toBe(true);
    });

    it('should parse CST with mock implementation', async () => {
      await mockParser.init();
      const code = getSampleOpenSCADCode().simple.cube;
      const tree = mockParser.parseCST(code);

      expect(tree).toBeDefined();
      expect(tree.rootNode).toBeDefined();
      expect(tree.rootNode.type).toBe('source_file');
    });

    it('should parse AST with mock implementation', async () => {
      await mockParser.init();
      const code = getSampleOpenSCADCode().simple.cube;
      const ast = mockParser.parseAST(code);

      expect(Array.isArray(ast)).toBe(true);
    });

    it('should handle various OpenSCAD constructs', async () => {
      await mockParser.init();
      const samples = getSampleOpenSCADCode();

      // Test simple primitives
      expect(() => mockParser.parseCST(samples.simple.cube)).not.toThrow();
      expect(() => mockParser.parseCST(samples.simple.sphere)).not.toThrow();
      expect(() => mockParser.parseCST(samples.simple.cylinder)).not.toThrow();

      // Test complex operations
      expect(() => mockParser.parseCST(samples.complex.union)).not.toThrow();
      expect(() => mockParser.parseCST(samples.complex.difference)).not.toThrow();

      // Test transformations
      expect(() => mockParser.parseCST(samples.transforms.translate)).not.toThrow();
      expect(() => mockParser.parseCST(samples.transforms.rotate)).not.toThrow();
    });
  });

  describe('WASM Integration', () => {
    it('should handle fetch mocking for WASM files', () => {
      expect(vi.mocked(fetch)).toBeDefined();
      expect(typeof vi.mocked(fetch)).toBe('function');
    });

    it('should provide proper error messages for missing WASM files', async () => {
      const realParser = createTestParser();

      // This should fail gracefully with fetch mock returning 404
      await expect(realParser.init('./nonexistent.wasm')).rejects.toThrow();

      cleanupTestParser(realParser);
    });
  });
});
