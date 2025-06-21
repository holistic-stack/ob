/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { VisualizationPanel } from './visualization-panel';

// Mock canvas getContext
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillStyle: '',
  fillRect: vi.fn(),
  strokeStyle: '',
  lineWidth: 0,
  beginPath: vi.fn(),
  rect: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
}));

describe('VisualizationPanel', () => {
  it('should render with default props', () => {
    render(
      <VisualizationPanel />
    );
    
    const panel = screen.getByRole('region');
    expect(panel).toBeInTheDocument();
    expect(screen.getByText('3D Visualization')).toBeInTheDocument();
  });

  it('should apply glass morphism classes', () => {
    render(
      <VisualizationPanel data-testid="visualization-panel" />
    );
    
    const panel = screen.getByTestId('visualization-panel');
    expect(panel).toHaveClass('bg-black/20');
    expect(panel).toHaveClass('backdrop-blur-sm');
    expect(panel).toHaveClass('border-white/50');
  });

  it('should show loading state', () => {
    render(
      <VisualizationPanel loading />
    );
    
    expect(screen.getByText('Loading 3D model...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(
      <VisualizationPanel error="Failed to load model" />
    );
    
    expect(screen.getByText('Failed to load model')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should support different visualization modes', () => {
    render(
      <VisualizationPanel 
        mode="wireframe" 
        data-testid="visualization-panel"
      />
    );
    
    const panel = screen.getByTestId('visualization-panel');
    expect(panel).toHaveAttribute('data-mode', 'wireframe');
  });

  it('should handle model data', () => {
    const modelData = { vertices: [], faces: [] };
    render(
      <VisualizationPanel modelData={modelData} />
    );
    
    const canvas = screen.getByRole('img', { name: /3d visualization/i });
    expect(canvas).toBeInTheDocument();
  });

  it('should support custom width', () => {
    render(
      <VisualizationPanel 
        width={400} 
        data-testid="visualization-panel"
      />
    );
    
    const panel = screen.getByTestId('visualization-panel');
    expect(panel).toHaveStyle({ width: '400px' });
  });

  it('should handle view controls', () => {
    const onViewChange = vi.fn();
    render(
      <VisualizationPanel 
        showControls 
        onViewChange={onViewChange}
      />
    );
    
    const resetButton = screen.getByRole('button', { name: /reset view/i });
    fireEvent.click(resetButton);
    
    expect(onViewChange).toHaveBeenCalledWith('reset');
  });

  it('should be accessible', () => {
    render(
      <VisualizationPanel aria-label="3D Model Viewer" />
    );
    
    const panel = screen.getByRole('region');
    expect(panel).toHaveAttribute('aria-label', '3D Model Viewer');
  });
});
