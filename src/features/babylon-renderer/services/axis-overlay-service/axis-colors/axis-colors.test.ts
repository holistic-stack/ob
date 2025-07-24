/**
 * @file axis-colors.test.ts
 * @description Tests for axis colors module
 */

import { Color3 } from '@babylonjs/core';
import { describe, expect, it } from 'vitest';
import { AXIS_NAMES } from '../axis-constants/axis-constants';
import {
  AXIS_COLOR_SCHEMES,
  AxisColorUtils,
  DEFAULT_AXIS_COLORS,
  DEFAULT_AXIS_COLORS_3,
  STANDARD_AXIS_COLORS,
  type AxisColorScheme,
  type RGBAColor,
  type RGBColor,
} from './axis-colors';

describe('AxisColors', () => {
  describe('STANDARD_AXIS_COLORS', () => {
    it('should have correct standard colors', () => {
      expect(STANDARD_AXIS_COLORS.X).toEqual([1, 0, 0]); // Red
      expect(STANDARD_AXIS_COLORS.Y).toEqual([0, 1, 0]); // Green
      expect(STANDARD_AXIS_COLORS.Z).toEqual([0, 0, 1]); // Blue
    });

    it('should have colors for all axes', () => {
      Object.values(AXIS_NAMES).forEach((axis) => {
        expect(STANDARD_AXIS_COLORS[axis]).toBeDefined();
        expect(STANDARD_AXIS_COLORS[axis]).toHaveLength(3);
      });
    });
  });

  describe('AXIS_COLOR_SCHEMES', () => {
    it('should contain all defined schemes', () => {
      expect(AXIS_COLOR_SCHEMES.STANDARD).toBeDefined();
      expect(AXIS_COLOR_SCHEMES.MUTED).toBeDefined();
      expect(AXIS_COLOR_SCHEMES.HIGH_CONTRAST).toBeDefined();
      expect(AXIS_COLOR_SCHEMES.PASTEL).toBeDefined();
    });

    it('should have valid colors for all schemes', () => {
      Object.values(AXIS_COLOR_SCHEMES).forEach((scheme) => {
        Object.values(AXIS_NAMES).forEach((axis) => {
          const color = scheme[axis];
          expect(color).toHaveLength(3);
          expect(AxisColorUtils.isValidRgb(color)).toBe(true);
        });
      });
    });
  });

  describe('AxisColorUtils', () => {
    describe('rgbToColor3', () => {
      it('should convert RGB tuple to Color3', () => {
        const rgb: RGBColor = [0.5, 0.7, 0.9];
        const color3 = AxisColorUtils.rgbToColor3(rgb);
        
        expect(color3).toBeInstanceOf(Color3);
        expect(color3.r).toBe(0.5);
        expect(color3.g).toBe(0.7);
        expect(color3.b).toBe(0.9);
      });
    });

    describe('rgbaToColor3', () => {
      it('should convert RGBA tuple to Color3 ignoring alpha', () => {
        const rgba: RGBAColor = [0.5, 0.7, 0.9, 0.8];
        const color3 = AxisColorUtils.rgbaToColor3(rgba);
        
        expect(color3).toBeInstanceOf(Color3);
        expect(color3.r).toBe(0.5);
        expect(color3.g).toBe(0.7);
        expect(color3.b).toBe(0.9);
      });
    });

    describe('color3ToRgb', () => {
      it('should convert Color3 to RGB tuple', () => {
        const color3 = new Color3(0.3, 0.6, 0.9);
        const rgb = AxisColorUtils.color3ToRgb(color3);
        
        expect(rgb).toEqual([0.3, 0.6, 0.9]);
      });
    });

    describe('getAxisColor', () => {
      it('should return correct color for axis with default scheme', () => {
        const xColor = AxisColorUtils.getAxisColor('X');
        expect(xColor).toEqual([1, 0, 0]);
      });

      it('should return correct color for axis with specified scheme', () => {
        const xColor = AxisColorUtils.getAxisColor('X', 'MUTED');
        expect(xColor).toEqual([0.8, 0.2, 0.2]);
      });
    });

    describe('getAxisColor3', () => {
      it('should return Color3 for axis', () => {
        const xColor = AxisColorUtils.getAxisColor3('X');
        expect(xColor).toBeInstanceOf(Color3);
        expect(xColor.r).toBe(1);
        expect(xColor.g).toBe(0);
        expect(xColor.b).toBe(0);
      });
    });

    describe('isValidRgb', () => {
      it('should validate correct RGB values', () => {
        expect(AxisColorUtils.isValidRgb([0, 0, 0])).toBe(true);
        expect(AxisColorUtils.isValidRgb([1, 1, 1])).toBe(true);
        expect(AxisColorUtils.isValidRgb([0.5, 0.7, 0.9])).toBe(true);
      });

      it('should reject invalid RGB values', () => {
        expect(AxisColorUtils.isValidRgb([-0.1, 0, 0])).toBe(false);
        expect(AxisColorUtils.isValidRgb([1.1, 0, 0])).toBe(false);
        expect(AxisColorUtils.isValidRgb([0, -1, 0])).toBe(false);
        expect(AxisColorUtils.isValidRgb([0, 0, 2])).toBe(false);
      });
    });

    describe('isValidRgba', () => {
      it('should validate correct RGBA values', () => {
        expect(AxisColorUtils.isValidRgba([0, 0, 0, 0])).toBe(true);
        expect(AxisColorUtils.isValidRgba([1, 1, 1, 1])).toBe(true);
        expect(AxisColorUtils.isValidRgba([0.5, 0.7, 0.9, 0.8])).toBe(true);
      });

      it('should reject invalid RGBA values', () => {
        expect(AxisColorUtils.isValidRgba([-0.1, 0, 0, 0])).toBe(false);
        expect(AxisColorUtils.isValidRgba([0, 0, 0, 1.1])).toBe(false);
      });
    });

    describe('clampRgb', () => {
      it('should clamp RGB values to valid range', () => {
        expect(AxisColorUtils.clampRgb([-0.1, 0.5, 1.1])).toEqual([0, 0.5, 1]);
        expect(AxisColorUtils.clampRgb([0.3, 0.7, 0.9])).toEqual([0.3, 0.7, 0.9]);
      });
    });

    describe('clampRgba', () => {
      it('should clamp RGBA values to valid range', () => {
        expect(AxisColorUtils.clampRgba([-0.1, 0.5, 1.1, 1.5])).toEqual([0, 0.5, 1, 1]);
        expect(AxisColorUtils.clampRgba([0.3, 0.7, 0.9, 0.8])).toEqual([0.3, 0.7, 0.9, 0.8]);
      });
    });

    describe('dimColor', () => {
      it('should dim color by default factor', () => {
        const original: RGBColor = [1, 0.8, 0.6];
        const dimmed = AxisColorUtils.dimColor(original);
        expect(dimmed).toEqual([0.5, 0.4, 0.3]);
      });

      it('should dim color by custom factor', () => {
        const original: RGBColor = [1, 0.8, 0.6];
        const dimmed = AxisColorUtils.dimColor(original, 0.25);
        expect(dimmed).toEqual([0.25, 0.2, 0.15]);
      });

      it('should clamp factor to valid range', () => {
        const original: RGBColor = [1, 0.8, 0.6];
        const dimmed1 = AxisColorUtils.dimColor(original, -0.1);
        const dimmed2 = AxisColorUtils.dimColor(original, 1.5);
        
        expect(dimmed1).toEqual([0, 0, 0]);
        expect(dimmed2).toEqual([1, 0.8, 0.6]);
      });
    });

    describe('brightenColor', () => {
      it('should brighten color by default factor', () => {
        const original: RGBColor = [0.4, 0.6, 0.8];
        const brightened = AxisColorUtils.brightenColor(original);
        expect(brightened[0]).toBeCloseTo(0.6, 5);
        expect(brightened[1]).toBeCloseTo(0.9, 5);
        expect(brightened[2]).toBeCloseTo(1, 5);
      });

      it('should brighten color by custom factor', () => {
        const original: RGBColor = [0.4, 0.6, 0.2];
        const brightened = AxisColorUtils.brightenColor(original, 2);
        expect(brightened).toEqual([0.8, 1, 0.4]);
      });

      it('should clamp results to valid range', () => {
        const original: RGBColor = [0.8, 0.9, 1];
        const brightened = AxisColorUtils.brightenColor(original, 2);
        expect(brightened).toEqual([1, 1, 1]);
      });
    });

    describe('getAllAxisColors', () => {
      it('should return all axis colors for default scheme', () => {
        const colors = AxisColorUtils.getAllAxisColors();
        expect(colors).toEqual(STANDARD_AXIS_COLORS);
      });

      it('should return all axis colors for specified scheme', () => {
        const colors = AxisColorUtils.getAllAxisColors('MUTED');
        expect(colors).toEqual(AXIS_COLOR_SCHEMES.MUTED);
      });
    });

    describe('getAllAxisColors3', () => {
      it('should return all axis colors as Color3 objects', () => {
        const colors = AxisColorUtils.getAllAxisColors3();
        
        expect(colors.X).toBeInstanceOf(Color3);
        expect(colors.Y).toBeInstanceOf(Color3);
        expect(colors.Z).toBeInstanceOf(Color3);
        
        expect(colors.X.r).toBe(1);
        expect(colors.X.g).toBe(0);
        expect(colors.X.b).toBe(0);
      });
    });
  });

  describe('DEFAULT_AXIS_COLORS', () => {
    it('should equal standard axis colors', () => {
      expect(DEFAULT_AXIS_COLORS).toEqual(STANDARD_AXIS_COLORS);
    });
  });

  describe('DEFAULT_AXIS_COLORS_3', () => {
    it('should contain Color3 objects for all axes', () => {
      Object.values(AXIS_NAMES).forEach((axis) => {
        expect(DEFAULT_AXIS_COLORS_3[axis]).toBeInstanceOf(Color3);
      });
    });

    it('should match standard colors', () => {
      expect(DEFAULT_AXIS_COLORS_3.X.r).toBe(1);
      expect(DEFAULT_AXIS_COLORS_3.X.g).toBe(0);
      expect(DEFAULT_AXIS_COLORS_3.X.b).toBe(0);
    });
  });
});