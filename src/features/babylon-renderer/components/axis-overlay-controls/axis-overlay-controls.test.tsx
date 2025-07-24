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

      expect(screen.getByText('3D Axis Overlay Controls')).toBeInTheDocument();
      expect(screen.getByText('Show Axis Overlay')).toBeInTheDocument();
    });

    it('should display current configuration values', () => {
      render(<AxisOverlayControls />);

      expect(screen.getByText('Tick Interval: 1')).toBeInTheDocument();
      expect(screen.getByText('Font Size: 12px')).toBeInTheDocument();
      expect(screen.getByText('Opacity: 80%')).toBeInTheDocument();
    });

    it('should show status information', () => {
      render(<AxisOverlayControls />);

      expect(screen.getByText('Status: Initialized')).toBeInTheDocument();
      expect(screen.getByText('Zoom Level: 1.0')).toBeInTheDocument();
      expect(screen.getByText('Dynamic Interval: 1.00')).toBeInTheDocument();
    });
  });

  describe('Visibility Control', () => {
    it('should handle visibility toggle', () => {
      render(<AxisOverlayControls />);

      const visibilityCheckbox = screen.getByRole('checkbox', { name: /show axis overlay/i });
      expect(visibilityCheckbox).not.toBeChecked();

      fireEvent.click(visibilityCheckbox);

      expect(mockSetAxisOverlayVisibility).toHaveBeenCalledWith(true);
    });

    it('should reflect current visibility state', () => {
      // Update the mock state for this test
      (mockAxisOverlayState as any).isVisible = true;
      (mockAxisOverlayState.config as any).isVisible = true;

      render(<AxisOverlayControls />);

      const visibilityCheckbox = screen.getByRole('checkbox', { name: /show axis overlay/i });
      expect(visibilityCheckbox).toBeChecked();

      // Reset state for other tests
      (mockAxisOverlayState as any).isVisible = false;
      (mockAxisOverlayState.config as any).isVisible = false;
    });
  });

  describe('Configuration Controls', () => {
    it('should handle tick interval changes', () => {
      render(<AxisOverlayControls />);

      const tickIntervalSlider = screen.getByDisplayValue('1');
      fireEvent.change(tickIntervalSlider, { target: { value: '2.5' } });

      expect(mockUpdateAxisOverlayConfig).toHaveBeenCalledWith({ tickInterval: 2.5 });
    });

    it('should handle font size changes', () => {
      render(<AxisOverlayControls />);

      const fontSizeSlider = screen.getByDisplayValue('12');
      fireEvent.change(fontSizeSlider, { target: { value: '16' } });

      expect(mockUpdateAxisOverlayConfig).toHaveBeenCalledWith({ fontSize: 16 });
    });

    it('should handle opacity changes', () => {
      render(<AxisOverlayControls />);

      const opacitySlider = screen.getByDisplayValue('0.8');
      fireEvent.change(opacitySlider, { target: { value: '0.5' } });

      expect(mockUpdateAxisOverlayConfig).toHaveBeenCalledWith({ opacity: 0.5 });
    });

    it('should handle units selection', () => {
      render(<AxisOverlayControls />);

      const unitsSelect = screen.getByDisplayValue('Units');
      fireEvent.change(unitsSelect, { target: { value: 'mm' } });

      expect(mockUpdateAxisOverlayConfig).toHaveBeenCalledWith({
        units: {
          ...mockAxisOverlayState.config.units,
          type: 'mm',
        },
      });
    });

    it('should handle show ticks toggle', () => {
      render(<AxisOverlayControls />);

      const showTicksCheckbox = screen.getByRole('checkbox', { name: /show tick marks/i });
      expect(showTicksCheckbox).toBeChecked();

      fireEvent.click(showTicksCheckbox);

      expect(mockUpdateAxisOverlayConfig).toHaveBeenCalledWith({ showTicks: false });
    });

    it('should handle show labels toggle', () => {
      render(<AxisOverlayControls />);

      const showLabelsCheckbox = screen.getByRole('checkbox', { name: /show labels/i });
      expect(showLabelsCheckbox).toBeChecked();

      fireEvent.click(showLabelsCheckbox);

      expect(mockUpdateAxisOverlayConfig).toHaveBeenCalledWith({ showLabels: false });
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
    it('should handle valid tick interval changes', () => {
      render(<AxisOverlayControls />);

      const tickIntervalSlider = screen.getByDisplayValue('1');
      fireEvent.change(tickIntervalSlider, { target: { value: '2.5' } });

      expect(mockUpdateAxisOverlayConfig).toHaveBeenCalledWith({ tickInterval: 2.5 });
    });

    it('should handle valid font size changes', () => {
      render(<AxisOverlayControls />);

      const fontSizeSlider = screen.getByDisplayValue('12');
      fireEvent.change(fontSizeSlider, { target: { value: '16' } });

      expect(mockUpdateAxisOverlayConfig).toHaveBeenCalledWith({ fontSize: 16 });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form controls', () => {
      render(<AxisOverlayControls />);

      expect(screen.getByLabelText(/show axis overlay/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show tick marks/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/show labels/i)).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      render(<AxisOverlayControls />);

      const checkboxes = screen.getAllByRole('checkbox');
      const sliders = screen.getAllByRole('slider');
      const select = screen.getByRole('combobox');

      expect(checkboxes).toHaveLength(3); // visibility, ticks, labels
      expect(sliders).toHaveLength(3); // tick interval, font size, opacity
      expect(select).toBeInTheDocument(); // units selection
    });
  });
});
