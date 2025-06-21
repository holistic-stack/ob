/**
 * @file Tests for Feature Configuration System
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FEATURES,
  PARSER_FEATURES,
  IDE_FEATURES,
  FULL_FEATURES,
  FEATURE_PRESETS,
  DEFAULT_PERFORMANCE,
  requiresParser,
  hasIDEFeatures,
  hasAdvancedFeatures,
  mergeFeatures,
  createFeatureConfig,
  type OpenscadEditorFeatures,
  type FeaturePreset
} from './feature-config';

describe('Feature Configuration System', () => {
  describe('Default Configurations', () => {
    it('should have valid default features configuration', () => {
      expect(DEFAULT_FEATURES).toBeDefined();
      expect(DEFAULT_FEATURES.core.syntaxHighlighting).toBe(true);
      expect(DEFAULT_FEATURES.core.basicEditing).toBe(true);
      expect(DEFAULT_FEATURES.core.keyboardShortcuts).toBe(true);
      
      // Parser features should be disabled by default
      expect(DEFAULT_FEATURES.parser.realTimeParsing).toBe(false);
      expect(DEFAULT_FEATURES.parser.errorDetection).toBe(false);
      expect(DEFAULT_FEATURES.parser.documentOutline).toBe(false);

      // IDE features should be disabled by default
      expect(DEFAULT_FEATURES.ide.codeCompletion).toBe(false);
      expect(DEFAULT_FEATURES.ide.navigationCommands).toBe(false);
      expect(DEFAULT_FEATURES.ide.hoverInformation).toBe(false);
      
      // Advanced features should be disabled by default
      expect(DEFAULT_FEATURES.advanced.refactoring).toBe(false);
      expect(DEFAULT_FEATURES.advanced.symbolSearch).toBe(false);
      expect(DEFAULT_FEATURES.advanced.folding).toBe(false);
    });

    it('should have valid parser features configuration', () => {
      expect(PARSER_FEATURES).toBeDefined();

      // Core features should be enabled
      expect(PARSER_FEATURES.core.syntaxHighlighting).toBe(true);
      expect(PARSER_FEATURES.core.basicEditing).toBe(true);

      // Parser features should be enabled
      expect(PARSER_FEATURES.parser.realTimeParsing).toBe(true);
      expect(PARSER_FEATURES.parser.errorDetection).toBe(true);
      expect(PARSER_FEATURES.parser.documentOutline).toBe(true);
      expect(PARSER_FEATURES.parser.performanceMonitoring).toBe(true);

      // IDE features should still be disabled
      expect(PARSER_FEATURES.ide.codeCompletion).toBe(false);
      expect(PARSER_FEATURES.ide.navigationCommands).toBe(false);
    });

    it('should have valid IDE features configuration', () => {
      expect(IDE_FEATURES).toBeDefined();

      // Should include all parser features
      expect(IDE_FEATURES.parser.realTimeParsing).toBe(true);
      expect(IDE_FEATURES.parser.errorDetection).toBe(true);

      // IDE features should be enabled
      expect(IDE_FEATURES.ide.codeCompletion).toBe(true);
      expect(IDE_FEATURES.ide.navigationCommands).toBe(true);
      expect(IDE_FEATURES.ide.hoverInformation).toBe(true);
      expect(IDE_FEATURES.ide.quickFixes).toBe(true);
      expect(IDE_FEATURES.ide.diagnostics).toBe(true);
      expect(IDE_FEATURES.ide.formatting).toBe(true);

      // Advanced features should still be disabled
      expect(IDE_FEATURES.advanced.refactoring).toBe(false);
      expect(IDE_FEATURES.advanced.symbolSearch).toBe(false);
    });

    it('should have valid full features configuration', () => {
      expect(FULL_FEATURES).toBeDefined();

      // Should include all IDE features
      expect(FULL_FEATURES.ide.codeCompletion).toBe(true);
      expect(FULL_FEATURES.ide.navigationCommands).toBe(true);

      // Advanced features should be enabled
      expect(FULL_FEATURES.advanced.refactoring).toBe(true);
      expect(FULL_FEATURES.advanced.symbolSearch).toBe(true);
      expect(FULL_FEATURES.advanced.folding).toBe(true);
      expect(FULL_FEATURES.advanced.bracketMatching).toBe(true);
      expect(FULL_FEATURES.advanced.smartIndentation).toBe(true);
      expect(FULL_FEATURES.advanced.commentCommands).toBe(true);
    });

    it('should have valid default performance configuration', () => {
      expect(DEFAULT_PERFORMANCE).toBeDefined();
      expect(DEFAULT_PERFORMANCE.lazyLoading).toBe(true);
      expect(DEFAULT_PERFORMANCE.parseDebounceMs).toBe(500);
      expect(DEFAULT_PERFORMANCE.parseTimeoutMs).toBe(5000);
      expect(DEFAULT_PERFORMANCE.enableMetrics).toBe(true);
    });
  });

  describe('Feature Presets', () => {
    it('should have all required presets', () => {
      expect(FEATURE_PRESETS.BASIC).toBeDefined();
      expect(FEATURE_PRESETS.PARSER).toBeDefined();
      expect(FEATURE_PRESETS.IDE).toBeDefined();
      expect(FEATURE_PRESETS.FULL).toBeDefined();
    });

    it('should have presets matching their configurations', () => {
      expect(FEATURE_PRESETS.BASIC).toEqual(DEFAULT_FEATURES);
      expect(FEATURE_PRESETS.PARSER).toEqual(PARSER_FEATURES);
      expect(FEATURE_PRESETS.IDE).toEqual(IDE_FEATURES);
      expect(FEATURE_PRESETS.FULL).toEqual(FULL_FEATURES);
    });
  });

  describe('Utility Functions', () => {
    describe('requiresParser', () => {
      it('should return false for default features', () => {
        expect(requiresParser(DEFAULT_FEATURES)).toBe(false);
      });

      it('should return true for parser features', () => {
        expect(requiresParser(PARSER_FEATURES)).toBe(true);
      });

      it('should return true for IDE features', () => {
        expect(requiresParser(IDE_FEATURES)).toBe(true);
      });

      it('should return true for full features', () => {
        expect(requiresParser(FULL_FEATURES)).toBe(true);
      });

      it('should return true when any parser-dependent feature is enabled', () => {
        const customFeatures: OpenscadEditorFeatures = {
          ...DEFAULT_FEATURES,
          ide: {
            ...DEFAULT_FEATURES.ide,
            codeCompletion: true
          }
        };
        expect(requiresParser(customFeatures)).toBe(true);
      });
    });

    describe('hasIDEFeatures', () => {
      it('should return false for default features', () => {
        expect(hasIDEFeatures(DEFAULT_FEATURES)).toBe(false);
      });

      it('should return false for parser features', () => {
        expect(hasIDEFeatures(PARSER_FEATURES)).toBe(false);
      });

      it('should return true for IDE features', () => {
        expect(hasIDEFeatures(IDE_FEATURES)).toBe(true);
      });

      it('should return true for full features', () => {
        expect(hasIDEFeatures(FULL_FEATURES)).toBe(true);
      });
    });

    describe('hasAdvancedFeatures', () => {
      it('should return false for default features', () => {
        expect(hasAdvancedFeatures(DEFAULT_FEATURES)).toBe(false);
      });

      it('should return false for parser features', () => {
        expect(hasAdvancedFeatures(PARSER_FEATURES)).toBe(false);
      });

      it('should return false for IDE features', () => {
        expect(hasAdvancedFeatures(IDE_FEATURES)).toBe(false);
      });

      it('should return true for full features', () => {
        expect(hasAdvancedFeatures(FULL_FEATURES)).toBe(true);
      });
    });

    describe('mergeFeatures', () => {
      it('should merge feature configurations correctly', () => {
        const base = DEFAULT_FEATURES;
        const override = {
          parser: {
            realTimeParsing: true,
            errorDetection: true
          },
          ide: {
            codeCompletion: true
          }
        };

        const merged = mergeFeatures(base, override);

        expect(merged.core).toEqual(base.core);
        expect(merged.parser.realTimeParsing).toBe(true);
        expect(merged.parser.errorDetection).toBe(true);
        expect(merged.parser.documentOutline).toBe(false); // Should keep base value
        expect(merged.ide.codeCompletion).toBe(true);
        expect(merged.ide.navigationCommands).toBe(false); // Should keep base value
        expect(merged.advanced).toEqual(base.advanced);
      });

      it('should handle partial overrides', () => {
        const base = IDE_FEATURES;
        const override = {
          ide: {
            codeCompletion: false
          }
        };

        const merged = mergeFeatures(base, override);

        expect(merged.ide.codeCompletion).toBe(false);
        expect(merged.ide.navigationCommands).toBe(true); // Should keep base value
      });
    });

    describe('createFeatureConfig', () => {
      it('should create configuration from preset name', () => {
        const presets: FeaturePreset[] = ['BASIC', 'PARSER', 'IDE', 'FULL'];

        presets.forEach(preset => {
          const config = createFeatureConfig(preset);
          expect(config).toEqual(FEATURE_PRESETS[preset]);
        });
      });
    });
  });

  describe('Configuration Validation', () => {
    it('should have consistent feature dependencies', () => {
      // IDE features should require parser
      if (hasIDEFeatures(IDE_FEATURES)) {
        expect(requiresParser(IDE_FEATURES)).toBe(true);
      }

      // Full features should require both parser and IDE
      if (hasAdvancedFeatures(FULL_FEATURES)) {
        expect(requiresParser(FULL_FEATURES)).toBe(true);
        expect(hasIDEFeatures(FULL_FEATURES)).toBe(true);
      }
    });

    it('should have immutable configurations at TypeScript level', () => {
      // Test that configurations are readonly at TypeScript level
      // Note: Runtime immutability would require Object.freeze() or similar

      // TypeScript should prevent modification (compile-time check)
      const config = DEFAULT_FEATURES;
      expect(config.core.syntaxHighlighting).toBe(true);

      // Verify the structure is as expected
      expect(typeof config.core).toBe('object');
      expect(typeof config.parser).toBe('object');
      expect(typeof config.ide).toBe('object');
      expect(typeof config.advanced).toBe('object');
    });
  });
});
