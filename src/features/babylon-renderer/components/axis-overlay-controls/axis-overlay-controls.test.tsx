/**
 * @file axis-overlay-controls.test.tsx
 * @description Test suite for AxisOverlayControls component following TDD methodology
 * and project testing standards.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AxisOverlayControls } from './axis-overlay-controls';

// Mock the app store
const mockSetAxisOverlayVisibility = vi.fn();
const mockUpdateAxisOverlayConfig = vi.fn();

const mockAxisOverlayState = {
  id: 'test-axis-overlay',
  isInitialized: true,
  isVisible: false,
  config: {
    isVisible: false,
    showTicks: true,
    showLabels: true,
    tickInterval: 1.0,
    majorTickCount: 10,
    minorTickCount: 5,
    fontSize: 12,
    fontFamily: 'Arial, sans-serif',
    opacity: 0.8,
    colors: {
      xAxis: { r: 1, g: 0, b: 0 },
      yAxis: { r: 0, g: 1, b: 0 },
      zAxis: { r: 0, g: 0, b: 1 },
      majorTicks: { r: 0.8, g: 0.8, b: 0.8 },
      minorTicks: { r: 0.5, g: 0.5, b: 0.5 },
      labels: { r: 1, g: 1, b: 1 },
      background: { r: 0, g: 0, b: 0 },
    },
    units: {
      type: 'units' as const,
      precision: 1,
      showUnitSuffix: false,
    },
    position: {
      origin: { x: 0, y: 0, z: 0 },
      axisLength: 10,
      tickLength: 0.2,
      labelOffset: 0.5,
    },
  },
  currentZoomLevel: 1.0,
  dynamicTickInterval: 1.0,
  lastUpdated: new Date(),
  error: null,
};

vi.mock('../../../store/app-store', () => ({
  useAppStore: (selector: any) => {
    const state = {
      babylonRendering: {
        axisOverlay: mockAxisOverlayState,
      },
      setAxisOverlayVisibility: mockSetAxisOverlayVisibility,
      updateAxisOverlayConfig: mockUpdateAxisOverlayConfig,
    };
    return selector(state);
  },
}));

describe('AxisOverlayControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the controls panel', () => {
      render(<AxisOverlayControls />);

      expect(screen.getByText('SketchUp-Style Axes')).toBeInTheDocument();
      expect(screen.getByText('Show Coordinate Axes')).toBeInTheDocument();
    });

    it('should display current configuration values', () => {
      render(<AxisOverlayControls />);

      expect(screen.getByText('Opacity: 80%')).toBeInTheDocument();
    });

    it('should show status information', () => {
      render(<AxisOverlayControls />);

      expect(screen.getByText('Status: Initialized')).toBeInTheDocument();
      expect(screen.getByText('Zoom Level: 1.0')).toBeInTheDocument();
    });

    it('should show SketchUp-style axis information', () => {
      render(<AxisOverlayControls />);

      expect(screen.getByText('SketchUp-Style Coordinate System:')).toBeInTheDocument();
      expect(screen.getByText('Red')).toBeInTheDocument();
      expect(screen.getByText(/= X-axis \(solid positive, dotted negative\)/)).toBeInTheDocument();
      expect(screen.getByText('Green')).toBeInTheDocument();
      expect(screen.getByText(/= Y-axis \(solid positive, dotted negative\)/)).toBeInTheDocument();
      expect(screen.getByText('Blue')).toBeInTheDocument();
      expect(screen.getByText(/= Z-axis \(solid positive, dotted negative\)/)).toBeInTheDocument();
    });
  });

  describe('Visibility Control', () => {
    it('should handle visibility toggle', () => {
      render(<AxisOverlayControls />);

      const visibilityCheckbox = screen.getByRole('checkbox', { name: /show coordinate axes/i });
      expect(visibilityCheckbox).not.toBeChecked();

      fireEvent.click(visibilityCheckbox);

      expect(mockSetAxisOverlayVisibility).toHaveBeenCalledWith(true);
    });

    it('should reflect current visibility state', () => {
      // Update the mock state for this test
      (mockAxisOverlayState as any).isVisible = true;
      (mockAxisOverlayState.config as any).isVisible = true;

      render(<AxisOverlayControls />);

      const visibilityCheckbox = screen.getByRole('checkbox', { name: /show coordinate axes/i });
      expect(visibilityCheckbox).toBeChecked();

      // Reset state for other tests
      (mockAxisOverlayState as any).isVisible = false;
      (mockAxisOverlayState.config as any).isVisible = false;
    });
  });

  describe('Configuration Controls', () => {
    it('should handle opacity changes', () => {
      render(<AxisOverlayControls />);

      const opacitySlider = screen.getByDisplayValue('0.8');
      fireEvent.change(opacitySlider, { target: { value: '0.5' } });

      expect(mockUpdateAxisOverlayConfig).toHaveBeenCalledWith({ opacity: 0.5 });
    });

    it('should display opacity percentage correctly', () => {
      render(<AxisOverlayControls />);

      expect(screen.getByText('Opacity: 80%')).toBeInTheDocument();
    });

    it('should have correct opacity slider attributes', () => {
      render(<AxisOverlayControls />);

      const opacitySlider = screen.getByDisplayValue('0.8');
      expect(opacitySlider).toHaveAttribute('min', '0.1');
      expect(opacitySlider).toHaveAttribute('max', '1');
      expect(opacitySlider).toHaveAttribute('step', '0.1');
    });
  });

  describe('Error Handling', () => {
    it('should display error messages when present', () => {
      // Update the mock state for this test
      (mockAxisOverlayState as any).error = {
        type: 'INITIALIZATION_FAILED' as const,
        message: 'Test error message',
        timestamp: new Date(),
      };

      render(<AxisOverlayControls />);

      expect(screen.getByText('Error: Test error message')).toBeInTheDocument();

      // Reset state for other tests
      (mockAxisOverlayState as any).error = null;
    });

    it('should not display error section when no error', () => {
      render(<AxisOverlayControls />);

      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('should handle valid opacity changes', () => {
      render(<AxisOverlayControls />);

      const opacitySlider = screen.getByDisplayValue('0.8');
      fireEvent.change(opacitySlider, { target: { value: '0.5' } });

      expect(mockUpdateAxisOverlayConfig).toHaveBeenCalledWith({ opacity: 0.5 });
    });

    it('should handle edge case opacity values', () => {
      render(<AxisOverlayControls />);

      const opacitySlider = screen.getByDisplayValue('0.8');
      
      // Test minimum value
      fireEvent.change(opacitySlider, { target: { value: '0.1' } });
      expect(mockUpdateAxisOverlayConfig).toHaveBeenCalledWith({ opacity: 0.1 });
      
      // Test maximum value
      fireEvent.change(opacitySlider, { target: { value: '1' } });
      expect(mockUpdateAxisOverlayConfig).toHaveBeenCalledWith({ opacity: 1 });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form controls', () => {
      render(<AxisOverlayControls />);

      expect(screen.getByLabelText(/show coordinate axes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/opacity/i)).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      render(<AxisOverlayControls />);

      const checkboxes = screen.getAllByRole('checkbox');
      const sliders = screen.getAllByRole('slider');

      expect(checkboxes).toHaveLength(1); // visibility only
      expect(sliders).toHaveLength(1); // opacity only
    });

    it('should have proper heading structure', () => {
      render(<AxisOverlayControls />);

      const heading = screen.getByRole('heading', { name: /sketchup-style axes/i });
      expect(heading).toBeInTheDocument();
    });
  });
});
