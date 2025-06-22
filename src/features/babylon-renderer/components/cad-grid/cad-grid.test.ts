/**
 * @file CAD Grid Component Tests
 * 
 * TDD tests for professional CAD-style 3D grid system
 * Tests grid creation, configuration, and integration with Babylon.js scene
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { createCADGrid, type CADGridConfig, type CADGridResult } from './cad-grid';

describe('CAD Grid System', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;

  beforeEach(() => {
    console.log('[INIT] Setting up CAD Grid test environment');
    
    // Create null engine for headless testing
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
  });

  afterEach(() => {
    console.log('[END] Cleaning up CAD Grid test environment');
    
    scene.dispose();
    engine.dispose();
  });

  describe('Grid Creation', () => {
    it('should create a basic 3D grid with default configuration', () => {
      console.log('[DEBUG] Testing basic grid creation');
      
      const result = createCADGrid(scene);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.gridMesh).toBeDefined();
        expect(result.data.gridMesh.name).toBe('cad-grid');
        expect(result.data.config.size).toBe(20);
        expect(result.data.config.divisions).toBe(20);
        expect(result.data.config.majorLineInterval).toBe(5);
      }
    });

    it('should create grid with custom configuration', () => {
      console.log('[DEBUG] Testing custom grid configuration');
      
      const customConfig: CADGridConfig = {
        size: 50,
        divisions: 50,
        majorLineInterval: 10,
        minorLineColor: '#cccccc',
        majorLineColor: '#888888',
        opacity: 0.6,
        position: [0, -1, 0]
      };

      const result = createCADGrid(scene, customConfig);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.config.size).toBe(50);
        expect(result.data.config.divisions).toBe(50);
        expect(result.data.config.majorLineInterval).toBe(10);
        expect(result.data.config.minorLineColor).toBe('#cccccc');
        expect(result.data.config.majorLineColor).toBe('#888888');
        expect(result.data.config.opacity).toBe(0.6);
      }
    });

    it('should position grid correctly on X-Z plane', () => {
      console.log('[DEBUG] Testing grid positioning');
      
      const config: CADGridConfig = {
        position: [5, -2, 10]
      };

      const result = createCADGrid(scene, config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const position = result.data.gridMesh.position;
        expect(position.x).toBe(5);
        expect(position.y).toBe(-2);
        expect(position.z).toBe(10);
      }
    });
  });

  describe('Grid Appearance', () => {
    it('should create major and minor grid lines with different colors', () => {
      console.log('[DEBUG] Testing grid line appearance');
      
      const config: CADGridConfig = {
        minorLineColor: '#e0e0e0',
        majorLineColor: '#606060',
        majorLineInterval: 5
      };

      const result = createCADGrid(scene, config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Grid should have material with appropriate colors
        expect(result.data.gridMesh.material).toBeDefined();
        expect(result.data.config.minorLineColor).toBe('#e0e0e0');
        expect(result.data.config.majorLineColor).toBe('#606060');
      }
    });

    it('should apply correct opacity to grid material', () => {
      console.log('[DEBUG] Testing grid opacity');
      
      const config: CADGridConfig = {
        opacity: 0.3
      };

      const result = createCADGrid(scene, config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const material = result.data.gridMesh.material as BABYLON.StandardMaterial;
        expect(material.alpha).toBe(0.3);
      }
    });
  });

  describe('Grid Geometry', () => {
    it('should create correct number of grid lines based on divisions', () => {
      console.log('[DEBUG] Testing grid geometry');
      
      const config: CADGridConfig = {
        size: 20,
        divisions: 10
      };

      const result = createCADGrid(scene, config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Should have lines for both X and Z directions
        // (divisions + 1) lines in each direction = (10 + 1) * 2 = 22 lines total
        const expectedLines = (config.divisions! + 1) * 2;
        expect(result.data.lineCount).toBe(expectedLines);
      }
    });

    it('should handle edge case with minimum divisions', () => {
      console.log('[DEBUG] Testing minimum divisions edge case');
      
      const config: CADGridConfig = {
        divisions: 1
      };

      const result = createCADGrid(scene, config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lineCount).toBe(4); // 2 lines in each direction
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid scene gracefully', () => {
      console.log('[DEBUG] Testing invalid scene handling');
      
      const result = createCADGrid(null as any);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid scene');
      }
    });

    it('should handle invalid configuration values', () => {
      console.log('[DEBUG] Testing invalid configuration handling');
      
      const invalidConfig: CADGridConfig = {
        size: -10,
        divisions: 0,
        opacity: 2.0
      };

      const result = createCADGrid(scene, invalidConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid configuration');
      }
    });
  });

  describe('Grid Management', () => {
    it('should allow grid disposal and cleanup', () => {
      console.log('[DEBUG] Testing grid disposal');

      const result = createCADGrid(scene);

      expect(result.success).toBe(true);
      if (result.success) {
        const gridMesh = result.data.gridMesh;
        expect(gridMesh.isDisposed()).toBe(false);

        // Dispose grid
        gridMesh.dispose();
        expect(gridMesh.isDisposed()).toBe(true);
      }
    });

    it('should support grid visibility toggle', () => {
      console.log('[DEBUG] Testing grid visibility toggle');
      
      const result = createCADGrid(scene);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const gridMesh = result.data.gridMesh;
        
        // Initially visible
        expect(gridMesh.isVisible).toBe(true);
        
        // Toggle visibility
        gridMesh.setEnabled(false);
        expect(gridMesh.isEnabled()).toBe(false);
        
        gridMesh.setEnabled(true);
        expect(gridMesh.isEnabled()).toBe(true);
      }
    });
  });
});
