/**
 * @file primitive-babylon-node-performance.test.ts
 * @description Performance tests for PrimitiveBabylonNode with OpenSCAD Geometry Builder
 *
 * Tests performance characteristics, caching opportunities, and optimization potential
 * to ensure <16ms render targets are maintained for production deployment.
 */

import * as BABYLON from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type {
  CubeNode,
  CylinderNode,
  OpenSCADGlobalsState,
  SphereNode,
} from '@/features/openscad-parser';
import { isSuccess } from '@/shared/types';
import { PrimitiveBabylonNode } from './primitive-babylon-node';

describe('PrimitiveBabylonNode Performance Tests', () => {
  let scene: BABYLON.Scene;
  let engine: BABYLON.NullEngine;
  let openscadGlobals: OpenSCADGlobalsState;

  beforeEach(() => {
    // Create headless BabylonJS environment
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);

    // Setup OpenSCAD globals for testing
    openscadGlobals = {
      $fn: undefined,
      $fa: 12,
      $fs: 2,
      $t: 0,
      $vpr: [55, 0, 25] as const,
      $vpt: [0, 0, 0] as const,
      $vpd: 140,
      $children: 0,
      $preview: true,
      lastUpdated: Date.now(),
      isModified: false,
    };
  });

  afterEach(() => {
    scene.dispose();
    engine.dispose();
  });

  describe('Single Primitive Performance', () => {
    it('should generate sphere within <16ms target', async () => {
      const sphereNode: SphereNode = {
        type: 'sphere',
        r: 5,
        $fn: 16,
        $fa: undefined,
        $fs: undefined,
        location: { line: 1, column: 0 },
      };

      const primitiveNode = new PrimitiveBabylonNode(
        'perf-test-sphere',
        scene,
        sphereNode,
        openscadGlobals
      );

      const startTime = performance.now();
      const result = await primitiveNode.generateMesh();
      const endTime = performance.now();

      const generationTime = endTime - startTime;

      expect(isSuccess(result)).toBe(true);
      expect(generationTime).toBeLessThan(16); // <16ms target

      console.log(`Sphere generation time: ${generationTime.toFixed(2)}ms`);
    });

    it('should generate cube within <16ms target', async () => {
      const cubeNode: CubeNode = {
        type: 'cube',
        size: { x: 5, y: 5, z: 5 },
        center: true,
        location: { line: 1, column: 0 },
      };

      const primitiveNode = new PrimitiveBabylonNode(
        'perf-test-cube',
        scene,
        cubeNode,
        openscadGlobals
      );

      const startTime = performance.now();
      const result = await primitiveNode.generateMesh();
      const endTime = performance.now();

      const generationTime = endTime - startTime;

      expect(isSuccess(result)).toBe(true);
      expect(generationTime).toBeLessThan(16); // <16ms target

      console.log(`Cube generation time: ${generationTime.toFixed(2)}ms`);
    });

    it('should generate cylinder within <16ms target', async () => {
      const cylinderNode: CylinderNode = {
        type: 'cylinder',
        h: 10,
        r: 3,
        r1: undefined,
        r2: undefined,
        center: false,
        $fn: 16,
        $fa: undefined,
        $fs: undefined,
        location: { line: 1, column: 0 },
      };

      const primitiveNode = new PrimitiveBabylonNode(
        'perf-test-cylinder',
        scene,
        cylinderNode,
        openscadGlobals
      );

      const startTime = performance.now();
      const result = await primitiveNode.generateMesh();
      const endTime = performance.now();

      const generationTime = endTime - startTime;

      expect(isSuccess(result)).toBe(true);
      expect(generationTime).toBeLessThan(16); // <16ms target

      console.log(`Cylinder generation time: ${generationTime.toFixed(2)}ms`);
    });
  });

  describe('Repeated Generation Performance (Caching Opportunity)', () => {
    it('should identify caching opportunity for identical spheres', async () => {
      const sphereNode: SphereNode = {
        type: 'sphere',
        r: 5,
        $fn: 8,
        $fa: undefined,
        $fs: undefined,
        location: { line: 1, column: 0 },
      };

      const times: number[] = [];

      // Generate the same sphere 5 times
      for (let i = 0; i < 5; i++) {
        const primitiveNode = new PrimitiveBabylonNode(
          `perf-test-sphere-${i}`,
          scene,
          sphereNode,
          openscadGlobals
        );

        const startTime = performance.now();
        const result = await primitiveNode.generateMesh();
        const endTime = performance.now();

        const generationTime = endTime - startTime;
        times.push(generationTime);

        expect(isSuccess(result)).toBe(true);
      }

      // All generations should be fast, but without caching they'll be similar
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(
        `Repeated sphere generation times: ${times.map((t) => t.toFixed(2)).join(', ')}ms`
      );
      console.log(
        `Average: ${avgTime.toFixed(2)}ms, Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`
      );

      // All should be under target, but this shows caching opportunity
      expect(maxTime).toBeLessThan(16);

      // Log caching opportunity
      if (maxTime - minTime < 2) {
        console.log('✅ Consistent performance - good candidate for caching');
      } else {
        console.log('⚠️ Variable performance - investigate optimization opportunities');
      }
    });
  });

  describe('Complex Geometry Performance', () => {
    it('should handle high-detail sphere within performance targets', async () => {
      const highDetailSphere: SphereNode = {
        type: 'sphere',
        r: 10,
        $fn: 64, // High detail
        $fa: undefined,
        $fs: undefined,
        location: { line: 1, column: 0 },
      };

      const primitiveNode = new PrimitiveBabylonNode(
        'perf-test-high-detail-sphere',
        scene,
        highDetailSphere,
        openscadGlobals
      );

      const startTime = performance.now();
      const result = await primitiveNode.generateMesh();
      const endTime = performance.now();

      const generationTime = endTime - startTime;

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const vertexCount = result.data.getTotalVertices();
        console.log(
          `High-detail sphere: ${vertexCount} vertices in ${generationTime.toFixed(2)}ms`
        );

        // High detail should still be reasonable
        expect(generationTime).toBeLessThan(50); // More lenient for high detail
        expect(vertexCount).toBeGreaterThan(1000); // Should have many vertices
      }
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not leak memory during repeated generation', async () => {
      const sphereNode: SphereNode = {
        type: 'sphere',
        r: 3,
        $fn: 8,
        $fa: undefined,
        $fs: undefined,
        location: { line: 1, column: 0 },
      };

      const initialMemory = process.memoryUsage().heapUsed;

      // Generate many spheres to test memory usage
      for (let i = 0; i < 20; i++) {
        const primitiveNode = new PrimitiveBabylonNode(
          `memory-test-sphere-${i}`,
          scene,
          sphereNode,
          openscadGlobals
        );

        const result = await primitiveNode.generateMesh();
        expect(isSuccess(result)).toBe(true);

        // Dispose mesh to prevent accumulation
        if (isSuccess(result)) {
          result.data.dispose();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      console.log(`Memory increase after 20 generations: ${memoryIncrease.toFixed(2)}MB`);

      // Should not have significant memory increase
      expect(memoryIncrease).toBeLessThan(10); // Less than 10MB increase
    });
  });

  describe('Performance Benchmarking', () => {
    it('should benchmark different primitive types', async () => {
      const primitives = [
        {
          name: 'Sphere (fn=8)',
          node: {
            type: 'sphere' as const,
            r: 5,
            $fn: 8,
            location: { line: 1, column: 0 },
          },
        },
        {
          name: 'Cube (2x2x2)',
          node: {
            type: 'cube' as const,
            size: { x: 2, y: 2, z: 2 },
            center: true,
            location: { line: 1, column: 0 },
          },
        },
        {
          name: 'Cylinder (fn=8)',
          node: {
            type: 'cylinder' as const,
            h: 5,
            r: 2,
            $fn: 8,
            location: { line: 1, column: 0 },
          },
        },
      ];

      const results: Array<{ name: string; time: number; vertices: number }> = [];

      for (const primitive of primitives) {
        const primitiveNode = new PrimitiveBabylonNode(
          `benchmark-${primitive.name}`,
          scene,
          primitive.node,
          openscadGlobals
        );

        const startTime = performance.now();
        const result = await primitiveNode.generateMesh();
        const endTime = performance.now();

        const generationTime = endTime - startTime;

        expect(isSuccess(result)).toBe(true);

        if (isSuccess(result)) {
          const vertexCount = result.data.getTotalVertices();
          results.push({
            name: primitive.name,
            time: generationTime,
            vertices: vertexCount,
          });
        }
      }

      // Log benchmark results
      console.log('\n📊 Performance Benchmark Results:');
      results.forEach((result) => {
        console.log(`${result.name}: ${result.time.toFixed(2)}ms (${result.vertices} vertices)`);
      });

      // All should meet performance targets
      results.forEach((result) => {
        expect(result.time).toBeLessThan(16);
      });
    });
  });
});
