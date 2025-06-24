/**
 * App Layout Component Tests
 * 
 * TDD Test Suite for CAD-style Liquid Glass Layout
 * Following Red-Green-Refactor methodology with comprehensive coverage
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppLayout } from './app-layout';
import type { AppLayoutProps, FileName } from './types';

// Mock child components to isolate layout testing
vi.mock('../editor/code-editor/monaco-code-editor', () => ({
  MonacoCodeEditor: ({ 'data-testid': testId }: { 'data-testid'?: string }) => (
    <div data-testid={testId || 'monaco-editor'}>Monaco Editor Mock</div>
  ),
}));

vi.mock('../editor/visualization-panel/visualization-panel', () => ({
  VisualizationPanel: ({ 'data-testid': testId }: { 'data-testid'?: string }) => (
    <div data-testid={testId || 'visualization-panel'}>Visualization Panel Mock</div>
  ),
}));

// Test data
const defaultProps: AppLayoutProps = {
  fileName: 'untitled.scad' as FileName,
  onFileNameChange: vi.fn(),
  onRender: vi.fn(),
  onMoreOptions: vi.fn(),
  children: null,
};

describe('AppLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Layout Structure', () => {
    it('should render main layout container with proper structure', () => {
      render(<AppLayout {...defaultProps} />);
      
      // Main container should exist
      const container = screen.getByTestId('app-layout-container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('h-screen', 'w-screen', 'overflow-hidden');
    });

    it('should render header bar with logo, file name, and user avatar', () => {
      render(<AppLayout {...defaultProps} fileName={'test.scad' as FileName} />);
      
      // Header bar should exist
      const header = screen.getByTestId('header-bar');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('h-16'); // 64px following 8px grid
      
      // Logo placeholder
      expect(screen.getByTestId('logo-placeholder')).toBeInTheDocument();
      
      // File name display
      expect(screen.getByTestId('file-name-display')).toBeInTheDocument();
      expect(screen.getByText('test.scad')).toBeInTheDocument();
      
      // User avatar placeholder
      expect(screen.getByTestId('user-avatar-placeholder')).toBeInTheDocument();
    });

    it('should render toolbar with tab navigation and action buttons', () => {
      render(<AppLayout {...defaultProps} />);
      
      // Toolbar should exist
      const toolbar = screen.getByTestId('toolbar');
      expect(toolbar).toBeInTheDocument();
      expect(toolbar).toHaveClass('h-12'); // 48px following 8px grid
      
      // Tab navigation
      expect(screen.getByTestId('tab-openscad-code')).toBeInTheDocument();
      expect(screen.getByTestId('tab-ast-tree')).toBeInTheDocument();
      
      // Action buttons
      expect(screen.getByTestId('render-button')).toBeInTheDocument();
      expect(screen.getByTestId('more-options-button')).toBeInTheDocument();
    });

    it('should render main body with split layout', () => {
      render(<AppLayout {...defaultProps} />);
      
      // Main body should exist
      const mainBody = screen.getByTestId('main-body');
      expect(mainBody).toBeInTheDocument();
      expect(mainBody).toHaveClass('flex', 'flex-row', 'h-full');
      
      // Left panel (Monaco Editor)
      const leftPanel = screen.getByTestId('left-panel');
      expect(leftPanel).toBeInTheDocument();
      expect(leftPanel).toHaveClass('w-1/2');
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      
      // Right panel (Visualization)
      const rightPanel = screen.getByTestId('right-panel');
      expect(rightPanel).toBeInTheDocument();
      expect(rightPanel).toHaveClass('w-1/2');
      expect(screen.getByTestId('visualization-panel')).toBeInTheDocument();
      
      // Splitter
      expect(screen.getByTestId('splitter')).toBeInTheDocument();
    });

    it('should render footer bar with console viewer', () => {
      render(<AppLayout {...defaultProps} />);
      
      // Footer bar should exist
      const footer = screen.getByTestId('footer-bar');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('h-10'); // 40px collapsed
      
      // Console viewer placeholder
      expect(screen.getByTestId('console-viewer-placeholder')).toBeInTheDocument();
    });
  });

  describe('Glass Morphism Styling', () => {
    it('should apply glass morphism effects to header bar', () => {
      render(<AppLayout {...defaultProps} />);
      
      const header = screen.getByTestId('header-bar');
      expect(header).toHaveClass(
        'bg-black/20',
        'backdrop-blur-sm',
        'border-white/50'
      );
    });

    it('should apply glass morphism effects to toolbar', () => {
      render(<AppLayout {...defaultProps} />);
      
      const toolbar = screen.getByTestId('toolbar');
      expect(toolbar).toHaveClass(
        'bg-black/20',
        'backdrop-blur-sm',
        'border-white/50'
      );
    });

    it('should apply glass morphism effects to footer bar', () => {
      render(<AppLayout {...defaultProps} />);
      
      const footer = screen.getByTestId('footer-bar');
      expect(footer).toHaveClass(
        'bg-black/20',
        'backdrop-blur-sm'
      );
    });

    it('should apply complex shadow system to glass elements', () => {
      render(<AppLayout {...defaultProps} />);
      
      const header = screen.getByTestId('header-bar');
      expect(header).toHaveClass(
        'shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]'
      );
    });
  });

  describe('8px Grid System', () => {
    it('should follow 8px grid for container spacing', () => {
      render(<AppLayout {...defaultProps} />);
      
      const header = screen.getByTestId('header-bar');
      expect(header).toHaveClass('px-6'); // 24px horizontal padding
      
      const toolbar = screen.getByTestId('toolbar');
      expect(toolbar).toHaveClass('px-6', 'gap-4'); // 24px padding, 16px gaps
    });

    it('should use proper heights following 8px grid', () => {
      render(<AppLayout {...defaultProps} />);
      
      expect(screen.getByTestId('header-bar')).toHaveClass('h-16'); // 64px
      expect(screen.getByTestId('toolbar')).toHaveClass('h-12'); // 48px
      expect(screen.getByTestId('footer-bar')).toHaveClass('h-10'); // 40px
    });
  });

  describe('Interaction Behavior', () => {
    it('should handle render button click', async () => {
      const onRender = vi.fn();
      render(<AppLayout {...defaultProps} onRender={onRender} />);
      
      const renderButton = screen.getByTestId('render-button');
      fireEvent.click(renderButton);
      
      await waitFor(() => {
        expect(onRender).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle more options button click', async () => {
      const onMoreOptions = vi.fn();
      render(<AppLayout {...defaultProps} onMoreOptions={onMoreOptions} />);
      
      const moreOptionsButton = screen.getByTestId('more-options-button');
      fireEvent.click(moreOptionsButton);
      
      await waitFor(() => {
        expect(onMoreOptions).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle file name change', async () => {
      const onFileNameChange = vi.fn();
      render(<AppLayout {...defaultProps} onFileNameChange={onFileNameChange} />);
      
      const fileNameDisplay = screen.getByTestId('file-name-display');
      fireEvent.click(fileNameDisplay);
      
      // Should trigger edit mode (implementation detail)
      await waitFor(() => {
        expect(onFileNameChange).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AppLayout {...defaultProps} />);
      
      expect(screen.getByTestId('app-layout-container')).toHaveAttribute('role', 'main');
      expect(screen.getByTestId('header-bar')).toHaveAttribute('role', 'banner');
      expect(screen.getByTestId('toolbar')).toHaveAttribute('role', 'toolbar');
      expect(screen.getByTestId('footer-bar')).toHaveAttribute('role', 'contentinfo');
    });

    it('should support keyboard navigation', () => {
      render(<AppLayout {...defaultProps} />);
      
      const renderButton = screen.getByTestId('render-button');
      expect(renderButton).toHaveAttribute('tabIndex', '0');
      
      const moreOptionsButton = screen.getByTestId('more-options-button');
      expect(moreOptionsButton).toHaveAttribute('tabIndex', '0');
    });

    it('should have sufficient contrast for text elements', () => {
      render(<AppLayout {...defaultProps} />);
      
      // File name should have high contrast
      const fileName = screen.getByTestId('file-name-display');
      expect(fileName).toHaveClass('text-white'); // High contrast on dark glass
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain layout structure on different screen sizes', () => {
      render(<AppLayout {...defaultProps} />);
      
      const mainBody = screen.getByTestId('main-body');
      expect(mainBody).toHaveClass('flex-row'); // Horizontal layout
      
      // Panels should maintain 50/50 split
      expect(screen.getByTestId('left-panel')).toHaveClass('w-1/2');
      expect(screen.getByTestId('right-panel')).toHaveClass('w-1/2');
    });
  });
});
