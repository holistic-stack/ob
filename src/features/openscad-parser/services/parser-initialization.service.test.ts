import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLogger } from '../../../shared/services/logger.service.js';
import { OpenscadParser } from '../openscad-parser.js';
import {
  getInitializedParser,
  getParserInitializationService,
  getParserState,
  initializeParser,
  isParserReady,
} from './parser-initialization.service.js';

const logger = createLogger('ParserInitializationServiceTest');

// Mock the OpenscadParser
vi.mock('../openscad-parser.js', () => ({
  OpenscadParser: vi.fn().mockImplementation(() => ({
    init: vi.fn(),
    dispose: vi.fn(),
  })),
}));

describe('ParserInitializationService', () => {
  let mockParser: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock parser instance
    mockParser = {
      init: vi.fn().mockResolvedValue(undefined),
      dispose: vi.fn(),
    };

    // Mock the OpenscadParser constructor
    (OpenscadParser as any).mockImplementation(() => mockParser);

    // Reset the singleton instance
    (getParserInitializationService as any).instance = null;
  });

  afterEach(() => {
    // Clean up any existing service instance
    try {
      const service = getParserInitializationService();
      service.dispose();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const service1 = getParserInitializationService();
      const service2 = getParserInitializationService();

      expect(service1).toBe(service2);
      logger.debug('✅ Singleton pattern working correctly');
    });

    it('should maintain state across multiple getInstance calls', async () => {
      const service1 = getParserInitializationService();

      // Initialize through first instance
      const result = await service1.initialize();
      expect(result.success).toBe(true);

      // Get second instance and check state
      const service2 = getParserInitializationService();
      expect(service2.getState()).toBe('initialized');
      expect(service2.isReady()).toBe(true);

      logger.debug('✅ State maintained across singleton instances');
    });
  });

  describe('Parser Initialization', () => {
    it('should successfully initialize parser on first call', async () => {
      const result = await initializeParser();

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockParser);
      expect(mockParser.init).toHaveBeenCalledTimes(1);
      expect(mockParser.init).toHaveBeenCalledWith(
        './tree-sitter-openscad.wasm',
        './tree-sitter.wasm'
      );

      logger.debug('✅ Parser initialization successful');
    });

    it('should return existing parser on subsequent calls', async () => {
      // First initialization
      const result1 = await initializeParser();
      expect(result1.success).toBe(true);

      // Second initialization should return same parser without re-initializing
      const result2 = await initializeParser();
      expect(result2.success).toBe(true);
      expect(result2.data).toBe(result1.data);
      expect(mockParser.init).toHaveBeenCalledTimes(1); // Should not be called again

      logger.debug('✅ Subsequent calls return existing parser');
    });

    it('should handle initialization failure with retry logic', async () => {
      // Mock parser init to fail
      mockParser.init.mockRejectedValue(new Error('WASM loading failed'));

      const result = await initializeParser({
        retryAttempts: 2,
        retryDelayMs: 10, // Short delay for testing
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Parser initialization failed after 2 attempts');
      expect(mockParser.init).toHaveBeenCalledTimes(2); // Should retry

      logger.debug('✅ Initialization failure handled with retries');
    });

    it('should handle timeout during initialization', async () => {
      // Mock parser init to hang (never resolve)
      mockParser.init.mockImplementation(() => new Promise(() => {}));

      const result = await initializeParser({
        timeoutMs: 100, // Short timeout for testing
        retryAttempts: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out after 100ms');

      logger.debug('✅ Timeout handling working correctly');
    });

    it('should use custom configuration', async () => {
      const customConfig = {
        wasmPath: '/custom/tree-sitter-openscad.wasm',
        treeSitterWasmPath: '/custom/tree-sitter.wasm',
      };

      const result = await initializeParser(customConfig);

      expect(result.success).toBe(true);
      expect(mockParser.init).toHaveBeenCalledWith(
        customConfig.wasmPath,
        customConfig.treeSitterWasmPath
      );

      logger.debug('✅ Custom configuration applied correctly');
    });
  });

  describe('State Management', () => {
    it('should track initialization state correctly', async () => {
      const service = getParserInitializationService();

      // Initial state
      expect(service.getState()).toBe('not-initialized');
      expect(service.isReady()).toBe(false);
      expect(service.getParser()).toBeNull();

      // During initialization
      const initPromise = service.initialize();
      expect(service.getState()).toBe('initializing');
      expect(service.isReady()).toBe(false);

      // After initialization
      await initPromise;
      expect(service.getState()).toBe('initialized');
      expect(service.isReady()).toBe(true);
      expect(service.getParser()).toBe(mockParser);

      logger.debug('✅ State transitions working correctly');
    });

    it('should handle failed state correctly', async () => {
      mockParser.init.mockRejectedValue(new Error('Init failed'));

      const service = getParserInitializationService();
      await service.initialize({ retryAttempts: 1 });

      expect(service.getState()).toBe('failed');
      expect(service.isReady()).toBe(false);
      expect(service.getParser()).toBeNull();

      logger.debug('✅ Failed state handled correctly');
    });
  });

  describe('Utility Functions', () => {
    it('should provide correct utility function results', async () => {
      // Before initialization
      expect(isParserReady()).toBe(false);
      expect(getInitializedParser()).toBeNull();
      expect(getParserState()).toBe('not-initialized');

      // After initialization
      await initializeParser();
      expect(isParserReady()).toBe(true);
      expect(getInitializedParser()).toBe(mockParser);
      expect(getParserState()).toBe('initialized');

      logger.debug('✅ Utility functions working correctly');
    });
  });

  describe('Resource Management', () => {
    it('should properly dispose of resources', async () => {
      const service = getParserInitializationService();
      await service.initialize();

      expect(service.isReady()).toBe(true);

      service.dispose();

      expect(service.getState()).toBe('not-initialized');
      expect(service.isReady()).toBe(false);
      expect(service.getParser()).toBeNull();
      expect(mockParser.dispose).toHaveBeenCalledTimes(1);

      logger.debug('✅ Resource disposal working correctly');
    });

    it('should handle reset correctly', async () => {
      const service = getParserInitializationService();
      await service.initialize();

      service.reset();

      expect(service.getState()).toBe('not-initialized');
      expect(service.isReady()).toBe(false);
      expect(service.getParser()).toBeNull();

      logger.debug('✅ Reset functionality working correctly');
    });
  });

  describe('Concurrent Initialization', () => {
    it('should handle concurrent initialization calls correctly', async () => {
      // Start multiple initialization calls simultaneously
      const promises = [initializeParser(), initializeParser(), initializeParser()];

      const results = await Promise.all(promises);

      // All should succeed and return the same parser
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.data).toBe(mockParser);
      });

      // Parser should only be initialized once
      expect(mockParser.init).toHaveBeenCalledTimes(1);

      logger.debug('✅ Concurrent initialization handled correctly');
    });
  });
});
