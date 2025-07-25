/**
 * App Store Parser Integration Test
 *
 * Tests the integration between the app store and the parser initialization service
 * to ensure proper initialization and prevent import hang issues.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLogger } from '../../shared/services/logger.service.js';
import { getParserInitializationService } from '../openscad-parser/services/parser-initialization.service.js';
import { createAppStore } from './app-store.js';

const logger = createLogger('AppStoreParserIntegration');

// Mock the OpenscadParser to avoid actual WASM loading in tests
vi.mock('../openscad-parser/openscad-parser.js', () => ({
  OpenscadParser: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn(),
    parseAST: vi.fn().mockReturnValue([]),
    parseASTWithResult: vi.fn().mockReturnValue({ success: true, data: [] }),
  })),
}));

describe('App Store Parser Integration', () => {
  let store: ReturnType<typeof createAppStore>;

  beforeEach(() => {
    logger.init('Setting up app store parser integration test');

    // Reset the parser initialization service
    const service = getParserInitializationService();
    service.reset();

    // Create a fresh store instance
    store = createAppStore({
      enableDevtools: false,
      enablePersistence: false,
      debounceConfig: {
        parseDelayMs: 0, // No debounce for testing
        renderDelayMs: 0,
        saveDelayMs: 0,
      },
    });

    // Clear any residual parsing state
    store.getState().clearParsingState();
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

  describe('Store Creation', () => {
    it('should create store without hanging or errors', () => {
      logger.debug('Testing store creation');

      // Store should be created successfully
      expect(store).toBeDefined();
      expect(typeof store.getState).toBe('function');
      expect(typeof store.setState).toBe('function');

      // Initial state should be correct
      const state = store.getState();
      expect(state.parsing.isLoading).toBe(false);
      expect(state.parsing.errors).toEqual([]);
      expect(state.parsing.ast).toEqual([]);

      logger.debug('✅ Store created successfully without hanging');
    });

    it('should have parsing actions available', () => {
      logger.debug('Testing parsing actions availability');

      const state = store.getState();
      expect(typeof state.parseCode).toBe('function');

      logger.debug('✅ Parsing actions available');
    });
  });

  describe('Parser Integration', () => {
    it('should handle parseCode action without hanging', async () => {
      logger.debug('Testing parseCode action');

      const state = store.getState();

      // Call parseCode - this should trigger parser initialization
      const result = await state.parseCode('cube(10);');

      // Should complete successfully
      expect(result.success).toBe(true);

      // Store state should be updated
      const updatedState = store.getState();
      expect(updatedState.parsing.isLoading).toBe(false);
      expect(updatedState.parsing.errors).toEqual([]);

      logger.debug('✅ parseCode action completed without hanging');
    });

    it('should handle multiple parseCode calls correctly', async () => {
      logger.debug('Testing multiple parseCode calls');

      const state = store.getState();

      // Make multiple parse calls
      const results = await Promise.all([
        state.parseCode('cube(5);'),
        state.parseCode('sphere(10);'),
        state.parseCode('cylinder(h=20, r=5);'),
      ]);

      // All should succeed
      results.forEach((result, i) => {
        expect(result.success).toBe(true);
        logger.debug(`✅ Parse call ${i + 1} succeeded`);
      });

      logger.debug('✅ Multiple parseCode calls handled correctly');
    });

    it.skip('should handle parser initialization failure gracefully', async () => {
      logger.debug('Testing parser initialization failure handling');

      // Mock parser initialization to fail
      const mockParser = {
        init: vi.fn().mockRejectedValue(new Error('WASM loading failed')),
        dispose: vi.fn(),
      };

      // Override the mock for this test
      const { OpenscadParser } = await import('../openscad-parser/openscad-parser.js');
      (OpenscadParser as any).mockImplementation(() => mockParser);

      const state = store.getState();
      const result = await state.parseCode('cube(10);');

      // Should fail gracefully
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.error.code).toContain('PARSER_INIT_FAILED');
      }

      // Store should reflect the error
      const updatedState = store.getState();
      expect(updatedState.parsing.isLoading).toBe(false);
      expect(updatedState.parsing.errors.length).toBeGreaterThan(0);

      logger.debug('✅ Parser initialization failure handled gracefully');
    });
  });

  describe('State Management', () => {
    it('should manage parsing state correctly during operations', async () => {
      logger.debug('Testing parsing state management');

      const state = store.getState();

      // Initial state
      expect(state.parsing.isLoading).toBe(false);
      expect(state.parsing.errors).toEqual([]);

      // Start parsing (we can't easily test the loading state due to async nature)
      const result = await state.parseCode('cube(15);');

      // Final state
      expect(result.success).toBe(true);
      const finalState = store.getState();
      expect(finalState.parsing.isLoading).toBe(false);
      expect(finalState.parsing.errors).toEqual([]);

      logger.debug('✅ Parsing state managed correctly');
    });

    it('should preserve store state across multiple operations', async () => {
      logger.debug('Testing state preservation across operations');

      const state = store.getState();

      // Perform multiple operations
      await state.parseCode('cube(5);');
      await state.parseCode('sphere(10);');

      // Store should maintain consistent state
      const finalState = store.getState();
      expect(finalState.parsing.isLoading).toBe(false);
      expect(finalState.parsing.errors).toEqual([]);

      // Other store slices should be unaffected
      expect(finalState.editor).toBeDefined();
      expect(finalState.babylonRendering).toBeDefined();
      expect(finalState.config).toBeDefined();

      logger.debug('✅ Store state preserved across operations');
    });
  });

  describe('Performance and Memory', () => {
    it('should not create multiple parser instances', async () => {
      logger.debug('Testing parser instance reuse');

      const state = store.getState();

      // Make multiple parse calls
      await state.parseCode('cube(1);');
      await state.parseCode('cube(2);');
      await state.parseCode('cube(3);');

      // Parser should be initialized only once
      const service = getParserInitializationService();
      expect(service.getState()).toBe('initialized');
      expect(service.isReady()).toBe(true);

      logger.debug('✅ Parser instance reused correctly');
    });

    it('should handle rapid successive calls without issues', async () => {
      logger.debug('Testing rapid successive calls');

      const state = store.getState();

      // Create many rapid calls
      const rapidCalls = Array.from({ length: 10 }, (_, i) => {
        const code = `cube(${i + 1});`;
        return { promise: state.parseCode(code), code };
      });

      const results = await Promise.all(rapidCalls.map((call) => call.promise));

      // All should succeed
      results.forEach((result, i) => {
        if (!result.success) {
          console.error(`❌ Rapid call ${i + 1} failed:`, result.error);
          console.error(`Code was: ${rapidCalls[i]?.code}`);
        }
        expect(result.success).toBe(true);
        logger.debug(`✅ Rapid call ${i + 1} succeeded`);
      });

      logger.debug('✅ Rapid successive calls handled correctly');
    });
  });

  describe('Error Recovery', () => {
    it.skip('should recover from parser errors', async () => {
      logger.debug('Testing error recovery');

      // First, cause a parser initialization failure
      const mockFailingParser = {
        init: vi.fn().mockRejectedValue(new Error('First failure')),
        dispose: vi.fn(),
      };

      const { OpenscadParser } = await import('../openscad-parser/openscad-parser.js');
      (OpenscadParser as any).mockImplementation(() => mockFailingParser);

      const state = store.getState();
      const failResult = await state.parseCode('cube(10);');
      expect(failResult.success).toBe(false);

      // Reset the service and mock a successful parser
      const service = getParserInitializationService();
      service.reset();

      const mockSuccessParser = {
        init: vi.fn().mockResolvedValue(undefined),
        dispose: vi.fn(),
        parseASTWithResult: vi.fn().mockReturnValue({ success: true, data: [] }),
      };
      (OpenscadParser as any).mockImplementation(() => mockSuccessParser);

      // Try again - should succeed
      const successResult = await state.parseCode('cube(10);');
      expect(successResult.success).toBe(true);

      logger.debug('✅ Error recovery working correctly');
    });
  });
});
