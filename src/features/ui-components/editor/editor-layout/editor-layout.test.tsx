/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { EditorLayout } from './editor-layout';

describe('EditorLayout', () => {
  it('should render with required props', () => {
    render(
      <EditorLayout>
        <div data-testid="editor-content">Editor Content</div>
      </EditorLayout>
    );
    
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should apply glass morphism classes', () => {
    render(
      <EditorLayout data-testid="editor-layout">
        <div>Content</div>
      </EditorLayout>
    );
    
    const layout = screen.getByTestId('editor-layout');
    expect(layout).toHaveClass('bg-black/20');
    expect(layout).toHaveClass('backdrop-blur-sm');
    expect(layout).toHaveClass('border-white/50');
  });

  it('should support custom className', () => {
    render(
      <EditorLayout className="custom-class" data-testid="editor-layout">
        <div>Content</div>
      </EditorLayout>
    );
    
    const layout = screen.getByTestId('editor-layout');
    expect(layout).toHaveClass('custom-class');
  });

  it('should render with proper ARIA attributes', () => {
    render(
      <EditorLayout aria-label="Code Editor Interface">
        <div>Content</div>
      </EditorLayout>
    );
    
    const layout = screen.getByRole('main');
    expect(layout).toHaveAttribute('aria-label', 'Code Editor Interface');
  });

  it('should support different layout variants', () => {
    render(
      <EditorLayout variant="compact" data-testid="editor-layout">
        <div>Content</div>
      </EditorLayout>
    );
    
    const layout = screen.getByTestId('editor-layout');
    expect(layout).toHaveClass('p-2'); // Compact padding
  });

  it('should handle responsive layout', () => {
    render(
      <EditorLayout responsive data-testid="editor-layout">
        <div>Content</div>
      </EditorLayout>
    );
    
    const layout = screen.getByTestId('editor-layout');
    expect(layout).toHaveClass('flex-col');
    expect(layout).toHaveClass('lg:flex-row');
  });
});
