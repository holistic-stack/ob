/**
 * @file OpenSCAD Material Service Tests
 *
 * Tests for the OpenSCADMaterialService following TDD principles.
 * Uses real BabylonJS NullEngine (no mocks).
 */

import { NullEngine, Scene, Color3, Color4, StandardMaterial, PBRMaterial } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  OpenSCADMaterialService,
  OPENSCAD_NAMED_COLORS,
  type MaterialFromColorConfig,
} from './openscad-material.service';
import type { ColorNode } from '../../../openscad-parser/ast/ast-types';

describe('OpenSCADMaterialService', () => {
  let engine: NullEngine;
  let scene: Scene;
  let materialService: OpenSCADMaterialService;

  beforeEach(() => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);
    materialService = new OpenSCADMaterialService(scene);
  });

  afterEach(() => {
    // Clean up resources
    materialService.dispose();
    scene.dispose();
    engine.dispose();
  });

  describe('Service Initialization', () => {
    it('should initialize OpenSCAD material service', () => {
      expect(materialService).toBeDefined();
      expect(materialService.getCacheStats().size).toBe(0);
    });
  });

  describe('Named Colors', () => {
    it('should have all basic named colors defined', () => {
      expect(OPENSCAD_NAMED_COLORS.red).toEqual([1, 0, 0]);
      expect(OPENSCAD_NAMED_COLORS.green).toEqual([0, 1, 0]);
      expect(OPENSCAD_NAMED_COLORS.blue).toEqual([0, 0, 1]);
      expect(OPENSCAD_NAMED_COLORS.white).toEqual([1, 1, 1]);
      expect(OPENSCAD_NAMED_COLORS.black).toEqual([0, 0, 0]);
    });

    it('should have extended colors defined', () => {
      expect(OPENSCAD_NAMED_COLORS.orange).toEqual([1, 0.5, 0]);
      expect(OPENSCAD_NAMED_COLORS.purple).toEqual([0.5, 0, 0.5]);
      expect(OPENSCAD_NAMED_COLORS.brown).toEqual([0.6, 0.3, 0.1]);
    });

    it('should support both gray and grey spellings', () => {
      expect(OPENSCAD_NAMED_COLORS.gray).toEqual([0.5, 0.5, 0.5]);
      expect(OPENSCAD_NAMED_COLORS.grey).toEqual([0.5, 0.5, 0.5]);
    });
  });

  describe('Material Creation from Colors', () => {
    it('should create standard material from named color', async () => {
      const config: MaterialFromColorConfig = {
        color: 'red',
        name: 'red_material',
        materialType: 'standard',
      };

      const result = await materialService.createMaterialFromColor(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const material = result.data as StandardMaterial;
        expect(material).toBeInstanceOf(StandardMaterial);
        expect(material.name).toBe('red_material');
        expect(material.diffuseColor).toEqual(new Color3(1, 0, 0));
        expect(material.alpha).toBe(1.0);
      }
    });

    it('should create PBR material from named color', async () => {
      const config: MaterialFromColorConfig = {
        color: 'blue',
        name: 'blue_pbr_material',
        materialType: 'pbr',
      };

      const result = await materialService.createMaterialFromColor(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const material = result.data as PBRMaterial;
        expect(material).toBeInstanceOf(PBRMaterial);
        expect(material.name).toBe('blue_pbr_material');
        expect(material.albedoColor).toEqual(new Color3(0, 0, 1));
        expect(material.alpha).toBe(1.0);
      }
    });

    it('should create material from RGB array', async () => {
      const config: MaterialFromColorConfig = {
        color: [0.5, 0.8, 0.2],
        name: 'rgb_material',
      };

      const result = await materialService.createMaterialFromColor(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const material = result.data as StandardMaterial;
        expect(material.diffuseColor.r).toBeCloseTo(0.5, 2);
        expect(material.diffuseColor.g).toBeCloseTo(0.8, 2);
        expect(material.diffuseColor.b).toBeCloseTo(0.2, 2);
        expect(material.alpha).toBe(1.0);
      }
    });

    it('should create material from RGBA array', async () => {
      const config: MaterialFromColorConfig = {
        color: [1, 0.5, 0, 0.7],
        name: 'rgba_material',
      };

      const result = await materialService.createMaterialFromColor(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const material = result.data as StandardMaterial;
        expect(material.diffuseColor.r).toBeCloseTo(1, 2);
        expect(material.diffuseColor.g).toBeCloseTo(0.5, 2);
        expect(material.diffuseColor.b).toBeCloseTo(0, 2);
        expect(material.alpha).toBeCloseTo(0.7, 2);
      }
    });

    it('should create material with separate alpha parameter', async () => {
      const config: MaterialFromColorConfig = {
        color: [0, 1, 0],
        alpha: 0.5,
        name: 'alpha_material',
      };

      const result = await materialService.createMaterialFromColor(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const material = result.data as StandardMaterial;
        expect(material.diffuseColor).toEqual(new Color3(0, 1, 0));
        expect(material.alpha).toBe(0.5);
      }
    });

    it('should handle case-insensitive named colors', async () => {
      const config: MaterialFromColorConfig = {
        color: 'RED',
        name: 'uppercase_red',
      };

      const result = await materialService.createMaterialFromColor(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const material = result.data as StandardMaterial;
        expect(material.diffuseColor).toEqual(new Color3(1, 0, 0));
      }
    });

    it('should fail with unknown named color', async () => {
      const config: MaterialFromColorConfig = {
        color: 'unknown_color',
        name: 'invalid_material',
      };

      const result = await materialService.createMaterialFromColor(config);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('MATERIAL_CREATION_FAILED');
        expect(result.error.colorValue).toBe('unknown_color');
      }
    });

    it('should fail with invalid color array length', async () => {
      const config: MaterialFromColorConfig = {
        color: [1, 0] as any, // Invalid length
        name: 'invalid_array',
      };

      const result = await materialService.createMaterialFromColor(config);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('MATERIAL_CREATION_FAILED');
      }
    });
  });

  describe('Material Creation from ColorNode', () => {
    it('should create material from ColorNode with string color', async () => {
      const colorNode: ColorNode = {
        type: 'color',
        c: 'green',
        children: [],
      };

      const result = await materialService.createMaterialFromColorNode(colorNode, 'node_material');
      expect(result.success).toBe(true);
      
      if (result.success) {
        const material = result.data as StandardMaterial;
        expect(material.name).toBe('node_material');
        expect(material.diffuseColor).toEqual(new Color3(0, 1, 0));
      }
    });

    it('should create material from ColorNode with RGBA array', async () => {
      const colorNode: ColorNode = {
        type: 'color',
        c: [0.8, 0.2, 0.9, 0.6],
        children: [],
      };

      const result = await materialService.createMaterialFromColorNode(colorNode, 'rgba_node_material', 'pbr');
      expect(result.success).toBe(true);
      
      if (result.success) {
        const material = result.data as PBRMaterial;
        expect(material).toBeInstanceOf(PBRMaterial);
        expect(material.albedoColor.r).toBeCloseTo(0.8, 2);
        expect(material.albedoColor.g).toBeCloseTo(0.2, 2);
        expect(material.albedoColor.b).toBeCloseTo(0.9, 2);
        expect(material.alpha).toBeCloseTo(0.6, 2);
      }
    });
  });

  describe('Material Caching', () => {
    it('should cache materials and reuse them', async () => {
      const config: MaterialFromColorConfig = {
        color: 'red',
        name: 'cached_material',
      };

      // Create material first time
      const result1 = await materialService.createMaterialFromColor(config);
      expect(result1.success).toBe(true);
      expect(materialService.getCacheStats().size).toBe(1);

      // Create same material second time (should use cache)
      const result2 = await materialService.createMaterialFromColor(config);
      expect(result2.success).toBe(true);
      expect(materialService.getCacheStats().size).toBe(1);

      // Should be the same material instance
      if (result1.success && result2.success) {
        expect(result1.data).toBe(result2.data);
      }
    });

    it('should create different cache entries for different configurations', async () => {
      const config1: MaterialFromColorConfig = {
        color: 'red',
        name: 'material1',
        materialType: 'standard',
      };

      const config2: MaterialFromColorConfig = {
        color: 'red',
        name: 'material2',
        materialType: 'pbr',
      };

      await materialService.createMaterialFromColor(config1);
      await materialService.createMaterialFromColor(config2);

      expect(materialService.getCacheStats().size).toBe(2);
    });

    it('should clear cache properly', async () => {
      const config: MaterialFromColorConfig = {
        color: 'blue',
        name: 'test_material',
      };

      await materialService.createMaterialFromColor(config);
      expect(materialService.getCacheStats().size).toBe(1);

      materialService.clearCache();
      expect(materialService.getCacheStats().size).toBe(0);
    });

    it('should provide cache statistics', async () => {
      const config1: MaterialFromColorConfig = {
        color: 'red',
        name: 'material1',
      };

      const config2: MaterialFromColorConfig = {
        color: 'blue',
        name: 'material2',
      };

      await materialService.createMaterialFromColor(config1);
      await materialService.createMaterialFromColor(config2);

      const stats = materialService.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.keys.length).toBe(2);
      expect(stats.keys).toContain('standard_red_1');
      expect(stats.keys).toContain('standard_blue_1');
    });
  });

  describe('Material Properties', () => {
    it('should set proper standard material properties', async () => {
      const config: MaterialFromColorConfig = {
        color: 'yellow',
        name: 'standard_props',
        materialType: 'standard',
      };

      const result = await materialService.createMaterialFromColor(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const material = result.data as StandardMaterial;
        expect(material.specularColor).toEqual(new Color3(0.1, 0.1, 0.1));
        expect(material.emissiveColor).toEqual(new Color3(0, 0, 0));
        expect(material.ambientColor).toEqual(new Color3(0.1, 0.1, 0.1));
      }
    });

    it('should set proper PBR material properties', async () => {
      const config: MaterialFromColorConfig = {
        color: 'cyan',
        name: 'pbr_props',
        materialType: 'pbr',
      };

      const result = await materialService.createMaterialFromColor(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const material = result.data as PBRMaterial;
        expect(material.metallic).toBe(0.1);
        expect(material.roughness).toBe(0.8);
        expect(material.emissiveColor).toEqual(new Color3(0, 0, 0));
      }
    });
  });

  describe('Disposal', () => {
    it('should dispose all materials and clear cache', async () => {
      const config: MaterialFromColorConfig = {
        color: 'purple',
        name: 'disposable_material',
      };

      await materialService.createMaterialFromColor(config);
      expect(materialService.getCacheStats().size).toBe(1);

      materialService.dispose();
      expect(materialService.getCacheStats().size).toBe(0);
    });

    it('should handle multiple dispose calls', () => {
      materialService.dispose();
      materialService.dispose(); // Should not throw
      expect(materialService.getCacheStats().size).toBe(0);
    });
  });
});
