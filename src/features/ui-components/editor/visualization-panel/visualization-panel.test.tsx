/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { VisualizationPanel } from './visualization-panel';

// Mock canvas for testing - using HTMLCanvasElement.prototype override
// This approach provides actual canvas methods without full mock complexity
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: (contextType: string) => {
    if (contextType === '2d') {
      // Return a minimal 2D context-like object for testing
      return {
        fillStyle: '',
        fillRect: () => {},
        strokeStyle: '',
        lineWidth: 0,
        beginPath: () => {},
        rect: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        // Add additional properties as needed for tests
        canvas: null,
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
        drawImage: () => {},
        // Add other required CanvasRenderingContext2D properties
        imageSmoothingEnabled: true,
        save: () => {},
        restore: () => {},
        scale: () => {},
        rotate: () => {},
        translate: () => {},
        transform: () => {},
        setTransform: () => {},
        resetTransform: () => {},
        clearRect: () => {},
        fill: () => {},
        clip: () => {},
        isPointInPath: () => false,
        isPointInStroke: () => false,
        measureText: () => ({ width: 0, actualBoundingBoxLeft: 0, actualBoundingBoxRight: 0, fontBoundingBoxAscent: 0, fontBoundingBoxDescent: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0, emHeightAscent: 0, emHeightDescent: 0, hangingBaseline: 0, alphabeticBaseline: 0, ideographicBaseline: 0 }),
        // Add other methods as required
      } as any;
    }
    return null;
  },
  writable: true,
});

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
      <VisualizationPanel mode="preview" />
    );
    
    expect(screen.getByText('Loading 3D model...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(
      <VisualizationPanel mode="preview" />
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
    const modelData = { vertices: [], indices: [] };
    render(
      <VisualizationPanel modelData={modelData} />
    );
    
    const canvas = screen.getByRole('img', { name: /3d visualization/i });
    expect(canvas).toBeInTheDocument();
  });

  it('should support custom width', () => {
    render(
      <VisualizationPanel 
        mode="solid"
        data-testid="visualization-panel"
      />
    );
    
    const panel = screen.getByTestId('visualization-panel');
    expect(panel).toHaveStyle({ width: '400px' });
  });

  // View controls test removed - camera controls now handled by Babylon.js GUI navigation cube

  it('should be accessible', () => {
    render(
      <VisualizationPanel aria-label="3D Model Viewer" />
    );
    
    const panel = screen.getByRole('region');
    expect(panel).toHaveAttribute('aria-label', '3D Model Viewer');
  });
});
