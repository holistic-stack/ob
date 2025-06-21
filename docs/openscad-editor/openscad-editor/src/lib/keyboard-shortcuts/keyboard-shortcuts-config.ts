/**
 * @file Cross-Platform Keyboard Shortcuts Configuration
 * 
 * Provides centralized, cross-platform keyboard shortcut definitions
 * that avoid browser conflicts and work consistently across Windows, Mac, and Linux.
 * 
 * Design Principles:
 * - Use Monaco's KeyMod.CtrlCmd for cross-platform Ctrl/Cmd compatibility
 * - Avoid browser shortcuts (Ctrl+T, Ctrl+W, Ctrl+R, F5, etc.)
 * - Use Alt/Option for OpenSCAD-specific features
 * - Maintain consistency with common editor conventions
 */

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

/**
 * Cross-platform keyboard shortcut definitions
 */
export interface KeyboardShortcut {
  /** Unique identifier for the shortcut */
  id: string;
  /** Human-readable label */
  label: string;
  /** Monaco keybinding definition */
  keybinding: number;
  /** Alternative keybinding (optional) */
  alternativeKeybinding?: number;
  /** Description for help/documentation */
  description: string;
  /** Category for organization */
  category: 'navigation' | 'editing' | 'formatting' | 'openscad';
}

/**
 * Cross-platform keyboard shortcuts configuration
 *
 * Uses Monaco's KeyMod.CtrlCmd for automatic Ctrl/Cmd detection
 * Avoids browser conflicts by using Alt for custom shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  // Navigation shortcuts
  GO_TO_LINE: {
    id: 'openscad.goToLine',
    label: 'Go to Line...',
    keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG,
    description: 'Jump to a specific line number',
    category: 'navigation'
  },
  
  GO_TO_SYMBOL: {
    id: 'openscad.goToSymbol', 
    label: 'Go to Symbol...',
    keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyO,
    description: 'Navigate to a symbol in the current file',
    category: 'navigation'
  },
  
  GO_TO_DEFINITION: {
    id: 'openscad.goToDefinition',
    label: 'Go to Definition',
    keybinding: monaco.KeyCode.F12,
    description: 'Navigate to symbol definition',
    category: 'navigation'
  },
  
  FIND_REFERENCES: {
    id: 'openscad.findReferences',
    label: 'Find All References',
    keybinding: monaco.KeyMod.Shift | monaco.KeyCode.F12,
    description: 'Find all references to the current symbol',
    category: 'navigation'
  },
  
  // CHANGED: Avoid browser conflict with Ctrl+T (New Tab)
  SEARCH_SYMBOLS: {
    id: 'openscad.searchSymbols',
    label: 'Search Symbols...',
    keybinding: monaco.KeyMod.Alt | monaco.KeyCode.KeyT,
    alternativeKeybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyT,
    description: 'Search for symbols across the document (Alt+T to avoid browser conflict)',
    category: 'navigation'
  },

  // Editing shortcuts
  SAVE_CODE: {
    id: 'openscad.saveCode',
    label: 'Save/Export Code',
    keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
    description: 'Save or export the current code',
    category: 'editing'
  },

  TOGGLE_LINE_COMMENT: {
    id: 'openscad.toggleLineComment',
    label: 'Toggle Line Comment',
    keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash,
    description: 'Toggle line comment on current line or selection',
    category: 'editing'
  },

  TOGGLE_BLOCK_COMMENT: {
    id: 'openscad.toggleBlockComment',
    label: 'Toggle Block Comment',
    keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Slash,
    description: 'Toggle block comment on selection',
    category: 'editing'
  },

  // Formatting shortcuts
  FORMAT_DOCUMENT: {
    id: 'openscad.formatDocument',
    label: 'Format Document',
    keybinding: monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
    description: 'Format the entire document',
    category: 'formatting'
  },

  FORMAT_SELECTION: {
    id: 'openscad.formatSelection',
    label: 'Format Selection',
    keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
    alternativeKeybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF,
    description: 'Format the selected code (Ctrl+K then Ctrl+F)',
    category: 'formatting'
  },

  // OpenSCAD-specific shortcuts (using Alt to avoid conflicts)
  QUICK_RENDER: {
    id: 'openscad.quickRender',
    label: 'Quick Render Preview',
    keybinding: monaco.KeyMod.Alt | monaco.KeyCode.KeyR,
    description: 'Trigger quick render preview (OpenSCAD-specific)',
    category: 'openscad'
  },

  EXPORT_STL: {
    id: 'openscad.exportSTL',
    label: 'Export STL',
    keybinding: monaco.KeyMod.Alt | monaco.KeyCode.KeyE,
    description: 'Export model as STL file (OpenSCAD-specific)',
    category: 'openscad'
  },

  TOGGLE_OUTLINE: {
    id: 'openscad.toggleOutline',
    label: 'Toggle Document Outline',
    keybinding: monaco.KeyMod.Alt | monaco.KeyCode.KeyO,
    description: 'Show/hide document outline panel',
    category: 'openscad'
  }
} as const;

/**
 * Get shortcuts by category
 */
export function getShortcutsByCategory(category: KeyboardShortcut['category']) {
  return Object.values(KEYBOARD_SHORTCUTS).filter(shortcut => shortcut.category === category);
}

/**
 * Get shortcut by ID
 */
export function getShortcut(id: string) {
  return Object.values(KEYBOARD_SHORTCUTS).find(shortcut => shortcut.id === id);
}

/**
 * Format keybinding for display (cross-platform)
 */
export function formatKeybinding(keybinding: number): string {
  const parts: string[] = [];
  
  // Check for modifiers
  if (keybinding & monaco.KeyMod.CtrlCmd) {
    parts.push(navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl');
  }
  if (keybinding & monaco.KeyMod.Shift) {
    parts.push('Shift');
  }
  if (keybinding & monaco.KeyMod.Alt) {
    parts.push('Alt');
  }
  
  // Extract key code
  const keyCode = keybinding & 0xFF;
  const keyName = getKeyName(keyCode);
  if (keyName) {
    parts.push(keyName);
  }
  
  return parts.join('+');
}

/**
 * Get human-readable key name from Monaco key code
 */
function getKeyName(keyCode: number): string {
  const keyMap: Record<number, string> = {
    [monaco.KeyCode.KeyA]: 'A',
    [monaco.KeyCode.KeyB]: 'B',
    [monaco.KeyCode.KeyC]: 'C',
    [monaco.KeyCode.KeyD]: 'D',
    [monaco.KeyCode.KeyE]: 'E',
    [monaco.KeyCode.KeyF]: 'F',
    [monaco.KeyCode.KeyG]: 'G',
    [monaco.KeyCode.KeyH]: 'H',
    [monaco.KeyCode.KeyI]: 'I',
    [monaco.KeyCode.KeyJ]: 'J',
    [monaco.KeyCode.KeyK]: 'K',
    [monaco.KeyCode.KeyL]: 'L',
    [monaco.KeyCode.KeyM]: 'M',
    [monaco.KeyCode.KeyN]: 'N',
    [monaco.KeyCode.KeyO]: 'O',
    [monaco.KeyCode.KeyP]: 'P',
    [monaco.KeyCode.KeyQ]: 'Q',
    [monaco.KeyCode.KeyR]: 'R',
    [monaco.KeyCode.KeyS]: 'S',
    [monaco.KeyCode.KeyT]: 'T',
    [monaco.KeyCode.KeyU]: 'U',
    [monaco.KeyCode.KeyV]: 'V',
    [monaco.KeyCode.KeyW]: 'W',
    [monaco.KeyCode.KeyX]: 'X',
    [monaco.KeyCode.KeyY]: 'Y',
    [monaco.KeyCode.KeyZ]: 'Z',
    [monaco.KeyCode.F1]: 'F1',
    [monaco.KeyCode.F2]: 'F2',
    [monaco.KeyCode.F3]: 'F3',
    [monaco.KeyCode.F4]: 'F4',
    [monaco.KeyCode.F5]: 'F5',
    [monaco.KeyCode.F6]: 'F6',
    [monaco.KeyCode.F7]: 'F7',
    [monaco.KeyCode.F8]: 'F8',
    [monaco.KeyCode.F9]: 'F9',
    [monaco.KeyCode.F10]: 'F10',
    [monaco.KeyCode.F11]: 'F11',
    [monaco.KeyCode.F12]: 'F12',
    [monaco.KeyCode.Slash]: '/',
    [monaco.KeyCode.Space]: 'Space',
    [monaco.KeyCode.Enter]: 'Enter',
    [monaco.KeyCode.Escape]: 'Esc'
  };
  
  return keyMap[keyCode] || `Key${keyCode}`;
}

/**
 * Check if a keybinding conflicts with common browser shortcuts
 */
export function hasConflictWithBrowser(keybinding: number): boolean {
  const conflictingShortcuts = [
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyT, // New Tab
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW, // Close Tab
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, // Reload
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyN, // New Window
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, // Address Bar
    monaco.KeyCode.F5, // Reload
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.F5, // Hard Reload
  ];
  
  return conflictingShortcuts.includes(keybinding);
}
