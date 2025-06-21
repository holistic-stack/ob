/**
 * @file Enhanced Bracket Matching for OpenSCAD
 * 
 * Provides intelligent bracket matching and auto-closing functionality
 * specifically designed for OpenSCAD syntax patterns.
 * 
 * @example
 * ```typescript
 * const bracketConfig = createOpenSCADBracketConfig();
 * monaco.languages.setLanguageConfiguration('openscad', bracketConfig);
 * ```
 */

import * as monaco from 'monaco-editor';

/**
 * OpenSCAD-specific bracket pairs
 */
export interface OpenSCADBracketPair {
  readonly open: string;
  readonly close: string;
  readonly notIn?: string[];
}

/**
 * Auto-closing pair configuration
 */
export interface OpenSCADAutoClosingPair extends OpenSCADBracketPair {
  readonly notIn?: string[];
}

/**
 * Surrounding pair configuration for text selection
 */
export type OpenSCADSurroundingPair = OpenSCADBracketPair;

/**
 * Enhanced language configuration for OpenSCAD
 */
export interface OpenSCADLanguageConfiguration extends monaco.languages.LanguageConfiguration {
  readonly brackets: [string, string][];
  readonly autoClosingPairs: OpenSCADAutoClosingPair[];
  readonly surroundingPairs: OpenSCADSurroundingPair[];
  readonly colorizedBracketPairs?: [string, string][];
}

/**
 * OpenSCAD bracket pairs with context awareness
 */
export const OPENSCAD_BRACKET_PAIRS: OpenSCADBracketPair[] = [
  // Standard brackets
  { open: '{', close: '}' },
  { open: '[', close: ']' },
  { open: '(', close: ')' },
  
  // String delimiters
  { open: '"', close: '"', notIn: ['string', 'comment'] },
  { open: "'", close: "'", notIn: ['string', 'comment'] },
  
  // Comment delimiters
  { open: '/*', close: '*/', notIn: ['string'] },
  
  // OpenSCAD-specific constructs
  { open: '<', close: '>', notIn: ['string', 'comment'] }, // For vector operations
];

/**
 * Auto-closing pairs with enhanced context awareness
 */
export const OPENSCAD_AUTO_CLOSING_PAIRS: OpenSCADAutoClosingPair[] = [
  // Structural brackets - always auto-close
  { open: '{', close: '}' },
  { open: '[', close: ']' },
  { open: '(', close: ')' },
  
  // String delimiters - don't auto-close inside strings or comments
  { open: '"', close: '"', notIn: ['string', 'comment'] },
  { open: "'", close: "'", notIn: ['string', 'comment'] },
  
  // Comment blocks - don't auto-close inside strings
  { open: '/*', close: '*/', notIn: ['string'] },
  
  // OpenSCAD-specific auto-closing
  { open: '<', close: '>', notIn: ['string', 'comment'] },
];

/**
 * Surrounding pairs for text selection
 */
export const OPENSCAD_SURROUNDING_PAIRS: OpenSCADSurroundingPair[] = [
  { open: '{', close: '}' },
  { open: '[', close: ']' },
  { open: '(', close: ')' },
  { open: '"', close: '"' },
  { open: "'", close: "'" },
  { open: '<', close: '>' },
];

/**
 * Colorized bracket pairs for enhanced visual feedback
 */
export const OPENSCAD_COLORIZED_BRACKET_PAIRS: [string, string][] = [
  ['{', '}'],
  ['[', ']'],
  ['(', ')'],
  ['<', '>'],
];

/**
 * Create enhanced language configuration for OpenSCAD
 */
export function createOpenSCADLanguageConfiguration(): OpenSCADLanguageConfiguration {
  return {
    // Comment configuration
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/']
    },
    
    // Bracket configuration
    brackets: OPENSCAD_BRACKET_PAIRS.map(pair => [pair.open, pair.close] as [string, string]),
    
    // Auto-closing pairs
    autoClosingPairs: OPENSCAD_AUTO_CLOSING_PAIRS,
    
    // Surrounding pairs
    surroundingPairs: OPENSCAD_SURROUNDING_PAIRS,
    
    // Colorized bracket pairs
    colorizedBracketPairs: OPENSCAD_COLORIZED_BRACKET_PAIRS,
    
    // Word pattern for OpenSCAD identifiers
    wordPattern: /(-?\d*\.\d\w*)|([^`~!@#%^&*()=+[\]{}\\|;:'",./<>??\s]+)/g,
    
    // Indentation rules
    indentationRules: {
      increaseIndentPattern: /^(.*\{[^}]*|\s*\().*$/,
      decreaseIndentPattern: /^(.*\}|\s*\)).*$/,
      indentNextLinePattern: /^.*\{[^}]*$/,
      unIndentedLinePattern: /^(\s*\/\/.*|\s*\/\*.*\*\/\s*)?$/
    },
    
    // On enter rules for smart indentation
    onEnterRules: [
      {
        // Increase indent after opening braces
        beforeText: /^\s*.*\{\s*$/,
        action: { indentAction: monaco.languages.IndentAction.Indent }
      },
      {
        // Decrease indent before closing braces
        beforeText: /^\s*\}\s*$/,
        action: { indentAction: monaco.languages.IndentAction.Outdent }
      },
      {
        // Smart indentation for function/module parameters
        beforeText: /^\s*.*\(\s*$/,
        action: { indentAction: monaco.languages.IndentAction.Indent }
      },
      {
        // Handle closing parentheses
        beforeText: /^\s*\)\s*$/,
        action: { indentAction: monaco.languages.IndentAction.Outdent }
      },
      {
        // Continue line comments
        beforeText: /^\s*\/\/.*$/,
        action: { 
          indentAction: monaco.languages.IndentAction.None,
          appendText: '// '
        }
      },
      {
        // Handle block comments
        beforeText: /^\s*\/\*.*$/,
        afterText: /^\s*\*\/$/,
        action: { 
          indentAction: monaco.languages.IndentAction.IndentOutdent,
          appendText: ' * '
        }
      }
    ],
    
    // Folding rules
    folding: {
      markers: {
        start: /^\s*\/\*\s*#region\b/,
        end: /^\s*\/\*\s*#endregion\b/
      }
    }
  };
}

/**
 * Enhanced bracket matching configuration
 */
export interface BracketMatchingConfig {
  readonly enableBracketMatching: boolean;
  readonly enableBracketColorization: boolean;
  readonly enableAutoClosing: boolean;
  readonly enableSurrounding: boolean;
  readonly highlightMatchingBrackets: boolean;
}

/**
 * Default bracket matching configuration
 */
export const DEFAULT_BRACKET_CONFIG: BracketMatchingConfig = {
  enableBracketMatching: true,
  enableBracketColorization: true,
  enableAutoClosing: true,
  enableSurrounding: true,
  highlightMatchingBrackets: true
};

/**
 * Bracket matching service for enhanced functionality
 */
export class OpenSCADBracketMatchingService {
  private readonly config: BracketMatchingConfig;
  private disposables: monaco.IDisposable[] = [];

  constructor(config: Partial<BracketMatchingConfig> = {}) {
    this.config = { ...DEFAULT_BRACKET_CONFIG, ...config };
  }

  /**
   * Register bracket matching with Monaco editor
   */
  registerWithMonaco(
    monaco: typeof import('monaco-editor'),
    languageId: string = 'openscad'
  ): void {
    // Set language configuration
    const languageConfig = this.createLanguageConfiguration();
    monaco.languages.setLanguageConfiguration(languageId, languageConfig);

    // OpenSCAD bracket matching registered successfully
  }

  /**
   * Create language configuration based on current settings
   */
  private createLanguageConfiguration(): monaco.languages.LanguageConfiguration {
    const baseConfig = createOpenSCADLanguageConfiguration();

    // Apply configuration settings by creating a new object
    const result: Partial<monaco.languages.LanguageConfiguration> = {
      ...baseConfig
    };

    if (!this.config.enableAutoClosing) {
      delete result.autoClosingPairs;
    }

    if (!this.config.enableSurrounding) {
      delete result.surroundingPairs;
    }

    if (!this.config.enableBracketColorization) {
      delete result.colorizedBracketPairs;
    }

    return result as monaco.languages.LanguageConfiguration;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<BracketMatchingConfig>): void {
    Object.assign(this.config, newConfig);
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<BracketMatchingConfig> {
    return { ...this.config };
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables = [];
  }
}

/**
 * Create bracket matching service
 */
export function createBracketMatchingService(
  config?: Partial<BracketMatchingConfig>
): OpenSCADBracketMatchingService {
  return new OpenSCADBracketMatchingService(config);
}

/**
 * Utility function to get bracket pair for a given character
 */
export function getBracketPair(character: string): OpenSCADBracketPair | undefined {
  return OPENSCAD_BRACKET_PAIRS.find(
    pair => pair.open === character || pair.close === character
  );
}

/**
 * Check if a character is an opening bracket
 */
export function isOpeningBracket(character: string): boolean {
  return OPENSCAD_BRACKET_PAIRS.some(pair => pair.open === character);
}

/**
 * Check if a character is a closing bracket
 */
export function isClosingBracket(character: string): boolean {
  return OPENSCAD_BRACKET_PAIRS.some(pair => pair.close === character);
}

/**
 * Get the matching bracket for a given character
 */
export function getMatchingBracket(character: string): string | undefined {
  const pair = getBracketPair(character);
  if (!pair) return undefined;
  
  return pair.open === character ? pair.close : pair.open;
}
