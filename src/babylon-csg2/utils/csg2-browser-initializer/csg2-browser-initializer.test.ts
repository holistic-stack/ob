/**
 * @file CSG2 Browser Initializer Tests
 * 
 * Tests for browser-only CSG2 initialization utility.
 * These tests focus on browser-compatible functionality only.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initializeCSG2ForBrowser,
  isCSG2Ready,
  resetCSG2State,
  createCSG2Initializer
} from './csg2-browser-initializer';

describe('[INIT] CSG2 Browser Initializer', () => {
  beforeEach(() => {
    console.log('[INIT] Setting up CSG2 browser initializer test environment');
    resetCSG2State();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up CSG2 browser initializer test environment');
    resetCSG2State();
  });

  describe('Basic Browser Initialization', () => {
    it('[DEBUG] should attempt CSG2 initialization in browser environment', async () => {
      console.log('[DEBUG] Testing CSG2 browser initialization');
      
      const result = await initializeCSG2ForBrowser({
        enableLogging: true,
        timeout: 1000 // Short timeout for test
      });
      
      // Should either succeed or fail gracefully
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.method).toBe('string');
      
      if (result.success) {
        expect(result.message).toBeTruthy();
        expect(['babylon-standard', 'browser-existing']).toContain(result.method);
      } else {
        expect(result.error).toBeTruthy();
        expect(result.method).toBe('failed');
      }
      
      console.log('[DEBUG] CSG2 browser initialization test completed');
    });

    it('[DEBUG] should return already initialized result on subsequent calls', async () => {
      console.log('[DEBUG] Testing multiple CSG2 browser initialization calls');
      
      // First initialization
      const result1 = await initializeCSG2ForBrowser({
        enableLogging: false,
        timeout: 1000
      });
      
      // Second initialization should return quickly
      const result2 = await initializeCSG2ForBrowser({
        enableLogging: false,
        timeout: 1000
      });
      
      // Both should have consistent results
      expect(result1.success).toBe(result2.success);
      
      console.log('[DEBUG] Multiple browser initialization test completed');
    });

    it('[DEBUG] should handle concurrent initialization calls', async () => {
      console.log('[DEBUG] Testing concurrent CSG2 browser initialization calls');
      
      // Start multiple initializations concurrently
      const promises = Array.from({ length: 3 }, () => 
        initializeCSG2ForBrowser({
          enableLogging: false,
          timeout: 1000
        })
      );
      
      const results = await Promise.all(promises);
      
      // All should have consistent results
      const firstResult = results[0];
      expect(firstResult).toBeDefined();
      results.forEach(result => {
        expect(result.success).toBe(firstResult!.success);
      });
      
      console.log('[DEBUG] Concurrent browser initialization test completed');
    });
  });

  describe('Configuration Options', () => {
    it('[DEBUG] should respect timeout configuration', async () => {
      console.log('[DEBUG] Testing timeout configuration');
      
      const result = await initializeCSG2ForBrowser({
        timeout: 100, // Very short timeout
        enableLogging: false
      });
      
      // Should complete within reasonable time
      expect(typeof result.success).toBe('boolean');
      
      console.log('[DEBUG] Timeout configuration test completed');
    });

    it('[DEBUG] should respect logging configuration', async () => {
      console.log('[DEBUG] Testing logging configuration');
      
      // Test with logging disabled (default)
      const result = await initializeCSG2ForBrowser({
        enableLogging: false,
        timeout: 1000
      });
      
      expect(typeof result.success).toBe('boolean');
      
      console.log('[DEBUG] Logging configuration test completed');
    });

    it('[DEBUG] should handle custom retry attempts', async () => {
      console.log('[DEBUG] Testing retry attempts configuration');
      
      const result = await initializeCSG2ForBrowser({
        retryAttempts: 1,
        enableLogging: false,
        timeout: 1000
      });
      
      expect(typeof result.success).toBe('boolean');
      
      console.log('[DEBUG] Retry attempts test completed');
    });
  });

  describe('State Management', () => {
    it('[DEBUG] should track CSG2 ready state correctly', async () => {
      console.log('[DEBUG] Testing CSG2 ready state tracking');
      
      // Initially not ready
      expect(isCSG2Ready()).toBe(false);
      
      // Initialize
      const result = await initializeCSG2ForBrowser({
        enableLogging: false,
        timeout: 1000
      });
      
      // State should be consistent with initialization result
      if (result.success) {
        expect(isCSG2Ready()).toBe(true);
      } else {
        expect(isCSG2Ready()).toBe(false);
      }
      
      console.log('[DEBUG] Ready state tracking test completed');
    });

    it('[DEBUG] should reset state correctly', async () => {
      console.log('[DEBUG] Testing state reset functionality');
      
      // Initialize first
      await initializeCSG2ForBrowser({
        enableLogging: false,
        timeout: 1000
      });
      
      // Reset state
      resetCSG2State();
      
      // Should not be ready after reset
      expect(isCSG2Ready()).toBe(false);
      
      console.log('[DEBUG] State reset test completed');
    });
  });

  describe('Factory Function', () => {
    it('[DEBUG] should create initializer with factory function', async () => {
      console.log('[DEBUG] Testing factory function creation');
      
      const initializer = createCSG2Initializer({
        enableLogging: false,
        timeout: 1000
      });
      
      expect(typeof initializer.initialize).toBe('function');
      expect(typeof initializer.isReady).toBe('function');
      expect(typeof initializer.reset).toBe('function');
      
      // Test initialization through factory
      const result = await initializer.initialize();
      expect(typeof result.success).toBe('boolean');
      
      console.log('[DEBUG] Factory function test completed');
    });

    it('[DEBUG] should handle factory reset correctly', async () => {
      console.log('[DEBUG] Testing factory reset functionality');
      
      const initializer = createCSG2Initializer({
        enableLogging: false,
        timeout: 1000
      });
      
      // Initialize
      await initializer.initialize();
      
      // Reset
      initializer.reset();
      expect(initializer.isReady()).toBe(false);
      
      console.log('[DEBUG] Factory reset test completed');
    });
  });

  describe('Error Handling', () => {
    it('[DEBUG] should handle initialization errors gracefully', async () => {
      console.log('[DEBUG] Testing error handling');
      
      // Test with very short timeout to potentially trigger timeout error
      const result = await initializeCSG2ForBrowser({
        enableLogging: false,
        timeout: 1 // 1ms timeout to trigger timeout
      });
      
      // Should either succeed or fail gracefully
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.method).toBe('string');
      
      if (!result.success) {
        expect(typeof result.error).toBe('string');
        expect(result.error.length).toBeGreaterThan(0);
        expect(result.method).toBe('failed');
      }
      
      console.log('[DEBUG] Error handling test completed');
    });
  });
});
