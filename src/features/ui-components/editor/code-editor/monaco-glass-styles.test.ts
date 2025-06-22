/**
 * Monaco Glass Styles Test Suite
 * 
 * Comprehensive tests for Monaco Editor glass morphism utilities
 * Following TDD methodology with Red-Green-Refactor cycle
 */

import { describe, it, expect } from 'vitest';
import {
  generateMonacoBaseGlass,
  generateMonacoGradientEffects,
  generateMonacoInteractionEffects,
  generateMonacoContentLayer,
  generateMonacoGlassClasses,
  generateMonacoStatusGlass,
  generateMonacoSizing,
  validateMonacoGlassConfig,
  createMonacoGlassConfig,
  DEFAULT_MONACO_GLASS_CONFIG,
  type MonacoGlassConfig,
  type MonacoGlassOptions,
} from './monaco-glass-styles';

describe('Monaco Glass Styles', () => {
  describe('Base Glass Generation', () => {
    it('should generate base glass morphism classes', () => {
      const classes = generateMonacoBaseGlass();
      
      // Base glass effect requirements
      expect(classes).toContain('bg-black/20');
      expect(classes).toContain('backdrop-blur-sm');
      expect(classes).toContain('border');
      expect(classes).toContain('border-white/50');
      expect(classes).toContain('rounded-lg');
      
      // Positioning and overflow
      expect(classes).toContain('relative');
      expect(classes).toContain('overflow-hidden');
      
      // Complex shadow system
      expect(classes).toContain('shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]');
    });

    it('should accept custom configuration', () => {
      const config: Partial<MonacoGlassConfig> = {
        blurIntensity: 'medium',
        opacity: 0.3,
      };
      
      const classes = generateMonacoBaseGlass(config);
      expect(classes).toBeTruthy();
      expect(typeof classes).toBe('string');
    });
  });

  describe('Gradient Effects Generation', () => {
    it('should generate gradient pseudo-element classes', () => {
      const classes = generateMonacoGradientEffects();
      
      // Before pseudo-element
      expect(classes).toContain('before:absolute');
      expect(classes).toContain('before:inset-0');
      expect(classes).toContain('before:rounded-lg');
      expect(classes).toContain('before:bg-gradient-to-br');
      expect(classes).toContain('before:from-white/60');
      expect(classes).toContain('before:via-transparent');
      expect(classes).toContain('before:to-transparent');
      expect(classes).toContain('before:opacity-70');
      expect(classes).toContain('before:pointer-events-none');
      
      // After pseudo-element
      expect(classes).toContain('after:absolute');
      expect(classes).toContain('after:inset-0');
      expect(classes).toContain('after:rounded-lg');
      expect(classes).toContain('after:bg-gradient-to-tl');
      expect(classes).toContain('after:from-white/30');
      expect(classes).toContain('after:via-transparent');
      expect(classes).toContain('after:to-transparent');
      expect(classes).toContain('after:opacity-50');
      expect(classes).toContain('after:pointer-events-none');
    });
  });

  describe('Interaction Effects Generation', () => {
    it('should generate focus ring when enabled', () => {
      const config: Partial<MonacoGlassConfig> = {
        enableFocusRing: true,
      };
      
      const classes = generateMonacoInteractionEffects(config);
      expect(classes).toContain('focus-within:ring-2');
      expect(classes).toContain('focus-within:ring-blue-500');
      expect(classes).toContain('focus-within:ring-offset-2');
    });

    it('should generate transitions when enabled', () => {
      const config: Partial<MonacoGlassConfig> = {
        enableTransitions: true,
      };
      
      const classes = generateMonacoInteractionEffects(config);
      expect(classes).toContain('transition-all');
      expect(classes).toContain('duration-200');
      expect(classes).toContain('ease-in-out');
    });

    it('should not include focus ring when disabled', () => {
      const config: Partial<MonacoGlassConfig> = {
        enableFocusRing: false,
      };
      
      const classes = generateMonacoInteractionEffects(config);
      expect(classes).not.toContain('focus-within:ring-2');
    });
  });

  describe('Content Layer Generation', () => {
    it('should generate proper content layer classes', () => {
      const classes = generateMonacoContentLayer();
      
      expect(classes).toContain('relative');
      expect(classes).toContain('z-10');
      expect(classes).toContain('h-full');
      expect(classes).toContain('w-full');
    });
  });

  describe('Complete Glass Classes Generation', () => {
    it('should combine all glass effects', () => {
      const config: Partial<MonacoGlassConfig> = {
        enableFocusRing: true,
        enableTransitions: true,
      };
      
      const options: MonacoGlassOptions = {
        size: 'medium',
        disabled: false,
        readOnly: false,
        hasErrors: false,
        isActive: true,
      };
      
      const classes = generateMonacoGlassClasses(config, options);
      
      // Should include base glass
      expect(classes).toContain('bg-black/20');
      expect(classes).toContain('backdrop-blur-sm');
      
      // Should include focus effects
      expect(classes).toContain('focus-within:ring-2');
      
      // Should include transitions
      expect(classes).toContain('transition-all');
    });

    it('should apply state-based modifications', () => {
      const options: MonacoGlassOptions = {
        disabled: true,
        readOnly: true,
        hasErrors: true,
        isActive: true,
      };
      
      const classes = generateMonacoGlassClasses({}, options);
      
      expect(classes).toContain('opacity-50');
      expect(classes).toContain('cursor-not-allowed');
      expect(classes).toContain('bg-gray-900/20');
      expect(classes).toContain('border-red-500/50');
      expect(classes).toContain('ring-1');
      expect(classes).toContain('ring-red-500/20');
      expect(classes).toContain('ring-2');
      expect(classes).toContain('ring-blue-500/30');
    });
  });

  describe('Status Glass Generation', () => {
    it('should generate parsing status glass', () => {
      const classes = generateMonacoStatusGlass('parsing');
      
      expect(classes).toContain('backdrop-blur-sm');
      expect(classes).toContain('border');
      expect(classes).toContain('rounded-lg');
      expect(classes).toContain('p-2');
      expect(classes).toContain('bg-blue-900/80');
      expect(classes).toContain('border-blue-500/50');
    });

    it('should generate success status glass', () => {
      const classes = generateMonacoStatusGlass('success');
      
      expect(classes).toContain('bg-green-900/80');
      expect(classes).toContain('border-green-500/50');
    });

    it('should generate error status glass', () => {
      const classes = generateMonacoStatusGlass('error');
      
      expect(classes).toContain('bg-red-900/80');
      expect(classes).toContain('border-red-500/50');
    });

    it('should generate warning status glass', () => {
      const classes = generateMonacoStatusGlass('warning');
      
      expect(classes).toContain('bg-yellow-900/80');
      expect(classes).toContain('border-yellow-500/50');
    });
  });

  describe('8px Grid System Sizing', () => {
    it('should generate small size (40px)', () => {
      const classes = generateMonacoSizing('small');
      expect(classes).toContain('min-h-[40px]');
    });

    it('should generate medium size (48px) - WCAG AA compliant', () => {
      const classes = generateMonacoSizing('medium');
      expect(classes).toContain('min-h-[48px]');
    });

    it('should generate large size (56px)', () => {
      const classes = generateMonacoSizing('large');
      expect(classes).toContain('min-h-[56px]');
    });

    it('should default to medium size', () => {
      const classes = generateMonacoSizing();
      expect(classes).toContain('min-h-[48px]');
    });

    it('should follow 8px grid system', () => {
      // Small: 5 * 8px = 40px
      expect(generateMonacoSizing('small')).toContain('min-h-[40px]');
      
      // Medium: 6 * 8px = 48px
      expect(generateMonacoSizing('medium')).toContain('min-h-[48px]');
      
      // Large: 7 * 8px = 56px
      expect(generateMonacoSizing('large')).toContain('min-h-[56px]');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const config: Partial<MonacoGlassConfig> = {
        opacity: 0.5,
        editorTheme: 'dark',
      };
      
      const result = validateMonacoGlassConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid opacity', () => {
      const config: Partial<MonacoGlassConfig> = {
        opacity: 1.5, // Invalid: > 1
      };
      
      const result = validateMonacoGlassConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Opacity must be between 0 and 1');
    });

    it('should reject invalid editor theme', () => {
      const config = {
        editorTheme: 'invalid' as any,
      };
      
      const result = validateMonacoGlassConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Editor theme must be "dark" or "light"');
    });
  });

  describe('Configuration Creation', () => {
    it('should create valid configuration', () => {
      const config = createMonacoGlassConfig({
        opacity: 0.3,
        editorTheme: 'light',
      });
      
      expect(config.opacity).toBe(0.3);
      expect(config.editorTheme).toBe('light');
      expect(config.blurIntensity).toBe(DEFAULT_MONACO_GLASS_CONFIG.blurIntensity);
    });

    it('should return default config for invalid input', () => {
      const config = createMonacoGlassConfig({
        opacity: 2.0, // Invalid
      });
      
      expect(config).toEqual(DEFAULT_MONACO_GLASS_CONFIG);
    });

    it('should merge with defaults', () => {
      const config = createMonacoGlassConfig({
        enableFocusRing: false,
      });
      
      expect(config.enableFocusRing).toBe(false);
      expect(config.enableTransitions).toBe(DEFAULT_MONACO_GLASS_CONFIG.enableTransitions);
      expect(config.editorTheme).toBe(DEFAULT_MONACO_GLASS_CONFIG.editorTheme);
    });
  });

  describe('Default Configuration', () => {
    it('should have proper default values', () => {
      expect(DEFAULT_MONACO_GLASS_CONFIG.blurIntensity).toBe('sm');
      expect(DEFAULT_MONACO_GLASS_CONFIG.opacity).toBe(0.2);
      expect(DEFAULT_MONACO_GLASS_CONFIG.elevation).toBe('medium');
      expect(DEFAULT_MONACO_GLASS_CONFIG.enableDistortion).toBe(false);
      expect(DEFAULT_MONACO_GLASS_CONFIG.enableSpecularHighlights).toBe(true);
      expect(DEFAULT_MONACO_GLASS_CONFIG.editorTheme).toBe('dark');
      expect(DEFAULT_MONACO_GLASS_CONFIG.enableFocusRing).toBe(true);
      expect(DEFAULT_MONACO_GLASS_CONFIG.enableTransitions).toBe(true);
    });
  });

  describe('DRY and SRP Principles', () => {
    it('should provide reusable utilities', () => {
      // Test that utilities can be used independently
      const baseGlass = generateMonacoBaseGlass();
      const gradients = generateMonacoGradientEffects();
      const interactions = generateMonacoInteractionEffects();
      const contentLayer = generateMonacoContentLayer();
      
      expect(baseGlass).toBeTruthy();
      expect(gradients).toBeTruthy();
      expect(interactions).toBeTruthy();
      expect(contentLayer).toBeTruthy();
    });

    it('should separate concerns properly', () => {
      // Base glass should not include gradients
      const baseGlass = generateMonacoBaseGlass();
      expect(baseGlass).not.toContain('before:');
      expect(baseGlass).not.toContain('after:');
      
      // Gradients should not include base glass
      const gradients = generateMonacoGradientEffects();
      expect(gradients).not.toContain('bg-black/20');
      expect(gradients).not.toContain('backdrop-blur-sm');
    });
  });
});
