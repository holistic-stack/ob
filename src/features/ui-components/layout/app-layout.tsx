/**
 * App Layout Component
 * 
 * CAD-style Liquid Glass Layout with comprehensive interface structure
 * Implements TDD methodology with minimal implementation to pass tests
 */

import React, { forwardRef, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { MonacoCodeEditor } from '../editor/code-editor/monaco-code-editor';
import { VisualizationPanel } from '../editor/visualization-panel/visualization-panel';
import type { AppLayoutProps, FileName } from './types';

// Re-export the props type
export type { AppLayoutProps };

// ============================================================================
// Placeholder Components (Minimal Implementation)
// ============================================================================

interface HeaderBarProps {
  readonly fileName: string;
  readonly onFileNameChange: (name: string) => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ fileName, onFileNameChange }) => (
  <header
    data-testid="header-bar"
    role="banner"
    className="h-16 px-6 relative flex items-center justify-between"
    style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 0 20px rgba(0, 0, 0, 0.2)'
    }}
  >
    {/* Logo placeholder */}
    <div data-testid="logo-placeholder" className="flex items-center">
      <div
        className="w-8 h-8 rounded-lg relative flex items-center justify-center"
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4)'
        }}
      >
        <span className="text-white text-xs font-bold">OS</span>
      </div>
    </div>
    
    {/* File name display */}
    <button
      data-testid="file-name-display"
      className="text-white font-medium cursor-pointer bg-transparent border-none"
      onClick={() => onFileNameChange(fileName)}
      aria-label={`Edit file name: ${fileName}`}
    >
      {fileName}
    </button>
    
    {/* User avatar placeholder */}
    <div data-testid="user-avatar-placeholder" className="flex items-center">
      <div className="w-8 h-8 bg-white/10 rounded-full" />
    </div>
  </header>
);

interface ToolbarProps {
  readonly onRender: () => void;
  readonly onMoreOptions: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onRender, onMoreOptions }) => (
  <div
    data-testid="toolbar"
    role="toolbar"
    className="h-12 px-6 gap-4 relative flex items-center justify-between"
    style={{
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(8px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.15)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
    }}
  >
    {/* Tab navigation */}
    <div className="flex gap-4">
      <button
        data-testid="tab-openscad-code"
        className="px-4 py-2 text-white rounded-lg relative"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)'
        }}
      >
        OpenSCAD Code
      </button>
      <button
        data-testid="tab-ast-tree"
        className="px-4 py-2 text-white/70 rounded-lg relative hover:text-white transition-colors"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        AST Tree Representation
      </button>
    </div>
    
    {/* Action buttons */}
    <div className="flex gap-4">
      <button
        data-testid="render-button"
        tabIndex={0}
        onClick={onRender}
        className="px-6 py-2 bg-blue-500/20 text-white rounded-lg border border-blue-400/50"
      >
        Render
      </button>
      <button
        data-testid="more-options-button"
        tabIndex={0}
        onClick={onMoreOptions}
        className="px-4 py-2 bg-white/10 text-white rounded-lg border border-white/30"
      >
        More Options
      </button>
    </div>
  </div>
);

const FooterBar: React.FC = () => (
  <footer
    data-testid="footer-bar"
    role="contentinfo"
    className="h-10 relative flex items-center justify-end px-6"
    style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(6px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
    }}
  >
    <div data-testid="console-viewer-placeholder" className="text-white/70 text-sm">
      Console viewer placeholder
    </div>
  </footer>
);

interface SplitterProps {
  readonly className?: string;
}

const Splitter: React.FC<SplitterProps> = ({ className }) => (
  <div
    data-testid="splitter"
    className={clsx(
      "w-1 bg-white/20 cursor-col-resize hover:bg-white/30 transition-colors",
      className
    )}
  />
);

// ============================================================================
// Main App Layout Component
// ============================================================================

/**
 * App Layout component with CAD-style interface and glass morphism effects
 * 
 * @example
 * ```tsx
 * <AppLayout
 *   fileName="untitled.scad"
 *   onFileNameChange={setFileName}
 *   onRender={handleRender}
 *   onMoreOptions={handleMoreOptions}
 * />
 * ```
 */
export const AppLayout = forwardRef<HTMLDivElement, AppLayoutProps>(
  (
    {
      fileName,
      onFileNameChange,
      onRender,
      onMoreOptions,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    // Local state for demo purposes
    const [code, setCode] = useState(`// OpenSCAD Code
cube([10, 10, 10]);
translate([15, 0, 0])
  sphere(r=5);
translate([30, 0, 0])
  cylinder(h=10, r=3);`);

    const handleCodeChange = useCallback((newCode: string) => {
      setCode(newCode);
    }, []);

    const handleFileNameChange = useCallback((newName: string) => {
      onFileNameChange(newName as FileName);
    }, [onFileNameChange]);

    return (
      <div
        ref={ref}
        data-testid="app-layout-container"
        role="main"
        className={clsx(
          "h-screen w-screen overflow-hidden relative flex flex-col",
          "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
          "min-h-screen",
          className
        )}
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #581c87 50%, #1e1b4b 75%, #0f172a 100%)
          `,
          minHeight: '100vh'
        }}
        {...rest}
      >
        {/* Header Bar */}
        <HeaderBar
          fileName={fileName}
          onFileNameChange={handleFileNameChange}
        />
        
        {/* Toolbar */}
        <Toolbar
          onRender={onRender}
          onMoreOptions={onMoreOptions}
        />
        
        {/* Main Body - Split Layout */}
        <div
          data-testid="main-body"
          className="flex flex-row h-full flex-1"
        >
          {/* Left Panel - Monaco Editor */}
          <div
            data-testid="left-panel"
            className="w-1/2 relative"
          >
            <MonacoCodeEditor
              data-testid="monaco-editor"
              value={code}
              onChange={handleCodeChange}
              language="openscad"
              theme="dark"
              height="100%"
              width="100%"
              enableASTParsing
              options={{
                fontSize: 14,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
              }}
            />
          </div>
          
          {/* Splitter */}
          <Splitter />
          
          {/* Right Panel - Visualization */}
          <div
            data-testid="right-panel"
            className="w-1/2 relative"
          >
            <VisualizationPanel
              data-testid="visualization-panel"
              mode="solid"
              aria-label="3D Model Visualization"
            />
          </div>
        </div>
        
        {/* Footer Bar */}
        <FooterBar />
        
        {/* Children for additional content */}
        {children}
      </div>
    );
  }
);

AppLayout.displayName = 'AppLayout';
