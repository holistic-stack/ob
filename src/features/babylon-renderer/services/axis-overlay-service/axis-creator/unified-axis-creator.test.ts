/**
 * @file unified-axis-creator.test.ts
 * @description Tests for unified axis creator module
 */

import { NullEngine, Scene, Vector3 } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AxisResultUtils } from '../axis-errors/axis-errors';
import {
  AxisConfigHelpers,
  type CylinderAxisConfig,
  CylinderAxisStrategy,
  defaultAxisCreator,
  type ScreenSpaceAxisConfig,
  ScreenSpaceAxisStrategy,
  UnifiedAxisCreator,
} from './unified-axis-creator';

describe('UnifiedAxisCreator', () => {
  let engine: NullEngine;
  let scene: Scene;
  let creator: UnifiedAxisCreator;

  beforeEach(() => {
    engine = new NullEngine();
    scene = new Scene(engine);
    creator = new UnifiedAxisCreator();
  });

  afterEach(() => {
    scene.dispose();
    engine.dispose();
  });

  describe('ScreenSpaceAxisStrategy', () => {
    let strategy: ScreenSpaceAxisStrategy;

    beforeEach(() => {
      strategy = new ScreenSpaceAxisStrategy();
    });

    describe('createAxis', () => {
      it('should create a screen-space axis successfully', () => {
        const config: ScreenSpaceAxisConfig = {
          name: 'X',
          origin: Vector3.Zero(),
          direction: new Vector3(1, 0, 0),
          length: 100,
          color: [1, 0, 0],
          pixelWidth: 2.0,
          resolution: [1920, 1080],
          opacity: 1.0,
        };

        const result = strategy.createAxis(config, scene);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);

        if (AxisResultUtils.isSuccess(result)) {
          expect(result.data.mesh).toBeDefined();
          expect(result.data.material).toBeDefined();
          expect(result.data.name).toContain('X');
          expect(result.data.name).toContain('AxisScreenSpace');
        }
      });

      it('should fail with invalid scene', () => {
        const config: ScreenSpaceAxisConfig = {
          name: 'X',
          origin: Vector3.Zero(),
          direction: new Vector3(1, 0, 0),
          length: 100,
          color: [1, 0, 0],
          pixelWidth: 2.0,
          resolution: [1920, 1080],
        };

        const result = strategy.createAxis(config, null as any);
        expect(AxisResultUtils.isFailure(result)).toBe(true);
      });

      it('should fail with invalid pixel width', () => {
        const config: ScreenSpaceAxisConfig = {
          name: 'X',
          origin: Vector3.Zero(),
          direction: new Vector3(1, 0, 0),
          length: 100,
          color: [1, 0, 0],
          pixelWidth: -1, // Invalid
          resolution: [1920, 1080],
        };

        const result = strategy.createAxis(config, scene);
        expect(AxisResultUtils.isFailure(result)).toBe(true);
      });

      it('should fail with invalid resolution', () => {
        const config: ScreenSpaceAxisConfig = {
          name: 'X',
          origin: Vector3.Zero(),
          direction: new Vector3(1, 0, 0),
          length: 100,
          color: [1, 0, 0],
          pixelWidth: 2.0,
          resolution: [0, 1080], // Invalid
        };

        const result = strategy.createAxis(config, scene);
        expect(AxisResultUtils.isFailure(result)).toBe(true);
      });
    });
  });

  describe('CylinderAxisStrategy', () => {
    let strategy: CylinderAxisStrategy;

    beforeEach(() => {
      strategy = new CylinderAxisStrategy();
    });

    describe('createAxis', () => {
      it('should create a cylinder axis successfully', () => {
        const config: CylinderAxisConfig = {
          name: 'Y',
          origin: Vector3.Zero(),
          direction: new Vector3(0, 1, 0),
          length: 100,
          color: [0, 1, 0],
          diameter: 0.5,
          tessellation: 8,
          opacity: 1.0,
        };

        const result = strategy.createAxis(config, scene);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);

        if (AxisResultUtils.isSuccess(result)) {
          expect(result.data.mesh).toBeDefined();
          expect(result.data.material).toBeDefined();
          expect(result.data.name).toContain('Y');
          expect(result.data.name).toContain('AxisFull');
        }
      });

      it('should fail with invalid scene', () => {
        const config: CylinderAxisConfig = {
          name: 'Y',
          origin: Vector3.Zero(),
          direction: new Vector3(0, 1, 0),
          length: 100,
          color: [0, 1, 0],
          diameter: 0.5,
        };

        const result = strategy.createAxis(config, null as any);
        expect(AxisResultUtils.isFailure(result)).toBe(true);
      });

      it('should fail with invalid length', () => {
        const config: CylinderAxisConfig = {
          name: 'Y',
          origin: Vector3.Zero(),
          direction: new Vector3(0, 1, 0),
          length: -10, // Invalid
          color: [0, 1, 0],
          diameter: 0.5,
        };

        const result = strategy.createAxis(config, scene);
        expect(AxisResultUtils.isFailure(result)).toBe(true);
      });
    });
  });

  describe('UnifiedAxisCreator', () => {
    describe('createScreenSpaceAxis', () => {
      it('should create a screen-space axis', () => {
        const config: ScreenSpaceAxisConfig = {
          name: 'Z',
          origin: Vector3.Zero(),
          direction: new Vector3(0, 0, 1),
          length: 100,
          color: [0, 0, 1],
          pixelWidth: 2.0,
          resolution: [1920, 1080],
        };

        const result = creator.createScreenSpaceAxis(config, scene);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);
      });
    });

    describe('createCylinderAxis', () => {
      it('should create a cylinder axis', () => {
        const config: CylinderAxisConfig = {
          name: 'X',
          origin: Vector3.Zero(),
          direction: new Vector3(1, 0, 0),
          length: 100,
          color: [1, 0, 0],
          diameter: 0.5,
        };

        const result = creator.createCylinderAxis(config, scene);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);
      });
    });

    describe('createScreenSpaceCoordinateAxes', () => {
      it('should create all three coordinate axes with screen-space rendering', () => {
        const baseConfig = {
          origin: Vector3.Zero(),
          length: 100,
          pixelWidth: 2.0,
          resolution: [1920, 1080] as const,
          opacity: 1.0,
        };

        const result = creator.createScreenSpaceCoordinateAxes(baseConfig, scene);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);

        if (AxisResultUtils.isSuccess(result)) {
          expect(result.data).toHaveLength(3);
          const names = result.data.map((axis) => axis.name);
          expect(names.some((name) => name.includes('X'))).toBe(true);
          expect(names.some((name) => name.includes('Y'))).toBe(true);
          expect(names.some((name) => name.includes('Z'))).toBe(true);
        }
      });

      it('should use different color schemes', () => {
        const baseConfig = {
          origin: Vector3.Zero(),
          length: 100,
          pixelWidth: 2.0,
          resolution: [1920, 1080] as const,
        };

        const result = creator.createScreenSpaceCoordinateAxes(baseConfig, scene, 'MUTED');
        expect(AxisResultUtils.isSuccess(result)).toBe(true);
      });

      it('should fail if any axis creation fails', () => {
        const baseConfig = {
          origin: Vector3.Zero(),
          length: -10, // Invalid length
          pixelWidth: 2.0,
          resolution: [1920, 1080] as const,
        };

        const result = creator.createScreenSpaceCoordinateAxes(baseConfig, scene);
        expect(AxisResultUtils.isFailure(result)).toBe(true);
      });
    });

    describe('createCylinderCoordinateAxes', () => {
      it('should create all three coordinate axes with cylinder rendering', () => {
        const baseConfig = {
          origin: Vector3.Zero(),
          length: 100,
          diameter: 0.5,
          opacity: 1.0,
        };

        const result = creator.createCylinderCoordinateAxes(baseConfig, scene);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);

        if (AxisResultUtils.isSuccess(result)) {
          expect(result.data).toHaveLength(3);
          const names = result.data.map((axis) => axis.name);
          expect(names.some((name) => name.includes('X'))).toBe(true);
          expect(names.some((name) => name.includes('Y'))).toBe(true);
          expect(names.some((name) => name.includes('Z'))).toBe(true);
        }
      });

      it('should use different color schemes', () => {
        const baseConfig = {
          origin: Vector3.Zero(),
          length: 100,
          diameter: 0.5,
        };

        const result = creator.createCylinderCoordinateAxes(baseConfig, scene, 'HIGH_CONTRAST');
        expect(AxisResultUtils.isSuccess(result)).toBe(true);
      });
    });

    describe('createAxis', () => {
      it('should auto-select screen-space strategy for config with pixelWidth', () => {
        const config = {
          name: 'X' as const,
          origin: Vector3.Zero(),
          direction: new Vector3(1, 0, 0),
          length: 100,
          color: [1, 0, 0] as const,
          pixelWidth: 2.0,
          resolution: [1920, 1080] as const,
        };

        const result = creator.createAxis(config, scene);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);

        if (AxisResultUtils.isSuccess(result)) {
          expect(result.data.name).toContain('AxisScreenSpace');
        }
      });

      it('should auto-select cylinder strategy for config with diameter', () => {
        const config = {
          name: 'Y' as const,
          origin: Vector3.Zero(),
          direction: new Vector3(0, 1, 0),
          length: 100,
          color: [0, 1, 0] as const,
          diameter: 0.5,
        };

        const result = creator.createAxis(config, scene);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);

        if (AxisResultUtils.isSuccess(result)) {
          expect(result.data.name).toContain('AxisFull');
        }
      });

      it('should respect explicit strategy selection', () => {
        const config = {
          name: 'Z' as const,
          origin: Vector3.Zero(),
          direction: new Vector3(0, 0, 1),
          length: 100,
          color: [0, 0, 1] as const,
          pixelWidth: 2.0,
          resolution: [1920, 1080] as const,
          strategy: 'screen-space' as const,
        };

        const result = creator.createAxis(config, scene);
        expect(AxisResultUtils.isSuccess(result)).toBe(true);
      });
    });
  });

  describe('defaultAxisCreator', () => {
    it('should be an instance of UnifiedAxisCreator', () => {
      expect(defaultAxisCreator).toBeInstanceOf(UnifiedAxisCreator);
    });

    it('should be usable for creating axes', () => {
      const config: ScreenSpaceAxisConfig = {
        name: 'X',
        origin: Vector3.Zero(),
        direction: new Vector3(1, 0, 0),
        length: 100,
        color: [1, 0, 0],
        pixelWidth: 2.0,
        resolution: [1920, 1080],
      };

      const result = defaultAxisCreator.createScreenSpaceAxis(config, scene);
      expect(AxisResultUtils.isSuccess(result)).toBe(true);
    });
  });

  describe('AxisConfigHelpers', () => {
    describe('createSketchUpScreenSpaceConfig', () => {
      it('should create a valid SketchUp-style configuration', () => {
        const config = AxisConfigHelpers.createSketchUpScreenSpaceConfig();

        expect(config.origin).toEqual(Vector3.Zero());
        expect(config.length).toBe(1000);
        expect(config.pixelWidth).toBe(2.0);
        expect(config.resolution).toEqual([1920, 1080]);
        expect(config.opacity).toBe(1.0);
      });

      it('should accept custom parameters', () => {
        const customOrigin = new Vector3(10, 20, 30);
        const customLength = 500;
        const customPixelWidth = 3.0;
        const customResolution: readonly [number, number] = [2560, 1440];

        const config = AxisConfigHelpers.createSketchUpScreenSpaceConfig(
          customOrigin,
          customLength,
          customPixelWidth,
          customResolution
        );

        expect(config.origin).toEqual(customOrigin);
        expect(config.length).toBe(customLength);
        expect(config.pixelWidth).toBe(customPixelWidth);
        expect(config.resolution).toEqual(customResolution);
      });
    });

    describe('createStandardCylinderConfig', () => {
      it('should create a valid cylinder configuration', () => {
        const config = AxisConfigHelpers.createStandardCylinderConfig();

        expect(config.origin).toEqual(Vector3.Zero());
        expect(config.length).toBe(1000);
        expect(config.diameter).toBe(0.3);
        expect(config.tessellation).toBe(8);
        expect(config.opacity).toBe(1.0);
      });

      it('should accept custom parameters', () => {
        const customOrigin = new Vector3(5, 10, 15);
        const customLength = 200;
        const customDiameter = 1.0;

        const config = AxisConfigHelpers.createStandardCylinderConfig(
          customOrigin,
          customLength,
          customDiameter
        );

        expect(config.origin).toEqual(customOrigin);
        expect(config.length).toBe(customLength);
        expect(config.diameter).toBe(customDiameter);
      });
    });
  });
});
