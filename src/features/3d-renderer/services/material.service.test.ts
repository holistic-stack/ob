/**
 * Material Service Test Suite
 *
 * Comprehensive tests for Material Service following TDD methodology
 * with real Three.js material creation and validation.
 */

import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLogger } from '../../../shared/services/logger.service.js';
import type { MaterialConfig } from '../types/renderer.types.js';
import {
  createMaterial,
  type MaterialCreationOptions,
  MaterialService,
  materialService,
} from './material.service.js';

const logger = createLogger('MaterialServiceTest');

describe('MaterialService', () => {
  let service: MaterialService;

  beforeEach(() => {
    logger.init('Setting up test environment');
    service = new MaterialService({
      enableCaching: true,
      cacheSize: 10,
      enableTelemetry: true,
    });
  });

  afterEach(() => {
    logger.end('Cleaning up test environment');
    service.dispose();
  });

  describe('Material Creation', () => {
    it('should create standard material with default configuration', () => {
      logger.debug('[DEBUG][MaterialServiceTest] Testing standard material creation');

      const config: MaterialConfig = {
        color: '#ff0000',
        opacity: 1,
        metalness: 0.1,
        roughness: 0.8,
        wireframe: false,
        transparent: false,
        side: 'front',
      };

      const result = service.createMaterial(config);

      expect(result.success).toBe(true);
      if (result.success) {
        const material = result.data;
        expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
        expect(material.color.getHex()).toBe(0xff0000);
        expect(material.opacity).toBe(1);
        expect(material.metalness).toBe(0.1);
        expect(material.roughness).toBe(0.8);
        expect(material.wireframe).toBe(false);
        expect(material.transparent).toBe(false);
        expect(material.side).toBe(THREE.FrontSide);
      }
    });

    it('should create material with transparent configuration', () => {
      logger.debug('[DEBUG][MaterialServiceTest] Testing transparent material creation');

      const config: MaterialConfig = {
        color: '#00ff00',
        opacity: 0.5,
        metalness: 0.2,
        roughness: 0.6,
        wireframe: false,
        transparent: true,
        side: 'double',
      };

      const result = service.createMaterial(config);

      expect(result.success).toBe(true);
      if (result.success) {
        const material = result.data;
        expect(material.color.getHex()).toBe(0x00ff00);
        expect(material.opacity).toBe(0.5);
        expect(material.transparent).toBe(true);
        expect(material.side).toBe(THREE.DoubleSide);
      }
    });

    it('should create wireframe material', () => {
      logger.debug('[DEBUG][MaterialServiceTest] Testing wireframe material creation');

      const result = service.createWireframeMaterial('#0000ff');

      expect(result.success).toBe(true);
      if (result.success) {
        const material = result.data;
        expect(material).toBeInstanceOf(THREE.MeshBasicMaterial);
        expect(material.wireframe).toBe(true);
        expect(material.transparent).toBe(true);
        expect(material.opacity).toBe(0.8);
      }
    });

    it('should create transparent material with validation', () => {
      logger.debug('[DEBUG][MaterialServiceTest] Testing transparent material with validation');

      const result = service.createTransparentMaterial('#ffff00', 0.7);

      expect(result.success).toBe(true);
      if (result.success) {
        const material = result.data;
        expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
        expect(material.opacity).toBe(0.7);
        expect(material.transparent).toBe(true);
        expect(material.side).toBe(THREE.DoubleSide);
      }
    });

    it('should fail with invalid opacity for transparent material', () => {
      logger.debug('[DEBUG][MaterialServiceTest] Testing invalid opacity handling');

      const result = service.createTransparentMaterial('#ff00ff', 1.5);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Opacity must be between 0 and 1');
      }
    });
  });

  describe('Material Validation', () => {
    it('should validate material configuration when requested', () => {
      logger.debug('[DEBUG][MaterialServiceTest] Testing material validation');

      const invalidConfig: MaterialConfig = {
        color: '#ff0000',
        opacity: 1.5, // Invalid opacity
        metalness: -0.1, // Invalid metalness
        roughness: 0.8,
        wireframe: false,
        transparent: false,
        side: 'front',
      };

      const options: MaterialCreationOptions = {
        validateConfig: true,
      };

      const result = service.createMaterial(invalidConfig, options);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid material configuration');
      }
    });

    it('should create material without validation by default', () => {
      logger.debug('[DEBUG][MaterialServiceTest] Testing material creation without validation');

      const config: MaterialConfig = {
        color: '#ff0000',
        opacity: 1.5, // Would be invalid if validated
        metalness: 0.1,
        roughness: 0.8,
        wireframe: false,
        transparent: false,
        side: 'front',
      };

      const result = service.createMaterial(config);

      // Should succeed without validation
      expect(result.success).toBe(true);
    });
  });

  describe('Material Caching', () => {
    it('should cache materials when caching is enabled', () => {
      logger.debug('[DEBUG][MaterialServiceTest] Testing material caching');

      const config: MaterialConfig = {
        color: '#ff0000',
        opacity: 1,
        metalness: 0.1,
        roughness: 0.8,
        wireframe: false,
        transparent: false,
        side: 'front',
      };

      const options: MaterialCreationOptions = {
        enableCaching: true,
      };

      // Create material first time
      const result1 = service.createMaterial(config, options);
      expect(result1.success).toBe(true);

      // Create same material second time (should use cache)
      const result2 = service.createMaterial(config, options);
      expect(result2.success).toBe(true);

      // Both should be successful
      if (result1.success && result2.success) {
        // Materials should have same properties but be different instances (cloned)
        expect(result1.data.color.getHex()).toBe(result2.data.color.getHex());
        expect(result1.data.opacity).toBe(result2.data.opacity);
      }
    });

    it('should clear cache and dispose materials', () => {
      logger.debug('[DEBUG][MaterialServiceTest] Testing cache clearing');

      const config: MaterialConfig = {
        color: '#00ff00',
        opacity: 1,
        metalness: 0.1,
        roughness: 0.8,
        wireframe: false,
        transparent: false,
        side: 'front',
      };

      // Create material to populate cache
      const result = service.createMaterial(config, { enableCaching: true });
      expect(result.success).toBe(true);

      // Clear cache
      service.clearCache();

      // Verify cache is cleared
      const metrics = service.getPerformanceMetrics();
      expect(metrics.cacheSize).toBe(0);
    });
  });



  describe('Legacy Compatibility', () => {
    it('should support legacy createMaterial function', () => {
      logger.debug('[DEBUG][MaterialServiceTest] Testing legacy compatibility');

      const config: MaterialConfig = {
        color: '#ff00ff',
        opacity: 1,
        metalness: 0.1,
        roughness: 0.8,
        wireframe: false,
        transparent: false,
        side: 'front',
      };

      const material = createMaterial(config);

      expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
      expect(material.color.getHex()).toBe(0xff00ff);
    });

    it('should throw error for legacy function with invalid config', () => {
      logger.debug('[DEBUG][MaterialServiceTest] Testing legacy error handling');

      // Mock the service to return an error
      const originalCreateMaterial = materialService.createMaterial;
      materialService.createMaterial = vi.fn().mockReturnValue({
        success: false,
        error: 'Test error',
      });

      const config: MaterialConfig = {
        color: '#ff0000',
        opacity: 1,
        metalness: 0.1,
        roughness: 0.8,
        wireframe: false,
        transparent: false,
        side: 'front',
      };

      expect(() => createMaterial(config)).toThrow('Test error');

      // Restore original function
      materialService.createMaterial = originalCreateMaterial;
    });
  });

  describe('Service Lifecycle', () => {
    it('should dispose service properly', () => {
      logger.debug('[DEBUG][MaterialServiceTest] Testing service disposal');

      const testService = new MaterialService();

      // Create some materials to populate cache
      const config: MaterialConfig = {
        color: '#ffffff',
        opacity: 1,
        metalness: 0.1,
        roughness: 0.8,
        wireframe: false,
        transparent: false,
        side: 'front',
      };

      testService.createMaterial(config, { enableCaching: true });

      // Dispose should not throw
      expect(() => testService.dispose()).not.toThrow();
    });
  });
});
