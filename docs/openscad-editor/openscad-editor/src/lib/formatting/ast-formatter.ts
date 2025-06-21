/**
 * AST-based Code Formatter for OpenSCAD
 * 
 * Provides intelligent code formatting using the Tree-sitter AST
 * for precise and context-aware formatting decisions.
 */

import type * as TreeSitter from 'web-tree-sitter';
import type { FormattingOptions } from './formatting-rules';
import { DEFAULT_FORMATTING_OPTIONS } from './formatting-rules';

export interface FormatResult {
  text: string;
  success: boolean;
  errors: string[];
  changes: number;
}

export interface FormattedRange {
  startLine: number;
  endLine: number;
  text: string;
}

/**
 * AST-based formatter that uses Tree-sitter for intelligent code formatting
 */
export class ASTFormatter {
  private options: FormattingOptions;

  constructor(options: FormattingOptions = DEFAULT_FORMATTING_OPTIONS) {
    this.options = options;
  }

  /**
   * Format the entire document using AST
   */
  formatDocument(tree: TreeSitter.Tree, sourceText: string): FormatResult {
    try {
      const formatted = this.formatNode(tree.rootNode, sourceText, 0);
      
      const changes = this.countChanges(sourceText, formatted);
      
      return {
        text: formatted,
        success: true,
        errors: [],
        changes
      };
    } catch (error) {
      return {
        text: sourceText,
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown formatting error'],
        changes: 0
      };
    }
  }

  /**
   * Format a specific range of the document
   */
  formatRange(
    tree: TreeSitter.Tree, 
    sourceText: string, 
    startLine: number, 
    endLine: number
  ): FormatResult {
    try {
      // Find nodes that intersect with the range
      const startPos = { row: startLine, column: 0 };
      const endPos = { row: endLine, column: Number.MAX_SAFE_INTEGER };
      
      const nodesToFormat = this.findNodesInRange(tree.rootNode, startPos, endPos);
      
      if (nodesToFormat.length === 0) {
        return {
          text: sourceText,
          success: true,
          errors: [],
          changes: 0
        };
      }

      // Format each node and reconstruct the text
      const lines = sourceText.split('\n');
      let changes = 0;

      for (const node of nodesToFormat) {
        const nodeText = this.getNodeText(node, sourceText);
        const formatted = this.formatNode(node, nodeText, 0);
        
        if (formatted !== nodeText) {
          // Replace the node's text in the source
          const nodeLines = this.replaceNodeInSource(lines, node, formatted);
          changes += this.countChanges(nodeText, formatted);
        }
      }

      return {
        text: lines.join('\n'),
        success: true,
        errors: [],
        changes
      };
    } catch (error) {
      return {
        text: sourceText,
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown formatting error'],
        changes: 0
      };
    }
  }

  /**
   * Format a single node and its children
   */
  private formatNode(node: TreeSitter.Node, sourceText: string, indentLevel: number): string {
    const indent = this.getIndent(indentLevel);
    
    switch (node.type) {
      case 'source_file':
        return this.formatSourceFile(node, sourceText, indentLevel);
      
      case 'module_definition':
        return this.formatModuleDefinition(node, sourceText, indentLevel);
      
      case 'function_definition':
        return this.formatFunctionDefinition(node, sourceText, indentLevel);
      
      case 'assignment':
        return this.formatAssignment(node, sourceText, indentLevel);
      
      case 'module_call':
        return this.formatModuleCall(node, sourceText, indentLevel);
      
      case 'block_statement':
        return this.formatBlockStatement(node, sourceText, indentLevel);
      
      case 'if_statement':
        return this.formatIfStatement(node, sourceText, indentLevel);
      
      case 'for_statement':
        return this.formatForStatement(node, sourceText, indentLevel);
      
      case 'vector':
        return this.formatVector(node, sourceText, indentLevel);
      
      case 'argument_list':
        return this.formatArgumentList(node, sourceText, indentLevel);
      
      case 'parameter_list':
        return this.formatParameterList(node, sourceText, indentLevel);
      
      case 'binary_expression':
        return this.formatBinaryExpression(node, sourceText, indentLevel);
      
      case 'comment':
        return this.formatComment(node, sourceText, indentLevel);
      
      default:
        return this.formatGenericNode(node, sourceText, indentLevel);
    }
  }

  private formatSourceFile(node: TreeSitter.Node, sourceText: string, indentLevel: number): string {
    const result: string[] = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        const formatted = this.formatNode(child, sourceText, indentLevel);
        
        // Add proper spacing between top-level statements
        if (result.length > 0 && this.isTopLevelStatement(child)) {
          result.push('');
        }
        
        result.push(formatted);
      }
    }
    
    return result.join('\n').trim();
  }

  private formatModuleDefinition(node: TreeSitter.Node, sourceText: string, indentLevel: number): string {
    const indent = this.getIndent(indentLevel);
    const parts: string[] = [];
    
    // Format: module name(parameters) body
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) continue;
      
      switch (child.type) {
        case 'module':
          parts.push('module');
          break;
        case 'identifier':
          if (this.options.insertSpaceAfterKeywords) {
            parts.push(` ${child.text}`);
          } else {
            parts.push(child.text);
          }
          break;
        case 'parameter_list':
          const formattedParams = this.formatParameterList(child, sourceText, indentLevel);
          parts.push(formattedParams);
          break;
        case 'block_statement':
          if (this.options.insertNewLineAfterOpenBrace) {
            parts.push(' ');
          }
          const formattedBody = this.formatBlockStatement(child, sourceText, indentLevel);
          parts.push(formattedBody);
          break;
        default:
          parts.push(this.formatNode(child, sourceText, indentLevel));
      }
    }
    
    return indent + parts.join('');
  }

  private formatFunctionDefinition(node: TreeSitter.Node, sourceText: string, indentLevel: number): string {
    const indent = this.getIndent(indentLevel);
    const parts: string[] = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) continue;
      
      switch (child.type) {
        case 'function':
          parts.push('function');
          break;
        case 'identifier':
          if (this.options.insertSpaceAfterKeywords) {
            parts.push(` ${child.text}`);
          } else {
            parts.push(child.text);
          }
          break;
        case 'parameter_list':
          const formattedParams = this.formatParameterList(child, sourceText, indentLevel);
          parts.push(formattedParams);
          break;
        case '=':
          if (this.options.insertSpaceAroundOperators) {
            parts.push(' = ');
          } else {
            parts.push('=');
          }
          break;
        default:
          parts.push(this.formatNode(child, sourceText, indentLevel));
      }
    }
    
    return indent + parts.join('') + ';';
  }

  private formatAssignment(node: TreeSitter.Node, sourceText: string, indentLevel: number): string {
    const indent = this.getIndent(indentLevel);
    const parts: string[] = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) continue;
      
      if (child.type === '=') {
        if (this.options.insertSpaceAroundOperators) {
          parts.push(' = ');
        } else {
          parts.push('=');
        }
      } else {
        parts.push(this.formatNode(child, sourceText, indentLevel));
      }
    }
    
    return indent + parts.join('') + ';';
  }

  private formatModuleCall(node: TreeSitter.Node, sourceText: string, indentLevel: number): string {
    const indent = this.getIndent(indentLevel);
    const parts: string[] = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) continue;
      
      switch (child.type) {
        case 'identifier':
          parts.push(child.text);
          break;
        case 'argument_list':
          const formattedArgs = this.formatArgumentList(child, sourceText, indentLevel);
          parts.push(formattedArgs);
          break;
        case 'block_statement':
          parts.push(' ');
          const formattedBlock = this.formatBlockStatement(child, sourceText, indentLevel);
          parts.push(formattedBlock);
          break;
        default:
          parts.push(this.formatNode(child, sourceText, indentLevel));
      }
    }
    
    let result = parts.join('');
    if (!result.endsWith(';') && !result.includes('{')) {
      result += ';';
    }
    
    return indent + result;
  }

  private formatBlockStatement(node: TreeSitter.Node, sourceText: string, indentLevel: number): string {
    const indent = this.getIndent(indentLevel);
    const childIndent = this.getIndent(indentLevel + 1);
    const result: string[] = [];
    
    // Opening brace
    result.push('{');
    
    if (this.options.insertNewLineAfterOpenBrace) {
      result.push('\n');
    }
    
    // Format child statements
    const statements: string[] = [];
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type !== '{' && child.type !== '}') {
        const formatted = this.formatNode(child, sourceText, indentLevel + 1);
        statements.push(formatted);
      }
    }
    
    if (statements.length > 0) {
      result.push(statements.join('\n'));
      if (this.options.insertNewLineBeforeCloseBrace) {
        result.push('\n');
      }
    }
    
    // Closing brace
    result.push(indent + '}');
    
    return result.join('');
  }

  private formatIfStatement(node: TreeSitter.Node, sourceText: string, indentLevel: number): string {
    const indent = this.getIndent(indentLevel);
    const parts: string[] = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) continue;
      
      switch (child.type) {
        case 'if':
          parts.push('if');
          break;
        case 'else':
          parts.push(' else');
          break;
        case '(':
          if (this.options.insertSpaceAfterKeywords && parts[parts.length - 1] === 'if') {
            parts.push(' (');
          } else {
            parts.push('(');
          }
          break;
        case ')':
          parts.push(')');
          break;
        default:
          const formatted = this.formatNode(child, sourceText, indentLevel);
          parts.push(formatted);
      }
    }
    
    return indent + parts.join('');
  }

  private formatForStatement(node: TreeSitter.Node, sourceText: string, indentLevel: number): string {
    const indent = this.getIndent(indentLevel);
    const parts: string[] = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) continue;
      
      switch (child.type) {
        case 'for':
          parts.push('for');
          break;
        case '(':
          if (this.options.insertSpaceAfterKeywords) {
            parts.push(' (');
          } else {
            parts.push('(');
          }
          break;
        case ')':
          parts.push(')');
          break;
        default:
          const formatted = this.formatNode(child, sourceText, indentLevel);
          parts.push(formatted);
      }
    }
    
    return indent + parts.join('');
  }

  private formatVector(node: TreeSitter.Node, sourceText: string, indentLevel: number): string {
    const elements: string[] = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) continue;
      
      if (child.type === ',' && this.options.insertSpaceAfterComma) {
        continue; // Handle commas separately
      } else if (child.type !== '[' && child.type !== ']') {
        elements.push(this.formatNode(child, sourceText, indentLevel));
      }
    }
    
    if (this.options.alignVectorElements && elements.length > 3) {
      // Multi-line format for long vectors
      const indent = this.getIndent(indentLevel + 1);
      const formattedElements = elements.map(el => indent + el);
      return '[\n' + formattedElements.join(',\n') + '\n' + this.getIndent(indentLevel) + ']';
    } else {
      // Single line format
      const separator = this.options.insertSpaceAfterComma ? ', ' : ',';
      const content = elements.join(separator);
      
      if (this.options.insertSpaceInsideBrackets) {
        return `[ ${content} ]`;
      } else {
        return `[${content}]`;
      }
    }
  }

  private formatArgumentList(node: TreeSitter.Node, sourceText: string, indentLevel: number): string {
    const args: string[] = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) continue;
      
      if (child.type !== '(' && child.type !== ')' && child.type !== ',') {
        args.push(this.formatNode(child, sourceText, indentLevel));
      }
    }
    
    const separator = this.options.insertSpaceAfterComma ? ', ' : ',';
    const content = args.join(separator);
    
    if (this.options.alignModuleParameters && args.length > 3) {
      // Multi-line format for long argument lists
      const indent = this.getIndent(indentLevel + 1);
      const formattedArgs = args.map(arg => indent + arg);
      return '(\n' + formattedArgs.join(',\n') + '\n' + this.getIndent(indentLevel) + ')';
    } else {
      // Single line format
      if (this.options.insertSpaceInsideParentheses) {
        return `( ${content} )`;
      } else {
        return `(${content})`;
      }
    }
  }

  private formatParameterList(node: TreeSitter.Node, sourceText: string, indentLevel: number): string {
    const params: string[] = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) continue;
      
      if (child.type !== '(' && child.type !== ')' && child.type !== ',') {
        params.push(this.formatNode(child, sourceText, indentLevel));
      }
    }
    
    const separator = this.options.insertSpaceAfterComma ? ', ' : ',';
    const content = params.join(separator);
    
    if (this.options.alignFunctionParameters && params.length > 3) {
      // Multi-line format for long parameter lists
      const indent = this.getIndent(indentLevel + 1);
      const formattedParams = params.map(param => indent + param);
      return '(\n' + formattedParams.join(',\n') + '\n' + this.getIndent(indentLevel) + ')';
    } else {
      // Single line format
      if (this.options.insertSpaceInsideParentheses) {
        return `( ${content} )`;
      } else {
        return `(${content})`;
      }
    }
  }

  private formatBinaryExpression(node: TreeSitter.Node, sourceText: string, indentLevel: number): string {
    const parts: string[] = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (!child) continue;
      
      if (this.isOperator(child.type)) {
        if (this.options.insertSpaceAroundOperators) {
          parts.push(` ${child.text} `);
        } else {
          parts.push(child.text);
        }
      } else {
        parts.push(this.formatNode(child, sourceText, indentLevel));
      }
    }
    
    return parts.join('');
  }

  private formatComment(node: TreeSitter.Node, sourceText: string, indentLevel: number): string {
    if (!this.options.preserveComments) {
      return '';
    }
    
    const indent = this.getIndent(indentLevel);
    const commentText = node.text.trim();
    
    if (this.options.alignComments) {
      // Align comments to a specific column
      return indent + commentText;
    } else {
      return indent + commentText;
    }
  }

  private formatGenericNode(node: TreeSitter.Node, sourceText: string, indentLevel: number): string {
    // For nodes we don't have specific formatting rules for,
    // just return their original text with proper indentation
    const nodeText = this.getNodeText(node, sourceText);
    
    if (node.childCount === 0) {
      return nodeText;
    }
    
    // If it has children, format them recursively
    const parts: string[] = [];
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        parts.push(this.formatNode(child, sourceText, indentLevel));
      }
    }
    
    return parts.join('');
  }

  // Helper methods

  private getIndent(level: number): string {
    const unit = this.options.useSpaces ? ' '.repeat(this.options.indentSize) : '\t';
    return unit.repeat(level);
  }

  private isOperator(type: string): boolean {
    const operators = ['+', '-', '*', '/', '%', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '=', '!'];
    return operators.includes(type);
  }

  private isTopLevelStatement(node: TreeSitter.Node): boolean {
    const topLevelTypes = ['module_definition', 'function_definition', 'assignment', 'module_call'];
    return topLevelTypes.includes(node.type);
  }

  private getNodeText(node: TreeSitter.Node, sourceText: string): string {
    return sourceText.slice(node.startIndex, node.endIndex);
  }

  private findNodesInRange(
    node: TreeSitter.Node,
    startPos: TreeSitter.Point,
    endPos: TreeSitter.Point
  ): TreeSitter.Node[] {
    const result: TreeSitter.Node[] = [];
    
    const nodeStart = node.startPosition;
    const nodeEnd = node.endPosition;
    
    // Check if node intersects with range
    if (this.positionCompare(nodeEnd, startPos) >= 0 && this.positionCompare(nodeStart, endPos) <= 0) {
      result.push(node);
      
      // Check children
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) {
          result.push(...this.findNodesInRange(child, startPos, endPos));
        }
      }
    }
    
    return result;
  }

  private positionCompare(a: TreeSitter.Point, b: TreeSitter.Point): number {
    if (a.row !== b.row) {
      return a.row - b.row;
    }
    return a.column - b.column;
  }

  private replaceNodeInSource(lines: string[], node: TreeSitter.Node, newText: string): string[] {
    const startRow = node.startPosition.row;
    const endRow = node.endPosition.row;
    const startCol = node.startPosition.column;
    const endCol = node.endPosition.column;
    
    const newLines = newText.split('\n');
    
    if (startRow === endRow) {
      // Single line replacement
      const line = lines[startRow];
      if (line !== undefined) {
        lines[startRow] = line.slice(0, startCol) + newText + line.slice(endCol);
      }
    } else {
      // Multi-line replacement
      const firstLineContent = lines[startRow];
      const lastLineContent = lines[endRow];
      if (firstLineContent !== undefined && lastLineContent !== undefined) {
        const firstLine = firstLineContent.slice(0, startCol) + newLines[0];
        const lastLine = newLines[newLines.length - 1] + lastLineContent.slice(endCol);
        
        const replacement = [firstLine, ...newLines.slice(1, -1), lastLine];
        lines.splice(startRow, endRow - startRow + 1, ...replacement);
      }
    }
    
    return lines;
  }

  private countChanges(original: string, formatted: string): number {
    if (original === formatted) return 0;
    
    // Simple heuristic: count different lines
    const originalLines = original.split('\n');
    const formattedLines = formatted.split('\n');
    
    let changes = Math.abs(originalLines.length - formattedLines.length);
    
    const minLength = Math.min(originalLines.length, formattedLines.length);
    for (let i = 0; i < minLength; i++) {
      if (originalLines[i] !== formattedLines[i]) {
        changes++;
      }
    }
    
    return changes;
  }
}