/**
 * @file GUI Navigation Cube Tests
 * 
 * Comprehensive test suite for GUI-based navigation cube system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import {
  createCADNavigationCube,
  createEnhancedCADNavigationCube,
  CAD_NAVIGATION_CUBE_DEFAULT_CONFIG
} from './gui-navigation-cube';

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Test setup
let engine: BABYLON.NullEngine;
let scene: BABYLON.Scene;
let camera: BABYLON.ArcRotateCamera;

beforeEach(() => {
  // Clear mocks
  vi.clearAllMocks();
  console.log = mockConsole.log;
  console.warn = mockConsole.warn;
  console.error = mockConsole.error;
  
  // Create test environment
  engine = new BABYLON.NullEngine();
  scene = new BABYLON.Scene(engine);
  camera = new BABYLON.ArcRotateCamera(
    'testCamera',
    -Math.PI / 4,
    Math.PI / 3,
    20,
    BABYLON.Vector3.Zero(),
    scene
  );
});

afterEach(() => {
  // Clean up
  if (scene && !scene.isDisposed) {
    scene.dispose();
  }
  if (engine && !engine.isDisposed) {
    engine.dispose();
  }
});

describe('Professional CAD Navigation Cube', () => {
  describe('createCADNavigationCube', () => {
    it('should create professional CAD navigation cube successfully', () => {
      console.log('[DEBUG] Testing professional CAD navigation cube creation');

      const result = createCADNavigationCube(scene, camera);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.overlayTexture).toBeInstanceOf(GUI.AdvancedDynamicTexture);
        expect(result.data.mainContainer).toBeInstanceOf(GUI.StackPanel);
        expect(result.data.cubeContainer).toBeInstanceOf(GUI.Grid);
        expect(result.data.faceButtons).toBeInstanceOf(Array);
        expect(result.data.directionalControls).toBeInstanceOf(Array);
        expect(result.data.miniCubeMenu).toBeInstanceOf(Array);
        expect(typeof result.data.dispose).toBe('function');
      }
    });

    it('should use default configuration when none provided', () => {
      console.log('[DEBUG] Testing default configuration');

      const result = createCADNavigationCube(scene, camera);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.config).toEqual(CAD_NAVIGATION_CUBE_DEFAULT_CONFIG);
      }
    });

    it('should merge custom configuration with defaults', () => {
      console.log('[DEBUG] Testing custom configuration merge');

      const customConfig = {
        cubeSize: 150,
        animationDuration: 1.2,
        showDirectionalControls: false
      };

      const result = createCADNavigationCube(scene, camera, customConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.config.cubeSize).toBe(150);
        expect(result.data.config.animationDuration).toBe(1.2);
        expect(result.data.config.showDirectionalControls).toBe(false);
        // Should keep defaults for other properties
        expect(result.data.config.cornerPosition).toEqual(CAD_NAVIGATION_CUBE_DEFAULT_CONFIG.cornerPosition);
      }
    });

    it('should handle invalid scene', () => {
      console.log('[DEBUG] Testing invalid scene handling');

      const result = createCADNavigationCube(null as any, camera);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or disposed scene');
    });

    it('should handle invalid camera', () => {
      console.log('[DEBUG] Testing invalid camera handling');

      const result = createCADNavigationCube(scene, null as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Valid ArcRotateCamera required');
    });

    it('should create face buttons for all defined faces', () => {
      console.log('[DEBUG] Testing face button creation');

      const result = createCADNavigationCube(scene, camera);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should have buttons for main faces at minimum
        expect(result.data.faceButtons.length).toBeGreaterThan(0);

        // Check for main faces
        const mainFaces = result.data.faceButtons.filter(fb => fb.type === 'main');
        expect(mainFaces.length).toBeGreaterThanOrEqual(6); // Front, Back, Left, Right, Top, Bottom
      }
    });

    it('should create directional controls when enabled', () => {
      console.log('[DEBUG] Testing directional controls creation');

      const result = createCADNavigationCube(scene, camera, {
        showDirectionalControls: true
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.directionalControls.length).toBeGreaterThan(0);
      }
    });

    it('should not create directional controls when disabled', () => {
      console.log('[DEBUG] Testing directional controls disabled');

      const result = createCADNavigationCube(scene, camera, {
        showDirectionalControls: false
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.directionalControls.length).toBe(0);
      }
    });

    it('should create mini-cube menu when enabled', () => {
      console.log('[DEBUG] Testing mini-cube menu creation');

      const result = createCADNavigationCube(scene, camera, {
        showMiniCubeMenu: true
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.miniCubeMenu.length).toBeGreaterThan(0);
      }
    });

    it('should provide working dispose function', () => {
      console.log('[DEBUG] Testing dispose functionality');

      const result = createCADNavigationCube(scene, camera);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should not throw when disposing
        expect(() => result.data.dispose()).not.toThrow();
      }
    });
  });

  describe('createEnhancedCADNavigationCube', () => {
    it('should create enhanced CAD navigation cube successfully', () => {
      console.log('[DEBUG] Testing enhanced CAD navigation cube creation');

      const result = createEnhancedCADNavigationCube(scene, camera);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.overlayTexture).toBeInstanceOf(GUI.AdvancedDynamicTexture);
      }
    });

    it('should handle fallback when CAD GUI creation fails', () => {
      console.log('[DEBUG] Testing enhanced CAD navigation cube fallback');

      // Test with invalid inputs to trigger fallback
      const result = createEnhancedCADNavigationCube(null as any, camera);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Professional CAD navigation cube creation failed');
    });
  });

  describe('CAD Navigation Cube Integration', () => {
    it('should integrate properly with scene', () => {
      console.log('[DEBUG] Testing scene integration');

      const result = createCADNavigationCube(scene, camera);

      expect(result.success).toBe(true);
      if (result.success) {
        // Overlay texture should be associated with the scene
        expect(result.data.overlayTexture).toBeDefined();
        expect(result.data.overlayTexture.getScene()).toBe(scene);
      }
    });

    it('should handle scene disposal gracefully', () => {
      console.log('[DEBUG] Testing scene disposal handling');

      const result = createCADNavigationCube(scene, camera);

      expect(result.success).toBe(true);
      if (result.success) {
        // Dispose scene
        scene.dispose();

        // Should not throw when disposing navigation cube after scene disposal
        expect(() => result.data.dispose()).not.toThrow();
      }
    });
  });

  describe('Configuration Validation', () => {
    it('should handle edge case configurations', () => {
      console.log('[DEBUG] Testing edge case configurations');

      const edgeConfig = {
        cubeSize: 50, // Very small
        animationDuration: 0, // No animation
        marginPixels: 5, // Small margin
        cornerPosition: 'bottom-left' as const
      };

      const result = createCADNavigationCube(scene, camera, edgeConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.config.cubeSize).toBe(50);
        expect(result.data.config.animationDuration).toBe(0);
        expect(result.data.config.marginPixels).toBe(5);
        expect(result.data.config.cornerPosition).toBe('bottom-left');
      }
    });

    it('should handle different corner positions', () => {
      console.log('[DEBUG] Testing corner position configurations');

      const positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const;

      positions.forEach(position => {
        const result = createCADNavigationCube(scene, camera, {
          cornerPosition: position
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.config.cornerPosition).toBe(position);
        }
      });
    });
  });
});
