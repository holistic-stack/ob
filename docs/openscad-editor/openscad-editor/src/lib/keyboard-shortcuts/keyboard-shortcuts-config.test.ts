/**
 * @file Tests for Cross-Platform Keyboard Shortcuts Configuration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {
  KEYBOARD_SHORTCUTS,
  getShortcutsByCategory,
  getShortcut,
  formatKeybinding,
  hasConflictWithBrowser
} from './keyboard-shortcuts-config';

describe('Keyboard Shortcuts Configuration', () => {
  describe('KEYBOARD_SHORTCUTS', () => {
    it('should define all required shortcuts', () => {
      const requiredShortcuts = [
        'GO_TO_LINE',
        'GO_TO_SYMBOL',
        'GO_TO_DEFINITION',
        'FIND_REFERENCES',
        'SEARCH_SYMBOLS',
        'SAVE_CODE',
        'TOGGLE_LINE_COMMENT',
        'TOGGLE_BLOCK_COMMENT',
        'FORMAT_DOCUMENT',
        'FORMAT_SELECTION'
      ];

      requiredShortcuts.forEach(shortcutKey => {
        expect(KEYBOARD_SHORTCUTS[shortcutKey]).toBeDefined();
        expect(KEYBOARD_SHORTCUTS[shortcutKey].id).toBeTruthy();
        expect(KEYBOARD_SHORTCUTS[shortcutKey].label).toBeTruthy();
        expect(KEYBOARD_SHORTCUTS[shortcutKey].keybinding).toBeTruthy();
        expect(KEYBOARD_SHORTCUTS[shortcutKey].description).toBeTruthy();
        expect(KEYBOARD_SHORTCUTS[shortcutKey].category).toBeTruthy();
      });
    });

    it('should use cross-platform CtrlCmd for most shortcuts', () => {
      const crossPlatformShortcuts = [
        'GO_TO_LINE',
        'GO_TO_SYMBOL',
        'SAVE_CODE',
        'TOGGLE_LINE_COMMENT',
        'TOGGLE_BLOCK_COMMENT',
        'FORMAT_SELECTION'
      ];

      crossPlatformShortcuts.forEach(shortcutKey => {
        const shortcut = KEYBOARD_SHORTCUTS[shortcutKey];
        expect(shortcut.keybinding & monaco.KeyMod.CtrlCmd).toBeTruthy();
      });
    });

    it('should avoid browser conflicts', () => {
      // SEARCH_SYMBOLS should use Alt+T instead of Ctrl+T to avoid browser conflict
      const searchSymbols = KEYBOARD_SHORTCUTS.SEARCH_SYMBOLS;
      expect(searchSymbols.keybinding & monaco.KeyMod.Alt).toBeTruthy();
      expect(searchSymbols.keybinding & monaco.KeyCode.KeyT).toBeTruthy();
      expect(searchSymbols.keybinding & monaco.KeyMod.CtrlCmd).toBeFalsy();
    });

    it('should have unique IDs', () => {
      const ids = Object.values(KEYBOARD_SHORTCUTS).map(shortcut => shortcut.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid categories', () => {
      const validCategories = ['navigation', 'editing', 'formatting', 'openscad'];
      Object.values(KEYBOARD_SHORTCUTS).forEach(shortcut => {
        expect(validCategories).toContain(shortcut.category);
      });
    });
  });

  describe('getShortcutsByCategory', () => {
    it('should return shortcuts for navigation category', () => {
      const navigationShortcuts = getShortcutsByCategory('navigation');
      expect(navigationShortcuts.length).toBeGreaterThan(0);
      navigationShortcuts.forEach(shortcut => {
        expect(shortcut.category).toBe('navigation');
      });
    });

    it('should return shortcuts for editing category', () => {
      const editingShortcuts = getShortcutsByCategory('editing');
      expect(editingShortcuts.length).toBeGreaterThan(0);
      editingShortcuts.forEach(shortcut => {
        expect(shortcut.category).toBe('editing');
      });
    });

    it('should return shortcuts for formatting category', () => {
      const formattingShortcuts = getShortcutsByCategory('formatting');
      expect(formattingShortcuts.length).toBeGreaterThan(0);
      formattingShortcuts.forEach(shortcut => {
        expect(shortcut.category).toBe('formatting');
      });
    });

    it('should return shortcuts for openscad category', () => {
      const openscadShortcuts = getShortcutsByCategory('openscad');
      expect(openscadShortcuts.length).toBeGreaterThan(0);
      openscadShortcuts.forEach(shortcut => {
        expect(shortcut.category).toBe('openscad');
      });
    });

    it('should return empty array for invalid category', () => {
      const invalidShortcuts = getShortcutsByCategory('invalid' as any);
      expect(invalidShortcuts).toEqual([]);
    });
  });

  describe('getShortcut', () => {
    it('should return shortcut by ID', () => {
      const shortcut = getShortcut('openscad.goToLine');
      expect(shortcut).toBeDefined();
      expect(shortcut?.id).toBe('openscad.goToLine');
    });

    it('should return undefined for invalid ID', () => {
      const shortcut = getShortcut('invalid.id');
      expect(shortcut).toBeUndefined();
    });
  });

  describe('formatKeybinding', () => {
    beforeEach(() => {
      // Mock navigator.platform for consistent testing
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true
      });
    });

    it('should format Ctrl+G correctly on Windows', () => {
      const keybinding = monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG;
      const formatted = formatKeybinding(keybinding);
      expect(formatted).toBe('Ctrl+G');
    });

    it('should format Cmd+G correctly on Mac', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true
      });
      
      const keybinding = monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG;
      const formatted = formatKeybinding(keybinding);
      expect(formatted).toBe('Cmd+G');
    });

    it('should format complex shortcuts correctly', () => {
      const keybinding = monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyO;
      const formatted = formatKeybinding(keybinding);
      expect(formatted).toBe('Ctrl+Shift+O');
    });

    it('should format Alt shortcuts correctly', () => {
      const keybinding = monaco.KeyMod.Alt | monaco.KeyCode.KeyT;
      const formatted = formatKeybinding(keybinding);
      expect(formatted).toBe('Alt+T');
    });

    it('should format function keys correctly', () => {
      const keybinding = monaco.KeyCode.F12;
      const formatted = formatKeybinding(keybinding);
      expect(formatted).toBe('F12');
    });

    it('should format Shift+F12 correctly', () => {
      const keybinding = monaco.KeyMod.Shift | monaco.KeyCode.F12;
      const formatted = formatKeybinding(keybinding);
      expect(formatted).toBe('Shift+F12');
    });
  });

  describe('hasConflictWithBrowser', () => {
    it('should detect Ctrl+T conflict', () => {
      const ctrlT = monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyT;
      expect(hasConflictWithBrowser(ctrlT)).toBe(true);
    });

    it('should detect Ctrl+W conflict', () => {
      const ctrlW = monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW;
      expect(hasConflictWithBrowser(ctrlW)).toBe(true);
    });

    it('should detect Ctrl+R conflict', () => {
      const ctrlR = monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR;
      expect(hasConflictWithBrowser(ctrlR)).toBe(true);
    });

    it('should detect F5 conflict', () => {
      const f5 = monaco.KeyCode.F5;
      expect(hasConflictWithBrowser(f5)).toBe(true);
    });

    it('should not detect conflict for safe shortcuts', () => {
      const ctrlG = monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG;
      const altT = monaco.KeyMod.Alt | monaco.KeyCode.KeyT;
      const f12 = monaco.KeyCode.F12;
      
      expect(hasConflictWithBrowser(ctrlG)).toBe(false);
      expect(hasConflictWithBrowser(altT)).toBe(false);
      expect(hasConflictWithBrowser(f12)).toBe(false);
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should use CtrlCmd for cross-platform shortcuts', () => {
      const goToLine = KEYBOARD_SHORTCUTS.GO_TO_LINE;
      expect(goToLine.keybinding & monaco.KeyMod.CtrlCmd).toBeTruthy();
    });

    it('should provide alternative keybindings where appropriate', () => {
      const searchSymbols = KEYBOARD_SHORTCUTS.SEARCH_SYMBOLS;
      expect(searchSymbols.alternativeKeybinding).toBeDefined();
    });

    it('should avoid browser conflicts in primary keybindings', () => {
      Object.values(KEYBOARD_SHORTCUTS).forEach(shortcut => {
        expect(hasConflictWithBrowser(shortcut.keybinding)).toBe(false);
      });
    });
  });
});
