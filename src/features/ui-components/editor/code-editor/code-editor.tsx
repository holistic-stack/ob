/**
 * Enhanced Code Editor Component
 *
 * A Monaco Editor-based OpenSCAD code editor with glass morphism effects.
 * Integrates with @holistic-stack/openscad-editor for professional OpenSCAD development experience.
 * Follows TDD methodology and liquid glass design system standards.
 */

import React, { forwardRef, useRef, useEffect, useState, useCallback } from 'react';
import {
  clsx,
  generateGlassClasses,
  generateAccessibleStyles,
  type BaseComponentProps,
  type AriaProps,
  type GlassConfig,
} from '../../shared';

// Monaco Editor integration
declare global {
  interface Window {
    monaco: any;
  }
}

// OpenSCAD Editor integration types
type ParseResult = {
  success: boolean;
  errors: Array<{
    message: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
  }>;
  ast?: any[];
};

type OutlineItem = {
  name: string;
  kind: string;
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  children?: OutlineItem[];
};

// Feature configuration types (for future use)
// type FeaturePreset = 'BASIC' | 'STANDARD' | 'IDE' | 'FULL';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Supported programming languages
 */
export type EditorLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'html'
  | 'css'
  | 'json'
  | 'markdown'
  | 'openscad';

/**
 * Editor theme options
 */
export type EditorTheme = 'light' | 'dark' | 'auto';

/**
 * Props for the Enhanced CodeEditor component
 */
export interface CodeEditorProps extends BaseComponentProps, AriaProps {
  /** Current code value */
  readonly value: string;

  /** Callback when code changes */
  readonly onChange?: (value: string) => void;

  /** Programming language for syntax highlighting */
  readonly language?: EditorLanguage;

  /** Editor theme */
  readonly theme?: EditorTheme;

  /** Whether to show line numbers */
  readonly showLineNumbers?: boolean;

  /** Whether the editor is read-only */
  readonly readOnly?: boolean;

  /** Placeholder text when empty */
  readonly placeholder?: string;

  /** Callback when Ctrl+S is pressed */
  readonly onSave?: () => void;

  /** Callback when code is formatted */
  readonly onFormat?: () => void;

  /** Callback when AST is parsed (OpenSCAD only) */
  readonly onASTChange?: (ast: any[]) => void;

  /** Callback when parse errors are detected (OpenSCAD only) */
  readonly onParseErrors?: (errors: ParseResult['errors']) => void;

  /** Whether to enable real-time AST parsing (OpenSCAD only) */
  readonly enableASTParsing?: boolean;

  /** Whether to show syntax errors inline */
  readonly showSyntaxErrors?: boolean;

  /** Whether to enable code completion */
  readonly enableCodeCompletion?: boolean;

  /** Glass morphism configuration */
  readonly glassConfig?: Partial<GlassConfig>;

  /** Whether the editor is over a light background */
  readonly overLight?: boolean;

  /** Custom CSS class name */
  readonly className?: string;

  /** Test ID for testing */
  readonly 'data-testid'?: string;
}

// ============================================================================
// OpenSCAD Language Support
// ============================================================================

/**
 * OpenSCAD language configuration for Monaco Editor
 * Based on @holistic-stack/openscad-editor patterns
 */
const openscadLanguageConfig = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/']
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')']
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: '/*', close: '*/' }
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' }
  ],
  wordPattern: /(-?\d*\.\d\w*)|([^`~!@#%^&*()\-=+[\]{}\\|;:'",./?<>\s]+)/g
};

/**
 * OpenSCAD syntax highlighting tokens definition
 */
const openscadTokensDefinition = {
  defaultToken: '',
  tokenPostfix: '.openscad',

  keywords: [
    'module', 'function', 'if', 'else', 'for', 'while', 'let', 'assert',
    'echo', 'each', 'true', 'false', 'undef', 'include', 'use'
  ],

  builtinFunctions: [
    'abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'cross', 'exp',
    'floor', 'len', 'ln', 'log', 'lookup', 'max', 'min', 'norm', 'pow',
    'rands', 'round', 'sign', 'sin', 'sqrt', 'tan', 'str', 'chr', 'ord',
    'concat', 'search', 'version', 'version_num', 'parent_module'
  ],

  builtinModules: [
    'cube', 'sphere', 'cylinder', 'polyhedron', 'square', 'circle', 'polygon',
    'text', 'linear_extrude', 'rotate_extrude', 'scale', 'resize', 'rotate',
    'translate', 'mirror', 'multmatrix', 'color', 'offset', 'hull', 'minkowski',
    'union', 'difference', 'intersection', 'render', 'surface', 'projection'
  ],

  builtinConstants: [
    '$fa', '$fs', '$fn', '$t', '$vpt', '$vpr', '$vpd', '$vpf',
    '$children', '$preview', '$OPENSCAD_VERSION'
  ],

  operators: [
    '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
    '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
    '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
    '%=', '<<=', '>>=', '>>>='
  ],

  symbols: /[=><!~?:&|+\-*/^%]+/,
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      // Identifiers and keywords
      [/[a-z_$][\w$]*/, {
        cases: {
          '@keywords': 'keyword',
          '@builtinFunctions': 'predefined',
          '@builtinModules': 'type',
          '@builtinConstants': 'constant',
          '@default': 'identifier'
        }
      }],
      [/[A-Z][\w$]*/, 'type.identifier'],

      // Whitespace
      { include: '@whitespace' },

      // Delimiters and operators
      [/[{}()[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@operators': 'operator',
          '@default': ''
        }
      }],

      // Numbers
      [/\d*\.\d+([eE][+-]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],

      // Delimiter: after number because of .\d floats
      [/[;,.]/, 'delimiter'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

      // Characters
      [/'[^\\']'/, 'string'],
      [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
      [/'/, 'string.invalid']
    ],

    comment: [
      [/[^/*]+/, 'comment'],
      [/\/\*/, 'comment', '@push'],
      [/\*\//, 'comment', '@pop'],
      [/[/*]/, 'comment']
    ],

    string: [
      [/[^\\"]/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],
  }
};

/**
 * OpenSCAD dark theme definition
 */
const openscadTheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
    { token: 'predefined', foreground: 'dcdcaa' },
    { token: 'type', foreground: '4ec9b0', fontStyle: 'bold' },
    { token: 'constant', foreground: '9cdcfe' },
    { token: 'identifier', foreground: 'd4d4d4' },
    { token: 'type.identifier', foreground: '4ec9b0' },
    { token: 'number', foreground: 'b5cea8' },
    { token: 'number.float', foreground: 'b5cea8' },
    { token: 'number.hex', foreground: 'b5cea8' },
    { token: 'string', foreground: 'ce9178' },
    { token: 'string.quote', foreground: 'ce9178' },
    { token: 'string.escape', foreground: 'd7ba7d' },
    { token: 'string.invalid', foreground: 'f44747' },
    { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
    { token: 'operator', foreground: 'd4d4d4' },
    { token: 'delimiter', foreground: 'd4d4d4' },
    { token: 'white', foreground: 'd4d4d4' },
  ],
  colors: {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
    'editorLineNumber.foreground': '#858585',
    'editorCursor.foreground': '#aeafad',
    'editor.selectionBackground': '#264f78',
    'editor.inactiveSelectionBackground': '#3a3d41',
  }
};

/**
 * OpenSCAD completion provider for Monaco Editor
 */
class OpenSCADCompletionProvider {
  private parser: any = null;

  constructor(parser?: any) {
    this.parser = parser;
  }

  setParser(parser: any) {
    this.parser = parser;
  }

  triggerCharacters = ['.', '(', '[', ' '];

  async provideCompletionItems(
    model: any,
    position: any,
    _context: any
  ): Promise<any> {
    const lineContent = model.getLineContent(position.lineNumber);
    const wordInfo = model.getWordAtPosition(position);
    const wordAtPosition = wordInfo?.word ?? '';

    // Skip completion in strings and comments
    const beforeCursor = lineContent.substring(0, position.column - 1);
    if (this.isInsideString(beforeCursor) || this.isInsideComment(beforeCursor)) {
      return { suggestions: [] };
    }

    const suggestions: any[] = [];

    // Add OpenSCAD built-in symbols
    const builtinSymbols = this.getBuiltinSymbols(wordAtPosition);
    suggestions.push(...builtinSymbols);

    // Add user-defined symbols from AST if parser is available
    if (this.parser) {
      try {
        const userSymbols = await this.getUserDefinedSymbols(model, position, wordAtPosition);
        suggestions.push(...userSymbols);
      } catch (error) {
        console.warn('[OpenSCADCompletionProvider] Error getting user symbols:', error);
      }
    }

    return { suggestions };
  }

  private isInsideString(text: string): boolean {
    let inString = false;
    let escaped = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
      }
    }

    return inString;
  }

  private isInsideComment(text: string): boolean {
    if (text.includes('//')) {
      const commentIndex = text.lastIndexOf('//');
      const beforeComment = text.substring(0, commentIndex);
      if (!this.isInsideString(beforeComment)) {
        return true;
      }
    }
    return false;
  }

  private getBuiltinSymbols(filter: string): any[] {
    const symbols = [
      // 3D Primitives
      { name: 'cube', type: 'module', category: '3D Primitives', description: 'Creates a cube or rectangular prism' },
      { name: 'sphere', type: 'module', category: '3D Primitives', description: 'Creates a sphere' },
      { name: 'cylinder', type: 'module', category: '3D Primitives', description: 'Creates a cylinder or cone' },
      { name: 'polyhedron', type: 'module', category: '3D Primitives', description: 'Creates a polyhedron from points and faces' },

      // 2D Primitives
      { name: 'square', type: 'module', category: '2D Primitives', description: 'Creates a square or rectangle' },
      { name: 'circle', type: 'module', category: '2D Primitives', description: 'Creates a circle' },
      { name: 'polygon', type: 'module', category: '2D Primitives', description: 'Creates a polygon from points' },
      { name: 'text', type: 'module', category: '2D Primitives', description: 'Creates text as a 2D shape' },

      // Transformations
      { name: 'translate', type: 'module', category: 'Transformations', description: 'Moves objects in 3D space' },
      { name: 'rotate', type: 'module', category: 'Transformations', description: 'Rotates objects around axes' },
      { name: 'scale', type: 'module', category: 'Transformations', description: 'Scales objects by factors' },
      { name: 'resize', type: 'module', category: 'Transformations', description: 'Resizes objects to specific dimensions' },
      { name: 'mirror', type: 'module', category: 'Transformations', description: 'Mirrors objects across a plane' },
      { name: 'multmatrix', type: 'module', category: 'Transformations', description: 'Applies transformation matrix' },

      // Boolean Operations
      { name: 'union', type: 'module', category: 'Boolean Operations', description: 'Combines multiple objects' },
      { name: 'difference', type: 'module', category: 'Boolean Operations', description: 'Subtracts objects from the first' },
      { name: 'intersection', type: 'module', category: 'Boolean Operations', description: 'Keeps only overlapping parts' },

      // 2D to 3D
      { name: 'linear_extrude', type: 'module', category: '2D to 3D', description: 'Extrudes 2D shapes into 3D' },
      { name: 'rotate_extrude', type: 'module', category: '2D to 3D', description: 'Rotates 2D shapes around an axis' },

      // Control Structures
      { name: 'if', type: 'keyword', category: 'Control', description: 'Conditional execution' },
      { name: 'else', type: 'keyword', category: 'Control', description: 'Alternative execution' },
      { name: 'for', type: 'keyword', category: 'Control', description: 'Loop iteration' },
      { name: 'module', type: 'keyword', category: 'Control', description: 'Define a module' },
      { name: 'function', type: 'keyword', category: 'Control', description: 'Define a function' },

      // Math Functions
      { name: 'abs', type: 'function', category: 'Math', description: 'Absolute value' },
      { name: 'cos', type: 'function', category: 'Math', description: 'Cosine function' },
      { name: 'sin', type: 'function', category: 'Math', description: 'Sine function' },
      { name: 'tan', type: 'function', category: 'Math', description: 'Tangent function' },
      { name: 'sqrt', type: 'function', category: 'Math', description: 'Square root' },
      { name: 'pow', type: 'function', category: 'Math', description: 'Power function' },
      { name: 'min', type: 'function', category: 'Math', description: 'Minimum value' },
      { name: 'max', type: 'function', category: 'Math', description: 'Maximum value' }
    ];

    return symbols
      .filter(symbol => !filter || symbol.name.toLowerCase().startsWith(filter.toLowerCase()))
      .map(symbol => ({
        label: symbol.name,
        kind: this.getCompletionKind(symbol.type),
        detail: `${symbol.type} - ${symbol.category}`,
        documentation: symbol.description,
        insertText: symbol.type === 'module' ? `${symbol.name}()` : symbol.name,
        insertTextRules: 4, // InsertAsSnippet
        sortText: `${symbol.category}_${symbol.name}`
      }));
  }

  private async getUserDefinedSymbols(model: any, position: any, filter: string): Promise<any[]> {
    if (!this.parser) return [];

    try {
      const code = model.getValue();
      const ast = this.parser.parseAST(code);

      if (!ast || !Array.isArray(ast)) return [];

      const symbols: any[] = [];

      // Extract user-defined modules and functions
      this.extractSymbolsFromAST(ast, symbols, position.lineNumber);

      return symbols
        .filter(symbol => !filter || symbol.name.toLowerCase().startsWith(filter.toLowerCase()))
        .map(symbol => ({
          label: symbol.name,
          kind: this.getCompletionKind(symbol.type),
          detail: `${symbol.type} (user-defined)`,
          documentation: `User-defined ${symbol.type}: ${symbol.name}`,
          insertText: symbol.name,
          sortText: `0_${symbol.name}` // Prioritize user symbols
        }));
    } catch (error) {
      console.warn('[OpenSCADCompletionProvider] Error parsing AST:', error);
      return [];
    }
  }

  private extractSymbolsFromAST(nodes: any[], symbols: any[], currentLine: number) {
    for (const node of nodes) {
      if (node.type === 'module_definition' && node.name) {
        // Only include symbols defined before current position
        if (!node.location || node.location.start.line < currentLine - 1) {
          symbols.push({
            name: node.name,
            type: 'module',
            line: node.location?.start.line ?? 0
          });
        }
      } else if (node.type === 'function_definition' && node.name) {
        if (!node.location || node.location.start.line < currentLine - 1) {
          symbols.push({
            name: node.name,
            type: 'function',
            line: node.location?.start.line ?? 0
          });
        }
      }

      // Recursively process child nodes
      if (node.children && Array.isArray(node.children)) {
        this.extractSymbolsFromAST(node.children, symbols, currentLine);
      }
    }
  }

  private getCompletionKind(type: string): number {
    switch (type) {
      case 'module': return 9; // Module
      case 'function': return 3; // Function
      case 'keyword': return 17; // Keyword
      default: return 1; // Text
    }
  }
}

/**
 * OpenSCAD hover provider for Monaco Editor
 */
class OpenSCADHoverProvider {
  private parser: any = null;

  constructor(parser?: any) {
    this.parser = parser;
  }

  setParser(parser: any) {
    this.parser = parser;
  }

  async provideHover(model: any, position: any): Promise<any> {
    const wordInfo = model.getWordAtPosition(position);
    if (!wordInfo) return null;

    const word = wordInfo.word;

    // Check built-in symbols first
    const builtinHover = this.getBuiltinHover(word);
    if (builtinHover) return builtinHover;

    // Check user-defined symbols if parser is available
    if (this.parser) {
      try {
        const userHover = await this.getUserDefinedHover(model, position, word);
        if (userHover) return userHover;
      } catch (error) {
        console.warn('[OpenSCADHoverProvider] Error getting user hover:', error);
      }
    }

    return null;
  }

  private getBuiltinHover(word: string): any {
    const builtinDocs: Record<string, { signature: string; description: string; examples?: string[] }> = {
      cube: {
        signature: 'cube(size, center = false)',
        description: 'Creates a cube or rectangular prism. Size can be a single value for a cube or [x, y, z] for a rectangular prism.',
        examples: ['cube(10);', 'cube([10, 20, 30]);', 'cube(10, center = true);']
      },
      sphere: {
        signature: 'sphere(r, $fn, $fa, $fs)',
        description: 'Creates a sphere with the specified radius.',
        examples: ['sphere(10);', 'sphere(r = 5, $fn = 50);']
      },
      cylinder: {
        signature: 'cylinder(h, r, r1, r2, center = false, $fn, $fa, $fs)',
        description: 'Creates a cylinder or cone. Use r for uniform radius, or r1/r2 for different top/bottom radii.',
        examples: ['cylinder(h = 10, r = 5);', 'cylinder(h = 10, r1 = 5, r2 = 2);']
      },
      translate: {
        signature: 'translate(v)',
        description: 'Moves objects by the specified vector [x, y, z].',
        examples: ['translate([10, 0, 0]) cube(5);', 'translate([0, 10, 5]) sphere(3);']
      },
      rotate: {
        signature: 'rotate(a, v)',
        description: 'Rotates objects. a can be [x, y, z] angles or single angle with v as axis vector.',
        examples: ['rotate([0, 0, 45]) cube(10);', 'rotate(45, [0, 0, 1]) cube(10);']
      },
      union: {
        signature: 'union()',
        description: 'Combines multiple objects into one. This is the default operation.',
        examples: ['union() { cube(10); translate([5, 5, 0]) sphere(5); }']
      },
      difference: {
        signature: 'difference()',
        description: 'Subtracts all subsequent objects from the first object.',
        examples: ['difference() { cube(10); translate([5, 5, 5]) sphere(3); }']
      },
      intersection: {
        signature: 'intersection()',
        description: 'Keeps only the overlapping parts of all objects.',
        examples: ['intersection() { cube(10); translate([5, 5, 5]) sphere(8); }']
      }
    };

    const doc = builtinDocs[word];
    if (!doc) return null;

    const contents = [
      { value: `\`\`\`openscad\n${doc.signature}\n\`\`\`` },
      { value: doc.description }
    ];

    if (doc.examples) {
      contents.push({
        value: `**Examples:**\n\`\`\`openscad\n${doc.examples.join('\n')}\n\`\`\``
      });
    }

    return { contents };
  }

  private async getUserDefinedHover(model: any, _position: any, word: string): Promise<any> {
    if (!this.parser) return null;

    try {
      const code = model.getValue();
      const ast = this.parser.parseAST(code);

      if (!ast || !Array.isArray(ast)) return null;

      const symbol = this.findSymbolDefinition(ast, word);
      if (!symbol) return null;

      const contents = [
        { value: `\`\`\`openscad\n${symbol.type} ${symbol.name}\n\`\`\`` },
        { value: `**Type:** ${symbol.type}  \n**Line:** ${symbol.line + 1}` }
      ];

      if (symbol.parameters) {
        contents.push({
          value: `**Parameters:** ${symbol.parameters.join(', ')}`
        });
      }

      return { contents };
    } catch (error) {
      console.warn('[OpenSCADHoverProvider] Error in user hover:', error);
      return null;
    }
  }

  private findSymbolDefinition(nodes: any[], name: string): any {
    for (const node of nodes) {
      if ((node.type === 'module_definition' || node.type === 'function_definition') && node.name === name) {
        return {
          name: node.name,
          type: node.type === 'module_definition' ? 'module' : 'function',
          line: node.location?.start.line ?? 0,
          parameters: node.parameters?.map((p: any) => p.name) ?? []
        };
      }

      if (node.children && Array.isArray(node.children)) {
        const found = this.findSymbolDefinition(node.children, name);
        if (found) return found;
      }
    }
    return null;
  }
}

/**
 * OpenSCAD definition provider for Monaco Editor
 */
class OpenSCADDefinitionProvider {
  private parser: any = null;

  constructor(parser?: any) {
    this.parser = parser;
  }

  setParser(parser: any) {
    this.parser = parser;
  }

  async provideDefinition(model: any, position: any): Promise<any> {
    const wordInfo = model.getWordAtPosition(position);
    if (!wordInfo || !this.parser) return null;

    const word = wordInfo.word;

    try {
      const code = model.getValue();
      const ast = this.parser.parseAST(code);

      if (!ast || !Array.isArray(ast)) return null;

      const definition = this.findSymbolDefinition(ast, word);
      if (!definition) return null;

      return {
        uri: model.uri,
        range: {
          startLineNumber: definition.line + 1,
          endLineNumber: definition.line + 1,
          startColumn: 1,
          endColumn: definition.name.length + 1
        }
      };
    } catch (error) {
      console.warn('[OpenSCADDefinitionProvider] Error finding definition:', error);
      return null;
    }
  }

  private findSymbolDefinition(nodes: any[], name: string): any {
    for (const node of nodes) {
      if ((node.type === 'module_definition' || node.type === 'function_definition') && node.name === name) {
        return {
          name: node.name,
          type: node.type === 'module_definition' ? 'module' : 'function',
          line: node.location?.start.line ?? 0,
          parameters: node.parameters?.map((p: any) => p.name) ?? []
        };
      }

      if (node.children && Array.isArray(node.children)) {
        const found = this.findSymbolDefinition(node.children, name);
        if (found) return found;
      }
    }
    return null;
  }
}

/**
 * OpenSCAD reference provider for Monaco Editor
 */
class OpenSCADReferenceProvider {
  private parser: any = null;

  constructor(parser?: any) {
    this.parser = parser;
  }

  setParser(parser: any) {
    this.parser = parser;
  }

  async provideReferences(model: any, position: any, context: any): Promise<any[]> {
    const wordInfo = model.getWordAtPosition(position);
    if (!wordInfo || !this.parser) return [];

    const word = wordInfo.word;

    try {
      const code = model.getValue();
      const ast = this.parser.parseAST(code);

      if (!ast || !Array.isArray(ast)) return [];

      const references = this.findSymbolReferences(ast, word, code);

      // Include definition if requested
      if (context.includeDeclaration) {
        const definition = this.findSymbolDefinition(ast, word);
        if (definition) {
          references.unshift({
            uri: model.uri,
            range: {
              startLineNumber: definition.line + 1,
              endLineNumber: definition.line + 1,
              startColumn: 1,
              endColumn: definition.name.length + 1
            }
          });
        }
      }

      return references;
    } catch (error) {
      console.warn('[OpenSCADReferenceProvider] Error finding references:', error);
      return [];
    }
  }

  private findSymbolReferences(_ast: any[], symbolName: string, code: string): any[] {
    const references: any[] = [];
    const lines = code.split('\n');

    // Simple text-based search for references
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (!line) continue;

      const regex = new RegExp(`\\b${this.escapeRegex(symbolName)}\\b`, 'g');
      let match;

      while ((match = regex.exec(line)) !== null) {
        const startColumn = match.index + 1;
        const endColumn = startColumn + symbolName.length;

        references.push({
          uri: undefined, // Will be set by Monaco
          range: {
            startLineNumber: lineIndex + 1,
            endLineNumber: lineIndex + 1,
            startColumn,
            endColumn
          }
        });
      }
    }

    return references;
  }

  private findSymbolDefinition(nodes: any[], name: string): any {
    for (const node of nodes) {
      if ((node.type === 'module_definition' || node.type === 'function_definition') && node.name === name) {
        return {
          name: node.name,
          type: node.type === 'module_definition' ? 'module' : 'function',
          line: node.location?.start.line ?? 0
        };
      }

      if (node.children && Array.isArray(node.children)) {
        const found = this.findSymbolDefinition(node.children, name);
        if (found) return found;
      }
    }
    return null;
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/**
 * OpenSCAD document symbol provider for Monaco Editor
 */
class OpenSCADDocumentSymbolProvider {
  private parser: any = null;

  constructor(parser?: any) {
    this.parser = parser;
  }

  setParser(parser: any) {
    this.parser = parser;
  }

  async provideDocumentSymbols(model: any): Promise<any[]> {
    if (!this.parser) return [];

    try {
      const code = model.getValue();
      const ast = this.parser.parseAST(code);

      if (!ast || !Array.isArray(ast)) return [];

      return this.extractSymbolsFromAST(ast);
    } catch (error) {
      console.warn('[OpenSCADDocumentSymbolProvider] Error extracting symbols:', error);
      return [];
    }
  }

  private extractSymbolsFromAST(nodes: any[]): any[] {
    const symbols: any[] = [];

    for (const node of nodes) {
      if (node.type === 'module_definition' && node.name) {
        symbols.push({
          name: node.name,
          detail: 'module',
          kind: 5, // SymbolKind.Class
          range: {
            startLineNumber: (node.location?.start.line ?? 0) + 1,
            endLineNumber: (node.location?.end.line ?? 0) + 1,
            startColumn: (node.location?.start.column ?? 0) + 1,
            endColumn: (node.location?.end.column ?? 0) + 1
          },
          selectionRange: {
            startLineNumber: (node.location?.start.line ?? 0) + 1,
            endLineNumber: (node.location?.start.line ?? 0) + 1,
            startColumn: (node.location?.start.column ?? 0) + 1,
            endColumn: (node.location?.start.column ?? 0) + node.name.length + 1
          }
        });
      } else if (node.type === 'function_definition' && node.name) {
        symbols.push({
          name: node.name,
          detail: 'function',
          kind: 12, // SymbolKind.Function
          range: {
            startLineNumber: (node.location?.start.line ?? 0) + 1,
            endLineNumber: (node.location?.end.line ?? 0) + 1,
            startColumn: (node.location?.start.column ?? 0) + 1,
            endColumn: (node.location?.end.column ?? 0) + 1
          },
          selectionRange: {
            startLineNumber: (node.location?.start.line ?? 0) + 1,
            endLineNumber: (node.location?.start.line ?? 0) + 1,
            startColumn: (node.location?.start.column ?? 0) + 1,
            endColumn: (node.location?.start.column ?? 0) + node.name.length + 1
          }
        });
      }

      // Recursively process child nodes
      if (node.children && Array.isArray(node.children)) {
        const childSymbols = this.extractSymbolsFromAST(node.children);
        symbols.push(...childSymbols);
      }
    }

    return symbols;
  }
}

/**
 * Register OpenSCAD language with Monaco Editor and IDE features
 */
const registerOpenSCADLanguage = (monaco: any, parser?: any) => {
  const LANGUAGE_ID = 'openscad';
  const THEME_ID = 'openscad-dark';

  console.log('[CodeEditor] Registering OpenSCAD language with Monaco Editor...');

  // Register the language
  monaco.languages.register({
    id: LANGUAGE_ID,
    extensions: ['.scad'],
    aliases: ['OpenSCAD', 'openscad'],
    mimetypes: ['text/x-openscad']
  });

  // Set language configuration
  monaco.languages.setLanguageConfiguration(LANGUAGE_ID, openscadLanguageConfig);

  // Set tokens provider using Monarch tokenizer
  monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, openscadTokensDefinition);

  // Define and set the theme
  monaco.editor.defineTheme(THEME_ID, openscadTheme);

  // Register completion provider
  const completionProvider = new OpenSCADCompletionProvider(parser);
  monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, completionProvider);

  // Register hover provider
  const hoverProvider = new OpenSCADHoverProvider(parser);
  monaco.languages.registerHoverProvider(LANGUAGE_ID, hoverProvider);

  // Register definition provider (go-to-definition)
  const definitionProvider = new OpenSCADDefinitionProvider(parser);
  monaco.languages.registerDefinitionProvider(LANGUAGE_ID, definitionProvider);

  // Register reference provider (find all references)
  const referenceProvider = new OpenSCADReferenceProvider(parser);
  monaco.languages.registerReferenceProvider(LANGUAGE_ID, referenceProvider);

  // Register document symbol provider (outline/symbol search)
  const documentSymbolProvider = new OpenSCADDocumentSymbolProvider(parser);
  monaco.languages.registerDocumentSymbolProvider(LANGUAGE_ID, documentSymbolProvider);

  console.log('[CodeEditor] OpenSCAD language and advanced IDE features registered successfully');

  return {
    LANGUAGE_ID,
    THEME_ID,
    completionProvider,
    hoverProvider,
    definitionProvider,
    referenceProvider,
    documentSymbolProvider
  };
};

// ============================================================================
// Monaco Editor Integration
// ============================================================================

/**
 * Monaco Editor wrapper component for React
 */
interface MonacoEditorProps {
  value: string;
  language: string;
  theme: string;
  onChange?: (value: string | undefined) => void;
  onMount?: (editor: any, monaco: any) => void;
  options?: any;
  height?: string | number;
  width?: string | number;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  language,
  theme,
  onChange,
  onMount,
  options = {},
  height = '100%',
  width = '100%'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [isMonacoLoaded, setIsMonacoLoaded] = useState(false);

  // Load Monaco Editor
  useEffect(() => {
    const loadMonaco = async () => {
      try {
        // Monaco Editor is loaded via vite-plugin-monaco-editor
        if (typeof window !== 'undefined' && window.monaco) {
          setIsMonacoLoaded(true);
          return;
        }

        // Wait for Monaco to be available
        const checkMonaco = () => {
          if (window.monaco) {
            setIsMonacoLoaded(true);
          } else {
            setTimeout(checkMonaco, 100);
          }
        };
        checkMonaco();
      } catch (error) {
        console.error('[MonacoEditor] Failed to load Monaco Editor:', error);
      }
    };

    loadMonaco();
  }, []);

  // Initialize editor when Monaco is loaded
  useEffect(() => {
    if (!isMonacoLoaded || !containerRef.current || editorRef.current) {
      return;
    }

    try {
      // Register OpenSCAD language if needed
      if (language === 'openscad') {
        const { THEME_ID } = registerOpenSCADLanguage(window.monaco);

        // Use OpenSCAD theme for OpenSCAD language
        const monacoTheme = theme === 'dark' ? THEME_ID : theme === 'light' ? 'vs' : THEME_ID;

        const editor = window.monaco.editor.create(containerRef.current, {
          value,
          language: 'openscad',
          theme: monacoTheme,
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          glyphMargin: true,
          folding: true,
          lineDecorationsWidth: 20,
          lineNumbersMinChars: 3,
          fontSize: 14,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          ...options
        });

        editorRef.current = editor;
      } else {
        // Map theme names to Monaco themes for other languages
        const monacoTheme = theme === 'dark' ? 'vs-dark' : theme === 'light' ? 'vs' : 'vs-dark';

        const editor = window.monaco.editor.create(containerRef.current, {
          value,
          language,
          theme: monacoTheme,
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          glyphMargin: true,
          folding: true,
          lineDecorationsWidth: 20,
          lineNumbersMinChars: 3,
          fontSize: 14,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          ...options
        });

        editorRef.current = editor;
      }

      // Handle content changes
      const disposable = editorRef.current.onDidChangeModelContent(() => {
        const currentValue = editorRef.current.getValue();
        onChange?.(currentValue);
      });

      // Call onMount callback
      onMount?.(editorRef.current, window.monaco);

      return () => {
        disposable.dispose();
        editorRef.current.dispose();
      };
    } catch (error) {
      console.error('[MonacoEditor] Failed to create editor:', error);
      return;
    }
  }, [isMonacoLoaded, value, language, theme, onChange, onMount, options]);

  // Update editor value when prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      data-testid="monaco-editor"
      data-language={language}
      data-theme={theme}
      style={{ height, width }}
    >
      {/* Display content for testing when Monaco isn't loaded */}
      {!isMonacoLoaded && value && (
        <div style={{
          fontFamily: 'monospace',
          fontSize: '14px',
          padding: '8px',
          whiteSpace: 'pre-wrap',
          color: 'white'
        }}>
          {value}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// OpenSCAD Syntax Highlighting and Error Detection
// ============================================================================

/**
 * OpenSCAD syntax highlighting configuration
 * Based on the OpenSCAD language specification and @holistic-stack/openscad-editor
 */
// Legacy syntax highlighting - replaced by Monaco Editor tokenization

// ============================================================================
// Error Display Component
// ============================================================================

interface ErrorDisplayProps {
  readonly errors: ParseResult['errors'];
  readonly onErrorClick?: (error: ParseResult['errors'][0]) => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errors, onErrorClick }) => {
  if (errors.length === 0) return null;

  return (
    <div className="absolute top-2 right-2 z-20 max-w-xs">
      <div className="bg-red-900/80 backdrop-blur-sm border border-red-500/50 rounded-lg p-2 space-y-1">
        <div className="text-red-400 text-xs font-semibold">
          {errors.length} error{errors.length !== 1 ? 's' : ''}
        </div>
        {errors.slice(0, 3).map((error, index) => (
          <button
            key={index}
            type="button"
            className="text-red-300 text-xs cursor-pointer hover:text-red-200 transition-colors text-left bg-transparent border-none p-0"
            onClick={() => onErrorClick?.(error)}
            title={`Line ${error.line}, Column ${error.column}`}
          >
            {error.message}
          </button>
        ))}
        {errors.length > 3 && (
          <div className="text-red-400/60 text-xs">
            +{errors.length - 3} more...
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Line Numbers Component
// ============================================================================

interface LineNumbersProps {
  readonly lines: number;
  readonly errors?: ParseResult['errors'];
}

const LineNumbers: React.FC<LineNumbersProps> = ({ lines, errors = [] }) => {
  const errorLines = new Set(errors.map(e => e.line));

  return (
    <div className="flex flex-col text-right pr-3 py-3 text-white/40 text-sm font-mono select-none">
      {Array.from({ length: lines }, (_, i) => {
        const lineNumber = i + 1;
        const hasError = errorLines.has(lineNumber);

        return (
          <div
            key={lineNumber}
            className={clsx(
              'leading-6 px-1 rounded',
              hasError && 'bg-red-900/30 text-red-400'
            )}
          >
            {lineNumber}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// CodeEditor Component
// ============================================================================

/**
 * Enhanced Code Editor component with OpenSCAD support and glass morphism effects
 *
 * @example
 * ```tsx
 * <CodeEditor
 *   value={code}
 *   onChange={setCode}
 *   language="openscad"
 *   showLineNumbers
 *   enableASTParsing
 *   onSave={() => console.log('Save pressed')}
 *   onASTChange={(ast) => console.log('AST updated:', ast)}
 * />
 * ```
 */
export const CodeEditor = forwardRef<HTMLDivElement, CodeEditorProps>(
  (
    {
      value,
      onChange,
      language = 'openscad',
      theme = 'dark',
      showLineNumbers = true,
      readOnly = false,
      placeholder: _placeholder = 'Enter your OpenSCAD code here...',
      onSave,
      onFormat,
      onASTChange,
      onParseErrors,
      enableASTParsing = true,
      showSyntaxErrors = true,
      enableCodeCompletion = false,
      glassConfig: _glassConfig,
      overLight: _overLight = false,
      className,
      'data-testid': dataTestId,
      'aria-label': ariaLabel,
      ...rest
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [isParserLoading, setIsParserLoading] = useState(false);
    const [parser, setParser] = useState<any>(null);
    const [monacoEditor, setMonacoEditor] = useState<any>(null);
    const [, setMonaco] = useState<any>(null);

    // ========================================================================
    // OpenSCAD Parser Integration
    // ========================================================================

    // Initialize OpenSCAD Parser when language is 'openscad'
    useEffect(() => {
      if (language === 'openscad' && enableASTParsing && !parser && !isParserLoading) {
        setIsParserLoading(true);

        // OpenSCAD Parser functionality disabled - use MonacoCodeEditor for OpenSCAD support
        console.warn('[CodeEditor] OpenSCAD Parser functionality disabled. Use MonacoCodeEditor component for OpenSCAD support with syntax highlighting.');
        setIsParserLoading(false);
      }

      // Cleanup parser on unmount
      return () => {
        if (parser) {
          parser.dispose();
        }
      };
    }, [language, enableASTParsing, parser, isParserLoading]);

    // Parse OpenSCAD code using the parser
    const parseOpenSCADCode = useCallback(async (code: string) => {
      if (!parser || language !== 'openscad' || !enableASTParsing) {
        return;
      }

      try {
        // Clear previous errors before parsing (if methods exist)
        const errorHandler = parser.getErrorHandler();
        if (typeof errorHandler.clearErrors === 'function') {
          errorHandler.clearErrors();
        }
        if (typeof errorHandler.clearWarnings === 'function') {
          errorHandler.clearWarnings();
        }

        // Parse the code to AST
        const ast = parser.parseAST(code);

        // Get parsing errors from the error handler
        const errors = errorHandler.getErrors();
        const warnings = errorHandler.getWarnings();

        // Enhanced error parsing with line/column extraction
        const parseErrors = [
          ...(errors ?? []).map((error: string) => parseErrorMessage(error, 'error')),
          ...(warnings ?? []).map((warning: string) => parseErrorMessage(warning, 'warning')),
        ];

        // Filter out CST generation warnings for empty/simple code
        const filteredErrors = parseErrors.filter(error => {
          // Don't show CST warnings for very simple or empty code
          if (error.severity === 'warning' &&
              error.message.includes('Failed to generate CST')) {
            // Only show CST warnings for complex code that should parse correctly
            const isComplexCode = code.trim().length > 20 &&
                                 (code.includes('module') || code.includes('function') ||
                                  code.includes('{') || code.includes('for') || code.includes('if'));
            return isComplexCode;
          }
          return true;
        });

        // Determine success based on actual errors (not warnings)
        const actualErrors = filteredErrors.filter(e => e.severity === 'error');
        const hasValidAST = Array.isArray(ast) && ast.length > 0;

        // Create parse result
        const result: ParseResult = {
          success: actualErrors.length === 0 && (hasValidAST || code.trim().length === 0),
          errors: filteredErrors,
          ast: ast ?? []
        };

        setParseResult(result);

        if (result.success && result.ast) {
          onASTChange?.(result.ast);
        }

        if (result.errors.length > 0) {
          onParseErrors?.(result.errors);
        }

        console.log('[CodeEditor] Parse result:', {
          success: result.success,
          errors: actualErrors.length,
          warnings: filteredErrors.filter(e => e.severity === 'warning').length,
          astNodes: result.ast?.length ?? 0
        });

      } catch (error) {
        console.error('[CodeEditor] OpenSCAD parsing failed:', error);
        const parseError = {
          message: error instanceof Error ? error.message : 'Unknown parsing error',
          line: 1,
          column: 1,
          severity: 'error' as const,
        };

        const result: ParseResult = {
          success: false,
          errors: [parseError],
          ast: []
        };

        setParseResult(result);
        onParseErrors?.([parseError]);
      }
    }, [parser, language, enableASTParsing, onASTChange, onParseErrors]);

    // Helper function to parse error messages and extract line/column info
    const parseErrorMessage = useCallback((message: string, severity: 'error' | 'warning') => {
      // Try to extract line and column from error message
      // Common patterns: "line 5, column 10", "5:10", "(5,10)", etc.
      const lineColMatch = message.match(/(?:line\s+)?(\d+)(?:\s*[,:]\s*(?:column\s+)?(\d+))?/i);

      let line = 1;
      let column = 1;

      if (lineColMatch) {
        line = parseInt(lineColMatch[1] ?? '1', 10) ?? 1;
        column = parseInt(lineColMatch[2] ?? '1', 10) ?? 1;
      }

      return {
        message,
        line,
        column,
        severity,
      };
    }, []);

    // Parse code when value changes (debounced)
    useEffect(() => {
      if (language === 'openscad' && enableASTParsing && value.trim() && parser) {
        const timeoutId = setTimeout(() => {
          void parseOpenSCADCode(value);
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
      }
      return undefined;
    }, [value, parseOpenSCADCode, language, enableASTParsing, parser]);

    // Feature configuration for OpenSCAD Editor (for future use)

    // ========================================================================
    // Monaco Editor Integration
    // ========================================================================

    // Handle Monaco Editor mount
    const handleMonacoMount = useCallback((editor: any, monacoInstance: any) => {
      setMonacoEditor(editor);
      setMonaco(monacoInstance);

      // Configure OpenSCAD language support
      if (language === 'openscad') {
        try {
          // Register comprehensive OpenSCAD language support with IDE features
          const {
            LANGUAGE_ID,
            THEME_ID,
            completionProvider,
            hoverProvider,
            definitionProvider,
            referenceProvider,
            documentSymbolProvider
          } = registerOpenSCADLanguage(monacoInstance, parser);

          // Update providers with parser when available
          if (parser) {
            completionProvider.setParser(parser);
            hoverProvider.setParser(parser);
            definitionProvider.setParser(parser);
            referenceProvider.setParser(parser);
            documentSymbolProvider.setParser(parser);
          }

          // Ensure the model has the correct language
          const model = editor.getModel();
          if (model && model.getLanguageId() !== LANGUAGE_ID) {
            monacoInstance.editor.setModelLanguage(model, LANGUAGE_ID);
            console.log('[CodeEditor] Model language set to OpenSCAD');
          }

          // Apply OpenSCAD theme
          try {
            monacoInstance.editor.setTheme(THEME_ID);
            console.log('[CodeEditor] OpenSCAD theme and advanced IDE features applied');
          } catch (themeError) {
            console.warn('[CodeEditor] Failed to apply OpenSCAD theme:', themeError);
          }
        } catch (error) {
          console.error('[CodeEditor] Failed to register OpenSCAD language:', error);
        }
      }

      // Add keyboard shortcuts
      editor.addAction({
        id: 'save-action',
        label: 'Save',
        keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS],
        run: () => {
          onSave?.();
        }
      });

      editor.addAction({
        id: 'format-action',
        label: 'Format Document',
        keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyF],
        run: () => {
          onFormat?.();
        }
      });

      // Set ref
      if (ref && typeof ref === 'object') {
        ref.current = containerRef.current;
      }
    }, [language, onSave, onFormat, ref]);

    // ========================================================================
    // Event Handlers
    // ========================================================================

    const handleErrorClick = (error: ParseResult['errors'][0]) => {
      // Jump to error line in Monaco Editor
      if (monacoEditor && error.line > 0) {
        monacoEditor.setPosition({ lineNumber: error.line, column: error.column ?? 1 });
        monacoEditor.focus();
        monacoEditor.revealLine(error.line);
      }
      console.log('[CodeEditor] Error clicked:', error);
    };

    // ========================================================================
    // Style Generation
    // ========================================================================

    const editorClasses = generateAccessibleStyles(
      clsx(
        // Base editor styles
        'flex-1 h-full flex',
        'relative overflow-hidden',

        // Glass morphism effects
        'bg-black/20 backdrop-blur-sm border border-white/50 rounded-lg',
        'shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]',

        // Gradient pseudo-elements
        'before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none',
        'after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none',

        // Focus styles
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'transition-all duration-200 ease-in-out',

        // Custom className
        className
      )
    );

    // ========================================================================
    // Render
    // ========================================================================

    return (
      <div
        ref={containerRef}
        className={editorClasses}
        data-testid={dataTestId}
        data-language={language}
        data-theme={theme}
        aria-label={ariaLabel}
        role="textbox"
        tabIndex={0}
        style={{ minHeight: '44px' }} // WCAG AA minimum touch target
        {...rest}
      >
        <div className="relative z-10 flex w-full h-full">
          {/* Monaco Editor */}
          <div className="flex-1 relative">
            <MonacoEditor
              value={value}
              language={language}
              theme={theme}
              onChange={(newValue) => onChange?.(newValue ?? '')}
              onMount={handleMonacoMount}
              options={{
                readOnly,
                lineNumbers: showLineNumbers ? 'on' : 'off',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                tabSize: 2,
                insertSpaces: true,
                wordWrap: 'on',
                automaticLayout: true,
                glyphMargin: true,
                folding: true,
                lineDecorationsWidth: 20,
                lineNumbersMinChars: 3,
                renderWhitespace: 'selection',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                mouseWheelZoom: true,
                contextmenu: true,
                quickSuggestions: enableCodeCompletion,
                suggestOnTriggerCharacters: enableCodeCompletion,
                acceptSuggestionOnEnter: enableCodeCompletion ? 'on' : 'off',
                bracketPairColorization: { enabled: true },
                guides: {
                  bracketPairs: true,
                  indentation: true
                }
              }}
              height="100%"
              width="100%"
            />

            {/* Parser Loading Indicator */}
            {isParserLoading && language === 'openscad' && (
              <div className="absolute top-2 left-2 z-20">
                <div className="bg-blue-900/80 backdrop-blur-sm border border-blue-500/50 rounded-lg px-2 py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-blue-400 text-xs">Loading OpenSCAD Parser...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Syntax Errors Display */}
            {showSyntaxErrors && parseResult?.errors && parseResult.errors.length > 0 && (
              <ErrorDisplay
                errors={parseResult.errors}
                onErrorClick={handleErrorClick}
              />
            )}

            {/* Parser Status Indicator */}
            {language === 'openscad' && enableASTParsing && parser && !isParserLoading && (
              <div className="absolute bottom-2 right-2 z-20">
                <div className="bg-green-900/80 backdrop-blur-sm border border-green-500/50 rounded-lg px-2 py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-green-400 text-xs">OpenSCAD Parser ready</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

CodeEditor.displayName = 'CodeEditor';

// ============================================================================
// Default Export
// ============================================================================

export default CodeEditor;
