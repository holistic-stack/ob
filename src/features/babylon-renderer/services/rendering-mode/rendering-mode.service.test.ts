/**
 * @file Rendering Mode Service Tests
 *
 * Tests for the RenderingModeService following TDD principles.
 * Uses real BabylonJS NullEngine (no mocks).
 */

import { NullEngine, Scene, CreateBox, CreateSphere, Mesh, Color3, StandardMaterial } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  RenderingModeService,
  type RenderingModeConfig,
  type RenderingMode,
} from './rendering-mode.service';

describe('RenderingModeService', () => {
  let engine: NullEngine;
  let scene: Scene;
  let renderingService: RenderingModeService;
  let testMesh: Mesh;

  beforeEach(() => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);
    renderingService = new RenderingModeService(scene);
    
    // Create a test mesh
    testMesh = CreateBox('testBox', { size: 1 }, scene);
  });

  afterEach(() => {
    // Clean up resources
    renderingService.dispose();
    scene.dispose();
    engine.dispose();
  });

  describe('Service Initialization', () => {
    it('should initialize rendering mode service', () => {
      expect(renderingService).toBeDefined();
      expect(renderingService.getGlobalMode()).toBe('solid');
      expect(renderingService.getAllMeshStates().length).toBe(0);
    });
  });

  describe('Solid Rendering Mode', () => {
    it('should apply solid rendering mode', async () => {
      const config: RenderingModeConfig = {
        mode: 'solid',
        enableLighting: true,
      };

      const result = await renderingService.setRenderingMode(testMesh, config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const modeResult = result.data;
        expect(modeResult.mode).toBe('solid');
        expect(modeResult.applied).toBe(true);
        expect(modeResult.originalMesh).toBe(testMesh);
      }
    });

    it('should ensure wireframe is disabled in solid mode', async () => {
      // First set wireframe mode
      await renderingService.setRenderingMode(testMesh, { mode: 'wireframe' });
      
      // Then switch to solid mode
      const result = await renderingService.setRenderingMode(testMesh, { mode: 'solid' });
      expect(result.success).toBe(true);
      
      if (testMesh.material instanceof StandardMaterial) {
        expect(testMesh.material.wireframe).toBe(false);
      }
    });
  });

  describe('Wireframe Rendering Mode', () => {
    it('should apply wireframe rendering mode', async () => {
      const config: RenderingModeConfig = {
        mode: 'wireframe',
        wireframeColor: new Color3(1, 0, 0),
      };

      const result = await renderingService.setRenderingMode(testMesh, config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const modeResult = result.data;
        expect(modeResult.mode).toBe('wireframe');
        expect(modeResult.applied).toBe(true);
        
        // Check wireframe material was applied
        expect(testMesh.material).toBeDefined();
        if (testMesh.material instanceof StandardMaterial) {
          expect(testMesh.material.wireframe).toBe(true);
          expect(testMesh.material.diffuseColor).toEqual(new Color3(1, 0, 0));
        }
      }
    });

    it('should apply wireframe with default color', async () => {
      const config: RenderingModeConfig = {
        mode: 'wireframe',
      };

      const result = await renderingService.setRenderingMode(testMesh, config);
      expect(result.success).toBe(true);
      
      if (testMesh.material instanceof StandardMaterial) {
        expect(testMesh.material.wireframe).toBe(true);
        expect(testMesh.material.diffuseColor).toEqual(new Color3(1, 1, 1));
      }
    });
  });

  describe('Points Rendering Mode', () => {
    it('should apply points rendering mode', async () => {
      const config: RenderingModeConfig = {
        mode: 'points',
        pointSize: 5.0,
      };

      const result = await renderingService.setRenderingMode(testMesh, config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const modeResult = result.data;
        expect(modeResult.mode).toBe('points');
        expect(modeResult.applied).toBe(true);
        
        // Check points material was applied
        if (testMesh.material instanceof StandardMaterial) {
          expect((testMesh.material as any)._isPointsMode).toBe(true);
          expect(testMesh.material.pointSize).toBe(5.0);
          expect(testMesh.material.wireframe).toBe(false);
        }
      }
    });

    it('should apply points with default size', async () => {
      const config: RenderingModeConfig = {
        mode: 'points',
      };

      const result = await renderingService.setRenderingMode(testMesh, config);
      expect(result.success).toBe(true);
      
      if (testMesh.material instanceof StandardMaterial) {
        expect((testMesh.material as any)._isPointsMode).toBe(true);
        expect(testMesh.material.pointSize).toBe(2.0);
      }
    });
  });

  describe('Transparent Rendering Mode', () => {
    it('should apply transparent rendering mode', async () => {
      const config: RenderingModeConfig = {
        mode: 'transparent',
        transparency: 0.7,
      };

      const result = await renderingService.setRenderingMode(testMesh, config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const modeResult = result.data;
        expect(modeResult.mode).toBe('transparent');
        expect(modeResult.applied).toBe(true);
        
        // Check transparency was applied
        if (testMesh.material instanceof StandardMaterial) {
          expect(testMesh.material.alpha).toBeCloseTo(0.3, 2); // 1.0 - 0.7
          expect(testMesh.material.wireframe).toBe(false);
        }
      }
    });

    it('should apply transparent with default transparency', async () => {
      const config: RenderingModeConfig = {
        mode: 'transparent',
      };

      const result = await renderingService.setRenderingMode(testMesh, config);
      expect(result.success).toBe(true);
      
      if (testMesh.material instanceof StandardMaterial) {
        expect(testMesh.material.alpha).toBe(0.5); // 1.0 - 0.5 (default)
      }
    });
  });

  describe('Flat Rendering Mode', () => {
    it('should apply flat rendering mode', async () => {
      const flatColor = new Color3(0, 1, 0);
      const config: RenderingModeConfig = {
        mode: 'flat',
        flatColor,
      };

      const result = await renderingService.setRenderingMode(testMesh, config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const modeResult = result.data;
        expect(modeResult.mode).toBe('flat');
        expect(modeResult.applied).toBe(true);
        
        // Check flat material was applied
        if (testMesh.material instanceof StandardMaterial) {
          expect(testMesh.material.disableLighting).toBe(true);
          expect(testMesh.material.emissiveColor).toEqual(flatColor);
          expect(testMesh.material.diffuseColor).toEqual(flatColor);
          expect(testMesh.material.wireframe).toBe(false);
        }
      }
    });

    it('should apply flat with default color', async () => {
      const config: RenderingModeConfig = {
        mode: 'flat',
      };

      const result = await renderingService.setRenderingMode(testMesh, config);
      expect(result.success).toBe(true);
      
      if (testMesh.material instanceof StandardMaterial) {
        expect(testMesh.material.disableLighting).toBe(true);
        expect(testMesh.material.emissiveColor).toEqual(new Color3(0.8, 0.8, 0.8));
      }
    });
  });

  describe('Hybrid Rendering Mode', () => {
    it('should apply hybrid rendering mode', async () => {
      const config: RenderingModeConfig = {
        mode: 'hybrid',
        hybridWireframeColor: new Color3(0, 1, 0),
      };

      const result = await renderingService.setRenderingMode(testMesh, config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const modeResult = result.data;
        expect(modeResult.mode).toBe('hybrid');
        expect(modeResult.applied).toBe(true);
        expect(modeResult.wireframeMesh).toBeDefined();
        
        // Check solid material is applied to original mesh
        if (testMesh.material instanceof StandardMaterial) {
          expect(testMesh.material.wireframe).toBe(false);
        }
      }
    });

    it('should apply hybrid with default wireframe color', async () => {
      const config: RenderingModeConfig = {
        mode: 'hybrid',
      };

      const result = await renderingService.setRenderingMode(testMesh, config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const modeResult = result.data;
        expect(modeResult.wireframeMesh).toBeDefined();
        
        // Check wireframe overlay material
        const wireframeMesh = modeResult.wireframeMesh;
        if (wireframeMesh?.material instanceof StandardMaterial) {
          expect(wireframeMesh.material.wireframe).toBe(true);
          expect(wireframeMesh.material.diffuseColor).toEqual(new Color3(0, 1, 0));
        }
      }
    });
  });

  describe('Mode State Management', () => {
    it('should track mesh rendering state', async () => {
      const config: RenderingModeConfig = {
        mode: 'wireframe',
      };

      await renderingService.setRenderingMode(testMesh, config);
      
      const currentMode = renderingService.getCurrentMode(testMesh.id);
      expect(currentMode).toBe('wireframe');
      
      const meshState = renderingService.getMeshState(testMesh.id);
      expect(meshState).toBeDefined();
      expect(meshState?.currentMode).toBe('wireframe');
      expect(meshState?.meshId).toBe(testMesh.id);
    });

    it('should track multiple mesh states', async () => {
      const sphere = CreateSphere('testSphere', { diameter: 1 }, scene);
      
      await renderingService.setRenderingMode(testMesh, { mode: 'wireframe' });
      await renderingService.setRenderingMode(sphere, { mode: 'points' });
      
      const allStates = renderingService.getAllMeshStates();
      expect(allStates.length).toBe(2);
      
      const wireframeState = allStates.find(s => s.currentMode === 'wireframe');
      const pointsState = allStates.find(s => s.currentMode === 'points');
      
      expect(wireframeState).toBeDefined();
      expect(pointsState).toBeDefined();
    });

    it('should update state when mode changes', async () => {
      // Apply wireframe mode
      await renderingService.setRenderingMode(testMesh, { mode: 'wireframe' });
      expect(renderingService.getCurrentMode(testMesh.id)).toBe('wireframe');
      
      // Change to points mode
      await renderingService.setRenderingMode(testMesh, { mode: 'points' });
      expect(renderingService.getCurrentMode(testMesh.id)).toBe('points');
      
      // Should still have only one state entry
      expect(renderingService.getAllMeshStates().length).toBe(1);
    });
  });

  describe('Global Rendering Mode', () => {
    it('should set global rendering mode for all meshes', async () => {
      const sphere = CreateSphere('testSphere', { diameter: 1 }, scene);
      const config: RenderingModeConfig = {
        mode: 'wireframe',
      };

      const result = await renderingService.setGlobalRenderingMode(config);
      expect(result.success).toBe(true);
      
      expect(renderingService.getGlobalMode()).toBe('wireframe');
      expect(renderingService.getCurrentMode(testMesh.id)).toBe('wireframe');
      expect(renderingService.getCurrentMode(sphere.id)).toBe('wireframe');
    });

    it('should handle global mode with no meshes', async () => {
      // Remove test mesh
      testMesh.dispose();
      
      const config: RenderingModeConfig = {
        mode: 'points',
      };

      const result = await renderingService.setGlobalRenderingMode(config);
      expect(result.success).toBe(true);
      expect(renderingService.getGlobalMode()).toBe('points');
    });
  });

  describe('Mode Restoration', () => {
    it('should restore original mode and material', async () => {
      const originalMaterial = testMesh.material;
      
      // Apply wireframe mode
      await renderingService.setRenderingMode(testMesh, { mode: 'wireframe' });
      expect(testMesh.material).not.toBe(originalMaterial);
      
      // Restore original mode
      const result = await renderingService.restoreOriginalMode(testMesh);
      expect(result.success).toBe(true);
      
      // Check state was restored (original material was null)
      expect(testMesh.material).toBe(originalMaterial); // Should be null
      expect(renderingService.getCurrentMode(testMesh.id)).toBeNull();
    });

    it('should handle restoration of non-existent state', async () => {
      const result = await renderingService.restoreOriginalMode(testMesh);
      expect(result.success).toBe(true);
    });

    it('should clean up hybrid mode meshes on restoration', async () => {
      // Apply hybrid mode
      await renderingService.setRenderingMode(testMesh, { mode: 'hybrid' });
      const initialMeshCount = scene.meshes.length;
      
      // Restore original mode
      await renderingService.restoreOriginalMode(testMesh);
      
      // Should have cleaned up wireframe overlay
      expect(scene.meshes.length).toBeLessThanOrEqual(initialMeshCount);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid rendering mode', async () => {
      const config: RenderingModeConfig = {
        mode: 'invalid' as RenderingMode,
      };

      const result = await renderingService.setRenderingMode(testMesh, config);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('MODE_APPLICATION_FAILED');
      }
    });

    it('should handle null mesh', async () => {
      const config: RenderingModeConfig = {
        mode: 'wireframe',
      };

      const result = await renderingService.setRenderingMode(null as any, config);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('MODE_APPLICATION_FAILED');
      }
    });
  });

  describe('Disposal', () => {
    it('should dispose all resources and clear state', async () => {
      await renderingService.setRenderingMode(testMesh, { mode: 'wireframe' });
      expect(renderingService.getAllMeshStates().length).toBe(1);
      
      renderingService.dispose();
      expect(renderingService.getAllMeshStates().length).toBe(0);
    });

    it('should handle multiple dispose calls', () => {
      renderingService.dispose();
      renderingService.dispose(); // Should not throw
      expect(renderingService.getAllMeshStates().length).toBe(0);
    });
  });
});
