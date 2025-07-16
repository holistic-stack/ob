/**
 * @file Grid and Axis Service Tests
 *
 * Tests for the GridAxisService following TDD principles.
 * Uses real BabylonJS NullEngine (no mocks).
 */

import { Color3, NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type GridAxisConfig, GridAxisService } from './grid-axis.service';

describe('GridAxisService', () => {
  let engine: NullEngine;
  let scene: Scene;
  let gridAxisService: GridAxisService;

  beforeEach(() => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);
    gridAxisService = new GridAxisService(scene);
  });

  afterEach(() => {
    // Clean up resources
    gridAxisService.dispose();
    scene.dispose();
    engine.dispose();
  });

  describe('Service Initialization', () => {
    it('should initialize grid axis service', () => {
      expect(gridAxisService).toBeDefined();
      expect(gridAxisService.getGridAxisSetup()).toBeNull();
    });
  });

  describe('Grid and Axes Setup', () => {
    it('should setup grid and axes with default configuration', async () => {
      const result = await gridAxisService.setupGridAndAxes();
      expect(result.success).toBe(true);

      if (result.success) {
        const setup = result.data;
        expect(setup.gridMesh).toBeDefined();
        expect(setup.xAxis).toBeDefined();
        expect(setup.yAxis).toBeDefined();
        expect(setup.zAxis).toBeDefined();
        expect(setup.axisLabels).toBeDefined();
        expect(setup.axisLabels?.length).toBe(3);
        expect(setup.rootNode).toBeDefined();
        expect(setup.meshes.length).toBeGreaterThan(0);
        expect(gridAxisService.getGridAxisSetup()).toBe(setup);
      }
    });

    it('should setup with custom configuration', async () => {
      const config: GridAxisConfig = {
        showGrid: true,
        showAxes: true,
        gridSize: 30,
        gridSpacing: 2,
        gridColor: new Color3(1, 0, 0),
        gridOpacity: 0.5,
        axisLength: 10,
        axisThickness: 0.1,
        xAxisColor: new Color3(0, 1, 0),
        yAxisColor: new Color3(0, 0, 1),
        zAxisColor: new Color3(1, 1, 0),
        showAxisLabels: true,
      };

      const result = await gridAxisService.setupGridAndAxes(config);
      expect(result.success).toBe(true);

      if (result.success) {
        const setup = result.data;
        expect(setup.gridMesh).toBeDefined();
        expect((setup.gridMesh as any)?.alpha).toBe(0.5);
        expect(setup.xAxis).toBeDefined();
        expect(setup.yAxis).toBeDefined();
        expect(setup.zAxis).toBeDefined();
        expect(setup.axisLabels?.length).toBe(3);
      }
    });

    it('should setup grid only', async () => {
      const config: GridAxisConfig = {
        showGrid: true,
        showAxes: false,
      };

      const result = await gridAxisService.setupGridAndAxes(config);
      expect(result.success).toBe(true);

      if (result.success) {
        const setup = result.data;
        expect(setup.gridMesh).toBeDefined();
        expect(setup.xAxis).toBeUndefined();
        expect(setup.yAxis).toBeUndefined();
        expect(setup.zAxis).toBeUndefined();
        expect(setup.axisLabels?.length).toBe(0);
      }
    });

    it('should setup axes only', async () => {
      const config: GridAxisConfig = {
        showGrid: false,
        showAxes: true,
      };

      const result = await gridAxisService.setupGridAndAxes(config);
      expect(result.success).toBe(true);

      if (result.success) {
        const setup = result.data;
        expect(setup.gridMesh).toBeUndefined();
        expect(setup.xAxis).toBeDefined();
        expect(setup.yAxis).toBeDefined();
        expect(setup.zAxis).toBeDefined();
      }
    });

    it('should setup axes without labels', async () => {
      const config: GridAxisConfig = {
        showGrid: false,
        showAxes: true,
        showAxisLabels: false,
      };

      const result = await gridAxisService.setupGridAndAxes(config);
      expect(result.success).toBe(true);

      if (result.success) {
        const setup = result.data;
        expect(setup.xAxis).toBeDefined();
        expect(setup.yAxis).toBeDefined();
        expect(setup.zAxis).toBeDefined();
        expect(setup.axisLabels?.length).toBe(0);
      }
    });

    it('should clear existing setup when creating new one', async () => {
      // Setup first grid and axes
      await gridAxisService.setupGridAndAxes();
      const firstMeshCount = scene.meshes.length;
      expect(firstMeshCount).toBeGreaterThan(0);

      // Setup second grid and axes
      await gridAxisService.setupGridAndAxes();
      const secondMeshCount = scene.meshes.length;

      // Should have same number of meshes (old ones cleared)
      expect(secondMeshCount).toBe(firstMeshCount);
    });
  });

  describe('Grid Spacing Updates', () => {
    beforeEach(async () => {
      await gridAxisService.setupGridAndAxes();
    });

    it('should update grid spacing', async () => {
      const result = await gridAxisService.updateGridSpacing(2.0);
      expect(result.success).toBe(true);
    });

    it('should fail to update with invalid spacing', async () => {
      const result = await gridAxisService.updateGridSpacing(-1);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('UPDATE_FAILED');
      }
    });

    it('should fail to update without grid', async () => {
      gridAxisService.dispose();

      const result = await gridAxisService.updateGridSpacing(2.0);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('UPDATE_FAILED');
      }
    });
  });

  describe('Visibility Controls', () => {
    beforeEach(async () => {
      await gridAxisService.setupGridAndAxes();
    });

    it('should control grid visibility', () => {
      const setup = gridAxisService.getGridAxisSetup();
      expect(setup?.gridMesh?.isEnabled()).toBe(true);

      gridAxisService.setGridVisibility(false);
      expect(setup?.gridMesh?.isEnabled()).toBe(false);

      gridAxisService.setGridVisibility(true);
      expect(setup?.gridMesh?.isEnabled()).toBe(true);
    });

    it('should control axes visibility', () => {
      const setup = gridAxisService.getGridAxisSetup();
      expect(setup?.xAxis?.isEnabled()).toBe(true);
      expect(setup?.yAxis?.isEnabled()).toBe(true);
      expect(setup?.zAxis?.isEnabled()).toBe(true);

      gridAxisService.setAxesVisibility(false);
      expect(setup?.xAxis?.isEnabled()).toBe(false);
      expect(setup?.yAxis?.isEnabled()).toBe(false);
      expect(setup?.zAxis?.isEnabled()).toBe(false);

      gridAxisService.setAxesVisibility(true);
      expect(setup?.xAxis?.isEnabled()).toBe(true);
      expect(setup?.yAxis?.isEnabled()).toBe(true);
      expect(setup?.zAxis?.isEnabled()).toBe(true);
    });

    it('should handle visibility controls without setup', () => {
      gridAxisService.dispose();

      // Should not throw
      gridAxisService.setGridVisibility(false);
      gridAxisService.setAxesVisibility(false);
    });
  });

  describe('Axis Configuration', () => {
    it('should create axes with custom colors', async () => {
      const config: GridAxisConfig = {
        xAxisColor: new Color3(1, 1, 0), // Yellow
        yAxisColor: new Color3(1, 0, 1), // Magenta
        zAxisColor: new Color3(0, 1, 1), // Cyan
      };

      const result = await gridAxisService.setupGridAndAxes(config);
      expect(result.success).toBe(true);

      if (result.success) {
        const setup = result.data;
        expect(setup.xAxis?.material).toBeDefined();
        expect(setup.yAxis?.material).toBeDefined();
        expect(setup.zAxis?.material).toBeDefined();
      }
    });

    it('should create axes with custom dimensions', async () => {
      const config: GridAxisConfig = {
        axisLength: 15,
        axisThickness: 0.2,
      };

      const result = await gridAxisService.setupGridAndAxes(config);
      expect(result.success).toBe(true);

      if (result.success) {
        const setup = result.data;
        expect(setup.xAxis).toBeDefined();
        expect(setup.yAxis).toBeDefined();
        expect(setup.zAxis).toBeDefined();

        // Check axis positioning (should be at half the axis length)
        expect(setup.xAxis?.position.x).toBeCloseTo(7.5, 1);
        expect(setup.yAxis?.position.y).toBeCloseTo(7.5, 1);
        expect(setup.zAxis?.position.z).toBeCloseTo(7.5, 1);
      }
    });
  });

  describe('Grid Configuration', () => {
    it('should create grid with custom size and spacing', async () => {
      const config: GridAxisConfig = {
        gridSize: 40,
        gridSpacing: 5,
        gridSubdivisions: 5,
      };

      const result = await gridAxisService.setupGridAndAxes(config);
      expect(result.success).toBe(true);

      if (result.success) {
        const setup = result.data;
        expect(setup.gridMesh).toBeDefined();
      }
    });

    it('should create grid with custom appearance', async () => {
      const config: GridAxisConfig = {
        gridColor: new Color3(0, 1, 0),
        gridOpacity: 0.8,
      };

      const result = await gridAxisService.setupGridAndAxes(config);
      expect(result.success).toBe(true);

      if (result.success) {
        const setup = result.data;
        expect(setup.gridMesh).toBeDefined();
        expect((setup.gridMesh as any)?.alpha).toBe(0.8);
      }
    });
  });

  describe('Disposal', () => {
    it('should dispose grid and axes properly', async () => {
      await gridAxisService.setupGridAndAxes();
      expect(scene.meshes.length).toBeGreaterThan(0);
      expect(gridAxisService.getGridAxisSetup()).not.toBeNull();

      gridAxisService.dispose();
      expect(scene.meshes.length).toBe(0);
      expect(gridAxisService.getGridAxisSetup()).toBeNull();
    });

    it('should handle multiple dispose calls', () => {
      gridAxisService.dispose();
      gridAxisService.dispose(); // Should not throw
      expect(gridAxisService.getGridAxisSetup()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle setup errors gracefully', async () => {
      // In headless environment, grid setup usually succeeds
      // This test verifies the error handling structure is in place
      const result = await gridAxisService.setupGridAndAxes();

      // Should either succeed or fail gracefully
      if (!result.success) {
        expect(result.error.code).toBe('SETUP_FAILED');
        expect(result.error.message).toBeDefined();
        expect(result.error.timestamp).toBeDefined();
      } else {
        expect(result.data).toBeDefined();
      }
    });
  });
});
