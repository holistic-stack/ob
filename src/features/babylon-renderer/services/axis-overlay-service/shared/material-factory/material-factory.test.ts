/**
 * @file material-factory.test.ts
 * @description Tests for the MaterialFactory class
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { MaterialFactory } from './material-factory';

describe('MaterialFactory', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let factory: MaterialFactory;

  beforeEach(() => {
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    factory = new MaterialFactory();
  });

  afterEach(() => {
    scene.dispose();
    engine.dispose();
  });

  describe('createAxisMaterial', () => {
    it('should create a standard material with correct properties', () => {
      const config = {
        name: 'TestMaterial',
        color: new BABYLON.Color3(1, 0, 0),
        opacity: 0.8,
        emissiveScale: 0.5,
        disableLighting: true,
      };

      const result = factory.createAxisMaterial(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        const material = result.data;
        expect(material.name).toBe('TestMaterial');
        expect(material.diffuseColor.r).toBe(1);
        expect(material.diffuseColor.g).toBe(0);
        expect(material.diffuseColor.b).toBe(0);
        expect(material.alpha).toBe(0.8);
        expect(material.disableLighting).toBe(true);
      }
    });

    it('should handle null scene gracefully', () => {
      const config = {
        name: 'TestMaterial',
        color: new BABYLON.Color3(1, 0, 0),
      };

      const result = factory.createAxisMaterial(null, config);

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('SCENE_NULL');
    });

    it('should use default values for optional properties', () => {
      const config = {
        name: 'TestMaterial',
        color: new BABYLON.Color3(0, 1, 0),
      };

      const result = factory.createAxisMaterial(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        const material = result.data;
        expect(material.alpha).toBe(1.0);
        expect(material.disableLighting).toBe(false);
      }
    });
  });

  describe('createSolidLineMaterial', () => {
    it('should create material optimized for solid lines', () => {
      const result = factory.createSolidLineMaterial(
        scene,
        'SolidLine',
        new BABYLON.Color3(0, 0, 1)
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const material = result.data;
        expect(material.name).toBe('SolidLine');
        expect(material.alpha).toBe(1.0);
        expect(material.disableLighting).toBe(true);
        expect(material.diffuseColor.b).toBe(1);
      }
    });
  });

  describe('createDottedLineMaterial', () => {
    it('should create material optimized for dotted lines', () => {
      const result = factory.createDottedLineMaterial(
        scene,
        'DottedLine',
        new BABYLON.Color3(1, 1, 0)
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const material = result.data;
        expect(material.name).toBe('DottedLine');
        expect(material.alpha).toBe(0.9);
        expect(material.disableLighting).toBe(true);
      }
    });
  });

  describe('createCylinderMaterial', () => {
    it('should create material optimized for 3D cylinders', () => {
      const result = factory.createCylinderMaterial(
        scene,
        'Cylinder',
        new BABYLON.Color3(1, 0, 1),
        0.7
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const material = result.data;
        expect(material.name).toBe('Cylinder');
        expect(material.alpha).toBe(0.7);
        expect(material.disableLighting).toBe(false);
      }
    });

    it('should use default opacity when not provided', () => {
      const result = factory.createCylinderMaterial(
        scene,
        'Cylinder',
        new BABYLON.Color3(1, 0, 1)
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alpha).toBe(1.0);
      }
    });
  });
});
