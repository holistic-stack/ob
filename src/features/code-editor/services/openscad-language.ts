/**
 * OpenSCAD Language Configuration for Monaco Editor
 *
 * Comprehensive language definition for OpenSCAD syntax highlighting,
 * auto-completion, and language features in Monaco Editor.
 */

import * as monaco from 'monaco-editor';
import { createLogger } from '../../../shared/services/logger.service.js';
import { tryCatch } from '../../../shared/utils/functional/result.js';
import type { OpenSCADLanguageConfig } from '../types/editor.types.js';

const logger = createLogger('OpenSCADLanguage');

/**
 * OpenSCAD language configuration
 */
export const OPENSCAD_LANGUAGE_CONFIG: OpenSCADLanguageConfig = {
  keywords: [
    // Control structures
    'if',
    'else',
    'for',
    'intersection_for',
    'let',
    'assign',
    // Module definition
    'module',
    'function',
    'use',
    'include',
    // Special variables
    'undef',
    'true',
    'false',
    // Echo and assert
    'echo',
    'assert',
  ],
  operators: [
    '=',
    '==',
    '!=',
    '<',
    '<=',
    '>',
    '>=',
    '+',
    '-',
    '*',
    '/',
    '%',
    '^',
    '&&',
    '||',
    '!',
    '?',
    ':',
    '[',
    ']',
    '(',
    ')',
    '{',
    '}',
    ',',
    ';',
  ],
  builtinFunctions: [
    // Math functions
    'abs',
    'acos',
    'asin',
    'atan',
    'atan2',
    'ceil',
    'cos',
    'exp',
    'floor',
    'ln',
    'log',
    'max',
    'min',
    'pow',
    'rands',
    'round',
    'sign',
    'sin',
    'sqrt',
    'tan',
    // String functions
    'str',
    'len',
    'search',
    'substr',
    // Vector functions
    'concat',
    'cross',
    'norm',
    'normalize',
    // List functions
    'reverse',
    'sort',
    // Type functions
    'is_undef',
    'is_bool',
    'is_num',
    'is_string',
    'is_list',
  ],
  builtinModules: [
    // 2D primitives
    'circle',
    'square',
    'polygon',
    'text',
    'import',
    // 3D primitives
    'cube',
    'sphere',
    'cylinder',
    'polyhedron',
    'surface',
    // Transformations
    'translate',
    'rotate',
    'scale',
    'resize',
    'mirror',
    'multmatrix',
    'color',
    'offset',
    'hull',
    'minkowski',
    // Boolean operations
    'union',
    'difference',
    'intersection',
    // Extrusion
    'linear_extrude',
    'rotate_extrude',
    // Projection
    'projection',
    // Children
    'children',
  ],
  constants: [
    // Mathematical constants
    'PI',
    'E',
    // Special values
    '$fa',
    '$fs',
    '$fn',
    '$t',
    '$vpr',
    '$vpt',
    '$vpd',
    '$vpf',
    '$children',
  ],
};

/**
 * Monaco language configuration for OpenSCAD
 */
export const MONACO_LANGUAGE_CONFIG: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  folding: {
    markers: {
      start: /^\s*\/\/\s*#?region\b/,
      end: /^\s*\/\/\s*#?endregion\b/,
    },
  },
};

/**
 * Monaco tokenizer for OpenSCAD syntax highlighting
 */
export const MONACO_TOKENIZER: monaco.languages.IMonarchLanguage = {
  defaultToken: 'invalid',
  tokenPostfix: '.scad',

  keywords: OPENSCAD_LANGUAGE_CONFIG.keywords,
  builtinFunctions: OPENSCAD_LANGUAGE_CONFIG.builtinFunctions,
  builtinModules: OPENSCAD_LANGUAGE_CONFIG.builtinModules,
  constants: OPENSCAD_LANGUAGE_CONFIG.constants,
  operators: OPENSCAD_LANGUAGE_CONFIG.operators,

  // Common regular expressions
  symbols: /[=><!~?:&|+\-*\\/^%]+/,
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      // Identifiers and keywords
      [
        /[a-z_$][\w$]*/,
        {
          cases: {
            '@keywords': 'keyword',
            '@builtinFunctions': 'predefined',
            '@builtinModules': 'type',
            '@constants': 'constant',
            '@default': 'identifier',
          },
        },
      ],

      // Whitespace
      { include: '@whitespace' },

      // Delimiters and operators
      [/[{}()[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [
        /@symbols/,
        {
          cases: {
            '@operators': 'operator',
            '@default': '',
          },
        },
      ],

      // Numbers
      [/\d*\.\d+([eE][+-]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],

      // Delimiter: after number because of .\d floats
      [/[;,.]/, 'delimiter'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-terminated string
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

      // Characters
      [/'[^\\']'/, 'string'],
      [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
      [/'/, 'string.invalid'],
    ],

    comment: [
      [/[^/*]+/, 'comment'],
      [/\/\*/, 'comment', '@push'], // nested comment
      [/\*\//, 'comment', '@pop'],
      [/[/*]/, 'comment'],
    ],

    string: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],
  },
};

/**
 * Register OpenSCAD language with Monaco Editor
 */
export const registerOpenSCADLanguage = (monaco: typeof import('monaco-editor')) => {
  return tryCatch(
    () => {
      // Register the language
      monaco.languages.register({
        id: 'openscad',
        extensions: ['.scad'],
        aliases: ['OpenSCAD', 'openscad'],
        mimetypes: ['text/x-openscad'],
      });

      // Set language configuration
      monaco.languages.setLanguageConfiguration('openscad', MONACO_LANGUAGE_CONFIG);

      // Set tokenizer for syntax highlighting
      monaco.languages.setMonarchTokensProvider('openscad', MONACO_TOKENIZER);

      logger.init('OpenSCAD language registered successfully');

      return undefined;
    },
    (err) =>
      `Failed to register OpenSCAD language: ${err instanceof Error ? err.message : String(err)}`
  );
};

/**
 * Create completion provider for OpenSCAD
 */
export const createOpenSCADCompletionProvider = (): monaco.languages.CompletionItemProvider => ({
  provideCompletionItems: (model, position) => {
    const word = model.getWordUntilPosition(position);
    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn,
    };

    const suggestions: monaco.languages.CompletionItem[] = [];

    // Add keyword suggestions
    OPENSCAD_LANGUAGE_CONFIG.keywords.forEach((keyword) => {
      suggestions.push({
        label: keyword,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: keyword,
        range,
      });
    });

    // Add builtin function suggestions
    OPENSCAD_LANGUAGE_CONFIG.builtinFunctions.forEach((func) => {
      suggestions.push({
        label: func,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: `${func}()`,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      });
    });

    // Add builtin module suggestions
    OPENSCAD_LANGUAGE_CONFIG.builtinModules.forEach((module) => {
      suggestions.push({
        label: module,
        kind: monaco.languages.CompletionItemKind.Module,
        insertText: `${module}()`,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      });
    });

    // Add constant suggestions
    OPENSCAD_LANGUAGE_CONFIG.constants.forEach((constant) => {
      suggestions.push({
        label: constant,
        kind: monaco.languages.CompletionItemKind.Constant,
        insertText: constant,
        range,
      });
    });

    return { suggestions };
  },
});

/**
 * Register OpenSCAD completion provider
 */
export const registerOpenSCADCompletionProvider = (monaco: typeof import('monaco-editor')) => {
  return tryCatch(
    () => {
      const provider = createOpenSCADCompletionProvider();
      const disposable = monaco.languages.registerCompletionItemProvider('openscad', provider);

      logger.init('OpenSCAD completion provider registered successfully');

      return disposable;
    },
    (err) =>
      `Failed to register OpenSCAD completion provider: ${err instanceof Error ? err.message : String(err)}`
  );
};
