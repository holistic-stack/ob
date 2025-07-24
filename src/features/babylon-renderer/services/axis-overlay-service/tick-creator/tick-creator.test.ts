/**
 * @file tick-creator.test.ts
 * @description Tests for tick and label creation functions using real BabylonJS NullEngine
 */

import * as BABYLON from '@babylonjs/core';
import { AdvancedDynamicTexture } from '@babylonjs/gui';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAxisLabel, createAxisTicks, getTickPosition } from './tick-creator';

describe('TickCreator', () => {
  let scene: BABYLON.Scene;
  let engine: BABYLON.NullEngine;
  let guiTexture: AdvancedDynamicTexture;

  beforeEach(() => {
    // Create a null engine (headless)
    engine = new BABYLON.NullEngine();

    // Create a real scene
    scene = new BABYLON.Scene(engine);

    // Create GUI texture
    guiTexture = AdvancedDynamicTexture.CreateFullscreenUI('TestGUI', true, scene);
  });

  afterEach(() => {
    // Clean up
    guiTexture.dispose();
    scene.dispose();
    engine.dispose();
  });

  describe('getTickPosition', () => {
    it('should calculate correct position for X-axis', () => {
      const origin = new BABYLON.Vector3(0, 0, 0);
      const position = getTickPosition('x', origin, 10, 5);

      expect(position.x).toBe(10);
      expect(position.y).toBe(5);
      expect(position.z).toBe(0);
    });

    it('should calculate correct position for Y-axis', () => {
      const origin = new BABYLON.Vector3(0, 0, 0);
      const position = getTickPosition('y', origin, 10, 5);

      expect(position.x).toBe(5);
      expect(position.y).toBe(10);
      expect(position.z).toBe(0);
    });

    it('should calculate correct position for Z-axis', () => {
      const origin = new BABYLON.Vector3(0, 0, 0);
      const position = getTickPosition('z', origin, 10, 5);

      expect(position.x).toBe(0);
      expect(position.y).toBe(5);
      expect(position.z).toBe(10);
    });

    it('should handle non-zero origin', () => {
      const origin = new BABYLON.Vector3(1, 2, 3);
      const position = getTickPosition('x', origin, 10, 5);

      expect(position.x).toBe(11);
      expect(position.y).toBe(7);
      expect(position.z).toBe(3);
    });
  });

  describe('createAxisTicks', () => {
    it('should create major and minor ticks for X-axis', () => {
      const config = {
        axis: 'x' as const,
        origin: new BABYLON.Vector3(0, 0, 0),
        majorCount: 3,
        minorCount: 2,
        interval: 1,
        tickLength: 0.5,
        color: new BABYLON.Color3(1, 0, 0),
      };

      const result = createAxisTicks(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.majorTicks.length).toBe(6); // -3 to 3, excluding 0
        expect(result.data.minorTicks.length).toBeGreaterThan(0);

        // Check that ticks are properly named
        const tickNames = result.data.majorTicks.map((tick) => tick.name);
        expect(tickNames).toContain('xMajorTick1');
        expect(tickNames).toContain('xMajorTick-1');
      }
    });

    it('should handle null scene gracefully', () => {
      const config = {
        axis: 'x' as const,
        origin: new BABYLON.Vector3(0, 0, 0),
        majorCount: 3,
        minorCount: 2,
        interval: 1,
        tickLength: 0.5,
        color: new BABYLON.Color3(1, 0, 0),
      };

      const result = createAxisTicks(null, config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SCENE_NULL');
      }
    });

    it('should create ticks with correct colors', () => {
      const config = {
        axis: 'y' as const,
        origin: new BABYLON.Vector3(0, 0, 0),
        majorCount: 2,
        minorCount: 2,
        interval: 1,
        tickLength: 0.5,
        color: new BABYLON.Color3(0, 1, 0),
      };

      const result = createAxisTicks(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        // Check that all ticks have the correct color
        result.data.majorTicks.forEach((tick) => {
          expect(tick.color).toEqual(config.color);
        });
        result.data.minorTicks.forEach((tick) => {
          expect(tick.color).toEqual(config.color);
        });
      }
    });

    it('should skip origin tick', () => {
      const config = {
        axis: 'z' as const,
        origin: new BABYLON.Vector3(0, 0, 0),
        majorCount: 2,
        minorCount: 2,
        interval: 1,
        tickLength: 0.5,
        color: new BABYLON.Color3(0, 0, 1),
      };

      const result = createAxisTicks(scene, config);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should have ticks for -2, -1, 1, 2 (excluding 0)
        expect(result.data.majorTicks.length).toBe(4);

        // Check that no tick is named with "0"
        const tickNames = result.data.majorTicks.map((tick) => tick.name);
        expect(tickNames.some((name) => name.includes('Tick0'))).toBe(false);
      }
    });
  });

  describe('createAxisLabel', () => {
    it('should create a label with correct properties', () => {
      const config = {
        axis: 'x' as const,
        value: 10,
        text: '10',
        fontSize: 12,
        color: new BABYLON.Color3(1, 0, 0),
        position: new BABYLON.Vector3(10, 0, 0),
      };

      const result = createAxisLabel(guiTexture, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.labelBlock).toBeDefined();
        expect(result.data.labelBlock.name).toBe('xLabel10');
        expect(result.data.labelBlock.text).toBe('10');
        expect(result.data.labelBlock.fontSizeInPixels).toBe(12);
      }
    });

    it('should handle null GUI texture gracefully', () => {
      const config = {
        axis: 'x' as const,
        value: 10,
        text: '10',
        fontSize: 12,
        color: new BABYLON.Color3(1, 0, 0),
        position: new BABYLON.Vector3(10, 0, 0),
      };

      const result = createAxisLabel(null, config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('GUI_NULL');
      }
    });

    it('should set correct color format', () => {
      const config = {
        axis: 'y' as const,
        value: 5,
        text: '5',
        fontSize: 14,
        color: new BABYLON.Color3(0, 1, 0), // Pure green
        position: new BABYLON.Vector3(0, 5, 0),
      };

      const result = createAxisLabel(guiTexture, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.labelBlock.color).toBe('rgb(0, 255, 0)');
      }
    });

    it('should position label correctly', () => {
      const config = {
        axis: 'z' as const,
        value: -3,
        text: '-3',
        fontSize: 10,
        color: new BABYLON.Color3(0, 0, 1),
        position: new BABYLON.Vector3(0, 0, -3),
      };

      const result = createAxisLabel(guiTexture, config);

      expect(result.success).toBe(true);
      if (result.success) {
        // Check positioning (simplified scaling)
        expect(result.data.labelBlock.leftInPixels).toBe(0);
        expect(result.data.labelBlock.topInPixels).toBe(0);
      }
    });
  });
});
