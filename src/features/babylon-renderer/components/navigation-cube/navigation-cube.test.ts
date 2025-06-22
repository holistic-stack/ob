/**
 * @file Navigation Cube Component Tests
 * 
 * TDD tests for professional CAD-style navigation cube
 * Tests cube creation, face interactions, and camera control integration
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { 
  createNavigationCube, 
  type NavigationCubeConfig, 
  type NavigationCubeResult,
  type CameraView 
} from './navigation-cube';

describe('Navigation Cube System', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let camera: BABYLON.ArcRotateCamera;

  beforeEach(() => {
    console.log('[INIT] Setting up Navigation Cube test environment');
    
    // Create null engine for headless testing
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    
    // Create camera for testing
    camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 4,
      Math.PI / 3,
      10,
      BABYLON.Vector3.Zero(),
      scene
    );
  });

  afterEach(() => {
    console.log('[END] Cleaning up Navigation Cube test environment');
    
    scene.dispose();
    engine.dispose();
  });

  describe('Cube Creation', () => {
    it('should create a basic navigation cube with default configuration', () => {
      console.log('[DEBUG] Testing basic navigation cube creation');
      
      const result = createNavigationCube(scene, camera);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cubeMesh).toBeDefined();
        expect(result.data.cubeMesh.name).toBe('navigation-cube');
        expect(result.data.config.size).toBe(1);
        expect(result.data.config.position).toEqual([0.8, 0.8, 0]);
      }
    });

    it('should create cube with custom configuration', () => {
      console.log('[DEBUG] Testing custom navigation cube configuration');
      
      const customConfig: NavigationCubeConfig = {
        size: 1.5,
        position: [0.9, 0.9, 0],
        faceColors: {
          front: '#ff0000',
          back: '#00ff00',
          left: '#0000ff',
          right: '#ffff00',
          top: '#ff00ff',
          bottom: '#00ffff'
        }
      };

      const result = createNavigationCube(scene, camera, customConfig);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.config.size).toBe(1.5);
        expect(result.data.config.position).toEqual([0.9, 0.9, 0]);
        expect(result.data.config.faceColors?.front).toBe('#ff0000');
      }
    });

    it('should position cube correctly in screen space', () => {
      console.log('[DEBUG] Testing navigation cube positioning');
      
      const config: NavigationCubeConfig = {
        position: [0.7, 0.7, 0]
      };

      const result = createNavigationCube(scene, camera, config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Cube should be positioned relative to screen space
        expect(result.data.config.position).toEqual([0.7, 0.7, 0]);
      }
    });
  });

  describe('Face Labels', () => {
    it('should create face labels with correct text', () => {
      console.log('[DEBUG] Testing navigation cube face labels');
      
      const result = createNavigationCube(scene, camera);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.faceLabels).toBeDefined();
        expect(result.data.faceLabels.length).toBe(6);
        
        const labelTexts = result.data.faceLabels.map(label => label.text);
        expect(labelTexts).toContain('Front');
        expect(labelTexts).toContain('Back');
        expect(labelTexts).toContain('Left');
        expect(labelTexts).toContain('Right');
        expect(labelTexts).toContain('Top');
        expect(labelTexts).toContain('Bottom');
      }
    });

    it('should create labels with custom text', () => {
      console.log('[DEBUG] Testing custom face labels');
      
      const config: NavigationCubeConfig = {
        faceLabels: {
          front: 'F',
          back: 'B',
          left: 'L',
          right: 'R',
          top: 'T',
          bottom: 'Bot'
        }
      };

      const result = createNavigationCube(scene, camera, config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const labelTexts = result.data.faceLabels.map(label => label.text);
        expect(labelTexts).toContain('F');
        expect(labelTexts).toContain('B');
        expect(labelTexts).toContain('L');
        expect(labelTexts).toContain('R');
        expect(labelTexts).toContain('T');
        expect(labelTexts).toContain('Bot');
      }
    });
  });

  describe('Camera View Definitions', () => {
    it('should define standard camera views', () => {
      console.log('[DEBUG] Testing camera view definitions');
      
      const result = createNavigationCube(scene, camera);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cameraViews).toBeDefined();
        expect(result.data.cameraViews.front).toBeDefined();
        expect(result.data.cameraViews.back).toBeDefined();
        expect(result.data.cameraViews.left).toBeDefined();
        expect(result.data.cameraViews.right).toBeDefined();
        expect(result.data.cameraViews.top).toBeDefined();
        expect(result.data.cameraViews.bottom).toBeDefined();
        
        // Check front view definition
        const frontView = result.data.cameraViews.front;
        expect(frontView.alpha).toBeDefined();
        expect(frontView.beta).toBeDefined();
        expect(frontView.radius).toBeDefined();
      }
    });

    it('should allow custom camera view definitions', () => {
      console.log('[DEBUG] Testing custom camera views');
      
      const customViews = {
        front: { alpha: 0, beta: Math.PI / 2, radius: 15 },
        back: { alpha: Math.PI, beta: Math.PI / 2, radius: 15 }
      };

      const config: NavigationCubeConfig = {
        cameraViews: customViews
      };

      const result = createNavigationCube(scene, camera, config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cameraViews.front.radius).toBe(15);
        expect(result.data.cameraViews.back.radius).toBe(15);
      }
    });
  });

  describe('Face Interactions', () => {
    it('should handle face click interactions', () => {
      console.log('[DEBUG] Testing face click interactions');
      
      const onFaceClick = vi.fn();
      const config: NavigationCubeConfig = {
        onFaceClick
      };

      const result = createNavigationCube(scene, camera, config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Simulate face click
        const frontFace = result.data.faces.find(face => face.name === 'front');
        expect(frontFace).toBeDefined();
        
        if (frontFace && onFaceClick) {
          // Trigger click event
          result.data.handleFaceClick('front');
          expect(onFaceClick).toHaveBeenCalledWith('front');
        }
      }
    });

    it('should handle hover interactions', () => {
      console.log('[DEBUG] Testing face hover interactions');
      
      const onFaceHover = vi.fn();
      const config: NavigationCubeConfig = {
        onFaceHover
      };

      const result = createNavigationCube(scene, camera, config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Simulate face hover
        result.data.handleFaceHover('top', true);
        expect(onFaceHover).toHaveBeenCalledWith('top', true);
        
        result.data.handleFaceHover('top', false);
        expect(onFaceHover).toHaveBeenCalledWith('top', false);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid scene gracefully', () => {
      console.log('[DEBUG] Testing invalid scene handling');
      
      const result = createNavigationCube(null as any, camera);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid scene');
      }
    });

    it('should handle invalid camera gracefully', () => {
      console.log('[DEBUG] Testing invalid camera handling');
      
      const result = createNavigationCube(scene, null as any);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid camera');
      }
    });

    it('should handle invalid configuration values', () => {
      console.log('[DEBUG] Testing invalid configuration handling');
      
      const invalidConfig: NavigationCubeConfig = {
        size: -1,
        position: [2, 2, 0] // Outside valid range
      };

      const result = createNavigationCube(scene, camera, invalidConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid configuration');
      }
    });
  });

  describe('Cube Management', () => {
    it('should allow cube disposal and cleanup', () => {
      console.log('[DEBUG] Testing navigation cube disposal');
      
      const result = createNavigationCube(scene, camera);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const cubeMesh = result.data.cubeMesh;
        expect(cubeMesh.isDisposed()).toBe(false);
        
        // Dispose cube
        cubeMesh.dispose();
        expect(cubeMesh.isDisposed()).toBe(true);
      }
    });

    it('should support cube visibility toggle', () => {
      console.log('[DEBUG] Testing navigation cube visibility toggle');
      
      const result = createNavigationCube(scene, camera);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const cubeMesh = result.data.cubeMesh;
        
        // Initially visible
        expect(cubeMesh.isVisible).toBe(true);
        
        // Toggle visibility
        cubeMesh.setEnabled(false);
        expect(cubeMesh.isEnabled()).toBe(false);
        
        cubeMesh.setEnabled(true);
        expect(cubeMesh.isEnabled()).toBe(true);
      }
    });
  });
});
