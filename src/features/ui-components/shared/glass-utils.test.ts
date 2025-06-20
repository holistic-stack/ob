/**
 * Test suite for glass morphism utility functions
 * 
 * Tests cover pure function behavior, browser compatibility detection,
 * accessibility features, and edge cases for glass effect generation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateGlassClasses,
  getOpacityLevel,
  generateSizeClasses,
  generateVariantClasses,
  supportsBackdropFilter,
  supportsSVGFilters,
  getFallbackStyles,
  prefersReducedMotion,
  prefersHighContrast,
  generateAccessibleStyles,
  validateGlassConfig,
  DEFAULT_GLASS_CONFIG,
  GLASS_THEMES,
  BLUR_INTENSITY_MAP,
  ELEVATION_MAP,
} from './glass-utils';
import type { GlassConfig, ComponentSize, ComponentVariant } from './types';

// ============================================================================
// Test Setup and Mocks
// ============================================================================

// Mock CSS.supports for browser compatibility tests
const mockCSSSupports = vi.fn();
Object.defineProperty(window, 'CSS', {
  value: { supports: mockCSSSupports },
  writable: true,
});

// Mock matchMedia for accessibility tests
const mockMatchMedia = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  value: mockMatchMedia,
  writable: true,
});

// Mock document for SVG filter tests
const mockCreateElementNS = vi.fn();
Object.defineProperty(document, 'createElementNS', {
  value: mockCreateElementNS,
  writable: true,
});

describe('Glass Utils - Constants and Configurations', () => {
  it('should have valid default glass configuration', () => {
    expect(DEFAULT_GLASS_CONFIG).toEqual({
      blurIntensity: 'lg',
      opacity: 0.2,
      elevation: 'medium',
      enableDistortion: false,
      enableSpecularHighlights: true,
    });
  });

  it('should have light and dark glass themes', () => {
    expect(GLASS_THEMES.light).toBeDefined();
    expect(GLASS_THEMES.dark).toBeDefined();
    expect(GLASS_THEMES.light.background).toContain('rgba(255, 255, 255');
    expect(GLASS_THEMES.dark.background).toContain('rgba(0, 0, 0');
  });

  it('should have blur intensity mappings', () => {
    expect(BLUR_INTENSITY_MAP.xs).toBe('2px');
    expect(BLUR_INTENSITY_MAP.sm).toBe('4px');
    expect(BLUR_INTENSITY_MAP.md).toBe('12px');
    expect(BLUR_INTENSITY_MAP.lg).toBe('20px');
    expect(BLUR_INTENSITY_MAP.xl).toBe('40px');
  });

  it('should have elevation mappings', () => {
    expect(ELEVATION_MAP.low).toContain('0 2px 4px');
    expect(ELEVATION_MAP.medium).toContain('0 6px 6px');
    expect(ELEVATION_MAP.high).toContain('0 12px 24px');
    expect(ELEVATION_MAP.floating).toContain('0 20px 40px');
  });
});

describe('Glass Utils - Pure Functions', () => {
  describe('generateGlassClasses', () => {
    it('should generate default glass classes for light background', () => {
      const classes = generateGlassClasses();
      
      expect(classes).toContain('glass-effect');
      expect(classes).toContain('glass-blur-lg');
      expect(classes).toContain('glass-bg-medium');
      expect(classes).toContain('glass-border');
    });

    it('should generate glass classes for dark background', () => {
      const classes = generateGlassClasses({}, false);
      
      expect(classes).toContain('glass-effect-dark');
      expect(classes).toContain('glass-bg-dark-medium');
      expect(classes).toContain('glass-border-dark');
    });

    it('should apply custom configuration', () => {
      const config: Partial<GlassConfig> = {
        blurIntensity: 'xl',
        opacity: 0.1,
        enableDistortion: true,
      };
      
      const classes = generateGlassClasses(config);
      
      expect(classes).toContain('glass-blur-xl');
      expect(classes).toContain('glass-bg-light');
      expect(classes).toContain('glass-distortion');
    });

    it('should handle specular highlights configuration', () => {
      const configWithSpecular = generateGlassClasses({ enableSpecularHighlights: true });
      const configWithoutSpecular = generateGlassClasses({ enableSpecularHighlights: false });
      
      expect(configWithSpecular).toContain('glass-specular');
      expect(configWithoutSpecular).not.toContain('glass-specular');
    });
  });

  describe('getOpacityLevel', () => {
    it('should return correct opacity levels', () => {
      expect(getOpacityLevel(0.1)).toBe('light');
      expect(getOpacityLevel(0.15)).toBe('light');
      expect(getOpacityLevel(0.2)).toBe('medium');
      expect(getOpacityLevel(0.25)).toBe('medium');
      expect(getOpacityLevel(0.3)).toBe('heavy');
      expect(getOpacityLevel(0.5)).toBe('heavy');
    });

    it('should handle edge cases', () => {
      expect(getOpacityLevel(0)).toBe('light');
      expect(getOpacityLevel(1)).toBe('heavy');
    });
  });

  describe('generateSizeClasses', () => {
    const sizes: ComponentSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    const components = ['button', 'card', 'input', 'slider'];

    sizes.forEach(size => {
      components.forEach(component => {
        it(`should generate ${size} classes for ${component}`, () => {
          const classes = generateSizeClasses(size, component);
          expect(classes).toBeTruthy();
          expect(typeof classes).toBe('string');
        });
      });
    });

    it('should fallback to medium size for unknown component types', () => {
      const classes = generateSizeClasses('md', 'unknown-component');
      const buttonClasses = generateSizeClasses('md', 'button');
      expect(classes).toBe(buttonClasses);
    });
  });

  describe('generateVariantClasses', () => {
    const variants: ComponentVariant[] = ['primary', 'secondary', 'ghost', 'danger'];

    variants.forEach(variant => {
      it(`should generate light theme classes for ${variant} variant`, () => {
        const classes = generateVariantClasses(variant, true);
        expect(classes).toBeTruthy();
        expect(typeof classes).toBe('string');
      });

      it(`should generate dark theme classes for ${variant} variant`, () => {
        const classes = generateVariantClasses(variant, false);
        expect(classes).toBeTruthy();
        expect(typeof classes).toBe('string');
      });
    });

    it('should generate different classes for light and dark themes', () => {
      const lightClasses = generateVariantClasses('primary', true);
      const darkClasses = generateVariantClasses('primary', false);
      expect(lightClasses).not.toBe(darkClasses);
    });
  });
});

describe('Glass Utils - Browser Compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('supportsBackdropFilter', () => {
    it('should return true when backdrop-filter is supported', () => {
      mockCSSSupports.mockReturnValue(true);
      expect(supportsBackdropFilter()).toBe(true);
      expect(mockCSSSupports).toHaveBeenCalledWith('backdrop-filter', 'blur(1px)');
    });

    it('should return true when -webkit-backdrop-filter is supported', () => {
      mockCSSSupports
        .mockReturnValueOnce(false) // backdrop-filter not supported
        .mockReturnValueOnce(true);  // -webkit-backdrop-filter supported
      
      expect(supportsBackdropFilter()).toBe(true);
      expect(mockCSSSupports).toHaveBeenCalledWith('-webkit-backdrop-filter', 'blur(1px)');
    });

    it('should return false when neither is supported', () => {
      mockCSSSupports.mockReturnValue(false);
      expect(supportsBackdropFilter()).toBe(false);
    });
  });

  describe('supportsSVGFilters', () => {
    it('should return true when SVG filters are supported', () => {
      const mockFilter = { href: 'test' };
      mockCreateElementNS.mockReturnValue(mockFilter);
      
      expect(supportsSVGFilters()).toBe(true);
    });

    it('should return false when SVG filters are not supported', () => {
      const mockFilter = {};
      mockCreateElementNS.mockReturnValue(mockFilter);
      
      expect(supportsSVGFilters()).toBe(false);
    });
  });

  describe('getFallbackStyles', () => {
    it('should return light fallback styles', () => {
      const styles = getFallbackStyles(true);
      expect(styles).toContain('bg-white/90');
      expect(styles).toContain('border-gray-300');
    });

    it('should return dark fallback styles', () => {
      const styles = getFallbackStyles(false);
      expect(styles).toContain('bg-gray-800/90');
      expect(styles).toContain('border-gray-600');
    });
  });
});

describe('Glass Utils - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('prefersReducedMotion', () => {
    it('should return true when user prefers reduced motion', () => {
      mockMatchMedia.mockReturnValue({ matches: true });
      expect(prefersReducedMotion()).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    it('should return false when user does not prefer reduced motion', () => {
      mockMatchMedia.mockReturnValue({ matches: false });
      expect(prefersReducedMotion()).toBe(false);
    });
  });

  describe('prefersHighContrast', () => {
    it('should return true when user prefers high contrast', () => {
      mockMatchMedia.mockReturnValue({ matches: true });
      expect(prefersHighContrast()).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-contrast: high)');
    });

    it('should return false when user does not prefer high contrast', () => {
      mockMatchMedia.mockReturnValue({ matches: false });
      expect(prefersHighContrast()).toBe(false);
    });
  });

  describe('generateAccessibleStyles', () => {
    it('should include base classes and accessibility enhancements', () => {
      mockMatchMedia.mockReturnValue({ matches: false });
      const styles = generateAccessibleStyles('base-class');
      
      expect(styles).toContain('base-class');
      expect(styles).toContain('focus:outline-none');
      expect(styles).toContain('focus:ring-2');
      expect(styles).toContain('transition-all');
    });

    it('should disable transitions when user prefers reduced motion', () => {
      mockMatchMedia.mockReturnValue({ matches: true });
      const styles = generateAccessibleStyles('base-class');
      
      expect(styles).toContain('transition-none');
    });
  });
});

describe('Glass Utils - Validation', () => {
  describe('validateGlassConfig', () => {
    it('should validate and return complete config with defaults', () => {
      const result = validateGlassConfig({});
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(DEFAULT_GLASS_CONFIG);
      }
    });

    it('should validate and merge partial config', () => {
      const partialConfig: Partial<GlassConfig> = {
        blurIntensity: 'xl',
        opacity: 0.5,
      };
      
      const result = validateGlassConfig(partialConfig);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.blurIntensity).toBe('xl');
        expect(result.data.opacity).toBe(0.5);
        expect(result.data.elevation).toBe(DEFAULT_GLASS_CONFIG.elevation);
      }
    });

    it('should clamp opacity values to valid range', () => {
      const invalidConfig: Partial<GlassConfig> = {
        opacity: 1.5, // Invalid: > 1
      };
      
      const result = validateGlassConfig(invalidConfig);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.opacity).toBe(1);
      }
    });

    it('should clamp negative opacity values', () => {
      const invalidConfig: Partial<GlassConfig> = {
        opacity: -0.5, // Invalid: < 0
      };
      
      const result = validateGlassConfig(invalidConfig);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.opacity).toBe(0);
      }
    });
  });
});
