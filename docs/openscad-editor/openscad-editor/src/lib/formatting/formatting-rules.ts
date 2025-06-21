/**
 * OpenSCAD Formatting Rules
 * 
 * Defines formatting rules and preferences for OpenSCAD code.
 */

export interface FormattingOptions {
  // Indentation
  indentSize: number;
  useSpaces: boolean;
  
  // Spacing
  insertSpaceAfterComma: boolean;
  insertSpaceAfterSemicolon: boolean;
  insertSpaceAroundOperators: boolean;
  insertSpaceAfterKeywords: boolean;
  insertSpaceBeforeParentheses: boolean;
  insertSpaceInsideParentheses: boolean;
  insertSpaceInsideBrackets: boolean;
  insertSpaceInsideBraces: boolean;
  
  // Line breaks
  insertNewLineAfterOpenBrace: boolean;
  insertNewLineBeforeCloseBrace: boolean;
  insertNewLineAfterSemicolon: boolean;
  maxLineLength: number;
  
  // Comments
  preserveComments: boolean;
  alignComments: boolean;
  
  // Specific OpenSCAD formatting
  alignModuleParameters: boolean;
  alignFunctionParameters: boolean;
  alignVectorElements: boolean;
  indentBlockStatements: boolean;
  formatControlStatements: boolean;
}

export const DEFAULT_FORMATTING_OPTIONS: FormattingOptions = {
  // Indentation
  indentSize: 2,
  useSpaces: true,
  
  // Spacing
  insertSpaceAfterComma: true,
  insertSpaceAfterSemicolon: true,
  insertSpaceAroundOperators: true,
  insertSpaceAfterKeywords: true,
  insertSpaceBeforeParentheses: false,
  insertSpaceInsideParentheses: false,
  insertSpaceInsideBrackets: false,
  insertSpaceInsideBraces: true,
  
  // Line breaks
  insertNewLineAfterOpenBrace: true,
  insertNewLineBeforeCloseBrace: true,
  insertNewLineAfterSemicolon: false,
  maxLineLength: 80,
  
  // Comments
  preserveComments: true,
  alignComments: false,
  
  // Specific OpenSCAD formatting
  alignModuleParameters: true,
  alignFunctionParameters: true,
  alignVectorElements: false,
  indentBlockStatements: true,
  formatControlStatements: true
};

export interface FormattingRule {
  name: string;
  description: string;
  apply: (text: string, options: FormattingOptions) => string;
}

export const OPENSCAD_FORMATTING_RULES: FormattingRule[] = [
  {
    name: 'normalize-whitespace',
    description: 'Normalize whitespace and remove extra spaces',
    apply: (text: string, options: FormattingOptions) => {
      // Remove multiple consecutive spaces (except in strings)
      let result = text;
      
      // Basic whitespace normalization
      result = result.replace(/[ \t]+/g, ' ');
      result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      return result;
    }
  },
  
  {
    name: 'space-around-operators',
    description: 'Add spaces around operators',
    apply: (text: string, options: FormattingOptions) => {
      if (!options.insertSpaceAroundOperators) return text;
      
      let result = text;
      
      // Add spaces around binary operators
      const operators = ['+', '-', '*', '/', '%', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '='];
      
      for (const op of operators) {
        const regex = new RegExp(`\\s*\\${op.split('').join('\\\\')}\\s*`, 'g');
        result = result.replace(regex, ` ${op} `);
      }
      
      return result;
    }
  },
  
  {
    name: 'space-after-comma',
    description: 'Add space after commas',
    apply: (text: string, options: FormattingOptions) => {
      if (!options.insertSpaceAfterComma) return text;
      
      // Add space after comma (but not inside strings)
      return text.replace(/,(?!\s)/g, ', ');
    }
  },
  
  {
    name: 'space-after-semicolon',
    description: 'Add space after semicolons',
    apply: (text: string, options: FormattingOptions) => {
      if (!options.insertSpaceAfterSemicolon) return text;
      
      // Add space after semicolon (but not at end of line)
      return text.replace(/;(?!\s|$)/g, '; ');
    }
  },
  
  {
    name: 'space-after-keywords',
    description: 'Add space after control keywords',
    apply: (text: string, options: FormattingOptions) => {
      if (!options.insertSpaceAfterKeywords) return text;
      
      const keywords = ['if', 'else', 'for', 'while', 'module', 'function'];
      let result = text;
      
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\s*\\(`, 'g');
        result = result.replace(regex, `${keyword} (`);
      }
      
      return result;
    }
  },
  
  {
    name: 'brace-formatting',
    description: 'Format braces and blocks',
    apply: (text: string, options: FormattingOptions) => {
      let result = text;
      
      if (options.insertNewLineAfterOpenBrace) {
        // Ensure newline after opening brace
        result = result.replace(/\{\s*(?!\n)/g, '{\n');
      }
      
      if (options.insertNewLineBeforeCloseBrace) {
        // Ensure newline before closing brace
        result = result.replace(/(?<!\n)\s*\}/g, '\n}');
      }
      
      if (options.insertSpaceInsideBraces) {
        // Add space inside braces for inline blocks
        result = result.replace(/\{(?!\n)(\S)/g, '{ $1');
        result = result.replace(/(\S)(?<!\n)\}/g, '$1 }');
      }
      
      return result;
    }
  },
  
  {
    name: 'parentheses-formatting',
    description: 'Format parentheses spacing',
    apply: (text: string, options: FormattingOptions) => {
      let result = text;
      
      if (options.insertSpaceInsideParentheses) {
        // Add space inside parentheses
        result = result.replace(/\((\S)/g, '( $1');
        result = result.replace(/(\S)\)/g, '$1 )');
      } else {
        // Remove space inside parentheses
        result = result.replace(/\(\s+/g, '(');
        result = result.replace(/\s+\)/g, ')');
      }
      
      return result;
    }
  },
  
  {
    name: 'bracket-formatting',
    description: 'Format bracket spacing',
    apply: (text: string, options: FormattingOptions) => {
      let result = text;
      
      if (options.insertSpaceInsideBrackets) {
        // Add space inside brackets
        result = result.replace(/\[(\S)/g, '[ $1');
        result = result.replace(/(\S)\]/g, '$1 ]');
      } else {
        // Remove space inside brackets
        result = result.replace(/\[\s+/g, '[');
        result = result.replace(/\s+\]/g, ']');
      }
      
      return result;
    }
  },
  
  {
    name: 'vector-formatting',
    description: 'Format vector and array elements',
    apply: (text: string, options: FormattingOptions) => {
      if (!options.alignVectorElements) return text;
      
      // Format vectors and arrays with proper spacing
      let result = text;
      
      // Handle simple vectors like [1, 2, 3]
      result = result.replace(/\[\s*([^[\]]+)\s*\]/g, (match, content) => {
        const elements = content.split(',').map((el: string) => el.trim());
        return `[${elements.join(', ')}]`;
      });
      
      return result;
    }
  },
  
  {
    name: 'module-parameter-formatting',
    description: 'Format module parameters',
    apply: (text: string, options: FormattingOptions) => {
      if (!options.alignModuleParameters) return text;
      
      // Format module parameters with proper alignment
      return text.replace(/module\s+(\w+)\s*\(([^)]*)\)/g, (match, name, params) => {
        if (!params.trim()) return match;
        
        const paramList = params.split(',').map((p: string) => p.trim());
        if (paramList.length <= 3) {
          // Keep short parameter lists on one line
          return `module ${name}(${paramList.join(', ')})`;
        } else {
          // Multi-line for long parameter lists
          const indentedParams = paramList.map((p: string) => `  ${p}`).join(',\n');
          return `module ${name}(\n${indentedParams}\n)`;
        }
      });
    }
  },
  
  {
    name: 'function-parameter-formatting',
    description: 'Format function parameters',
    apply: (text: string, options: FormattingOptions) => {
      if (!options.alignFunctionParameters) return text;
      
      // Format function parameters similar to modules
      return text.replace(/function\s+(\w+)\s*\(([^)]*)\)/g, (match, name, params) => {
        if (!params.trim()) return match;
        
        const paramList = params.split(',').map((p: string) => p.trim());
        if (paramList.length <= 3) {
          return `function ${name}(${paramList.join(', ')})`;
        } else {
          const indentedParams = paramList.map((p: string) => `  ${p}`).join(',\n');
          return `function ${name}(\n${indentedParams}\n)`;
        }
      });
    }
  }
];

export function applyFormattingRules(
  text: string, 
  options: FormattingOptions = DEFAULT_FORMATTING_OPTIONS
): string {
  let result = text;
  
  // Apply all formatting rules in order
  for (const rule of OPENSCAD_FORMATTING_RULES) {
    try {
      result = rule.apply(result, options);
    } catch (error) {
      console.warn(`Formatting rule '${rule.name}' failed:`, error);
    }
  }
  
  return result;
}
