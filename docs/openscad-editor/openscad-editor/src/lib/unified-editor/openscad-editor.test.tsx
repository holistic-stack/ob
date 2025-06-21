/**
 * @file Tests for OpenSCAD Editor Component
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { OpenscadEditor } from './openscad-editor';
import type { OpenscadEditorFeatures } from './feature-config';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ onMount, ...props }: any) => {
    // Simulate editor mount immediately
    if (onMount) {
      const mockEditor = {
        getValue: () => '',
        getModel: () => ({
          getValue: () => '',
          onDidChangeContent: () => ({ dispose: () => {} })
        }),
        addAction: vi.fn(),
        getAction: () => ({ run: vi.fn() })
      };
      const mockMonaco = {
        languages: {
          registerCompletionItemProvider: vi.fn(),
          registerDefinitionProvider: vi.fn(),
          registerReferenceProvider: vi.fn(),
          registerHoverProvider: vi.fn()
        },
        editor: {
          setModelMarkers: vi.fn()
        }
      };
      // Call onMount synchronously to avoid React Hook issues
      setTimeout(() => onMount(mockEditor, mockMonaco), 0);
    }

    return (
      <div data-testid="monaco-editor" {...props}>
        Monaco Editor Mock
      </div>
    );
  },
  loader: {
    init: () => Promise.resolve({
      languages: {
        registerCompletionItemProvider: vi.fn(),
        registerDefinitionProvider: vi.fn(),
        registerReferenceProvider: vi.fn(),
        registerHoverProvider: vi.fn()
      },
      editor: {
        setModelMarkers: vi.fn()
      }
    })
  }
}));

// Mock OpenSCAD language registration
vi.mock('../openscad-language', () => ({
  registerOpenSCADLanguage: () => ({ disposables: [] })
}));

// Mock lazy imports
vi.mock('../services/openscad-parser-service', () => ({
  OpenSCADParserService: class MockParserService {
    async init() { return Promise.resolve(); }
    async parseDocument() { 
      return { success: true, errors: [], ast: null }; 
    }
    getDocumentOutline() { return []; }
    dispose() {}
  }
}));

vi.mock('../completion/completion-provider', () => ({
  OpenSCADCompletionProvider: class MockCompletionProvider {}
}));

vi.mock('../navigation/navigation-provider', () => ({
  OpenSCADNavigationProvider: class MockNavigationProvider {}
}));

vi.mock('../navigation/navigation-commands', () => ({
  registerNavigationCommands: () => ({})
}));

vi.mock('../hover/hover-provider', () => ({
  OpenSCADHoverProvider: class MockHoverProvider {}
}));

vi.mock('../formatting/formatting-service', () => ({
  FormattingService: class MockFormattingService {}
}));

vi.mock('../diagnostics', () => ({
  createDiagnosticsService: () => ({
    init: () => Promise.resolve(),
    registerWithMonaco: () => {},
    dispose: () => {}
  })
}));

vi.mock('../editor-features', () => ({
  createEditorFeaturesService: () => ({
    registerWithMonaco: () => Promise.resolve(),
    dispose: () => {}
  })
}));

vi.mock('../keyboard-shortcuts/keyboard-shortcuts-config', () => ({
  KEYBOARD_SHORTCUTS: {
    FORMAT_DOCUMENT: {
      id: 'format-document',
      label: 'Format Document',
      keybinding: 1234
    }
  }
}));

describe('OpenscadEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default BASIC features', async () => {
      await act(async () => {
        render(<OpenscadEditor value="cube(10);" />);
      });

      // Should eventually show the editor
      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });

    it('should render with custom dimensions', async () => {
      await act(async () => {
        render(
          <OpenscadEditor
            value="sphere(5);"
            height="500px"
            width="800px"
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });

    it('should handle onChange callback', async () => {
      const handleChange = vi.fn();

      await act(async () => {
        render(
          <OpenscadEditor
            value="cube(10);"
            onChange={handleChange}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Feature Configuration', () => {
    it('should work with BASIC preset', async () => {
      await act(async () => {
        render(<OpenscadEditor features="BASIC" value="cube(10);" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });

      // Should not show status indicator for basic features
      expect(screen.queryByText('✓ Ready')).not.toBeInTheDocument();
    });

    it('should work with PARSER preset', async () => {
      await act(async () => {
        render(<OpenscadEditor features="PARSER" value="cube(10);" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });

      // Should show status indicator for parser features
      await waitFor(() => {
        expect(screen.getByText('✓ Ready')).toBeInTheDocument();
      });
    });

    it('should work with IDE preset', async () => {
      await act(async () => {
        render(<OpenscadEditor features="IDE" value="cube(10);" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });

    it('should work with FULL preset', async () => {
      await act(async () => {
        render(<OpenscadEditor features="FULL" value="cube(10);" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });

    it('should work with custom feature configuration', async () => {
      const customFeatures: OpenscadEditorFeatures = {
        core: {
          syntaxHighlighting: true,
          basicEditing: true,
          keyboardShortcuts: true
        },
        parser: {
          realTimeParsing: true,
          errorDetection: true,
          documentOutline: false,
          performanceMonitoring: false
        },
        ide: {
          codeCompletion: true,
          navigationCommands: false,
          hoverInformation: false,
          quickFixes: false,
          diagnostics: false,
          formatting: false
        },
        advanced: {
          refactoring: false,
          symbolSearch: false,
          folding: true,
          bracketMatching: false,
          smartIndentation: false,
          commentCommands: false
        }
      };

      await act(async () => {
        render(<OpenscadEditor features={customFeatures} value="cube(10);" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Callback Handling', () => {
    it('should accept callback props without errors', async () => {
      const handleParseResult = vi.fn();
      const handleOutlineChange = vi.fn();
      const handleError = vi.fn();
      const handleFormattingReady = vi.fn();

      await act(async () => {
        render(
          <OpenscadEditor
            features="IDE"
            value="cube(10);"
            onParseResult={handleParseResult}
            onOutlineChange={handleOutlineChange}
            onError={handleError}
            onFormattingServiceReady={handleFormattingReady}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Configuration', () => {
    it('should accept custom performance configuration', async () => {
      const customPerformance = {
        lazyLoading: false,
        parseDebounceMs: 1000,
        parseTimeoutMs: 10000,
        enableMetrics: false
      };

      await act(async () => {
        render(
          <OpenscadEditor
            features="PARSER"
            value="cube(10);"
            performance={customPerformance}
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });
  });
});
