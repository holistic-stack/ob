/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { FileExplorer } from './file-explorer';
import type { FileNode } from './file-explorer';

const mockFiles: FileNode[] = [
  {
    id: '1',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: '2',
        name: 'main.js',
        type: 'file',
        size: 1024,
      },
      {
        id: '3',
        name: 'utils.js',
        type: 'file',
        size: 512,
      },
    ],
  },
  {
    id: '4',
    name: 'README.md',
    type: 'file',
    size: 256,
  },
];

describe('FileExplorer', () => {
  it('should render with file tree', () => {
    render(
      <FileExplorer files={mockFiles} />
    );
    
    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });

  it('should apply glass morphism classes', () => {
    render(
      <FileExplorer files={mockFiles} data-testid="file-explorer" />
    );
    
    const explorer = screen.getByTestId('file-explorer');
    expect(explorer).toHaveClass('bg-black/20');
    expect(explorer).toHaveClass('backdrop-blur-sm');
    expect(explorer).toHaveClass('border-white/50');
  });

  it('should handle file selection', () => {
    const onFileSelect = vi.fn();
    render(
      <FileExplorer files={mockFiles} onFileSelect={onFileSelect} />
    );
    
    fireEvent.click(screen.getByText('README.md'));
    expect(onFileSelect).toHaveBeenCalledWith(mockFiles[1]);
  });

  it('should expand/collapse folders', () => {
    render(
      <FileExplorer files={mockFiles} />
    );
    
    const folderButton = screen.getByText('src');
    
    // Initially collapsed, children not visible
    expect(screen.queryByText('main.js')).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(folderButton);
    expect(screen.getByText('main.js')).toBeInTheDocument();
    expect(screen.getByText('utils.js')).toBeInTheDocument();
  });

  it('should show file icons based on type', () => {
    render(
      <FileExplorer files={mockFiles} showIcons />
    );
    
    const folderIcon = screen.getByTestId('folder-icon-1');
    const fileIcon = screen.getByTestId('file-icon-4');
    
    expect(folderIcon).toBeInTheDocument();
    expect(fileIcon).toBeInTheDocument();
  });

  it('should support custom width', () => {
    render(
      <FileExplorer 
        files={mockFiles} 
        width={300} 
        data-testid="file-explorer" 
      />
    );
    
    const explorer = screen.getByTestId('file-explorer');
    expect(explorer).toHaveStyle({ width: '300px' });
  });

  it('should be accessible with keyboard navigation', () => {
    render(
      <FileExplorer files={mockFiles} />
    );
    
    const explorer = screen.getByRole('tree');
    expect(explorer).toBeInTheDocument();
    
    const firstItem = screen.getByRole('treeitem', { name: /src/i });
    expect(firstItem).toHaveAttribute('tabIndex', '0');
  });
});
