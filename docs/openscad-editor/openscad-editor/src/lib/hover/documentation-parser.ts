/**
 * @file Documentation Parser for OpenSCAD Hover Information
 * 
 * Provides advanced parsing and formatting of documentation comments
 * including JSDoc-style tags, parameter descriptions, and examples.
 * 
 * Features:
 * - JSDoc tag parsing (@param, @returns, @example, etc.)
 * - Markdown formatting and sanitization
 * - Code example extraction and formatting
 * - Parameter documentation generation
 * - Type information parsing
 * - Functional programming patterns with immutable data
 * 
 * @example
 * ```typescript
 * const parser = new DocumentationParser();
 * const parsed = parser.parseDocumentation(docString);
 * const markdown = parser.formatAsMarkdown(parsed);
 * ```
 */

// Types for documentation parsing
export interface ParsedDocumentation {
  readonly summary: string;
  readonly description: string;
  readonly parameters: ReadonlyArray<ParameterDoc>;
  readonly returns?: ReturnDoc;
  readonly examples: ReadonlyArray<ExampleDoc>;
  readonly seeAlso: ReadonlyArray<string>;
  readonly since?: string;
  readonly deprecated?: string;
  readonly tags: ReadonlyMap<string, ReadonlyArray<string>>;
}

export interface ParameterDoc {
  readonly name: string;
  readonly type?: string;
  readonly description: string;
  readonly optional: boolean;
  readonly defaultValue?: string;
}

export interface ReturnDoc {
  readonly type?: string;
  readonly description: string;
}

export interface ExampleDoc {
  readonly title?: string;
  readonly code: string;
  readonly description?: string;
}

export interface DocumentationOptions {
  readonly parseJSDoc: boolean;
  readonly includeExamples: boolean;
  readonly maxExamples: number;
  readonly sanitizeHtml: boolean;
  readonly preserveWhitespace: boolean;
}

/**
 * Advanced documentation parser for OpenSCAD comments
 */
export class DocumentationParser {
  private readonly defaultOptions: DocumentationOptions = {
    parseJSDoc: true,
    includeExamples: true,
    maxExamples: 5,
    sanitizeHtml: true,
    preserveWhitespace: false
  };

  constructor(private readonly options: Partial<DocumentationOptions> = {}) {}

  /**
   * Parse documentation string into structured format
   * 
   * @param docString - Raw documentation string
   * @returns Parsed documentation structure
   */
  parseDocumentation(docString: string): ParsedDocumentation {
    const opts = { ...this.defaultOptions, ...this.options };

    if (!docString || docString.trim().length === 0) {
      return this.createEmptyDocumentation();
    }

    // Check if the string contains JSDoc tags to determine cleaning strategy
    const hasJSDocTags = /@\w+/.test(docString);

    // Clean and normalize the documentation string
    const cleaned = this.cleanDocumentationString(docString, opts, hasJSDocTags);

    if (!opts.parseJSDoc) {
      return {
        summary: cleaned,
        description: cleaned,
        parameters: [],
        examples: [],
        seeAlso: [],
        tags: new Map()
      };
    }

    // Parse JSDoc tags
    const sections = this.splitIntoSections(cleaned);

    const parsedReturns = this.parseReturns(sections.tags.get('returns') || sections.tags.get('return'));

    return {
      summary: this.extractSummary(sections.main),
      description: this.extractDescription(sections.main),
      parameters: this.parseParameters(sections.tags.get('param') || []),
      ...(parsedReturns && { returns: parsedReturns }),
      examples: this.parseExamples(sections.tags.get('example') || [], opts.maxExamples),
      seeAlso: sections.tags.get('see') || [],
      ...(sections.tags.get('since')?.[0] && { since: sections.tags.get('since')![0] }),
      ...(sections.tags.get('deprecated')?.[0] && { deprecated: sections.tags.get('deprecated')![0] }),
      tags: sections.tags
    };
  }

  /**
   * Format parsed documentation as Monaco-compatible markdown
   * 
   * @param parsed - Parsed documentation structure
   * @returns Formatted markdown string
   */
  formatAsMarkdown(parsed: ParsedDocumentation): string {
    const parts: string[] = [];

    // Summary and description
    if (parsed.summary) {
      parts.push(parsed.summary);
    }
    
    if (parsed.description && parsed.description !== parsed.summary) {
      parts.push('', parsed.description);
    }

    // Parameters
    if (parsed.parameters.length > 0) {
      parts.push('', '**Parameters:**', '');
      for (const param of parsed.parameters) {
        let paramLine = `- **${param.name}**`;
        
        if (param.type) {
          paramLine += ` (\`${param.type}\`)`;
        }
        
        if (param.defaultValue) {
          paramLine += ` = \`${param.defaultValue}\``;
        }
        
        if (param.optional) {
          paramLine += ' *(optional)*';
        }
        
        if (param.description) {
          paramLine += `: ${param.description}`;
        }
        
        parts.push(paramLine);
      }
    }

    // Returns
    if (parsed.returns) {
      parts.push('', '**Returns:**');
      let returnLine = '';
      
      if (parsed.returns.type) {
        returnLine += `\`${parsed.returns.type}\` `;
      }
      
      returnLine += parsed.returns.description;
      parts.push(returnLine);
    }

    // Examples
    if (parsed.examples.length > 0) {
      parts.push('', '**Examples:**', '');
      for (const example of parsed.examples) {
        if (example.title) {
          parts.push(`*${example.title}*`);
        }
        
        parts.push('```openscad', example.code.trim(), '```');
        
        if (example.description) {
          parts.push(example.description);
        }
        
        parts.push('');
      }
    }

    // See also
    if (parsed.seeAlso.length > 0) {
      parts.push('**See also:** ' + parsed.seeAlso.join(', '));
    }

    // Deprecated warning
    if (parsed.deprecated) {
      parts.unshift(`⚠️ **Deprecated:** ${parsed.deprecated}`, '');
    }

    return parts.join('\n').trim();
  }

  /**
   * Extract parameter information from function/module signature
   * 
   * @param signature - Function or module signature
   * @returns Array of parameter information
   */
  extractParametersFromSignature(signature: string): ParameterDoc[] {
    // Find the parameter list with proper parentheses matching
    const openParen = signature.indexOf('(');
    if (openParen === -1) {
      return [];
    }

    let depth = 0;
    let closeParen = -1;

    for (let i = openParen; i < signature.length; i++) {
      if (signature[i] === '(') {
        depth++;
      } else if (signature[i] === ')') {
        depth--;
        if (depth === 0) {
          closeParen = i;
          break;
        }
      }
    }

    if (closeParen === -1) {
      return [];
    }

    const paramString = signature.substring(openParen + 1, closeParen).trim();
    if (!paramString) {
      return [];
    }

    const params = this.splitParameters(paramString);

    return params.map(param => this.parseParameterSignature(param.trim()));
  }

  /**
   * Private utility methods
   */

  private createEmptyDocumentation(): ParsedDocumentation {
    return {
      summary: '',
      description: '',
      parameters: [],
      examples: [],
      seeAlso: [],
      tags: new Map()
    };
  }

  private cleanDocumentationString(docString: string, options: DocumentationOptions, hasJSDocTags: boolean = false): string {
    let cleaned = docString;

    // Remove comment markers
    cleaned = cleaned.replace(/^\s*\/\*\*?|\*\/\s*$/g, '');
    cleaned = cleaned.replace(/^\s*\*\s?/gm, '');
    cleaned = cleaned.replace(/^\s*\/\/\s?/gm, '');

    // Normalize whitespace
    if (!options.preserveWhitespace) {
      if (hasJSDocTags) {
        // Preserve line breaks for JSDoc parsing but clean up spacing
        cleaned = cleaned.replace(/[ \t]+/g, ' ');
        // Remove empty lines but keep single line breaks
        cleaned = cleaned.replace(/\n\s*\n/g, '\n');
        // Trim each line
        cleaned = cleaned.split('\n').map(line => line.trim()).join('\n').trim();
      } else {
        // Collapse all whitespace for simple descriptions
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
      }
    }

    // Sanitize HTML if requested
    if (options.sanitizeHtml) {
      cleaned = this.sanitizeHtml(cleaned);
    }

    return cleaned;
  }

  private sanitizeHtml(text: string): string {
    // Remove potentially dangerous HTML tags
    return text
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>/gi, '')
      .replace(/javascript:/gi, '');
  }

  private splitIntoSections(text: string): { main: string; tags: Map<string, string[]> } {
    const tags = new Map<string, string[]>();
    const lines = text.split('\n');
    const mainLines: string[] = [];
    
    let currentTag: string | null = null;
    let currentTagContent: string[] = [];

    for (const line of lines) {
      const tagMatch = line.match(/^\s*@(\w+)\s*(.*)/);
      
      if (tagMatch) {
        // Save previous tag
        if (currentTag && currentTagContent.length > 0) {
          if (!tags.has(currentTag)) {
            tags.set(currentTag, []);
          }
          tags.get(currentTag)!.push(currentTagContent.join('\n').trim());
        }
        
        // Start new tag
        currentTag = tagMatch[1] || '';
        currentTagContent = [tagMatch[2] || ''];
      } else if (currentTag) {
        // Continue current tag
        currentTagContent.push(line);
      } else {
        // Main content
        mainLines.push(line);
      }
    }

    // Save last tag
    if (currentTag && currentTagContent.length > 0) {
      if (!tags.has(currentTag)) {
        tags.set(currentTag, []);
      }
      tags.get(currentTag)!.push(currentTagContent.join('\n').trim());
    }

    return {
      main: mainLines.join('\n').trim(),
      tags
    };
  }

  private extractSummary(mainText: string): string {
    const firstLine = mainText.split('\n')[0];
    return firstLine ? firstLine.trim() : '';
  }

  private extractDescription(mainText: string): string {
    return mainText.trim();
  }

  private parseParameters(paramTags: string[]): ParameterDoc[] {
    return paramTags.map(tag => this.parseParameterTag(tag));
  }

  private parseParameterTag(tag: string): ParameterDoc {
    // Parse: @param {type} name description
    // or: @param name description
    const match = tag.match(/^(?:\{([^}]+)\}\s+)?(\w+)\s*(.*)/);
    
    if (!match) {
      return {
        name: 'unknown',
        description: tag,
        optional: false
      };
    }

    const [, type, name, description] = match;
    const desc = description || '';

    return {
      name: name || 'unknown',
      ...(type && { type }),
      description: desc.trim(),
      optional: desc.includes('optional') || desc.includes('(optional)')
    };
  }

  private parseReturns(returnTags?: string[]): ReturnDoc | undefined {
    if (!returnTags || returnTags.length === 0) {
      return undefined;
    }

    const tag = returnTags[0];
    if (!tag) {
      return undefined;
    }

    const match = tag.match(/^(?:\{([^}]+)\}\s+)?(.*)/);

    if (!match) {
      return { description: tag };
    }

    const [, type, description] = match;
    const desc = description || '';

    return {
      ...(type && { type }),
      description: desc.trim()
    };
  }

  private parseExamples(exampleTags: string[], maxExamples: number): ExampleDoc[] {
    const examples = exampleTags.slice(0, maxExamples);
    
    return examples.map(tag => {
      // Check if example has a title
      const lines = tag.split('\n');
      const firstLine = lines[0]?.trim() || '';

      // If first line looks like a title (short and doesn't contain code)
      if (firstLine.length < 50 && !firstLine.includes('(') && !firstLine.includes(';')) {
        return {
          title: firstLine,
          code: lines.slice(1).join('\n').trim()
        };
      }

      return {
        code: tag.trim()
      };
    });
  }

  private splitParameters(paramString: string): string[] {
    const params: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    
    for (let i = 0; i < paramString.length; i++) {
      const char = paramString[i];
      
      if (char === '"' && paramString[i - 1] !== '\\') {
        inString = !inString;
      }
      
      if (!inString) {
        if (char === '(' || char === '[') {
          depth++;
        } else if (char === ')' || char === ']') {
          depth--;
        } else if (char === ',' && depth === 0) {
          params.push(current.trim());
          current = '';
          continue;
        }
      }
      
      current += char;
    }
    
    if (current.trim()) {
      params.push(current.trim());
    }
    
    return params;
  }

  private parseParameterSignature(param: string): ParameterDoc {
    // Parse: type name = defaultValue
    // or: name = defaultValue
    // or: name

    // Handle complex default values with nested parentheses
    const equalIndex = param.indexOf('=');
    if (equalIndex !== -1) {
      const beforeEqual = param.substring(0, equalIndex).trim();
      const afterEqual = param.substring(equalIndex + 1).trim();

      // Parse the part before '=' for type and name
      const beforeMatch = beforeEqual.match(/^(?:(\w+)\s+)?(\w+)$/);
      if (beforeMatch) {
        const [, type, name] = beforeMatch;
        return {
          name: name || beforeEqual,
          ...(type && { type }),
          description: '',
          optional: true,
          defaultValue: afterEqual
        };
      }
    }

    // No default value, try to parse type and name
    const match = param.match(/^(?:(\w+)\s+)?(\w+)$/);

    if (!match) {
      return {
        name: param,
        description: '',
        optional: false
      };
    }

    const [, type, name] = match;

    return {
      name: name || param,
      ...(type && { type }),
      description: '',
      optional: false
    };
  }
}

/**
 * Utility functions for documentation parsing
 */

/**
 * Create a documentation parser with default options
 */
export function createDocumentationParser(options: Partial<DocumentationOptions> = {}): DocumentationParser {
  return new DocumentationParser(options);
}

/**
 * Quick parse function for simple documentation
 */
export function parseDocumentation(docString: string): ParsedDocumentation {
  const parser = new DocumentationParser();
  return parser.parseDocumentation(docString);
}

/**
 * Quick format function for markdown output
 */
export function formatDocumentationAsMarkdown(docString: string): string {
  const parser = new DocumentationParser();
  const parsed = parser.parseDocumentation(docString);
  return parser.formatAsMarkdown(parsed);
}

/**
 * Default documentation options
 */
export const DEFAULT_DOCUMENTATION_OPTIONS: DocumentationOptions = {
  parseJSDoc: true,
  includeExamples: true,
  maxExamples: 5,
  sanitizeHtml: true,
  preserveWhitespace: false
};
