/**
 * @file text-generator.test.ts
 * @description Tests for TextGeneratorService
 *
 * Tests text-to-polygon conversion, font handling, and OpenSCAD text() primitive compatibility.
 * Follows TDD approach with comprehensive test coverage for text rendering functionality.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { isError, isSuccess } from '@/shared/types';
import type { TextParameters } from '../../../../types/text-parameters';
import { TextGeneratorService } from './text-generator';

describe('TextGeneratorService', () => {
  let textGenerator: TextGeneratorService;

  beforeEach(() => {
    textGenerator = new TextGeneratorService();
  });

  describe('Basic Text Generation', () => {
    it('should generate simple text polygon', async () => {
      const params: TextParameters = {
        text: 'Hello',
        size: 10,
        font: 'Liberation Sans',
      };

      const result = await textGenerator.generateTextPolygon(params);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const textPolygon = result.data;
        expect(textPolygon.vertices).toBeDefined();
        expect(textPolygon.vertices.length).toBeGreaterThan(0);
        expect(textPolygon.outline).toBeDefined();
        expect(textPolygon.outline.length).toBeGreaterThan(0);
        expect(textPolygon.metadata.primitiveType).toBe('2d-polygon');
        expect(textPolygon.metadata.parameters.text).toBe('Hello');
      }
    });

    it('should handle empty text', async () => {
      const params: TextParameters = {
        text: '',
        size: 10,
      };

      const result = await textGenerator.generateTextPolygon(params);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const textPolygon = result.data;
        expect(textPolygon.vertices.length).toBe(0);
        expect(textPolygon.outline.length).toBe(0);
      }
    });

    it('should handle single character', async () => {
      const params: TextParameters = {
        text: 'A',
        size: 12,
        font: 'Liberation Sans',
      };

      const result = await textGenerator.generateTextPolygon(params);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const textPolygon = result.data;
        expect(textPolygon.vertices.length).toBeGreaterThan(0);
        expect(textPolygon.outline.length).toBeGreaterThan(0);

        // Single character should have reasonable bounds
        const bounds = textGenerator.calculateTextBounds(textPolygon);
        expect(bounds.width).toBeGreaterThan(0);
        expect(bounds.height).toBeGreaterThan(0);
        expect(bounds.width).toBeLessThan(20); // Reasonable for size 12
        expect(bounds.height).toBeLessThan(20);
      }
    });
  });

  describe('Font Handling', () => {
    it('should handle different font families', async () => {
      const fonts = ['Liberation Sans', 'Liberation Serif', 'Liberation Mono'];

      for (const font of fonts) {
        const params: TextParameters = {
          text: 'Test',
          size: 10,
          font,
        };

        const result = await textGenerator.generateTextPolygon(params);
        expect(isSuccess(result)).toBe(true);

        if (isSuccess(result)) {
          expect(result.data.metadata.parameters.font).toBe(font);
        }
      }
    });

    it('should handle font with style specification', async () => {
      const params: TextParameters = {
        text: 'Bold',
        size: 10,
        font: 'Liberation Sans:style=Bold',
      };

      const result = await textGenerator.generateTextPolygon(params);
      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        expect(result.data.metadata.parameters.font).toBe('Liberation Sans:style=Bold');
      }
    });

    it('should fallback to default font for unknown fonts', async () => {
      const params: TextParameters = {
        text: 'Test',
        size: 10,
        font: 'NonExistentFont',
      };

      const result = await textGenerator.generateTextPolygon(params);
      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        // Should still generate text using fallback font
        expect(result.data.vertices.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Text Size and Scaling', () => {
    it('should scale text correctly with size parameter', async () => {
      const baseParams: TextParameters = {
        text: 'Scale',
        size: 10,
        font: 'Liberation Sans',
      };

      const largeParams: TextParameters = {
        ...baseParams,
        size: 20,
      };

      const baseResult = await textGenerator.generateTextPolygon(baseParams);
      const largeResult = await textGenerator.generateTextPolygon(largeParams);

      expect(isSuccess(baseResult)).toBe(true);
      expect(isSuccess(largeResult)).toBe(true);

      if (isSuccess(baseResult) && isSuccess(largeResult)) {
        const baseBounds = textGenerator.calculateTextBounds(baseResult.data);
        const largeBounds = textGenerator.calculateTextBounds(largeResult.data);

        // Large text should be approximately 2x the size
        expect(largeBounds.width).toBeGreaterThan(baseBounds.width * 1.8);
        expect(largeBounds.height).toBeGreaterThan(baseBounds.height * 1.8);
      }
    });

    it('should handle very small text sizes', async () => {
      const params: TextParameters = {
        text: 'Tiny',
        size: 1,
        font: 'Liberation Sans',
      };

      const result = await textGenerator.generateTextPolygon(params);
      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const bounds = textGenerator.calculateTextBounds(result.data);
        expect(bounds.width).toBeGreaterThan(0);
        expect(bounds.height).toBeGreaterThan(0);
        expect(bounds.height).toBeLessThan(2); // Should be small
      }
    });

    it('should handle large text sizes', async () => {
      const params: TextParameters = {
        text: 'Big',
        size: 100,
        font: 'Liberation Sans',
      };

      const result = await textGenerator.generateTextPolygon(params);
      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const bounds = textGenerator.calculateTextBounds(result.data);
        expect(bounds.width).toBeGreaterThan(50);
        expect(bounds.height).toBeGreaterThan(50);
      }
    });
  });

  describe('Text Alignment', () => {
    it('should handle horizontal alignment', async () => {
      const baseParams: TextParameters = {
        text: 'Align',
        size: 10,
        font: 'Liberation Sans',
        halign: 'left',
      };

      const alignments: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
      const results = [];

      for (const halign of alignments) {
        const params = { ...baseParams, halign };
        const result = await textGenerator.generateTextPolygon(params);
        expect(isSuccess(result)).toBe(true);

        if (isSuccess(result)) {
          results.push({
            halign,
            bounds: textGenerator.calculateTextBounds(result.data),
          });
        }
      }

      // Different alignments should produce different positioning
      expect(results.length).toBe(3);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
      expect(results[2]).toBeDefined();

      if (results[0] && results[1] && results[2]) {
        expect(results[0].bounds.x).not.toBe(results[1].bounds.x);
        expect(results[1].bounds.x).not.toBe(results[2].bounds.x);
      }
    });

    it('should handle vertical alignment', async () => {
      const baseParams: TextParameters = {
        text: 'Align',
        size: 10,
        font: 'Liberation Sans',
        valign: 'baseline',
      };

      const alignments: Array<'top' | 'center' | 'baseline' | 'bottom'> = [
        'top',
        'center',
        'baseline',
        'bottom',
      ];
      const results = [];

      for (const valign of alignments) {
        const params = { ...baseParams, valign };
        const result = await textGenerator.generateTextPolygon(params);
        expect(isSuccess(result)).toBe(true);

        if (isSuccess(result)) {
          results.push({
            valign,
            bounds: textGenerator.calculateTextBounds(result.data),
          });
        }
      }

      // Different alignments should produce different positioning
      expect(results.length).toBe(4);
      // Baseline should be different from top/center/bottom
      const baseline = results.find((r) => r.valign === 'baseline');
      const top = results.find((r) => r.valign === 'top');
      expect(baseline?.bounds.y).not.toBe(top?.bounds.y);
    });
  });

  describe('Text Spacing and Direction', () => {
    it('should handle character spacing', async () => {
      const baseParams: TextParameters = {
        text: 'Space',
        size: 10,
        font: 'Liberation Sans',
        spacing: 1.0,
      };

      const wideParams: TextParameters = {
        ...baseParams,
        spacing: 2.0,
      };

      const baseResult = await textGenerator.generateTextPolygon(baseParams);
      const wideResult = await textGenerator.generateTextPolygon(wideParams);

      expect(isSuccess(baseResult)).toBe(true);
      expect(isSuccess(wideResult)).toBe(true);

      if (isSuccess(baseResult) && isSuccess(wideResult)) {
        const baseBounds = textGenerator.calculateTextBounds(baseResult.data);
        const wideBounds = textGenerator.calculateTextBounds(wideResult.data);

        // Wide spacing should make text wider
        expect(wideBounds.width).toBeGreaterThan(baseBounds.width);
      }
    });

    it('should handle text direction', async () => {
      const params: TextParameters = {
        text: 'Direction',
        size: 10,
        font: 'Liberation Sans',
        direction: 'ltr',
      };

      const result = await textGenerator.generateTextPolygon(params);
      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        expect(result.data.metadata.parameters.direction).toBe('ltr');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid parameters gracefully', async () => {
      const params: TextParameters = {
        text: 'Test',
        size: -1, // Invalid size
        font: 'Liberation Sans',
      };

      const result = await textGenerator.generateTextPolygon(params);
      expect(isError(result)).toBe(true);

      if (isError(result)) {
        expect(result.error.message).toContain('size');
      }
    });

    it('should handle very long text', async () => {
      const longText = 'A'.repeat(1000);
      const params: TextParameters = {
        text: longText,
        size: 10,
        font: 'Liberation Sans',
      };

      const result = await textGenerator.generateTextPolygon(params);
      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        expect(result.data.vertices.length).toBeGreaterThan(0);
        const bounds = textGenerator.calculateTextBounds(result.data);
        expect(bounds.width).toBeGreaterThan(1000); // Should be very wide
      }
    });
  });

  describe('Performance', () => {
    it('should generate text within reasonable time', async () => {
      const params: TextParameters = {
        text: 'Performance Test',
        size: 12,
        font: 'Liberation Sans',
      };

      const startTime = performance.now();
      const result = await textGenerator.generateTextPolygon(params);
      const endTime = performance.now();

      const generationTime = endTime - startTime;

      expect(isSuccess(result)).toBe(true);
      expect(generationTime).toBeLessThan(100); // Should complete in <100ms

      console.log(`Text generation time: ${generationTime.toFixed(2)}ms`);
    });
  });
});
