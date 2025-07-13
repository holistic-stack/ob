/**
 * @file Manifold Transformation API Debug Tests
 * @description Research and test Manifold's native transformation capabilities
 * Following project guidelines: no mocks, real implementations, Result<T,E> patterns
 */

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { ManifoldWasmLoader } from '../manifold-wasm-loader/manifold-wasm-loader';

describe('Manifold Transformation API Research', () => {
  let manifoldModule: any;

  beforeEach(async () => {
    const loader = new ManifoldWasmLoader();
    manifoldModule = await loader.load();
  });

  afterEach(() => {
    // Clean up any created Manifold objects
  });

  describe('Step D.4.1: Transformation API Discovery', () => {
    test('should explore available transformation methods on Manifold objects', () => {
      // Create a test cube using our proven static constructor approach
      const cube = manifoldModule._Cube({ x: 2, y: 2, z: 2 }, false);

      expect(cube).toBeDefined();
      expect(cube.isEmpty()).toBe(false);

      // Explore available methods on the Manifold object
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(cube));
      const transformationMethods = methods.filter(
        (method) =>
          method.toLowerCase().includes('transform') ||
          method.toLowerCase().includes('translate') ||
          method.toLowerCase().includes('rotate') ||
          method.toLowerCase().includes('scale') ||
          method.toLowerCase().includes('move')
      );

      console.log('Available transformation methods:', transformationMethods);
      console.log('All available methods:', methods.sort());

      // Test basic properties
      console.log('Cube properties:', {
        isEmpty: cube.isEmpty(),
        numVert: cube.numVert(),
        numTri: cube.numTri(),
        type: typeof cube,
        constructor: cube.constructor.name,
      });

      // Clean up
      cube.delete();
    });

    test('should test translate transformation if available', () => {
      const cube = manifoldModule._Cube({ x: 1, y: 1, z: 1 }, false);

      // Test various possible translate method names
      const possibleTranslateMethods = [
        'translate',
        'Translate',
        'move',
        'Move',
        'transform',
        'Transform',
        'setTranslation',
      ];

      let translateMethod = null;
      for (const methodName of possibleTranslateMethods) {
        if (typeof cube[methodName] === 'function') {
          translateMethod = methodName;
          console.log(`Found translate method: ${methodName}`);
          break;
        }
      }

      if (translateMethod) {
        try {
          // Test different parameter formats
          let translatedCube;

          // Try vector format [x, y, z]
          try {
            translatedCube = cube[translateMethod]([1, 2, 3]);
            console.log('Translate with vector [1,2,3] succeeded');
          } catch (e) {
            console.log('Translate with vector failed:', e.message);
          }

          // Try individual parameters (x, y, z)
          if (!translatedCube) {
            try {
              translatedCube = cube[translateMethod](1, 2, 3);
              console.log('Translate with parameters (1,2,3) succeeded');
            } catch (e) {
              console.log('Translate with parameters failed:', e.message);
            }
          }

          // Try object format {x, y, z}
          if (!translatedCube) {
            try {
              translatedCube = cube[translateMethod]({ x: 1, y: 2, z: 3 });
              console.log('Translate with object {x:1,y:2,z:3} succeeded');
            } catch (e) {
              console.log('Translate with object failed:', e.message);
            }
          }

          if (translatedCube) {
            expect(translatedCube.isEmpty()).toBe(false);
            expect(translatedCube.numVert()).toBeGreaterThan(0);

            console.log('Translation result:', {
              isEmpty: translatedCube.isEmpty(),
              numVert: translatedCube.numVert(),
              numTri: translatedCube.numTri(),
            });

            translatedCube.delete();
          }
        } catch (error) {
          console.log('Translation test failed:', error);
        }
      } else {
        console.log('No translate method found');
      }

      cube.delete();
    });

    test('should test matrix transformation if available', () => {
      const sphere = manifoldModule._Sphere(1, 32);

      // Test matrix transformation methods
      const possibleMatrixMethods = ['transform', 'Transform', 'applyMatrix', 'setMatrix'];

      let matrixMethod = null;
      for (const methodName of possibleMatrixMethods) {
        if (typeof sphere[methodName] === 'function') {
          matrixMethod = methodName;
          console.log(`Found matrix method: ${methodName}`);
          break;
        }
      }

      if (matrixMethod) {
        try {
          // Create a simple translation matrix
          // Translation by (2, 3, 4)
          const translationMatrix = [
            1,
            0,
            0,
            2, // row 1: [1, 0, 0, 2]
            0,
            1,
            0,
            3, // row 2: [0, 1, 0, 3]
            0,
            0,
            1,
            4, // row 3: [0, 0, 1, 4]
            0,
            0,
            0,
            1, // row 4: [0, 0, 0, 1]
          ];

          // Try different matrix formats
          let transformedSphere;

          // Try flat array
          try {
            transformedSphere = sphere[matrixMethod](translationMatrix);
            console.log('Matrix transform with flat array succeeded');
          } catch (e) {
            console.log('Matrix transform with flat array failed:', e.message);
          }

          // Try Float32Array
          if (!transformedSphere) {
            try {
              transformedSphere = sphere[matrixMethod](new Float32Array(translationMatrix));
              console.log('Matrix transform with Float32Array succeeded');
            } catch (e) {
              console.log('Matrix transform with Float32Array failed:', e.message);
            }
          }

          if (transformedSphere) {
            expect(transformedSphere.isEmpty()).toBe(false);
            expect(transformedSphere.numVert()).toBeGreaterThan(0);

            console.log('Matrix transformation result:', {
              isEmpty: transformedSphere.isEmpty(),
              numVert: transformedSphere.numVert(),
              numTri: transformedSphere.numTri(),
            });

            transformedSphere.delete();
          }
        } catch (error) {
          console.log('Matrix transformation test failed:', error);
        }
      } else {
        console.log('No matrix transformation method found');
      }

      sphere.delete();
    });

    test('should test CSG operations with transformed objects', () => {
      const cube1 = manifoldModule._Cube({ x: 1, y: 1, z: 1 }, false);
      const cube2 = manifoldModule._Cube({ x: 1, y: 1, z: 1 }, false);

      // Test if we can perform CSG operations on the original objects
      const union1 = cube1.add(cube2);
      expect(union1.isEmpty()).toBe(false);

      console.log('CSG with untransformed objects:', {
        cube1_verts: cube1.numVert(),
        cube2_verts: cube2.numVert(),
        union_verts: union1.numVert(),
      });

      // If transformation methods are available, test CSG with transformed objects
      if (typeof cube1.translate === 'function' || typeof cube1.transform === 'function') {
        console.log('Testing CSG operations with transformed objects...');
        // This will be implemented based on the results of the previous tests
      }

      // Clean up
      cube1.delete();
      cube2.delete();
      union1.delete();
    });

    test('should explore Manifold module static transformation methods', () => {
      // Check if the manifoldModule itself has transformation utilities
      const moduleProps = Object.getOwnPropertyNames(manifoldModule);
      const transformationProps = moduleProps.filter(
        (prop) =>
          prop.toLowerCase().includes('transform') ||
          prop.toLowerCase().includes('translate') ||
          prop.toLowerCase().includes('matrix')
      );

      console.log('Module transformation properties:', transformationProps);
      console.log('All module properties:', moduleProps.sort());

      // Test if there are static transformation methods
      if (manifoldModule.Transform) {
        console.log('Found Transform static method');
      }
      if (manifoldModule.Matrix) {
        console.log('Found Matrix static method');
      }
    });
  });
});
