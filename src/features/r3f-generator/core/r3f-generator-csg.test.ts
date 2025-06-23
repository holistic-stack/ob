/**
 * @file R3F Generator CSG Tests
 *
 * TDD tests for CSG operations in the R3F generator using three-csg-ts.
 * Tests union, difference, and intersection operations with comprehensive
 * error handling and performance validation.
 *
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { generateR3FFromCSGTree } from './r3f-generator';
import type { CSGTree, CSGTreeNode } from '../../csg-processor';

// Mock three-csg-ts for testing
vi.mock('three-csg-ts', () => ({
  CSG: {
    fromGeometry: vi.fn((geometry) => {
      // Mock CSG object with operation methods
      return {
        union: vi.fn(() => ({
          toGeometry: () => new THREE.BoxGeometry(2, 2, 2) // Union result
        })),
        subtract: vi.fn(() => ({
          toGeometry: () => new THREE.BoxGeometry(0.5, 0.5, 0.5) // Difference result
        })),
        intersect: vi.fn(() => ({
          toGeometry: () => new THREE.BoxGeometry(0.5, 0.5, 0.5) // Intersection result
        }))
      };
    }),
    toGeometry: vi.fn((csg) => {
      // Return appropriate geometry based on operation
      return new THREE.BoxGeometry(1, 1, 1);
    })
  }
}));

describe('R3F Generator CSG Operations', () => {
  beforeEach(() => {
    console.log('[DEBUG] Setting up R3F CSG test');
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up R3F CSG test');
    vi.clearAllMocks();
  });

  describe('CSG Union Operations', () => {
    it('should perform union operation on two cubes', async () => {
      console.log('[DEBUG] Testing CSG union operation');

      // Create CSG tree with union operation
      const csgTree: CSGTree = {
        root: [
          {
            id: 'union-1',
            type: 'union',
            children: [
              {
                id: 'cube-1',
                type: 'cube',
                size: [1, 1, 1],
                center: false,
                material: {
                  color: { r: 1, g: 0, b: 0, a: 1 },
                  opacity: 1.0,
                  metalness: 0.1,
                  roughness: 0.4,
                  wireframe: false
                }
              },
              {
                id: 'cube-2',
                type: 'cube',
                size: [1, 1, 1],
                center: false,
                material: {
                  color: { r: 0, g: 1, b: 0, a: 1 },
                  opacity: 1.0,
                  metalness: 0.1,
                  roughness: 0.4,
                  wireframe: false
                }
              }
            ],
            material: {
              color: { r: 0, g: 0, b: 1, a: 1 },
              opacity: 1.0,
              metalness: 0.1,
              roughness: 0.4,
              wireframe: false
            }
          }
        ],
        metadata: {
          nodeCount: 3,
          primitiveCount: 2,
          operationCount: 1,
          maxDepth: 2
        },
        processingTime: 100
      };

      const result = await generateR3FFromCSGTree(csgTree, {
        enableLogging: true,
        enableOptimization: true
      });

      expect(result.success).toBe(true);
      expect(result.meshes).toBeDefined();
      expect(result.meshes.length).toBe(1);
      if (result.meshes && result.meshes[0]) {
        expect(result.meshes[0].nodeType).toBe('union');
        expect(result.meshes[0].mesh).toBeInstanceOf(THREE.Mesh);
        if (result.meshes[0].mesh) {
          expect(result.meshes[0].mesh.geometry).toBeInstanceOf(THREE.BufferGeometry);
          expect(result.meshes[0].mesh.material).toBeInstanceOf(THREE.Material);
        }
      }
    });

    it('should handle union with single child', async () => {
      console.log('[DEBUG] Testing CSG union with single child');

      const csgTree: CSGTree = {
        root: [
          {
            id: 'union-single',
            type: 'union',
            children: [
              {
                id: 'cube-single',
                type: 'cube',
                size: [1, 1, 1],
                center: false,
                material: {
                  color: { r: 1, g: 0, b: 0, a: 1 },
                  opacity: 1.0,
                  metalness: 0.1,
                  roughness: 0.4,
                  wireframe: false
                }
              }
            ],
            material: {
              color: { r: 0, g: 0, b: 1, a: 1 },
              opacity: 1.0,
              metalness: 0.1,
              roughness: 0.4,
              wireframe: false
            }
          }
        ],
        metadata: {
          nodeCount: 2,
          primitiveCount: 1,
          operationCount: 1,
          maxDepth: 2
        },
        processingTime: 50
      };

      const result = await generateR3FFromCSGTree(csgTree);

      expect(result.success).toBe(true);
      expect(result.meshes).toBeDefined();
      expect(result.meshes.length).toBe(1);
      if (result.meshes && result.meshes[0]) {
        expect(result.meshes[0].nodeType).toBe('union');
      }
    });
  });

  describe('CSG Difference Operations', () => {
    it('should perform difference operation on two cubes', async () => {
      console.log('[DEBUG] Testing CSG difference operation');

      const csgTree: CSGTree = {
        root: [
          {
            id: 'difference-1',
            type: 'difference',
            children: [
              {
                id: 'cube-base',
                type: 'cube',
                size: [2, 2, 2],
                center: false,
                material: {
                  color: { r: 1, g: 0, b: 0, a: 1 },
                  opacity: 1.0,
                  metalness: 0.1,
                  roughness: 0.4,
                  wireframe: false
                }
              },
              {
                id: 'cube-subtract',
                type: 'cube',
                size: [1, 1, 1],
                center: false,
                material: {
                  color: { r: 0, g: 1, b: 0, a: 1 },
                  opacity: 1.0,
                  metalness: 0.1,
                  roughness: 0.4,
                  wireframe: false
                }
              }
            ],
            material: {
              color: { r: 0, g: 0, b: 1, a: 1 },
              opacity: 1.0,
              metalness: 0.1,
              roughness: 0.4,
              wireframe: false
            }
          }
        ],
        metadata: {
          nodeCount: 3,
          primitiveCount: 2,
          operationCount: 1,
          maxDepth: 2
        },
        processingTime: 120
      };

      const result = await generateR3FFromCSGTree(csgTree);

      expect(result.success).toBe(true);
      expect(result.meshes).toBeDefined();
      expect(result.meshes.length).toBe(1);
      if (result.meshes && result.meshes[0]) {
        expect(result.meshes[0].nodeType).toBe('difference');
      }
    });
  });

  describe('CSG Intersection Operations', () => {
    it('should perform intersection operation on two spheres', async () => {
      console.log('[DEBUG] Testing CSG intersection operation');

      const csgTree: CSGTree = {
        root: [
          {
            id: 'intersection-1',
            type: 'intersection',
            children: [
              {
                id: 'sphere-1',
                type: 'sphere',
                radius: 1,
                segments: 32,
                material: {
                  color: { r: 1, g: 0, b: 0, a: 1 },
                  opacity: 1.0,
                  metalness: 0.1,
                  roughness: 0.4,
                  wireframe: false
                }
              },
              {
                id: 'sphere-2',
                type: 'sphere',
                radius: 1,
                segments: 32,
                material: {
                  color: { r: 0, g: 1, b: 0, a: 1 },
                  opacity: 1.0,
                  metalness: 0.1,
                  roughness: 0.4,
                  wireframe: false
                }
              }
            ],
            material: {
              color: { r: 0, g: 0, b: 1, a: 1 },
              opacity: 1.0,
              metalness: 0.1,
              roughness: 0.4,
              wireframe: false
            }
          }
        ],
        metadata: {
          nodeCount: 3,
          primitiveCount: 2,
          operationCount: 1,
          maxDepth: 2
        },
        processingTime: 150
      };

      const result = await generateR3FFromCSGTree(csgTree);

      expect(result.success).toBe(true);
      expect(result.meshes).toBeDefined();
      expect(result.meshes.length).toBe(1);
      if (result.meshes && result.meshes[0]) {
        expect(result.meshes[0].nodeType).toBe('intersection');
      }
    });
  });

  describe('CSG Error Handling', () => {
    it('should handle empty CSG operation children', async () => {
      console.log('[DEBUG] Testing CSG empty children error handling');

      const csgTree: CSGTree = {
        root: [
          {
            id: 'empty-union',
            type: 'union',
            children: [],
            material: {
              color: { r: 0, g: 0, b: 1, a: 1 },
              opacity: 1.0,
              metalness: 0.1,
              roughness: 0.4,
              wireframe: false
            }
          }
        ],
        metadata: {
          nodeCount: 1,
          primitiveCount: 0,
          operationCount: 1,
          maxDepth: 1
        },
        processingTime: 10
      };

      const result = await generateR3FFromCSGTree(csgTree);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
        expect(result.errors.length).toBe(1);
        if (result.errors && result.errors[0]) {
          expect(result.errors[0].message).toContain('no valid children');
        }
      }
    });

    it('should fallback to first child when CSG operation fails', async () => {
      console.log('[DEBUG] Testing CSG operation failure fallback');

      // Mock CSG to fail
      const { CSG } = await import('three-csg-ts');
      (CSG.fromGeometry as any).mockImplementationOnce(() => {
        throw new Error('CSG operation failed');
      });

      const csgTree: CSGTree = {
        root: [
          {
            id: 'failing-union',
            type: 'union',
            children: [
              {
                id: 'cube-1',
                type: 'cube',
                size: [1, 1, 1],
                center: false,
                material: {
                  color: { r: 1, g: 0, b: 0, a: 1 },
                  opacity: 1.0,
                  metalness: 0.1,
                  roughness: 0.4,
                  wireframe: false
                }
              },
              {
                id: 'cube-2',
                type: 'cube',
                size: [1, 1, 1],
                center: false,
                material: {
                  color: { r: 0, g: 1, b: 0, a: 1 },
                  opacity: 1.0,
                  metalness: 0.1,
                  roughness: 0.4,
                  wireframe: false
                }
              }
            ],
            material: {
              color: { r: 0, g: 0, b: 1, a: 1 },
              opacity: 1.0,
              metalness: 0.1,
              roughness: 0.4,
              wireframe: false
            }
          }
        ],
        metadata: {
          nodeCount: 3,
          primitiveCount: 2,
          operationCount: 1,
          maxDepth: 2
        },
        processingTime: 100
      };

      const result = await generateR3FFromCSGTree(csgTree);

      // Should succeed with fallback to first child
      expect(result.success).toBe(true);
      expect(result.meshes).toBeDefined();
      expect(result.meshes.length).toBe(1);
      if (result.meshes && result.meshes[0]) {
        expect(result.meshes[0].nodeType).toBe('union');
      }
    });
  });

  describe('Complex CSG Operations', () => {
    it('should handle nested CSG operations', async () => {
      console.log('[DEBUG] Testing nested CSG operations');

      const csgTree: CSGTree = {
        root: [
          {
            id: 'nested-union',
            type: 'union',
            children: [
              {
                id: 'inner-difference',
                type: 'difference',
                children: [
                  {
                    id: 'cube-base',
                    type: 'cube',
                    size: [2, 2, 2],
                    center: false,
                    material: {
                      color: { r: 1, g: 0, b: 0, a: 1 },
                      opacity: 1.0,
                      metalness: 0.1,
                      roughness: 0.4,
                      wireframe: false
                    }
                  },
                  {
                    id: 'sphere-hole',
                    type: 'sphere',
                    radius: 0.5,
                    segments: 32,
                    material: {
                      color: { r: 0, g: 1, b: 0, a: 1 },
                      opacity: 1.0,
                      metalness: 0.1,
                      roughness: 0.4,
                      wireframe: false
                    }
                  }
                ],
                material: {
                  color: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
                  opacity: 1.0,
                  metalness: 0.1,
                  roughness: 0.4,
                  wireframe: false
                }
              },
              {
                id: 'cylinder-add',
                type: 'cylinder',
                height: 1,
                radius1: 0.3,
                radius2: 0.3,
                segments: 32,
                center: false,
                material: {
                  color: { r: 0, g: 0, b: 1, a: 1 },
                  opacity: 1.0,
                  metalness: 0.1,
                  roughness: 0.4,
                  wireframe: false
                }
              }
            ],
            material: {
              color: { r: 1, g: 1, b: 0, a: 1 },
              opacity: 1.0,
              metalness: 0.1,
              roughness: 0.4,
              wireframe: false
            }
          }
        ],
        metadata: {
          nodeCount: 5,
          primitiveCount: 3,
          operationCount: 2,
          maxDepth: 3
        },
        processingTime: 200
      };

      const result = await generateR3FFromCSGTree(csgTree);

      expect(result.success).toBe(true);
      expect(result.meshes).toBeDefined();
      expect(result.meshes.length).toBe(1);
      if (result.meshes && result.meshes[0]) {
        expect(result.meshes[0].nodeType).toBe('union');
        expect(result.metrics.totalMeshes).toBe(1);
      }
    });
  });
});
