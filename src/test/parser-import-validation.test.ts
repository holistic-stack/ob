/**
 * Parser Import and Application Loading Validation Test
 *
 * This test validates that the application loads correctly without hanging
 * and that the parser initialization service prevents import hang issues.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getInitializedParser,
  getParserInitializationService,
  getParserState,
  initializeParser,
  isParserReady,
} from '../features/openscad-parser/services/parser-initialization.service.js';
import { createLogger } from '../shared/services/logger.service.js';

const logger = createLogger('ParserImportValidation');

// Mock the OpenscadParser to avoid actual WASM loading in tests
vi.mock('../features/openscad-parser/openscad-parser.js', () => ({
  OpenscadParser: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn(),
    parseAST: vi.fn().mockReturnValue([]),
    parseASTWithResult: vi.fn().mockReturnValue({ success: true, data: [] }),
  })),
}));

describe('Parser Import and Application Loading Validation', () => {
  beforeEach(() => {
    logger.init('Starting parser import validation test');

    // Reset the singleton instance before each test
    const service = getParserInitializationService();
    service.reset();
  });

  afterEach(() => {
    // Clean up after each test
    try {
      const service = getParserInitializationService();
      service.dispose();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Import Safety', () => {
    it('should not hang when importing parser modules', async () => {
      // This test verifies that importing the parser modules doesn't cause hanging
      logger.debug('Testing parser module imports');

      // The fact that we can import and call these functions without hanging
      // validates that the import structure is correct
      expect(typeof initializeParser).toBe('function');
      expect(typeof getInitializedParser).toBe('function');
      expect(typeof isParserReady).toBe('function');
      expect(typeof getParserState).toBe('function');

      logger.debug('✅ Parser module imports successful');
    });

    it('should handle parser initialization without hanging', async () => {
      logger.debug('Testing parser initialization without hanging');

      // Set a timeout to ensure the test doesn't hang
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Parser initialization timed out')), 5000);
      });

      const initPromise = initializeParser({
        timeoutMs: 1000, // Short timeout for testing
        retryAttempts: 1,
      });

      // Race between initialization and timeout
      const result = await Promise.race([initPromise, timeoutPromise]);

      expect(result.success).toBe(true);
      logger.debug('✅ Parser initialization completed without hanging');
    });

    it('should prevent multiple concurrent initialization calls', async () => {
      logger.debug('Testing concurrent initialization prevention');

      // Start multiple initialization calls simultaneously
      const promises = [
        initializeParser({ timeoutMs: 1000 }),
        initializeParser({ timeoutMs: 1000 }),
        initializeParser({ timeoutMs: 1000 }),
      ];

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      // All should return the same parser instance
      const parsers = results.map((r) => (r.success ? r.data : null));
      expect(parsers[0]).toBe(parsers[1]);
      expect(parsers[1]).toBe(parsers[2]);

      logger.debug('✅ Concurrent initialization handled correctly');
    });
  });

  describe('Application Loading Simulation', () => {
    it('should simulate successful application startup sequence', async () => {
      logger.debug('Simulating application startup sequence');

      // Step 1: Application starts, imports modules (already tested above)
      expect(getParserState()).toBe('not-initialized');
      expect(isParserReady()).toBe(false);
      expect(getInitializedParser()).toBeNull();

      // Step 2: User triggers parsing (e.g., types in editor)
      logger.debug('Simulating user triggering parse operation');
      const initResult = await initializeParser();
      expect(initResult.success).toBe(true);

      // Step 3: Parser should be ready for use
      expect(getParserState()).toBe('initialized');
      expect(isParserReady()).toBe(true);
      expect(getInitializedParser()).not.toBeNull();

      // Step 4: Subsequent operations should use existing parser
      const secondInitResult = await initializeParser();
      expect(secondInitResult.success).toBe(true);
      expect(secondInitResult.data).toBe(initResult.data);

      logger.debug('✅ Application startup sequence completed successfully');
    });

    it('should handle parser initialization failure gracefully', async () => {
      logger.debug('Testing graceful handling of initialization failure');

      // Mock parser initialization to fail
      const mockParser = {
        init: vi.fn().mockRejectedValue(new Error('WASM loading failed')),
        dispose: vi.fn(),
      };

      // Override the mock for this test
      const { OpenscadParser } = await import('../features/openscad-parser/openscad-parser.js');
      (OpenscadParser as any).mockImplementation(() => mockParser);

      const result = await initializeParser({
        retryAttempts: 1,
        retryDelayMs: 10,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Parser initialization failed');
      expect(getParserState()).toBe('failed');
      expect(isParserReady()).toBe(false);

      logger.debug('✅ Initialization failure handled gracefully');
    });
  });

  describe('Store Integration Simulation', () => {
    it('should simulate store-based parsing workflow', async () => {
      logger.debug('Simulating store-based parsing workflow');

      // This simulates what happens in the parsing slice

      // Step 1: Store action is called (parseCode)
      logger.debug('Simulating parseCode action call');

      // Step 2: Parser initialization is triggered
      const initResult = await initializeParser();
      expect(initResult.success).toBe(true);

      // Step 3: Parser is retrieved and used
      const parser = getInitializedParser();
      expect(parser).not.toBeNull();

      // Step 4: Parsing operation is performed
      if (parser) {
        const parseResult = parser.parseASTWithResult('cube(10);');
        expect(parseResult.success).toBe(true);
      }

      logger.debug('✅ Store-based parsing workflow completed successfully');
    });

    it('should handle rapid successive parse calls without issues', async () => {
      logger.debug('Testing rapid successive parse calls');

      // Simulate rapid successive calls like in a real editor
      const parseCalls = Array.from({ length: 5 }, async (_, i) => {
        logger.debug(`Parse call ${i + 1}`);

        const initResult = await initializeParser();
        expect(initResult.success).toBe(true);

        const parser = getInitializedParser();
        expect(parser).not.toBeNull();

        return parser;
      });

      const parsers = await Promise.all(parseCalls);

      // All should return the same parser instance
      parsers.forEach((parser, i) => {
        expect(parser).toBe(parsers[0]);
        logger.debug(`✅ Parse call ${i + 1} used same parser instance`);
      });

      logger.debug('✅ Rapid successive parse calls handled correctly');
    });
  });

  describe('Memory Management', () => {
    it('should properly clean up resources', async () => {
      logger.debug('Testing resource cleanup');

      // Initialize parser
      const initResult = await initializeParser();
      expect(initResult.success).toBe(true);

      const parser = getInitializedParser();
      expect(parser).not.toBeNull();

      // Clean up
      const service = getParserInitializationService();
      service.dispose();

      // Verify cleanup
      expect(getParserState()).toBe('not-initialized');
      expect(isParserReady()).toBe(false);
      expect(getInitializedParser()).toBeNull();

      logger.debug('✅ Resource cleanup completed successfully');
    });
  });
});
