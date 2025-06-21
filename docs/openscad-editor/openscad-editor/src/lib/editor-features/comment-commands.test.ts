/**
 * @file Tests for Comment Toggling Commands
 * 
 * Tests the OpenSCAD comment service functionality including:
 * - Line comment toggling
 * - Block comment toggling
 * - Smart comment detection
 * - Configuration handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OpenSCADCommentService, CommentOperation, DEFAULT_COMMENT_CONFIG } from './comment-commands';
import * as monaco from 'monaco-editor';

// Mock Monaco editor
const createMockTextModel = (lines: string[]): monaco.editor.ITextModel => ({
  getValue: () => lines.join('\n'),
  getLineCount: () => lines.length,
  getLineContent: (lineNumber: number) => lines[lineNumber - 1] || '',
  getValueInRange: (range: monaco.IRange) => {
    const startLine = range.startLineNumber - 1;
    const endLine = range.endLineNumber - 1;
    const selectedLines = lines.slice(startLine, endLine + 1);
    
    if (selectedLines.length === 1) {
      const line = selectedLines[0];
      return line.substring(range.startColumn - 1, range.endColumn - 1);
    }
    
    return selectedLines.join('\n');
  },
  uri: monaco.Uri.parse('test://test.scad'),
  id: 'test-model',
  isDisposed: () => false
} as any);

const createMockSelection = (
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number
): monaco.Selection => ({
  startLineNumber: startLine,
  startColumn,
  endLineNumber: endLine,
  endColumn,
  isEmpty: () => startLine === endLine && startColumn === endColumn,
  getDirection: () => monaco.SelectionDirection.LTR
} as any);

const createMockEditor = (model: monaco.editor.ITextModel, selection?: monaco.Selection): monaco.editor.IStandaloneCodeEditor => ({
  getModel: () => model,
  getSelection: () => selection || createMockSelection(1, 1, 1, 1),
  executeEdits: vi.fn(),
  addAction: vi.fn(() => ({ dispose: vi.fn() }))
} as any);

describe('OpenSCADCommentService', () => {
  let commentService: OpenSCADCommentService;

  beforeEach(() => {
    commentService = new OpenSCADCommentService();
  });

  afterEach(() => {
    commentService.dispose();
  });

  describe('Line Comment Toggling', () => {
    it('should add line comments to uncommented lines', async () => {
      const lines = [
        'module test() {',
        '  cube([10, 10, 10]);',
        '  sphere(5);',
        '}'
      ];
      const model = createMockTextModel(lines);
      const selection = createMockSelection(2, 1, 3, 15); // Select cube and sphere lines
      const editor = createMockEditor(model, selection);

      await commentService.toggleLineComment(editor);

      expect(editor.executeEdits).toHaveBeenCalledWith(
        'toggleLineComment',
        expect.arrayContaining([
          expect.objectContaining({
            text: '// '
          })
        ])
      );
    });

    it('should remove line comments from commented lines', async () => {
      const lines = [
        'module test() {',
        '  // cube([10, 10, 10]);',
        '  // sphere(5);',
        '}'
      ];
      const model = createMockTextModel(lines);
      const selection = createMockSelection(2, 1, 3, 17); // Select commented lines
      const editor = createMockEditor(model, selection);

      await commentService.toggleLineComment(editor);

      expect(editor.executeEdits).toHaveBeenCalledWith(
        'toggleLineComment',
        expect.arrayContaining([
          expect.objectContaining({
            text: ''
          })
        ])
      );
    });

    it('should handle mixed commented and uncommented lines', async () => {
      const lines = [
        'module test() {',
        '  cube([10, 10, 10]);',      // Uncommented
        '  // sphere(5);',             // Commented
        '  cylinder(h=10, r=5);',      // Uncommented
        '}'
      ];
      const model = createMockTextModel(lines);
      const selection = createMockSelection(2, 1, 4, 22); // Select all three lines
      const editor = createMockEditor(model, selection);

      await commentService.toggleLineComment(editor);

      // Should add comments to all lines (since not all are commented)
      expect(editor.executeEdits).toHaveBeenCalledWith(
        'toggleLineComment',
        expect.arrayContaining([
          expect.objectContaining({
            text: '// '
          })
        ])
      );
    });

    it('should preserve indentation when adding comments', async () => {
      const lines = [
        'module test() {',
        '    cube([10, 10, 10]);',  // 4 spaces indentation
        '}'
      ];
      const model = createMockTextModel(lines);
      const selection = createMockSelection(2, 1, 2, 24);
      const editor = createMockEditor(model, selection);

      await commentService.toggleLineComment(editor);

      expect(editor.executeEdits).toHaveBeenCalledWith(
        'toggleLineComment',
        expect.arrayContaining([
          expect.objectContaining({
            range: expect.objectContaining({
              startColumn: 5, // After the 4 spaces
              endColumn: 5
            }),
            text: '// '
          })
        ])
      );
    });

    it('should skip empty lines', async () => {
      const lines = [
        'module test() {',
        '  cube([10, 10, 10]);',
        '',                        // Empty line
        '  sphere(5);',
        '}'
      ];
      const model = createMockTextModel(lines);
      const selection = createMockSelection(2, 1, 4, 13); // Include empty line
      const editor = createMockEditor(model, selection);

      await commentService.toggleLineComment(editor);

      // Should only create edits for non-empty lines
      expect(editor.executeEdits).toHaveBeenCalledWith(
        'toggleLineComment',
        expect.arrayContaining([
          expect.objectContaining({
            text: '// '
          })
        ])
      );
    });
  });

  describe('Block Comment Toggling', () => {
    it('should add block comments to selected text', async () => {
      const lines = [
        'module test() {',
        '  cube([10, 10, 10]);',
        '}'
      ];
      const model = createMockTextModel(lines);
      const selection = createMockSelection(2, 3, 2, 22); // Select "cube([10, 10, 10]);"
      const editor = createMockEditor(model, selection);

      await commentService.toggleBlockComment(editor);

      expect(editor.executeEdits).toHaveBeenCalledWith(
        'toggleBlockComment',
        expect.arrayContaining([
          expect.objectContaining({
            text: '/* cube([10, 10, 10]); */'
          })
        ])
      );
    });

    it('should remove block comments from commented text', async () => {
      const lines = [
        'module test() {',
        '  /* cube([10, 10, 10]); */',
        '}'
      ];
      const model = createMockTextModel(lines);
      const selection = createMockSelection(2, 3, 2, 30); // Select the block comment
      const editor = createMockEditor(model, selection);

      await commentService.toggleBlockComment(editor);

      expect(editor.executeEdits).toHaveBeenCalledWith(
        'toggleBlockComment',
        expect.arrayContaining([
          expect.objectContaining({
            text: 'cube([10, 10, 10]);'
          })
        ])
      );
    });

    it('should handle multi-line block comments', async () => {
      const lines = [
        'module test() {',
        '  cube([10, 10, 10]);',
        '  sphere(5);',
        '}'
      ];
      const model = createMockTextModel(lines);
      const selection = createMockSelection(2, 3, 3, 13); // Select across multiple lines
      const editor = createMockEditor(model, selection);

      await commentService.toggleBlockComment(editor);

      expect(editor.executeEdits).toHaveBeenCalledWith(
        'toggleBlockComment',
        expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringContaining('/*')
          })
        ])
      );
    });
  });

  describe('Configuration', () => {
    it('should respect custom comment characters', () => {
      const customService = new OpenSCADCommentService({
        lineComment: '#',
        blockCommentStart: '<!--',
        blockCommentEnd: '-->'
      });

      const config = customService.getConfig();
      expect(config.lineComment).toBe('#');
      expect(config.blockCommentStart).toBe('<!--');
      expect(config.blockCommentEnd).toBe('-->');

      customService.dispose();
    });

    it('should respect space configuration', () => {
      const customService = new OpenSCADCommentService({
        addSpaceAfterComment: false
      });

      const config = customService.getConfig();
      expect(config.addSpaceAfterComment).toBe(false);

      customService.dispose();
    });

    it('should allow configuration updates', () => {
      const initialConfig = commentService.getConfig();
      expect(initialConfig.addSpaceAfterComment).toBe(true);

      commentService.updateConfig({ addSpaceAfterComment: false });
      
      const updatedConfig = commentService.getConfig();
      expect(updatedConfig.addSpaceAfterComment).toBe(false);
    });
  });

  describe('Command Registration', () => {
    it('should register comment commands with editor', () => {
      const mockEditor = {
        addAction: vi.fn(() => ({ dispose: vi.fn() }))
      } as any;

      commentService.registerCommands(mockEditor);

      expect(mockEditor.addAction).toHaveBeenCalledTimes(2);
      expect(mockEditor.addAction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'openscad.toggleLineComment',
          label: 'Toggle Line Comment'
        })
      );
      expect(mockEditor.addAction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'openscad.toggleBlockComment',
          label: 'Toggle Block Comment'
        })
      );
    });

    it('should set up correct keyboard shortcuts', () => {
      const mockEditor = {
        addAction: vi.fn(() => ({ dispose: vi.fn() }))
      } as any;

      commentService.registerCommands(mockEditor);

      const lineCommentCall = mockEditor.addAction.mock.calls.find(
        call => call[0].id === 'openscad.toggleLineComment'
      );
      const blockCommentCall = mockEditor.addAction.mock.calls.find(
        call => call[0].id === 'openscad.toggleBlockComment'
      );

      expect(lineCommentCall[0].keybindings).toContain(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash
      );
      expect(blockCommentCall[0].keybindings).toContain(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Slash
      );
    });
  });

  describe('Comment Range Detection', () => {
    it('should detect line comment ranges', () => {
      const lines = [
        'module test() {',
        '  // This is a comment',
        '  cube([10, 10, 10]);',
        '}'
      ];
      const model = createMockTextModel(lines);

      const ranges = commentService.getCommentRanges(model);

      expect(ranges).toHaveLength(1);
      expect(ranges[0]).toEqual({
        startLine: 2,
        endLine: 2,
        startColumn: 3,
        endColumn: 23,
        isLineComment: true,
        isBlockComment: false
      });
    });

    it('should detect block comment ranges', () => {
      const lines = [
        'module test() {',
        '  /* block comment */ cube([10, 10, 10]);',
        '}'
      ];
      const model = createMockTextModel(lines);

      const ranges = commentService.getCommentRanges(model);

      expect(ranges).toHaveLength(1);
      expect(ranges[0]).toEqual({
        startLine: 2,
        endLine: 2,
        startColumn: 3,
        endColumn: 22,
        isLineComment: false,
        isBlockComment: true
      });
    });

    it('should detect multiple comment ranges', () => {
      const lines = [
        '// File header comment',
        'module test() {',
        '  // Line comment',
        '  /* block */ cube([10, 10, 10]);',
        '}'
      ];
      const model = createMockTextModel(lines);

      const ranges = commentService.getCommentRanges(model);

      expect(ranges).toHaveLength(3);
      expect(ranges[0].isLineComment).toBe(true);
      expect(ranges[1].isLineComment).toBe(true);
      expect(ranges[2].isBlockComment).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty models gracefully', async () => {
      const model = createMockTextModel([]);
      const selection = createMockSelection(1, 1, 1, 1);
      const editor = createMockEditor(model, selection);

      await commentService.toggleLineComment(editor);

      expect(editor.executeEdits).toHaveBeenCalledWith(
        'toggleLineComment',
        []
      );
    });

    it('should handle single character selections', async () => {
      const lines = ['a'];
      const model = createMockTextModel(lines);
      const selection = createMockSelection(1, 1, 1, 2);
      const editor = createMockEditor(model, selection);

      await commentService.toggleBlockComment(editor);

      expect(editor.executeEdits).toHaveBeenCalledWith(
        'toggleBlockComment',
        expect.arrayContaining([
          expect.objectContaining({
            text: '/* a */'
          })
        ])
      );
    });

    it('should handle service disposal', () => {
      const service = new OpenSCADCommentService();
      
      // Should not throw
      expect(() => service.dispose()).not.toThrow();
      
      // Should be safe to call multiple times
      expect(() => service.dispose()).not.toThrow();
    });
  });

  describe('Factory Function', () => {
    it('should create comment service with default config', async () => {
      const { createCommentService } = await import('./comment-commands');
      const service = createCommentService();

      expect(service).toBeInstanceOf(OpenSCADCommentService);
      expect(service.getConfig()).toEqual(DEFAULT_COMMENT_CONFIG);

      service.dispose();
    });

    it('should create comment service with custom config', async () => {
      const { createCommentService } = await import('./comment-commands');
      const customConfig = { lineComment: '#' };
      const service = createCommentService(customConfig);

      expect(service).toBeInstanceOf(OpenSCADCommentService);
      expect(service.getConfig().lineComment).toBe('#');

      service.dispose();
    });
  });
});
