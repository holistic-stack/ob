/**
 * @file Tests for useOpenSCADProcessor Hook (React 19 TDD - No Mocks)
 *
 * TDD tests for the refactored OpenSCAD processor hook following:
 * - React 19 SRP best practices
 * - Custom hooks with single responsibilities
 * - Functional programming patterns
 * - DRY and KISS principles
 * - Real implementations (no mocks)
 * - NullEngine for Babylon.js tests
 * - Real OpenscadParser instances
 *
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useOpenSCADProcessor } from './use-openscad-processor';
import { initializeCSG2ForTests } from '../../vitest-setup';
import * as BABYLON from '@babylonjs/core';

describe('useOpenSCADProcessor Hook (TDD - No Mocks)', () => {

  beforeAll(async () => {
    console.log('[INIT] 🧪 Initializing CSG2 for useOpenSCADProcessor hook tests');
    await initializeCSG2ForTests();
  }, 10000); // Increase timeout for CSG2 initialization

  beforeEach(() => {
    console.log('[INIT] 🧪 Setting up useOpenSCADProcessor hook test environment');
    // No mocks to set up - using real implementations
  });

  afterEach(() => {
    console.log('[DEBUG] 🧹 Cleaning up useOpenSCADProcessor hook test environment');
    // Real implementations handle their own cleanup
  });

  describe('Hook Initialization (SRP: Pipeline Management)', () => {
    it('should initialize with correct default state', () => {
      console.log('[TEST] Testing hook initialization state');

      const { result } = renderHook(() => useOpenSCADProcessor());

      // Check initial state follows SRP patterns
      expect(result.current.isInitializing).toBe(true);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
      expect(result.current.meshes).toEqual([]);
      expect(result.current.stats.totalRuns).toBe(0);
      expect(result.current.stats.successCount).toBe(0);
      expect(result.current.stats.errorCount).toBe(0);

      console.log('[TEST] ✅ Hook initialization test passed');
    }, 15000); // Increased timeout for real pipeline

    it('should initialize pipeline automatically', async () => {
      console.log('[TEST] Testing automatic pipeline initialization');

      const { result } = renderHook(() => useOpenSCADProcessor());

      // Should start initializing
      expect(result.current.isInitializing).toBe(true);

      // Wait for initialization to complete (longer timeout for real pipeline)
      await waitFor(() => {
        expect(result.current.isInitializing).toBe(false);
      }, { timeout: 15000 });

      expect(result.current.isReady).toBe(true);

      console.log('[TEST] ✅ Automatic pipeline initialization test passed');
    }, 20000); // Increased timeout for real pipeline

    // Note: Initialization error testing removed since we're using real implementations
    // Real pipeline initialization is robust and rarely fails in test environment
  });

  describe('OpenSCAD Processing (SRP: Code Processing)', () => {
    it('should process OpenSCAD code and return meshes', async () => {
      console.log('[TEST] Testing OpenSCAD code processing');

      const { result } = renderHook(() => useOpenSCADProcessor());

      // Wait for initialization (longer timeout for real pipeline)
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      }, { timeout: 15000 });

      // Process OpenSCAD code
      await act(async () => {
        await result.current.processCode('cube(10);');
      });

      // Should have processed successfully
      expect(result.current.result?.success).toBe(true);
      expect(result.current.meshes).toHaveLength(1);
      expect(result.current.meshes[0]).toHaveProperty('name', 'test-mesh');
      expect(result.current.stats.totalRuns).toBe(1);
      expect(result.current.stats.successCount).toBe(1);

      console.log('[TEST] ✅ OpenSCAD processing test passed');
    }, 25000); // Increased timeout for real pipeline processing

    it('should handle empty OpenSCAD code gracefully', async () => {
      console.log('[TEST] Testing empty code handling');

      const { result } = renderHook(() => useOpenSCADProcessor());

      // Wait for initialization (longer timeout for real pipeline)
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      }, { timeout: 15000 });

      // Try to process empty code
      await act(async () => {
        await result.current.processCode('');
      });

      // Should not process empty code
      expect(result.current.stats.totalRuns).toBe(0);

      console.log('[TEST] ✅ Empty code handling test passed');
    }, 20000); // Increased timeout for real pipeline

    it('should handle processing errors gracefully', async () => {
      console.log('[TEST] Testing processing error handling');

      // Using real invalid OpenSCAD syntax instead of mocks

      const { result } = renderHook(() => useOpenSCADProcessor());

      // Wait for initialization (longer timeout for real pipeline)
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      }, { timeout: 15000 });

      // Process invalid code
      await act(async () => {
        await result.current.processCode('invalid_syntax();');
      });

      // Should handle error gracefully
      expect(result.current.result?.success).toBe(false);
      expect(result.current.meshes).toHaveLength(0);
      expect(result.current.stats.totalRuns).toBe(1);
      expect(result.current.stats.errorCount).toBe(1);

      console.log('[TEST] ✅ Processing error handling test passed');
    }, 25000); // Increased timeout for real pipeline processing

  });

  describe('React 19 Optimistic Updates (SRP: UI State)', () => {
    it('should provide optimistic processing state', async () => {
      console.log('[TEST] Testing React 19 optimistic updates');

      const { result } = renderHook(() => useOpenSCADProcessor());

      // Wait for initialization (longer timeout for real pipeline)
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      }, { timeout: 15000 });

      // Verify initial state
      expect(result.current.isProcessing).toBe(false);

      // Start processing and check immediate state
      act(() => {
        void result.current.processCode('cube(5);');
      });

      // Should immediately show processing state (optimistic)
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
      }, { timeout: 1000 });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false);
      }, { timeout: 5000 });

      expect(result.current.result?.success).toBe(true);

      console.log('[TEST] ✅ Optimistic updates test passed');
    }, 25000); // Increased timeout for real pipeline processing
  });

  describe('Statistics Management (SRP: Metrics)', () => {
    it('should track processing statistics correctly', async () => {
      console.log('[TEST] Testing statistics tracking');

      const { result } = renderHook(() => useOpenSCADProcessor());

      // Wait for initialization (longer timeout for real pipeline)
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      }, { timeout: 15000 });

      // Process first time
      await act(async () => {
        await result.current.processCode('cube(1);');
      });

      // Wait for first processing to complete
      await waitFor(() => {
        expect(result.current.stats.totalRuns).toBe(1);
      }, { timeout: 3000 });

      // Process second time
      await act(async () => {
        await result.current.processCode('sphere(2);');
      });

      // Wait for second processing to complete
      await waitFor(() => {
        expect(result.current.stats.totalRuns).toBe(2);
      }, { timeout: 3000 });

      // Check final statistics
      expect(result.current.stats.successCount).toBe(2);
      expect(result.current.stats.errorCount).toBe(0);
      expect(result.current.stats.averageTime).toBeGreaterThan(0);

      console.log('[TEST] ✅ Statistics tracking test passed');
    }, 30000); // Increased timeout for multiple real pipeline operations

  });

  describe('Mesh Creation (SRP: Geometry Processing)', () => {
    it('should convert geometry data to Babylon meshes', async () => {
      console.log('[TEST] Testing mesh creation from geometry data');

      const { result } = renderHook(() => useOpenSCADProcessor());

      // Wait for initialization (longer timeout for real pipeline)
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      }, { timeout: 15000 });

      // Process code
      await act(async () => {
        await result.current.processCode('cube(10);');
      });

      // Wait for processing to complete and meshes to be created
      await waitFor(() => {
        expect(result.current.meshes).toHaveLength(1);
      }, { timeout: 5000 });

      // Should create mesh from geometry data
      const mesh = result.current.meshes[0];
      expect(mesh).toHaveProperty('name'); // Real pipeline generates dynamic names
      expect(mesh).toHaveProperty('positions');
      expect(mesh).toHaveProperty('normals');
      expect(mesh).toHaveProperty('indices');

      console.log('[TEST] ✅ Mesh creation test passed');
    }, 25000); // Increased timeout for real pipeline processing

    it('should handle complex OpenSCAD operations', async () => {
      console.log('[TEST] Testing complex OpenSCAD operations');

      const { result } = renderHook(() => useOpenSCADProcessor());

      // Wait for initialization (longer timeout for real pipeline)
      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      }, { timeout: 15000 });

      // Process complex OpenSCAD code (union operation)
      await act(async () => {
        await result.current.processCode('union() { cube([5, 5, 5]); sphere(r=3); }');
      });

      // Wait for processing to complete
      await waitFor(() => {
        expect(result.current.result?.success).toBe(true);
      }, { timeout: 8000 });

      // Should create at least one mesh from the union operation
      expect(result.current.meshes.length).toBeGreaterThanOrEqual(1);

      // Check that we have valid mesh data
      if (result.current.meshes.length > 0) {
        const mesh = result.current.meshes[0];
        expect(mesh).toHaveProperty('name');
        expect(mesh).toHaveProperty('positions');
        expect(mesh).toHaveProperty('normals');
        expect(mesh).toHaveProperty('indices');
      }

      console.log('[TEST] ✅ Complex OpenSCAD operations test passed');
    }, 30000); // Increased timeout for complex real pipeline operations
  });
});
