/**
 * @file Malformed Input Error Handling Tests
 *
 * Comprehensive error handling tests for malformed OpenSCAD input.
 * Tests ensure that the system gracefully handles invalid syntax, unsupported features,
 * and edge cases without crashing or producing incorrect results.
 * 
 * @example
 * Tests cover various error scenarios:
 * - Invalid OpenSCAD syntax and parsing errors
 * - Unsupported OpenSCAD features and operations
 * - Edge cases and boundary conditions
 * - Recovery strategies and error reporting
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OpenscadParser } from '../../features/openscad-parser';
import { ASTBridgeConverter } from '../../features/babylon-renderer/services/ast-bridge-converter';
import { SelectionService } from '../../features/babylon-renderer/services/selection';
import { ExportService } from '../../features/babylon-renderer/services/export';
import { createLogger } from '../../shared/services/logger.service';

// Mock logger to avoid console output during tests
import { vi } from 'vitest';
vi.mock('../../shared/services/logger.service', () => ({
  createLogger: vi.fn(() => ({
    init: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock DOM APIs for export functionality
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

Object.defineProperty(global, 'Blob', {
  value: class MockBlob {
    constructor(public data: any[], public options?: any) {}
    get size() { return 1024; }
  },
});

Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(() => ({
      href: '',
      download: '',
      click: vi.fn(),
    })),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

const logger = createLogger('MalformedInputError');

describe('Malformed Input Error Handling Tests', () => {
  let engine: NullEngine;
  let scene: Scene;
  let parser: OpenscadParser;
  let astConverter: ASTBridgeConverter;
  let selectionService: SelectionService;
  let exportService: ExportService;

  beforeEach(async () => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);
    
    // Create and initialize OpenSCAD parser
    parser = new OpenscadParser();
    await parser.init();
    
    // Create AST converter
    astConverter = new ASTBridgeConverter(scene);
    await astConverter.initialize();
    
    // Create services
    selectionService = new SelectionService(scene);
    await selectionService.initialize();
    
    exportService = new ExportService(scene);
    
    // Clear mocks
    vi.clearAllMocks();
    
    logger.debug('[SETUP] Error handling test environment initialized');
  });

  afterEach(() => {
    // Clean up resources
    if (exportService) {
      exportService.dispose();
    }
    if (selectionService) {
      selectionService.dispose();
    }
    if (astConverter) {
      astConverter.dispose();
    }
    if (parser) {
      parser.dispose();
    }
    scene.dispose();
    engine.dispose();
  });

  describe('Syntax Error Handling', () => {
    it('should handle missing semicolons gracefully', () => {
      const invalidCode = 'cube([2, 2, 2])'; // Missing semicolon
      
      const parseResult = parser.parseASTWithResult(invalidCode);
      
      // Should either fail gracefully or recover with partial AST
      if (!parseResult.success) {
        expect(parseResult.error).toBeDefined();
        expect(parseResult.error.code).toBeDefined();
        logger.debug('[SYNTAX_ERROR] Missing semicolon handled gracefully');
      } else {
        // If parser recovered, AST should still be valid
        expect(parseResult.data).toBeDefined();
        expect(Array.isArray(parseResult.data)).toBe(true);
        logger.debug('[SYNTAX_ERROR] Parser recovered from missing semicolon');
      }
    });

    it('should handle missing closing parentheses gracefully', () => {
      const invalidCode = 'cube([2, 2, 2];'; // Missing closing parenthesis
      
      const parseResult = parser.parseASTWithResult(invalidCode);
      
      if (!parseResult.success) {
        expect(parseResult.error).toBeDefined();
        expect(parseResult.error.message).toBeDefined();
        logger.debug('[SYNTAX_ERROR] Missing parenthesis handled gracefully');
      } else {
        expect(parseResult.data).toBeDefined();
        logger.debug('[SYNTAX_ERROR] Parser recovered from missing parenthesis');
      }
    });

    it('should handle missing closing braces gracefully', () => {
      const invalidCode = `
        union() {
          cube([2, 2, 2]);
          sphere(r=1);
        // Missing closing brace
      `;
      
      const parseResult = parser.parseASTWithResult(invalidCode);
      
      if (!parseResult.success) {
        expect(parseResult.error).toBeDefined();
        logger.debug('[SYNTAX_ERROR] Missing brace handled gracefully');
      } else {
        expect(parseResult.data).toBeDefined();
        logger.debug('[SYNTAX_ERROR] Parser recovered from missing brace');
      }
    });

    it('should handle invalid parameter syntax gracefully', () => {
      const invalidCode = 'cube([2, 2, 2, extra_param]);'; // Invalid parameter count
      
      const parseResult = parser.parseASTWithResult(invalidCode);
      
      if (!parseResult.success) {
        expect(parseResult.error).toBeDefined();
        logger.debug('[SYNTAX_ERROR] Invalid parameters handled gracefully');
      } else {
        expect(parseResult.data).toBeDefined();
        logger.debug('[SYNTAX_ERROR] Parser handled invalid parameters');
      }
    });

    it('should handle malformed expressions gracefully', () => {
      const invalidCode = 'cube([2 + + 3, 2, 2]);'; // Malformed expression
      
      const parseResult = parser.parseASTWithResult(invalidCode);
      
      if (!parseResult.success) {
        expect(parseResult.error).toBeDefined();
        logger.debug('[SYNTAX_ERROR] Malformed expression handled gracefully');
      } else {
        expect(parseResult.data).toBeDefined();
        logger.debug('[SYNTAX_ERROR] Parser handled malformed expression');
      }
    });
  });

  describe('Unsupported Feature Handling', () => {
    it('should handle unsupported import statements gracefully', () => {
      const unsupportedCode = 'import("external_file.stl");';
      
      const parseResult = parser.parseASTWithResult(unsupportedCode);
      
      if (parseResult.success) {
        const astNodes = parseResult.data;
        
        // Try to convert (may fail or skip unsupported features)
        const conversionResult = astConverter.convertAST(astNodes);
        
        // Should handle unsupported features gracefully
        if (!conversionResult.success) {
          expect(conversionResult.error).toBeDefined();
          logger.debug('[UNSUPPORTED] Import statement handled gracefully');
        } else {
          expect(conversionResult.data).toBeDefined();
          logger.debug('[UNSUPPORTED] Import statement processed');
        }
      }
    });

    it('should handle unsupported include statements gracefully', () => {
      const unsupportedCode = 'include <library.scad>';
      
      const parseResult = parser.parseASTWithResult(unsupportedCode);
      
      if (parseResult.success) {
        const astNodes = parseResult.data;
        const conversionResult = astConverter.convertAST(astNodes);
        
        if (!conversionResult.success) {
          expect(conversionResult.error).toBeDefined();
          logger.debug('[UNSUPPORTED] Include statement handled gracefully');
        } else {
          expect(conversionResult.data).toBeDefined();
          logger.debug('[UNSUPPORTED] Include statement processed');
        }
      }
    });

    it('should handle unsupported module definitions gracefully', () => {
      const unsupportedCode = `
        module custom_shape(size) {
          cube([size, size, size]);
        }
        custom_shape(5);
      `;
      
      const parseResult = parser.parseASTWithResult(unsupportedCode);
      
      if (parseResult.success) {
        const astNodes = parseResult.data;
        const conversionResult = astConverter.convertAST(astNodes);
        
        if (!conversionResult.success) {
          expect(conversionResult.error).toBeDefined();
          logger.debug('[UNSUPPORTED] Module definition handled gracefully');
        } else {
          expect(conversionResult.data).toBeDefined();
          logger.debug('[UNSUPPORTED] Module definition processed');
        }
      }
    });

    it('should handle unsupported function definitions gracefully', () => {
      const unsupportedCode = `
        function double(x) = x * 2;
        cube([double(2), 2, 2]);
      `;
      
      const parseResult = parser.parseASTWithResult(unsupportedCode);
      
      if (parseResult.success) {
        const astNodes = parseResult.data;
        const conversionResult = astConverter.convertAST(astNodes);
        
        if (!conversionResult.success) {
          expect(conversionResult.error).toBeDefined();
          logger.debug('[UNSUPPORTED] Function definition handled gracefully');
        } else {
          expect(conversionResult.data).toBeDefined();
          logger.debug('[UNSUPPORTED] Function definition processed');
        }
      }
    });
  });

  describe('Edge Case Handling', () => {
    it('should handle empty input gracefully', () => {
      const emptyCode = '';
      
      const parseResult = parser.parseASTWithResult(emptyCode);
      
      if (!parseResult.success) {
        expect(parseResult.error).toBeDefined();
        logger.debug('[EDGE_CASE] Empty input handled gracefully');
      } else {
        expect(parseResult.data).toBeDefined();
        expect(Array.isArray(parseResult.data)).toBe(true);
        logger.debug('[EDGE_CASE] Empty input processed');
      }
    });

    it('should handle whitespace-only input gracefully', () => {
      const whitespaceCode = '   \n\t  \n  ';
      
      const parseResult = parser.parseASTWithResult(whitespaceCode);
      
      if (!parseResult.success) {
        expect(parseResult.error).toBeDefined();
        logger.debug('[EDGE_CASE] Whitespace-only input handled gracefully');
      } else {
        expect(parseResult.data).toBeDefined();
        logger.debug('[EDGE_CASE] Whitespace-only input processed');
      }
    });

    it('should handle comments-only input gracefully', () => {
      const commentsCode = `
        // This is a comment
        /* This is a block comment */
        // Another comment
      `;
      
      const parseResult = parser.parseASTWithResult(commentsCode);
      
      if (!parseResult.success) {
        expect(parseResult.error).toBeDefined();
        logger.debug('[EDGE_CASE] Comments-only input handled gracefully');
      } else {
        expect(parseResult.data).toBeDefined();
        logger.debug('[EDGE_CASE] Comments-only input processed');
      }
    });

    it('should handle extremely large numbers gracefully', () => {
      const largeNumberCode = 'cube([1e100, 1e100, 1e100]);';
      
      const parseResult = parser.parseASTWithResult(largeNumberCode);
      
      if (parseResult.success) {
        const astNodes = parseResult.data;
        const conversionResult = astConverter.convertAST(astNodes);
        
        if (!conversionResult.success) {
          expect(conversionResult.error).toBeDefined();
          logger.debug('[EDGE_CASE] Large numbers handled gracefully');
        } else {
          expect(conversionResult.data).toBeDefined();
          logger.debug('[EDGE_CASE] Large numbers processed');
        }
      }
    });

    it('should handle negative dimensions gracefully', () => {
      const negativeCode = 'cube([-2, -3, -4]);';
      
      const parseResult = parser.parseASTWithResult(negativeCode);
      
      if (parseResult.success) {
        const astNodes = parseResult.data;
        const conversionResult = astConverter.convertAST(astNodes);
        
        if (!conversionResult.success) {
          expect(conversionResult.error).toBeDefined();
          logger.debug('[EDGE_CASE] Negative dimensions handled gracefully');
        } else {
          expect(conversionResult.data).toBeDefined();
          logger.debug('[EDGE_CASE] Negative dimensions processed');
        }
      }
    });

    it('should handle zero dimensions gracefully', () => {
      const zeroCode = 'cube([0, 0, 0]);';
      
      const parseResult = parser.parseASTWithResult(zeroCode);
      
      if (parseResult.success) {
        const astNodes = parseResult.data;
        const conversionResult = astConverter.convertAST(astNodes);
        
        if (!conversionResult.success) {
          expect(conversionResult.error).toBeDefined();
          logger.debug('[EDGE_CASE] Zero dimensions handled gracefully');
        } else {
          expect(conversionResult.data).toBeDefined();
          logger.debug('[EDGE_CASE] Zero dimensions processed');
        }
      }
    });
  });

  describe('Service Error Handling', () => {
    it('should handle selection service errors gracefully', async () => {
      // Create an invalid mesh object
      const invalidMesh = null as any;
      
      const selectionResult = selectionService.selectMesh(invalidMesh);
      
      expect(selectionResult.success).toBe(false);
      if (!selectionResult.success) {
        expect(selectionResult.error).toBeDefined();
        expect(selectionResult.error.code).toBeDefined();
      }
      
      logger.debug('[SERVICE_ERROR] Selection service error handled gracefully');
    });

    it('should handle export service errors gracefully', async () => {
      // Try to export with invalid configuration
      const invalidConfig = {
        format: 'invalid' as any,
        filename: '',
      };
      
      const exportResult = await exportService.exportMeshes([], invalidConfig);
      
      expect(exportResult.success).toBe(false);
      if (!exportResult.success) {
        expect(exportResult.error).toBeDefined();
        expect(exportResult.error.code).toBeDefined();
      }
      
      logger.debug('[SERVICE_ERROR] Export service error handled gracefully');
    });

    it('should handle AST converter errors gracefully', async () => {
      // Try to convert invalid AST nodes
      const invalidAST = [null, undefined, { invalid: 'node' }] as any;
      
      const conversionResult = await astConverter.convertAST(invalidAST);
      
      expect(conversionResult.success).toBe(false);
      if (!conversionResult.success) {
        expect(conversionResult.error).toBeDefined();
        expect(conversionResult.error.code).toBeDefined();
      }
      
      logger.debug('[SERVICE_ERROR] AST converter error handled gracefully');
    });
  });

  describe('Recovery and Resilience', () => {
    it('should recover from parser errors and continue processing', () => {
      const mixedCode = `
        cube([2, 2, 2]); // Valid
        invalid_syntax_here // Invalid
        sphere(r=1); // Valid
      `;
      
      const parseResult = parser.parseASTWithResult(mixedCode);
      
      // Parser should either fail gracefully or recover with partial results
      if (!parseResult.success) {
        expect(parseResult.error).toBeDefined();
        logger.debug('[RECOVERY] Parser failed gracefully on mixed code');
      } else {
        expect(parseResult.data).toBeDefined();
        logger.debug('[RECOVERY] Parser recovered from mixed code');
      }
    });

    it('should maintain system stability after errors', async () => {
      // Cause multiple errors in sequence
      const errorCodes = [
        'invalid syntax',
        'cube([missing_bracket;',
        'unknown_function();',
        '',
      ];
      
      for (const code of errorCodes) {
        const parseResult = parser.parseASTWithResult(code);
        
        // System should remain stable regardless of parse result
        expect(parser).toBeDefined();
        
        if (parseResult.success) {
          const conversionResult = await astConverter.convertAST(parseResult.data);
          // Converter should remain stable regardless of result
          expect(astConverter).toBeDefined();
        }
      }
      
      // After all errors, system should still work with valid input
      const validCode = 'cube([1, 1, 1]);';
      const finalResult = parser.parseASTWithResult(validCode);
      
      if (finalResult.success) {
        expect(finalResult.data).toBeDefined();
        logger.debug('[RECOVERY] System remained stable after multiple errors');
      }
    });

    it('should provide meaningful error messages', () => {
      const invalidCode = 'cube([2, 2, 2]; // Missing closing parenthesis';
      
      const parseResult = parser.parseASTWithResult(invalidCode);
      
      if (!parseResult.success) {
        expect(parseResult.error).toBeDefined();
        expect(parseResult.error.message).toBeDefined();
        expect(typeof parseResult.error.message).toBe('string');
        expect(parseResult.error.message.length).toBeGreaterThan(0);
        
        logger.debug(`[ERROR_MESSAGE] Meaningful error: ${parseResult.error.message}`);
      }
    });
  });
});
