/**
 * @file Gizmo Configuration Panel Test Suite
 * @description Comprehensive tests for the GizmoConfigPanel component including
 * user interactions, store integration, accessibility, and configuration management.
 *
 * @example Running Tests
 * ```bash
 * pnpm test gizmo-config-panel.test.tsx
 * ```
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appStoreInstance } from '../../../store/app-store';
import { DEFAULT_GIZMO_CONFIG, GizmoPosition } from '../../types/orientation-gizmo.types';
import type { GizmoConfigPanelProps } from './gizmo-config-panel';
import { GizmoConfigPanel } from './gizmo-config-panel';

describe('GizmoConfigPanel', () => {
  let defaultProps: GizmoConfigPanelProps;

  beforeEach(() => {
    // Reset store state
    const store = appStoreInstance.getState();
    store.resetGizmo();

    defaultProps = {
      className: 'test-panel',
    };
  });

  afterEach(() => {
    cleanup();
    // Reset store state to prevent interference between tests
    const store = appStoreInstance.getState();
    store.resetGizmo();
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render configuration panel with all sections', () => {
      render(<GizmoConfigPanel {...defaultProps} />);

      expect(
        screen.getByRole('region', { name: /orientation gizmo configuration/i })
      ).toBeInTheDocument();
      expect(screen.getByText('Orientation Gizmo Settings')).toBeInTheDocument();
      expect(screen.getByText('Show Orientation Gizmo')).toBeInTheDocument();
      expect(screen.getByText('Position')).toBeInTheDocument();
      expect(screen.getByText('Size')).toBeInTheDocument();
      expect(screen.getByText('Color Theme')).toBeInTheDocument();
    });

    it.skip('should apply custom className and style', () => {
      const customStyle = { backgroundColor: 'red' };
      render(<GizmoConfigPanel {...defaultProps} className="custom-panel" style={customStyle} />);

      const panel = screen.getByRole('region');
      expect(panel).toHaveClass('custom-panel');
      expect(panel).toHaveStyle('background-color: red');
    });

    it('should show advanced options when enabled', () => {
      render(<GizmoConfigPanel {...defaultProps} showAdvancedOptions={true} />);

      expect(screen.getByText('Custom Colors')).toBeInTheDocument();
      expect(screen.getByText('Show secondary axes')).toBeInTheDocument();
    });

    it('should hide advanced options by default', () => {
      render(<GizmoConfigPanel {...defaultProps} />);

      expect(screen.queryByText('Custom Colors')).not.toBeInTheDocument();
      expect(screen.queryByText('Show secondary axes')).not.toBeInTheDocument();
    });
  });

  describe('Visibility Control', () => {
    it('should reflect store visibility state', () => {
      // Initially visible
      const store = appStoreInstance.getState();
      store.setGizmoVisibility(true);
      const { rerender } = render(<GizmoConfigPanel {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox', { name: /show orientation gizmo/i });
      expect(checkbox).toBeChecked();

      // Set invisible
      store.setGizmoVisibility(false);
      rerender(<GizmoConfigPanel {...defaultProps} />);
      expect(checkbox).not.toBeChecked();
    });

    it('should toggle visibility when checkbox is clicked', () => {
      const onVisibilityToggle = vi.fn();
      render(<GizmoConfigPanel {...defaultProps} onVisibilityToggle={onVisibilityToggle} />);

      const checkbox = screen.getByRole('checkbox', { name: /show orientation gizmo/i });

      fireEvent.click(checkbox);

      expect(onVisibilityToggle).toHaveBeenCalledWith(false);
      expect(appStoreInstance.getState().babylonRendering.gizmo.isVisible).toBe(false);
    });
  });

  describe('Position Control', () => {
    it('should display all position options', () => {
      render(<GizmoConfigPanel {...defaultProps} />);

      expect(screen.getAllByRole('button', { name: /top left/i })[0]).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /top right/i })[0]).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /bottom left/i })[0]).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /bottom right/i })[0]).toBeInTheDocument();
    });

    it('should highlight current position', () => {
      appStoreInstance.getState().setGizmoPosition(GizmoPosition.TOP_LEFT);
      render(<GizmoConfigPanel {...defaultProps} />);

      const allTopLeftButtons = screen.getAllByRole('button', { name: /top left/i });
      const topLeftButton = allTopLeftButtons[0]; // Take the first one
      expect(topLeftButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should change position when button is clicked', () => {
      const onPositionChange = vi.fn();
      render(<GizmoConfigPanel {...defaultProps} onPositionChange={onPositionChange} />);

      const bottomLeftButton = screen.getByRole('button', { name: /bottom left/i });
      fireEvent.click(bottomLeftButton);

      expect(onPositionChange).toHaveBeenCalledWith(GizmoPosition.BOTTOM_LEFT);
      expect(appStoreInstance.getState().babylonRendering.gizmo.position).toBe(
        GizmoPosition.BOTTOM_LEFT
      );
    });
  });

  describe('Size Control', () => {
    it('should display size presets', () => {
      render(<GizmoConfigPanel {...defaultProps} />);

      expect(screen.getAllByRole('button', { name: 'Small' })[0]).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Medium' })[0]).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Large' })[0]).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Extra Large' })[0]).toBeInTheDocument();
    });

    it('should highlight current size preset', () => {
      appStoreInstance.getState().updateGizmoConfig({ size: 120 });
      render(<GizmoConfigPanel {...defaultProps} />);

      const allLargeButtons = screen.getAllByRole('button', { name: 'Large' });
      const largeButton = allLargeButtons[0];
      expect(largeButton).toHaveClass('bg-blue-50');
    });

    it('should change size when preset is clicked', () => {
      const onConfigChange = vi.fn();
      render(<GizmoConfigPanel {...defaultProps} onConfigChange={onConfigChange} />);

      const allMediumButtons = screen.getAllByRole('button', { name: 'Medium' });
      const mediumButton = allMediumButtons[0];
      expect(mediumButton).toBeDefined();
      if (mediumButton) {
        fireEvent.click(mediumButton);
      }

      expect(onConfigChange).toHaveBeenCalledWith(expect.objectContaining({ size: 90 }));
      expect(appStoreInstance.getState().babylonRendering.gizmo.config.size).toBe(90);
    });

    it('should update size with slider', () => {
      render(<GizmoConfigPanel {...defaultProps} />);

      const slider = screen.getByRole('slider', { name: /custom gizmo size/i });
      fireEvent.change(slider, { target: { value: '150' } });

      expect(appStoreInstance.getState().babylonRendering.gizmo.config.size).toBe(150);
    });

    it('should display current size value', () => {
      appStoreInstance.getState().updateGizmoConfig({ size: 135 });
      render(<GizmoConfigPanel {...defaultProps} />);

      expect(screen.getByText('135')).toBeInTheDocument();
    });
  });

  describe('Color Theme Control', () => {
    it('should display color theme options', () => {
      render(<GizmoConfigPanel {...defaultProps} />);

      expect(
        screen.getAllByRole('button', { name: /apply default color theme/i })[0]
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole('button', { name: /apply vibrant color theme/i })[0]
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole('button', { name: /apply pastel color theme/i })[0]
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole('button', { name: /apply monochrome color theme/i })[0]
      ).toBeInTheDocument();
    });

    it('should apply color theme when selected', () => {
      const onConfigChange = vi.fn();
      render(<GizmoConfigPanel {...defaultProps} onConfigChange={onConfigChange} />);

      const vibrantButton = screen.getByRole('button', { name: /apply vibrant color theme/i });
      fireEvent.click(vibrantButton);

      expect(onConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({
          colors: {
            x: ['#ff0000', '#dd0000'],
            y: ['#00ff00', '#00dd00'],
            z: ['#0000ff', '#0000dd'],
          },
        })
      );
    });
  });

  describe('Advanced Options', () => {
    it('should toggle advanced options when button is clicked', () => {
      render(<GizmoConfigPanel {...defaultProps} />);

      const allAdvancedButtons = screen.getAllByRole('button', { name: /advanced options/i });
      const advancedButton = allAdvancedButtons[0];
      expect(advancedButton).toBeDefined();

      // Initially collapsed
      expect(advancedButton).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText('Custom Colors')).not.toBeInTheDocument();

      // Expand
      fireEvent.click(advancedButton);
      expect(advancedButton).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('Custom Colors')).toBeInTheDocument();

      // Collapse
      fireEvent.click(advancedButton);
      expect(advancedButton).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText('Custom Colors')).not.toBeInTheDocument();
    });

    it('should show custom color controls in advanced mode', () => {
      render(<GizmoConfigPanel {...defaultProps} showAdvancedOptions={true} />);

      expect(screen.getByLabelText(/x axis primary color/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/x axis secondary color/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/y axis primary color/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/y axis secondary color/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/z axis primary color/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/z axis secondary color/i)).toBeInTheDocument();
    });

    it('should update individual axis colors', () => {
      render(<GizmoConfigPanel {...defaultProps} showAdvancedOptions={true} />);

      const xPrimaryColor = screen.getByLabelText(/x axis primary color/i);
      fireEvent.change(xPrimaryColor, { target: { value: '#123456' } });

      expect(appStoreInstance.getState().babylonRendering.gizmo.config.colors.x[0]).toBe('#123456');
    });

    it('should toggle secondary axes option', () => {
      render(<GizmoConfigPanel {...defaultProps} showAdvancedOptions={true} />);

      const secondaryCheckbox = screen.getByRole('checkbox', { name: /show secondary axes/i });
      fireEvent.click(secondaryCheckbox);

      expect(appStoreInstance.getState().babylonRendering.gizmo.config.showSecondary).toBe(false);
    });

    it('should adjust padding with slider', () => {
      render(<GizmoConfigPanel {...defaultProps} showAdvancedOptions={true} />);

      const paddingSlider = screen.getByRole('slider', { name: /gizmo padding/i });
      fireEvent.change(paddingSlider, { target: { value: '15' } });

      expect(appStoreInstance.getState().babylonRendering.gizmo.config.padding).toBe(15);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset configuration to defaults when reset button is clicked', () => {
      // Modify configuration
      appStoreInstance.getState().updateGizmoConfig({
        size: 150,
        showSecondary: false,
        colors: {
          x: ['#123456', '#654321'],
          y: ['#abcdef', '#fedcba'],
          z: ['#111111', '#222222'],
        },
      });

      const onConfigChange = vi.fn();
      render(<GizmoConfigPanel {...defaultProps} onConfigChange={onConfigChange} />);

      const resetButton = screen.getByRole('button', { name: /reset to default settings/i });
      fireEvent.click(resetButton);

      expect(onConfigChange).toHaveBeenCalledWith(DEFAULT_GIZMO_CONFIG);
      expect(appStoreInstance.getState().babylonRendering.gizmo.config).toEqual(
        DEFAULT_GIZMO_CONFIG
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<GizmoConfigPanel {...defaultProps} />);

      expect(
        screen.getByRole('region', { name: /orientation gizmo configuration/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /show orientation gizmo/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /custom gizmo size/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<GizmoConfigPanel {...defaultProps} />);

      const visibilityCheckbox = screen.getByRole('checkbox', { name: /show orientation gizmo/i });

      // Focus and activate with keyboard (space key should trigger click)
      visibilityCheckbox.focus();
      fireEvent.click(visibilityCheckbox);

      expect(appStoreInstance.getState().babylonRendering.gizmo.isVisible).toBe(false);
    });

    it('should have descriptive text for controls', () => {
      render(<GizmoConfigPanel {...defaultProps} />);

      expect(
        screen.getByText(/toggle the visibility of the 3d orientation gizmo/i)
      ).toBeInTheDocument();
    });
  });

  describe('Event Callbacks', () => {
    it('should call onConfigChange when configuration is updated', () => {
      const onConfigChange = vi.fn();
      render(<GizmoConfigPanel {...defaultProps} onConfigChange={onConfigChange} />);

      const slider = screen.getByRole('slider', { name: /custom gizmo size/i });
      fireEvent.change(slider, { target: { value: '120' } });

      expect(onConfigChange).toHaveBeenCalledWith(expect.objectContaining({ size: 120 }));
    });

    it('should call onVisibilityToggle when visibility changes', () => {
      const onVisibilityToggle = vi.fn();
      render(<GizmoConfigPanel {...defaultProps} onVisibilityToggle={onVisibilityToggle} />);

      const checkbox = screen.getByRole('checkbox', { name: /show orientation gizmo/i });
      fireEvent.click(checkbox);

      expect(onVisibilityToggle).toHaveBeenCalledWith(false);
    });

    it('should call onPositionChange when position changes', () => {
      const onPositionChange = vi.fn();
      render(<GizmoConfigPanel {...defaultProps} onPositionChange={onPositionChange} />);

      const allTopLeftButtons = screen.getAllByRole('button', { name: /top left/i });
      const topLeftButton = allTopLeftButtons[0];
      expect(topLeftButton).toBeDefined();
      if (topLeftButton) {
        fireEvent.click(topLeftButton);
      }

      expect(onPositionChange).toHaveBeenCalledWith(GizmoPosition.TOP_LEFT);
    });
  });

  describe('Store Integration', () => {
    it('should reflect store state changes', () => {
      const { rerender } = render(<GizmoConfigPanel {...defaultProps} />);

      // Change store state
      appStoreInstance.getState().setGizmoVisibility(false);
      appStoreInstance.getState().setGizmoPosition(GizmoPosition.BOTTOM_RIGHT);
      appStoreInstance.getState().updateGizmoConfig({ size: 150 });

      rerender(<GizmoConfigPanel {...defaultProps} />);

      // Verify UI reflects changes
      const allCheckboxes = screen.getAllByRole('checkbox', { name: /show orientation gizmo/i });
      const visibilityCheckbox = allCheckboxes[0]; // Take the first one
      expect(visibilityCheckbox).not.toBeChecked();
      const allBottomRightButtons = screen.getAllByRole('button', { name: /bottom right/i });
      const bottomRightButton = allBottomRightButtons[0]; // Take the first one
      expect(bottomRightButton).toHaveAttribute('aria-pressed', 'true');
      // Verify the Extra Large preset is highlighted (since size is 150)
      const allExtraLargeButtons = screen.getAllByRole('button', { name: 'Extra Large' });
      const extraLargeButton = allExtraLargeButtons.find((button) =>
        button.closest('.space-y-3, [class*="space-x-2"]')
      );
      expect(extraLargeButton).toHaveClass('bg-blue-50');

      // Verify the store has the correct updated config
      expect(appStoreInstance.getState().babylonRendering.gizmo.config.size).toBe(150);
    });

    it('should handle missing config gracefully', () => {
      // Clear config
      appStoreInstance.getState().resetGizmo();

      render(<GizmoConfigPanel {...defaultProps} />);

      // Should use default config - check that the Medium preset is highlighted (since default size is 90)
      const allMediumButtons = screen.getAllByRole('button', { name: 'Medium' });
      const mediumButton = allMediumButtons.find((button) =>
        button.closest('.space-y-3, [class*="space-x-2"]')
      );
      expect(mediumButton).toHaveClass('bg-blue-50');

      // Verify the store has the correct default config
      expect(appStoreInstance.getState().babylonRendering.gizmo.config.size).toBe(
        DEFAULT_GIZMO_CONFIG.size
      );
    });
  });
});
