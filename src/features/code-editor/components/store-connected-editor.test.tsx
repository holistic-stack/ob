/**
 * Store-Connected Editor Component Tests
 *
 * Tests for the Zustand-centric Monaco Editor component that verifies
 * proper data flow through the store.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { EditorSelection } from "../types/editor.types";

import { StoreConnectedEditor } from "./store-connected-editor";

// Mock Monaco Editor
vi.mock("./monaco-editor", () => ({
  MonacoEditorComponent: ({
    value,
    onChange,
    onCursorPositionChange,
    onSelectionChange,
    ...props
  }: any) => {
    return (
      <div data-testid="monaco-editor-mock" {...props}>
        <textarea
          data-testid="monaco-textarea"
          value={value}
          onChange={(e) => onChange?.({ value: e.target.value })}
          onFocus={() =>
            onCursorPositionChange?.({ position: { lineNumber: 1, column: 1 } })
          }
          onSelect={() =>
            onSelectionChange?.({
              selection: {
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 5,
              },
            })
          }
        />
      </div>
    );
  },
}));

// Mock store state
const mockStoreState = {
  editor: {
    code: "",
    selection: null,
    isDirty: false,
  },
  parsing: {
    errors: [],
    warnings: [],
  },
  config: {
    enableRealTimeParsing: true,
  },
};

const mockStoreActions = {
  updateCode: vi.fn(),
  updateSelection: vi.fn(),
  updateCursorPosition: vi.fn(),
  markDirty: vi.fn(),
  parseAST: vi.fn(),
};

// Mock the store
vi.mock("../../store/app-store", () => ({
  useAppStore: vi.fn((selector) => {
    if (typeof selector === "function") {
      // Handle selectors
      const selectorName = selector.name;
      if (selectorName === "selectEditorCode")
        return mockStoreState.editor.code;
      if (selectorName === "selectEditorSelection")
        return mockStoreState.editor.selection;
      if (selectorName === "selectEditorIsDirty")
        return mockStoreState.editor.isDirty;
      if (selectorName === "selectParsingErrors")
        return mockStoreState.parsing.errors;
      if (selectorName === "selectParsingWarnings")
        return mockStoreState.parsing.warnings;
      if (selectorName === "selectConfigEnableRealTimeParsing")
        return mockStoreState.config.enableRealTimeParsing;

      // Handle action selectors
      return selector(mockStoreActions);
    }
    return vi.fn();
  }),
}));

describe("StoreConnectedEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock store state
    mockStoreState.editor.code = "";
    mockStoreState.editor.selection = null;
    mockStoreState.editor.isDirty = false;
    mockStoreState.parsing.errors = [];
    mockStoreState.parsing.warnings = [];
    mockStoreState.config.enableRealTimeParsing = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render store-connected editor component", () => {
      render(<StoreConnectedEditor />);

      expect(screen.getByTestId("store-connected-editor")).toBeInTheDocument();
      expect(screen.getByTestId("monaco-editor-mock")).toBeInTheDocument();
      expect(screen.getByText("OpenSCAD")).toBeInTheDocument();
    });

    it("should apply custom props correctly", () => {
      render(
        <StoreConnectedEditor
          className="custom-class"
          data-testid="custom-editor"
          height={600}
          width={800}
        />,
      );

      const editor = screen.getByTestId("custom-editor");
      expect(editor).toBeInTheDocument();
      expect(editor).toHaveClass("custom-class");
      expect(editor).toHaveStyle({ height: "600px", width: "800px" });
    });

    it("should display editor status correctly", () => {
      mockStoreState.editor.isDirty = true;
      mockStoreState.editor.code = "cube([1,1,1]);";

      render(<StoreConnectedEditor />);

      expect(screen.getByText("● Modified")).toBeInTheDocument();
      expect(screen.getByText("13 chars")).toBeInTheDocument();
    });
  });

  describe("Store Integration", () => {
    it("should pass code from store to Monaco Editor", () => {
      mockStoreState.editor.code = "sphere(r=5);";

      render(<StoreConnectedEditor />);

      const textarea = screen.getByTestId("monaco-textarea");
      expect(textarea).toHaveValue("sphere(r=5);");
    });

    it("should display selection information from store", () => {
      mockStoreState.editor.selection = {
        startLine: 2,
        startColumn: 5,
        endLine: 2,
        endColumn: 10,
      } as any;

      render(<StoreConnectedEditor />);

      expect(screen.getByText("Ln 2, Col 5")).toBeInTheDocument();
    });

    it("should display parsing errors from store", () => {
      mockStoreState.parsing.errors = [
        { message: "Syntax error at line 1", line: 1, column: 1 },
        { message: "Missing semicolon", line: 2, column: 5 },
      ] as any;

      render(<StoreConnectedEditor />);

      expect(screen.getByText("2 errors")).toBeInTheDocument();
      expect(screen.getByText("Syntax error at line 1")).toBeInTheDocument();
      expect(screen.getByText("Missing semicolon")).toBeInTheDocument();
    });

    it("should display parsing warnings from store", () => {
      mockStoreState.parsing.warnings = [{ message: "Deprecated function used" }] as any;

      render(<StoreConnectedEditor />);

      expect(screen.getByText("1 warning")).toBeInTheDocument();
      expect(screen.getByText("Deprecated function used")).toBeInTheDocument();
    });
  });

  describe("Store Actions", () => {
    it("should call store actions when code changes", async () => {
      render(<StoreConnectedEditor />);

      const textarea = screen.getByTestId("monaco-textarea");
      fireEvent.change(textarea, { target: { value: "cube([2,2,2]);" } });

      await waitFor(() => {
        expect(mockStoreActions.updateCode).toHaveBeenCalledWith(
          "cube([2,2,2]);",
        );
        expect(mockStoreActions.markDirty).toHaveBeenCalled();
      });
    });

    it("should call store actions when cursor position changes", async () => {
      render(<StoreConnectedEditor />);

      const textarea = screen.getByTestId("monaco-textarea");
      fireEvent.focus(textarea);

      await waitFor(() => {
        expect(mockStoreActions.updateCursorPosition).toHaveBeenCalledWith({
          line: 1,
          column: 1,
        });
      });
    });

    it("should call store actions when selection changes", async () => {
      render(<StoreConnectedEditor />);

      const textarea = screen.getByTestId("monaco-textarea");
      fireEvent.select(textarea);

      await waitFor(() => {
        expect(mockStoreActions.updateSelection).toHaveBeenCalledWith({
          startLine: 1,
          startColumn: 1,
          endLine: 1,
          endColumn: 5,
        });
      });
    });
  });

  describe("Error and Warning Display", () => {
    it("should not show error panel when no errors or warnings", () => {
      render(<StoreConnectedEditor />);

      expect(screen.queryByText("Error:")).not.toBeInTheDocument();
      expect(screen.queryByText("Warning:")).not.toBeInTheDocument();
    });

    it("should show error panel when errors exist", () => {
      mockStoreState.parsing.errors = [
        { message: "Test error", line: 1, column: 1 },
      ] as any;

      render(<StoreConnectedEditor />);

      expect(screen.getByText("Error:")).toBeInTheDocument();
      expect(screen.getByText("Test error")).toBeInTheDocument();
    });

    it("should show error panel when warnings exist", () => {
      mockStoreState.parsing.warnings = [
        { message: "Test warning", line: 1, column: 1 },
      ] as any;

      render(<StoreConnectedEditor />);

      expect(screen.getByText("Warning:")).toBeInTheDocument();
      expect(screen.getByText("Test warning")).toBeInTheDocument();
    });
  });
});
