/**
 * @file R3F CSG Service Tests
 * 
 * TDD tests for the R3F CSG service following React 19 best practices
 * and functional programming principles. Tests CSG operations using three-csg-ts.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { R3FCSGService, createR3FCSGService } from './r3f-csg-service';
import type { CSGServiceConfig } from './r3f-csg-service';

// Mock three-csg-ts for testing
vi.mock('three-csg-ts', () => {
  // Define a mock CSG instance type
  interface MockCSGInstance {
    union: () => MockCSGInstance;
    subtract: () => MockCSGInstance;
    intersect: () => MockCSGInstance;
    toGeometry: () => THREE.BufferGeometry;
  }
  
  const mockCSGInstance: MockCSGInstance = {
    union: vi.fn(() => mockCSGInstance),
    subtract: vi.fn(() => mockCSGInstance),
    intersect: vi.fn(() => mockCSGInstance),
    toGeometry: vi.fn(() => new THREE.BoxGeometry(1, 1, 1))
  };
  
  return {
    CSG: {
      fromGeometry: vi.fn(() => mockCSGInstance),
      toGeometry: vi.fn(() => new THREE.BoxGeometry(1, 1, 1))
    }
  };
});

// Mock Three.js geometries for testing
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  
  const createMockGeometry = (type: string, vertexCount: number) => ({
    type,
    attributes: {
      position: {
        count: vertexCount,
        getX: vi.fn(() => 1),
        getY: vi.fn(() => 1),
        getZ: vi.fn(() => 1)
      }
    },
    computeVertexNormals: vi.fn(),
    computeBoundingBox: vi.fn(),
    computeBoundingSphere: vi.fn(),
    clone: vi.fn(function(this: any) {
      return {
        ...this,
        dispose: vi.fn()
      };
    }),
    dispose: vi.fn()
  });
  
  return {
    ...actual,
    BoxGeometry: vi.fn().mockImplementation(() => createMockGeometry('BoxGeometry', 24)),
    SphereGeometry: vi.fn().mockImplementation(() => createMockGeometry('SphereGeometry', 32)),
    Matrix4: actual.Matrix4
  };
});

describe('R3FCSGService', () => {
  let csgService: R3FCSGService;
  let boxGeometry: THREE.BufferGeometry;
  let sphereGeometry: THREE.BufferGeometry;

  beforeEach(() => {
    console.log('[DEBUG] Setting up R3F CSG service test');
    
    csgService = createR3FCSGService() as R3FCSGService;
    boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up R3F CSG service test');
    
    csgService.dispose();
    boxGeometry.dispose();
    sphereGeometry.dispose();
    
    vi.clearAllMocks();
  });

  describe('constructor and configuration', () => {
    it('should create CSG service with default configuration', () => {
      console.log('[DEBUG] Testing CSG service creation with defaults');
      
      const defaultService = createR3FCSGService();
      expect(defaultService).toBeDefined();
      expect(typeof defaultService.union).toBe('function');
      expect(typeof defaultService.difference).toBe('function');
      expect(typeof defaultService.intersection).toBe('function');
      expect(typeof defaultService.isSupported).toBe('function');
      
      (defaultService as R3FCSGService).dispose();
    });

    it('should create CSG service with custom configuration', () => {
      console.log('[DEBUG] Testing CSG service creation with custom config');
      
      const config: CSGServiceConfig = {
        enableCaching: false,
        enableOptimization: false,
        enableLogging: false,
        maxCacheSize: 50
      };
      
      const customService = createR3FCSGService(config);
      expect(customService).toBeDefined();
      
      (customService as R3FCSGService).dispose();
    });
  });

  describe('CSG support detection', () => {
    it('should detect CSG support correctly', () => {
      console.log('[DEBUG] Testing CSG support detection');
      
      const isSupported = csgService.isSupported();
      expect(typeof isSupported).toBe('boolean');
      
      // With our mocks, it should be supported
      expect(isSupported).toBe(true);
    });
  });

  describe('union operations', () => {
    it('should perform union operation with two geometries', () => {
      console.log('[DEBUG] Testing union operation with two geometries');
      
      const geometries = [boxGeometry, sphereGeometry];
      const result = csgService.union(geometries);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.type).toBe('BoxGeometry');
      }
    });

    it('should perform union operation with single geometry', () => {
      console.log('[DEBUG] Testing union operation with single geometry');
      
      const geometries = [boxGeometry];
      const result = csgService.union(geometries);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
      }
    });

    it('should handle union operation with empty array', () => {
      console.log('[DEBUG] Testing union operation with empty array');
      
      const geometries: THREE.BufferGeometry[] = [];
      const result = csgService.union(geometries);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('at least one geometry');
      }
    });

    it('should handle union operation with null geometry', () => {
      console.log('[DEBUG] Testing union operation with null geometry');
      
      const geometries = [boxGeometry, null as any];
      const result = csgService.union(geometries);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('null or undefined');
      }
    });
  });

  describe('difference operations', () => {
    it('should perform difference operation with two geometries', () => {
      console.log('[DEBUG] Testing difference operation with two geometries');
      
      const geometries = [boxGeometry, sphereGeometry];
      const result = csgService.difference(geometries);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.type).toBe('BoxGeometry');
      }
    });

    it('should handle difference operation with single geometry', () => {
      console.log('[DEBUG] Testing difference operation with single geometry');
      
      const geometries = [boxGeometry];
      const result = csgService.difference(geometries);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('at least two geometries');
      }
    });

    it('should perform difference operation with multiple geometries', () => {
      console.log('[DEBUG] Testing difference operation with multiple geometries');
      
      const thirdGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      const geometries = [boxGeometry, sphereGeometry, thirdGeometry];
      const result = csgService.difference(geometries);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
      }
      
      thirdGeometry.dispose();
    });
  });

  describe('intersection operations', () => {
    it('should perform intersection operation with two geometries', () => {
      console.log('[DEBUG] Testing intersection operation with two geometries');
      
      const geometries = [boxGeometry, sphereGeometry];
      const result = csgService.intersection(geometries);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.type).toBe('BoxGeometry');
      }
    });

    it('should handle intersection operation with single geometry', () => {
      console.log('[DEBUG] Testing intersection operation with single geometry');
      
      const geometries = [boxGeometry];
      const result = csgService.intersection(geometries);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('at least two geometries');
      }
    });

    it('should perform intersection operation with multiple geometries', () => {
      console.log('[DEBUG] Testing intersection operation with multiple geometries');
      
      const thirdGeometry = new THREE.SphereGeometry(1.5, 16, 16);
      const geometries = [boxGeometry, sphereGeometry, thirdGeometry];
      const result = csgService.intersection(geometries);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
      }
      
      thirdGeometry.dispose();
    });
  });

  describe('caching functionality', () => {
    it('should cache operation results when caching is enabled', () => {
      console.log('[DEBUG] Testing caching functionality');
      
      const cachingService = createR3FCSGService({ enableCaching: true }) as R3FCSGService;
      const geometries = [boxGeometry, sphereGeometry];
      
      // First operation should miss cache
      const result1 = cachingService.union(geometries);
      expect(result1.success).toBe(true);
      
      // Second operation should hit cache
      const result2 = cachingService.union(geometries);
      expect(result2.success).toBe(true);
      
      const metrics = cachingService.getMetrics();
      expect(metrics.totalOperations).toBe(2);
      
      cachingService.dispose();
    });

    it('should clear cache when requested', () => {
      console.log('[DEBUG] Testing cache clearing');
      
      const cachingService = createR3FCSGService({ enableCaching: true }) as R3FCSGService;
      const geometries = [boxGeometry, sphereGeometry];
      
      // Perform operation to populate cache
      cachingService.union(geometries);
      
      // Clear cache
      expect(() => cachingService.clearCache()).not.toThrow();
      
      cachingService.dispose();
    });
  });

  describe('error handling', () => {
    it('should handle geometry without position attribute', () => {
      console.log('[DEBUG] Testing geometry without position attribute');
      
      const invalidGeometry = {
        attributes: {}
      } as THREE.BufferGeometry;
      
      const geometries = [boxGeometry, invalidGeometry];
      const result = csgService.union(geometries);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('no position attribute');
      }
    });

    it('should handle geometry with zero vertices', () => {
      console.log('[DEBUG] Testing geometry with zero vertices');
      
      const emptyGeometry = {
        attributes: {
          position: {
            count: 0,
            getX: vi.fn(),
            getY: vi.fn(),
            getZ: vi.fn()
          }
        }
      } as any;
      
      const geometries = [boxGeometry, emptyGeometry];
      const result = csgService.union(geometries);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('no vertices');
      }
    });

    it('should handle CSG operation failures gracefully', async () => {
      console.log('[DEBUG] Testing CSG operation failure handling');
      
      // Mock CSG to throw an error using vi.mocked
      const { CSG } = await import('three-csg-ts');
      const mockedCSG = vi.mocked(CSG);
      
      mockedCSG.fromGeometry.mockImplementationOnce(() => {
        throw new Error('CSG operation failed');
      });
      
      const geometries = [boxGeometry, sphereGeometry];
      const result = csgService.union(geometries);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('CSG operation failed');
      }
    });
  });

  describe('metrics and performance', () => {
    it('should track operation metrics', () => {
      console.log('[DEBUG] Testing metrics tracking');
      
      const geometries = [boxGeometry, sphereGeometry];
      
      const initialMetrics = csgService.getMetrics();
      expect(initialMetrics.totalOperations).toBe(0);
      expect(initialMetrics.successfulOperations).toBe(0);
      
      csgService.union(geometries);
      
      const finalMetrics = csgService.getMetrics();
      expect(finalMetrics.totalOperations).toBe(1);
      expect(finalMetrics.successfulOperations).toBe(1);
      expect(finalMetrics.failedOperations).toBe(0);
    });

    it('should track failed operations in metrics', () => {
      console.log('[DEBUG] Testing failed operation metrics');
      
      const geometries: THREE.BufferGeometry[] = [];
      
      csgService.union(geometries);
      
      const metrics = csgService.getMetrics();
      expect(metrics.totalOperations).toBe(1);
      expect(metrics.successfulOperations).toBe(0);
      expect(metrics.failedOperations).toBe(1);
    });

    it('should track average operation time', () => {
      console.log('[DEBUG] Testing average operation time tracking');
      
      const geometries = [boxGeometry, sphereGeometry];
      
      csgService.union(geometries);
      csgService.difference(geometries);
      
      const metrics = csgService.getMetrics();
      expect(metrics.averageOperationTime).toBeGreaterThan(0);
    });
  });

  describe('resource management', () => {
    it('should dispose resources properly', () => {
      console.log('[DEBUG] Testing resource disposal');
      
      const geometries = [boxGeometry, sphereGeometry];
      csgService.union(geometries);
      
      // Dispose should not throw
      expect(() => csgService.dispose()).not.toThrow();
    });

    it('should handle disposal of empty service', () => {
      console.log('[DEBUG] Testing disposal of empty service');
      
      const emptyService = createR3FCSGService() as R3FCSGService;
      
      // Dispose should not throw even if no operations were performed
      expect(() => emptyService.dispose()).not.toThrow();
    });
  });

  describe('optimization features', () => {
    it('should optimize geometries when optimization is enabled', () => {
      console.log('[DEBUG] Testing geometry optimization');
      
      const optimizingService = createR3FCSGService({ 
        enableOptimization: true 
      }) as R3FCSGService;
      
      const geometries = [boxGeometry, sphereGeometry];
      const result = optimizingService.union(geometries);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Verify optimization methods were called
        expect(result.data.computeVertexNormals).toHaveBeenCalled();
        expect(result.data.computeBoundingBox).toHaveBeenCalled();
        expect(result.data.computeBoundingSphere).toHaveBeenCalled();
      }
      
      optimizingService.dispose();
    });
  });
});
