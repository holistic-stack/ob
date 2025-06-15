/**
 * @file CSG2 Test Initializer Tests
 * 
 * Tests for test-specific CSG2 initialization utility.
 * These tests focus on Node.js and mock functionality.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initializeCSG2ForTests,
  isCSG2ReadyForTests,
  resetCSG2StateForTests,
  createCSG2TestInitializer
} from './csg2-test-initializer';

describe('[INIT] CSG2 Test Initializer', () => {
  beforeEach(() => {
    console.log('[INIT] Setting up CSG2 test initializer test environment');
    resetCSG2StateForTests();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up CSG2 test initializer test environment');
    resetCSG2StateForTests();
  });

  describe('Basic Test Initialization', () => {
    it('[DEBUG] should initialize CSG2 successfully in test environment', async () => {
      console.log('[DEBUG] Testing CSG2 test initialization');
      
      const result = await initializeCSG2ForTests({
        enableLogging: true,
        forceMockInTests: true,
        timeout: 5000
      });
      
      expect(result.success).toBe(true);
      expect(['manifold-direct', 'babylon-standard', 'mock-vitest', 'mock-simple']).toContain(result.method);
      if (result.success) {
        expect(result.message).toContain('CSG2 initialized');
      }
      
      console.log('[DEBUG] CSG2 test initialization completed successfully');
    });

    it('[DEBUG] should return already initialized result on subsequent calls', async () => {
      console.log('[DEBUG] Testing multiple CSG2 test initialization calls');
      
      // First initialization
      const result1 = await initializeCSG2ForTests({
        enableLogging: false,
        forceMockInTests: true
      });
      
      // Second initialization should return quickly
      const result2 = await initializeCSG2ForTests({
        enableLogging: false,
        forceMockInTests: true
      });
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      
      console.log('[DEBUG] Multiple test initialization completed');
    });

    it('[DEBUG] should handle concurrent initialization calls', async () => {
      console.log('[DEBUG] Testing concurrent CSG2 test initialization calls');
      
      // Start multiple initializations concurrently
      const promises = Array.from({ length: 3 }, () => 
        initializeCSG2ForTests({
          enableLogging: false,
          forceMockInTests: true
        })
      );
      
      const results = await Promise.all(promises);
      
      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      console.log('[DEBUG] Concurrent test initialization completed');
    });
  });

  describe('Mock Initialization', () => {
    it('[DEBUG] should use mock when forceMockInTests is true', async () => {
      console.log('[DEBUG] Testing forced mock initialization');
      
      const result = await initializeCSG2ForTests({
        enableLogging: true,
        forceMockInTests: true,
        timeout: 1000
      });
      
      expect(result.success).toBe(true);
      expect(['mock-vitest', 'mock-simple']).toContain(result.method);
      
      console.log('[DEBUG] Forced mock initialization test completed');
    });

    it('[DEBUG] should attempt real initialization when forceMockInTests is false', async () => {
      console.log('[DEBUG] Testing real initialization attempt');
      
      const result = await initializeCSG2ForTests({
        enableLogging: false,
        forceMockInTests: false,
        timeout: 2000
      });
      
      // Should either succeed with real method or fall back to mock
      expect(result.success).toBe(true);
      expect(['manifold-direct', 'babylon-standard', 'mock-vitest', 'mock-simple']).toContain(result.method);
      
      console.log('[DEBUG] Real initialization attempt test completed');
    });
  });

  describe('Configuration Options', () => {
    it('[DEBUG] should respect timeout configuration', async () => {
      console.log('[DEBUG] Testing timeout configuration');
      
      const result = await initializeCSG2ForTests({
        timeout: 100, // Very short timeout
        enableLogging: false,
        forceMockInTests: true
      });
      
      // Should still succeed with mock fallback
      expect(result.success).toBe(true);
      
      console.log('[DEBUG] Timeout configuration test completed');
    });

    it('[DEBUG] should respect logging configuration', async () => {
      console.log('[DEBUG] Testing logging configuration');
      
      // Test with logging enabled (default for tests)
      const result = await initializeCSG2ForTests({
        enableLogging: true,
        forceMockInTests: true
      });
      
      expect(result.success).toBe(true);
      
      console.log('[DEBUG] Logging configuration test completed');
    });

    it('[DEBUG] should handle custom retry attempts', async () => {
      console.log('[DEBUG] Testing retry attempts configuration');
      
      const result = await initializeCSG2ForTests({
        retryAttempts: 1,
        enableLogging: false,
        forceMockInTests: true
      });
      
      expect(result.success).toBe(true);
      
      console.log('[DEBUG] Retry attempts test completed');
    });
  });

  describe('State Management', () => {
    it('[DEBUG] should track CSG2 ready state correctly', async () => {
      console.log('[DEBUG] Testing CSG2 ready state tracking');
      
      // Initially not ready
      expect(isCSG2ReadyForTests()).toBe(false);
      
      // Initialize
      await initializeCSG2ForTests({
        enableLogging: false,
        forceMockInTests: true
      });
      
      // Should be ready after initialization
      expect(isCSG2ReadyForTests()).toBe(true);
      
      console.log('[DEBUG] Ready state tracking test completed');
    });

    it('[DEBUG] should reset state correctly', async () => {
      console.log('[DEBUG] Testing state reset functionality');
      
      // Initialize first
      await initializeCSG2ForTests({
        enableLogging: false,
        forceMockInTests: true
      });
      
      expect(isCSG2ReadyForTests()).toBe(true);
      
      // Reset state
      resetCSG2StateForTests();
      
      // Should not be ready after reset
      expect(isCSG2ReadyForTests()).toBe(false);
      
      console.log('[DEBUG] State reset test completed');
    });
  });

  describe('Factory Function', () => {
    it('[DEBUG] should create test initializer with factory function', async () => {
      console.log('[DEBUG] Testing factory function creation');
      
      const initializer = createCSG2TestInitializer({
        enableLogging: false,
        forceMockInTests: true
      });
      
      expect(typeof initializer.initialize).toBe('function');
      expect(typeof initializer.isReady).toBe('function');
      expect(typeof initializer.reset).toBe('function');
      
      // Test initialization through factory
      const result = await initializer.initialize();
      expect(result.success).toBe(true);
      expect(initializer.isReady()).toBe(true);
      
      console.log('[DEBUG] Factory function test completed');
    });

    it('[DEBUG] should handle factory reset correctly', async () => {
      console.log('[DEBUG] Testing factory reset functionality');
      
      const initializer = createCSG2TestInitializer({
        enableLogging: false,
        forceMockInTests: true
      });
      
      // Initialize
      await initializer.initialize();
      expect(initializer.isReady()).toBe(true);
      
      // Reset
      initializer.reset();
      expect(initializer.isReady()).toBe(false);
      
      console.log('[DEBUG] Factory reset test completed');
    });
  });

  describe('Error Handling', () => {
    it('[DEBUG] should handle initialization errors gracefully', async () => {
      console.log('[DEBUG] Testing error handling');
      
      // Test with mock disabled and short timeout to potentially trigger errors
      const result = await initializeCSG2ForTests({
        enableLogging: false,
        forceMockInTests: false,
        timeout: 100 // Short timeout to trigger timeout error
      });
      
      // Should either succeed or fail gracefully, but likely succeed with fallback
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.method).toBe('string');
      
      if (!result.success) {
        expect(typeof result.error).toBe('string');
        expect(result.error.length).toBeGreaterThan(0);
      }
      
      console.log('[DEBUG] Error handling test completed');
    });
  });

  describe('Environment Detection', () => {
    it('[DEBUG] should detect test environment correctly', async () => {
      console.log('[DEBUG] Testing environment detection');
      
      // In test environment, should use mock by default
      const result = await initializeCSG2ForTests({
        enableLogging: false
        // forceMockInTests not specified, should default to true
      });
      
      expect(result.success).toBe(true);
      expect(['mock-vitest', 'mock-simple']).toContain(result.method);
      
      console.log('[DEBUG] Environment detection test completed');
    });
  });
});
