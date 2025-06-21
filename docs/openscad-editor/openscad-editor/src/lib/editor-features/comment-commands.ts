/**
 * @file Comment Toggling Commands for OpenSCAD
 * 
 * Provides intelligent comment toggling functionality for OpenSCAD code.
 * Supports line comments, block comments, and smart comment detection.
 * 
 * @example
 * ```typescript
 * const commentService = new OpenSCADCommentService();
 * commentService.registerCommands(editor);
 * ```
 */

import * as monaco from 'monaco-editor';

/**
 * Comment configuration
 */
export interface CommentConfig {
  readonly lineComment: string;
  readonly blockCommentStart: string;
  readonly blockCommentEnd: string;
  readonly enableSmartToggling: boolean;
  readonly preserveIndentation: boolean;
  readonly addSpaceAfterComment: boolean;
}

/**
 * Default comment configuration for OpenSCAD
 */
export const DEFAULT_COMMENT_CONFIG: CommentConfig = {
  lineComment: '//',
  blockCommentStart: '/*',
  blockCommentEnd: '*/',
  enableSmartToggling: true,
  preserveIndentation: true,
  addSpaceAfterComment: true
};

/**
 * Comment operation types
 */
export enum CommentOperation {
  ToggleLine = 'toggleLine',
  ToggleBlock = 'toggleBlock',
  AddLine = 'addLine',
  RemoveLine = 'removeLine',
  AddBlock = 'addBlock',
  RemoveBlock = 'removeBlock'
}

/**
 * Result type for comment operations
 */
type CommentResult<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

/**
 * Comment range information
 */
export interface CommentRange {
  readonly startLine: number;
  readonly endLine: number;
  readonly startColumn: number;
  readonly endColumn: number;
  readonly isLineComment: boolean;
  readonly isBlockComment: boolean;
}

/**
 * OpenSCAD Comment Service
 *
 * Provides intelligent comment toggling with:
 * - Line comment toggling (// comments)
 * - Block comment toggling (block comments)
 * - Smart detection of existing comments
 * - Preservation of indentation
 * - Keyboard shortcuts integration
 */
export class OpenSCADCommentService {
  private readonly config: CommentConfig;
  private disposables: monaco.IDisposable[] = [];

  constructor(config: Partial<CommentConfig> = {}) {
    this.config = { ...DEFAULT_COMMENT_CONFIG, ...config };
  }

  /**
   * Register comment commands with Monaco editor
   */
  registerCommands(editor: monaco.editor.IStandaloneCodeEditor): void {
    // Register toggle line comment command
    const toggleLineCommentAction = editor.addAction({
      id: 'openscad.toggleLineComment',
      label: 'Toggle Line Comment',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash],
      contextMenuGroupId: 'modification',
      contextMenuOrder: 1.5,
      run: () => this.toggleLineComment(editor)
    });

    // Register toggle block comment command
    const toggleBlockCommentAction = editor.addAction({
      id: 'openscad.toggleBlockComment',
      label: 'Toggle Block Comment',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Slash],
      contextMenuGroupId: 'modification',
      contextMenuOrder: 1.6,
      run: () => this.toggleBlockComment(editor)
    });

    this.disposables.push(toggleLineCommentAction, toggleBlockCommentAction);
    console.log('✅ OpenSCAD comment commands registered successfully');
  }

  /**
   * Toggle line comments for selected lines
   */
  async toggleLineComment(editor: monaco.editor.IStandaloneCodeEditor): Promise<void> {
    const model = editor.getModel();
    if (!model) return;

    const selection = editor.getSelection();
    if (!selection) return;

    const result = await this.processLineCommentToggle(model, selection);
    if (result.success) {
      editor.executeEdits('toggleLineComment', result.data);
    }
  }

  /**
   * Toggle block comment for selection
   */
  async toggleBlockComment(editor: monaco.editor.IStandaloneCodeEditor): Promise<void> {
    const model = editor.getModel();
    if (!model) return;

    const selection = editor.getSelection();
    if (!selection) return;

    const result = await this.processBlockCommentToggle(model, selection);
    if (result.success) {
      editor.executeEdits('toggleBlockComment', result.data);
    }
  }

  /**
   * Process line comment toggling
   */
  private async processLineCommentToggle(
    model: monaco.editor.ITextModel,
    selection: monaco.Selection
  ): Promise<CommentResult<monaco.editor.IIdentifiedSingleEditOperation[]>> {
    const startLine = selection.startLineNumber;
    const endLine = selection.endLineNumber;
    const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];

    // Check if all lines are commented
    const allLinesCommented = this.areAllLinesCommented(model, startLine, endLine);

    for (let lineNumber = startLine; lineNumber <= endLine; lineNumber++) {
      const lineContent = model.getLineContent(lineNumber);
      
      if (lineContent.trim() === '') {
        continue; // Skip empty lines
      }

      if (allLinesCommented) {
        // Remove line comments
        const edit = this.createRemoveLineCommentEdit(model, lineNumber, lineContent);
        if (edit) {
          edits.push(edit);
        }
      } else {
        // Add line comments
        const edit = this.createAddLineCommentEdit(model, lineNumber, lineContent);
        if (edit) {
          edits.push(edit);
        }
      }
    }

    return { success: true, data: edits };
  }

  /**
   * Process block comment toggling
   */
  private async processBlockCommentToggle(
    model: monaco.editor.ITextModel,
    selection: monaco.Selection
  ): Promise<CommentResult<monaco.editor.IIdentifiedSingleEditOperation[]>> {
    const selectedText = model.getValueInRange(selection);
    const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];

    // Check if selection is already block commented
    if (this.isBlockCommented(selectedText)) {
      // Remove block comment
      const edit = this.createRemoveBlockCommentEdit(selection, selectedText);
      if (edit) {
        edits.push(edit);
      }
    } else {
      // Add block comment
      const edit = this.createAddBlockCommentEdit(selection, selectedText);
      if (edit) {
        edits.push(edit);
      }
    }

    return { success: true, data: edits };
  }

  /**
   * Check if all lines in range are commented
   */
  private areAllLinesCommented(
    model: monaco.editor.ITextModel,
    startLine: number,
    endLine: number
  ): boolean {
    for (let lineNumber = startLine; lineNumber <= endLine; lineNumber++) {
      const lineContent = model.getLineContent(lineNumber);
      
      if (lineContent.trim() === '') {
        continue; // Skip empty lines
      }

      if (!this.isLineCommented(lineContent)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if a line is commented
   */
  private isLineCommented(lineContent: string): boolean {
    const trimmed = lineContent.trim();
    return trimmed.startsWith(this.config.lineComment);
  }

  /**
   * Check if text is block commented
   */
  private isBlockCommented(text: string): boolean {
    const trimmed = text.trim();
    return trimmed.startsWith(this.config.blockCommentStart) && 
           trimmed.endsWith(this.config.blockCommentEnd);
  }

  /**
   * Create edit to add line comment
   */
  private createAddLineCommentEdit(
    model: monaco.editor.ITextModel,
    lineNumber: number,
    lineContent: string
  ): monaco.editor.IIdentifiedSingleEditOperation | null {
    const indentMatch = lineContent.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';
    const insertPosition = (indent?.length || 0) + 1;

    const commentText = this.config.addSpaceAfterComment 
      ? `${this.config.lineComment} `
      : this.config.lineComment;

    return {
      range: new monaco.Range(lineNumber, insertPosition, lineNumber, insertPosition),
      text: commentText
    };
  }

  /**
   * Create edit to remove line comment
   */
  private createRemoveLineCommentEdit(
    model: monaco.editor.ITextModel,
    lineNumber: number,
    lineContent: string
  ): monaco.editor.IIdentifiedSingleEditOperation | null {
    const commentIndex = lineContent.indexOf(this.config.lineComment);
    if (commentIndex === -1) {
      return null;
    }

    const startColumn = commentIndex + 1;
    let endColumn = startColumn + this.config.lineComment.length;

    // Also remove the space after comment if it exists
    if (this.config.addSpaceAfterComment && 
        lineContent[commentIndex + this.config.lineComment.length] === ' ') {
      endColumn++;
    }

    return {
      range: new monaco.Range(lineNumber, startColumn, lineNumber, endColumn),
      text: ''
    };
  }

  /**
   * Create edit to add block comment
   */
  private createAddBlockCommentEdit(
    selection: monaco.Selection,
    selectedText: string
  ): monaco.editor.IIdentifiedSingleEditOperation | null {
    const commentStart = this.config.addSpaceAfterComment 
      ? `${this.config.blockCommentStart} `
      : this.config.blockCommentStart;
    
    const commentEnd = this.config.addSpaceAfterComment 
      ? ` ${this.config.blockCommentEnd}`
      : this.config.blockCommentEnd;

    const commentedText = `${commentStart}${selectedText}${commentEnd}`;

    return {
      range: selection,
      text: commentedText
    };
  }

  /**
   * Create edit to remove block comment
   */
  private createRemoveBlockCommentEdit(
    selection: monaco.Selection,
    selectedText: string
  ): monaco.editor.IIdentifiedSingleEditOperation | null {
    let text = selectedText;

    // Remove block comment start
    if (text.startsWith(this.config.blockCommentStart)) {
      text = text.substring(this.config.blockCommentStart.length);
      
      // Remove space after comment start if it exists
      if (this.config.addSpaceAfterComment && text.startsWith(' ')) {
        text = text.substring(1);
      }
    }

    // Remove block comment end
    if (text.endsWith(this.config.blockCommentEnd)) {
      text = text.substring(0, text.length - this.config.blockCommentEnd.length);
      
      // Remove space before comment end if it exists
      if (this.config.addSpaceAfterComment && text.endsWith(' ')) {
        text = text.substring(0, text.length - 1);
      }
    }

    return {
      range: selection,
      text: text
    };
  }

  /**
   * Get comment ranges in the document
   */
  getCommentRanges(model: monaco.editor.ITextModel): CommentRange[] {
    const ranges: CommentRange[] = [];
    const lineCount = model.getLineCount();

    for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
      const lineContent = model.getLineContent(lineNumber);
      
      // Check for line comments
      const lineCommentIndex = lineContent.indexOf(this.config.lineComment);
      if (lineCommentIndex !== -1) {
        ranges.push({
          startLine: lineNumber,
          endLine: lineNumber,
          startColumn: lineCommentIndex + 1,
          endColumn: lineContent.length + 1,
          isLineComment: true,
          isBlockComment: false
        });
      }

      // Check for block comments (simplified - doesn't handle multi-line)
      const blockStartIndex = lineContent.indexOf(this.config.blockCommentStart);
      const blockEndIndex = lineContent.indexOf(this.config.blockCommentEnd);
      
      if (blockStartIndex !== -1 && blockEndIndex !== -1 && blockEndIndex > blockStartIndex) {
        ranges.push({
          startLine: lineNumber,
          endLine: lineNumber,
          startColumn: blockStartIndex + 1,
          endColumn: blockEndIndex + this.config.blockCommentEnd.length + 1,
          isLineComment: false,
          isBlockComment: true
        });
      }
    }

    return ranges;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CommentConfig>): void {
    Object.assign(this.config, newConfig);
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<CommentConfig> {
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
 * Create comment service
 */
export function createCommentService(config?: Partial<CommentConfig>): OpenSCADCommentService {
  return new OpenSCADCommentService(config);
}
