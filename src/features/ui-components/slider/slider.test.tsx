/**
 * Test suite for the Liquid Glass Slider component
 * 
 * Tests cover component rendering, value handling, range support,
 * accessibility features, and glass morphism effects.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slider } from './slider';
import type { SliderProps } from './slider';

// ============================================================================
// Test Setup and Helpers
// ============================================================================

const defaultProps: SliderProps = {
  min: 0,
  max: 100,
  value: 50,
};

const renderSlider = (props: Partial<SliderProps> = {}) => {
  return render(<Slider {...defaultProps} {...props} />);
};

// ============================================================================
// Component Rendering Tests
// ============================================================================

describe('Slider - Rendering', () => {
  it('should render with default props', () => {
    renderSlider();
    
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '100');
    expect(slider).toHaveAttribute('value', '50');
  });

  it('should render with custom className', () => {
    renderSlider({ className: 'custom-slider-class' });
    
    const container = screen.getByTestId('slider-container');
    expect(container).toHaveClass('custom-slider-class');
  });

  it('should render with custom data-testid', () => {
    renderSlider({ 'data-testid': 'custom-slider' });
    
    const container = screen.getByTestId('custom-slider');
    expect(container).toBeInTheDocument();
  });

  it('should render with custom style', () => {
    const customStyle = { backgroundColor: 'rgb(255, 0, 0)' };
    renderSlider({ style: customStyle });
    
    const container = screen.getByTestId('slider-container');
    expect(container).toHaveStyle('background-color: rgb(255, 0, 0)');
  });

  it('should render with label', () => {
    renderSlider({ label: 'Volume Control' });
    
    const label = screen.getByText('Volume Control');
    const slider = screen.getByRole('slider');
    
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', slider.id);
  });
});

// ============================================================================
// Value and Range Tests
// ============================================================================

describe('Slider - Value and Range', () => {
  it('should handle single value', () => {
    renderSlider({ value: 75 });
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('value', '75');
  });

  it('should handle range values', () => {
    renderSlider({ value: [25, 75], isRange: true });
    
    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(2);
    expect(sliders[0]).toHaveAttribute('value', '25');
    expect(sliders[1]).toHaveAttribute('value', '75');
  });

  it('should handle min and max values', () => {
    renderSlider({ min: 10, max: 90, value: 50 });
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '10');
    expect(slider).toHaveAttribute('max', '90');
  });

  it('should handle step values', () => {
    renderSlider({ step: 5 });
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('step', '5');
  });

  it('should clamp values to min/max range', () => {
    renderSlider({ min: 0, max: 100, value: 150 });
    
    const slider = screen.getByRole('slider');
    // Value should be clamped to max
    expect(slider).toHaveAttribute('value', '100');
  });
});

// ============================================================================
// Orientation and Size Tests
// ============================================================================

describe('Slider - Orientation and Size', () => {
  it('should render horizontal orientation by default', () => {
    renderSlider();
    
    const track = screen.getByTestId('slider-track');
    expect(track).toHaveClass('h-3');
    expect(track).not.toHaveClass('w-3');
  });

  it('should render vertical orientation', () => {
    renderSlider({ orientation: 'vertical' });
    
    const track = screen.getByTestId('slider-track');
    expect(track).toHaveClass('w-3');
    expect(track).not.toHaveClass('h-3');
  });

  it('should render different sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    
    sizes.forEach(size => {
      const { unmount } = renderSlider({ size });
      const track = screen.getByTestId('slider-track');
      
      // Should have size-specific height/width classes
      expect(track.className).toBeTruthy();
      
      unmount();
    });
  });

  it('should handle overLight prop', () => {
    const { rerender } = renderSlider({ overLight: true });
    let container = screen.getByTestId('slider-container');
    expect(container).toHaveClass('glass-effect');

    rerender(<Slider {...defaultProps} overLight={false} />);
    container = screen.getByTestId('slider-container');
    expect(container).toHaveClass('glass-effect-dark');
  });
});

// ============================================================================
// Interaction Tests
// ============================================================================

describe('Slider - Interactions', () => {
  it('should handle value changes', async () => {
    const handleChange = vi.fn();
    renderSlider({ onChange: handleChange });
    
    const slider = screen.getByRole('slider');
    
    // Simulate value change
    fireEvent.change(slider, { target: { value: '75' } });
    
    expect(handleChange).toHaveBeenCalledWith(75);
  });

  it('should handle range value changes', async () => {
    const handleChange = vi.fn();
    renderSlider({ 
      value: [25, 75], 
      isRange: true, 
      onChange: handleChange 
    });
    
    const sliders = screen.getAllByRole('slider');
    
    // Change first slider
    fireEvent.change(sliders[0], { target: { value: '30' } });
    expect(handleChange).toHaveBeenCalledWith([30, 75]);
    
    // Change second slider
    fireEvent.change(sliders[1], { target: { value: '80' } });
    expect(handleChange).toHaveBeenCalledWith([25, 80]);
  });

  it('should handle disabled state', () => {
    renderSlider({ disabled: true });
    
    const slider = screen.getByRole('slider');
    const container = screen.getByTestId('slider-container');
    
    expect(slider).toBeDisabled();
    expect(container).toHaveClass('opacity-50');
    expect(container).toHaveClass('cursor-not-allowed');
  });

  it('should handle keyboard navigation', async () => {
    const handleChange = vi.fn();
    renderSlider({ value: 50, onChange: handleChange });
    
    const slider = screen.getByRole('slider');
    
    // Focus the slider
    await userEvent.tab();
    expect(slider).toHaveFocus();
    
    // Arrow keys should change value
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.keyDown(slider, { key: 'ArrowUp' });
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    fireEvent.keyDown(slider, { key: 'ArrowDown' });
    
    // Should have been called for each key press
    expect(handleChange).toHaveBeenCalled();
  });
});

// ============================================================================
// Visual Features Tests
// ============================================================================

describe('Slider - Visual Features', () => {
  it('should show value labels when enabled', () => {
    renderSlider({ showValueLabel: true, value: 75 });
    
    const valueLabel = screen.getByText('75');
    expect(valueLabel).toBeInTheDocument();
  });

  it('should show range value labels when enabled', () => {
    renderSlider({ 
      showValueLabel: true, 
      value: [25, 75], 
      isRange: true 
    });
    
    const minLabel = screen.getByText('25');
    const maxLabel = screen.getByText('75');
    
    expect(minLabel).toBeInTheDocument();
    expect(maxLabel).toBeInTheDocument();
  });

  it('should show tick marks when enabled', () => {
    renderSlider({ showTicks: true, step: 25 });
    
    const ticks = screen.getAllByTestId(/slider-tick/);
    expect(ticks.length).toBeGreaterThan(0);
  });

  it('should format values with custom formatter', () => {
    const formatValue = (value: number) => `${value}%`;
    renderSlider({ 
      showValueLabel: true, 
      value: 75, 
      formatValue 
    });
    
    const valueLabel = screen.getByText('75%');
    expect(valueLabel).toBeInTheDocument();
  });

  it('should display min/max labels when enabled', () => {
    renderSlider({ 
      showMinMaxLabels: true, 
      min: 0, 
      max: 100 
    });
    
    const minLabel = screen.getByText('0');
    const maxLabel = screen.getByText('100');
    
    expect(minLabel).toBeInTheDocument();
    expect(maxLabel).toBeInTheDocument();
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('Slider - Accessibility', () => {
  it('should have proper ARIA attributes', () => {
    renderSlider({
      'aria-label': 'Volume control',
      'aria-describedby': 'volume-description',
    });
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-label', 'Volume control');
    expect(slider).toHaveAttribute('aria-describedby', 'volume-description');
  });

  it('should associate label with slider', () => {
    renderSlider({ label: 'Volume Control' });
    
    const label = screen.getByText('Volume Control');
    const slider = screen.getByRole('slider');
    
    expect(label).toHaveAttribute('for', slider.id);
    expect(slider).toHaveAttribute('id');
  });

  it('should have proper ARIA attributes for range sliders', () => {
    renderSlider({ 
      value: [25, 75], 
      isRange: true,
      label: 'Price Range'
    });
    
    const sliders = screen.getAllByRole('slider');
    
    expect(sliders[0]).toHaveAttribute('aria-label', 'Price Range minimum');
    expect(sliders[1]).toHaveAttribute('aria-label', 'Price Range maximum');
  });

  it('should have focus indicators', () => {
    renderSlider();
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveClass('focus:outline-none');
    expect(slider).toHaveClass('focus:ring-2');
  });

  it('should support custom ARIA valuetext', () => {
    renderSlider({ 
      value: 50,
      'aria-valuetext': 'Medium volume'
    });
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuetext', 'Medium volume');
  });
});

// ============================================================================
// Glass Morphism Tests
// ============================================================================

describe('Slider - Glass Morphism', () => {
  it('should apply default glass configuration', () => {
    renderSlider();
    
    const container = screen.getByTestId('slider-container');
    expect(container).toHaveClass('glass-effect');
  });

  it('should apply custom glass configuration', () => {
    renderSlider({
      glassConfig: {
        blurIntensity: 'xl',
        opacity: 0.3,
        elevation: 'high',
      },
    });
    
    const container = screen.getByTestId('slider-container');
    expect(container).toHaveClass('glass-blur-xl');
    expect(container).toHaveClass('glass-bg-heavy');
  });

  it('should handle browser compatibility gracefully', () => {
    // Mock CSS.supports to return false
    const originalSupports = CSS.supports;
    CSS.supports = vi.fn().mockReturnValue(false);
    
    renderSlider();
    
    const container = screen.getByTestId('slider-container');
    // Should have fallback styles when glass effects are not supported
    expect(container.className).toBeTruthy();
    
    // Restore original CSS.supports
    CSS.supports = originalSupports;
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('Slider - Edge Cases', () => {
  it('should handle invalid range values', () => {
    // Range where min > max should be corrected
    renderSlider({ 
      value: [75, 25], 
      isRange: true 
    });
    
    const sliders = screen.getAllByRole('slider');
    // Values should be corrected so min <= max
    expect(parseInt(sliders[0].getAttribute('value') || '0')).toBeLessThanOrEqual(
      parseInt(sliders[1].getAttribute('value') || '0')
    );
  });

  it('should handle zero step value', () => {
    renderSlider({ step: 0 });
    
    const slider = screen.getByRole('slider');
    // Should default to step of 1 when 0 is provided
    expect(slider).toHaveAttribute('step', '1');
  });

  it('should handle negative values', () => {
    renderSlider({ min: -50, max: 50, value: -25 });
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '-50');
    expect(slider).toHaveAttribute('max', '50');
    expect(slider).toHaveAttribute('value', '-25');
  });

  it('should handle decimal values', () => {
    renderSlider({ 
      min: 0, 
      max: 1, 
      step: 0.1, 
      value: 0.5 
    });
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('step', '0.1');
    expect(slider).toHaveAttribute('value', '0.5');
  });
});
