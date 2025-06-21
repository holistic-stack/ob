/**
 * File Explorer Component
 * 
 * A file tree navigation component with glass morphism effects.
 * Supports folder expansion/collapse, file selection, and keyboard navigation.
 */

import React, { forwardRef, useState } from 'react';
import {
  clsx,
  generateGlassClasses,
  generateAccessibleStyles,
  type BaseComponentProps,
  type AriaProps,
  type GlassConfig,
} from '../../shared';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * File type enumeration
 */
export type FileType = 'file' | 'folder';

/**
 * File node structure for tree representation
 */
export interface FileNode {
  readonly id: string;
  readonly name: string;
  readonly type: FileType;
  readonly size?: number;
  readonly children?: readonly FileNode[];
  readonly path?: string;
}

/**
 * Props for the FileExplorer component
 */
export interface FileExplorerProps extends BaseComponentProps, AriaProps {
  /** File tree data */
  readonly files: readonly FileNode[];
  
  /** Callback when a file is selected */
  readonly onFileSelect?: (file: FileNode) => void;
  
  /** Callback when a folder is expanded/collapsed */
  readonly onFolderToggle?: (folder: FileNode, expanded: boolean) => void;
  
  /** Whether to show file type icons */
  readonly showIcons?: boolean;
  
  /** Width of the file explorer panel */
  readonly width?: number;
  
  /** Glass morphism configuration */
  readonly glassConfig?: Partial<GlassConfig>;
  
  /** Whether the explorer is over a light background */
  readonly overLight?: boolean;
  
  /** Custom CSS class name */
  readonly className?: string;
  
  /** Test ID for testing */
  readonly 'data-testid'?: string;
}

// ============================================================================
// File Icon Components
// ============================================================================

const FolderIcon: React.FC<{ id: string }> = ({ id }) => (
  <svg
    data-testid={`folder-icon-${id}`}
    className="w-4 h-4 text-blue-400"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
);

const FileIcon: React.FC<{ id: string }> = ({ id }) => (
  <svg
    data-testid={`file-icon-${id}`}
    className="w-4 h-4 text-gray-400"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);

// ============================================================================
// File Tree Item Component
// ============================================================================

interface FileTreeItemProps {
  readonly file: FileNode;
  readonly level: number;
  readonly showIcons: boolean;
  readonly onFileSelect?: (file: FileNode) => void;
  readonly onFolderToggle?: (folder: FileNode, expanded: boolean) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  file,
  level,
  showIcons,
  onFileSelect,
  onFolderToggle,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleClick = () => {
    if (file.type === 'folder') {
      const newExpanded = !isExpanded;
      setIsExpanded(newExpanded);
      onFolderToggle?.(file, newExpanded);
    } else {
      onFileSelect?.(file);
    }
  };
  
  const paddingLeft = `${level * 16 + 8}px`;
  
  return (
    <>
      <div
        role="treeitem"
        tabIndex={level === 0 ? 0 : -1}
        className={clsx(
          'flex items-center gap-2 py-1 px-2 cursor-pointer',
          'hover:bg-white/10 transition-colors duration-150',
          'text-white/90 text-sm'
        )}
        style={{ paddingLeft }}
        onClick={handleClick}
        aria-expanded={file.type === 'folder' ? isExpanded : undefined}
      >
        {showIcons && (
          file.type === 'folder' ? (
            <FolderIcon id={file.id} />
          ) : (
            <FileIcon id={file.id} />
          )
        )}
        <span className="truncate">{file.name}</span>
        {file.size && (
          <span className="text-xs text-white/60 ml-auto">
            {Math.round(file.size / 1024)}KB
          </span>
        )}
      </div>
      
      {file.type === 'folder' && isExpanded && file.children && (
        <div role="group">
          {file.children.map((child) => (
            <FileTreeItem
              key={child.id}
              file={child}
              level={level + 1}
              showIcons={showIcons}
              onFileSelect={onFileSelect}
              onFolderToggle={onFolderToggle}
            />
          ))}
        </div>
      )}
    </>
  );
};

// ============================================================================
// FileExplorer Component
// ============================================================================

/**
 * File Explorer component with glass morphism effects
 * 
 * @example
 * ```tsx
 * <FileExplorer 
 *   files={fileTree} 
 *   onFileSelect={(file) => console.log('Selected:', file.name)}
 *   showIcons
 * />
 * ```
 */
export const FileExplorer = forwardRef<HTMLDivElement, FileExplorerProps>(
  (
    {
      files,
      onFileSelect,
      onFolderToggle,
      showIcons = true,
      width = 250,
      glassConfig,
      overLight = false,
      className,
      'data-testid': dataTestId,
      'aria-label': ariaLabel,
      ...rest
    },
    ref
  ) => {
    // ========================================================================
    // Style Generation
    // ========================================================================
    
    const glassClasses = generateGlassClasses(glassConfig || {}, overLight);
    
    const explorerClasses = generateAccessibleStyles(
      clsx(
        // Base explorer styles
        'h-full overflow-y-auto',
        'border-r border-white/20',
        
        // Glass morphism effects
        'bg-black/20 backdrop-blur-sm border border-white/50 rounded-l-lg',
        'shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]',
        
        // Gradient pseudo-elements
        'before:absolute before:inset-0 before:rounded-l-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none',
        'after:absolute after:inset-0 after:rounded-l-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none',
        
        // Position for pseudo-elements
        'relative',
        
        // Custom className
        className
      )
    );

    // ========================================================================
    // Render
    // ========================================================================
    
    return (
      <div
        ref={ref}
        className={explorerClasses}
        style={{ width: `${width}px` }}
        data-testid={dataTestId}
        {...rest}
      >
        <div className="relative z-10 p-2">
          <div
            role="tree"
            aria-label={ariaLabel || 'File Explorer'}
            className="space-y-1"
          >
            {files.map((file) => (
              <FileTreeItem
                key={file.id}
                file={file}
                level={0}
                showIcons={showIcons}
                onFileSelect={onFileSelect}
                onFolderToggle={onFolderToggle}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
);

FileExplorer.displayName = 'FileExplorer';

// ============================================================================
// Default Export
// ============================================================================

export default FileExplorer;
