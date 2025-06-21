/**
 * @file Tests for Enhanced Bracket Matching
 * 
 * Tests the OpenSCAD bracket matching functionality including:
 * - Bracket pair detection
 * - Auto-closing configuration
 * - Language configuration
 * - Service management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  OpenSCADBracketMatchingService,
  createOpenSCADLanguageConfiguration,
  createBracketMatchingService,
  getBracketPair,
  isOpeningBracket,
  isClosingBracket,
  getMatchingBracket,
  OPENSCAD_BRACKET_PAIRS,
  OPENSCAD_AUTO_CLOSING_PAIRS,
  OPENSCAD_SURROUNDING_PAIRS,
  DEFAULT_BRACKET_CONFIG
} from './bracket-matching';

// Mock Monaco editor
const mockMonaco = {
  languages: {
    setLanguageConfiguration: vi.fn(),
    IndentAction: {
      None: 0,
      Indent: 1,
      IndentOutdent: 2,
      Outdent: 3
    }
  }
} as any;

describe('OpenSCAD Bracket Matching', () => {
  describe('Bracket Pair Detection', () => {
    it('should detect standard bracket pairs', () => {
      expect(getBracketPair('{')).toEqual({ open: '{', close: '}' });
      expect(getBracketPair('}')).toEqual({ open: '{', close: '}' });
      expect(getBracketPair('[')).toEqual({ open: '[', close: ']' });
      expect(getBracketPair(']')).toEqual({ open: '[', close: ']' });
      expect(getBracketPair('(')).toEqual({ open: '(', close: ')' });
      expect(getBracketPair(')')).toEqual({ open: '(', close: ')' });
    });

    it('should detect string delimiter pairs', () => {
      expect(getBracketPair('"')).toEqual({ 
        open: '"', 
        close: '"', 
        notIn: ['string', 'comment'] 
      });
      expect(getBracketPair("'")).toEqual({ 
        open: "'", 
        close: "'", 
        notIn: ['string', 'comment'] 
      });
    });

    it('should detect comment delimiter pairs', () => {
      expect(getBracketPair('/*')).toEqual({ 
        open: '/*', 
        close: '*/', 
        notIn: ['string'] 
      });
    });

    it('should detect OpenSCAD-specific pairs', () => {
      expect(getBracketPair('<')).toEqual({ 
        open: '<', 
        close: '>', 
        notIn: ['string', 'comment'] 
      });
      expect(getBracketPair('>')).toEqual({ 
        open: '<', 
        close: '>', 
        notIn: ['string', 'comment'] 
      });
    });

    it('should return undefined for non-bracket characters', () => {
      expect(getBracketPair('a')).toBeUndefined();
      expect(getBracketPair('1')).toBeUndefined();
      expect(getBracketPair('+')).toBeUndefined();
    });
  });

  describe('Bracket Type Detection', () => {
    it('should identify opening brackets', () => {
      expect(isOpeningBracket('{')).toBe(true);
      expect(isOpeningBracket('[')).toBe(true);
      expect(isOpeningBracket('(')).toBe(true);
      expect(isOpeningBracket('<')).toBe(true);
      expect(isOpeningBracket('"')).toBe(true);
      expect(isOpeningBracket('/*')).toBe(true);
    });

    it('should identify closing brackets', () => {
      expect(isClosingBracket('}')).toBe(true);
      expect(isClosingBracket(']')).toBe(true);
      expect(isClosingBracket(')')).toBe(true);
      expect(isClosingBracket('>')).toBe(true);
      expect(isClosingBracket('"')).toBe(true);
      expect(isClosingBracket('*/')).toBe(true);
    });

    it('should handle symmetric brackets correctly', () => {
      // For symmetric brackets like quotes, they are both opening and closing
      expect(isOpeningBracket('"')).toBe(true);
      expect(isClosingBracket('"')).toBe(true);
      expect(isOpeningBracket("'")).toBe(true);
      expect(isClosingBracket("'")).toBe(true);
    });

    it('should return false for non-bracket characters', () => {
      expect(isOpeningBracket('a')).toBe(false);
      expect(isClosingBracket('1')).toBe(false);
      expect(isOpeningBracket('+')).toBe(false);
    });
  });

  describe('Matching Bracket Detection', () => {
    it('should find matching brackets for standard pairs', () => {
      expect(getMatchingBracket('{')).toBe('}');
      expect(getMatchingBracket('}')).toBe('{');
      expect(getMatchingBracket('[')).toBe(']');
      expect(getMatchingBracket(']')).toBe('[');
      expect(getMatchingBracket('(')).toBe(')');
      expect(getMatchingBracket(')')).toBe('(');
    });

    it('should find matching brackets for symmetric pairs', () => {
      expect(getMatchingBracket('"')).toBe('"');
      expect(getMatchingBracket("'")).toBe("'");
    });

    it('should find matching brackets for multi-character pairs', () => {
      expect(getMatchingBracket('/*')).toBe('*/');
      expect(getMatchingBracket('*/')).toBe('/*');
    });

    it('should return undefined for non-bracket characters', () => {
      expect(getMatchingBracket('a')).toBeUndefined();
      expect(getMatchingBracket('1')).toBeUndefined();
      expect(getMatchingBracket('+')).toBeUndefined();
    });
  });

  describe('Language Configuration', () => {
    it('should create complete language configuration', () => {
      const config = createOpenSCADLanguageConfiguration();

      expect(config.comments).toEqual({
        lineComment: '//',
        blockComment: ['/*', '*/']
      });

      expect(config.brackets).toContainEqual(['{', '}']);
      expect(config.brackets).toContainEqual(['[', ']']);
      expect(config.brackets).toContainEqual(['(', ')']);

      expect(config.autoClosingPairs).toBeDefined();
      expect(config.surroundingPairs).toBeDefined();
      expect(config.colorizedBracketPairs).toBeDefined();
    });

    it('should include indentation rules', () => {
      const config = createOpenSCADLanguageConfiguration();

      expect(config.indentationRules).toBeDefined();
      expect(config.indentationRules?.increaseIndentPattern).toBeDefined();
      expect(config.indentationRules?.decreaseIndentPattern).toBeDefined();
    });

    it('should include on-enter rules', () => {
      const config = createOpenSCADLanguageConfiguration();

      expect(config.onEnterRules).toBeDefined();
      expect(config.onEnterRules?.length).toBeGreaterThan(0);
    });

    it('should include word pattern for OpenSCAD', () => {
      const config = createOpenSCADLanguageConfiguration();

      expect(config.wordPattern).toBeDefined();
      expect(config.wordPattern).toBeInstanceOf(RegExp);
    });
  });

  describe('Bracket Matching Service', () => {
    let service: OpenSCADBracketMatchingService;

    beforeEach(() => {
      service = new OpenSCADBracketMatchingService();
    });

    afterEach(() => {
      service.dispose();
    });

    it('should create service with default configuration', () => {
      const config = service.getConfig();
      expect(config).toEqual(DEFAULT_BRACKET_CONFIG);
    });

    it('should create service with custom configuration', () => {
      const customService = new OpenSCADBracketMatchingService({
        enableAutoClosing: false,
        enableBracketColorization: false
      });

      const config = customService.getConfig();
      expect(config.enableAutoClosing).toBe(false);
      expect(config.enableBracketColorization).toBe(false);
      expect(config.enableBracketMatching).toBe(true); // Should keep default

      customService.dispose();
    });

    it('should update configuration', () => {
      service.updateConfig({ enableAutoClosing: false });
      
      const config = service.getConfig();
      expect(config.enableAutoClosing).toBe(false);
    });

    it('should register with Monaco editor', () => {
      const mockSetLanguageConfiguration = vi.fn();
      const mockMonacoInstance = {
        languages: {
          setLanguageConfiguration: mockSetLanguageConfiguration
        }
      } as any;

      service.registerWithMonaco(mockMonacoInstance, 'openscad');

      expect(mockSetLanguageConfiguration).toHaveBeenCalledWith(
        'openscad',
        expect.objectContaining({
          comments: expect.any(Object),
          brackets: expect.any(Array),
          autoClosingPairs: expect.any(Array)
        })
      );
    });

    it('should handle configuration-based language setup', () => {
      // Test with auto-closing disabled
      const serviceWithoutAutoClose = new OpenSCADBracketMatchingService({
        enableAutoClosing: false
      });

      const mockSetLanguageConfiguration = vi.fn();
      const mockMonacoInstance = {
        languages: {
          setLanguageConfiguration: mockSetLanguageConfiguration
        }
      } as any;

      serviceWithoutAutoClose.registerWithMonaco(mockMonacoInstance);

      expect(mockSetLanguageConfiguration).toHaveBeenCalled();
      
      serviceWithoutAutoClose.dispose();
    });
  });

  describe('Factory Function', () => {
    it('should create service with default configuration', () => {
      const service = createBracketMatchingService();
      
      expect(service).toBeInstanceOf(OpenSCADBracketMatchingService);
      expect(service.getConfig()).toEqual(DEFAULT_BRACKET_CONFIG);
      
      service.dispose();
    });

    it('should create service with custom configuration', () => {
      const customConfig = { enableBracketColorization: false };
      const service = createBracketMatchingService(customConfig);
      
      expect(service).toBeInstanceOf(OpenSCADBracketMatchingService);
      expect(service.getConfig().enableBracketColorization).toBe(false);
      
      service.dispose();
    });
  });

  describe('Bracket Pair Arrays', () => {
    it('should have consistent bracket pairs', () => {
      expect(OPENSCAD_BRACKET_PAIRS).toBeDefined();
      expect(OPENSCAD_BRACKET_PAIRS.length).toBeGreaterThan(0);
      
      // Each pair should have open and close properties
      OPENSCAD_BRACKET_PAIRS.forEach(pair => {
        expect(pair.open).toBeDefined();
        expect(pair.close).toBeDefined();
        expect(typeof pair.open).toBe('string');
        expect(typeof pair.close).toBe('string');
      });
    });

    it('should have consistent auto-closing pairs', () => {
      expect(OPENSCAD_AUTO_CLOSING_PAIRS).toBeDefined();
      expect(OPENSCAD_AUTO_CLOSING_PAIRS.length).toBeGreaterThan(0);
      
      // Each pair should have open and close properties
      OPENSCAD_AUTO_CLOSING_PAIRS.forEach(pair => {
        expect(pair.open).toBeDefined();
        expect(pair.close).toBeDefined();
      });
    });

    it('should have consistent surrounding pairs', () => {
      expect(OPENSCAD_SURROUNDING_PAIRS).toBeDefined();
      expect(OPENSCAD_SURROUNDING_PAIRS.length).toBeGreaterThan(0);
      
      // Each pair should have open and close properties
      OPENSCAD_SURROUNDING_PAIRS.forEach(pair => {
        expect(pair.open).toBeDefined();
        expect(pair.close).toBeDefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      expect(getBracketPair('')).toBeUndefined();
      expect(isOpeningBracket('')).toBe(false);
      expect(isClosingBracket('')).toBe(false);
      expect(getMatchingBracket('')).toBeUndefined();
    });

    it('should handle special characters', () => {
      expect(getBracketPair('\n')).toBeUndefined();
      expect(getBracketPair('\t')).toBeUndefined();
      expect(getBracketPair(' ')).toBeUndefined();
    });

    it('should handle service disposal', () => {
      const service = new OpenSCADBracketMatchingService();
      
      // Should not throw
      expect(() => service.dispose()).not.toThrow();
      
      // Should be safe to call multiple times
      expect(() => service.dispose()).not.toThrow();
    });
  });
});
