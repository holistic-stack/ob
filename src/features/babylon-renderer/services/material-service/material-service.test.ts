/**
 * @file Material Service Tests
 * 
 * TDD tests for Babylon.js material service
 * Following functional programming and SRP principles
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { createMaterialService } from './material-service';
import type { MaterialConfig, MaterialData } from '../../types/babylon-types';

describe('MaterialService', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let materialService: ReturnType<typeof createMaterialService>;

  beforeEach(() => {
    console.log('[INIT] Setting up material service tests');
    
    // Create NullEngine for testing
    engine = new BABYLON.NullEngine({
      renderWidth: 800,
      renderHeight: 600,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1
    });
    
    scene = new BABYLON.Scene(engine);
    materialService = createMaterialService();
  });

  afterEach(() => {
    console.log('[END] Cleaning up material service tests');
    
    if (scene && !scene.isDisposed) {
      scene.dispose();
    }
    
    if (engine && !engine.isDisposed) {
      engine.dispose();
    }
  });

  describe('createMaterial', () => {
    it('should create material with default configuration', () => {
      console.log('[DEBUG] Testing material creation with defaults');
      
      const result = materialService.createMaterial('testMaterial', scene);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const material = result.data;
        expect(material).toBeInstanceOf(BABYLON.StandardMaterial);
        expect(material.name).toBe('testMaterial');
        expect(material.getScene()).toBe(scene);
        expect(material.backFaceCulling).toBe(false);
        expect(material.wireframe).toBe(false);
        expect(material.disableLighting).toBe(false);
      }
    });

    it('should create material with custom configuration', () => {
      console.log('[DEBUG] Testing material creation with custom config');
      
      const config: MaterialConfig = {
        diffuseColor: [1, 0, 0],
        specularColor: [0, 1, 0],
        emissiveColor: [0, 0, 1],
        backFaceCulling: true,
        wireframe: true,
        disableLighting: true
      };
      
      const result = materialService.createMaterial('customMaterial', scene, config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const material = result.data;
        expect(material.diffuseColor.r).toBeCloseTo(1, 2);
        expect(material.diffuseColor.g).toBeCloseTo(0, 2);
        expect(material.diffuseColor.b).toBeCloseTo(0, 2);
        expect(material.specularColor.r).toBeCloseTo(0, 2);
        expect(material.specularColor.g).toBeCloseTo(1, 2);
        expect(material.specularColor.b).toBeCloseTo(0, 2);
        expect(material.emissiveColor.r).toBeCloseTo(0, 2);
        expect(material.emissiveColor.g).toBeCloseTo(0, 2);
        expect(material.emissiveColor.b).toBeCloseTo(1, 2);
        expect(material.backFaceCulling).toBe(true);
        expect(material.wireframe).toBe(true);
        expect(material.disableLighting).toBe(true);
      }
    });

    it('should handle material creation with disposed scene', () => {
      console.log('[DEBUG] Testing material creation with disposed scene');
      
      scene.dispose();
      const result = materialService.createMaterial('testMaterial', scene);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Scene is disposed');
      }
    });

    it('should handle material creation with null scene', () => {
      console.log('[DEBUG] Testing material creation with null scene');
      
      const result = materialService.createMaterial('testMaterial', null as any);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid scene');
      }
    });

    it('should handle material creation with empty name', () => {
      console.log('[DEBUG] Testing material creation with empty name');
      
      const result = materialService.createMaterial('', scene);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid material name');
      }
    });
  });

  describe('applyMaterialData', () => {
    let material: BABYLON.StandardMaterial;

    beforeEach(() => {
      material = new BABYLON.StandardMaterial('testMaterial', scene);
    });

    it('should apply material data successfully', () => {
      console.log('[DEBUG] Testing material data application');
      
      const materialData: MaterialData = {
        diffuseColor: [0.5, 0.7, 0.9],
        specularColor: [0.2, 0.3, 0.4],
        emissiveColor: [0.1, 0.05, 0.15]
      };
      
      materialService.applyMaterialData(material, materialData);
      
      expect(material.diffuseColor.r).toBeCloseTo(0.5, 2);
      expect(material.diffuseColor.g).toBeCloseTo(0.7, 2);
      expect(material.diffuseColor.b).toBeCloseTo(0.9, 2);
      expect(material.specularColor.r).toBeCloseTo(0.2, 2);
      expect(material.specularColor.g).toBeCloseTo(0.3, 2);
      expect(material.specularColor.b).toBeCloseTo(0.4, 2);
      expect(material.emissiveColor.r).toBeCloseTo(0.1, 2);
      expect(material.emissiveColor.g).toBeCloseTo(0.05, 2);
      expect(material.emissiveColor.b).toBeCloseTo(0.15, 2);
    });

    it('should handle material data application with null material', () => {
      console.log('[DEBUG] Testing material data application with null material');
      
      const materialData: MaterialData = {
        diffuseColor: [1, 1, 1],
        specularColor: [1, 1, 1],
        emissiveColor: [0, 0, 0]
      };
      
      // Should not throw error
      expect(() => materialService.applyMaterialData(null as any, materialData)).not.toThrow();
    });

    it('should handle material data application with disposed material', () => {
      console.log('[DEBUG] Testing material data application with disposed material');
      
      material.dispose();
      
      const materialData: MaterialData = {
        diffuseColor: [1, 1, 1],
        specularColor: [1, 1, 1],
        emissiveColor: [0, 0, 0]
      };
      
      // Should not throw error
      expect(() => materialService.applyMaterialData(material, materialData)).not.toThrow();
    });
  });

  describe('toggleWireframe', () => {
    let material: BABYLON.StandardMaterial;

    beforeEach(() => {
      material = new BABYLON.StandardMaterial('testMaterial', scene);
    });

    it('should toggle wireframe from false to true', () => {
      console.log('[DEBUG] Testing wireframe toggle from false to true');
      
      expect(material.wireframe).toBe(false);
      
      materialService.toggleWireframe(material);
      
      expect(material.wireframe).toBe(true);
    });

    it('should toggle wireframe from true to false', () => {
      console.log('[DEBUG] Testing wireframe toggle from true to false');
      
      material.wireframe = true;
      expect(material.wireframe).toBe(true);
      
      materialService.toggleWireframe(material);
      
      expect(material.wireframe).toBe(false);
    });

    it('should handle wireframe toggle with null material', () => {
      console.log('[DEBUG] Testing wireframe toggle with null material');
      
      // Should not throw error
      expect(() => materialService.toggleWireframe(null as any)).not.toThrow();
    });

    it('should handle wireframe toggle with disposed material', () => {
      console.log('[DEBUG] Testing wireframe toggle with disposed material');
      
      material.dispose();
      
      // Should not throw error
      expect(() => materialService.toggleWireframe(material)).not.toThrow();
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle material creation errors gracefully', () => {
      console.log('[DEBUG] Testing material creation error handling');
      
      // Dispose scene and engine to force error
      scene.dispose();
      engine.dispose();
      
      const result = materialService.createMaterial('errorMaterial', scene);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Scene is disposed');
      }
    });

    it('should maintain material state consistency', () => {
      console.log('[DEBUG] Testing material state consistency');
      
      const result = materialService.createMaterial('consistencyMaterial', scene);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const material = result.data;
        
        // Check initial state
        expect(material.isDisposed).toBeFalsy(); // Babylon.js may return undefined instead of false
        expect(material.getScene()).toBe(scene);
        expect(material.name).toBe('consistencyMaterial');
        
        // Test wireframe toggle consistency
        const initialWireframe = material.wireframe;
        materialService.toggleWireframe(material);
        expect(material.wireframe).toBe(!initialWireframe);
        materialService.toggleWireframe(material);
        expect(material.wireframe).toBe(initialWireframe);
      }
    });

    it('should handle invalid color values gracefully', () => {
      console.log('[DEBUG] Testing invalid color values handling');
      
      const material = new BABYLON.StandardMaterial('testMaterial', scene);
      
      const invalidMaterialData: MaterialData = {
        diffuseColor: [2, -1, 1.5], // Values outside 0-1 range
        specularColor: [0.5, 0.5, 0.5],
        emissiveColor: [0, 0, 0]
      };
      
      // Should not throw error, values are applied as-is
      expect(() => materialService.applyMaterialData(material, invalidMaterialData)).not.toThrow();

      // Babylon.js accepts values outside 0-1 range (no automatic clamping)
      expect(material.diffuseColor.r).toBe(2);
      expect(material.diffuseColor.g).toBe(-1);
      expect(material.diffuseColor.b).toBe(1.5);
    });
  });
});
