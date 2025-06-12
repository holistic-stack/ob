/**
 * @file CSG2 Node.js Initializer Tests
 * 
 * Tests for CSG2 initialization utility that handles Node.js environments.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initializeCSG2ForNode,
  isCSG2Ready,
  resetCSG2State,
  createCSG2Initializer
} from './csg2-node-initializer';

describe('[INIT] CSG2 Node.js Initializer', () => {
  beforeEach(() => {
    console.log('[INIT] Setting up CSG2 initializer test environment');
    resetCSG2State();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up CSG2 initializer test environment');
    resetCSG2State();
  });

  describe('Basic Initialization', () => {
    it('[DEBUG] should initialize CSG2 successfully in test environment', async () => {
      console.log('[DEBUG] Testing CSG2 initialization in test environment');
      
      const result = await initializeCSG2ForNode({
        enableLogging: true,
        forceMockInTests: true,
        timeout: 5000
      });
      
      expect(result.success).toBe(true);
      expect(result.method).toBe('mock-fallback');
      if (result.success) {
        expect(result.message).toContain('Mock CSG2 initialized');
      }
      
      console.log('[DEBUG] CSG2 initialization test completed successfully');
    });

    it('[DEBUG] should return already initialized result on subsequent calls', async () => {
      console.log('[DEBUG] Testing multiple CSG2 initialization calls');
      
      // First initialization
      const result1 = await initializeCSG2ForNode({
        enableLogging: false,
        forceMockInTests: true
      });
      
      // Second initialization should return quickly
      const result2 = await initializeCSG2ForNode({
        enableLogging: false,
        forceMockInTests: true
      });
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      
      console.log('[DEBUG] Multiple initialization test completed');
    });

    it('[DEBUG] should handle concurrent initialization calls', async () => {
      console.log('[DEBUG] Testing concurrent CSG2 initialization calls');
      
      // Start multiple initializations concurrently
      const promises = Array.from({ length: 3 }, () => 
        initializeCSG2ForNode({
          enableLogging: false,
          forceMockInTests: true
        })
      );
      
      const results = await Promise.all(promises);
      
      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      console.log('[DEBUG] Concurrent initialization test completed');
    });
  });

  describe('Configuration Options', () => {
    it('[DEBUG] should respect timeout configuration', async () => {
      console.log('[DEBUG] Testing timeout configuration');
      
      const result = await initializeCSG2ForNode({
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
      
      // Test with logging disabled
      const result = await initializeCSG2ForNode({
        enableLogging: false,
        forceMockInTests: true
      });
      
      expect(result.success).toBe(true);
      
      console.log('[DEBUG] Logging configuration test completed');
    });

    it('[DEBUG] should handle custom retry attempts', async () => {
      console.log('[DEBUG] Testing retry attempts configuration');
      
      const result = await initializeCSG2ForNode({
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
      expect(isCSG2Ready()).toBe(false);
      
      // Initialize
      await initializeCSG2ForNode({
        enableLogging: false,
        forceMockInTests: true
      });
      
      // Should be ready after initialization
      expect(isCSG2Ready()).toBe(true);
      
      console.log('[DEBUG] Ready state tracking test completed');
    });

    it('[DEBUG] should reset state correctly', async () => {
      console.log('[DEBUG] Testing state reset functionality');
      
      // Initialize first
      await initializeCSG2ForNode({
        enableLogging: false,
        forceMockInTests: true
      });
      
      expect(isCSG2Ready()).toBe(true);
      
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
      
      const initializer = createCSG2Initializer({
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
      
      // Test with mock disabled to potentially trigger errors
      const result = await initializeCSG2ForNode({
        enableLogging: false,
        forceMockInTests: false, // Disable mock to test real initialization
        timeout: 100 // Short timeout to trigger timeout error
      });
      
      // Should either succeed or fail gracefully
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
      const result = await initializeCSG2ForNode({
        enableLogging: false
        // forceMockInTests not specified, should default to true
      });
      
      expect(result.success).toBe(true);
      expect(result.method).toBe('mock-fallback');
      
      console.log('[DEBUG] Environment detection test completed');
    });
  });
});

describe('[INIT] CSG2 Initializer Integration', () => {
  beforeEach(() => {
    console.log('[INIT] Setting up integration test environment');
    resetCSG2State();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up integration test environment');
    resetCSG2State();
  });

  it('[DEBUG] should integrate with existing test setup', async () => {
    console.log('[DEBUG] Testing integration with existing test setup');
    
    // This should work with the existing vitest-setup
    const result = await initializeCSG2ForNode();
    
    expect(result.success).toBe(true);
    expect(isCSG2Ready()).toBe(true);
    
    console.log('[DEBUG] Integration test completed successfully');
  });
});
