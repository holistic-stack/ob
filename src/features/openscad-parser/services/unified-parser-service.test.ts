/**
 * @file Unified Parser Service Tests
 * 
 * Comprehensive tests for the UnifiedParserService following TDD principles.
 * Uses real OpenSCAD parser instances (no mocks) as per project guidelines.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  UnifiedParserService, 
  createUnifiedParserService, 
  getGlobalUnifiedParserService, 
  disposeGlobalUnifiedParserService,
  parseOpenSCADCodeUnified
} from './unified-parser-service';

describe('UnifiedParserService', () => {
  let service: UnifiedParserService;

  beforeEach(() => {
    // Create fresh service instance for each test
    service = createUnifiedParserService({
      timeoutMs: 15000, // Longer timeout for tests
      enableLogging: false, // Disable logging in tests
      retryAttempts: 2,
      enableCaching: true,
      maxCacheSize: 10
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
      console.log('[DEBUG][Test] Testing initialization');
      
      await service.initialize();
      
      expect(service.getState()).toBe('ready');
      expect(service.isReady()).toBe(true);
      
      console.log('[END][Test] Initialization test completed');
    }, 30000);

    it('should handle multiple initialization calls gracefully', async () => {
      console.log('[DEBUG][Test] Testing multiple initialization calls');
      
      const init1 = service.initialize();
      const init2 = service.initialize();
      const init3 = service.initialize();
      
      await Promise.all([init1, init2, init3]);
      
      expect(service.getState()).toBe('ready');
      
      console.log('[END][Test] Multiple initialization test completed');
    }, 30000);
  });

  describe('Document Parsing', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should parse simple cube code successfully', async () => {
      console.log('[DEBUG][Test] Testing cube parsing');
      
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
          console.log('[DEBUG][Test] Parsed AST:', parseResult.ast[0]);
        }
      }
      
      console.log('[END][Test] Cube parsing test completed');
    }, 30000);

    it('should parse sphere code successfully', async () => {
      console.log('[DEBUG][Test] Testing sphere parsing');
      
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
      
      console.log('[END][Test] Sphere parsing test completed');
    }, 30000);

    it('should handle empty code gracefully', async () => {
      console.log('[DEBUG][Test] Testing empty code parsing');
      
      const result = await service.parseDocument('');
      
      expect(result.success).toBe(true);
      
      if (result.success) {
        const parseResult = result.data;
        // Empty code might still have a valid CST structure
        expect(parseResult.cst).toBeDefined();
      }
      
      console.log('[END][Test] Empty code parsing test completed');
    }, 30000);

    it('should handle complex OpenSCAD code', async () => {
      console.log('[DEBUG][Test] Testing complex code parsing');
      
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
      
      console.log('[END][Test] Complex code parsing test completed');
    }, 30000);

    it('should cache parse results', async () => {
      console.log('[DEBUG][Test] Testing parse result caching');
      
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
      
      console.log(`[DEBUG][Test] First parse: ${duration1.toFixed(2)}ms, Cached parse: ${duration2.toFixed(2)}ms`);
      console.log('[END][Test] Parse result caching test completed');
    }, 30000);
  });

  describe('Document State Management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should maintain document state after parsing', async () => {
      console.log('[DEBUG][Test] Testing document state management');
      
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
      
      console.log('[END][Test] Document state management test completed');
    }, 30000);

    it('should clear state on new parse', async () => {
      console.log('[DEBUG][Test] Testing state clearing on new parse');
      
      // First parse
      await service.parseDocument('cube([1,1,1]);');
      const firstAST = service.getAST();
      
      // Second parse
      await service.parseDocument('sphere(r=2);');
      const secondAST = service.getAST();
      
      expect(firstAST).not.toEqual(secondAST);
      
      console.log('[END][Test] State clearing test completed');
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
      console.log('[DEBUG][Test] Testing document outline extraction');
      
      const outline = service.getDocumentOutline();
      
      expect(outline).toBeDefined();
      expect(outline.length).toBeGreaterThan(0);
      
      // Should find module, function, and variable
      const moduleItem = outline.find(item => item.type === 'module');
      const functionItem = outline.find(item => item.type === 'function');
      const variableItem = outline.find(item => item.type === 'variable');
      
      expect(moduleItem).toBeDefined();
      expect(functionItem).toBeDefined();
      expect(variableItem).toBeDefined();
      
      if (moduleItem) {
        expect(moduleItem.name).toBe('testModule');
      }
      
      console.log('[DEBUG][Test] Found outline items:', outline.length);
      console.log('[END][Test] Document outline test completed');
    }, 30000);

    it('should extract document symbols', async () => {
      console.log('[DEBUG][Test] Testing document symbols extraction');
      
      const symbols = service.getDocumentSymbols();
      
      expect(symbols).toBeDefined();
      expect(symbols.length).toBeGreaterThan(0);
      
      // Should find symbols with documentation
      const moduleSymbol = symbols.find(symbol => symbol.type === 'module');
      const functionSymbol = symbols.find(symbol => symbol.type === 'function');
      const variableSymbol = symbols.find(symbol => symbol.type === 'variable');
      
      expect(moduleSymbol).toBeDefined();
      expect(functionSymbol).toBeDefined();
      expect(variableSymbol).toBeDefined();
      
      if (moduleSymbol) {
        expect(moduleSymbol.documentation).toContain('testModule');
      }
      
      console.log('[DEBUG][Test] Found symbols:', symbols.length);
      console.log('[END][Test] Document symbols test completed');
    }, 30000);

    it('should provide hover information', async () => {
      console.log('[DEBUG][Test] Testing hover information');
      
      // Test hover at different positions
      const hoverInfo = service.getHoverInfo({ line: 1, column: 8, offset: 7 }); // Should be on 'testModule'
      
      if (hoverInfo) {
        expect(hoverInfo.contents).toBeDefined();
        expect(hoverInfo.contents.length).toBeGreaterThan(0);
        expect(hoverInfo.range).toBeDefined();
        
        console.log('[DEBUG][Test] Hover info:', hoverInfo.contents);
      }
      
      console.log('[END][Test] Hover information test completed');
    }, 30000);
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should handle syntax errors gracefully', async () => {
      console.log('[DEBUG][Test] Testing syntax error handling');
      
      const invalidCode = 'cube([invalid syntax here';
      const result = await service.parseDocument(invalidCode);
      
      expect(result.success).toBe(true); // Service call succeeds
      
      if (result.success) {
        const parseResult = result.data;
        // Parse result might indicate failure
        expect(parseResult.errors).toBeDefined();
        
        if (!parseResult.success) {
          expect(parseResult.errors.length).toBeGreaterThan(0);
          console.log('[DEBUG][Test] Parse errors:', parseResult.errors);
        }
      }
      
      console.log('[END][Test] Syntax error handling test completed');
    }, 30000);

    it('should handle initialization timeout gracefully', async () => {
      console.log('[DEBUG][Test] Testing initialization timeout');
      
      const timeoutService = createUnifiedParserService({
        timeoutMs: 1, // Very short timeout
        retryAttempts: 1,
        enableLogging: false
      });
      
      try {
        await expect(timeoutService.initialize()).rejects.toThrow(/timeout/i);
        expect(timeoutService.getState()).toBe('error');
      } finally {
        timeoutService.dispose();
      }
      
      console.log('[END][Test] Initialization timeout test completed');
    }, 10000);
  });

  describe('Resource Management', () => {
    it('should dispose resources properly', () => {
      console.log('[DEBUG][Test] Testing resource disposal');
      
      service.dispose();
      
      expect(service.getState()).toBe('disposed');
      expect(service.isReady()).toBe(false);
      
      // Should clear all state
      expect(service.getAST()).toBeNull();
      expect(service.getLastErrors()).toEqual([]);
      expect(service.getLastParseResult()).toBeNull();
      
      console.log('[END][Test] Resource disposal test completed');
    });

    it('should handle multiple dispose calls safely', () => {
      console.log('[DEBUG][Test] Testing multiple dispose calls');
      
      service.dispose();
      service.dispose(); // Should not throw
      service.dispose(); // Should not throw
      
      expect(service.getState()).toBe('disposed');
      
      console.log('[END][Test] Multiple dispose test completed');
    });
  });

  describe('Factory Functions', () => {
    it('should create service with custom config', () => {
      console.log('[DEBUG][Test] Testing custom config creation');
      
      const customService = createUnifiedParserService({
        timeoutMs: 20000,
        retryAttempts: 5,
        enableLogging: true,
        enableCaching: false,
        maxCacheSize: 100
      });
      
      expect(customService.getState()).toBe('uninitialized');
      
      customService.dispose();
      
      console.log('[END][Test] Custom config creation test completed');
    });

    it('should provide global service instance', () => {
      console.log('[DEBUG][Test] Testing global service instance');
      
      const global1 = getGlobalUnifiedParserService();
      const global2 = getGlobalUnifiedParserService();
      
      // Should return same instance
      expect(global1).toBe(global2);
      
      disposeGlobalUnifiedParserService();
      
      // Should create new instance after disposal
      const global3 = getGlobalUnifiedParserService();
      expect(global3).not.toBe(global1);
      
      disposeGlobalUnifiedParserService();
      
      console.log('[END][Test] Global service instance test completed');
    });

    it('should work with convenience function', async () => {
      console.log('[DEBUG][Test] Testing convenience function');
      
      const result = await parseOpenSCADCodeUnified('cube([3,3,3]);');
      
      expect(result.success).toBe(true);
      
      if (result.success) {
        const parseResult = result.data;
        expect(parseResult.ast).toBeDefined();
        expect(parseResult.cst).toBeDefined();
      }
      
      disposeGlobalUnifiedParserService();
      
      console.log('[END][Test] Convenience function test completed');
    }, 30000);
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should parse code within reasonable time', async () => {
      console.log('[DEBUG][Test] Testing parsing performance');
      
      const code = 'cube([10,10,10]); sphere(r=5); cylinder(r=3, h=10);';
      const startTime = performance.now();
      
      const result = await service.parseDocument(code);
      
      const duration = performance.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should parse within 5 seconds
      
      if (result.success) {
        expect(result.data.parseTime).toBeGreaterThan(0);
      }
      
      console.log(`[DEBUG][Test] Total time: ${duration.toFixed(2)}ms`);
      console.log('[END][Test] Parsing performance test completed');
    }, 30000);
  });
});
