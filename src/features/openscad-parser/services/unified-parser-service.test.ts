/**
 * @file Unified Parser Service Tests
 *
 * Comprehensive tests for the UnifiedParserService following TDD principles.
 * Uses real OpenSCAD parser instances (no mocks) as per project guidelines.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../shared/services/logger.service.js';
import type { UnifiedParserService } from './unified-parser-service.js';
import {
  createUnifiedParserService,
  disposeGlobalUnifiedParserService,
  getGlobalUnifiedParserService,
  parseOpenSCADCodeUnified,
} from './unified-parser-service.js';

const logger = createLogger('UnifiedParserServiceTest');

describe('UnifiedParserService', () => {
  let service: UnifiedParserService;

  beforeEach(() => {
    // Create fresh service instance for each test
    service = createUnifiedParserService({
      timeoutMs: 15000, // Longer timeout for tests
      enableLogging: false, // Disable logging in tests
      retryAttempts: 2,
      enableCaching: true,
      maxCacheSize: 10,
    });
  });

  afterEach(() => {
    // Clean up after each test
    service.dispose();
  });

  describe('Initialization', () => {
    it('should start in uninitialized state', () => {
      expect(service.getState()).toBe('uninitialized');
      expect(service.isReady()).toBe(false);
    });

    it('should transition to ready state after initialization', async () => {
      logger.debug('[DEBUG][Test] Testing initialization');

      await service.initialize();

      expect(service.getState()).toBe('ready');
      expect(service.isReady()).toBe(true);

      logger.debug('[END][Test] Initialization test completed');
    }, 30000);

    it('should handle multiple initialization calls gracefully', async () => {
      logger.debug('[DEBUG][Test] Testing multiple initialization calls');

      const init1 = service.initialize();
      const init2 = service.initialize();
      const init3 = service.initialize();

      await Promise.all([init1, init2, init3]);

      expect(service.getState()).toBe('ready');

      logger.debug('[END][Test] Multiple initialization test completed');
    }, 30000);
  });

  describe('Document Parsing', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should parse simple cube code successfully', async () => {
      logger.debug('[DEBUG][Test] Testing cube parsing');

      const code = 'cube([10,10,10]);';
      const result = await service.parseDocument(code);

      expect(result.success).toBe(true);

      if (result.success) {
        const parseResult = result.data;
        expect(parseResult.success).toBe(true);
        expect(parseResult.ast).toBeDefined();
        expect(parseResult.cst).toBeDefined();
        expect(parseResult.parseTime).toBeGreaterThan(0);

        if (parseResult.ast) {
          expect(parseResult.ast.length).toBeGreaterThan(0);
          logger.debug('[DEBUG][Test] Parsed AST:', parseResult.ast[0]);
        }
      }

      logger.debug('[END][Test] Cube parsing test completed');
    }, 30000);

    it('should parse sphere code successfully', async () => {
      logger.debug('[DEBUG][Test] Testing sphere parsing');

      const code = 'sphere(r=5);';
      const result = await service.parseDocument(code);

      expect(result.success).toBe(true);

      if (result.success) {
        const parseResult = result.data;
        expect(parseResult.success).toBe(true);
        expect(parseResult.ast).toBeDefined();

        if (parseResult.ast) {
          expect(parseResult.ast.length).toBeGreaterThan(0);
        }
      }

      logger.debug('[END][Test] Sphere parsing test completed');
    }, 30000);

    it('should handle empty code gracefully', async () => {
      logger.debug('[DEBUG][Test] Testing empty code parsing');

      const result = await service.parseDocument('');

      expect(result.success).toBe(true);

      if (result.success) {
        const parseResult = result.data;
        // Empty code might still have a valid CST structure
        expect(parseResult.cst).toBeDefined();
      }

      logger.debug('[END][Test] Empty code parsing test completed');
    }, 30000);

    it('should handle complex OpenSCAD code', async () => {
      logger.debug('[DEBUG][Test] Testing complex code parsing');

      const code = `
        module myModule(size = 10) {
          cube([size, size, size]);
        }
        
        function myFunction(x) = x * 2;
        
        myVar = 42;
        
        myModule(15);
        sphere(r=myFunction(5));
      `;

      const result = await service.parseDocument(code);

      expect(result.success).toBe(true);

      if (result.success) {
        const parseResult = result.data;
        expect(parseResult.cst).toBeDefined();
        expect(parseResult.ast).toBeDefined();
      }

      logger.debug('[END][Test] Complex code parsing test completed');
    }, 30000);

    it('should cache parse results', async () => {
      logger.debug('[DEBUG][Test] Testing parse result caching');

      const code = 'cube([5,5,5]);';

      // First parse
      const start1 = performance.now();
      const result1 = await service.parseDocument(code);
      const duration1 = performance.now() - start1;

      expect(result1.success).toBe(true);

      // Second parse (should be cached)
      const start2 = performance.now();
      const result2 = await service.parseDocument(code);
      const duration2 = performance.now() - start2;

      expect(result2.success).toBe(true);
      expect(duration2).toBeLessThan(duration1); // Should be faster due to caching

      logger.debug(
        `[DEBUG][Test] First parse: ${duration1.toFixed(2)}ms, Cached parse: ${duration2.toFixed(2)}ms`
      );
      logger.debug('[END][Test] Parse result caching test completed');
    }, 30000);
  });

  describe('Document State Management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should maintain document state after parsing', async () => {
      logger.debug('[DEBUG][Test] Testing document state management');

      const code = 'cube([10,10,10]);';
      const result = await service.parseDocument(code);

      expect(result.success).toBe(true);

      // Check that document state is maintained
      const ast = service.getAST();
      const errors = service.getLastErrors();
      const lastResult = service.getLastParseResult();

      expect(ast).toBeDefined();
      expect(errors).toBeDefined();
      expect(lastResult).toBeDefined();

      if (lastResult) {
        expect(lastResult.success).toBe(true);
      }

      logger.debug('[END][Test] Document state management test completed');
    }, 30000);

    it('should clear state on new parse', async () => {
      logger.debug('[DEBUG][Test] Testing state clearing on new parse');

      // First parse
      await service.parseDocument('cube([1,1,1]);');
      const firstAST = service.getAST();

      // Second parse
      await service.parseDocument('sphere(r=2);');
      const secondAST = service.getAST();

      expect(firstAST).not.toEqual(secondAST);

      logger.debug('[END][Test] State clearing test completed');
    }, 30000);
  });

  describe('Editor Integration Features', () => {
    beforeEach(async () => {
      await service.initialize();

      // Parse a complex document for testing editor features
      const code = `
        module testModule(size = 10) {
          cube([size, size, size]);
        }
        
        function testFunction(x) = x * 2;
        
        testVar = 42;
        
        testModule(15);
      `;

      await service.parseDocument(code);
    });

    it('should extract document outline', async () => {
      logger.debug('[DEBUG][Test] Testing document outline extraction');

      const outline = service.getDocumentOutline();

      expect(outline).toBeDefined();
      expect(outline.length).toBeGreaterThan(0);

      // Should find module, function, and variable
      const moduleItem = outline.find((item) => item.type === 'module');
      const functionItem = outline.find((item) => item.type === 'function');
      const variableItem = outline.find((item) => item.type === 'variable');

      expect(moduleItem).toBeDefined();
      expect(functionItem).toBeDefined();
      expect(variableItem).toBeDefined();

      if (moduleItem) {
        expect(moduleItem.name).toBe('testModule');
      }

      logger.debug('[DEBUG][Test] Found outline items:', outline.length);
      logger.debug('[END][Test] Document outline test completed');
    }, 30000);

    it('should extract document symbols', async () => {
      logger.debug('[DEBUG][Test] Testing document symbols extraction');

      const symbols = service.getDocumentSymbols();

      expect(symbols).toBeDefined();
      expect(symbols.length).toBeGreaterThan(0);

      // Should find symbols with documentation
      const moduleSymbol = symbols.find((symbol) => symbol.type === 'module');
      const functionSymbol = symbols.find((symbol) => symbol.type === 'function');
      const variableSymbol = symbols.find((symbol) => symbol.type === 'variable');

      expect(moduleSymbol).toBeDefined();
      expect(functionSymbol).toBeDefined();
      expect(variableSymbol).toBeDefined();

      if (moduleSymbol) {
        expect(moduleSymbol.documentation).toContain('testModule');
      }

      logger.debug('[DEBUG][Test] Found symbols:', symbols.length);
      logger.debug('[END][Test] Document symbols test completed');
    }, 30000);

    it('should provide hover information', async () => {
      logger.debug('[DEBUG][Test] Testing hover information');

      // Test hover at different positions
      const hoverInfo = service.getHoverInfo({ line: 1, column: 8, offset: 7 }); // Should be on 'testModule'

      if (hoverInfo) {
        expect(hoverInfo.contents).toBeDefined();
        expect(hoverInfo.contents.length).toBeGreaterThan(0);
        expect(hoverInfo.range).toBeDefined();

        logger.debug('[DEBUG][Test] Hover info:', hoverInfo.contents);
      }

      logger.debug('[END][Test] Hover information test completed');
    }, 30000);
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should handle syntax errors gracefully', async () => {
      logger.debug('[DEBUG][Test] Testing syntax error handling');

      const invalidCode = 'cube([invalid syntax here';
      const result = await service.parseDocument(invalidCode);

      expect(result.success).toBe(true); // Service call succeeds

      if (result.success) {
        const parseResult = result.data;
        // Parse result might indicate failure
        expect(parseResult.errors).toBeDefined();

        if (!parseResult.success) {
          expect(parseResult.errors.length).toBeGreaterThan(0);
          logger.debug('[DEBUG][Test] Parse errors:', parseResult.errors);
        }
      }

      logger.debug('[END][Test] Syntax error handling test completed');
    }, 30000);

    it('should handle initialization timeout gracefully', async () => {
      logger.debug('[DEBUG][Test] Testing initialization timeout');

      const timeoutService = createUnifiedParserService({
        timeoutMs: 1, // Very short timeout
        retryAttempts: 1,
        enableLogging: false,
      });

      try {
        await expect(timeoutService.initialize()).rejects.toThrow(/timeout/i);
        expect(timeoutService.getState()).toBe('error');
      } finally {
        timeoutService.dispose();
      }

      logger.debug('[END][Test] Initialization timeout test completed');
    }, 10000);
  });

  describe('Resource Management', () => {
    it('should dispose resources properly', () => {
      logger.debug('[DEBUG][Test] Testing resource disposal');

      service.dispose();

      expect(service.getState()).toBe('disposed');
      expect(service.isReady()).toBe(false);

      // Should clear all state
      expect(service.getAST()).toBeNull();
      expect(service.getLastErrors()).toEqual([]);
      expect(service.getLastParseResult()).toBeNull();

      logger.debug('[END][Test] Resource disposal test completed');
    });

    it('should handle multiple dispose calls safely', () => {
      logger.debug('[DEBUG][Test] Testing multiple dispose calls');

      service.dispose();
      service.dispose(); // Should not throw
      service.dispose(); // Should not throw

      expect(service.getState()).toBe('disposed');

      logger.debug('[END][Test] Multiple dispose test completed');
    });
  });

  describe('Factory Functions', () => {
    it('should create service with custom config', () => {
      logger.debug('[DEBUG][Test] Testing custom config creation');

      const customService = createUnifiedParserService({
        timeoutMs: 20000,
        retryAttempts: 5,
        enableLogging: true,
        enableCaching: false,
        maxCacheSize: 100,
      });

      expect(customService.getState()).toBe('uninitialized');

      customService.dispose();

      logger.debug('[END][Test] Custom config creation test completed');
    });

    it('should provide global service instance', () => {
      logger.debug('[DEBUG][Test] Testing global service instance');

      const global1 = getGlobalUnifiedParserService();
      const global2 = getGlobalUnifiedParserService();

      // Should return same instance
      expect(global1).toBe(global2);

      disposeGlobalUnifiedParserService();

      // Should create new instance after disposal
      const global3 = getGlobalUnifiedParserService();
      expect(global3).not.toBe(global1);

      disposeGlobalUnifiedParserService();

      logger.debug('[END][Test] Global service instance test completed');
    });

    it('should work with convenience function', async () => {
      logger.debug('[DEBUG][Test] Testing convenience function');

      const result = await parseOpenSCADCodeUnified('cube([3,3,3]);');

      expect(result.success).toBe(true);

      if (result.success) {
        const parseResult = result.data;
        expect(parseResult.ast).toBeDefined();
        expect(parseResult.cst).toBeDefined();
      }

      disposeGlobalUnifiedParserService();

      logger.debug('[END][Test] Convenience function test completed');
    }, 30000);
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should parse code within reasonable time', async () => {
      logger.debug('[DEBUG][Test] Testing parsing performance');

      const code = 'cube([10,10,10]); sphere(r=5); cylinder(r=3, h=10);';
      const startTime = performance.now();

      const result = await service.parseDocument(code);

      const duration = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should parse within 5 seconds

      if (result.success) {
        expect(result.data.parseTime).toBeGreaterThan(0);
      }

      logger.debug(`[DEBUG][Test] Total time: ${duration.toFixed(2)}ms`);
      logger.debug('[END][Test] Parsing performance test completed');
    }, 30000);
  });
});
