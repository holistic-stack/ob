/**
 * Editor Feature Components
 * 
 * A comprehensive code editor interface with glass morphism effects,
 * file explorer, 3D visualization, and console panels.
 */

// ============================================================================
// Component Exports
// ============================================================================

// Editor Layout Component
export { EditorLayout } from './editor-layout';
export type { EditorLayoutProps } from './editor-layout';

// File Explorer Panel
export { FileExplorer } from './file-explorer';
export type { 
  FileExplorerProps,
  FileNode,
  FileType
} from './file-explorer';

// Code Editor Panel
export { CodeEditor } from './code-editor';
export type { 
  CodeEditorProps,
  EditorLanguage,
  EditorTheme
} from './code-editor';

// 3D Visualization Panel
export { VisualizationPanel } from './visualization-panel';
export type { 
  VisualizationPanelProps,
  VisualizationMode
} from './visualization-panel';

// Console Panel
export { ConsolePanel } from './console-panel';
export type {
  ConsolePanelProps,
  ConsoleMessage,
  ConsoleMessageType
} from './console-panel';

// Re-export types for convenience
export type { ViewAction } from './visualization-panel';

// ============================================================================
// Editor Feature Information
// ============================================================================

/**
 * Editor feature metadata
 */
export const EDITOR_INFO = {
  name: 'Liquid Glass Editor',
  version: '1.0.0',
  description: 'Code editor interface with glass morphism effects',
  components: ['EditorLayout', 'FileExplorer', 'CodeEditor', 'VisualizationPanel', 'ConsolePanel'],
  features: [
    'File tree navigation',
    'Syntax highlighting',
    '3D model visualization',
    'Console output',
    'Glass morphism effects',
    'Responsive layout',
    'Accessibility support',
  ],
} as const;
