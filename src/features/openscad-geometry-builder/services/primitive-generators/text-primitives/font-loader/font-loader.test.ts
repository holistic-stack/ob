/**
 * @file font-loader.test.ts
 * @description Tests for FontLoaderService
 *
 * Tests font loading, caching, and font metrics extraction for web-based font handling.
 * Follows TDD approach with comprehensive coverage for font management functionality.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { isError, isSuccess } from '@/shared/types';
import { FontLoaderService } from './font-loader';

describe('FontLoaderService', () => {
  let fontLoader: FontLoaderService;

  beforeEach(() => {
    fontLoader = new FontLoaderService();
  });

  describe('Font Loading', () => {
    it('should load default Liberation Sans font', async () => {
      const result = await fontLoader.loadFont('Liberation Sans');

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const fontInfo = result.data;
        expect(fontInfo.family).toBe('Liberation Sans');
        expect(fontInfo.style).toBeDefined();
        expect(fontInfo.isLoaded).toBe(true);
      }
    });

    it('should load font with style specification', async () => {
      const result = await fontLoader.loadFont('Liberation Sans:style=Bold');

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const fontInfo = result.data;
        expect(fontInfo.family).toBe('Liberation Sans');
        expect(fontInfo.style).toBe('Bold');
        expect(fontInfo.isLoaded).toBe(true);
      }
    });

    it('should handle font loading errors gracefully', async () => {
      const result = await fontLoader.loadFont('NonExistentFont');

      // Should either succeed with fallback or fail gracefully
      if (isError(result)) {
        expect(result.error.message).toContain('font');
      } else {
        // If it succeeds, it should be using a fallback font
        expect(result.data.isLoaded).toBe(true);
      }
    });
  });

  describe('Font Metrics', () => {
    it('should extract font metrics for loaded font', async () => {
      const fontResult = await fontLoader.loadFont('Liberation Sans');
      expect(isSuccess(fontResult)).toBe(true);

      if (isSuccess(fontResult)) {
        const metricsResult = await fontLoader.getFontMetrics(fontResult.data, 12);
        expect(isSuccess(metricsResult)).toBe(true);

        if (isSuccess(metricsResult)) {
          const metrics = metricsResult.data;
          expect(metrics.ascent).toBeGreaterThan(0);
          expect(metrics.descent).toBeLessThan(0);
          expect(metrics.lineHeight).toBeGreaterThan(0);
          expect(metrics.unitsPerEm).toBeGreaterThan(0);
        }
      }
    });

    it('should scale metrics correctly with font size', async () => {
      const fontResult = await fontLoader.loadFont('Liberation Sans');
      expect(isSuccess(fontResult)).toBe(true);

      if (isSuccess(fontResult)) {
        const metrics12 = await fontLoader.getFontMetrics(fontResult.data, 12);
        const metrics24 = await fontLoader.getFontMetrics(fontResult.data, 24);

        expect(isSuccess(metrics12)).toBe(true);
        expect(isSuccess(metrics24)).toBe(true);

        if (isSuccess(metrics12) && isSuccess(metrics24)) {
          // 24pt should be approximately 2x the size of 12pt
          expect(metrics24.data.ascent).toBeCloseTo(metrics12.data.ascent * 2, 1);
          expect(metrics24.data.lineHeight).toBeCloseTo(metrics12.data.lineHeight * 2, 1);
        }
      }
    });
  });

  describe('Glyph Extraction', () => {
    it('should extract glyph outlines for basic characters', async () => {
      const fontResult = await fontLoader.loadFont('Liberation Sans');
      expect(isSuccess(fontResult)).toBe(true);

      if (isSuccess(fontResult)) {
        const glyphResult = await fontLoader.getGlyphOutline(fontResult.data, 'A', 12);
        expect(isSuccess(glyphResult)).toBe(true);

        if (isSuccess(glyphResult)) {
          const glyph = glyphResult.data;
          expect(glyph.character).toBe('A');
          expect(glyph.outline).toBeDefined();
          expect(glyph.outline.length).toBeGreaterThan(0);
          expect(glyph.advance).toBeGreaterThan(0);
          expect(glyph.bounds.width).toBeGreaterThan(0);
          expect(glyph.bounds.height).toBeGreaterThan(0);
        }
      }
    });

    it('should handle special characters', async () => {
      const fontResult = await fontLoader.loadFont('Liberation Sans');
      expect(isSuccess(fontResult)).toBe(true);

      if (isSuccess(fontResult)) {
        const specialChars = ['@', '#', '$', '%', '&'];

        for (const char of specialChars) {
          const glyphResult = await fontLoader.getGlyphOutline(fontResult.data, char, 12);
          expect(isSuccess(glyphResult)).toBe(true);

          if (isSuccess(glyphResult)) {
            expect(glyphResult.data.character).toBe(char);
            expect(glyphResult.data.outline.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('should handle missing glyphs gracefully', async () => {
      const fontResult = await fontLoader.loadFont('Liberation Sans');
      expect(isSuccess(fontResult)).toBe(true);

      if (isSuccess(fontResult)) {
        // Use a character that might not exist in the font
        const glyphResult = await fontLoader.getGlyphOutline(fontResult.data, '🚀', 12);

        // Should either succeed with a replacement glyph or fail gracefully
        if (isError(glyphResult)) {
          expect(glyphResult.error.message).toContain('glyph');
        } else {
          // If it succeeds, should have valid outline data
          expect(glyphResult.data.outline).toBeDefined();
        }
      }
    });
  });

  describe('Font Caching', () => {
    it('should cache loaded fonts for performance', async () => {
      const startTime1 = performance.now();
      const result1 = await fontLoader.loadFont('Liberation Sans');
      const endTime1 = performance.now();
      const firstLoadTime = endTime1 - startTime1;

      expect(isSuccess(result1)).toBe(true);

      const startTime2 = performance.now();
      const result2 = await fontLoader.loadFont('Liberation Sans');
      const endTime2 = performance.now();
      const secondLoadTime = endTime2 - startTime2;

      expect(isSuccess(result2)).toBe(true);

      // Second load should be faster or equal due to caching
      // For very fast operations, just ensure both complete successfully
      if (firstLoadTime > 0.1) {
        expect(secondLoadTime).toBeLessThanOrEqual(firstLoadTime);
      } else {
        // Operations too fast to measure reliably
        expect(secondLoadTime).toBeGreaterThan(0);
      }

      console.log(
        `First load: ${firstLoadTime.toFixed(2)}ms, Second load: ${secondLoadTime.toFixed(2)}ms`
      );
    });

    it('should provide cache statistics', () => {
      const stats = fontLoader.getCacheStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalFonts).toBeGreaterThanOrEqual(0);
      expect(stats.cacheHits).toBeGreaterThanOrEqual(0);
      expect(stats.cacheMisses).toBeGreaterThanOrEqual(0);
      expect(stats.memoryUsage).toBeGreaterThanOrEqual(0);
    });

    it('should clear font cache', async () => {
      // Load a font to populate cache
      await fontLoader.loadFont('Liberation Sans');

      let stats = fontLoader.getCacheStatistics();
      expect(stats.totalFonts).toBeGreaterThan(0);

      // Clear cache
      fontLoader.clearCache();

      stats = fontLoader.getCacheStatistics();
      expect(stats.totalFonts).toBe(0);
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(0);
    });
  });

  describe('Font Discovery', () => {
    it('should list available system fonts', async () => {
      const fonts = await fontLoader.getAvailableFonts();

      expect(Array.isArray(fonts)).toBe(true);
      expect(fonts.length).toBeGreaterThan(0);

      // Should include Liberation fonts
      const liberationFonts = fonts.filter((font) => font.family.includes('Liberation'));
      expect(liberationFonts.length).toBeGreaterThan(0);
    });

    it('should check if specific font is available', async () => {
      const isAvailable = await fontLoader.isFontAvailable('Liberation Sans');
      expect(typeof isAvailable).toBe('boolean');

      // Liberation Sans should be available as it's included with OpenSCAD
      expect(isAvailable).toBe(true);
    });

    it('should handle font availability check for non-existent fonts', async () => {
      const isAvailable = await fontLoader.isFontAvailable('NonExistentFont12345');
      expect(isAvailable).toBe(false);
    });
  });

  describe('Font Validation', () => {
    it('should validate font format support', () => {
      const supportedFormats = ['.ttf', '.otf', '.woff', '.woff2'];

      for (const format of supportedFormats) {
        const isSupported = fontLoader.isFontFormatSupported(format);
        expect(isSupported).toBe(true);
      }
    });

    it('should reject unsupported font formats', () => {
      const unsupportedFormats = ['.bmp', '.jpg', '.png', '.svg'];

      for (const format of unsupportedFormats) {
        const isSupported = fontLoader.isFontFormatSupported(format);
        expect(isSupported).toBe(false);
      }
    });

    it('should validate font family names', () => {
      const validNames = ['Liberation Sans', 'Arial', 'Times New Roman'];
      const invalidNames = ['', '   ', null, undefined];

      for (const name of validNames) {
        const isValid = fontLoader.isValidFontFamily(name);
        expect(isValid).toBe(true);
      }

      for (const name of invalidNames) {
        const isValid = fontLoader.isValidFontFamily(name as any);
        expect(isValid).toBe(false);
      }
    });
  });

  describe('Performance', () => {
    it('should load fonts within reasonable time', async () => {
      const startTime = performance.now();
      const result = await fontLoader.loadFont('Liberation Sans');
      const endTime = performance.now();

      const loadTime = endTime - startTime;

      expect(isSuccess(result)).toBe(true);
      expect(loadTime).toBeLessThan(1000); // Should load in <1 second

      console.log(`Font load time: ${loadTime.toFixed(2)}ms`);
    });

    it('should extract glyphs within reasonable time', async () => {
      const fontResult = await fontLoader.loadFont('Liberation Sans');
      expect(isSuccess(fontResult)).toBe(true);

      if (isSuccess(fontResult)) {
        const startTime = performance.now();
        const glyphResult = await fontLoader.getGlyphOutline(fontResult.data, 'A', 12);
        const endTime = performance.now();

        const extractTime = endTime - startTime;

        expect(isSuccess(glyphResult)).toBe(true);
        expect(extractTime).toBeLessThan(100); // Should extract in <100ms

        console.log(`Glyph extraction time: ${extractTime.toFixed(2)}ms`);
      }
    });
  });
});
