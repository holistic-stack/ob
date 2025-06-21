/**
 * @file Tests for OpenSCAD Language Configuration
 * @description Tests for Monaco Editor language registration and syntax highlighting
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {
  registerOpenSCADLanguage,
  openscadLanguageConfig,
  openscadTokensDefinition,
  openscadTheme
} from './openscad-language';
import type { OpenSCADParserService } from './services/openscad-parser-service';

// Mock parser service
const createMockParserService = (): OpenSCADParserService => ({
  isReady: () => true,
  parseDocument: vi.fn(),
  getDocumentOutline: vi.fn(),
  getSymbols: vi.fn(),
  getAST: vi.fn(),
  dispose: vi.fn()
} as any);

describe('OpenSCAD Language Configuration', () => {
  let disposables: monaco.IDisposable[] = [];

  afterEach(() => {
    // Clean up disposables
    disposables.forEach(d => d.dispose());
    disposables = [];
  });

  describe('Language Configuration', () => {
    it('should have correct comment configuration', () => {
      expect(openscadLanguageConfig.comments?.lineComment).toBe('//');
      expect(openscadLanguageConfig.comments?.blockComment).toEqual(['/*', '*/']);
    });

    it('should have correct bracket pairs', () => {
      expect(openscadLanguageConfig.brackets).toEqual([
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ]);
    });

    it('should have correct auto-closing pairs', () => {
      expect(openscadLanguageConfig.autoClosingPairs).toContainEqual({ open: '{', close: '}' });
      expect(openscadLanguageConfig.autoClosingPairs).toContainEqual({ open: '[', close: ']' });
      expect(openscadLanguageConfig.autoClosingPairs).toContainEqual({ open: '(', close: ')' });
      expect(openscadLanguageConfig.autoClosingPairs).toContainEqual({ open: '"', close: '"' });
    });
  });

  describe('Tokens Definition', () => {
    it('should have correct keywords', () => {
      expect(openscadTokensDefinition.keywords).toContain('module');
      expect(openscadTokensDefinition.keywords).toContain('function');
      expect(openscadTokensDefinition.keywords).toContain('if');
      expect(openscadTokensDefinition.keywords).toContain('else');
      expect(openscadTokensDefinition.keywords).toContain('for');
      expect(openscadTokensDefinition.keywords).toContain('while');
    });

    it('should have correct builtin functions', () => {
      expect(openscadTokensDefinition.builtinFunctions).toContain('abs');
      expect(openscadTokensDefinition.builtinFunctions).toContain('cos');
      expect(openscadTokensDefinition.builtinFunctions).toContain('sin');
      expect(openscadTokensDefinition.builtinFunctions).toContain('sqrt');
      expect(openscadTokensDefinition.builtinFunctions).toContain('len');
    });

    it('should have correct builtin modules', () => {
      expect(openscadTokensDefinition.builtinModules).toContain('cube');
      expect(openscadTokensDefinition.builtinModules).toContain('sphere');
      expect(openscadTokensDefinition.builtinModules).toContain('cylinder');
      expect(openscadTokensDefinition.builtinModules).toContain('translate');
      expect(openscadTokensDefinition.builtinModules).toContain('rotate');
    });

    it('should have correct builtin constants', () => {
      expect(openscadTokensDefinition.builtinConstants).toContain('$fa');
      expect(openscadTokensDefinition.builtinConstants).toContain('$fs');
      expect(openscadTokensDefinition.builtinConstants).toContain('$fn');
      expect(openscadTokensDefinition.builtinConstants).toContain('$children');
    });

    it('should have tokenizer rules', () => {
      expect(openscadTokensDefinition.tokenizer).toBeDefined();
      expect(openscadTokensDefinition.tokenizer.root).toBeDefined();
      expect(openscadTokensDefinition.tokenizer.comment).toBeDefined();
      expect(openscadTokensDefinition.tokenizer.string).toBeDefined();
      expect(openscadTokensDefinition.tokenizer.whitespace).toBeDefined();
    });
  });

  describe('Theme Definition', () => {
    it('should have correct base theme', () => {
      expect(openscadTheme.base).toBe('vs-dark');
      expect(openscadTheme.inherit).toBe(true);
    });

    it('should have syntax highlighting rules', () => {
      expect(openscadTheme.rules).toBeDefined();
      expect(openscadTheme.rules.length).toBeGreaterThan(0);
      
      // Check for key token types
      const tokenTypes = openscadTheme.rules.map(rule => rule.token);
      expect(tokenTypes).toContain('keyword');
      expect(tokenTypes).toContain('predefined');
      expect(tokenTypes).toContain('type');
      expect(tokenTypes).toContain('constant');
      expect(tokenTypes).toContain('string');
      expect(tokenTypes).toContain('comment');
      expect(tokenTypes).toContain('number');
    });

    it('should have editor colors', () => {
      expect(openscadTheme.colors).toBeDefined();
      expect(openscadTheme.colors['editor.background']).toBe('#1e1e1e');
      expect(openscadTheme.colors['editor.foreground']).toBe('#d4d4d4');
    });
  });

  describe('Language Registration', () => {
    it('should register language without parser service', () => {
      const result = registerOpenSCADLanguage(monaco);
      
      expect(result).toBeDefined();
      expect(result.disposables).toBeDefined();
      expect(Array.isArray(result.disposables)).toBe(true);
      expect(result.formattingService).toBeUndefined();
      
      disposables.push(...result.disposables);
    });

    it('should register language with parser service', () => {
      const mockParserService = createMockParserService();
      const result = registerOpenSCADLanguage(monaco, mockParserService);
      
      expect(result).toBeDefined();
      expect(result.disposables).toBeDefined();
      expect(Array.isArray(result.disposables)).toBe(true);
      expect(result.formattingService).toBeDefined();
      
      disposables.push(...result.disposables);
    });

    it('should register language with correct ID', () => {
      const registerSpy = vi.spyOn(monaco.languages, 'register');
      
      const result = registerOpenSCADLanguage(monaco);
      
      expect(registerSpy).toHaveBeenCalledWith({ id: 'openscad' });
      
      disposables.push(...result.disposables);
      registerSpy.mockRestore();
    });

    it('should set language configuration', () => {
      const setConfigSpy = vi.spyOn(monaco.languages, 'setLanguageConfiguration');
      
      const result = registerOpenSCADLanguage(monaco);
      
      expect(setConfigSpy).toHaveBeenCalledWith('openscad', openscadLanguageConfig);
      
      disposables.push(...result.disposables);
      setConfigSpy.mockRestore();
    });

    it('should set monarch tokens provider', () => {
      const setTokensSpy = vi.spyOn(monaco.languages, 'setMonarchTokensProvider');
      
      const result = registerOpenSCADLanguage(monaco);
      
      expect(setTokensSpy).toHaveBeenCalledWith('openscad', openscadTokensDefinition);
      
      disposables.push(...result.disposables);
      setTokensSpy.mockRestore();
    });

    it('should define theme', () => {
      const defineThemeSpy = vi.spyOn(monaco.editor, 'defineTheme');
      
      const result = registerOpenSCADLanguage(monaco);
      
      expect(defineThemeSpy).toHaveBeenCalledWith('openscad-dark', openscadTheme);
      
      disposables.push(...result.disposables);
      defineThemeSpy.mockRestore();
    });
  });
});
