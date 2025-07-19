/**
 * Store-Connected Editor Component Tests
 *
 * Tests for the Zustand-centric Monaco Editor component that verifies
 * proper data flow through the store.
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EditorChangeEvent, EditorCursorEvent, EditorSelection } from '../types/editor.types';
import { StoreConnectedEditor } from './store-connected-editor';

// Mock Monaco Editor
vi.mock('./monaco-editor', () => ({
  MonacoEditorComponent: ({
    value,
    onChange,
    onCursorPositionChange,
    onSelectionChange,
    ...props
  }: {
    value?: string;
    onChange?: (event: EditorChangeEvent) => void;
    onCursorPositionChange?: (event: EditorCursorEvent) => void;
    onSelectionChange?: (selection: unknown) => void;
    [key: string]: unknown;
  }) => {
    return (
      <div data-testid="monaco-editor-mock" {...props}>
        <textarea
          data-testid="monaco-textarea"
          value={value || ''}
          onChange={(e) => {
            onChange?.({ value: e.target.value, changes: [], versionId: 1 });
          }}
          onFocus={() => {
            onCursorPositionChange?.({ position: { line: 1, column: 1 }, secondaryPositions: [] });
          }}
          onSelect={() => {
            onSelectionChange?.({
              selection: {
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 5,
              },
              secondarySelections: [],
            });
          }}
        />
      </div>
    );
  },
}));

// Mock store state - complete AppState structure
const mockStoreState = {
  editor: {
    code: '',
    cursorPosition: { line: 1, column: 1 },
    selection: null as EditorSelection | null,
    isDirty: false,
    lastSaved: null,
  },
  parsing: {
    ast: [],
    errors: [] as string[],
    warnings: [] as string[],
    isLoading: false,
    lastParsed: null,
    lastParsedCode: null,
    parseTime: 0,
  },
  babylonRendering: {
    isInitialized: false,
    scene: null,
    camera: null,
    meshes: [],
    lastRendered: null,
    renderTime: 0,
  },
  config: {
    enableRealTimeParsing: true,
    theme: 'dark',
    enableDevtools: false,
  },
};

const mockStoreActions = {
  updateCode: vi.fn(),
  updateSelection: vi.fn(),
  updateCursorPosition: vi.fn(),
  markDirty: vi.fn(),
  parseAST: vi.fn(),
};

// Mock the store - properly handle selector functions
vi.mock('../../store/app-store', () => ({
  useAppStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      try {
        // Execute the selector with the mock state
        return selector({ ...mockStoreState, ...mockStoreActions });
      } catch {
        // Fallback for action selectors
        return selector(mockStoreActions);
      }
    }
    return vi.fn();
  }),
}));

describe('StoreConnectedEditor', () => {
  beforeEach(() => {
    // Reset modules to ensure clean mock state
    vi.resetModules();

    // Comprehensive cleanup before each test
    cleanup();
    vi.clearAllMocks();

    // Ensure clean DOM state
    document.body.innerHTML = '';

    // Reset mock store state
    mockStoreState.editor.code = '';
    mockStoreState.editor.selection = null;
    mockStoreState.editor.isDirty = false;
    mockStoreState.parsing.errors = [];
    mockStoreState.parsing.warnings = [];
    mockStoreState.config.enableRealTimeParsing = true;

    // Ensure ResizeObserver is available
    if (!global.ResizeObserver) {
      global.ResizeObserver = class ResizeObserver {
        observe() {
          /* Mock implementation */
        }
        unobserve() {
          /* Mock implementation */
        }
        disconnect() {
          /* Mock implementation */
        }
      };
    }

    // Ensure window APIs are available for waitFor
    if (!window.addEventListener || typeof window.addEventListener !== 'function') {
      Object.defineProperty(window, 'addEventListener', {
        writable: true,
        value: vi.fn(),
      });
    }

    if (!window.removeEventListener || typeof window.removeEventListener !== 'function') {
      Object.defineProperty(window, 'removeEventListener', {
        writable: true,
        value: vi.fn(),
      });
    }
  });

  afterEach(() => {
    // Comprehensive cleanup after each test
    vi.clearAllMocks();
    cleanup();

    // Additional DOM cleanup
    document.body.innerHTML = '';

    // Clear any remaining timers
    vi.clearAllTimers();

    // Reset mock store state to prevent leakage
    mockStoreState.editor.code = '';
    mockStoreState.editor.selection = null;
    mockStoreState.editor.isDirty = false;
    mockStoreState.parsing.errors = [];
    mockStoreState.parsing.warnings = [];
    mockStoreState.config.enableRealTimeParsing = true;
  });

  describe('Component Rendering', () => {
    it('should render store-connected editor component', () => {
      render(<StoreConnectedEditor />);

      expect(screen.getByTestId('store-connected-editor')).toBeInTheDocument();
      expect(screen.getByTestId('monaco-editor-instance')).toBeInTheDocument();
      expect(screen.getByText('OpenSCAD')).toBeInTheDocument();
    });

    it('should apply custom props correctly', () => {
      render(
        <StoreConnectedEditor
          className="custom-class"
          data-testid="custom-editor"
          height={600}
          width={800}
        />
      );

      const editor = screen.getByTestId('custom-editor');
      expect(editor).toBeInTheDocument();
      expect(editor).toHaveClass('custom-class');
      expect(editor).toHaveStyle({ height: '600px', width: '800px' });
    });

    it('should display editor status correctly', () => {
      mockStoreState.editor.isDirty = true;
      mockStoreState.editor.code = 'cube([1,1,1]);';

      render(<StoreConnectedEditor />);

      expect(screen.getByText('● Modified')).toBeInTheDocument();
      expect(screen.getByText('14 chars')).toBeInTheDocument();
    });
  });

  describe('Store Integration', () => {
    it('should pass code from store to Monaco Editor', () => {
      mockStoreState.editor.code = 'sphere(r=5);';

      render(<StoreConnectedEditor />);

      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue('sphere(r=5);');
    });

    it('should display selection information from store', () => {
      mockStoreState.editor.selection = {
        startLineNumber: 2,
        startColumn: 5,
        endLineNumber: 2,
        endColumn: 10,
      };

      render(<StoreConnectedEditor />);

      expect(screen.getByText('Ln 2, Col 5')).toBeInTheDocument();
    });

    it('should display parsing errors from store', () => {
      mockStoreState.parsing.errors = ['Syntax error at line 1', 'Missing semicolon'];

      render(<StoreConnectedEditor />);

      expect(screen.getByText('2 errors')).toBeInTheDocument();
      expect(screen.getByText('Syntax error at line 1')).toBeInTheDocument();
      expect(screen.getByText('Missing semicolon')).toBeInTheDocument();
    });

    it('should display parsing warnings from store', () => {
      mockStoreState.parsing.warnings = ['Test warning'];

      render(<StoreConnectedEditor />);

      expect(screen.getByText('1 warning')).toBeInTheDocument();
      expect(screen.getByText('Test warning')).toBeInTheDocument();
    });
  });

  describe('Store Actions', () => {
    it('should call store actions when code changes', async () => {
      const { container } = render(<StoreConnectedEditor />);

      const textarea = screen.getByTestId('monaco-textarea');
      fireEvent.change(textarea, { target: { value: 'cube([2,2,2]);' } });

      await waitFor(
        () => {
          expect(mockStoreActions.updateCode).toHaveBeenCalledWith('cube([2,2,2]);');
          expect(mockStoreActions.markDirty).toHaveBeenCalled();
        },
        { container }
      );
    });

    it('should call store actions when cursor position changes', async () => {
      const { container } = render(<StoreConnectedEditor />);

      const textarea = screen.getByTestId('monaco-textarea');
      fireEvent.focus(textarea);

      await waitFor(
        () => {
          expect(mockStoreActions.updateCursorPosition).toHaveBeenCalledWith({
            line: 1,
            column: 1,
          });
        },
        { container }
      );
    });

    it('should call store actions when selection changes', async () => {
      const { container } = render(<StoreConnectedEditor />);

      const textarea = screen.getByTestId('monaco-textarea');
      fireEvent.select(textarea);

      await waitFor(
        () => {
          expect(mockStoreActions.updateSelection).toHaveBeenCalledWith({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 5,
          });
        },
        { container }
      );
    });
  });

  describe('Error and Warning Display', () => {
    it('should not show error panel when no errors or warnings', () => {
      render(<StoreConnectedEditor />);

      expect(screen.queryByText('Error:')).not.toBeInTheDocument();
      expect(screen.queryByText('Warning:')).not.toBeInTheDocument();
    });

    it('should show error panel when errors exist', () => {
      mockStoreState.parsing.errors = ['Test error'];

      render(<StoreConnectedEditor />);

      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should show error panel when warnings exist', () => {
      mockStoreState.parsing.warnings = ['Test warning'];

      render(<StoreConnectedEditor />);

      expect(screen.getByText('Warning:')).toBeInTheDocument();
      expect(screen.getByText('Test warning')).toBeInTheDocument();
    });
  });
});
