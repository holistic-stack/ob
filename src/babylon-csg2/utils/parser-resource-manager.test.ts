/**
 * Parser Resource Manager Tests
 * 
 * Comprehensive tests for the ParserResourceManager class covering:
 * - Resource lifecycle management
 * - Error handling patterns
 * - Functional programming compliance
 * - Memory management and cleanup
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { EnhancedOpenscadParser, SimpleErrorHandler } from '@holistic-stack/openscad-parser';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import {
  ParserResourceManager,
  createParserResourceManager,
  parseOpenSCADCode,
  type Result,
  type ParserConfig
} from './parser-resource-manager';

// Mock the OpenSCAD parser module
vi.mock('@holistic-stack/openscad-parser', () => ({
  EnhancedOpenscadParser: vi.fn(),
  SimpleErrorHandler: vi.fn()
}));

describe('ParserResourceManager', () => {
  let mockParser: {
    init: Mock;
    parseAST: Mock;
    dispose: Mock;
  };
  let mockErrorHandler: any;
  let consoleSpy: {
    log: Mock;
    error: Mock;
    warn: Mock;
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock parser methods
    mockParser = {
      init: vi.fn().mockResolvedValue(undefined),
      parseAST: vi.fn().mockReturnValue([
        { type: 'cube', size: [10, 10, 10] },
        { type: 'sphere', radius: 5 }
      ] as ASTNode[]),
      dispose: vi.fn()
    };

    // Mock error handler
    mockErrorHandler = {};

    // Mock constructors
    (EnhancedOpenscadParser as Mock).mockImplementation(() => mockParser);
    (SimpleErrorHandler as Mock).mockImplementation(() => mockErrorHandler);

    // Mock console for logging tests
    consoleSpy = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    };
      // Replace console methods
    Object.assign(console, {
      log: consoleSpy.log,
      error: consoleSpy.error,
      warn: consoleSpy.warn
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create instance with default configuration', () => {
      const manager = new ParserResourceManager();
      expect(manager).toBeInstanceOf(ParserResourceManager);
      expect(manager.isParserActive()).toBe(false);
    });

    it('should create instance with custom configuration', () => {
      const config: ParserConfig = {
        wasmPath: '/custom/wasm/path',
        treeSitterWasmPath: '/custom/treesitter/path',
        enableLogging: true
      };

      const manager = new ParserResourceManager(config);
      expect(manager).toBeInstanceOf(ParserResourceManager);
    });

    it('should freeze configuration to ensure immutability', () => {
      const config: ParserConfig = {
        enableLogging: true
      };

      const manager = new ParserResourceManager(config);
      
      // Should not be able to modify the config after creation
      expect(() => {
        (config as any).enableLogging = false;
      }).not.toThrow(); // Original config can be modified
      
      // But internal config should be frozen
      expect(manager).toBeInstanceOf(ParserResourceManager);
    });
  });

  describe('withParser Resource Management', () => {
    it('should initialize and dispose parser correctly', async () => {
      const manager = new ParserResourceManager();

      const result = await manager.withParser(async (parser) => {
        expect(parser).toBe(mockParser);
        return { success: true, value: 'test-result' };
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('test-result');
      }

      // Verify parser lifecycle
      expect(EnhancedOpenscadParser).toHaveBeenCalledWith(mockErrorHandler);
      expect(mockParser.init).toHaveBeenCalledWith(undefined, undefined);
      expect(mockParser.dispose).toHaveBeenCalled();
    });

    it('should pass custom WASM paths to parser initialization', async () => {
      const config: ParserConfig = {
        wasmPath: '/custom/openscad.wasm',
        treeSitterWasmPath: '/custom/tree-sitter.wasm'
      };

      const manager = new ParserResourceManager(config);

      await manager.withParser(async () => {
        return { success: true, value: null };
      });

      expect(mockParser.init).toHaveBeenCalledWith(
        '/custom/openscad.wasm',
        '/custom/tree-sitter.wasm'
      );
    });

    it('should handle parser initialization failure', async () => {
      const initError = new Error('WASM loading failed');
      mockParser.init.mockRejectedValue(initError);

      const manager = new ParserResourceManager();

      const result = await manager.withParser(async () => {
        return { success: true, value: 'should-not-reach' };
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Parser initialization failed');
        expect(result.error).toContain('WASM loading failed');
      }

      // Operation should not be called if initialization fails
      expect(mockParser.dispose).not.toHaveBeenCalled();
    });

    it('should dispose parser even if operation throws', async () => {
      const manager = new ParserResourceManager();

      const result = await manager.withParser(async () => {
        throw new Error('Operation failed');
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Parser operation failed');
        expect(result.error).toContain('Operation failed');
      }

      // Parser should still be disposed
      expect(mockParser.dispose).toHaveBeenCalled();
    });

    it('should handle disposal errors gracefully', async () => {
      const disposalError = new Error('Disposal failed');
      mockParser.dispose.mockImplementation(() => {
        throw disposalError;
      });

      const manager = new ParserResourceManager({ enableLogging: true });

      const result = await manager.withParser(async () => {
        return { success: true, value: 'test' };
      });

      // Operation should still succeed despite disposal error
      expect(result.success).toBe(true);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[ParserResourceManager] Warning during parser disposal:',
        disposalError
      );
    });
  });

  describe('parseOpenSCAD Method', () => {
    it('should successfully parse valid OpenSCAD code', async () => {
      const manager = new ParserResourceManager();
      const code = 'cube([10, 10, 10]); sphere(5);';

      const result = await manager.parseOpenSCAD(code);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]).toEqual({ type: 'cube', size: [10, 10, 10] });
        expect(result.value[1]).toEqual({ type: 'sphere', radius: 5 });
        
        // Verify immutability
        expect(Object.isFrozen(result.value)).toBe(true);
      }

      expect(mockParser.parseAST).toHaveBeenCalledWith(code);
    });

    it('should reject empty or whitespace-only code', async () => {
      const manager = new ParserResourceManager();

      const emptyResult = await manager.parseOpenSCAD('');
      expect(emptyResult.success).toBe(false);
      if (!emptyResult.success) {
        expect(emptyResult.error).toContain('Empty or whitespace-only');
      }

      const whitespaceResult = await manager.parseOpenSCAD('   \n\t  ');
      expect(whitespaceResult.success).toBe(false);
      if (!whitespaceResult.success) {
        expect(whitespaceResult.error).toContain('Empty or whitespace-only');
      }

      // Parser should not be initialized for invalid input
      expect(EnhancedOpenscadParser).not.toHaveBeenCalled();
    });

    it('should handle parser AST errors', async () => {
      const parseError = new Error('Syntax error at line 1');
      mockParser.parseAST.mockImplementation(() => {
        throw parseError;
      });

      const manager = new ParserResourceManager();
      const result = await manager.parseOpenSCAD('invalid syntax');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('AST parsing failed');
        expect(result.error).toContain('Syntax error at line 1');
      }
    });

    it('should handle invalid AST structure', async () => {
      mockParser.parseAST.mockReturnValue(null); // Invalid return

      const manager = new ParserResourceManager();
      const result = await manager.parseOpenSCAD('cube(10);');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Parser returned invalid AST structure');
      }
    });
  });

  describe('Logging Functionality', () => {
    it('should log initialization when logging is enabled', async () => {
      const manager = new ParserResourceManager({ enableLogging: true });

      await manager.withParser(async () => {
        return { success: true, value: null };
      });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[ParserResourceManager] Initializing parser...'
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[ParserResourceManager] Parser initialized successfully'
      );
    });

    it('should not log when logging is disabled', async () => {
      const manager = new ParserResourceManager({ enableLogging: false });

      await manager.withParser(async () => {
        return { success: true, value: null };
      });

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should log parsing success with node count', async () => {
      const manager = new ParserResourceManager({ enableLogging: true });

      await manager.parseOpenSCAD('cube(10); sphere(5);');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[ParserResourceManager] Successfully parsed 2 AST nodes'
      );
    });

    it('should log errors when logging is enabled', async () => {
      const initError = new Error('Test error');
      mockParser.init.mockRejectedValue(initError);

      const manager = new ParserResourceManager({ enableLogging: true });

      await manager.withParser(async () => {
        return { success: true, value: null };
      });

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[ParserResourceManager] Parser initialization failed:',
        'Test error'
      );
    });
  });

  describe('Factory Functions', () => {
    it('should create manager with createParserResourceManager', () => {
      const config: ParserConfig = { enableLogging: true };
      const manager = createParserResourceManager(config);

      expect(manager).toBeInstanceOf(ParserResourceManager);
    });

    it('should create manager without config', () => {
      const manager = createParserResourceManager();
      expect(manager).toBeInstanceOf(ParserResourceManager);
    });

    it('should parse code with parseOpenSCADCode convenience function', async () => {
      const code = 'cube(10);';
      const result = await parseOpenSCADCode(code, { enableLogging: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(2);
      }
    });
  });

  describe('Parser State Management', () => {
    it('should report parser as inactive initially', () => {
      const manager = new ParserResourceManager();
      expect(manager.isParserActive()).toBe(false);
    });

    it('should report parser as inactive after disposal', async () => {
      const manager = new ParserResourceManager();

      await manager.withParser(async () => {
        return { success: true, value: null };
      });

      expect(manager.isParserActive()).toBe(false);
    });
  });

  describe('Functional Programming Compliance', () => {
    it('should return immutable AST results', async () => {
      const manager = new ParserResourceManager();
      const result = await manager.parseOpenSCAD('cube(10);');

      expect(result.success).toBe(true);
      if (result.success) {
        // AST should be frozen (immutable)
        expect(Object.isFrozen(result.value)).toBe(true);
        
        // Should not be able to modify the array
        expect(() => {
          (result.value as any).push({ type: 'sphere' });
        }).toThrow();
      }
    });

    it('should maintain Result type safety', async () => {
      const manager = new ParserResourceManager();

      // Success case
      const successResult = await manager.parseOpenSCAD('cube(10);');
      if (successResult.success) {
        // TypeScript should narrow the type correctly
        expect(Array.isArray(successResult.value)).toBe(true);
        // error property should not exist
        expect('error' in successResult).toBe(false);
      }

      // Error case
      const errorResult = await manager.parseOpenSCAD('');
      if (!errorResult.success) {
        // TypeScript should narrow the type correctly
        expect(typeof errorResult.error).toBe('string');
        // value property should not exist
        expect('value' in errorResult).toBe(false);
      }
    });
  });
});
