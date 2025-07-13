/**
 * @file Manifold Constructor Debug Tests
 * @description Focused tests to debug Manifold WASM constructor issues
 * Following TDD approach to isolate and solve the core CSG problem
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { ManifoldWasmLoader } from '../manifold-wasm-loader/manifold-wasm-loader';
import type { IManifoldMesh } from '../manifold-mesh-converter/manifold-mesh-converter';

describe('Manifold Constructor Debug', () => {
  let manifoldModule: any;

  beforeEach(async () => {
    const loader = new ManifoldWasmLoader();
    manifoldModule = await loader.load();

    // CRITICAL: Call setup() to initialize the module
    if (typeof manifoldModule.setup === 'function') {
      manifoldModule.setup();
    }
  });

  afterEach(() => {
    // Clean up any created Manifold objects
    if (manifoldModule) {
      // Module cleanup if needed
    }
  });

  describe('Step D.1: Minimal Manifold Constructor Tests', () => {
    test('should load Manifold WASM module and inspect API', () => {
      expect(manifoldModule).toBeDefined();

      // Debug: Log what the module actually contains
      console.log('Manifold module type:', typeof manifoldModule);
      console.log('Manifold module keys:', Object.keys(manifoldModule || {}));
      console.log('Manifold module prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(manifoldModule || {})));

      // Check for common expected properties
      console.log('Available properties:', {
        Manifold: typeof manifoldModule?.Manifold,
        cube: typeof manifoldModule?.cube,
        sphere: typeof manifoldModule?.sphere,
        setup: typeof manifoldModule?.setup,
        default: typeof manifoldModule?.default,
      });

      // The module should be defined, but we need to understand its structure
      expect(manifoldModule).toBeDefined();
    });

    test('should create Manifold object from minimal triangle mesh', () => {
      // Create minimal valid triangle mesh data
      const minimalMesh: IManifoldMesh = {
        numProp: 3, // Only positions (x, y, z)
        vertProperties: new Float32Array([
          0.0, 1.0, 0.0,  // vertex 0
          -1.0, -1.0, 0.0, // vertex 1
          1.0, -1.0, 0.0,  // vertex 2
        ]),
        triVerts: new Uint32Array([0, 1, 2]), // Single triangle
        runIndex: new Uint32Array([0]),
        runOriginalID: new Uint32Array([0]),
        numRun: 1,
      };

      console.log('Testing minimal mesh:', {
        numProp: minimalMesh.numProp,
        vertProperties: minimalMesh.vertProperties.length,
        triVerts: minimalMesh.triVerts.length,
        numRun: minimalMesh.numRun,
      });

      // Test Manifold constructor
      let manifoldObject: any;
      expect(() => {
        manifoldObject = new manifoldModule.Manifold(minimalMesh);
      }).not.toThrow();

      expect(manifoldObject).toBeDefined();

      // Test if the created Manifold object has expected methods
      expect(typeof manifoldObject.isEmpty).toBe('function');
      expect(typeof manifoldObject.numVert).toBe('function');
      expect(typeof manifoldObject.numTri).toBe('function');

      // Check if the Manifold object contains data
      const isEmpty = manifoldObject.isEmpty();
      const numVert = manifoldObject.numVert();
      const numTri = manifoldObject.numTri();

      console.log('Manifold object stats:', {
        isEmpty,
        numVert,
        numTri,
      });

      expect(isEmpty).toBe(false);
      expect(numVert).toBeGreaterThan(0);
      expect(numTri).toBeGreaterThan(0);

      // Clean up
      manifoldObject.delete();
    });

    test('should test different mesh data formats', () => {
      // Test with different numProp values
      const meshWithNormals: IManifoldMesh = {
        numProp: 6, // Positions + normals
        vertProperties: new Float32Array([
          // vertex 0: position + normal
          0.0, 1.0, 0.0,   0.0, 0.0, 1.0,
          // vertex 1: position + normal
          -1.0, -1.0, 0.0, 0.0, 0.0, 1.0,
          // vertex 2: position + normal
          1.0, -1.0, 0.0,  0.0, 0.0, 1.0,
        ]),
        triVerts: new Uint32Array([0, 1, 2]),
        runIndex: new Uint32Array([0]),
        runOriginalID: new Uint32Array([0]),
        numRun: 1,
      };

      let manifoldObject: any;
      expect(() => {
        manifoldObject = new manifoldModule.Manifold(meshWithNormals);
      }).not.toThrow();

      const isEmpty = manifoldObject.isEmpty();
      const numVert = manifoldObject.numVert();

      console.log('Mesh with normals stats:', {
        isEmpty,
        numVert,
        inputVertices: meshWithNormals.vertProperties.length / meshWithNormals.numProp,
      });

      expect(isEmpty).toBe(false);
      expect(numVert).toBeGreaterThan(0);

      manifoldObject.delete();
    });

    test('should test mesh extraction from created Manifold', () => {
      const testMesh: IManifoldMesh = {
        numProp: 3,
        vertProperties: new Float32Array([
          0.0, 1.0, 0.0,
          -1.0, -1.0, 0.0,
          1.0, -1.0, 0.0,
        ]),
        triVerts: new Uint32Array([0, 1, 2]),
        runIndex: new Uint32Array([0]),
        runOriginalID: new Uint32Array([0]),
        numRun: 1,
      };

      const manifoldObject = new manifoldModule.Manifold(testMesh);
      
      // Test mesh extraction using standard getMesh() method
      const extractedMesh = manifoldObject.getMesh();
      
      console.log('Extracted mesh data:', {
        type: typeof extractedMesh,
        keys: Object.keys(extractedMesh || {}),
        vertProperties: extractedMesh?.vertProperties?.length || 0,
        triVerts: extractedMesh?.triVerts?.length || 0,
        numProp: extractedMesh?.numProp,
      });

      expect(extractedMesh).toBeDefined();
      expect(extractedMesh.vertProperties).toBeDefined();
      expect(extractedMesh.triVerts).toBeDefined();
      expect(extractedMesh.vertProperties.length).toBeGreaterThan(0);
      expect(extractedMesh.triVerts.length).toBeGreaterThan(0);

      manifoldObject.delete();
    });

    test('should test Manifold static constructors', () => {
      // Test if static constructors work (using correct API with underscores)
      // _Cube expects object with x, y, z properties and center boolean
      const cube = manifoldModule._Cube({x: 1, y: 1, z: 1}, false); // size object, center
      const sphere = manifoldModule._Sphere(0.5, 32); // radius, circularSegments

      console.log('Static constructor results:', {
        cube_isEmpty: cube.isEmpty(),
        cube_numVert: cube.numVert(),
        cube_numTri: cube.numTri(),
        sphere_isEmpty: sphere.isEmpty(),
        sphere_numVert: sphere.numVert(),
        sphere_numTri: sphere.numTri(),
      });

      expect(cube.isEmpty()).toBe(false);
      expect(cube.numVert()).toBeGreaterThan(0);
      expect(sphere.isEmpty()).toBe(false);
      expect(sphere.numVert()).toBeGreaterThan(0);

      // Test union with static constructors
      const union = cube.add(sphere);
      console.log('Static union result:', {
        union_isEmpty: union.isEmpty(),
        union_numVert: union.numVert(),
        union_numTri: union.numTri(),
      });

      expect(union.isEmpty()).toBe(false);
      expect(union.numVert()).toBeGreaterThan(0);

      // Test mesh extraction from working Manifold objects
      const cubeMesh = cube.getMesh();
      const sphereMesh = sphere.getMesh();
      const unionMesh = union.getMesh();

      console.log('Mesh extraction results:', {
        cubeMesh: {
          type: typeof cubeMesh,
          keys: Object.keys(cubeMesh || {}),
          vertProperties: cubeMesh?.vertProperties?.length || 0,
          triVerts: cubeMesh?.triVerts?.length || 0,
        },
        sphereMesh: {
          vertProperties: sphereMesh?.vertProperties?.length || 0,
          triVerts: sphereMesh?.triVerts?.length || 0,
        },
        unionMesh: {
          vertProperties: unionMesh?.vertProperties?.length || 0,
          triVerts: unionMesh?.triVerts?.length || 0,
        },
      });

      expect(cubeMesh).toBeDefined();
      expect(cubeMesh.vertProperties).toBeDefined();
      expect(cubeMesh.triVerts).toBeDefined();
      expect(cubeMesh.vertProperties.length).toBeGreaterThan(0);
      expect(cubeMesh.triVerts.length).toBeGreaterThan(0);

      // Clean up
      cube.delete();
      sphere.delete();
      union.delete();
    });

    test('should compare working mesh format vs our IManifoldMesh format', () => {
      // Create a working cube using static constructor
      const cube = manifoldModule._Cube({x: 1, y: 1, z: 1}, false);
      const workingMesh = cube.getMesh();

      // Create our IManifoldMesh format (the one that fails)
      const ourMesh: IManifoldMesh = {
        numProp: 3,
        vertProperties: new Float32Array([
          0.0, 1.0, 0.0,
          -1.0, -1.0, 0.0,
          1.0, -1.0, 0.0,
        ]),
        triVerts: new Uint32Array([0, 1, 2]),
        runIndex: new Uint32Array([0]),
        runOriginalID: new Uint32Array([0]),
        numRun: 1,
      };

      console.log('Format comparison:', {
        workingMesh: {
          type: typeof workingMesh,
          keys: Object.keys(workingMesh || {}),
          numProp: workingMesh?.numProp,
          vertProperties: {
            type: workingMesh?.vertProperties?.constructor?.name,
            length: workingMesh?.vertProperties?.length,
            sample: workingMesh?.vertProperties?.slice(0, 6),
          },
          triVerts: {
            type: workingMesh?.triVerts?.constructor?.name,
            length: workingMesh?.triVerts?.length,
            sample: workingMesh?.triVerts?.slice(0, 6),
          },
          additionalFields: {
            mergeFromVert: workingMesh?.mergeFromVert?.length || 0,
            mergeToVert: workingMesh?.mergeToVert?.length || 0,
            runIndex: workingMesh?.runIndex?.length || 0,
            runOriginalID: workingMesh?.runOriginalID?.length || 0,
            faceID: workingMesh?.faceID?.length || 0,
            halfedgeTangent: workingMesh?.halfedgeTangent?.length || 0,
            runTransform: workingMesh?.runTransform?.length || 0,
          }
        },
        ourMesh: {
          type: typeof ourMesh,
          keys: Object.keys(ourMesh || {}),
          numProp: ourMesh?.numProp,
          vertProperties: {
            type: ourMesh?.vertProperties?.constructor?.name,
            length: ourMesh?.vertProperties?.length,
            sample: ourMesh?.vertProperties?.slice(0, 6),
          },
          triVerts: {
            type: ourMesh?.triVerts?.constructor?.name,
            length: ourMesh?.triVerts?.length,
            sample: ourMesh?.triVerts?.slice(0, 6),
          },
        }
      });

      // Test if we can create a Manifold object using the working mesh format
      let manifoldFromWorking: any;
      expect(() => {
        manifoldFromWorking = new manifoldModule.Manifold(workingMesh);
      }).not.toThrow();

      expect(manifoldFromWorking.isEmpty()).toBe(false);
      expect(manifoldFromWorking.numVert()).toBeGreaterThan(0);

      // Clean up
      cube.delete();
      manifoldFromWorking.delete();
    });

    test('should test simple union operation with minimal meshes', () => {
      // Create two simple triangle meshes
      const mesh1: IManifoldMesh = {
        numProp: 3,
        vertProperties: new Float32Array([
          0.0, 1.0, 0.0,
          -1.0, -1.0, 0.0,
          1.0, -1.0, 0.0,
        ]),
        triVerts: new Uint32Array([0, 1, 2]),
        runIndex: new Uint32Array([0]),
        runOriginalID: new Uint32Array([0]),
        numRun: 1,
      };

      const mesh2: IManifoldMesh = {
        numProp: 3,
        vertProperties: new Float32Array([
          0.0, 2.0, 0.0,
          -0.5, 0.0, 0.0,
          0.5, 0.0, 0.0,
        ]),
        triVerts: new Uint32Array([0, 1, 2]),
        runIndex: new Uint32Array([0]),
        runOriginalID: new Uint32Array([0]),
        numRun: 1,
      };

      const manifold1 = new manifoldModule.Manifold(mesh1);
      const manifold2 = new manifoldModule.Manifold(mesh2);

      console.log('Before union:', {
        manifold1_isEmpty: manifold1.isEmpty(),
        manifold1_numVert: manifold1.numVert(),
        manifold2_isEmpty: manifold2.isEmpty(),
        manifold2_numVert: manifold2.numVert(),
      });

      // Perform union
      const unionResult = manifold1.add(manifold2);
      
      console.log('After union:', {
        union_isEmpty: unionResult.isEmpty(),
        union_numVert: unionResult.numVert(),
        union_numTri: unionResult.numTri(),
      });

      expect(unionResult.isEmpty()).toBe(false);
      expect(unionResult.numVert()).toBeGreaterThan(0);

      // Test mesh extraction using standard getMesh() method
      const resultMesh = unionResult.getMesh();
      
      console.log('Union result mesh:', {
        vertProperties: resultMesh?.vertProperties?.length || 0,
        triVerts: resultMesh?.triVerts?.length || 0,
      });

      expect(resultMesh.vertProperties.length).toBeGreaterThan(0);
      expect(resultMesh.triVerts.length).toBeGreaterThan(0);

      // Clean up
      manifold1.delete();
      manifold2.delete();
      unionResult.delete();
    });
  });
});
